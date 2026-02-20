import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, CreditCard, User, Shield, Coffee, ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import useBookingStore from '../store/bookingStore';
import useTripStore from '../store/tripStore';
import useBudgetStore from '../store/budgetStore';
import DemoBanner from '../components/ui/DemoBanner';

const BookingReview = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { addBooking } = useBookingStore();
    const { trips } = useTripStore();
    const { fetchBudgetSummary, budgetSummary } = useBudgetStore();
    const bookingData = location.state?.bookingData;
    const currency = location.state?.currency || { code: 'USD', symbol: '$', rate: 1 };

    // Trip linking state
    const [selectedTripId, setSelectedTripId] = useState('');

    // Fetch budget summary when a trip is selected
    useEffect(() => {
        if (selectedTripId) {
            fetchBudgetSummary(selectedTripId);
        }
    }, [selectedTripId, fetchBudgetSummary]);

    // Compute budget impact
    const bookingTotal = bookingData ? (bookingData.price || 0) : 0;
    const tripBudget = budgetSummary?.total_budget || 0;
    const tripSpent = budgetSummary?.total_spent || 0;
    const afterBooking = tripSpent + bookingTotal;
    const afterBookingPct = tripBudget > 0 ? Math.round((afterBooking / tripBudget) * 100 * 10) / 10 : 0;
    const willOverspend = tripBudget > 0 && afterBooking > tripBudget;
    const bookingPct = tripBudget > 0 ? Math.round((bookingTotal / tripBudget) * 100 * 10) / 10 : 0;

    // Redirect if no data
    if (!bookingData) {
        return (
            <div className="min-h-screen flex items-center justify-center pt-20">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">No booking selected</h2>
                    <button onClick={() => navigate('/bookings')} className="btn btn-primary">Go Back</button>
                </div>
            </div>
        );
    }

    const [step, setStep] = useState(1); // 1: Review, 2: Travelers, 3: Payment
    const [isProcessing, setIsProcessing] = useState(false);

    // Form State
    const [traveler, setTraveler] = useState({
        firstName: '', lastName: '', email: '', phone: '', age: ''
    });
    const [addons, setAddons] = useState({ insurance: false, meal: false });

    // Constants
    const insurancePrice = 15; // USD base
    const mealPrice = 10; // USD base

    const calculateTotal = () => {
        // STRICTLY use the 'price' passed from the previous screen which is already
        // in the correct currency and unit (e.g. INR value).
        // Do NOT use basePrice here as it's likely USD and will cause mismatch.
        let total = bookingData.price;

        let extras = 0;
        if (addons.insurance) extras += Math.round(insurancePrice * currency.rate);
        if (addons.meal) extras += Math.round(mealPrice * currency.rate);

        return total + extras;
    };

    const handleConfirm = async () => {
        setIsProcessing(true);

        // Simulate Payment Gateway
        await new Promise(resolve => setTimeout(resolve, 2000));

        const finalBooking = {
            ...bookingData,
            traveler,
            addons,
            // Store the FINAL detailed total (Base + Extras)
            // But 'price' in DB usually means the base or total? 
            // Let's store total in a new field if needed, but 'price' column is standard.
            // We should overwrite 'price' with the explicit TOTAL paid.
            price: calculateTotal(), // Final Total Paid
            totalPrice: calculateTotal(), // Redundant but clear
            currency: currency.code,
            date: new Date().toISOString(),
            status: 'confirmed'
        };

        addBooking({ ...finalBooking, tripId: selectedTripId || null });
        setIsProcessing(false);
        setStep(4); // Success
    };

    const formatPrice = (amount) => `${currency.symbol}${amount.toLocaleString()}`;

    return (
        <div className="min-h-screen pt-24 pb-12 bg-slate-50 dark:bg-[#0a0a0a] px-4">
            <div className="max-w-3xl mx-auto">
                <DemoBanner message="Demo Mode – No real payments are processed. Card details are not stored." />
                {/* Stepper */}
                <div className="flex items-center justify-between mb-8 max-w-xl mx-auto">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= s ? 'bg-primary-600 text-white' : 'bg-slate-200 text-slate-500'
                                }`}>
                                {s}
                            </div>
                            {s < 3 && <div className={`w-16 h-1 bg-slate-200 mx-2 ${step > s ? 'bg-primary-600' : ''}`} />}
                        </div>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {/* Step 1: Review */}
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                            className="bg-white dark:bg-white/[0.03] rounded-2xl shadow-xl p-8"
                        >
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                <ArrowLeft className="cursor-pointer" onClick={() => navigate(-1)} />
                                Review your Trip
                            </h2>

                            <div className="bg-slate-50 dark:bg-slate-700/50 p-6 rounded-xl mb-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-xl font-bold text-primary-600">{bookingData.title}</h3>
                                        <p className="text-slate-500 mt-1">{bookingData.details}</p>
                                        <div className="flex gap-2 mt-2">
                                            <span className="badge badge-outline">{bookingData.type.toUpperCase()}</span>
                                            {bookingData.class && <span className="badge badge-outline">{bookingData.class}</span>}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-slate-500">Base Price</p>
                                        <p className="text-2xl font-bold">{formatPrice(bookingData.price)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Link to Trip */}
                            {trips.length > 0 && (
                                <div className="mb-6">
                                    <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-2">Link to Trip (optional)</h4>
                                    <select
                                        value={selectedTripId}
                                        onChange={(e) => setSelectedTripId(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                                    >
                                        <option value="">No trip linked</option>
                                        {trips.map(t => (
                                            <option key={t.id} value={t.id}>
                                                {t.title} — {t.destination}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-slate-400 mt-1">Link this booking to a trip to track it in your budget.</p>

                                    {/* Budget Impact Indicator */}
                                    {selectedTripId && budgetSummary && tripBudget > 0 && (
                                        <div className={`mt-3 p-3 rounded-xl border text-sm ${willOverspend
                                            ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                                            : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                                            }`}>
                                            <p className="font-semibold text-slate-800 dark:text-slate-200">
                                                This booking: {formatPrice(bookingTotal)} → uses <strong>{bookingPct}%</strong> of trip budget
                                            </p>
                                            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-600 overflow-hidden flex mt-2">
                                                <div className="h-full bg-blue-500" style={{ width: `${Math.min((tripSpent / tripBudget) * 100, 100)}%` }} />
                                                <div className={`h-full ${willOverspend ? 'bg-red-500' : 'bg-amber-400'}`} style={{ width: `${Math.min(bookingPct, 100 - Math.min((tripSpent / tripBudget) * 100, 100))}%` }} />
                                            </div>
                                            <p className={`text-xs mt-1 ${willOverspend ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-slate-500'}`}>
                                                {afterBookingPct}% used after this booking
                                                {willOverspend && ' — exceeds budget!'}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="space-y-4 mb-8">
                                <h4 className="font-bold text-slate-700 dark:text-slate-300">Add-ons</h4>
                                <label className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Shield className="w-5 h-5" /></div>
                                        <div>
                                            <p className="font-semibold">Travel Insurance</p>
                                            <p className="text-xs text-slate-500">Protect your trip against cancellation</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold">+{formatPrice(Math.round(insurancePrice * currency.rate))}</span>
                                        <input type="checkbox" checked={addons.insurance} onChange={e => setAddons({ ...addons, insurance: e.target.checked })} className="w-5 h-5 accent-primary-600" />
                                    </div>
                                </label>
                                <label className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-orange-100 text-orange-600 rounded-lg"><Coffee className="w-5 h-5" /></div>
                                        <div>
                                            <p className="font-semibold">Meal Upgrade</p>
                                            <p className="text-xs text-slate-500">Premium in-flight/journey meal</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold">+{formatPrice(Math.round(mealPrice * currency.rate))}</span>
                                        <input type="checkbox" checked={addons.meal} onChange={e => setAddons({ ...addons, meal: e.target.checked })} className="w-5 h-5 accent-primary-600" />
                                    </div>
                                </label>
                            </div>

                            <div className="flex justify-between items-center pt-6 border-t border-slate-100 dark:border-slate-700">
                                <div>
                                    <p className="text-sm text-slate-500">Total Amount</p>
                                    <p className="text-3xl font-bold text-primary-600">{formatPrice(calculateTotal())}</p>
                                </div>
                                <button onClick={() => setStep(2)} className="btn btn-primary px-8 py-3 text-lg">Continue</button>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 2: Travelers */}
                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                            className="bg-white dark:bg-white/[0.03] rounded-2xl shadow-xl p-8"
                        >
                            <h2 className="text-2xl font-bold mb-6">Traveler Details</h2>
                            <form onSubmit={(e) => { e.preventDefault(); setStep(3); }} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold mb-1">First Name</label>
                                        <input required type="text" value={traveler.firstName} onChange={e => setTraveler({ ...traveler, firstName: e.target.value })} className="input w-full" placeholder="John" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold mb-1">Last Name</label>
                                        <input required type="text" value={traveler.lastName} onChange={e => setTraveler({ ...traveler, lastName: e.target.value })} className="input w-full" placeholder="Doe" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1">Email</label>
                                    <input required type="email" value={traveler.email} onChange={e => setTraveler({ ...traveler, email: e.target.value })} className="input w-full" placeholder="john@example.com" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold mb-1">Phone</label>
                                        <input required type="tel" value={traveler.phone} onChange={e => setTraveler({ ...traveler, phone: e.target.value })} className="input w-full" placeholder="+1 234 567 8900" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold mb-1">Age</label>
                                        <input required type="number" value={traveler.age} onChange={e => setTraveler({ ...traveler, age: e.target.value })} className="input w-full" placeholder="25" />
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-6">
                                    <button type="button" onClick={() => setStep(1)} className="btn btn-outline flex-1">Back</button>
                                    <button type="submit" className="btn btn-primary flex-1">Continue to Payment</button>
                                </div>
                            </form>
                        </motion.div>
                    )}

                    {/* Step 3: Payment */}
                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                            className="bg-white dark:bg-white/[0.03] rounded-2xl shadow-xl p-8"
                        >
                            <h2 className="text-2xl font-bold mb-6">Payment</h2>
                            <div className="bg-slate-50 dark:bg-slate-700/50 p-6 rounded-xl mb-6 flex justify-between items-center">
                                <span className="text-slate-600 dark:text-slate-300">Total to Pay</span>
                                <span className="text-3xl font-bold text-primary-600">{formatPrice(calculateTotal())}</span>
                            </div>

                            <div className="space-y-4 mb-8">
                                <label className="flex items-center gap-4 p-4 border-2 border-primary-500 bg-primary-50 dark:bg-primary-900/10 rounded-xl cursor-pointer">
                                    <input type="radio" name="payment" defaultChecked className="w-5 h-5 accent-primary-600" />
                                    <CreditCard className="w-6 h-6 text-primary-600" />
                                    <span className="font-bold">Credit/Debit Card</span>
                                </label>
                                {/* Mock Card Form */}
                                <div className="pl-9 space-y-3">
                                    <input type="text" placeholder="Card Number" className="input w-full" />
                                    <div className="grid grid-cols-2 gap-3">
                                        <input type="text" placeholder="MM/YY" className="input w-full" />
                                        <input type="text" placeholder="CVV" className="input w-full" />
                                    </div>
                                </div>
                            </div>

                            {/* Overspend Warning */}
                            {selectedTripId && willOverspend && (
                                <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-3">
                                    <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                    <div>
                                        <p className="font-semibold text-sm text-red-700 dark:text-red-400">This booking will exceed your trip budget</p>
                                        <p className="text-xs text-red-500">Budget: {formatPrice(tripBudget)} · After booking: {formatPrice(afterBooking)}</p>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-4">
                                <button onClick={() => setStep(2)} className="btn btn-outline flex-1">Back</button>
                                <button onClick={handleConfirm} disabled={isProcessing} className={`btn flex-1 flex items-center justify-center gap-2 ${selectedTripId && willOverspend
                                    ? 'bg-amber-500 hover:bg-amber-600 text-white'
                                    : 'btn-primary'
                                    }`}>
                                    {isProcessing ? <Loader2 className="animate-spin" /> : (
                                        selectedTripId && willOverspend ? 'Confirm (Over Budget)' : 'Pay & Confirm'
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 4: Success */}
                    {step === 4 && (
                        <motion.div
                            key="step4"
                            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                            className="bg-white dark:bg-white/[0.03] rounded-2xl shadow-xl p-12 text-center"
                        >
                            <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle className="w-10 h-10" />
                            </div>
                            <h2 className="text-3xl font-bold mb-2">Booking Confirmed!</h2>
                            <p className="text-slate-500 mb-8">Your trip to {bookingData.title} is all set.</p>
                            <div className="flex justify-center gap-4">
                                <button onClick={() => navigate('/bookings')} className="btn btn-outline">Book Another Ticket</button>
                                <button onClick={() => navigate('/my-bookings')} className="btn btn-primary">View My Bookings</button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default BookingReview;
