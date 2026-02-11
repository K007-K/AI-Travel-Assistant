import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, Reorder, AnimatePresence } from 'framer-motion';
import {
    Calendar, MapPin, Clock, Plus, ArrowLeft,
    GripVertical, Trash2, Save, Share2,
    Coffee, Camera, Utensils, Bed, Wallet,
    Landmark, Music, Sun, Sparkles, Map as MapIcon, Loader2,
    CheckCircle2, Circle, AlertCircle, TrendingUp,
    ShieldCheck, BarChart3, AlertTriangle, DollarSign, Lightbulb
} from 'lucide-react';
import useItineraryStore from '../../store/itineraryStore';
import useBudgetStore from '../../store/budgetStore';
import BudgetHealthBadge from '../ui/BudgetHealthBadge';
import { generateTripPlan, getHiddenGems, validateTripBudget } from '../../api/groq';
import { getCurrencyForDestination, getCurrencySymbol } from '../../utils/currencyMap';
// ReactMarkdown removed — Budget Analyzer now uses structured JSON
import Map from '../ui/Map';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';

const ACTIVITY_TYPES = [
    { value: 'sightseeing', label: 'Sightseeing', icon: Camera, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' },
    { value: 'food', label: 'Food & Drink', icon: Utensils, color: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20' },
    { value: 'relax', label: 'Relaxation', icon: Coffee, color: 'text-green-500 bg-green-50 dark:bg-green-900/20' },
    { value: 'culture', label: 'Culture', icon: Landmark, color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20' },
    { value: 'activity', label: 'Activity', icon: Sun, color: 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' },
    { value: 'accommodation', label: 'Stay', icon: Bed, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' },
];

const ItineraryBuilder = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const {
        trips,
        fetchTrips,
        isLoading,
        updateTrip,
        addActivity,
        batchAddActivities,
        reorderActivities,
        deleteActivity,
        toggleActivityComplete,
        ensureSegments,
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

    // Sync trip from store whenever trips change
    useEffect(() => {
        const foundTrip = trips.find(t => t.id === id);
        if (foundTrip) {
            setTrip(foundTrip);
            // Auto-migrate legacy JSONB days to trip_segments
            ensureSegments(foundTrip.id);
            if (!selectedDay) setSelectedDay(foundTrip.days[0]?.id);

            // Load gems once
            if (hiddenGems.length === 0 && !isLoadingGems) {
                setIsLoadingGems(true);
                getHiddenGems(foundTrip.destination)
                    .then(gems => setHiddenGems(gems || []))
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

    // Compute active currency symbol
    const activeCurrency = getCurrencyForDestination(trip?.destination);
    const activeCurrencySymbol = getCurrencySymbol(trip?.currency || activeCurrency);

    const handleGenerateItinerary = async () => {
        if (!trip) return;
        setIsGenerating(true);
        try {
            const plan = await generateTripPlan(
                trip.destination,
                trip.days.length,
                trip.budget || 2000,
                trip.travelers || 1,
                trip.currency || activeCurrency,
                trip.days,
                trip.budgetTier || 'mid-range'
            );
            if (plan && plan.days) {
                // Batch-insert all AI-generated activities into trip_segments
                const activitiesByDay = plan.days.map(genDay =>
                    (genDay.activities || []).map(activity => ({
                        title: activity.title,
                        time: activity.time || '09:00',
                        type: activity.type || 'sightseeing',
                        location: activity.location,
                        notes: activity.notes,
                        estimated_cost: parseFloat(activity.estimated_cost) || 0,
                        safety_warning: activity.safety_warning,
                    }))
                );
                await batchAddActivities(trip.id, activitiesByDay);
                showToast("✨ Itinerary generated successfully!");

                // Sync AI estimated costs to cost_events table
                // Re-read the trip from store to get the updated days with segment IDs
                setTimeout(async () => {
                    const updatedTrips = useItineraryStore.getState().trips;
                    const updatedTrip = updatedTrips.find(t => t.id === trip.id);
                    if (updatedTrip?.days) {
                        await syncAiEstimates(trip.id, updatedTrip.days, trip.currency || activeCurrency);
                        // Re-fetch budget summary and show fit/exceed feedback
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
                        // Write generation snapshot
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
            console.error("Generation failed", error);
            showToast("❌ Failed to generate itinerary.");
        } finally {
            setIsGenerating(false);
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

    const handleAddGem = (gem) => {
        if (!selectedDay) return;
        addActivity(trip.id, selectedDay, {
            title: gem.title, time: '14:00', type: 'sightseeing', location: trip.destination, notes: gem.description
        });
        showToast(`Added ${gem.title}!`);
    };

    const handleAnalyzeBudget = async () => {
        if (!budgetInput) return;
        setIsAnalyzing(true);
        try {
            // Refresh RPC data first
            await fetchBudgetSummary(trip.id);
            const freshSummary = useBudgetStore.getState().budgetSummary;
            const result = await validateTripBudget(
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
            const refreshed = useItineraryStore.getState().trips.find(t => t.id === trip.id);
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

    if (!trip) return null;
    const activeDay = trip.days.find(d => d.id === selectedDay);
    const allActivities = trip.days.flatMap(d => d.activities);

    return (
        <div className="fixed inset-0 z-50 bg-background overflow-hidden flex flex-col">
            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="fixed top-24 right-4 z-[70] bg-foreground text-background px-6 py-3 rounded-xl shadow-lg font-medium">{toast}</motion.div>
                )}
            </AnimatePresence>

            {/* FIXED TABS HEADER */}
            <header className="flex-none bg-background/80 glass border-b border-border z-50 h-16 flex items-center justify-between px-4">
                <Button variant="ghost" size="sm" onClick={() => navigate('/itinerary')} className="gap-2">
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
                                            <Reorder.Group axis="y" values={activeDay?.activities || []} onReorder={(newOrder) => reorderActivities(trip.id, activeDay.id, newOrder)} className="space-y-4">
                                                {activeDay?.activities.map((activity) => {
                                                    const typeInfo = ACTIVITY_TYPES.find(t => t.value === activity.type) || ACTIVITY_TYPES[0];
                                                    const Icon = typeInfo.icon;
                                                    return (
                                                        <Reorder.Item key={activity.id} value={activity} className="relative">
                                                            <Card className={`border hover:border-primary/50 transition-colors ${activity.safety_warning ? 'border-l-4 border-l-destructive' : ''}`}>
                                                                <div className="p-5 flex items-start gap-4">
                                                                    <div className="mt-2 text-muted-foreground/50 cursor-grab hover:text-foreground"><GripVertical className="w-5 h-5" /></div>
                                                                    <button onClick={() => toggleActivityComplete(trip.id, activeDay.id, activity.id)} className={activity.isCompleted ? 'text-green-500 mt-2' : 'text-muted-foreground/50 mt-2 hover:text-muted-foreground transition-colors'}>
                                                                        {activity.isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                                                                    </button>
                                                                    <div className={`p-3 rounded-xl ${typeInfo.color}`}><Icon className="w-5 h-5" /></div>
                                                                    <div className="flex-grow">
                                                                        <div className="flex justify-between items-center mb-1">
                                                                            <h3 className={`font-semibold text-lg ${activity.isCompleted ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{activity.title}</h3>
                                                                            <div className="flex items-center gap-3">
                                                                                {activity.estimated_cost > 0 && (
                                                                                    <span className="text-sm font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-lg">
                                                                                        {activeCurrencySymbol}{activity.estimated_cost.toLocaleString()}
                                                                                    </span>
                                                                                )}
                                                                                <button onClick={() => handleDeleteActivity(trip.id, activeDay.id, activity.id)} className="p-2 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                                                                            </div>
                                                                        </div>
                                                                        {activity.safety_warning && <p className="text-xs font-medium text-destructive bg-destructive/10 p-2.5 rounded-lg mb-3 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {activity.safety_warning}</p>}
                                                                        <div className="flex gap-4 text-sm text-muted-foreground">
                                                                            <span className="flex gap-1 items-center bg-muted px-2 py-1 rounded text-xs"><Clock className="w-3 h-3" /> {activity.time}</span>
                                                                            {activity.location && <span className="flex gap-1 items-center"><MapPin className="w-3 h-3" /> {activity.location}</span>}
                                                                            <span className="px-2 py-1 rounded bg-muted text-xs font-medium uppercase">{typeInfo.label}</span>
                                                                        </div>
                                                                        {activity.notes && <p className="mt-3 text-sm text-muted-foreground bg-muted/50 p-3 rounded-xl">{activity.notes}</p>}
                                                                    </div>
                                                                </div>
                                                            </Card>
                                                        </Reorder.Item>
                                                    );
                                                })}
                                            </Reorder.Group>

                                            {/* Daily Expense Summary */}
                                            {(() => {
                                                const dayTotal = activeDay?.activities.reduce((sum, a) => sum + (a.estimated_cost || 0), 0) || 0;
                                                const dailyBudget = trip.budget && trip.days.length ? Math.round(trip.budget / trip.days.length) : 0;
                                                if (dayTotal === 0 && dailyBudget === 0) return null;
                                                return (
                                                    <Card className="mt-6 border-primary/20 bg-primary/5">
                                                        <div className="p-5 flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <div className="p-2 rounded-xl bg-primary/10">
                                                                    <Wallet className="w-5 h-5 text-primary" />
                                                                </div>
                                                                <div>
                                                                    <h4 className="font-semibold text-foreground">Day {activeDay?.dayNumber} Expenses</h4>
                                                                    <p className="text-xs text-muted-foreground">Estimated total for this day (per person)</p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className={`text-2xl font-bold ${dayTotal > dailyBudget && dailyBudget > 0 ? 'text-destructive' : 'text-primary'}`}>
                                                                    {activeCurrencySymbol}{dayTotal.toLocaleString()}
                                                                </div>
                                                                {dailyBudget > 0 && (
                                                                    <p className="text-xs text-muted-foreground">
                                                                        of {activeCurrencySymbol}{dailyBudget.toLocaleString()} daily budget
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </Card>
                                                );
                                            })()}
                                        </>
                                    )}
                                </div>

                                {/* Sidebar */}
                                <div className="lg:col-span-1">
                                    <div className="sticky top-6 space-y-6">
                                        <Card className="rounded-3xl overflow-hidden h-64 border-border">
                                            <Map activities={allActivities} destination={trip.destination} />
                                        </Card>

                                        {/* Scrollable Hidden Gems */}
                                        <Card className="rounded-3xl border-border flex flex-col max-h-[calc(100vh-25rem)]">
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2 text-lg">
                                                    <Sun className="w-5 h-5 text-yellow-500" /> Hidden Gems
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                                                {hiddenGems.map((gem, i) => (
                                                    <div key={i} className="flex justify-between items-start p-3 bg-muted/50 rounded-xl hover:bg-muted transition-colors shrink-0">
                                                        <div>
                                                            <h4 className="text-sm font-medium text-foreground">{gem.title}</h4>
                                                            <p className="text-xs text-muted-foreground line-clamp-2">{gem.description}</p>
                                                        </div>
                                                        <button onClick={() => handleAddGem(gem)} className="text-primary hover:scale-110 transition-transform p-1">
                                                            <Plus className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </CardContent>
                                        </Card>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. BUDGET TAB */}
                        <div className={`transition-opacity duration-300 ${activeTab === 'budget' ? 'block' : 'hidden'}`}>
                            <div className="max-w-5xl mx-auto">

                                {/* Budget Input Card */}
                                <Card className="rounded-3xl overflow-hidden border-border mb-6">
                                    <div className="p-6 md:p-8 bg-gradient-to-br from-primary/5 via-background to-accent/5">
                                        <div className="flex items-center gap-3 mb-1">
                                            <div className="p-2.5 rounded-xl bg-primary/10">
                                                <Wallet className="w-5 h-5 text-primary" />
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-bold text-foreground">Trip Budget Planner</h2>
                                            </div>
                                        </div>
                                        <p className="text-sm text-muted-foreground ml-[52px] mb-6">Set your per-person budget for {trip.destination} and let AI analyze your spending plan.</p>

                                        <div className="flex flex-col sm:flex-row gap-3 items-end">
                                            <div className="flex-grow">
                                                <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Budget per person</label>
                                                <div className="relative">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-primary">{currencyInput}</span>
                                                    <input
                                                        type="number"
                                                        value={budgetInput}
                                                        onChange={e => setBudgetInput(e.target.value)}
                                                        className="flex h-12 w-full rounded-xl border border-input bg-background px-3 py-2 pl-14 text-lg font-semibold ring-offset-background placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary transition-all"
                                                        placeholder="2000"
                                                    />
                                                </div>
                                            </div>
                                            <div className="w-full sm:w-32">
                                                <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Currency</label>
                                                <select value={currencyInput} onChange={e => setCurrencyInput(e.target.value)} className="flex h-12 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary transition-all">
                                                    {['USD', 'EUR', 'GBP', 'INR', 'AUD', 'JPY', 'CAD', 'SGD', 'THB', 'MXN'].map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                            </div>
                                            <div className="flex gap-2 w-full sm:w-auto">
                                                <Button onClick={handleAnalyzeBudget} disabled={isAnalyzing || !budgetInput} className="h-12 px-6 flex-1 sm:flex-none rounded-xl gap-2 font-semibold">
                                                    {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Analyze
                                                </Button>
                                                <Button variant="outline" onClick={handleSaveBudget} className="h-12 px-5 rounded-xl font-semibold">
                                                    <Save className="w-4 h-4 mr-1.5" /> Save
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </Card>

                                {/* ─── Financial Intelligence Panel ─── */}
                                {(() => {
                                    // Compute financial values from RPC data
                                    const bs = budgetSummary || {};
                                    const totalBudget = bs.total_budget || parseFloat(budgetInput) || 0;
                                    const actualSpent = bs.total_spent || 0;
                                    const aiEstimated = bs.ai_estimated_total || 0;
                                    const forecastTotal = actualSpent + aiEstimated;
                                    const forecastPercent = totalBudget > 0 ? Math.round((forecastTotal / totalBudget) * 100 * 10) / 10 : 0;
                                    const remainingForecast = totalBudget - forecastTotal;
                                    const categories = bs.category_breakdown || [];
                                    const cur = currencyInput || bs.currency || 'USD';

                                    // Risk level (deterministic)
                                    const riskLevel = forecastPercent >= 100 ? 'CRITICAL' : forecastPercent >= 80 ? 'HIGH' : forecastPercent >= 60 ? 'MODERATE' : 'LOW';
                                    const riskConfig = {
                                        LOW: { color: 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800', icon: <ShieldCheck className="w-5 h-5" />, label: 'Low Risk' },
                                        MODERATE: { color: 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800', icon: <AlertCircle className="w-5 h-5" />, label: 'Moderate Risk' },
                                        HIGH: { color: 'text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800', icon: <AlertTriangle className="w-5 h-5" />, label: 'High Risk' },
                                        CRITICAL: { color: 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800', icon: <AlertTriangle className="w-5 h-5" />, label: 'Critical' },
                                    };
                                    const risk = riskConfig[riskLevel];

                                    const hasData = totalBudget > 0;

                                    return (
                                        <>
                                            {/* Loading Skeleton */}
                                            <AnimatePresence>
                                                {isAnalyzing && (
                                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                                            {[0, 1, 2, 3].map(i => (
                                                                <div key={i} className="rounded-2xl border border-border bg-card p-5 space-y-3" style={{ animationDelay: `${i * 150}ms` }}>
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="w-8 h-8 rounded-lg bg-muted animate-pulse" />
                                                                        <div className="h-4 w-24 rounded bg-muted animate-pulse" />
                                                                    </div>
                                                                    <div className="h-7 w-32 rounded bg-muted animate-pulse" />
                                                                    <div className="h-2 w-full rounded-full bg-muted animate-pulse" />
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
                                                            <div className="h-5 w-44 rounded bg-muted animate-pulse" />
                                                            {[0, 1, 2, 3, 4, 5].map(i => (
                                                                <div key={i} className="flex justify-between items-center py-2">
                                                                    <div className="h-4 w-36 rounded bg-muted animate-pulse" />
                                                                    <div className="h-4 w-24 rounded bg-muted animate-pulse" />
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
                                                            <div className="h-5 w-52 rounded bg-muted animate-pulse" />
                                                            {[0, 1, 2].map(i => (
                                                                <div key={i} className="space-y-1.5">
                                                                    <div className="h-4 w-28 rounded bg-muted animate-pulse" />
                                                                    <div className="h-4 w-full rounded-full bg-muted animate-pulse" />
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <p className="text-center text-sm text-muted-foreground animate-pulse">✨ AI is analyzing your financials for {trip.destination}...</p>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>

                                            {/* ── SECTION 1: Top Summary Cards (from RPC) ── */}
                                            {!isAnalyzing && hasData && (
                                                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-5">
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                                        {/* Trip Budget */}
                                                        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl border border-border bg-card p-5">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30"><Wallet className="w-4 h-4 text-blue-600 dark:text-blue-400" /></div>
                                                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Trip Budget</span>
                                                            </div>
                                                            <div className="text-2xl font-bold text-foreground">{cur} {totalBudget.toLocaleString()}</div>
                                                            <p className="text-xs text-muted-foreground mt-1">per person · {trip.days?.length || 0} days</p>
                                                        </motion.div>

                                                        {/* Actual Spent */}
                                                        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="rounded-2xl border border-border bg-card p-5">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <div className="p-1.5 rounded-lg bg-violet-100 dark:bg-violet-900/30"><DollarSign className="w-4 h-4 text-violet-600 dark:text-violet-400" /></div>
                                                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Actual Spent</span>
                                                            </div>
                                                            <div className="text-2xl font-bold text-foreground">{cur} {actualSpent.toLocaleString()}</div>
                                                            <p className="text-xs text-muted-foreground mt-1">Manual + Bookings</p>
                                                        </motion.div>

                                                        {/* Forecast */}
                                                        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl border border-border bg-card p-5">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <div className="p-1.5 rounded-lg bg-cyan-100 dark:bg-cyan-900/30"><TrendingUp className="w-4 h-4 text-cyan-600 dark:text-cyan-400" /></div>
                                                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Forecast</span>
                                                            </div>
                                                            <div className={`text-2xl font-bold ${forecastPercent >= 100 ? 'text-red-500' : 'text-foreground'}`}>{cur} {forecastTotal.toLocaleString()}</div>
                                                            <div className="w-full bg-muted h-1.5 rounded-full mt-2 overflow-hidden">
                                                                <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(forecastPercent, 100)}%` }} transition={{ duration: 1, ease: "easeOut" }}
                                                                    className={`h-full rounded-full ${forecastPercent >= 100 ? 'bg-red-500' : forecastPercent >= 80 ? 'bg-orange-500' : forecastPercent >= 60 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                                                />
                                                            </div>
                                                            <p className="text-xs text-muted-foreground mt-1">{forecastPercent}% of budget</p>
                                                        </motion.div>

                                                        {/* Risk Level */}
                                                        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className={`rounded-2xl border p-5 ${risk.color}`}>
                                                            <div className="flex items-center gap-2 mb-2">
                                                                {risk.icon}
                                                                <span className="text-xs font-medium uppercase tracking-wide">Risk Level</span>
                                                            </div>
                                                            <div className="text-2xl font-bold">{riskLevel}</div>
                                                            <p className="text-xs mt-1 opacity-80">{risk.label}</p>
                                                        </motion.div>
                                                    </div>

                                                    {/* ── SECTION 2: Financial Summary Panel ── */}
                                                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-2xl border border-border bg-card p-6">
                                                        <h3 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
                                                            <BarChart3 className="w-5 h-5 text-primary" /> Financial Summary
                                                        </h3>
                                                        <div className="divide-y divide-border">
                                                            {[
                                                                { label: 'Total Budget', value: `${cur} ${totalBudget.toLocaleString()}`, accent: false },
                                                                { label: 'Actual Spent (Manual + Bookings)', value: `${cur} ${actualSpent.toLocaleString()}`, accent: false },
                                                                { label: 'AI Estimated Spend', value: `${cur} ${aiEstimated.toLocaleString()}`, accent: false },
                                                                { label: 'Forecast Total', value: `${cur} ${forecastTotal.toLocaleString()}`, accent: forecastPercent >= 100 },
                                                                { label: 'Remaining (Forecast)', value: `${cur} ${remainingForecast.toLocaleString()}`, accent: remainingForecast < 0 },
                                                                { label: 'Forecast Utilization', value: `${forecastPercent}%`, accent: forecastPercent >= 80 },
                                                            ].map((row, i) => (
                                                                <div key={i} className="flex justify-between items-center py-3">
                                                                    <span className="text-sm text-muted-foreground">{row.label}</span>
                                                                    <span className={`text-sm font-semibold ${row.accent ? 'text-red-500' : 'text-foreground'}`}>{row.value}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </motion.div>

                                                    {/* ── SECTION 3: Projected Cost Allocation ── */}
                                                    {categories.length > 0 && (
                                                        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="rounded-2xl border border-border bg-card p-6">
                                                            <h3 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
                                                                <span className="text-lg">📊</span> Projected Cost Allocation
                                                            </h3>
                                                            {/* Legend */}
                                                            <div className="flex gap-4 mb-4 text-xs text-muted-foreground">
                                                                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-blue-500" /> Manual</span>
                                                                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-violet-500" /> Booking</span>
                                                                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-cyan-400" /> AI Estimate</span>
                                                            </div>
                                                            <div className="space-y-4">
                                                                {categories.map((cat, i) => {
                                                                    const catTotal = parseFloat(cat.total) || 0;
                                                                    const manual = parseFloat(cat.by_source?.manual) || 0;
                                                                    const booking = parseFloat(cat.by_source?.booking) || 0;
                                                                    const aiEst = parseFloat(cat.by_source?.ai_estimate) || 0;
                                                                    const catPercent = totalBudget > 0 ? Math.round((catTotal / totalBudget) * 100) : 0;
                                                                    const manualPct = catTotal > 0 ? (manual / catTotal) * 100 : 0;
                                                                    const bookingPct = catTotal > 0 ? (booking / catTotal) * 100 : 0;
                                                                    const aiPct = catTotal > 0 ? (aiEst / catTotal) * 100 : 0;

                                                                    return (
                                                                        <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.08 }}>
                                                                            <div className="flex justify-between items-center mb-1">
                                                                                <span className="text-sm font-medium text-foreground capitalize">{cat.category}</span>
                                                                                <span className="text-sm text-muted-foreground">{cur} {catTotal.toLocaleString()} <span className="text-xs">({catPercent}%)</span></span>
                                                                            </div>
                                                                            {/* Stacked bar */}
                                                                            <div className="w-full bg-muted rounded-full h-3 overflow-hidden flex">
                                                                                {manual > 0 && (
                                                                                    <motion.div initial={{ width: 0 }} animate={{ width: `${manualPct}%` }} transition={{ duration: 0.8, delay: 0.6 + i * 0.08 }}
                                                                                        className="h-full bg-blue-500" title={`Manual: ${cur} ${manual.toLocaleString()}`} />
                                                                                )}
                                                                                {booking > 0 && (
                                                                                    <motion.div initial={{ width: 0 }} animate={{ width: `${bookingPct}%` }} transition={{ duration: 0.8, delay: 0.7 + i * 0.08 }}
                                                                                        className="h-full bg-violet-500" title={`Booking: ${cur} ${booking.toLocaleString()}`} />
                                                                                )}
                                                                                {aiEst > 0 && (
                                                                                    <motion.div initial={{ width: 0 }} animate={{ width: `${aiPct}%` }} transition={{ duration: 0.8, delay: 0.8 + i * 0.08 }}
                                                                                        className="h-full bg-cyan-400" title={`AI Estimate: ${cur} ${aiEst.toLocaleString()}`} />
                                                                                )}
                                                                            </div>
                                                                        </motion.div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </motion.div>
                                                    )}

                                                    {/* ── SECTION 4: Risk Assessment (Deterministic) ── */}
                                                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                                                        className={`rounded-2xl border p-5 ${risk.color}`}>
                                                        <h3 className="text-base font-bold mb-2 flex items-center gap-2">
                                                            {risk.icon} Risk Assessment
                                                        </h3>
                                                        <p className="text-sm leading-relaxed">
                                                            {riskLevel === 'LOW' && `Forecast utilization is within safe range at ${forecastPercent}%. Your budget of ${cur} ${totalBudget.toLocaleString()} comfortably covers projected expenses.`}
                                                            {riskLevel === 'MODERATE' && `Forecast utilization is at ${forecastPercent}%. Budget is being used efficiently but monitor spending closely. Remaining forecast: ${cur} ${remainingForecast.toLocaleString()}.`}
                                                            {riskLevel === 'HIGH' && `Forecast utilization is elevated at ${forecastPercent}%. Projected expenses are approaching the budget limit. Only ${cur} ${Math.max(0, remainingForecast).toLocaleString()} remains.`}
                                                            {riskLevel === 'CRITICAL' && `Projected expenses exceed budget by ${cur} ${Math.abs(remainingForecast).toLocaleString()} (${forecastPercent}% utilization). Immediate budget review recommended.`}
                                                        </p>
                                                    </motion.div>

                                                    {/* ── SECTION 5: AI Financial Insights ── */}
                                                    {aiInsights && (
                                                        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="rounded-2xl border border-border bg-card p-6 space-y-5">
                                                            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                                                                <Sparkles className="w-5 h-5 text-primary" /> AI Financial Insights
                                                            </h3>

                                                            {/* Summary */}
                                                            {aiInsights.summary && (
                                                                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                                                                    <p className="text-sm text-foreground leading-relaxed">{aiInsights.summary}</p>
                                                                </div>
                                                            )}

                                                            {/* Risk Analysis */}
                                                            {aiInsights.risk_analysis && (
                                                                <div className="p-4 rounded-xl bg-muted/50">
                                                                    <h4 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-1.5">
                                                                        <ShieldCheck className="w-4 h-4 text-muted-foreground" /> Risk Analysis
                                                                    </h4>
                                                                    <p className="text-sm text-muted-foreground leading-relaxed">{aiInsights.risk_analysis}</p>
                                                                </div>
                                                            )}

                                                            {/* Category Insights */}
                                                            {aiInsights.category_insights && aiInsights.category_insights.length > 0 && (
                                                                <div>
                                                                    <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
                                                                        <BarChart3 className="w-4 h-4 text-muted-foreground" /> Category Insights
                                                                    </h4>
                                                                    <div className="space-y-2">
                                                                        {aiInsights.category_insights.map((insight, i) => (
                                                                            <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 + i * 0.06 }}
                                                                                className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                                                                                <div className="mt-0.5 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                                                    <CheckCircle2 className="w-3 h-3 text-primary" />
                                                                                </div>
                                                                                <p className="text-sm text-muted-foreground leading-relaxed">{insight}</p>
                                                                            </motion.div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Recommendations */}
                                                            {aiInsights.recommendations && aiInsights.recommendations.length > 0 && (
                                                                <div>
                                                                    <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
                                                                        <Lightbulb className="w-4 h-4 text-amber-500" /> Recommendations
                                                                    </h4>
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                        {aiInsights.recommendations.map((rec, i) => (
                                                                            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 + i * 0.06 }}
                                                                                className="flex items-start gap-3 p-3 rounded-xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors">
                                                                                <span className="text-amber-500 font-bold text-sm mt-px">{i + 1}.</span>
                                                                                <p className="text-sm text-muted-foreground leading-relaxed">{rec}</p>
                                                                            </motion.div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </motion.div>
                                                    )}
                                                </motion.div>
                                            )}

                                            {/* Empty State */}
                                            {!isAnalyzing && !hasData && !aiInsights && (
                                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
                                                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/5 flex items-center justify-center">
                                                        <Sparkles className="w-7 h-7 text-primary/40" />
                                                    </div>
                                                    <h3 className="text-lg font-semibold text-foreground mb-2">Financial Intelligence Panel</h3>
                                                    <p className="text-sm text-muted-foreground max-w-md mx-auto">Enter your budget above and click <strong>Save</strong> to see your financial summary. Then click <strong>Analyze</strong> to get AI-powered financial insights for {trip.destination}.</p>
                                                </motion.div>
                                            )}
                                        </>
                                    );
                                })()}


                            </div>
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
