import React, { useState, useEffect, useRef, memo } from 'react';
import useChatStore from '../store/chatStore';
import { Send, Sparkles, User, Trash2, MapPin, Compass, Lightbulb, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';

// Memoized Message Component to prevent unnecessary re-renders
const MessageBubble = memo(({ message }) => {
    const isAi = message.role === 'assistant';

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-4 ${isAi ? 'justify-start' : 'justify-end'}`}
        >
            {/* AI Avatar */}
            {isAi && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-md mt-1">
                    <Sparkles className="w-4 h-4 text-white" />
                </div>
            )}

            {/* Message Bubble */}
            <div
                className={`max-w-[85%] rounded-2xl p-4 shadow-sm text-[15px] leading-relaxed relative ${isAi
                    ? 'bg-white/80 backdrop-blur-md text-slate-800 border border-white/40 rounded-tl-none'
                    : 'bg-gradient-to-br from-blue-600 to-blue-500 text-white rounded-tr-none shadow-blue-500/20'
                    }`}
            >
                <div className={`prose prose-sm max-w-none break-words ${isAi ? 'prose-slate' : 'prose-invert'}`}>
                    <p className="whitespace-pre-wrap">{message.content}</p>
                </div>

                <span className={`text-[10px] absolute bottom-1 ${isAi ? 'right-3 text-slate-400' : 'left-3 text-blue-100/70'}`}>
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toLowerCase()}
                </span>
            </div>

            {/* User Avatar */}
            {!isAi && (
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="w-4 h-4 text-slate-500" />
                </div>
            )}
        </motion.div>
    );
});

const SuggestionChip = ({ icon, label, onClick }) => (
    <button
        onClick={onClick}
        className="flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm border border-slate-200/50 hover:border-blue-300 hover:bg-blue-50/50 rounded-full text-sm text-slate-600 transition-all cursor-pointer whitespace-nowrap shadow-sm hover:shadow-md"
    >
        {icon}
        {label}
    </button>
);

const Chat = () => {
    const { messages, isLoading, sendMessage, clearChat } = useChatStore();
    const [input, setInput] = useState('');
    const chatContainerRef = useRef(null);
    const textareaRef = useRef(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({
                top: chatContainerRef.current.scrollHeight,
                behavior: 'smooth',
            });
        }
    }, [messages, isLoading]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
        }
    }, [input]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');

        // Reset height
        if (textareaRef.current) textareaRef.current.style.height = 'auto';

        await sendMessage(userMessage);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    // Suggestions for empty state
    const suggestions = [
        { icon: <MapPin className="w-4 h-4 text-emerald-500" />, label: "3 days in Tokyo", prompt: "Plan a 3-day itinerary for Tokyo with a mix of modern and traditional sights." },
        { icon: <Compass className="w-4 h-4 text-blue-500" />, label: "Bali on a budget", prompt: "I want to visit Bali for a week on a tight budget. What do you recommend?" },
        { icon: <Lightbulb className="w-4 h-4 text-amber-500" />, label: "Hidden gems in Paris", prompt: "What are some hidden gems in Paris that tourists usually miss?" },
    ];

    return (
        <div className="min-h-screen bg-slate-50 pt-20 flex flex-col items-center">
            {/* Main Chat Container */}
            <div className="w-full max-w-3xl flex-1 flex flex-col relative h-[calc(100vh-5rem)]">

                {/* Header (Minimal) */}
                <div className="absolute top-0 left-0 right-0 z-10 px-6 py-4 flex items-center justify-between bg-gradient-to-b from-slate-50 via-slate-50/90 to-transparent">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-xs font-semibold text-slate-500 tracking-wide uppercase">Travel Assistant Online</span>
                    </div>
                    {(messages.length > 0) && (
                        <button
                            onClick={() => {
                                clearChat();
                                // Manual force reset in local component state if needed, though store handles it
                                setInput('');
                            }}
                            className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-full hover:bg-red-50"
                            title="Reset Chat"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Messages Area */}
                <div
                    ref={chatContainerRef}
                    className="flex-1 overflow-y-auto px-6 pt-16 pb-32 space-y-6 scrollbar-none"
                >
                    <AnimatePresence initial={false}>
                        {messages.map((msg) => (
                            <MessageBubble key={msg.id} message={msg} />
                        ))}
                    </AnimatePresence>

                    {/* Loading Indicator */}
                    {isLoading && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex gap-4 justify-start"
                        >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-md">
                                <Sparkles className="w-4 h-4 text-white" />
                            </div>
                            <div className="bg-white/80 backdrop-blur-md px-4 py-3 rounded-2xl rounded-tl-none border border-white/40 shadow-sm flex items-center gap-2">
                                <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                                <span className="text-sm text-slate-500 font-medium">Planning your trip...</span>
                            </div>
                        </motion.div>
                    )}

                    {/* Bottom Spacer */}
                    <div className="h-4" />
                </div>

                {/* Floating Input Area */}
                <div className="absolute bottom-6 left-0 right-0 px-6">
                    <div className="bg-white/70 backdrop-blur-2xl border border-white/50 shadow-lg shadow-slate-200/50 rounded-3xl p-2 relative overflow-hidden transition-all focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:bg-white/90 focus-within:shadow-xl">

                        {/* Suggestion Chips (Only if chat is short) */}
                        {messages.length <= 1 && !isLoading && (
                            <div className="absolute bottom-full left-0 right-0 py-4 px-2 flex justify-center gap-2 overflow-x-auto no-scrollbar mask-gradient">
                                {suggestions.map((s, i) => (
                                    <SuggestionChip
                                        key={i}
                                        icon={s.icon}
                                        label={s.label}
                                        onClick={() => setInput(s.prompt)}
                                    />
                                ))}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="flex items-end gap-2">
                            <textarea
                                ref={textareaRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Where do you want to start?"
                                className="w-full bg-transparent border-none text-slate-800 placeholder:text-slate-400 resize-none max-h-[120px] py-3 px-4 focus:ring-0 text-[15px] leading-relaxed"
                                rows={1}
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || isLoading}
                                className={`p-3 rounded-2xl flex-shrink-0 transition-all duration-300 ${input.trim() && !isLoading
                                    ? 'bg-blue-600 text-white shadow-lg hover:bg-blue-700 hover:scale-105 active:scale-95'
                                    : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                                    }`}
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </form>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Chat;
