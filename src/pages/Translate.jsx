import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Languages, ArrowRightLeft, Copy, Check, Sparkles, Globe } from 'lucide-react';

const LANGUAGES = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'ru', name: 'Russian' },
    { code: 'hi', name: 'Hindi' },
    { code: 'te', name: 'Telugu' },
    { code: 'ar', name: 'Arabic' },
];

const COMMON_PHRASES = [
    "Hello, how are you?",
    "Where is the nearest bathroom?",
    "How much does this cost?",
    "I would like to order water.",
    "Can you help me?",
    "Thank you very much."
];

import { translateText } from '../api/groq';

const Translate = () => {
    const [sourceText, setSourceText] = useState('');
    const [translatedText, setTranslatedText] = useState('');
    const [sourceLang, setSourceLang] = useState('en');
    const [targetLang, setTargetLang] = useState('es');
    const [isLoading, setIsLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleTranslate = async () => {
        if (!sourceText.trim()) return;

        setIsLoading(true);
        try {
            const sourceLangName = LANGUAGES.find(l => l.code === sourceLang)?.name || sourceLang;
            const targetLangName = LANGUAGES.find(l => l.code === targetLang)?.name || targetLang;

            const result = await translateText(sourceText, sourceLangName, targetLangName);
            setTranslatedText(result);
        } catch (error) {
            console.error('Translation error:', error);
            setTranslatedText("Error: Could not connect to translation service.");
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(translatedText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSwapLanguages = () => {
        setSourceLang(targetLang);
        setTargetLang(sourceLang);
        setSourceText(translatedText);
        setTranslatedText(sourceText);
    };

    return (
        <div className="min-h-screen pt-24 pb-12 bg-slate-50 dark:bg-slate-900">
            <div className="container-custom max-w-4xl">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-slate-100 mb-2 flex items-center justify-center gap-3">
                        <Globe className="w-8 h-8 text-primary-500" />
                        Travel Translator
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400">
                        Break language barriers instantly.
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                    {/* Language Selectors */}
                    <div className="flex flex-col md:flex-row items-center border-b border-slate-200 dark:border-slate-700">
                        <div className="flex-1 w-full p-4">
                            <select
                                value={sourceLang}
                                onChange={(e) => setSourceLang(e.target.value)}
                                className="w-full bg-transparent font-semibold text-slate-700 dark:text-slate-200 outline-none"
                            >
                                {LANGUAGES.map(lang => (
                                    <option key={lang.code} value={lang.code}>{lang.name}</option>
                                ))}
                            </select>
                        </div>

                        <button
                            onClick={handleSwapLanguages}
                            className="p-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-full m-2 transition-colors"
                        >
                            <ArrowRightLeft className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                        </button>

                        <div className="flex-1 w-full p-4">
                            <select
                                value={targetLang}
                                onChange={(e) => setTargetLang(e.target.value)}
                                className="w-full bg-transparent font-semibold text-primary-600 dark:text-primary-400 outline-none"
                            >
                                {LANGUAGES.map(lang => (
                                    <option key={lang.code} value={lang.code}>{lang.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Translation Area */}
                    <div className="grid grid-cols-1 md:grid-cols-2 min-h-[300px]">
                        {/* Input */}
                        <div className="p-6 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-700 relative">
                            <textarea
                                value={sourceText}
                                onChange={(e) => setSourceText(e.target.value)}
                                placeholder="Type text to translate..."
                                className="w-full h-full bg-transparent resize-none outline-none text-lg text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                            />
                            <div className="absolute bottom-4 right-4 text-xs text-slate-400">
                                {sourceText.length} chars
                            </div>
                        </div>

                        {/* Output */}
                        <div className="p-6 bg-slate-50 dark:bg-slate-900/50 relative">
                            {isLoading ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
                                </div>
                            ) : (
                                <div className="w-full h-full text-lg text-slate-800 dark:text-slate-100">
                                    {translatedText || <span className="text-slate-400 italic">Translation will appear here...</span>}
                                </div>
                            )}

                            {translatedText && !isLoading && (
                                <button
                                    onClick={copyToClipboard}
                                    className="absolute bottom-4 right-4 p-2 text-slate-500 hover:text-primary-500 transition-colors"
                                >
                                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-end">
                        <button
                            onClick={handleTranslate}
                            disabled={!sourceText.trim() || isLoading}
                            className="btn btn-primary flex items-center gap-2 px-8"
                        >
                            <Sparkles className="w-4 h-4" /> Translate
                        </button>
                    </div>
                </div>

                {/* Common Phrases */}
                <div className="mt-12">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-6">Quick Phrases</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {COMMON_PHRASES.map((phrase, i) => (
                            <button
                                key={i}
                                onClick={() => { setSourceText(phrase); handleTranslate(); }}
                                className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-left hover:bg-primary-50 dark:hover:bg-primary-900/10 hover:border-primary-200 transition-all text-slate-700 dark:text-slate-300"
                            >
                                {phrase}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Translate;
