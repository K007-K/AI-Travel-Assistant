import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Languages, Loader2, ArrowLeftRight, Copy, Check, Volume2, Sparkles, Globe, MessageSquare, ChevronDown } from 'lucide-react';
import { AIPageLayout } from './components/AIPageLayout';
import { aiManager } from '../../api/aiManager';

const LANGUAGES = [
    { code: 'auto', name: 'Auto-Detect', flag: '🌐' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸' },
    { code: 'fr', name: 'French', flag: '🇫🇷' },
    { code: 'de', name: 'German', flag: '🇩🇪' },
    { code: 'it', name: 'Italian', flag: '🇮🇹' },
    { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
    { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
    { code: 'ko', name: 'Korean', flag: '🇰🇷' },
    { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
    { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
    { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
    { code: 'th', name: 'Thai', flag: '🇹🇭' },
    { code: 'vi', name: 'Vietnamese', flag: '🇻🇳' },
    { code: 'ru', name: 'Russian', flag: '🇷🇺' },
    { code: 'tr', name: 'Turkish', flag: '🇹🇷' },
];

const TRAVEL_PHRASES = [
    { text: 'Where is the nearest hospital?', category: 'Emergency' },
    { text: 'How much does this cost?', category: 'Shopping' },
    { text: 'Can I have the menu, please?', category: 'Dining' },
    { text: 'I need directions to the airport.', category: 'Transport' },
    { text: 'Do you accept credit cards?', category: 'Payment' },
    { text: 'I have a food allergy.', category: 'Dining' },
    { text: 'Where is the train station?', category: 'Transport' },
    { text: 'I need help, please.', category: 'Emergency' },
];

export const TranslationPage = () => {
    const [input, setInput] = useState('');
    const [sourceLang, setSourceLang] = useState('auto');
    const [targetLang, setTargetLang] = useState('es');
    const [loading, setLoading] = useState(false);
    const [loadingContext, setLoadingContext] = useState(false);
    const [result, setResult] = useState(null);
    const [culturalContext, setCulturalContext] = useState(null);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState(null);
    const [history, setHistory] = useState([]);
    const textareaRef = useRef(null);

    const sourceLanguage = LANGUAGES.find(l => l.code === sourceLang);
    const targetLanguage = LANGUAGES.find(l => l.code === targetLang);

    const handleTranslate = async () => {
        if (!input.trim()) return;
        setLoading(true);
        setError(null);
        setCulturalContext(null);

        const targetName = targetLanguage?.name || targetLang;
        const sourceName = sourceLang === 'auto' ? '' : ` from ${sourceLanguage?.name}`;

        try {
            const response = await aiManager.runAgent(
                'TRANSLATION',
                `Translate this text${sourceName} to ${targetName}: "${input}"`
            );

            if (response.error) {
                setError(response.raw_output || 'Translation failed');
                setResult(null);
            } else {
                setResult(response);
                // Add to history
                setHistory(prev => [{
                    input,
                    output: response.translated_text,
                    from: response.detected_language || sourceLanguage?.name,
                    to: targetName,
                    timestamp: new Date()
                }, ...prev].slice(0, 10));
            }
        } catch (err) {
            setError('Translation service unavailable. Please try again.');
            setResult(null);
        } finally {
            setLoading(false);
        }
    };

    const handleCulturalContext = async () => {
        if (!result?.translated_text) return;
        setLoadingContext(true);
        try {
            const response = await aiManager.runAgent(
                'CULTURAL_CONTEXT',
                `Explain the cultural context and usage of: "${result.translated_text}" in ${targetLanguage?.name}. The original text was: "${input}"`
            );
            setCulturalContext(response);
        } catch {
            setCulturalContext({ context: 'Could not load cultural context.', tips: [] });
        } finally {
            setLoadingContext(false);
        }
    };

    const handleSwapLanguages = () => {
        if (sourceLang === 'auto') return;
        const temp = sourceLang;
        setSourceLang(targetLang);
        setTargetLang(temp);
        if (result?.translated_text) {
            setInput(result.translated_text);
            setResult(null);
            setCulturalContext(null);
        }
    };

    const handleCopy = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch { /* clipboard may fail in some contexts */ }
    };

    const handleSpeak = (text, lang) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = lang || 'en';
            window.speechSynthesis.speak(utterance);
        }
    };

    const handlePhraseClick = (phrase) => {
        setInput(phrase);
        setResult(null);
        setCulturalContext(null);
        textareaRef.current?.focus();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            handleTranslate();
        }
    };

    return (
        <AIPageLayout
            title="Travel Translator"
            subtitle="Translate with cultural context for your travels."
            icon={<Languages className="w-6 h-6" />}
            color="indigo"
        >
            <div className="space-y-6">
                {/* Language Selector Bar */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-2">
                        {/* Source Language */}
                        <div className="flex-1">
                            <select
                                value={sourceLang}
                                onChange={(e) => setSourceLang(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer"
                            >
                                {LANGUAGES.map(lang => (
                                    <option key={lang.code} value={lang.code}>
                                        {lang.flag} {lang.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Swap Button */}
                        <button
                            onClick={handleSwapLanguages}
                            disabled={sourceLang === 'auto'}
                            className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            title="Swap languages"
                        >
                            <ArrowLeftRight className="w-4 h-4" />
                        </button>

                        {/* Target Language */}
                        <div className="flex-1">
                            <select
                                value={targetLang}
                                onChange={(e) => setTargetLang(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer"
                            >
                                {LANGUAGES.filter(l => l.code !== 'auto').map(lang => (
                                    <option key={lang.code} value={lang.code}>
                                        {lang.flag} {lang.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Translation Area */}
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Input */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                {sourceLanguage?.flag} {sourceLanguage?.name}
                            </span>
                            <span className="text-xs text-slate-300 dark:text-slate-500">
                                {input.length} / 2000
                            </span>
                        </div>
                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value.slice(0, 2000))}
                            onKeyDown={handleKeyDown}
                            placeholder="Type or paste text to translate..."
                            className="w-full h-48 p-5 text-lg bg-transparent text-slate-800 dark:text-slate-100 focus:outline-none resize-none placeholder:text-slate-300 dark:placeholder:text-slate-600"
                        />
                        <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {input.trim() && (
                                    <button
                                        onClick={() => handleSpeak(input, sourceLang === 'auto' ? 'en' : sourceLang)}
                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                                        title="Listen"
                                    >
                                        <Volume2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                            <button
                                onClick={handleTranslate}
                                disabled={loading || !input.trim()}
                                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20"
                            >
                                {loading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Languages className="w-4 h-4" />
                                )}
                                {loading ? 'Translating...' : 'Translate'}
                            </button>
                        </div>
                    </div>

                    {/* Output */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                {targetLanguage?.flag} {targetLanguage?.name}
                            </span>
                            {result && (
                                <span className="text-xs px-2 py-0.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full font-medium">
                                    {result.detected_language && `${result.detected_language} detected`}
                                    {result.confidence && ` · ${(result.confidence * 100).toFixed(0)}%`}
                                </span>
                            )}
                        </div>

                        <div className="h-48 p-5 overflow-y-auto">
                            <AnimatePresence mode="wait">
                                {loading ? (
                                    <motion.div
                                        key="loading"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="h-full flex items-center justify-center"
                                    >
                                        <div className="flex flex-col items-center gap-3">
                                            <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                                            <span className="text-sm text-slate-400">Translating...</span>
                                        </div>
                                    </motion.div>
                                ) : error ? (
                                    <motion.div
                                        key="error"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="h-full flex items-center justify-center"
                                    >
                                        <p className="text-sm text-red-500">{error}</p>
                                    </motion.div>
                                ) : result ? (
                                    <motion.p
                                        key="result"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-lg text-slate-800 dark:text-slate-100 leading-relaxed"
                                    >
                                        {result.translated_text}
                                    </motion.p>
                                ) : (
                                    <motion.div
                                        key="empty"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-600"
                                    >
                                        <Globe className="w-10 h-10 mb-3 opacity-40" />
                                        <p className="text-sm font-medium">Translation appears here</p>
                                        <p className="text-xs text-slate-300 dark:text-slate-600 mt-1">⌘ + Enter to translate</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                            <div className="flex items-center gap-1">
                                {result?.translated_text && (
                                    <>
                                        <button
                                            onClick={() => handleCopy(result.translated_text)}
                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                                            title="Copy translation"
                                        >
                                            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                        <button
                                            onClick={() => handleSpeak(result.translated_text, targetLang)}
                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                                            title="Listen to translation"
                                        >
                                            <Volume2 className="w-4 h-4" />
                                        </button>
                                    </>
                                )}
                            </div>
                            {result?.translated_text && (
                                <button
                                    onClick={handleCulturalContext}
                                    disabled={loadingContext}
                                    className="px-4 py-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
                                >
                                    {loadingContext ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                    Cultural Context
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Cultural Context Card */}
                <AnimatePresence>
                    {culturalContext && (
                        <motion.div
                            initial={{ opacity: 0, y: 20, height: 0 }}
                            animate={{ opacity: 1, y: 0, height: 'auto' }}
                            exit={{ opacity: 0, y: -10, height: 0 }}
                            className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800 p-6 overflow-hidden"
                        >
                            <div className="flex items-start gap-3 mb-4">
                                <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-800/50 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-1">Cultural Context</h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                        {culturalContext.context}
                                    </p>
                                </div>
                            </div>
                            {culturalContext.tips && culturalContext.tips.length > 0 && (
                                <div className="ml-11 space-y-2">
                                    {culturalContext.tips.map((tip, i) => (
                                        <div key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                                            <span className="text-indigo-500 mt-0.5">•</span>
                                            <span>{tip}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Quick Travel Phrases */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <MessageSquare className="w-4 h-4 text-indigo-500" />
                        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Quick Travel Phrases</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {TRAVEL_PHRASES.map((phrase, i) => (
                            <button
                                key={i}
                                onClick={() => handlePhraseClick(phrase.text)}
                                className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-700 dark:hover:text-indigo-400 rounded-lg transition-colors border border-slate-200 dark:border-slate-600 hover:border-indigo-200 dark:hover:border-indigo-700"
                            >
                                {phrase.text}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Translation History */}
                {history.length > 0 && (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Recent Translations</h3>
                            <button
                                onClick={() => setHistory([])}
                                className="text-xs text-slate-400 hover:text-red-500 transition-colors"
                            >
                                Clear
                            </button>
                        </div>
                        <div className="space-y-3">
                            {history.map((item, i) => (
                                <button
                                    key={i}
                                    onClick={() => {
                                        setInput(item.input);
                                        setResult(null);
                                        setCulturalContext(null);
                                    }}
                                    className="w-full text-left p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors group"
                                >
                                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                                        <span>{item.from}</span>
                                        <span>→</span>
                                        <span>{item.to}</span>
                                    </div>
                                    <p className="text-sm text-slate-600 dark:text-slate-300 truncate">{item.input}</p>
                                    <p className="text-sm text-indigo-600 dark:text-indigo-400 truncate font-medium">{item.output}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AIPageLayout>
    );
};
