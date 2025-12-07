import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, Reorder, AnimatePresence } from 'framer-motion';
import {
    Calendar, MapPin, Clock, Plus, ArrowLeft,
    GripVertical, Trash2, Save, Share2,
    Coffee, Camera, Utensils, Bed,
    Landmark, Music, Sun, Sparkles, Map as MapIcon, Loader2,
    CheckCircle2, Circle, Star, AlertCircle
} from 'lucide-react';
import useItineraryStore from '../../store/itineraryStore';
import { generateTripPlan, getHiddenGems } from '../../api/groq';
import Map from '../Map';

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
        addActivity,
        reorderActivities,
        deleteActivity,
        toggleActivityComplete,
        rateActivity
    } = useItineraryStore();

    const [trip, setTrip] = useState(null);
    const [selectedDay, setSelectedDay] = useState(null);
    const [isAddingActivity, setIsAddingActivity] = useState(false);
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
    const [toast, setToast] = useState(null); // Simple toast state

    useEffect(() => {
        // Sync local trip state with store
        const foundTrip = trips.find(t => t.id === id);
        if (foundTrip) {
            setTrip(foundTrip);
            if (!selectedDay) setSelectedDay(foundTrip.days[0]?.id);

            // Load hidden gems if not loaded
            if (hiddenGems.length === 0 && !isLoadingGems) {
                setIsLoadingGems(true);
                getHiddenGems(foundTrip.destination)
                    .then(gems => setHiddenGems(gems || []))
                    .finally(() => setIsLoadingGems(false));
            }
        } else {
            navigate('/itinerary');
        }
    }, [id, trips, navigate, selectedDay, hiddenGems.length, isLoadingGems]);

    const showToast = (message) => {
        setToast(message);
        setTimeout(() => setToast(null), 3000);
    };

    const handleSave = () => {
        // In this app, state is auto-persisted by Zustand, so "Save" is just a visual confirmation
        showToast("✅ Trip saved successfully!");
    };

    const handleShare = async () => {
        const shareData = {
            title: `Trip to ${trip.destination}`,
            text: `Check out my trip to ${trip.destination}! I'm going for ${trip.days.length} days.`,
            url: window.location.href
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
                showToast("🔗 Shared successfully!");
            } else {
                await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
                showToast("🔗 Link copied to clipboard!");
            }
        } catch (err) {
            console.error("Error sharing:", err);
            // Fallback if share fails (e.g. user cancelled)
            try {
                await navigator.clipboard.writeText(window.location.href);
                showToast("🔗 Link copied to clipboard!");
            } catch (clipboardErr) {
                showToast("❌ Failed to share");
            }
        }
    };

    const handleGenerateItinerary = async () => {
        if (!trip) return;
        setIsGenerating(true);
        try {
            // Updated to pass currency and budget tier
            const plan = await generateTripPlan(
                trip.destination,
                trip.days.length,
                trip.budget || 2000,
                trip.travelers || 1,
                trip.currency || 'USD',
                trip.days, // Pass the days array containing location info
                trip.budgetTier || 'mid-range' // Pass budget tier
            );

            if (plan && plan.days) {
                // Populate the store with generated activities
                // We map generated days to existing trip day IDs
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
                                safety_warning: activity.safety_warning // [NEW] Pass safety warning
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
        setNewActivity({
            title: '',
            time: '',
            location: '',
            type: 'sightseeing',
            notes: ''
        });
        showToast("Activity added!");
    };

    const handleAddGem = (gem) => {
        if (!selectedDay) return;
        addActivity(trip.id, selectedDay, {
            title: gem.title,
            time: '14:00', // Default time
            type: 'sightseeing',
            location: trip.destination, // Default location context
            notes: gem.description
        });
        showToast(`Added ${gem.title} to itinerary!`);
    };

    const handleReorder = (dayId, newOrder) => {
        reorderActivities(trip.id, dayId, newOrder);
    };

    if (!trip) return null;

    const activeDay = trip.days.find(d => d.id === selectedDay);

    // Collect all activities for the map
    const allActivities = trip.days.flatMap(d => d.activities);

    return (
        <div className="min-h-screen pt-20 pb-10 bg-slate-50 dark:bg-slate-900">
            {/* Toast Notification */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed top-24 right-4 z-50 bg-slate-900 text-white px-6 py-3 rounded-xl shadow-lg font-medium"
                    >
                        {toast}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-20 z-30">
                <div className="container-custom py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/itinerary')}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                            </button>
                            <div>
                                <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{trip.title}</h1>
                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {trip.destination}</span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(trip.startDate).toLocaleDateString()}</span>
                                    <span>•</span>
                                    <span className="font-medium text-slate-700 dark:text-slate-300">
                                        {trip.currency === 'INR' ? '₹' : trip.currency === 'EUR' ? '€' : trip.currency === 'GBP' ? '£' : trip.currency === 'JPY' ? '¥' : '$'}
                                        {trip.budget}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={handleShare} className="btn btn-secondary px-4 py-2 text-sm flex items-center gap-2">
                                <Share2 className="w-4 h-4" /> Share
                            </button>
                            <button onClick={handleSave} className="btn btn-primary px-4 py-2 text-sm flex items-center gap-2">
                                <Save className="w-4 h-4" /> Save
                            </button>
                        </div>
                    </div>

                    {/* Day Selector */}
                    <div className="flex gap-2 overflow-x-auto mt-6 pb-2 no-scrollbar">
                        {trip.days.map((day) => (
                            <button
                                key={day.id}
                                onClick={() => setSelectedDay(day.id)}
                                className={`flex-shrink-0 px-4 py-2 rounded-xl font-medium transition-all ${selectedDay === day.id
                                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                                    }`}
                            >
                                Day {day.dayNumber}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="container-custom mt-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content - Activities */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                Day {activeDay?.dayNumber} Itinerary
                            </h2>
                            <button
                                onClick={() => setIsAddingActivity(true)}
                                className="btn btn-primary px-4 py-2 text-sm flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" /> Add Activity
                            </button>
                        </div>

                        {activeDay?.activities.length === 0 ? (
                            <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                                <Sparkles className="w-12 h-12 text-primary-300 mx-auto mb-4" />
                                <p className="text-slate-500 dark:text-slate-400 mb-6">No activities planned yet.</p>

                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <button
                                        onClick={handleGenerateItinerary}
                                        disabled={isGenerating}
                                        className="btn bg-gradient-to-r from-primary-600 to-accent-600 text-white flex items-center gap-2 justify-center shadow-lg shadow-primary-500/20"
                                    >
                                        {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                        {isGenerating ? 'Planning Trip...' : 'Auto-Generate Itinerary'}
                                    </button>
                                    <button
                                        onClick={() => setIsAddingActivity(true)}
                                        className="btn btn-secondary flex items-center gap-2 justify-center"
                                    >
                                        <Plus className="w-4 h-4" /> Manually Add
                                    </button>
                                </div>
                                <p className="text-xs text-slate-400 mt-4">AI will plan full day schedule based on budget ({trip.currency}).</p>
                            </div>
                        ) : (
                            <Reorder.Group
                                axis="y"
                                values={activeDay?.activities || []}
                                onReorder={(newOrder) => reorderActivities(trip.id, activeDay.id, newOrder)}
                                className="space-y-4"
                            >
                                {activeDay?.activities.map((activity) => {
                                    const typeInfo = ACTIVITY_TYPES.find(t => t.value === activity.type) || ACTIVITY_TYPES[0];
                                    const Icon = typeInfo.icon;

                                    return (
                                        <Reorder.Item
                                            key={activity.id}
                                            value={activity}
                                            className={`p-4 rounded-2xl shadow-sm border transition-all ${activity.isCompleted
                                                ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 opacity-75'
                                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                                                } ${activity.safety_warning ? 'border-l-4 border-l-red-500' : ''}`}
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className="mt-2 text-slate-400 cursor-grab active:cursor-grabbing">
                                                    <GripVertical className="w-5 h-5" />
                                                </div>

                                                {/* Checkbox */}
                                                <button
                                                    onClick={() => toggleActivityComplete(trip.id, activeDay.id, activity.id)}
                                                    className={`mt-2 transition-colors ${activity.isCompleted ? 'text-green-500' : 'text-slate-300 hover:text-slate-400'}`}
                                                >
                                                    {activity.isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                                                </button>

                                                <div className={`p-3 rounded-xl ${typeInfo.color}`}>
                                                    <Icon className="w-5 h-5" />
                                                </div>

                                                <div className="flex-grow">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <h3 className={`font-semibold text-lg ${activity.isCompleted ? 'text-slate-500 line-through' : 'text-slate-900 dark:text-slate-100'}`}>
                                                            {activity.title}
                                                        </h3>
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                                                                <Clock className="w-4 h-4" />
                                                                {activity.time}
                                                            </div>
                                                            <button
                                                                onClick={() => deleteActivity(trip.id, activeDay.id, activity.id)}
                                                                className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                                title="Delete Activity"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Safety Warning Alert */}
                                                    {activity.safety_warning && (
                                                        <div className="mb-2 flex gap-2 items-start bg-red-50 dark:bg-red-900/20 p-2.5 rounded-lg border border-red-100 dark:border-red-800/30">
                                                            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                                                            <p className="text-xs font-semibold text-red-700 dark:text-red-300 leading-tight">
                                                                Safety Alert: <span className="font-normal opacity-90">{activity.safety_warning}</span>
                                                            </p>
                                                        </div>
                                                    )}

                                                    <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                                                        {activity.location && (
                                                            <span className="flex items-center gap-1">
                                                                <MapPin className="w-3 h-3" /> {activity.location}
                                                            </span>
                                                        )}
                                                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-xs font-medium uppercase tracking-wider">
                                                            {typeInfo.label}
                                                        </span>
                                                    </div>

                                                    {activity.notes && (
                                                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg">
                                                            {activity.notes}
                                                        </p>
                                                    )}

                                                    {/* Rating System - Only show if completed */}
                                                    {activity.isCompleted && (
                                                        <div className="mt-3 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Rate experience:</span>
                                                            <div className="flex gap-1">
                                                                {[1, 2, 3, 4, 5].map((star) => (
                                                                    <button
                                                                        key={star}
                                                                        onClick={() => rateActivity(trip.id, activeDay.id, activity.id, star)}
                                                                        className="focus:outline-none transition-transform hover:scale-110"
                                                                    >
                                                                        <Star
                                                                            className={`w-5 h-5 ${star <= (activity.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300 hover:text-yellow-300'}`}
                                                                        />
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </Reorder.Item>
                                    );
                                })}
                            </Reorder.Group>
                        )}
                    </div>

                    {/* Sidebar - Map & Recommendations */}
                    <div className="lg:col-span-1 space-y-6 sticky top-24 h-fit">
                        {/* Map Widget */}
                        <div className="bg-white dark:bg-slate-800 rounded-3xl p-1 shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden h-64 z-0">
                            <Map activities={allActivities} destination={trip.destination} />
                        </div>

                        {/* Hidden Gems */}
                        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                <Sun className="w-5 h-5 text-yellow-500" />
                                Hidden Gems
                            </h3>
                            <p className="text-sm text-slate-500 mb-4">
                                Unique spots in <strong>{trip.destination}</strong> you shouldn't miss.
                            </p>

                            <div className="space-y-3">
                                {isLoadingGems ? (
                                    <div className="flex justify-center py-4">
                                        <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                                    </div>
                                ) : hiddenGems.length > 0 ? (
                                    hiddenGems.map((gem, i) => (
                                        <div key={i} className="group relative bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors border border-transparent hover:border-primary-200">
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-medium text-slate-800 dark:text-slate-200 text-sm">{gem.title}</h4>
                                                <button
                                                    onClick={() => handleAddGem(gem)}
                                                    className="p-1 rounded-full bg-white dark:bg-slate-600 text-primary-600 hover:scale-110 transition-transform shadow-sm"
                                                    title="Add to Itinerary"
                                                >
                                                    <Plus className="w-3 h-3" />
                                                </button>
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{gem.description}</p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-slate-400 text-center italic">No gems found yet.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Activity Modal */}
            <AnimatePresence>
                {isAddingActivity && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsAddingActivity(false)}
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-lg p-8"
                        >
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">Add Activity</h2>

                            <form onSubmit={handleAddActivity} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Activity Name</label>
                                    <input
                                        type="text"
                                        autoFocus
                                        required
                                        placeholder="e.g. Visit Louvre Museum"
                                        className="input"
                                        value={newActivity.title}
                                        onChange={e => setNewActivity({ ...newActivity, title: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Time</label>
                                        <input
                                            type="time"
                                            required
                                            className="input"
                                            value={newActivity.time}
                                            onChange={e => setNewActivity({ ...newActivity, time: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Type</label>
                                        <select
                                            className="input"
                                            value={newActivity.type}
                                            onChange={e => setNewActivity({ ...newActivity, type: e.target.value })}
                                        >
                                            {ACTIVITY_TYPES.map(type => (
                                                <option key={type.value} value={type.value}>{type.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Location (Optional)</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Rue de Rivoli, Paris"
                                        className="input"
                                        value={newActivity.location}
                                        onChange={e => setNewActivity({ ...newActivity, location: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Notes (Optional)</label>
                                    <textarea
                                        rows="3"
                                        className="input"
                                        placeholder="Ticket price, dress code, etc."
                                        value={newActivity.notes}
                                        onChange={e => setNewActivity({ ...newActivity, notes: e.target.value })}
                                    />
                                </div>

                                <div className="flex gap-3 mt-8">
                                    <button
                                        type="button"
                                        onClick={() => setIsAddingActivity(false)}
                                        className="flex-1 btn bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 btn btn-primary"
                                    >
                                        Add Activity
                                    </button>
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
