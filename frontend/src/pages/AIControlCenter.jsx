import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity, Wallet, ShieldAlert, TrendingUp, TrendingDown,
    CheckCircle2, AlertTriangle, Info, ChevronDown, ChevronRight,
    Cpu, BarChart3, PieChart, ArrowRight, Sparkles, MessageCircle,
    Bot, Train, Plane, Bus, Car, Hotel, MapPin, Utensils,
    CircleDollarSign, Layers, Shield, Gauge, Zap
} from 'lucide-react';
import useItineraryStore from '../store/itineraryStore';

// ── Envelope category config ─────────────────────────────────────────
const ENVELOPE_CONFIG = [
    { key: 'intercity', label: 'Intercity Travel', icon: Train, color: 'bg-blue-500', lightBg: 'bg-blue-50 dark:bg-blue-500/10', textColor: 'text-blue-600 dark:text-blue-400' },
    { key: 'accommodation', label: 'Accommodation', icon: Hotel, color: 'bg-purple-500', lightBg: 'bg-purple-50 dark:bg-purple-500/10', textColor: 'text-purple-600 dark:text-purple-400' },
    { key: 'activity', label: 'Activities', icon: MapPin, color: 'bg-emerald-500', lightBg: 'bg-emerald-50 dark:bg-emerald-500/10', textColor: 'text-emerald-600 dark:text-emerald-400' },
    { key: 'local_transport', label: 'Local Transport', icon: Car, color: 'bg-amber-500', lightBg: 'bg-amber-50 dark:bg-amber-500/10', textColor: 'text-amber-600 dark:text-amber-400' },
    { key: 'buffer', label: 'Buffer', icon: Shield, color: 'bg-slate-500', lightBg: 'bg-slate-50 dark:bg-slate-500/10', textColor: 'text-slate-600 dark:text-slate-400' },
    { key: 'upgrade_pool', label: 'Upgrade Pool', icon: Sparkles, color: 'bg-pink-500', lightBg: 'bg-pink-50 dark:bg-pink-500/10', textColor: 'text-pink-600 dark:text-pink-400' },
];

// ── Risk computation ─────────────────────────────────────────────────
function computeRisks(allocation, reconciliation) {
    const risks = [];
    if (!allocation) return risks;

    const total = allocation.total_budget || 1;

    // Buffer < 5%
    const bufferPct = (allocation.buffer || 0) / total * 100;
    if (bufferPct < 5) {
        risks.push({ level: 'warning', message: `Buffer is only ${bufferPct.toFixed(1)}% of total budget`, icon: ShieldAlert });
    }

    // Any envelope remaining < 10%
    for (const env of ENVELOPE_CONFIG) {
        if (env.key === 'buffer' || env.key === 'upgrade_pool') continue;
        const allocated = allocation[env.key] || 0;
        const remaining = allocation[`${env.key}_remaining`];
        if (remaining !== undefined && allocated > 0) {
            const pct = (remaining / allocated) * 100;
            if (pct < 10) {
                risks.push({ level: 'warning', message: `${env.label} envelope nearly exhausted (${pct.toFixed(0)}% left)`, icon: AlertTriangle });
            }
        }
    }

    // Upgrade pool unused in luxury mode
    if (allocation._meta?.budgetTier === 'luxury' && allocation.upgrade_pool > 0) {
        risks.push({ level: 'info', message: `Upgrade pool of ${allocation.upgrade_pool} available — consider premium experiences`, icon: Sparkles });
    }

    // Reconciliation issues
    if (reconciliation && !reconciliation.balanced) {
        risks.push({ level: 'critical', message: `Budget overshoot: ${reconciliation.overshoot} over limit`, icon: TrendingUp });
        (reconciliation.category_violations || []).forEach(v => {
            risks.push({ level: 'warning', message: `${v.category} exceeded by ${v.overshoot}`, icon: AlertTriangle });
        });
    }

    return risks;
}

// ── Stat Card ────────────────────────────────────────────────────────
const StatCard = ({ label, value, icon: Icon, color, subtext }) => (
    <div className="bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-5 flex items-start gap-4">
        <div className={`p-3 rounded-xl ${color}`}>
            <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
            <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-0.5">{label}</p>
            {subtext && <p className="text-[10px] text-slate-400 mt-1">{subtext}</p>}
        </div>
    </div>
);

