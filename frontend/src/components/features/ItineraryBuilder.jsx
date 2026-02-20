import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, Reorder, AnimatePresence } from 'framer-motion';
import {
    Calendar, MapPin, Clock, Plus, ArrowLeft,
    GripVertical, Trash2, Save, Share2,
    Coffee, Camera, Utensils, Bed, Wallet,
    Landmark, Music, Sparkles, Map as MapIcon, Loader2,
    CheckCircle2, Circle, AlertCircle, AlertTriangle,
    Plane, Train, Bus, Car, Bike, Hotel, Sun,
} from 'lucide-react';
import useTripStore from '../../store/tripStore';
import useItineraryStore from '../../store/itineraryStore';
import useBudgetStore from '../../store/budgetStore';
import BudgetHealthBadge from '../ui/BudgetHealthBadge';
import { getCurrencyForDestination, getCurrencySymbol } from '../../utils/currencyMap';
import MapContainer from '../map/MapContainer';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';

// ── Sub-components (extracted from this monolith) ──
import SegmentCard from './itinerary/SegmentCard';
import DayExpenseSummary from './itinerary/DayExpenseSummary';
import AllocationBreakdown from './itinerary/AllocationBreakdown';
import HiddenGemsPanel from './itinerary/HiddenGemsPanel';
import BudgetTab from './itinerary/BudgetTab';

