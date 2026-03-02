import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Activity, Wallet, ShieldAlert, TrendingDown,
    Cpu, MapPin, ArrowRight, CheckCircle2,
    CircleDollarSign, AlertTriangle, Gauge,
    Train, Sparkles, MessageCircle, Utensils,
} from 'lucide-react';
import useTripStore from '../store/tripStore';
import { supabase } from '../lib/supabase';


import BudgetOverviewPanel from './ai-control/components/BudgetOverviewPanel';
import DailyCostTable from './ai-control/components/DailyCostTable';
import DecisionRiskPanel from './ai-control/components/DecisionRiskPanel';

// ── Envelope category config (passed to panels as prop) ──────────────
const ENVELOPE_CONFIG = [
    { key: 'intercity', label: 'Intercity Travel', icon: Train, color: 'bg-blue-500', lightBg: 'bg-blue-50 dark:bg-blue-500/10', textColor: 'text-blue-600 dark:text-blue-400' },
    { key: 'accommodation', label: 'Accommodation', icon: ShieldAlert, color: 'bg-purple-500', lightBg: 'bg-purple-50 dark:bg-purple-500/10', textColor: 'text-purple-600 dark:text-purple-400' },
    { key: 'local_transport', label: 'Local Transport', icon: Activity, color: 'bg-cyan-500', lightBg: 'bg-cyan-50 dark:bg-cyan-500/10', textColor: 'text-cyan-600 dark:text-cyan-400' },
    { key: 'activity', label: 'Activities', icon: Sparkles, color: 'bg-amber-500', lightBg: 'bg-amber-50 dark:bg-amber-500/10', textColor: 'text-amber-600 dark:text-amber-400' },
    { key: 'food', label: 'Food & Dining', icon: Utensils, color: 'bg-orange-500', lightBg: 'bg-orange-50 dark:bg-orange-500/10', textColor: 'text-orange-600 dark:text-orange-400' },
    { key: 'emergency', label: 'Emergency Fund', icon: ShieldAlert, color: 'bg-red-500', lightBg: 'bg-red-50 dark:bg-red-500/10', textColor: 'text-red-600 dark:text-red-400' },
    { key: 'upgrade_pool', label: 'Upgrade Pool', icon: Sparkles, color: 'bg-pink-500', lightBg: 'bg-pink-50 dark:bg-pink-500/10', textColor: 'text-pink-600 dark:text-pink-400' },
];

// ── Icons passed to BudgetOverviewPanel (stable reference) ───────────
const STAT_ICONS = {
    wallet: Wallet,
    trendingDown: TrendingDown,
    circleDollarSign: CircleDollarSign,
    checkCircle: CheckCircle2,
    alertTriangle: AlertTriangle,
};

// ── Risk computation ─────────────────────────────────────────────────
function computeRisks(allocation, reconciliation) {
    if (!allocation || !reconciliation) return [];
    const risks = [];

    const total = allocation.total || allocation.total_budget || 0;
    const used = reconciliation.total || 0;
    const pct = total > 0 ? (used / total) * 100 : 0;

    if (pct > 100) {
        risks.push({ title: 'Budget Exceeded', description: `Spending is at ${pct.toFixed(0)}% of total budget. Consider reducing activities or increasing budget.`, severity: 'high' });
    } else if (pct > 85) {
        risks.push({ title: 'Budget Pressure', description: `${pct.toFixed(0)}% of budget used. Limited flexibility for changes.`, severity: 'medium' });
    }

    ['intercity', 'accommodation', 'local_transport', 'activity'].forEach(cat => {
        const rem = allocation[`${cat}_remaining`];
        if (rem !== undefined && rem < 0) {
            risks.push({ title: `${cat.replace('_', ' ')} Over Budget`, description: `Overspent by ${Math.abs(rem).toLocaleString()} in ${cat.replace('_', ' ')}.`, severity: 'high' });
        }
    });

    if (reconciliation.balanced === false && reconciliation.overshoot > 0) {
        risks.push({ title: 'Reconciliation Imbalance', description: `Budget overshoot of ${reconciliation.overshoot.toLocaleString()}. Re-allocation needed.`, severity: 'medium' });
    }

    return risks;
}

