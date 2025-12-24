import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Languages, Loader2 } from 'lucide-react';
import { AIPageLayout } from './components/AIPageLayout';
import { aiManager } from '../../api/aiManager';

export const TranslationPage = () => {
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const handleTranslate = async () => {
        if (!input.trim()) return;
        setLoading(true);
        try {
            const response = await aiManager.runAgent('TRANSLATION', `Translate this text: "${input}"`);
            setResult(response);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AIPageLayout
            title="Live Translation"
            subtitle="Accurate translation with cultural context explanation."
            icon={<Languages className="w-6 h-6" />}
            color="indigo"
        >
            <div className="grid md:grid-cols-2 gap-8">
                {/* Input Section */}
                <div className="space-y-4">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <label className="block text-sm font-bold text-slate-500 mb-3 uppercase tracking-wider">Original Text</label>
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Enter text to translate..."
                            className="w-full h-48 p-4 text-lg bg-slate-50 rounded-xl border-0 focus:ring-2 focus:ring-indigo-500 resize-none placeholder:text-slate-300"
                        />
                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={handleTranslate}
                                disabled={loading || !input.trim()}
                                className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Languages className="w-5 h-5" />}
                                {loading ? 'Translating...' : 'Translate Now'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Output Section */}
                <div className="space-y-4">
                    {result ? (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-white p-8 rounded-2xl border border-indigo-100 shadow-lg shadow-indigo-100/50 h-full flex flex-col"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold uppercase tracking-wider">
                                    {result.detected_language} Detected
                                </span>
                                <span className="text-xs text-slate-400 font-mono">
                                    Confidence: {(result.confidence * 100).toFixed(0)}%
                                </span>
                            </div>

                            <h3 className="text-3xl font-serif text-slate-900 mb-6 leading-relaxed">
                                {result.translated_text}
                            </h3>

                            {/* Context Placeholder (In real app, Cultural Context agent would fill this) */}
                            <div className="mt-auto pt-6 border-t border-slate-100">
                                <p className="text-sm text-slate-500 italic">
                                    <span className="font-bold text-indigo-600 not-italic">Cultural Note: </span>
                                    Literal translation provided. For idiom explanation, ask the Cultural Context agent.
                                </p>
                            </div>
                        </motion.div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-200 rounded-2xl p-8">
                            <Languages className="w-12 h-12 mb-4 opacity-50" />
                            <p className="font-medium">Translation will appear here</p>
                        </div>
                    )}
                </div>
            </div>
        </AIPageLayout>
    );
};
