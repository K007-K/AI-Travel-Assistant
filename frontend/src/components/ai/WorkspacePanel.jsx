import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Maximize2, RotateCcw, HelpCircle,
    ArrowRight, Mic, Play, Speaker, Loader2, AlertTriangle, CheckCircle, Languages,
    MapPin, Calendar, DollarSign, Utensils, Shuffle
} from 'lucide-react';
import { aiManager } from '../../api/aiManager';

// --- SUB-COMPONENTS FOR SPECIFIC TOOLS ---

// 1. LIVE TRANSLATION (Text & Context)
const TranslationTool = ({ isActive }) => {
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
        <div className="w-full max-w-md space-y-4">
            <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter text to translate..."
                className="w-full h-32 p-4 rounded-xl border border-slate-200 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
            />
            <button
                onClick={handleTranslate}
                disabled={loading || !input.trim()}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
            >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Languages className="w-4 h-4" />}
                {loading ? 'Translating...' : 'Translate & Explain'}
            </button>

            <AnimatePresence>
                {result && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-5 bg-slate-50 rounded-xl border border-slate-200 text-left space-y-3"
                    >
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Detected: {result.detected_language}</p>
                            <p className="text-xl font-medium text-slate-900">{result.translated_text}</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// 2. EMERGENCY ASSISTANT (Immediate Action Buttons)
const EmergencyTool = () => {
    const [step, setStep] = useState('select');
    const [loading, setLoading] = useState(false);
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
        <div className="w-full max-w-md">
            {step === 'select' && (
                <div className="grid grid-cols-2 gap-4">
                    {['Medical', 'Police', 'Lost Document', 'Transport'].map((type) => (
                        <button
                            key={type}
                            onClick={() => handleEmergencyType(type)}
                            className="p-6 rounded-xl border border-slate-200 hover:border-red-200 hover:bg-red-50 transition-all flex flex-col items-center gap-3 group bg-white shadow-sm hover:shadow-md"
                        >
                            <AlertTriangle className="w-8 h-8 text-red-400 group-hover:text-red-600 transition-colors" />
                            <span className="font-bold text-slate-700 group-hover:text-red-700">{type}</span>
                        </button>
                    ))}
                </div>
            )}

            {step === 'analyzing' && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Loader2 className="w-10 h-10 text-red-500 animate-spin mb-4" />
                    <p className="text-lg font-bold text-slate-800">connecting to emergency protocols...</p>
                </div>
            )}

            {step === 'guided' && advice && (
                <div className="text-left space-y-4">
                    <div className="p-5 bg-red-50 border border-red-100 rounded-xl shadow-sm">
                        <h4 className="font-bold text-red-700 flex items-center gap-2 mb-2">
                            <AlertTriangle className="w-5 h-5" /> IMMEDIATE ACTION
                        </h4>
                        <p className="text-red-900 text-lg leading-relaxed">{advice.immediate_action}</p>
                    </div>

                    <div className="space-y-3">
                        {advice.steps.map((stepItem, i) => (
                            <div key={i} className="flex gap-4 p-4 bg-white border border-slate-100 rounded-lg shadow-sm">
                                <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-xs shrink-0">
                                    {i + 1}
                                </div>
                                <p className="text-slate-700 font-medium">{stepItem}</p>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={() => setStep('select')}
                        className="w-full py-4 mt-6 text-slate-400 hover:text-slate-600 font-medium text-sm transition-colors"
                    >
                        Back to Emergency Menu
                    </button>
                </div>
            )}
        </div>
    );
};

// 3. SMART ITINERARY (Form-based Interaction)
const ItineraryTool = () => {
    const [formData, setFormData] = useState({ dest: '', days: '', budget: '' });
    const [loading, setLoading] = useState(false);
    const [plan, setPlan] = useState(null);

    const handleSubmit = async () => {
        if (!formData.dest) return;
        setLoading(true);
        try {
            const prompt = `Plan a ${formData.days}-day trip to ${formData.dest} with a budget of ${formData.budget}.`;
            const response = await aiManager.runAgent('ITINERARY_PLANNER', prompt);
            setPlan(response);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md space-y-4">
            {!plan ? (
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Destination</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                value={formData.dest}
                                onChange={e => setFormData({ ...formData, dest: e.target.value })}
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                                placeholder="e.g. Goa, India"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Duration</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    value={formData.days}
                                    onChange={e => setFormData({ ...formData, days: e.target.value })}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                                    placeholder="e.g. 3 days"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Budget</label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    value={formData.budget}
                                    onChange={e => setFormData({ ...formData, budget: e.target.value })}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                                    placeholder="e.g. ₹15k"
                                />
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !formData.dest}
                        className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-lg shadow-emerald-600/20"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Generate Itinerary'}
                    </button>
                    {loading && <p className="text-center text-emerald-600 text-sm font-medium animate-pulse">Designing your perfect trip...</p>}
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-4"
                >
                    <div className="flex items-center justify-between">
                        <h4 className="font-bold text-lg text-emerald-900">Your {formData.dest} Plan</h4>
                        <button onClick={() => setPlan(null)} className="text-xs font-medium text-emerald-600 underline">Edit</button>
                    </div>
                    <div className="h-[400px] overflow-y-auto pr-2 space-y-4">
                        {plan.itinerary && Object.entries(plan.itinerary).map(([day, activities]) => (
                            <div key={day} className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm">
                                <h5 className="font-bold text-emerald-700 mb-2 capitalize">{day.replace('_', ' ')}</h5>
                                <ul className="space-y-3">
                                    {activities.map((act, idx) => (
                                        <li key={idx} className="flex gap-3 text-sm">
                                            <span className="font-mono text-slate-400 text-xs shrink-0 mt-0.5">{act.time}</span>
                                            <span className="text-slate-700">{act.activity} @ <span className="font-medium">{act.location}</span></span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}
        </div>
    );
}

// 4. VOICE ASSISTANT (Visualizer UI)
const VoiceTool = () => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');

    // Simulate listening
    useEffect(() => {
        let interval;
        if (isListening) {
            setTranscript('');
            const phrases = ["Planning...", "Checking weather...", "Finding hotels..."];
            let i = 0;
            interval = setInterval(() => {
                setTranscript(phrases[i % phrases.length]);
                i++;
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isListening]);

    return (
        <div className="w-full max-w-sm flex flex-col items-center justify-center space-y-8 py-8">
            <button
                onClick={() => setIsListening(!isListening)}
                className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 ${isListening ? 'bg-pink-100 ring-4 ring-pink-200 scale-110' : 'bg-slate-100 hover:bg-slate-200'}`}
            >
                {isListening ? (
                    <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map(i => (
                            <motion.div
                                key={i}
                                animate={{ height: [10, 40, 10] }}
                                transition={{ repeat: Infinity, duration: 1, delay: i * 0.1 }}
                                className="w-2 bg-pink-500 rounded-full"
                            />
                        ))}
                    </div>
                ) : (
                    <Mic className="w-12 h-12 text-slate-400" />
                )}
            </button>

            <div className="text-center space-y-2 h-16">
                <h3 className={`font-bold text-xl ${isListening ? 'text-pink-600' : 'text-slate-900'}`}>
                    {isListening ? 'Listening...' : 'Tap to Speak'}
                </h3>
                <p className="text-slate-500 text-sm">
                    {isListening ? transcript : 'I can plan trips, book hotels, or check flights.'}
                </p>
            </div>
        </div>
    )
}

// 5. GENERIC CHAT (Budget, Food, What-If)
const ChatTool = ({ feature, placeholder, accentColor = 'blue' }) => {
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState([]); // [{role: 'user'|'ai', content: ''}]

    const accentClass = {
        'emerald': 'bg-emerald-600 hover:bg-emerald-700',
        'orange': 'bg-orange-600 hover:bg-orange-700',
        'amber': 'bg-amber-500 hover:bg-amber-600',
        'cyan': 'bg-cyan-600 hover:bg-cyan-700',
        'blue': 'bg-blue-600 hover:bg-blue-700',
    }[accentColor] || 'bg-slate-900 hover:bg-slate-800';

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setLoading(true);

        const agentMap = {
            'budget-fixer': 'BUDGET_VALIDATOR',
            'food-discovery': 'FOOD_DISCOVERY',
            'what-if-sim': 'WHAT_IF_SIMULATION',
        };
        const agentId = agentMap[feature.id] || 'CORE_CHAT';

        try {
            const response = await aiManager.runAgent(agentId, userMsg);
            // Format simple text response from JSON structure for chat view
            let textResponse = '';
            if (response.recommendations) textResponse = response.recommendations.map(r => `• **${r.name}** (${r.price_range}): ${r.reason}`).join('\n');
            else if (response.fixes) textResponse = response.fixes.join('\n');
            else if (response.changes) textResponse = `Impact: ${response.impact}\nCost Change: ${response.changes.cost_delta}`;
            else textResponse = JSON.stringify(response, null, 2);

            setMessages(prev => [...prev, { role: 'ai', content: textResponse }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'ai', content: "Sorry, I encountered an error." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex-1 overflow-y-auto mb-4 space-y-4 min-h-[300px] max-h-[500px] p-2">
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 opacity-60 mt-10">
                        {feature.icon}
                        <p className="mt-2 text-sm max-w-xs">{feature.desc}</p>
                    </div>
                )}
                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === 'user'
                                ? 'bg-slate-900 text-white rounded-br-none'
                                : 'bg-slate-100 text-slate-800 rounded-bl-none whitespace-pre-wrap'
                            }`}>
                            {msg.content}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-slate-50 p-3 rounded-2xl rounded-bl-none">
                            <div className="flex gap-1">
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100" />
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200" />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="relative">
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder={placeholder || "Type a message..."}
                    className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-200 outline-none transition-all placeholder:text-slate-400"
                    autoFocus
                />
                <button
                    onClick={handleSend}
                    disabled={!input.trim() || loading}
                    className={`absolute right-2 top-2 p-1.5 rounded-lg text-white transition-colors disabled:opacity-50 ${accentClass}`}
                >
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};


// --- MAIN WORKSPACE PANEL ---

const WorkspacePanel = ({ feature, onClose, isOpen }) => {
    if (!feature) return null;

    const renderTool = () => {
        switch (feature?.id) {
            case 'live-translate':
                return <TranslationTool isActive={isOpen} />;
            case 'emergency-help':
                return <EmergencyTool />;
            case 'smart-planner':
                return <ItineraryTool />;
            case 'voice-assistant':
                return <VoiceTool />;
            case 'budget-fixer':
                return <ChatTool feature={feature} placeholder="e.g. I have ₹50k for 5 days in Paris..." accentColor="orange" />;
            case 'food-discovery':
                return <ChatTool feature={feature} placeholder="e.g. Best sushi in Tokyo under $50..." accentColor="amber" />;
            case 'what-if-sim':
                return <ChatTool feature={feature} placeholder="e.g. What if I add another day?" accentColor="cyan" />;
            default:
                return <ChatTool feature={feature} />;
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
                    />
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300, mass: 0.8 }}
                        className="fixed top-0 right-0 bottom-0 w-full md:w-[500px] bg-white shadow-2xl z-[70] flex flex-col border-l border-slate-200"
                    >
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-700">
                                    {feature.icon}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 leading-tight">
                                        {feature.title}
                                    </h3>
                                    <p className="text-xs text-slate-500 font-medium line-clamp-1">
                                        {feature.capabilities}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col items-center bg-white">
                            {renderTool()}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default WorkspacePanel;
