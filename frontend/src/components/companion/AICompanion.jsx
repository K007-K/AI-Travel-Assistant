import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageCircle, X, Send, Bot, User, Sparkles, Trash2,
    Wallet, MapPin, ShieldAlert, Utensils, ArrowUp, Zap,
    AlertTriangle, ChevronDown
} from 'lucide-react';
import useCompanionStore from '../../store/companionStore';
import useAuthStore from '../../store/authStore';

// ── Intent badge colors ──────────────────────────────────────────────
const INTENT_STYLES = {
    budget_inquiry: { bg: 'bg-blue-100 dark:bg-blue-500/20', text: 'text-blue-700 dark:text-blue-300', icon: Wallet, label: 'Budget' },
    add_activity: { bg: 'bg-emerald-100 dark:bg-emerald-500/20', text: 'text-emerald-700 dark:text-emerald-300', icon: MapPin, label: 'Activity' },
    emergency: { bg: 'bg-red-100 dark:bg-red-500/20', text: 'text-red-700 dark:text-red-300', icon: ShieldAlert, label: 'Emergency' },
    food_search: { bg: 'bg-amber-100 dark:bg-amber-500/20', text: 'text-amber-700 dark:text-amber-300', icon: Utensils, label: 'Food' },
    upgrade: { bg: 'bg-purple-100 dark:bg-purple-500/20', text: 'text-purple-700 dark:text-purple-300', icon: Sparkles, label: 'Upgrade' },
    safety: { bg: 'bg-orange-100 dark:bg-orange-500/20', text: 'text-orange-700 dark:text-orange-300', icon: ShieldAlert, label: 'Safety' },
    general: { bg: 'bg-slate-100 dark:bg-slate-500/20', text: 'text-slate-700 dark:text-slate-300', icon: Bot, label: 'AI' },
};

// ── Quick action chips ───────────────────────────────────────────────
const QUICK_ACTIONS = [
    { text: 'Check my budget', icon: Wallet },
    { text: 'Can I add an activity?', icon: MapPin },
    { text: 'Find food nearby', icon: Utensils },
    { text: 'Emergency contacts', icon: ShieldAlert },
    { text: 'Upgrade options', icon: Sparkles },
];

// ── Format message text with markdown-lite ───────────────────────────
function formatText(text) {
    if (!text) return '';
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br/>');
}

