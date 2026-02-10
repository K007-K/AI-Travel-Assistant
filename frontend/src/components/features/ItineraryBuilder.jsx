import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, Reorder, AnimatePresence } from 'framer-motion';
import {
    Calendar, MapPin, Clock, Plus, ArrowLeft,
    GripVertical, Trash2, Save, Share2,
    Coffee, Camera, Utensils, Bed, Wallet,
    Landmark, Music, Sun, Sparkles, Map as MapIcon, Loader2,
    CheckCircle2, Circle, Star, AlertCircle
} from 'lucide-react';
import useItineraryStore from '../../store/itineraryStore';
import { generateTripPlan, getHiddenGems, validateTripBudget } from '../../api/groq';
import { getCurrencyForDestination, getCurrencySymbol } from '../../utils/currencyMap';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
        reorderActivities,
        deleteActivity,
        toggleActivityComplete,
    } = useItineraryStore();

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
    const [analysisReport, setAnalysisReport] = useState(null);
    const [sessionBudgetChecked, setSessionBudgetChecked] = useState(false); // Ref to prevent loop

    // Fetch trips from Supabase on mount (needed for page refresh)
    useEffect(() => {
        if (trips.length === 0 && !hasFetched) {
            fetchTrips().then(() => setHasFetched(true));
        } else {
            setHasFetched(true);
        }
    }, [trips.length, fetchTrips, hasFetched]);

    useEffect(() => {
        const foundTrip = trips.find(t => t.id === id);
        if (foundTrip) {
            setTrip(foundTrip);
            if (!selectedDay) setSelectedDay(foundTrip.days[0]?.id);

            // Load gems
            if (hiddenGems.length === 0 && !isLoadingGems) {
                setIsLoadingGems(true);
                getHiddenGems(foundTrip.destination)
                    .then(gems => setHiddenGems(gems || []))
                    .finally(() => setIsLoadingGems(false));
            }

            // AUTO-SWITCH TO BUDGET TAB if missing (Only once per session)
            if (!sessionBudgetChecked && (foundTrip.budget === 0 || foundTrip.budget === null) && !foundTrip.budget_skipped) {
                setActiveTab('budget');
                setSessionBudgetChecked(true); // Mark as checked so we don't force it again
            }

            // Auto-detect currency from destination (always prefer destination-based)
            if (!currencyInput || currencyInput === '') {
                const detectedCurrency = getCurrencyForDestination(foundTrip.destination);
                setCurrencyInput(detectedCurrency);
            }
        } else if (hasFetched && !isLoading) {
            // Only navigate away if we've already fetched and trip truly doesn't exist
            navigate('/itinerary');
        }
    }, [id, trips, navigate, selectedDay, hiddenGems.length, isLoadingGems, sessionBudgetChecked, hasFetched, isLoading]);

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
                plan.days.forEach((genDay, index) => {
                    const storeDayId = trip.days[index]?.id;
                    if (storeDayId && genDay.activities) {
                        genDay.activities.forEach(activity => {
                            addActivity(trip.id, storeDayId, {
                                title: activity.title,
                                time: activity.time || '09:00',
                                type: activity.type || 'sightseeing',
                                location: activity.location,
                                notes: activity.notes,
                                estimated_cost: parseFloat(activity.estimated_cost) || 0,
                                safety_warning: activity.safety_warning
                            });
                        });
                    }
                });
                showToast("✨ Itinerary generated successfully!");
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
            const result = await validateTripBudget({
                destination: trip.destination, days: trip.days.length, travelers: trip.travelers, budget: parseFloat(budgetInput), currency: currencyInput
            });
            setAnalysisReport(result.report);
        } catch (error) {
            showToast(`❌ Analysis failed: ${error.message}`);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSaveBudget = async () => {
        if (!budgetInput) return;
        await updateTrip(trip.id, {
            budget: parseFloat(budgetInput), currency: currencyInput, budget_skipped: false
        });
        // Force re-read of trip so header badge updates
        const refreshed = trips.find(t => t.id === trip.id);
        if (refreshed) setTrip({ ...refreshed, budget: parseFloat(budgetInput), currency: currencyInput });
        showToast("✅ Budget updated!");
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
                                                                                <button onClick={() => deleteActivity(trip.id, activeDay.id, activity.id)} className="p-2 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
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
                            <div className="max-w-4xl mx-auto">
                                <Card className="rounded-3xl overflow-hidden border-border">
                                    <div className="p-8 border-b border-border bg-muted/30">
                                        <h2 className="text-3xl font-bold text-foreground mb-2">Trip Budget Planner</h2>
                                        <p className="text-muted-foreground">Plan, track, and optimize your expenses for {trip.destination}.</p>
                                        <p className="text-xs text-muted-foreground/70 mt-1">💡 Budget is calculated <strong>per person</strong>. The AI will plan your full itinerary within this budget.</p>
                                    </div>

                                    <CardContent className="p-8">
                                        {/* Inputs */}
                                        <div className="flex flex-col md:flex-row gap-6 mb-8 items-end">
                                            <div className="flex-grow">
                                                <label className="block text-sm font-medium text-foreground mb-2">Total Budget <span className="text-muted-foreground font-normal">(Per Person)</span></label>
                                                <div className="relative">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">{currencyInput}</span>
                                                    <input
                                                        type="number"
                                                        value={budgetInput}
                                                        onChange={e => setBudgetInput(e.target.value)}
                                                        className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 pl-14 text-lg ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                        placeholder="2000"
                                                    />
                                                </div>
                                            </div>
                                            <div className="w-full md:w-40">
                                                <label className="block text-sm font-medium text-foreground mb-2">Currency</label>
                                                <select value={currencyInput} onChange={e => setCurrencyInput(e.target.value)} className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                                                    {['USD', 'EUR', 'GBP', 'INR', 'AUD', 'JPY'].map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                            </div>
                                            <Button onClick={handleAnalyzeBudget} disabled={isAnalyzing || !budgetInput} className="h-12 px-8">
                                                {isAnalyzing ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />} Analyze
                                            </Button>
                                            <Button variant="outline" onClick={handleSaveBudget} className="h-12 px-6">Save</Button>
                                        </div>

                                        {/* Report */}
                                        {analysisReport ? (
                                            <div className="bg-muted/30 rounded-2xl border border-border p-8">
                                                <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                                                    h1: ({ node, ...props }) => <h3 className="text-xl font-bold text-primary mb-4 pb-2 border-b border-border" {...props} />,
                                                    h2: ({ node, ...props }) => <h4 className="text-lg font-semibold text-foreground mt-6 mb-3" {...props} />,
                                                    h3: ({ node, ...props }) => <h4 className="text-md font-semibold text-foreground/80 mt-4 mb-2" {...props} />,
                                                    ul: ({ node, ...props }) => <ul className="space-y-2 mb-4 list-none pl-0" {...props} />,
                                                    li: ({ node, ...props }) => <li className="flex items-start gap-2 text-muted-foreground text-sm" {...props}><span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" /><span className="flex-1">{props.children}</span></li>,
                                                    strong: ({ node, ...props }) => <strong className="font-semibold text-foreground" {...props} />
                                                }}>
                                                    {analysisReport}
                                                </ReactMarkdown>
                                            </div>
                                        ) : (
                                            <div className="text-center py-12 text-muted-foreground">
                                                <p>Enter your budget above and click "Analyze" to see the breakdown.</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
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