const ACTIVITY_TYPES = [
    { value: 'sightseeing', label: 'Sightseeing', icon: Camera, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' },
    { value: 'food', label: 'Food & Drink', icon: Utensils, color: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20' },
    { value: 'relax', label: 'Relaxation', icon: Coffee, color: 'text-green-500 bg-green-50 dark:bg-green-900/20' },
    { value: 'culture', label: 'Culture', icon: Landmark, color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20' },
    { value: 'activity', label: 'Activity', icon: Sun, color: 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' },
    { value: 'accommodation', label: 'Stay', icon: Hotel, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' },
    // Logistics types (injected by Transport Engine)
    { value: 'outbound_travel', label: 'Travel', icon: Plane, color: 'text-teal-500 bg-teal-50 dark:bg-teal-900/20' },
    { value: 'intercity_travel', label: 'Intercity', icon: Plane, color: 'text-teal-500 bg-teal-50 dark:bg-teal-900/20' },
    { value: 'return_travel', label: 'Return', icon: Plane, color: 'text-teal-500 bg-teal-50 dark:bg-teal-900/20' },
    { value: 'local_transport', label: 'Local Transport', icon: Bus, color: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-900/20' },
];

const ItineraryBuilder = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const {
        trips,
        fetchTrips,
        isLoading: _isLoading,
        updateTrip,
        addActivity,
        batchAddActivities: _batchAddActivities,
        reorderActivities,
        persistReorder,
        deleteActivity,
        toggleActivityComplete,
        updateActivityTime: _updateActivityTime,
        ensureSegments,
    } = useTripStore();
    const {
        generateFullItinerary,
        orchestrationPhase,
        allocation: storeAllocation,
        dailySummary: storeDailySummary,
        bookingOptions: storeBookingOptions,
        hiddenGems: storeHiddenGems,
        fetchHiddenGems,
        validateBudget,
    } = useItineraryStore();
    const { syncAiEstimates, fetchBudgetSummary, budgetSummary, setTripBudget, deleteCostEventForActivity } = useBudgetStore();

    const [trip, setTrip] = useState(null);
    const [selectedDay, setSelectedDay] = useState(null);
    const [isAddingActivity, setIsAddingActivity] = useState(false);
    const [activeTab, setActiveTab] = useState('itinerary'); // 'itinerary' | 'budget'

    const [newActivity, setNewActivity] = useState({
        title: '',
        time: '',
        location: '',
        type: 'sightseeing',
        notes: ''
    });

    // AI & Features State
    const [isGenerating, setIsGenerating] = useState(false);
    const [hiddenGems, setHiddenGems] = useState([]);
    const [isLoadingGems, setIsLoadingGems] = useState(false);
    const [toast, setToast] = useState(null);
    const [hasFetched, setHasFetched] = useState(false);
    const [addedGemTitles, setAddedGemTitles] = useState(new Set());
    const [gemTimePickerFor, setGemTimePickerFor] = useState(null); // gem awaiting time selection
    const [gemTime, setGemTime] = useState('10:00');

    // Unsaved changes tracking
    const [isDirty, setIsDirty] = useState(false);
    const [showLeaveDialog, setShowLeaveDialog] = useState(false);
    const activitiesSnapshot = useRef(null);

    // Map focus
    const [focusedActivityId, setFocusedActivityId] = useState(null);

    // Budget Analysis State
    const [budgetInput, setBudgetInput] = useState('');
    const [currencyInput, setCurrencyInput] = useState(''); // Will be auto-detected
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiInsights, setAiInsights] = useState(null); // Structured JSON from AI
    const [aiCostSummary, setAiCostSummary] = useState(null); // Itinerary tab cost badge

    // Fetch trips from Supabase on mount (needed for page refresh)
    useEffect(() => {
        if (trips.length === 0 && !hasFetched) {
            fetchTrips().finally(() => setHasFetched(true));
        } else if (trips.length > 0) {
            setHasFetched(true);
        }
    }, [trips.length, fetchTrips, hasFetched]);

    // Snapshot activities on first load for discard capability
    useEffect(() => {
        if (trip?.days && !activitiesSnapshot.current) {
            activitiesSnapshot.current = JSON.parse(JSON.stringify(trip.days.map(d => ({ id: d.id, activities: d.activities }))));
        }
    }, [trip?.days]);

    // Sync trip from store whenever trips change
    useEffect(() => {
        const foundTrip = trips.find(t => t.id === id);
        if (foundTrip) {
            setTrip(foundTrip);
            // Auto-migrate legacy JSONB days to trip_segments
            ensureSegments(foundTrip.id);
            if (!selectedDay) setSelectedDay(foundTrip.days[0]?.id);

            // Load gems from store if orchestrator populated them, else fetch separately
            if (storeHiddenGems.length === 0 && hiddenGems.length === 0 && !isLoadingGems) {
                setIsLoadingGems(true);
                fetchHiddenGems(foundTrip.destination, {
                    budgetTier: foundTrip.accommodation_preference || 'mid-range',
                    travelStyle: foundTrip.travel_style || '',
                    currency: foundTrip.currency || 'USD',
                })
                    .then(gems => setHiddenGems(gems || []))
                    .catch(err => console.error('[HiddenGems] Fetch failed:', err))
                    .finally(() => setIsLoadingGems(false));
            }

            // AUTO-SWITCH TO BUDGET TAB if missing (Only once per browser session per trip)
            const budgetCheckedKey = `budget_checked_${foundTrip.id}`;
            if (!sessionStorage.getItem(budgetCheckedKey) && (foundTrip.budget === 0 || foundTrip.budget === null) && !foundTrip.budget_skipped) {
                setActiveTab('budget');
                sessionStorage.setItem(budgetCheckedKey, 'true');
            }

            // Auto-detect currency or use saved trip currency
            if (!currencyInput || currencyInput === '') {
                const savedCurrency = foundTrip.currency && foundTrip.currency !== 'USD' ? foundTrip.currency : getCurrencyForDestination(foundTrip.destination);
                setCurrencyInput(savedCurrency);
            }

            // Populate budget input from saved trip data
            if (!budgetInput && foundTrip.budget && foundTrip.budget > 0) {
                setBudgetInput(String(foundTrip.budget));
            }
        } else if (hasFetched) {
            // Only navigate away AFTER fetch has completed and trip truly doesn't exist
            navigate('/itinerary');
        }
    }, [id, trips, hasFetched]);

    // Fetch budget health for the current trip
    useEffect(() => {
        if (trip?.id) {
            fetchBudgetSummary(trip.id);
        }
    }, [trip?.id, fetchBudgetSummary]);

    const showToast = (message) => {
        setToast(message);
        setTimeout(() => setToast(null), 3000);
    };

    const handleSave = () => {
        showToast("✅ Trip saved successfully!");
    };

    const handleShare = async () => {
        const shareData = {
            title: `Trip to ${trip.destination}`,
            text: `Check out my trip to ${trip.destination}!`,
            url: window.location.href
        };
        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
                showToast("🔗 Link copied!");
            }
        } catch (err) {
            console.error("Error sharing:", err);
        }
    };

    // Memoize currency derivation
    const activeCurrency = useMemo(() => getCurrencyForDestination(trip?.destination), [trip?.destination]);
    const activeCurrencySymbol = useMemo(() => getCurrencySymbol(trip?.currency || activeCurrency), [trip?.currency, activeCurrency]);

    const handleGenerateItinerary = async () => {
        if (!trip) return;
        setIsGenerating(true);
        try {
            // ── New: Full lifecycle orchestration (10 phases) ──
            const result = await generateFullItinerary(trip.id);

            if (result) {
                showToast("✨ Itinerary generated via orchestrator!");

                // Sync AI estimated costs to cost_events table
                setTimeout(async () => {
                    const updatedTrips = useTripStore.getState().trips;
                    const updatedTrip = updatedTrips.find(t => t.id === trip.id);
                    if (updatedTrip?.days) {
                        await syncAiEstimates(trip.id, updatedTrip.days, trip.currency || activeCurrency);
                        await fetchBudgetSummary(trip.id);
                        const summary = useBudgetStore.getState().budgetSummary;
                        if (summary) {
                            const forecast = (summary.total_spent || 0) + (summary.ai_estimated_total || 0);
                            const budget = summary.total_budget || 0;
                            setAiCostSummary({
                                aiTotal: summary.ai_estimated_total || 0,
                                forecast,
                                budget,
                                fits: budget > 0 ? forecast <= budget : true
                            });
                            if (budget > 0 && forecast > budget) {
                                showToast(`⚠️ AI estimates exceed budget by ${activeCurrencySymbol}${(forecast - budget).toLocaleString()}`);
                            } else {
                                showToast('✅ Itinerary fits within budget');
                            }
                        }
                        await updateTrip(trip.id, {
                            generated_with_budget: trip.budget,
                            generated_with_currency: trip.currency || activeCurrency,
                            itinerary_generated_at: new Date().toISOString(),
                            itinerary_stale: false
                        });
                    }
                }, 500);
            }
        } catch (error) {
            console.error("Orchestration failed", error);
            showToast("❌ Failed to generate itinerary.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleAddGemToPlan = (gem) => {
        if (!trip || !selectedDay) {
            showToast('⚠️ Select a day first');
            return;
        }
        // Open time picker for this gem
        const defaultTime = gem.best_time === 'Evening' ? '18:00' : gem.best_time === 'Afternoon' ? '14:00' : '10:00';
        setGemTime(defaultTime);
        setGemTimePickerFor(gem);
    };

    const confirmAddGem = async () => {
        const gem = gemTimePickerFor;
        if (!gem || !trip || !selectedDay) return;
        setGemTimePickerFor(null);
        try {
            await addActivity(trip.id, selectedDay, {
                title: gem.title,
                location: gem.location || trip.destination,
                time: gemTime,
                type: gem.category?.toLowerCase() || 'sightseeing',
                notes: gem.description || '',
                estimated_cost: gem.estimated_cost || 0,
                segmentType: 'activity',
            });
            setAddedGemTitles(prev => new Set([...prev, gem.title]));
            showToast(`✅ Added "${gem.title}" to Day ${selectedDay.replace('day-', '')} at ${gemTime}`);
        } catch (err) {
            showToast(`❌ ${err.message || 'Could not add gem'}`);
        }
    };

    const handleAddActivity = (e) => {
        e.preventDefault();
        if (!newActivity.title || !newActivity.time) return;
        addActivity(trip.id, selectedDay, newActivity);
        setIsAddingActivity(false);
        setNewActivity({ title: '', time: '', location: '', type: 'sightseeing', notes: '' });
        showToast("Activity added!");
    };

    const _handleAddGem = async (gem) => {
        if (!selectedDay) return;
        try {
            await addActivity(trip.id, selectedDay, {
                title: gem.title,
                time: '14:00',
                type: 'sightseeing',
                segmentType: 'gem', // Rule 7: Insert as 'gem', not 'activity'
                location: trip.destination,
                notes: gem.description,
                estimated_cost: gem.estimated_cost || 0, // Rule 7: Preserve gem cost
            });
            showToast(`✨ Added ${gem.title}!`);
        } catch (err) {
            // Rule 5: Surface strict budget errors
            showToast(`❌ ${err.message}`);
        }
    };

    const handleAnalyzeBudget = async () => {
        if (!budgetInput) return;
        setIsAnalyzing(true);
        try {
            // Refresh RPC data first
            await fetchBudgetSummary(trip.id);
            const freshSummary = useBudgetStore.getState().budgetSummary;
            const result = await validateBudget(
                { destination: trip.destination, days: trip.days.length, travelers: trip.travelers, budget: parseFloat(budgetInput), currency: currencyInput },
                freshSummary
            );
            setAiInsights(result.insights);
        } catch (error) {
            showToast(`❌ Analysis failed: ${error.message}`);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSaveBudget = async () => {
        if (!budgetInput) return;
        const budgetVal = parseFloat(budgetInput);
        // Optimistically update local trip state immediately
        setTrip(prev => ({ ...prev, budget: budgetVal, currency: currencyInput, budget_skipped: false }));
        try {
            // Use RPC-based budget update (atomic stale detection)
            await setTripBudget(trip.id, budgetVal);
            // Also persist currency + budget_skipped
            await updateTrip(trip.id, { currency: currencyInput, budget_skipped: false });
            // Re-fetch to pick up itinerary_stale flag
            await fetchTrips();
            // Sync local trip state from store (important for itinerary_stale)
            const refreshed = useTripStore.getState().trips.find(t => t.id === trip.id);
            if (refreshed) setTrip(refreshed);
            showToast("✅ Budget saved!");
        } catch (err) {
            console.error('Budget save failed:', err);
            showToast("❌ Budget save failed. Check console.");
        }
    };

    // Delete activity + its cost_event, then refresh budget
    const handleDeleteActivity = async (tripId, dayId, activityId) => {
        await deleteActivity(tripId, dayId, activityId);
        await deleteCostEventForActivity(tripId, activityId);
        setIsDirty(true);
        // Update AI cost summary if it's visible
        const summary = useBudgetStore.getState().budgetSummary;
        if (summary && aiCostSummary) {
            const forecast = (summary.total_spent || 0) + (summary.ai_estimated_total || 0);
            const budget = summary.total_budget || 0;
            setAiCostSummary({
                aiTotal: summary.ai_estimated_total || 0,
                forecast,
                budget,
                fits: budget > 0 ? forecast <= budget : true
            });
        }
    };

    // Back navigation with unsaved changes guard
    const handleBack = () => {
        if (isDirty) {
            setShowLeaveDialog(true);
        } else {
            navigate('/itinerary');
        }
    };

    const handleSaveAndLeave = async () => {
        try {
            await persistReorder(trip.id);
            showToast('✅ Changes saved!');
            setTimeout(() => navigate('/itinerary'), 400);
        } catch (err) {
            showToast('❌ Failed to save changes');
        }
    };

    const handleDiscardAndLeave = async () => {
        setShowLeaveDialog(false);
        setIsDirty(false);
        // Re-fetch from DB to revert any local changes
        await fetchTrips();
        navigate('/itinerary');
    };

    // Memoize derived trip data
    const activeDay = useMemo(() => trip?.days?.find(d => d.id === selectedDay), [trip?.days, selectedDay]);
    const _allActivities = useMemo(() => trip?.days?.flatMap(d => d.activities) || [], [trip?.days]);

    if (!trip) return null;

    return (
        <div className="fixed inset-0 z-50 bg-background overflow-hidden flex flex-col">
            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="fixed top-24 right-4 z-[70] bg-foreground text-background px-6 py-3 rounded-xl shadow-lg font-medium">{toast}</motion.div>
                )}
            </AnimatePresence>

            {/* Gem Time Picker Modal */}
            <AnimatePresence>
                {gemTimePickerFor && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 backdrop-blur-sm"
                        onClick={() => setGemTimePickerFor(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="bg-background rounded-2xl shadow-2xl p-6 w-[320px] space-y-4 border border-border"
                            onClick={e => e.stopPropagation()}
                        >
                            <h3 className="text-lg font-semibold text-foreground">Schedule Activity</h3>
                            <p className="text-sm text-muted-foreground">Adding <strong>{gemTimePickerFor.title}</strong> to Day {selectedDay?.replace('day-', '')}</p>
                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1 block">Select Time</label>
                                <input
                                    type="time"
                                    value={gemTime}
                                    onChange={e => setGemTime(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-border bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                                />
                            </div>
                            <div className="flex gap-2 pt-1">
                                <button
                                    onClick={() => setGemTimePickerFor(null)}
                                    className="flex-1 px-4 py-2 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
                                >Cancel</button>
                                <button
                                    onClick={confirmAddGem}
                                    className="flex-1 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
                                >Add to Plan</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Leave Confirmation Dialog */}
            <AnimatePresence>
                {showLeaveDialog && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 backdrop-blur-sm"
                        onClick={() => setShowLeaveDialog(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="bg-background rounded-2xl shadow-2xl p-6 w-[360px] space-y-4 border border-border"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-foreground">Unsaved Changes</h3>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                You have unsaved changes to your itinerary. Would you like to save them before leaving?
                            </p>
                            <div className="flex gap-2 pt-2">
                                <button
                                    onClick={handleDiscardAndLeave}
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
                                >Discard Changes</button>
                                <button
                                    onClick={handleSaveAndLeave}
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                                ><Save className="w-4 h-4" /> Save & Leave</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Save Button */}
            <AnimatePresence>
                {isDirty && (
                    <motion.button
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        onClick={async () => {
                            await persistReorder(trip.id);
                            setIsDirty(false);
                            showToast('✅ Changes saved!');
                        }}
                        className="fixed bottom-6 right-6 z-[60] bg-primary text-primary-foreground px-5 py-3 rounded-2xl shadow-xl font-semibold text-sm flex items-center gap-2 hover:bg-primary/90 transition-colors"
                    >
                        <Save className="w-4 h-4" /> Save Changes
                    </motion.button>
                )}
            </AnimatePresence>

            {/* FIXED TABS HEADER */}
            <header className="flex-none bg-background/80 glass border-b border-border z-50 h-16 flex items-center justify-between px-4">
                <Button variant="ghost" size="sm" onClick={handleBack} className="gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Back</span>
                </Button>

                {/* Center: Tabs Switcher */}
                <div className="flex bg-muted p-1 rounded-xl relative">
                    {/* Animated Background for Tab */}
                    <div className="relative flex">
                        {['itinerary', 'budget'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`relative px-6 py-1.5 rounded-lg text-sm font-bold transition-colors z-10 flex items-center gap-2 ${activeTab === tab ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                {activeTab === tab && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute inset-0 bg-background shadow-sm rounded-lg -z-10"
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}
                                {tab === 'itinerary' ? <MapIcon className="w-4 h-4" /> : <span>💰</span>}
                                <span className="capitalize">{tab}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="w-20"></div> {/* Spacer */}
            </header>

            {/* Main Content Area - Scrollable */}
            <div className="flex-grow overflow-hidden relative">
                <div className="absolute inset-0 overflow-y-auto custom-scrollbar p-6">
                    <div className="container-custom max-w-7xl mx-auto pb-20">

                        {/* 1. ITINERARY TAB */}
                        <div className={`transition-opacity duration-300 ${activeTab === 'itinerary' ? 'block' : 'hidden'}`}>
                            {/* Trip Header */}
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
                                <div>
                                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">{trip.title}</h1>
                                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                        <span className="flex items-center gap-1 bg-card px-3 py-1 rounded-full border border-border shadow-sm"><MapPin className="w-3 h-3" /> {trip.destination}</span>
                                        <span className="flex items-center gap-1 bg-card px-3 py-1 rounded-full border border-border shadow-sm"><Calendar className="w-3 h-3" /> {new Date(trip.start_date || trip.startDate).toLocaleDateString()}</span>
                                        <span className="flex items-center gap-1 bg-card px-3 py-1 rounded-full border border-border shadow-sm font-medium text-foreground">
                                            <Wallet className="w-3 h-3" />
                                            {activeCurrencySymbol}{(trip.budget || 0).toLocaleString()}
                                            <span className="text-muted-foreground text-xs">/person</span>
                                        </span>
                                        {budgetSummary && (
                                            <BudgetHealthBadge
                                                percentUsed={budgetSummary.percent_used || 0}
                                                forecastPercent={trip.budget > 0 ? (((budgetSummary.total_spent || 0) + (budgetSummary.ai_estimated_total || 0)) / trip.budget * 100) : 0}
                                                size="sm"
                                            />
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <Button variant="outline" onClick={handleShare} className="gap-2">
                                        <Share2 className="w-4 h-4" /> Share
                                    </Button>
                                    <Button onClick={handleSave} className="gap-2">
                                        <Save className="w-4 h-4" /> Save Trip
                                    </Button>
                                </div>
                            </div>

                            {/* AI Cost Summary — shown after generation */}
                            <AnimatePresence>
                                {aiCostSummary && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className={`mb-6 p-4 rounded-2xl border flex items-center justify-between ${aiCostSummary.fits
                                            ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                                            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Sparkles className={`w-5 h-5 ${aiCostSummary.fits ? 'text-emerald-600' : 'text-red-500'}`} />
                                            <div>
                                                <p className="font-semibold text-sm text-foreground">AI Estimated Itinerary Cost: {activeCurrencySymbol}{aiCostSummary.aiTotal.toLocaleString()}</p>
                                                <p className={`text-xs ${aiCostSummary.fits ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                                                    {aiCostSummary.fits
                                                        ? `✅ Fits within budget (${activeCurrencySymbol}${aiCostSummary.budget.toLocaleString()})`
                                                        : `⚠️ Exceeds budget by ${activeCurrencySymbol}${(aiCostSummary.forecast - aiCostSummary.budget).toLocaleString()}`
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                        <button onClick={() => setAiCostSummary(null)} className="text-slate-400 hover:text-slate-600 text-lg">×</button>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Stale Itinerary Warning */}
                            {trip.itinerary_stale && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mb-6 p-4 rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                                >
                                    <div className="flex items-center gap-3">
                                        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                                        <div>
                                            <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">Budget changed since last generation</p>
                                            <p className="text-xs text-amber-700 dark:text-amber-400">
                                                Itinerary was generated for {activeCurrencySymbol}{(trip.generated_with_budget || 0).toLocaleString()}.
                                                Current budget: {activeCurrencySymbol}{(trip.budget || 0).toLocaleString()}
                                                {budgetSummary && (budgetSummary.total_spent || 0) + (budgetSummary.ai_estimated_total || 0) > (trip.budget || 0)
                                                    ? ` · Current plan exceeds new budget by ${activeCurrencySymbol}${(((budgetSummary.total_spent || 0) + (budgetSummary.ai_estimated_total || 0)) - (trip.budget || 0)).toLocaleString()}`
                                                    : ''
                                                }
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 flex-shrink-0">
                                        <Button variant="ghost" size="sm"
                                            onClick={async () => {
                                                await updateTrip(trip.id, { itinerary_stale: false });
                                                await fetchTrips();
                                            }}
                                        >
                                            Keep Plan
                                        </Button>
                                        <Button size="sm" onClick={handleGenerateItinerary}>
                                            {isGenerating ? 'Generating...' : 'Regenerate'}
                                        </Button>
                                    </div>
                                </motion.div>
                            )}

                            {/* Day Selector */}
                            <div className="flex gap-2 overflow-x-auto mb-8 pb-2 no-scrollbar">
                                {trip.days.map((day) => (
                                    <button
                                        key={day.id}
                                        onClick={() => setSelectedDay(day.id)}
                                        className={`flex-shrink-0 px-5 py-2.5 rounded-xl font-medium transition-all relative ${selectedDay === day.id ? 'text-primary-foreground' : 'bg-card text-muted-foreground border border-border hover:bg-muted'
                                            }`}
                                    >
                                        {selectedDay === day.id && (
                                            <motion.div
                                                layoutId="activeDay"
                                                className="absolute inset-0 bg-primary rounded-xl"
                                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                            />
                                        )}
                                        <span className="relative z-10">Day {day.dayNumber}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Itinerary List */}
                                <div className="lg:col-span-2 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-2xl font-bold text-foreground">Day {activeDay?.dayNumber} Plan</h2>
                                        <Button size="sm" onClick={() => setIsAddingActivity(true)} className="gap-2">
                                            <Plus className="w-4 h-4" /> Add Activity
                                        </Button>
                                    </div>

                                    {/* Activities List */}
                                    {activeDay?.activities.length === 0 ? (
                                        <Card className="text-center py-16 border-dashed">
                                            <CardContent>
                                                <Sparkles className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                                                <p className="text-muted-foreground mb-6 text-lg">No activities yet.</p>
                                                <div className="flex gap-3 justify-center">
                                                    <Button onClick={handleGenerateItinerary} disabled={isGenerating} className="gap-2">
                                                        {isGenerating ? <Loader2 className="animate-spin w-5 h-5" /> : <Sparkles className="w-5 h-5" />} Auto-Generate Itinerary
                                                    </Button>
                                                </div>
                                                <p className="text-sm text-muted-foreground/60 mt-4">AI will plan full schedule based on budget</p>
                                            </CardContent>
                                        </Card>
                                    ) : (
                                        <>
                                            {/* Orchestration Stepper — Fix Group 8 */}
                                            {isGenerating && orchestrationPhase && (
                                                <Card className="mb-4 border-primary/30 bg-gradient-to-r from-primary/5 to-accent/5">
                                                    <div className="p-4 flex items-center gap-3">
                                                        <Loader2 className="animate-spin w-5 h-5 text-primary" />
                                                        <div>
                                                            <p className="text-sm font-semibold text-foreground">{orchestrationPhase}</p>
                                                            <p className="text-xs text-muted-foreground">Building your optimized itinerary...</p>
                                                        </div>
                                                    </div>
                                                    <div className="px-4 pb-3">
                                                        <div className="flex gap-1">
                                                            {['Budget', 'Travel', 'Stay', 'Activities', 'Geocode', 'Local Transport', 'Return', 'Bookings', 'Summary', 'Gems', 'Reconcile'].map((step, i) => {
                                                                const phaseNum = parseFloat(orchestrationPhase?.match(/[\d.]+/)?.[0] || '0');
                                                                const stepPhase = i <= 0 ? 1 : i <= 1 ? 2 : i <= 2 ? 3 : i <= 3 ? 4 : i <= 4 ? 4.5 : i <= 5 ? 5 : i <= 6 ? 6 : i <= 7 ? 7 : i <= 8 ? 8 : i <= 9 ? 9 : 10;
                                                                const isDone = phaseNum > stepPhase;
                                                                const isCurrent = phaseNum === stepPhase;
                                                                return (
                                                                    <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${isDone ? 'bg-primary' : isCurrent ? 'bg-primary/50 animate-pulse' : 'bg-muted'
                                                                        }`} title={step} />
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </Card>
                                            )}
                                            <Reorder.Group axis="y" values={activeDay?.activities || []} onReorder={(newOrder) => { reorderActivities(trip.id, activeDay.id, newOrder); setIsDirty(true); }} className="space-y-4">
                                                {activeDay?.activities.map((activity) => {
                                                    const typeInfo = ACTIVITY_TYPES.find(t => t.value === activity.type) || ACTIVITY_TYPES[0];
                                                    return (
                                                        <SegmentCard
                                                            key={activity.id}
                                                            activity={activity}
                                                            typeInfo={typeInfo}
                                                            isLogistics={activity.isLogistics}
                                                            isFocused={focusedActivityId === activity.id}
                                                            activeCurrencySymbol={activeCurrencySymbol}
                                                            storeBookingOptions={storeBookingOptions}
                                                            onFocus={() => setFocusedActivityId(focusedActivityId === activity.id ? null : activity.id)}
                                                            onToggleComplete={() => toggleActivityComplete(trip.id, activeDay.id, activity.id)}
                                                            onDelete={() => handleDeleteActivity(trip.id, activeDay.id, activity.id)}
                                                        />
                                                    );
                                                })}
                                            </Reorder.Group>

                                            <DayExpenseSummary
                                                activeDay={activeDay}
                                                trip={trip}
                                                storeDailySummary={storeDailySummary}
                                                activeCurrencySymbol={activeCurrencySymbol}
                                            />
                                        </>
                                    )}
                                </div>

                                {/* Sidebar */}
                                <div className="lg:col-span-1">
                                    <div className="sticky top-6 space-y-6">
                                        <Card className="rounded-3xl overflow-visible h-96 border-border">
                                            <MapContainer trip={trip} destination={trip.destination} focusedActivityId={focusedActivityId} onPinClick={(id) => setFocusedActivityId(id)} />
                                        </Card>

                                        <AllocationBreakdown
                                            storeAllocation={storeAllocation}
                                            activeCurrencySymbol={activeCurrencySymbol}
                                        />

                                        <HiddenGemsPanel
                                            storeHiddenGems={storeHiddenGems}
                                            hiddenGems={hiddenGems}
                                            isLoadingGems={isLoadingGems}
                                            addedGemTitles={addedGemTitles}
                                            activeCurrencySymbol={activeCurrencySymbol}
                                            selectedDay={selectedDay}
                                            onAddGem={handleAddGemToPlan}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. BUDGET TAB */}
                        <div className={`transition-opacity duration-300 ${activeTab === 'budget' ? 'block' : 'hidden'}`}>
                            <BudgetTab
                                trip={trip}
                                budgetInput={budgetInput}
                                setBudgetInput={setBudgetInput}
                                currencyInput={currencyInput}
                                setCurrencyInput={setCurrencyInput}
                                isAnalyzing={isAnalyzing}
                                aiInsights={aiInsights}
                                budgetSummary={budgetSummary}
                                activeCurrencySymbol={activeCurrencySymbol}
                                handleAnalyzeBudget={handleAnalyzeBudget}
                                handleSaveBudget={handleSaveBudget}
                            />
                        </div>

                    </div>
                </div>
            </div>

            {/* Modal for adding activity */}
            <AnimatePresence>
                {isAddingActivity && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsAddingActivity(false)} />
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-card border border-border rounded-3xl p-6 w-full max-w-lg z-10 shadow-2xl">
                            <h2 className="text-2xl font-bold mb-4 text-foreground">Add Activity</h2>
                            <form onSubmit={handleAddActivity} className="space-y-4">
                                <input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" placeholder="Title" value={newActivity.title} onChange={e => setNewActivity({ ...newActivity, title: e.target.value })} autoFocus required />
                                <input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" type="time" value={newActivity.time} onChange={e => setNewActivity({ ...newActivity, time: e.target.value })} />
                                <div className="flex gap-2">
                                    <Button type="button" variant="ghost" onClick={() => setIsAddingActivity(false)} className="flex-1">Cancel</Button>
                                    <Button type="submit" className="flex-1">Add</Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>

    );
};

export default ItineraryBuilder;
