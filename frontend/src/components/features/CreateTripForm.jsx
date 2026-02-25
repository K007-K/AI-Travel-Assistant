import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MapPin, Calendar, Users,
    Compass, Mountain, Briefcase, Palmtree,
    ChevronRight, ChevronLeft, X, Plus, Trash2,
    Wallet, TrendingUp, Crown
} from 'lucide-react';
import LocationInput from '../ui/LocationInput';
import { getCurrencyForDestination } from '../../utils/currencyMap';
import { Button } from '../ui/Button';
import { deriveTripConstraints } from '../../utils/tripDefaults';
import { planTripDuration } from '../../engine/tripDurationPlanner';
import DurationModal from '../ui/DurationModal';

// ─── 4 Travel Styles ───
const TRAVEL_STYLES = [
    { id: 'relax', label: 'Relax', icon: Palmtree, color: 'from-teal-500 to-cyan-500', desc: 'Spa, beaches & comfort' },
    { id: 'explore', label: 'Explore', icon: Compass, color: 'from-blue-500 to-indigo-500', desc: 'Culture & sightseeing' },
    { id: 'adventure', label: 'Adventure', icon: Mountain, color: 'from-orange-500 to-amber-500', desc: 'Outdoors & thrills' },
    { id: 'business', label: 'Business', icon: Briefcase, color: 'from-slate-500 to-gray-600', desc: 'Efficient & central' },
];

// ─── 3 Budget Tiers ───
const BUDGET_TIERS = [
    { id: 'low', label: 'Budget', icon: Wallet, color: 'from-green-500 to-emerald-500', desc: 'Hostels, street food, public transport', tag: 'Best value' },
    { id: 'mid', label: 'Comfort', icon: TrendingUp, color: 'from-blue-500 to-violet-500', desc: '3-4★ hotels, good dining, mixed transport', tag: 'Most popular' },
    { id: 'high', label: 'Premium', icon: Crown, color: 'from-amber-500 to-yellow-500', desc: '5★ resorts, fine dining, private transport', tag: 'Luxury' },
];

// ─── Currency options ───
const CURRENCIES = [
    { code: 'USD', label: 'USD $' },
    { code: 'EUR', label: 'EUR €' },
    { code: 'GBP', label: 'GBP £' },
    { code: 'INR', label: 'INR ₹' },
    { code: 'JPY', label: 'JPY ¥' },
    { code: 'AUD', label: 'AUD $' },
    { code: 'CAD', label: 'CAD $' },
];

