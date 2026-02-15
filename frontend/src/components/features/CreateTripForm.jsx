import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Car, Bike, MapPin, Calendar, Users, DollarSign,
    Plane, Train, Bus, Shuffle, Hotel,
    Mountain, Building2, Gem, Backpack, Briefcase,
    ChevronRight, ChevronLeft, X, Plus, Trash2
} from 'lucide-react';
import LocationInput from '../ui/LocationInput';
import { getCurrencyForDestination } from '../../utils/currencyMap';
import { Button } from '../ui/Button';

// ─── Travel style definitions ───
const TRAVEL_STYLES = [
    { id: 'road_trip', label: 'Road Trip', icon: Car, color: 'from-amber-500 to-orange-500', desc: 'Scenic routes & stops' },
    { id: 'city_exploration', label: 'City Explorer', icon: Building2, color: 'from-blue-500 to-indigo-500', desc: 'Urban & cultural' },
    { id: 'luxury_escape', label: 'Luxury Escape', icon: Gem, color: 'from-purple-500 to-pink-500', desc: 'Premium & exclusive' },
    { id: 'backpacking', label: 'Backpacking', icon: Backpack, color: 'from-green-500 to-teal-500', desc: 'Budget & adventure' },
    { id: 'business_travel', label: 'Business', icon: Briefcase, color: 'from-slate-500 to-gray-600', desc: 'Efficient & central' },
];

const TRAVEL_PREFS = [
    { id: 'any', label: 'Any', icon: Shuffle },
    { id: 'flight', label: 'Flight', icon: Plane },
    { id: 'train', label: 'Train', icon: Train },
    { id: 'bus', label: 'Bus', icon: Bus },
];

const ACCOM_PREFS = [
    { id: 'budget', label: 'Budget', desc: 'Hostels & basic hotels' },
    { id: 'mid-range', label: 'Mid-Range', desc: '3-4 star hotels' },
    { id: 'luxury', label: 'Luxury', desc: '5-star & resorts' },
];

const VEHICLE_OPTS = [
    { id: 'none', label: 'None', icon: null },
    { id: 'car', label: 'Car', icon: Car },
    { id: 'bike', label: 'Bike', icon: Bike },
];

