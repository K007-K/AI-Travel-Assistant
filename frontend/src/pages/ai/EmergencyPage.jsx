import React, { useState } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import { AIPageLayout } from './components/AIPageLayout';
import { aiManager } from '../../api/aiManager';

export const EmergencyPage = () => {
    const [step, setStep] = useState('select');
    const [, setLoading] = useState(false);
    const [advice, setAdvice] = useState(null);

    const handleEmergencyType = async (type) => {
        setStep('analyzing');
        setLoading(true);
        try {
            const response = await aiManager.runAgent('EMERGENCY_ASSISTANCE', `User has a ${type} emergency.`);
            setAdvice(response);
            setStep('guided');
        } catch (error) {
            console.error(error);
            setStep('select');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AIPageLayout
            title="Emergency Assistance"
            subtitle="Immediate, certified safety guidance. Not a substitute for 911."
            icon={<AlertTriangle className="w-6 h-6" />}
            color="red"
        >
            <div className="max-w-2xl mx-auto">
                {step === 'select' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {['Medical Emergency', 'Police / Crime', 'Lost Passport', 'Transport Accident'].map((type) => (
                            <button
                                key={type}
                                onClick={() => handleEmergencyType(type)}
                                className="p-8 rounded-2xl border-2 border-slate-100 dark:border-white/[0.06] hover:border-red-500 hover:bg-red-50 transition-all flex flex-col items-center gap-4 group bg-white dark:bg-white/[0.03] shadow-sm hover:shadow-xl text-center"
                            >
                                <div className="w-16 h-16 rounded-full bg-red-100 text-red-500 flex items-center justify-center group-hover:bg-red-200 transition-colors">
                                    <AlertTriangle className="w-8 h-8" />
                                </div>
                                <span className="font-bold text-xl text-slate-800 dark:text-slate-200 group-hover:text-red-700">{type}</span>
                            </button>
                        ))}
                    </div>
                )}

                {step === 'analyzing' && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="relative">
                            <div className="w-20 h-20 bg-red-100 rounded-full animate-ping absolute top-0 left-0 opacity-50" />
                            <Loader2 className="w-20 h-20 text-red-600 animate-spin relative z-10" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-8 mb-2">Connecting to Safety Protocols...</h2>
                        <p className="text-slate-500">Retrieving local emergency numbers and procedures</p>
                    </div>
                )}

                {step === 'guided' && advice && (
                    <div className="bg-white dark:bg-white/[0.03] rounded-3xl border border-red-100 shadow-2xl overflow-hidden">
                        <div className="bg-red-600 px-8 py-6 text-white">
                            <div className="flex items-center gap-3 mb-2">
                                <AlertTriangle className="w-6 h-6 text-red-200" />
                                <h2 className="text-lg font-bold uppercase tracking-wider opacity-90">Immediate Action Required</h2>
                            </div>
                            <p className="text-3xl font-bold leading-tight">{advice.immediate_action}</p>
                        </div>

                        <div className="p-8 space-y-8">
                            <div>
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Step-by-Step Protocol</h3>
                                <div className="space-y-4">
                                    {advice.steps.map((stepItem, i) => (
                                        <div key={i} className="flex gap-5">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-slate-400 flex items-center justify-center font-bold text-lg shrink-0 border border-slate-200">
                                                {i + 1}
                                            </div>
                                            <p className="text-lg text-slate-800 dark:text-slate-200 font-medium leading-relaxed pt-1">{stepItem}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="p-6 bg-slate-50 dark:bg-[#0a0a0a] rounded-xl border border-slate-200 dark:border-white/[0.06] text-slate-500 dark:text-slate-400 text-sm">
                                <span className="font-bold text-slate-700">Disclaimer:</span> {advice.disclaimer || "Roameo AI is an assistant, not a verified emergency service. Always contact local authorities directly."}
                            </div>

                            <button
                                onClick={() => setStep('select')}
                                className="w-full py-4 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white font-bold border-t border-slate-100 dark:border-white/[0.06] hover:bg-slate-50 dark:bg-[#0a0a0a] transition-colors"
                            >
                                START OVER
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </AIPageLayout>
    );
};
