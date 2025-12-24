import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Calendar, MapPin, ArrowRight, Trash2, Clock, CheckCircle2, Pin, X } from 'lucide-react';
import useItineraryStore from '../store/itineraryStore';
import { Link } from 'react-router-dom';
import LocationInput from '../components/ui/LocationInput';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';

const Itinerary = () => {
    const { trips, createTrip, deleteTrip, togglePinTrip, setCurrentTrip } = useItineraryStore();
    const [isCreating, setIsCreating] = useState(false);
    const [tripToDelete, setTripToDelete] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedTrips, setSelectedTrips] = useState(new Set()); // Set of IDs

    const toggleSelection = (id) => {
        const newSelected = new Set(selectedTrips);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedTrips(newSelected);
    };

    const handleDeleteSelected = () => {
        if (selectedTrips.size === 0) return;
        selectedTrips.forEach(id => deleteTrip(id));
        setSelectedTrips(new Set());
        setIsEditing(false);
    };

    // Multi-city segment state
    const [segments, setSegments] = useState([{ location: '', days: 3 }]);
    const [startDate, setStartDate] = useState('');
    const [tripMeta, setTripMeta] = useState({
        title: '',
        budget: '',
        currency: 'USD',
        travelers: 1
    });

    const sortedTrips = [...trips].sort((a, b) => {
        if (a.pinned === b.pinned) {
            return new Date(b.createdAt) - new Date(a.createdAt);
        }
        return a.pinned ? -1 : 1;
    });

    const addSegment = () => {
        setSegments([...segments, { location: '', days: 2 }]);
    };

    const removeSegment = (index) => {
        if (segments.length > 1) {
            setSegments(segments.filter((_, i) => i !== index));
        }
    };

    const updateSegment = (index, field, value) => {
        const newSegments = [...segments];
        newSegments[index][field] = field === 'days' ? parseInt(value) || 1 : value;
        setSegments(newSegments);
    };

    const finalizeCreation = () => {
        const totalDuration = segments.reduce((sum, seg) => sum + seg.days, 0);
        const start = new Date(startDate);
        const end = new Date(start);
        end.setDate(start.getDate() + totalDuration - 1);

        createTrip({
            ...tripMeta,
            segments,
            startDate,
            endDate: end.toISOString(),
            duration: totalDuration,
            destination: segments[0].location
        });

        setIsCreating(false);
        setTripMeta({ title: '', budget: '', currency: 'USD', travelers: 1 });
        setSegments([{ location: '', days: 3 }]);
        setStartDate('');
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!tripMeta.title || !startDate || segments.some(s => !s.location)) return;
        finalizeCreation();
    };

    return (
        <div className="min-h-screen pt-24 pb-12 bg-background">
            <div className="container-custom">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-display font-bold text-foreground mb-2">
                            Your Trips
                        </h1>
                        <p className="text-muted-foreground">
                            Manage your upcoming adventures and past memories.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        {isEditing ? (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setIsEditing(false);
                                        setSelectedTrips(new Set());
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={handleDeleteSelected}
                                    disabled={selectedTrips.size === 0}
                                    className="gap-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete ({selectedTrips.size})
                                </Button>
                            </>
                        ) : (
                            <Button
                                variant="outline"
                                onClick={() => setIsEditing(true)}
                            >
                                Edit
                            </Button>
                        )}
                        <Button
                            onClick={() => setIsCreating(true)}
                            className="gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            Plan New Trip
                        </Button>
                    </div>
                </div>

                {sortedTrips.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-20 bg-card rounded-3xl border border-dashed border-border"
                    >
                        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                            <MapPin className="w-10 h-10 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-semibold text-foreground mb-2">
                            No trips planned yet
                        </h3>
                        <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
                            Ready to explore the world? Start planning your next adventure today!
                        </p>
                        <Button
                            variant="ghost"
                            onClick={() => setIsCreating(true)}
                            className="text-primary hover:text-primary/80 hover:bg-primary/10"
                        >
                            Start planning now
                        </Button>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <AnimatePresence>
                            {sortedTrips.map((trip) => (
                                <motion.div
                                    key={trip.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="h-full"
                                >
                                    <Card className={`group relative h-full overflow-hidden hover:shadow-xl transition-all duration-300 ${trip.pinned ? 'border-primary ring-1 ring-primary' : ''}`}>
                                        <div className="h-48 relative overflow-hidden group-hover:h-52 transition-all duration-300">
                                            <img
                                                src={`https://image.pollinations.ai/prompt/famous%20landmark%20view%20of%20${encodeURIComponent(trip.destination)}?width=800&height=600&nologo=true&seed=${trip.id}`}
                                                alt={trip.destination}
                                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                loading="lazy"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                                            {/* Selection Overlay */}
                                            {isEditing && (
                                                <div
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        toggleSelection(trip.id);
                                                    }}
                                                    className="absolute inset-0 z-20 bg-black/20 cursor-pointer flex items-start justify-end p-4"
                                                >
                                                    <div
                                                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedTrips.has(trip.id)
                                                            ? 'bg-primary border-primary text-white'
                                                            : 'bg-white/20 border-white text-transparent hover:bg-white/40'
                                                            }`}
                                                    >
                                                        <CheckCircle2 className="w-4 h-4" />
                                                    </div>
                                                </div>
                                            )}

                                            {/* Actions: Pin & Delete */}
                                            <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        togglePinTrip(trip.id);
                                                    }}
                                                    className={`p-2 backdrop-blur-md rounded-lg transition-colors ${trip.pinned ? 'bg-primary text-primary-foreground' : 'bg-white/20 text-white hover:bg-white/40'}`}
                                                    title={trip.pinned ? "Unpin Trip" : "Pin Trip"}
                                                >
                                                    <Pin className={`w-4 h-4 ${trip.pinned ? 'fill-current' : ''}`} />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setTripToDelete(trip.id);
                                                    }}
                                                    className="p-2 bg-white/20 backdrop-blur-md rounded-lg hover:bg-destructive hover:text-white text-white transition-colors"
                                                    title="Delete Trip"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>

                                            <div className="absolute bottom-4 left-6 z-10">
                                                <h3 className="text-white text-2xl font-bold mb-1 shadow-sm uppercase tracking-wide">
                                                    {trip.destination}
                                                    {trip.segments && trip.segments.length > 1 && (
                                                        <span className="ml-2 text-sm font-normal text-white/80 lowercase capitalize">
                                                            (+{trip.segments.length - 1} more)
                                                        </span>
                                                    )}
                                                </h3>
                                                <div className="flex items-center text-white/90 text-sm gap-1 font-medium">
                                                    <span className="bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded text-xs">
                                                        {trip.title}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <CardContent className="p-6 relative">
                                            {/* Disable link click when editing */}
                                            {isEditing ? (
                                                <div className="absolute inset-0 z-10 cursor-pointer" onClick={() => toggleSelection(trip.id)} />
                                            ) : null}

                                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="w-4 h-4 text-primary" />
                                                    {new Date(trip.start_date || trip.startDate).toLocaleDateString()}
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Clock className="w-4 h-4 text-accent" />
                                                    {trip.days?.length || 0} Days
                                                </div>
                                            </div>

                                            <Link
                                                to={isEditing ? '#' : `/itinerary/${trip.id}`}
                                                onClick={(e) => {
                                                    if (isEditing) {
                                                        e.preventDefault();
                                                    } else {
                                                        setCurrentTrip(trip.id);
                                                    }
                                                }}
                                                className={`inline-flex items-center font-medium transition-all ${isEditing
                                                    ? 'text-muted-foreground cursor-default'
                                                    : 'text-primary hover:gap-2 group-hover:text-primary/80'
                                                    }`}
                                            >
                                                View Itinerary <ArrowRight className="w-4 h-4 ml-1" />
                                            </Link>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}

                {/* Create Trip Modal */}
                <AnimatePresence>
                    {isCreating && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsCreating(false)}
                                className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="relative bg-card rounded-3xl shadow-2xl w-full max-w-xl p-8 overflow-hidden max-h-[90vh] overflow-y-auto border border-border"
                            >
                                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-accent" />

                                <h2 className="text-2xl font-bold text-foreground mb-6">Create New Trip</h2>

                                <form onSubmit={handleCreate} className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-1">Trip Title</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. Euro Trip 2025"
                                            className="input"
                                            value={tripMeta.title}
                                            onChange={e => setTripMeta({ ...tripMeta, title: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-3">Destinations & Schedule</label>
                                        <div className="space-y-3">
                                            {segments.map((segment, index) => (
                                                <div key={index} className="flex gap-3">
                                                    <div className="flex-grow">
                                                        <LocationInput
                                                            value={segment.location}
                                                            onChange={(val) => updateSegment(index, 'location', val)}
                                                            placeholder="City (e.g. Paris)"
                                                            className="w-full"
                                                        />
                                                    </div>
                                                    <div className="w-24">
                                                        <input
                                                            type="number"
                                                            required
                                                            min="1"
                                                            placeholder="Days"
                                                            className="input"
                                                            value={segment.days}
                                                            onChange={e => updateSegment(index, 'days', e.target.value)}
                                                        />
                                                    </div>
                                                    {segments.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeSegment(index)}
                                                            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                                        >
                                                            <X className="w-5 h-5" />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={addSegment}
                                                className="text-sm text-primary font-medium hover:underline flex items-center gap-1"
                                            >
                                                <Plus className="w-4 h-4" /> Add Another Destination
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-1">Start Date</label>
                                            <input
                                                type="date"
                                                required
                                                min={new Date().toISOString().split('T')[0]}
                                                className="input"
                                                value={startDate}
                                                onChange={e => setStartDate(e.target.value)}
                                            />
                                        </div>
                                        <div className="flex flex-col justify-end pb-2">
                                            <div className="text-sm text-muted-foreground">
                                                Total Duration: <span className="font-semibold text-foreground">{segments.reduce((acc, curr) => acc + curr.days, 0)} days</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-1">Travelers</label>
                                        <select
                                            className="input"
                                            value={tripMeta.travelers}
                                            onChange={e => setTripMeta({ ...tripMeta, travelers: parseInt(e.target.value) })}
                                        >
                                            {[1, 2, 3, 4, 5, 6, 7, 8, '9+'].map(num => (
                                                <option key={num} value={num === '9+' ? 9 : num}>
                                                    {num} {num === 1 ? 'Person' : 'People'}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex gap-4 pt-4">
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            onClick={() => setIsCreating(false)}
                                            className="flex-1"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            className="flex-1 gap-2"
                                        >
                                            Create Trip
                                        </Button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Delete Confirmation Modal */}
                <AnimatePresence>
                    {tripToDelete && (
                        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setTripToDelete(null)}
                                className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="relative bg-card rounded-2xl shadow-2xl w-full max-w-md p-6 overflow-hidden border border-border"
                            >
                                <div className="text-center">
                                    <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Trash2 className="w-6 h-6 text-destructive" />
                                    </div>
                                    <h3 className="text-xl font-bold text-foreground mb-2">Delete Trip?</h3>
                                    <p className="text-muted-foreground mb-6">
                                        Are you sure you want to delete this trip? This action cannot be undone.
                                    </p>
                                    <div className="flex gap-3 justify-center">
                                        <Button
                                            variant="ghost"
                                            onClick={() => setTripToDelete(null)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            onClick={() => {
                                                deleteTrip(tripToDelete);
                                                setTripToDelete(null);
                                            }}
                                            className="shadow-lg shadow-destructive/20"
                                        >
                                            Delete Trip
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Itinerary;