// ── Envelope Bar ─────────────────────────────────────────────────────
const EnvelopeBar = ({ config, allocated, remaining, currency }) => {
    const used = allocated - (remaining ?? allocated);
    const pct = allocated > 0 ? Math.round((used / allocated) * 100) : 0;
    const Icon = config.icon;

    return (
        <div className="flex items-center gap-4 py-3">
            <div className={`p-2.5 rounded-xl ${config.lightBg} shrink-0`}>
                <Icon className={`w-4 h-4 ${config.textColor}`} />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{config.label}</span>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        {used.toLocaleString()} / {allocated.toLocaleString()} {currency}
                    </span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
                    <motion.div
                        className={`h-full rounded-full ${config.color}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(pct, 100)}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                </div>
                <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-slate-400">{pct}% used</span>
                    <span className="text-[10px] text-slate-400">{(remaining ?? allocated).toLocaleString()} remaining</span>
                </div>
            </div>
        </div>
    );
};

// ── Risk Item ────────────────────────────────────────────────────────
const RiskItem = ({ risk }) => {
    const Icon = risk.icon;
    const colors = {
        critical: 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400',
        warning: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400',
        info: 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-400',
    };
    const iconColors = {
        critical: 'text-red-500',
        warning: 'text-amber-500',
        info: 'text-blue-500',
    };

    return (
        <div className={`flex items-start gap-3 p-3.5 rounded-xl border ${colors[risk.level]}`}>
            <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${iconColors[risk.level]}`} />
            <span className="text-sm font-medium">{risk.message}</span>
        </div>
    );
};