const CreateTripForm = ({ onSubmit, onCancel, initialDestination }) => {
    const [step, setStep] = useState(0); // 0: Basics, 1: Constraints, 2: Budget
    const [errors, setErrors] = useState({});

    const [form, setForm] = useState({
        title: initialDestination ? `Trip to ${initialDestination}` : '',
        travel_style: '',
        start_location: '',
        return_location: '',
        return_same: true,
        segments: [{ location: initialDestination || '', days: 3 }],
        startDate: '',
        travelers: 1,
        travel_preference: 'any',
        accommodation_preference: 'mid-range',
        own_vehicle_type: 'none',
        budget: '',
        currency: initialDestination ? getCurrencyForDestination(initialDestination) : 'USD',
    });

    const update = (key, val) => {
        setForm(prev => ({ ...prev, [key]: val }));
        setErrors(prev => ({ ...prev, [key]: undefined }));
    };

    // ─── Segments ───
    const addSegment = () => {
        update('segments', [...form.segments, { location: '', days: 2 }]);
    };

    const removeSegment = (idx) => {
        if (form.segments.length > 1) {
            update('segments', form.segments.filter((_, i) => i !== idx));
        }
    };

    const updateSegment = (idx, field, value) => {
        const next = [...form.segments];
        next[idx] = { ...next[idx], [field]: field === 'days' ? Math.max(1, parseInt(value) || 1) : value };
        update('segments', next);

        // Auto-detect currency from first destination
        if (field === 'location' && idx === 0 && value) {
            update('currency', getCurrencyForDestination(value));
        }
    };

    // ─── Validation ───
    const validateStep = (s) => {
        const e = {};
        if (s === 0) {
            if (!form.title.trim()) e.title = 'Trip title is required';
            if (!form.travel_style) e.travel_style = 'Choose a travel style';
            if (!form.start_location.trim()) e.start_location = 'Start location is required';
            if (form.segments.some(seg => !seg.location.trim())) e.segments = 'All destinations must be filled';
            if (!form.startDate) e.startDate = 'Start date is required';
        }
        if (s === 2) {
            if (!form.budget || parseFloat(form.budget) <= 0) e.budget = 'Budget must be greater than 0';
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleNext = () => {
        if (validateStep(step)) setStep(step + 1);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validateStep(2)) return;

        const totalDuration = form.segments.reduce((s, seg) => s + seg.days, 0);
        const start = new Date(form.startDate);
        const end = new Date(start);
        end.setDate(start.getDate() + totalDuration - 1);

        onSubmit({
            title: form.title.trim(),
            travel_style: form.travel_style,
            start_location: form.start_location.trim(),
            return_location: form.return_same ? form.start_location.trim() : form.return_location.trim(),
            segments: form.segments,
            startDate: form.startDate,
            endDate: end.toISOString(),
            duration: totalDuration,
            destination: form.segments[0].location,
            travelers: form.travelers,
            travel_preference: form.travel_preference,
            accommodation_preference: form.accommodation_preference,
            own_vehicle_type: form.own_vehicle_type,
            budget: parseFloat(form.budget),
            currency: form.currency,
        });
    };

    const totalDays = form.segments.reduce((s, seg) => s + seg.days, 0);

    // ─── Step indicator ───
    const steps = ['Trip Basics', 'Travel Constraints', 'Budget & Review'];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-card border border-border rounded-3xl shadow-xl overflow-hidden"
        >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-8 py-6 flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Plan New Trip</h2>
                    <p className="text-white/70 text-sm mt-1">{steps[step]}</p>
                </div>
                <button onClick={onCancel} className="text-white/60 hover:text-white transition-colors">
                    <X className="w-6 h-6" />
                </button>
            </div>

            {/* Step indicator */}
            <div className="flex px-8 pt-6 gap-2">
                {steps.map((label, i) => (
                    <div key={i} className="flex-1">
                        <div className={`h-1.5 rounded-full transition-all duration-300 ${i <= step ? 'bg-primary-500' : 'bg-muted'}`} />
                        <p className={`text-xs mt-1.5 ${i <= step ? 'text-primary-600 font-medium' : 'text-muted-foreground'}`}>
                            {label}
                        </p>
                    </div>
                ))}
            </div>

            <form onSubmit={handleSubmit} className="p-8">
                <AnimatePresence mode="wait">
                    {/* ═══════════ STEP 0: Trip Basics ═══════════ */}
                    {step === 0 && (
                        <motion.div key="basics" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} className="space-y-6">

                            {/* Travel Style */}
                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-3">
                                    Travel Style <span className="text-red-500">*</span>
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                    {TRAVEL_STYLES.map(ts => (
                                        <button
                                            key={ts.id}
                                            type="button"
                                            onClick={() => update('travel_style', ts.id)}
                                            className={`relative p-4 rounded-2xl border-2 transition-all text-center group ${form.travel_style === ts.id
                                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-lg shadow-primary-500/20'
                                                : 'border-border hover:border-primary-300 hover:shadow-md'
                                                }`}
                                        >
                                            <div className={`w-10 h-10 mx-auto rounded-xl bg-gradient-to-br ${ts.color} flex items-center justify-center mb-2`}>
                                                <ts.icon className="w-5 h-5 text-white" />
                                            </div>
                                            <p className="text-sm font-bold text-foreground">{ts.label}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">{ts.desc}</p>
                                        </button>
                                    ))}
                                </div>
                                {errors.travel_style && <p className="text-red-500 text-xs mt-1">{errors.travel_style}</p>}
                            </div>

                            {/* Title */}
                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-2">
                                    Trip Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={form.title}
                                    onChange={e => update('title', e.target.value)}
                                    placeholder="e.g. Summer Road Trip to Goa"
                                    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                                />
                                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
                            </div>

                            {/* Start & Return Location */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-foreground mb-2">
                                        <MapPin className="w-4 h-4 inline mr-1" />Start Location <span className="text-red-500">*</span>
                                    </label>
                                    <LocationInput
                                        value={form.start_location}
                                        onChange={val => update('start_location', val)}
                                        placeholder="Where are you starting from?"
                                    />
                                    {errors.start_location && <p className="text-red-500 text-xs mt-1">{errors.start_location}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-foreground mb-2">
                                        <MapPin className="w-4 h-4 inline mr-1" />Return Location
                                    </label>
                                    <div className="flex items-center gap-2 mb-2">
                                        <input
                                            type="checkbox"
                                            checked={form.return_same}
                                            onChange={e => update('return_same', e.target.checked)}
                                            className="rounded border-border text-primary-500 focus:ring-primary-500"
                                        />
                                        <span className="text-xs text-muted-foreground">Same as start</span>
                                    </div>
                                    {!form.return_same && (
                                        <LocationInput
                                            value={form.return_location}
                                            onChange={val => update('return_location', val)}
                                            placeholder="Where do you return to?"
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Destinations (multi-segment) */}
                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-2">
                                    Destinations <span className="text-red-500">*</span>
                                </label>
                                <div className="space-y-3">
                                    {form.segments.map((seg, idx) => (
                                        <div key={idx} className="flex gap-3 items-start">
                                            <div className="flex-1">
                                                <LocationInput
                                                    value={seg.location}
                                                    onChange={val => updateSegment(idx, 'location', val)}
                                                    placeholder={`Destination ${idx + 1}`}
                                                />
                                            </div>
                                            <div className="w-24">
                                                <div className="flex items-center gap-1 px-3 py-2.5 rounded-xl border border-border bg-background">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max="30"
                                                        value={seg.days}
                                                        onChange={e => updateSegment(idx, 'days', e.target.value)}
                                                        className="w-full bg-transparent text-foreground text-center outline-none text-sm font-medium"
                                                    />
                                                    <span className="text-xs text-muted-foreground">days</span>
                                                </div>
                                            </div>
                                            {form.segments.length > 1 && (
                                                <button type="button" onClick={() => removeSegment(idx)} className="p-2.5 text-muted-foreground hover:text-red-500 transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <button
                                    type="button"
                                    onClick={addSegment}
                                    className="mt-3 flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
                                >
                                    <Plus className="w-4 h-4" /> Add destination
                                </button>
                                {errors.segments && <p className="text-red-500 text-xs mt-1">{errors.segments}</p>}
                            </div>

                            {/* Start Date & Travelers */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-foreground mb-2">
                                        <Calendar className="w-4 h-4 inline mr-1" />Start Date <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={form.startDate}
                                        onChange={e => update('startDate', e.target.value)}
                                        min={new Date().toISOString().split('T')[0]}
                                        className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                    />
                                    {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-foreground mb-2">
                                        <Users className="w-4 h-4 inline mr-1" />Travelers
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="20"
                                        value={form.travelers}
                                        onChange={e => update('travelers', Math.max(1, parseInt(e.target.value) || 1))}
                                        className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                    />
                                </div>
                            </div>

                            {/* Trip summary pill */}
                            {totalDays > 0 && form.segments[0].location && (
                                <div className="bg-muted/50 rounded-xl px-4 py-3 flex items-center gap-3 text-sm">
                                    <Calendar className="w-4 h-4 text-primary-500" />
                                    <span className="text-foreground font-medium">
                                        {totalDays} day{totalDays > 1 ? 's' : ''} · {form.segments.length} destination{form.segments.length > 1 ? 's' : ''}
                                    </span>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* ═══════════ STEP 1: Travel Constraints ═══════════ */}
                    {step === 1 && (
                        <motion.div key="constraints" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} className="space-y-6">

                            {/* Travel Preference */}
                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-3">
                                    Travel Preference
                                </label>
                                <div className="grid grid-cols-4 gap-3">
                                    {TRAVEL_PREFS.map(tp => (
                                        <button
                                            key={tp.id}
                                            type="button"
                                            onClick={() => update('travel_preference', tp.id)}
                                            className={`p-4 rounded-2xl border-2 transition-all text-center ${form.travel_preference === tp.id
                                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                                : 'border-border hover:border-primary-300'
                                                }`}
                                        >
                                            <tp.icon className={`w-6 h-6 mx-auto mb-2 ${form.travel_preference === tp.id ? 'text-primary-600' : 'text-muted-foreground'}`} />
                                            <p className="text-sm font-bold text-foreground">{tp.label}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Accommodation Preference */}
                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-3">
                                    <Hotel className="w-4 h-4 inline mr-1" />Accommodation
                                </label>
                                <div className="grid grid-cols-3 gap-3">
                                    {ACCOM_PREFS.map(ap => (
                                        <button
                                            key={ap.id}
                                            type="button"
                                            onClick={() => update('accommodation_preference', ap.id)}
                                            className={`p-4 rounded-2xl border-2 transition-all text-left ${form.accommodation_preference === ap.id
                                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                                : 'border-border hover:border-primary-300'
                                                }`}
                                        >
                                            <p className="text-sm font-bold text-foreground">{ap.label}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">{ap.desc}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Own Vehicle */}
                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-3">
                                    Own Vehicle Available?
                                </label>
                                <div className="flex gap-3">
                                    {VEHICLE_OPTS.map(vo => (
                                        <button
                                            key={vo.id}
                                            type="button"
                                            onClick={() => update('own_vehicle_type', vo.id)}
                                            className={`flex-1 p-4 rounded-2xl border-2 transition-all text-center ${form.own_vehicle_type === vo.id
                                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                                : 'border-border hover:border-primary-300'
                                                }`}
                                        >
                                            {vo.icon && <vo.icon className={`w-6 h-6 mx-auto mb-2 ${form.own_vehicle_type === vo.id ? 'text-primary-600' : 'text-muted-foreground'}`} />}
                                            <p className="text-sm font-bold text-foreground">{vo.label}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Constraint summary */}
                            <div className="bg-muted/50 rounded-xl px-4 py-3 text-sm text-muted-foreground">
                                <span className="font-medium text-foreground">Constraints: </span>
                                {TRAVEL_PREFS.find(t => t.id === form.travel_preference)?.label} transport · {ACCOM_PREFS.find(a => a.id === form.accommodation_preference)?.label} stays
                                {form.own_vehicle_type !== 'none' && ` · Own ${form.own_vehicle_type}`}
                            </div>
                        </motion.div>
                    )}

                    {/* ═══════════ STEP 2: Budget & Review ═══════════ */}
                    {step === 2 && (
                        <motion.div key="budget" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} className="space-y-6">

                            {/* Budget */}
                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-2">
                                    <DollarSign className="w-4 h-4 inline mr-1" />Total Budget <span className="text-red-500">*</span>
                                </label>
                                <div className="flex gap-3">
                                    <select
                                        value={form.currency}
                                        onChange={e => update('currency', e.target.value)}
                                        className="px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-primary-500 outline-none w-28"
                                    >
                                        <option value="USD">USD $</option>
                                        <option value="EUR">EUR €</option>
                                        <option value="GBP">GBP £</option>
                                        <option value="INR">INR ₹</option>
                                        <option value="JPY">JPY ¥</option>
                                        <option value="AUD">AUD $</option>
                                        <option value="CAD">CAD $</option>
                                    </select>
                                    <input
                                        type="number"
                                        min="1"
                                        value={form.budget}
                                        onChange={e => update('budget', e.target.value)}
                                        placeholder="Total trip budget"
                                        className="flex-1 px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary-500 outline-none"
                                    />
                                </div>
                                {errors.budget && <p className="text-red-500 text-xs mt-1">{errors.budget}</p>}
                                {form.budget > 0 && totalDays > 0 && (
                                    <p className="text-xs text-muted-foreground mt-2">
                                        ≈ {form.currency} {Math.round(form.budget / totalDays).toLocaleString()} per day · {form.currency} {Math.round(form.budget / totalDays / form.travelers).toLocaleString()} per day per person
                                    </p>
                                )}
                            </div>

                            {/* Review summary */}
                            <div className="bg-muted/30 rounded-2xl p-6 space-y-4">
                                <h3 className="text-lg font-bold text-foreground">Trip Summary</h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div><span className="text-muted-foreground">Title:</span> <span className="text-foreground font-medium">{form.title || '—'}</span></div>
                                    <div><span className="text-muted-foreground">Style:</span> <span className="text-foreground font-medium capitalize">{form.travel_style?.replace('_', ' ') || '—'}</span></div>
                                    <div><span className="text-muted-foreground">From:</span> <span className="text-foreground font-medium">{form.start_location || '—'}</span></div>
                                    <div><span className="text-muted-foreground">Return:</span> <span className="text-foreground font-medium">{form.return_same ? form.start_location || '—' : form.return_location || '—'}</span></div>
                                    <div><span className="text-muted-foreground">Duration:</span> <span className="text-foreground font-medium">{totalDays} days</span></div>
                                    <div><span className="text-muted-foreground">Travelers:</span> <span className="text-foreground font-medium">{form.travelers}</span></div>
                                    <div><span className="text-muted-foreground">Transport:</span> <span className="text-foreground font-medium capitalize">{form.travel_preference}</span></div>
                                    <div><span className="text-muted-foreground">Stay:</span> <span className="text-foreground font-medium capitalize">{form.accommodation_preference}</span></div>
                                    {form.own_vehicle_type !== 'none' && (
                                        <div><span className="text-muted-foreground">Vehicle:</span> <span className="text-foreground font-medium capitalize">{form.own_vehicle_type}</span></div>
                                    )}
                                </div>

                                {/* Destinations list */}
                                <div className="pt-3 border-t border-border">
                                    <p className="text-sm text-muted-foreground mb-2">Destinations:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {form.segments.map((seg, i) => (
                                            <span key={i} className="px-3 py-1.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-lg text-xs font-medium">
                                                {seg.location || '—'} · {seg.days}d
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Navigation buttons */}
                <div className="flex justify-between items-center mt-8 pt-6 border-t border-border">
                    <div>
                        {step > 0 && (
                            <Button type="button" variant="outline" onClick={() => setStep(step - 1)} className="gap-2">
                                <ChevronLeft className="w-4 h-4" /> Back
                            </Button>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
                        {step < 2 ? (
                            <Button type="button" onClick={handleNext} className="gap-2">
                                Next <ChevronRight className="w-4 h-4" />
                            </Button>
                        ) : (
                            <Button type="submit" className="gap-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800">
                                Create Trip <ChevronRight className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                </div>
            </form>
        </motion.div>
    );
};

export default CreateTripForm;
