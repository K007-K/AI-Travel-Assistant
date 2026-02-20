import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Calendar, MapPin, ArrowRight, Trash2, Clock, CheckCircle2, Pin, X } from 'lucide-react';
import useTripStore from '../store/tripStore';
import { Link, useSearchParams } from 'react-router-dom';
import { getFallbackImage, loadDestinationImage } from '../utils/destinationImages';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import CreateTripForm from '../components/features/CreateTripForm';

/** Dynamic image component that fetches real photos from Wikipedia */
const TripCardImage = ({ destination, className }) => {
    const [imgUrl, setImgUrl] = useState(() => getFallbackImage(destination));

    useEffect(() => {
        loadDestinationImage(destination, setImgUrl);
    }, [destination]);

    return (
        <img
            src={imgUrl}
            alt={destination}
            className={className}
            loading="lazy"
        />
    );
};

const Itinerary = () => {
    const { trips, createTrip, deleteTrip, togglePinTrip, setCurrentTrip, fetchTrips, isLoading } = useTripStore();

    useEffect(() => {
        fetchTrips();
    }, [fetchTrips]);
    const [isCreating, setIsCreating] = useState(false);
    const [tripToDelete, setTripToDelete] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedTrips, setSelectedTrips] = useState(new Set());
    const [searchParams, setSearchParams] = useSearchParams();
    const [initialDestination, setInitialDestination] = useState(null);

    // Auto-open create form if ?destination= query param is present
    useEffect(() => {
        const dest = searchParams.get('destination');
        if (dest) {
            setInitialDestination(dest);
            setIsCreating(true);
            setSearchParams({}, { replace: true });
        }
    }, [searchParams, setSearchParams]);

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

    const sortedTrips = [...trips].sort((a, b) => {
        if (a.pinned === b.pinned) {
            return new Date(b.createdAt) - new Date(a.createdAt);
        }
        return a.pinned ? -1 : 1;
    });

    const handleTripSubmit = async (tripData) => {
        await createTrip(tripData);
        setIsCreating(false);
    };

    return (
        <div className="min-h-screen pt-24 pb-12 bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
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

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-card rounded-2xl border border-border overflow-hidden animate-pulse">
                                <div className="h-48 bg-muted" />
                                <div className="p-6 space-y-3">
                                    <div className="h-4 bg-muted rounded w-2/3" />
                                    <div className="h-3 bg-muted rounded w-1/3" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : sortedTrips.length === 0 ? (
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
                                            <TripCardImage
                                                destination={trip.destination}
                                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
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
                                className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto"
                            >
                                <CreateTripForm
                                    onSubmit={handleTripSubmit}
                                    onCancel={() => { setIsCreating(false); setInitialDestination(null); }}
                                    initialDestination={initialDestination}
                                />
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