// ── Decision Log Card ────────────────────────────────────────────────
const DecisionCard = ({ segment }) => {
    const [expanded, setExpanded] = useState(false);
    const meta = segment.metadata || {};
    const dm = meta.decision_meta || {};
    const modeIcons = { flight: Plane, train: Train, bus: Bus, car: Car };
    const ModeIcon = modeIcons[meta.transport_mode] || Train;

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-xl overflow-hidden"
        >
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
            >
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-500/10">
                    <ModeIcon className="w-4 h-4 text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{segment.title}</p>
                    <p className="text-xs text-slate-400">{meta.distance_tier} · {meta.transport_mode}</p>
                </div>
                <span className="text-xs font-bold text-slate-500">{(segment.estimated_cost || 0).toLocaleString()}</span>
                {expanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
            </button>

            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-slate-100 dark:border-white/[0.06]"
                    >
                        <div className="p-4 grid grid-cols-2 gap-3 text-xs">
                            <div><span className="text-slate-400">From:</span> <span className="font-medium text-slate-700 dark:text-slate-300">{meta.from}</span></div>
                            <div><span className="text-slate-400">To:</span> <span className="font-medium text-slate-700 dark:text-slate-300">{meta.to}</span></div>
                            <div><span className="text-slate-400">Distance:</span> <span className="font-medium text-slate-700 dark:text-slate-300">{meta.distance_tier}</span></div>
                            <div><span className="text-slate-400">Mode:</span> <span className="font-medium text-slate-700 dark:text-slate-300">{meta.transport_mode}</span></div>
                            <div><span className="text-slate-400">Per Person:</span> <span className="font-medium text-slate-700 dark:text-slate-300">{meta.per_person}</span></div>
                            {meta.adjusted_for_budget && (
                                <div className="col-span-2 flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                                    <AlertTriangle className="w-3 h-3" />
                                    <span className="font-medium">Downgraded to fit budget</span>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

// ── Main Component ───────────────────────────────────────────────────
const AIControlCenter = () => {
    const { trips, currentTrip, fetchTrips } = useItineraryStore();
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

    // Re-derive allocation + reconciliation when trip changes
    useEffect(() => {
        if (!trip || !trip._hasSegments) {
            setAllocation(null);
            setReconciliation(null);
            setDailySummary([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);

        try {
            // 1. Re-derive allocation from trip params (deterministic)
            const totalDays = trip.days?.length || 1;
            const totalNights = Math.max(0, totalDays - 1);
            const budgetTier = trip.accommodation_preference || 'mid-range';

            const derivedAllocation = useItineraryStore.getState().deriveAllocation(trip);

            // 2. Flatten segments from trip.days to compute reconciliation
            const allActivities = trip.days?.flatMap(d => d.activities || []) || [];
            const flatSegments = allActivities.map(a => ({
                type: a.segmentType || 'activity',
                estimated_cost: a.estimated_cost || 0,
                title: a.title,
                day_number: 0,
                metadata: {
                    transport_mode: a.transportMode,
                },
            }));

            // Deduct used amounts from remaining envelopes
            const categoryMap = {
                intercity: ['outbound_travel', 'return_travel', 'intercity_travel'],
                accommodation: ['accommodation'],
                local_transport: ['local_transport'],
                activity: ['activity', 'gem'],
            };

            for (const [category, types] of Object.entries(categoryMap)) {
                const used = flatSegments
                    .filter(s => types.includes(s.type))
                    .reduce((sum, s) => sum + (parseFloat(s.estimated_cost) || 0), 0);
                if (derivedAllocation[`${category}_remaining`] !== undefined) {
                    derivedAllocation[`${category}_remaining`] = Math.max(0, derivedAllocation[category] - Math.round(used));
                }
            }

            // 3. Reconcile
            const derivedReconciliation = useItineraryStore.getState().deriveReconciliation(derivedAllocation, flatSegments);

            // 4. Build daily summary from days
            const summary = (trip.days || []).map(day => {
                const acts = day.activities || [];
                const activityCost = acts
                    .filter(a => a.segmentType === 'activity' || a.segmentType === 'gem' || (!a.isLogistics && !['outbound_travel', 'return_travel', 'intercity_travel', 'accommodation', 'local_transport'].includes(a.segmentType)))
                    .reduce((s, a) => s + (a.estimated_cost || 0), 0);
                const travelCost = acts
                    .filter(a => ['outbound_travel', 'return_travel', 'intercity_travel'].includes(a.segmentType))
                    .reduce((s, a) => s + (a.estimated_cost || 0), 0);
                const stayCost = acts
                    .filter(a => a.segmentType === 'accommodation')
                    .reduce((s, a) => s + (a.estimated_cost || 0), 0);
                const localCost = acts
                    .filter(a => a.segmentType === 'local_transport')
                    .reduce((s, a) => s + (a.estimated_cost || 0), 0);

                return {
                    day_number: day.dayNumber,
                    location: day.location,
                    activity_cost: Math.round(activityCost),
                    travel_cost: Math.round(travelCost),
                    stay_cost: Math.round(stayCost),
                    local_transport_cost: Math.round(localCost),
                    total_day_cost: Math.round(activityCost + travelCost + stayCost + localCost),
                };
            });

            setAllocation(derivedAllocation);
            setReconciliation(derivedReconciliation);
            setDailySummary(summary);
        } catch (err) {
            console.error('[AIControlCenter] Error deriving data:', err);
            setAllocation(null);
            setReconciliation(null);
            setDailySummary([]);
        }

        setIsLoading(false);
    }, [trip?.id, trip?._hasSegments]);

    // Gather transport segments for decision logs from trip.days
    const logisticsTypes = ['outbound_travel', 'return_travel', 'intercity_travel'];
    const allActivities = trip?.days?.flatMap(d => d.activities || []) || [];
    const rawSegments = allActivities
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
                per_person: a.estimated_cost ? Math.round(a.estimated_cost / (trip?.travelers || 1)) : 0,
                adjusted_for_budget: false,
            }
        }));

    // Compute risks
    const risks = computeRisks(allocation, reconciliation);

    // Budget overview numbers
    const totalBudget = allocation?.total_budget || trip?.budget || 0;
    const totalUsed = reconciliation?.total || 0;
    const remaining = totalBudget - totalUsed;
    const balanced = reconciliation?.balanced !== false;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] pb-20 transition-colors">
            {/* Status Strip */}
            <div className="w-full bg-slate-900 dark:bg-black border-b border-slate-800 dark:border-white/[0.06] py-1.5 px-6">
                <div className="max-w-7xl mx-auto flex items-center justify-between text-[11px] font-medium text-slate-400">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <Activity className="w-3 h-3 text-emerald-400" />
                            <span className="text-slate-300">Engine Status: {allocation ? 'Orchestrated' : 'Idle'}</span>
                        </div>
                        {trip && (
                            <div className="hidden sm:flex items-center gap-2">
                                <MapPin className="w-3 h-3 text-blue-400" />
                                <span>{trip.destination || 'No trip selected'}</span>
                            </div>
                        )}
                    </div>
                    {balanced && allocation && (
                        <div className="flex items-center gap-1.5 text-emerald-400">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Budget Balanced</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="pt-10 px-6 max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-10"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25">
                            <Cpu className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-display font-bold text-slate-900 dark:text-white">
                            AI Control Center
                        </h1>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-lg ml-[52px]">
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
                        {/* Budget Overview Stats */}
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 border-l-2 border-blue-500 pl-3">
                                Budget Overview
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <StatCard
                                    label="Total Budget"
                                    value={`${totalBudget.toLocaleString()} ${currency}`}
                                    icon={Wallet}
                                    color="bg-blue-600"
                                    subtext={allocation._meta?.budgetTier ? `${allocation._meta.budgetTier} tier` : null}
                                />
                                <StatCard
                                    label="Total Used"
                                    value={`${totalUsed.toLocaleString()} ${currency}`}
                                    icon={TrendingDown}
                                    color="bg-emerald-600"
                                />
                                <StatCard
                                    label="Remaining"
                                    value={`${remaining.toLocaleString()} ${currency}`}
                                    icon={CircleDollarSign}
                                    color={remaining < 0 ? 'bg-red-600' : 'bg-violet-600'}
                                />
                                <StatCard
                                    label="Status"
                                    value={balanced ? 'Balanced ✓' : `Overshoot: ${reconciliation?.overshoot || 0}`}
                                    icon={balanced ? CheckCircle2 : AlertTriangle}
                                    color={balanced ? 'bg-emerald-600' : 'bg-red-600'}
                                    subtext={`${allocation._meta?.totalDays || 0} days · ${allocation._meta?.travelers || 1} travelers`}
                                />
                            </div>
                        </motion.div>

                        {/* Envelope Breakdown */}
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 border-l-2 border-emerald-500 pl-3">
                                Budget Envelopes
                            </h2>
                            <div className="bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-6">
                                <div className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                                    {ENVELOPE_CONFIG.map(config => {
                                        const allocated = allocation[config.key];
                                        if (allocated === undefined || allocated === 0) return null;
                                        const remaining = allocation[`${config.key}_remaining`];
                                        return (
                                            <EnvelopeBar
                                                key={config.key}
                                                config={config}
                                                allocated={allocated}
                                                remaining={remaining}
                                                currency={currency}
                                            />
                                        );
                                    })}
                                </div>

                                {/* Allocation Ratios */}
                                {allocation._meta?.ratios && (
                                    <div className="mt-5 pt-4 border-t border-slate-100 dark:border-white/[0.06]">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Allocation Ratios</p>
                                        <div className="flex flex-wrap gap-2">
                                            {Object.entries(allocation._meta.ratios).map(([key, val]) => (
                                                <span key={key} className="px-2 py-1 bg-slate-50 dark:bg-white/[0.04] rounded-md text-[10px] font-medium text-slate-500">
                                                    {key}: {(val * 100).toFixed(0)}%
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {/* Daily Cost Summary */}
                        {dailySummary.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 border-l-2 border-violet-500 pl-3">
                                    Daily Cost Breakdown
                                </h2>
                                <div className="bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-2xl overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="bg-slate-50 dark:bg-white/[0.02]">
                                                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase">Day</th>
                                                    <th className="text-right px-4 py-3 text-xs font-bold text-slate-400 uppercase">Activities</th>
                                                    <th className="text-right px-4 py-3 text-xs font-bold text-slate-400 uppercase">Travel</th>
                                                    <th className="text-right px-4 py-3 text-xs font-bold text-slate-400 uppercase">Stay</th>
                                                    <th className="text-right px-4 py-3 text-xs font-bold text-slate-400 uppercase">Local</th>
                                                    <th className="text-right px-4 py-3 text-xs font-bold text-emerald-500 uppercase">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                                                {dailySummary.map(day => (
                                                    <tr key={day.day_number} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                                                        <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Day {day.day_number}</td>
                                                        <td className="px-4 py-3 text-right text-slate-500">{day.activity_cost.toLocaleString()}</td>
                                                        <td className="px-4 py-3 text-right text-slate-500">{day.travel_cost.toLocaleString()}</td>
                                                        <td className="px-4 py-3 text-right text-slate-500">{day.stay_cost.toLocaleString()}</td>
                                                        <td className="px-4 py-3 text-right text-slate-500">{day.local_transport_cost.toLocaleString()}</td>
                                                        <td className="px-4 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                                                            {day.total_day_cost.toLocaleString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Decision Logs */}
                        {rawSegments.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.35 }}
                            >
                                <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 border-l-2 border-orange-500 pl-3">
                                    Transport Decision Logs
                                </h2>
                                <div className="space-y-3">
                                    {rawSegments.map((seg, i) => (
                                        <DecisionCard key={i} segment={seg} />
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Risk Monitor */}
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 border-l-2 border-red-500 pl-3">
                                Risk Monitor
                            </h2>
                            {risks.length > 0 ? (
                                <div className="space-y-3">
                                    {risks.map((r, i) => <RiskItem key={i} risk={r} />)}
                                </div>
                            ) : (
                                <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl p-4 flex items-center gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                    <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">All systems nominal — no budget risks detected</span>
                                </div>
                            )}
                        </motion.div>

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