// ── Message Bubble ───────────────────────────────────────────────────
const MessageBubble = ({ message }) => {
    const isUser = message.role === 'user';
    const intentStyle = !isUser ? INTENT_STYLES[message.intent] || INTENT_STYLES.general : null;
    const IntentIcon = intentStyle?.icon || Bot;

    return (
        <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.2 }}
            className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
        >
            {/* Avatar */}
            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-1 ${isUser
                ? 'bg-blue-600'
                : 'bg-gradient-to-br from-violet-500 to-indigo-600'
                }`}>
                {isUser
                    ? <User className="w-3.5 h-3.5 text-white" />
                    : <Bot className="w-3.5 h-3.5 text-white" />
                }
            </div>

            {/* Content */}
            <div className={`max-w-[82%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
                {/* Intent badge */}
                {!isUser && message.intent && message.intent !== 'error' && (
                    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider mb-1 ${intentStyle?.bg} ${intentStyle?.text}`}>
                        <IntentIcon className="w-2.5 h-2.5" />
                        {intentStyle?.label}
                    </div>
                )}

                {/* Bubble */}
                <div className={`px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed ${isUser
                    ? 'bg-blue-600 text-white rounded-br-md'
                    : message.type === 'emergency'
                        ? 'bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-900 dark:text-red-200 rounded-bl-md'
                        : 'bg-white dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.08] text-slate-800 dark:text-slate-200 rounded-bl-md'
                    }`}>
                    <div dangerouslySetInnerHTML={{ __html: formatText(message.text) }} />
                </div>

                {/* Timestamp */}
                <span className="text-[9px] text-slate-400 mt-0.5 px-1">
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>
        </motion.div>
    );
};

// ── Typing Indicator ─────────────────────────────────────────────────
const TypingIndicator = () => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex gap-2.5 items-start"
    >
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0">
            <Bot className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="px-4 py-3 bg-white dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.08] rounded-2xl rounded-bl-md">
            <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                    <motion.div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-slate-400"
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                    />
                ))}
            </div>
        </div>
    </motion.div>
);

// ── Main Companion Component ─────────────────────────────────────────
const AICompanion = () => {
    const { messages, isProcessing, isOpen, toggleOpen, sendMessage, clearMessages } = useCompanionStore();
    const isAuthenticated = useAuthStore(s => s.isAuthenticated);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isProcessing]);

    // Focus input when opening
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [isOpen]);

    const handleSend = () => {
        if (!input.trim() || isProcessing) return;
        sendMessage(input);
        setInput('');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleQuickAction = (text) => {
        sendMessage(text);
    };

    // Don't render on public pages (not logged in) — MUST be after all hooks
    if (!isAuthenticated) return null;

    return (
        <>
            {/* Floating Button */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={toggleOpen}
                        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 flex items-center justify-center hover:shadow-xl hover:shadow-blue-500/40 transition-shadow"
                    >
                        <MessageCircle className="w-6 h-6" />
                        {/* Pulse animation */}
                        <span className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-20" />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Chat Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed bottom-6 right-6 z-50 w-[380px] h-[560px] max-h-[80vh] bg-slate-50 dark:bg-[#0f0f0f] rounded-2xl shadow-2xl shadow-black/20 border border-slate-200 dark:border-white/[0.08] flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3.5 flex items-center gap-3 shrink-0">
                            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                                <Bot className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-sm font-bold text-white">AI Companion</h3>
                                <p className="text-[10px] text-blue-100 font-medium">Budget-aware travel assistant</p>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={clearMessages}
                                    className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/70 hover:text-white"
                                    title="Clear chat"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    onClick={toggleOpen}
                                    className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/70 hover:text-white"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin">
                            {messages.length === 0 && (
                                <div className="text-center py-8">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 flex items-center justify-center mx-auto mb-4">
                                        <Sparkles className="w-7 h-7 text-blue-500" />
                                    </div>
                                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Hi! I'm your travel companion</h4>
                                    <p className="text-xs text-slate-400 mb-6 max-w-[240px] mx-auto">
                                        I can check your budget, help plan activities, find food, and provide emergency contacts.
                                    </p>

                                    {/* Quick actions */}
                                    <div className="flex flex-wrap gap-1.5 justify-center">
                                        {QUICK_ACTIONS.map(action => (
                                            <button
                                                key={action.text}
                                                onClick={() => handleQuickAction(action.text)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.08] rounded-full text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-500/20 transition-all"
                                            >
                                                <action.icon className="w-3 h-3" />
                                                {action.text}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {messages.map(msg => (
                                <MessageBubble key={msg.id} message={msg} />
                            ))}

                            {isProcessing && <TypingIndicator />}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Quick actions bar (when chat has messages) */}
                        {messages.length > 0 && (
                            <div className="px-3 py-1.5 border-t border-slate-100 dark:border-white/[0.04] flex gap-1 overflow-x-auto shrink-0 scrollbar-none">
                                {QUICK_ACTIONS.slice(0, 3).map(action => (
                                    <button
                                        key={action.text}
                                        onClick={() => handleQuickAction(action.text)}
                                        className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 dark:bg-white/[0.04] rounded-full text-[10px] font-medium text-slate-500 dark:text-slate-400 hover:bg-blue-100 dark:hover:bg-blue-500/10 hover:text-blue-600 transition-all"
                                    >
                                        <action.icon className="w-2.5 h-2.5" />
                                        {action.text}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Input Area */}
                        <div className="p-3 border-t border-slate-200 dark:border-white/[0.06] shrink-0 bg-white dark:bg-white/[0.02]">
                            <div className="flex items-center gap-2">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Ask about budget, activities, food..."
                                    className="flex-1 bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-slate-800 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                                    disabled={isProcessing}
                                />
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleSend}
                                    disabled={!input.trim() || isProcessing}
                                    className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white flex items-center justify-center transition-colors shrink-0"
                                >
                                    <Send className="w-4 h-4" />
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default AICompanion;
