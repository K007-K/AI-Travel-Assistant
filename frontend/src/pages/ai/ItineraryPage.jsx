import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Loader2 } from 'lucide-react';
import { AIPageLayout } from './components/AIPageLayout';
import { aiManager } from '../../api/aiManager';

export const ItineraryPage = () => {
    const [formData, setFormData] = useState({ dest: '', days: '', budget: '', travelers: '2' });
    const [loading, setLoading] = useState(false);
    const [plan, setPlan] = useState(null);

    const handleSubmit = async () => {
        if (!formData.dest) return;
        setLoading(true);
        try {
            const prompt = `Plan a ${formData.days}-day trip to ${formData.dest} for ${formData.travelers} people with a budget of ${formData.budget}.`;
            // Using generic 'ITINERARY_PLANNER' agent
            const response = await aiManager.runAgent('ITINERARY_PLANNER', prompt);
            setPlan(response);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AIPageLayout
            title="Smart Itinerary Planner"
            subtitle="Detailed day-wise travel plans optimized for your preferences."
            icon={<MapPin className="w-6 h-6" />}
            color="emerald"
        >
            <div className="grid lg:grid-cols-12 gap-8 items-start">
                {/* Form Section */}
                <div className="lg:col-span-4 bg-white dark:bg-white/[0.03] p-6 rounded-2xl border border-slate-200 dark:border-white/[0.06] shadow-sm sticky top-24">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200 mb-6">Trip Details</h3>
                    <div className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Where to?</label>
                            <div className="relative">
                                <MapPin className="absolute left-4 top-3.5 w-5 h-5 text-emerald-500" />
                                <input
                                    type="text"
                                    value={formData.dest}
                                    onChange={e => setFormData({ ...formData, dest: e.target.value })}
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-[#0a0a0a] rounded-xl border-transparent focus:bg-white dark:bg-white/[0.03] focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium"
                                    placeholder="e.g. Kyoto, Japan"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Duration</label>
                                <input
                                    type="text"
                                    value={formData.days}
                                    onChange={e => setFormData({ ...formData, days: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-[#0a0a0a] rounded-xl border-transparent focus:bg-white dark:bg-white/[0.03] focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium"
                                    placeholder="e.g. 5 days"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Budget</label>
                                <input
                                    type="text"
                                    value={formData.budget}
                                    onChange={e => setFormData({ ...formData, budget: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-[#0a0a0a] rounded-xl border-transparent focus:bg-white dark:bg-white/[0.03] focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium"
                                    placeholder="e.g. $2000"
                                />
                            </div>
                        </div>
                        <button
                            onClick={handleSubmit}
                            disabled={loading || !formData.dest}
                            className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Generate Itinerary'}
                        </button>
                    </div>
                </div>

                {/* Output Section */}
                <div className="lg:col-span-8">
                    {!plan && !loading && (
                        <div className="h-96 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 dark:border-white/[0.06] rounded-3xl">
                            <MapPin className="w-12 h-12 mb-4 opacity-50" />
                            <p>Enter details to generate your plan</p>
                        </div>
                    )}

                    {loading && (
                        <div className="h-96 flex flex-col items-center justify-center text-emerald-600 bg-emerald-50/50 rounded-3xl">
                            <Loader2 className="w-10 h-10 animate-spin mb-4" />
                            <p className="font-bold">Designing your trip...</p>
                            <p className="text-sm opacity-75">Checking opening hours & distances</p>
                        </div>
                    )}

                    {plan && (
                        <div className="space-y-6">
                            {/* Summary Card */}
                            <div className="p-6 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-200 flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold">{formData.dest} Trip</h2>
                                    <p className="opacity-90">{formData.days} · {formData.budget} budget</p>
                                </div>
                                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center font-bold text-lg">
                                    {Object.keys(plan.itinerary || {}).length}d
                                </div>
                            </div>

                            {/* Day Cards */}
                            <div className="space-y-4">
                                {Object.entries(plan.itinerary || {}).map(([day, activities], idx) => (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        key={day}
                                        className="bg-white dark:bg-white/[0.03] p-6 rounded-2xl border border-slate-200 dark:border-white/[0.06] shadow-sm hover:shadow-md transition-shadow"
                                    >
                                        <h4 className="font-bold text-lg text-emerald-800 mb-4 capitalize flex items-center gap-2">
                                            <Calendar className="w-5 h-5" />
                                            {day.replace('_', ' ')}
                                        </h4>
                                        <div className="space-y-6 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                                            {activities.map((act, i) => (
                                                <div key={i} className="flex gap-6 relative">
                                                    <div className="w-10 h-10 bg-white dark:bg-white/[0.03] border-2 border-emerald-100 rounded-full flex items-center justify-center shrink-0 z-10 text-xs font-bold text-slate-500 dark:text-slate-400 shadow-sm">
                                                        {act.time.split(' ')[0]}
                                                    </div>
                                                    <div>
                                                        <h5 className="font-bold text-slate-900 dark:text-white text-lg">{act.activity}</h5>
                                                        <p className="text-slate-500 dark:text-slate-400 flex items-center gap-1 text-sm mt-1">
                                                            <MapPin className="w-3 h-3" /> {act.location}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AIPageLayout>
    );
};