// ── Main Component ───────────────────────────────────────────────────
const AIControlCenter = () => {
    const { trips, currentTrip, fetchTrips, ensureSegments } = useTripStore();
    const [selectedTripId, setSelectedTripId] = useState(currentTrip || null);
    const [allocation, setAllocation] = useState(null);
    const [reconciliation, setReconciliation] = useState(null);
    const [dailySummary, setDailySummary] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Pick the selected trip object
    const trip = trips.find(t => t.id === selectedTripId) || trips[0];
    const currency = trip?.currency || 'USD';

    // Fetch trips on mount if not already loaded
    useEffect(() => {
        if (trips.length === 0) {
            fetchTrips();
        }
    }, [trips.length, fetchTrips]);

    // Auto-select first trip when trips load
    useEffect(() => {
        if (!selectedTripId && trips.length > 0) {
            setSelectedTripId(trips[0].id);
        }
    }, [trips, selectedTripId]);

    // Load allocation + reconciliation when trip changes
    useEffect(() => {
        if (!trip) {
            setAllocation(null);
            setReconciliation(null);
            setDailySummary([]);
            setIsLoading(false);
            return;
        }

        // Lazy-load segments if not yet loaded
        if (!trip._hasSegments) {
            ensureSegments(trip.id);
            return;
        }

        setIsLoading(true);

        const loadData = async () => {
            try {
                // 1. Try loading persisted allocation from trip_segments
                const { data: allocSeg } = await supabase
                    .from('trip_segments')
                    .select('metadata')
                    .eq('trip_id', trip.id)
                    .eq('type', 'allocation')
                    .maybeSingle();

                const totalBudget = trip.budget || 0;
                let finalAllocation;

                if (allocSeg?.metadata && allocSeg.metadata.total) {
                    // Use the real persisted allocation from orchestrator
                    finalAllocation = allocSeg.metadata;
                } else {
                    // Fallback for old trips: derive allocation inline
                    finalAllocation = {
                        total: totalBudget,
                        intercity: Math.round(totalBudget * 0.15),
                        accommodation: 0,
                        local_transport: Math.round(totalBudget * 0.05),
                        activity: Math.round(totalBudget * 0.65),
                        buffer: Math.round(totalBudget * 0.15),
                        intercity_remaining: Math.round(totalBudget * 0.15),
                        activity_remaining: Math.round(totalBudget * 0.65),
                    };
                }

                // 2. Flatten segments from trip.days and compute used amounts
                const allActivities = trip.days?.flatMap(d => d.activities || []) || [];
                const flatSegments = allActivities.map(a => ({
                    type: a.segmentType || 'activity',
                    estimated_cost: a.estimated_cost || 0,
                    title: a.title,
                    notes: a.notes || '',
                }));

                // If persisted allocation doesn't have _remaining computed, derive it
                const categoryMap = {
                    intercity: ['outbound_travel', 'return_travel', 'intercity_travel'],
                    activity: ['activity', 'gem'],
                };

                for (const [category, types] of Object.entries(categoryMap)) {
                    if (finalAllocation[`${category}_remaining`] === undefined && finalAllocation[category]) {
                        const used = flatSegments
                            .filter(s => types.includes(s.type))
                            .reduce((sum, s) => sum + (parseFloat(s.estimated_cost) || 0), 0);
                        finalAllocation[`${category}_remaining`] = Math.max(0, finalAllocation[category] - Math.round(used));
                    }
                }

                // 3. Reconcile
                const totalCost = flatSegments.reduce((s, seg) => s + (seg.estimated_cost || 0), 0);
                const derivedReconciliation = {
                    balanced: totalCost <= totalBudget,
                    total: Math.round(totalCost),
                    overshoot: Math.max(0, Math.round(totalCost - totalBudget)),
                    category_violations: [],
                };

                // 4. Build daily summary
                const summary = (trip.days || []).map(day => {
                    const acts = day.activities || [];
                    const activityCost = acts
                        .filter(a => a.segmentType === 'activity' || a.segmentType === 'gem' || (!a.isLogistics && !['outbound_travel', 'return_travel', 'intercity_travel', 'accommodation', 'local_transport'].includes(a.segmentType)))
                        .reduce((s, a) => s + (a.estimated_cost || 0), 0);
                    const travelCost = acts
                        .filter(a => ['outbound_travel', 'return_travel', 'intercity_travel'].includes(a.segmentType))
                        .reduce((s, a) => s + (a.estimated_cost || 0), 0);

                    return {
                        day_number: day.dayNumber,
                        location: day.location,
                        activity_cost: Math.round(activityCost),
                        travel_cost: Math.round(travelCost),
                        total_day_cost: Math.round(activityCost + travelCost),
                    };
                });

                setAllocation(finalAllocation);
                setReconciliation(derivedReconciliation);
                setDailySummary(summary);
            } catch (err) {
                console.error('[AIControlCenter] Error loading data:', err);
                setAllocation(null);
                setReconciliation(null);
                setDailySummary([]);
            }

            setIsLoading(false);
        };

        loadData();
    }, [trip?.id, trip?._hasSegments]);

    // ── Memoized derived computations ────────────────────────────────
    const logisticsTypes = ['outbound_travel', 'return_travel', 'intercity_travel'];

    const rawSegments = useMemo(() => {
        const allActivities = trip?.days?.flatMap(d => d.activities || []) || [];
        return allActivities
            .filter(a => logisticsTypes.includes(a.segmentType))
            .map(a => ({
                title: a.title,
                estimated_cost: a.estimated_cost,
                type: a.segmentType,
                metadata: {
                    transport_mode: a.transportMode,
                    from: a.location,
                    to: a.notes || '',
                    distance_tier: a.transportMode || '',
                    // estimated_cost IS already per-person (LLM outputs per-person costs)
                    per_person: a.estimated_cost || 0,
                    adjusted_for_budget: false,
                },
            }));
    }, [trip?.days, trip?.travelers]);

    const risks = useMemo(() => computeRisks(allocation, reconciliation), [allocation, reconciliation]);

    // Budget overview numbers
    const totalBudget = allocation?.total || allocation?.total_budget || trip?.budget || 0;
    const totalUsed = reconciliation?.total || 0;
    const remaining = totalBudget - totalUsed;
    const balanced = reconciliation?.balanced !== false;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] pb-20 transition-colors">
            <div className="pt-24 px-6 max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-1">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25 flex-shrink-0">
                                <Cpu className="w-6 h-6 text-white" />
                            </div>
                            <h1 className="text-3xl md:text-4xl font-display font-bold text-slate-900 dark:text-white leading-tight">
                                AI Control Center
                            </h1>
                        </div>
                        {/* Status Badges */}
                        <div className="flex items-center gap-3 text-xs font-medium">
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-slate-400">
                                <Activity className="w-3 h-3 text-emerald-500" />
                                <span>{allocation ? 'Orchestrated' : 'Idle'}</span>
                            </div>
                            {trip && (
                                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-slate-400">
                                    <MapPin className="w-3 h-3 text-blue-500" />
                                    <span>{trip.destination || 'No trip'}</span>
                                </div>
                            )}
                            {balanced && allocation && (
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>Balanced</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-base ml-[52px]">
                        Engine governance dashboard — real-time orchestration intelligence
                    </p>

                    {/* Trip Selector */}
                    {trips.length > 1 && (
                        <div className="mt-4 ml-[52px]">
                            <select
                                value={selectedTripId || ''}
                                onChange={(e) => setSelectedTripId(e.target.value)}
                                className="bg-white dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.08] rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all cursor-pointer min-w-[250px]"
                            >
                                {trips.map(t => (
                                    <option key={t.id} value={t.id}>
                                        {t.name || t.destination || 'Untitled Trip'} {t._hasSegments ? '✓' : '(no itinerary)'}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </motion.div>

                {/* Loading state */}
                {isLoading && (
                    <div className="text-center py-20">
                        <div className="w-12 h-12 rounded-full border-3 border-blue-200 border-t-blue-600 animate-spin mx-auto mb-4" />
                        <p className="text-sm text-slate-400">Loading orchestration data...</p>
                    </div>
                )}

                {/* No trip / no generated itinerary state */}
                {!isLoading && !allocation && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-20"
                    >
                        <div className="p-6 rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] max-w-md mx-auto">
                            <Gauge className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">
                                {trips.length === 0 ? 'No Trips Found' : 'No Itinerary Generated'}
                            </h3>
                            <p className="text-sm text-slate-400 mb-6">
                                {trips.length === 0
                                    ? 'Create a trip first, then generate an itinerary.'
                                    : `Trip "${trip?.name || trip?.destination || 'Selected trip'}" doesn't have a generated itinerary yet.`
                                }
                            </p>
                            <Link
                                to="/itinerary"
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
                            >
                                Go to My Trips <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </motion.div>
                )}

                {!isLoading && allocation && (
                    <div className="space-y-8">
                        <BudgetOverviewPanel
                            allocation={allocation}
                            reconciliation={reconciliation}
                            currency={currency}
                            envelopeCategories={ENVELOPE_CONFIG}
                            totalBudget={totalBudget}
                            totalUsed={totalUsed}
                            remaining={remaining}
                            balanced={balanced}
                            statIcons={STAT_ICONS}
                        />

                        <DailyCostTable dailySummary={dailySummary} />

                        <DecisionRiskPanel
                            rawSegments={rawSegments}
                            risks={risks}
                        />

                        {/* Quick Links to AI Tools */}
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                        >
                            <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 border-l-2 border-slate-400 pl-3">
                                AI Tools
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {[
                                    { to: '/ai/chat', icon: MessageCircle, label: 'AI Chat', color: 'from-blue-500 to-blue-600' },
                                    { to: '/ai/translate', icon: Sparkles, label: 'Translate', color: 'from-indigo-500 to-indigo-600' },
                                    { to: '/ai/emergency', icon: ShieldAlert, label: 'Emergency', color: 'from-red-500 to-red-600' },
                                    { to: '/ai/food', icon: Utensils, label: 'Food', color: 'from-amber-500 to-amber-600' },
                                ].map(tool => (
                                    <Link
                                        key={tool.to}
                                        to={tool.to}
                                        className="group flex items-center gap-3 p-4 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-xl hover:shadow-lg transition-all hover:-translate-y-0.5"
                                    >
                                        <div className={`p-2 rounded-lg bg-gradient-to-br ${tool.color}`}>
                                            <tool.icon className="w-4 h-4 text-white" />
                                        </div>
                                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{tool.label}</span>
                                        <ArrowRight className="w-3.5 h-3.5 ml-auto text-slate-300 group-hover:text-blue-500 transition-colors" />
                                    </Link>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AIControlCenter;