const CreateTripForm = ({ onSubmit, onCancel, initialDestination }) => {
    const [step, setStep] = useState(0); // 0: Basics, 1: Budget & Review
    const [errors, setErrors] = useState({});
    const [durationResult, setDurationResult] = useState(null);
    const [isCheckingDuration, setIsCheckingDuration] = useState(false);

    const [form, setForm] = useState({
        title: initialDestination ? `Trip to ${initialDestination}` : '',
        travel_style: '',
        start_location: '',
        return_location: '',
        return_same: true,
        segments: [{ location: initialDestination || '', days: 3 }],
        startDate: '',
        travelers: 1,
        budget_tier: '',
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
        }
        if (s === 1) {
            if (!form.budget_tier) e.budget_tier = 'Choose a budget tier';
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleNext = () => {
        if (validateStep(step)) setStep(step + 1);
    };

    const buildTripData = (overrideDays = null) => {
        // Segments stay EXACTLY as user requested (exploration days only)
        // The orchestrator's timeline builder handles TRAVEL day insertion
        const segments = form.segments;
        const totalDuration = overrideDays || segments.reduce((s, seg) => s + seg.days, 0);

        let startDate = form.startDate || null;
        let endDate = null;
        if (startDate) {
            const start = new Date(startDate);
            const end = new Date(start);
            end.setDate(start.getDate() + totalDuration - 1);
            endDate = end.toISOString();
        }

        const tripForDerivation = {
            budget_tier: form.budget_tier,
            travel_style: form.travel_style,
            currency: form.currency,
            travelers: form.travelers,
            segments,
            start_location: form.start_location,
            destination: form.segments[0].location,
        };
        const derived = deriveTripConstraints(tripForDerivation);

        return {
            title: form.title.trim(),
            travel_style: form.travel_style,
            budget_tier: form.budget_tier,
            start_location: form.start_location.trim(),
            return_location: form.return_same ? form.start_location.trim() : form.return_location.trim(),
            segments,
            startDate,
            endDate,
            duration: totalDuration,
            destination: form.segments[0].location,
            travelers: form.travelers,
            currency: form.currency,
            budget: derived.budget,
            travel_preference: derived.travel_preference,
            accommodation_preference: derived.accommodation_preference,
            own_vehicle_type: derived.own_vehicle_type,
            autoExpanded: overrideDays ? true : false,
        };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateStep(1)) return;

        const returnLoc = form.return_same ? form.start_location : form.return_location;

        // ── Duration feasibility check (async — uses OSRM for real times) ──
        setIsCheckingDuration(true);
        try {
            const result = await planTripDuration({
                startLocation: form.start_location.trim(),
                returnLocation: (returnLoc || '').trim(),
                destinations: form.segments.map(s => ({ location: s.location, days: s.days })),
                requestedDays: form.segments.reduce((s, seg) => s + seg.days, 0),
            });

            if (!result.feasible) {
                setDurationResult(result);
                return;
            }

            // Feasible — submit directly
            onSubmit(buildTripData());
        } catch (err) {
            console.error('[DurationCheck] Failed:', err);
            // On error, submit anyway (don't block the user)
            onSubmit(buildTripData());
        } finally {
            setIsCheckingDuration(false);
        }
    };

    const handleDurationConfirm = (suggestedDays) => {
        setDurationResult(null);
        onSubmit(buildTripData(suggestedDays));
    };

    const handleDurationEdit = () => {
        setDurationResult(null);
        setStep(0);
    };

    const handleDurationCancel = () => {
        setDurationResult(null);
    };

    const totalDays = form.segments.reduce((s, seg) => s + seg.days, 0);

    // Budget preview
    const budgetPreview = form.budget_tier ? deriveTripConstraints({
        budget_tier: form.budget_tier,
        travel_style: form.travel_style || 'explore',
        currency: form.currency,
        travelers: form.travelers,
        segments: form.segments,
        start_location: form.start_location,
        destination: form.segments[0]?.location || '',
    }) : null;

    // ─── Step labels ───
    const steps = ['Trip Details', 'Budget & Review'];

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
                    {/* ═══════════ STEP 0: Trip Details ═══════════ */}
                    {step === 0 && (
                        <motion.div key="basics" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} className="space-y-6">

                            {/* Travel Style — 4 options */}
                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-3">
                                    Travel Style <span className="text-red-500">*</span>
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                                    placeholder="e.g. Summer in Goa"
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
                                        <Calendar className="w-4 h-4 inline mr-1" />Start Date
                                    </label>
                                    <input
                                        type="date"
                                        value={form.startDate}
                                        onChange={e => update('startDate', e.target.value)}
                                        min={new Date().toISOString().split('T')[0]}
                                        className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                    />
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

                    {/* ═══════════ STEP 1: Budget & Review ═══════════ */}
                    {step === 1 && (
                        <motion.div key="budget" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} className="space-y-6">

                            {/* Budget Tier */}
                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-3">
                                    Budget Tier <span className="text-red-500">*</span>
                                </label>
                                <div className="grid grid-cols-3 gap-4">
                                    {BUDGET_TIERS.map(bt => (
                                        <button
                                            key={bt.id}
                                            type="button"
                                            onClick={() => update('budget_tier', bt.id)}
                                            className={`relative p-5 rounded-2xl border-2 transition-all text-left group ${form.budget_tier === bt.id
                                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-lg shadow-primary-500/20'
                                                : 'border-border hover:border-primary-300 hover:shadow-md'
                                                }`}
                                        >
                                            {/* Tag */}
                                            <span className={`absolute -top-2.5 right-3 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full ${form.budget_tier === bt.id
                                                ? 'bg-primary-500 text-white'
                                                : 'bg-muted text-muted-foreground'
                                                }`}>
                                                {bt.tag}
                                            </span>

                                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${bt.color} flex items-center justify-center mb-3`}>
                                                <bt.icon className="w-5 h-5 text-white" />
                                            </div>
                                            <p className="text-base font-bold text-foreground">{bt.label}</p>
                                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{bt.desc}</p>
                                        </button>
                                    ))}
                                </div>
                                {errors.budget_tier && <p className="text-red-500 text-xs mt-1">{errors.budget_tier}</p>}
                            </div>

                            {/* Currency selector */}
                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-2">
                                    Currency
                                </label>
                                <select
                                    value={form.currency}
                                    onChange={e => update('currency', e.target.value)}
                                    className="px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-primary-500 outline-none w-40"
                                >
                                    {CURRENCIES.map(c => (
                                        <option key={c.code} value={c.code}>{c.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* AI-estimated budget preview */}
                            {budgetPreview && (
                                <div className="bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 rounded-2xl p-5 border border-primary-200 dark:border-primary-800">
                                    <p className="text-xs font-semibold text-primary-600 uppercase tracking-wider mb-2">Estimated Budget</p>
                                    <p className="text-2xl font-bold text-foreground">
                                        {form.currency} {budgetPreview.budget.toLocaleString()}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        ~{form.currency} {budgetPreview.budget_per_day.toLocaleString()}/day · {form.travelers} traveler{form.travelers > 1 ? 's' : ''} · {totalDays} days · Includes 12% buffer
                                    </p>
                                </div>
                            )}

                            {/* Review summary */}
                            <div className="bg-muted/30 rounded-2xl p-6 space-y-4">
                                <h3 className="text-lg font-bold text-foreground">Trip Summary</h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div><span className="text-muted-foreground">Title:</span> <span className="text-foreground font-medium">{form.title || '—'}</span></div>
                                    <div><span className="text-muted-foreground">Style:</span> <span className="text-foreground font-medium capitalize">{form.travel_style || '—'}</span></div>
                                    <div><span className="text-muted-foreground">From:</span> <span className="text-foreground font-medium">{form.start_location || '—'}</span></div>
                                    <div><span className="text-muted-foreground">Return:</span> <span className="text-foreground font-medium">{form.return_same ? form.start_location || '—' : form.return_location || '—'}</span></div>
                                    <div><span className="text-muted-foreground">Duration:</span> <span className="text-foreground font-medium">{totalDays} days</span></div>
                                    <div><span className="text-muted-foreground">Travelers:</span> <span className="text-foreground font-medium">{form.travelers}</span></div>
                                    <div><span className="text-muted-foreground">Budget:</span> <span className="text-foreground font-medium capitalize">{form.budget_tier ? BUDGET_TIERS.find(b => b.id === form.budget_tier)?.label : '—'}</span></div>
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
                        {step < 1 ? (
                            <Button type="button" onClick={handleNext} className="gap-2">
                                Next <ChevronRight className="w-4 h-4" />
                            </Button>
                        ) : (
                            <Button
                                type="submit"
                                disabled={isCheckingDuration}
                                className="gap-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800"
                            >
                                {isCheckingDuration ? 'Checking routes…' : 'Create Trip'} <ChevronRight className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                </div>
            </form>

            {/* Duration Feasibility Modal */}
            <AnimatePresence>
                {durationResult && !durationResult.feasible && (
                    <DurationModal
                        result={durationResult}
                        onConfirm={handleDurationConfirm}
                        onEdit={handleDurationEdit}
                        onCancel={handleDurationCancel}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default CreateTripForm;
