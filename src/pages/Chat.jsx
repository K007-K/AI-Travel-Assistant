import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Trash2, Globe, Map, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import useChatStore from '../store/chatStore';

const Chat = () => {
    const { messages, isLoading, sendMessage, clearChat } = useChatStore();
    const [input, setInput] = useState('');
    const chatContainerRef = useRef(null);
    const inputRef = useRef(null);

    const scrollToBottom = () => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    };

    useEffect(() => {
        if (messages.length > 0) {
            scrollToBottom();
        }
    }, [messages]);

    useEffect(() => {
        // Focus input on mount
        inputRef.current?.focus();
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        sendMessage(input);
        setInput('');
    };

    const suggestions = [
        "Plan a 5-day trip to Kyoto",
        "Best street food in Mumbai?",
        "Hidden gems in Paris",
        "Budget tips for Bali",
    ];

    return (
        <div className="min-h-screen pt-20 pb-10 bg-slate-50 dark:bg-slate-900">
            <div className="container-custom h-[calc(100vh-8rem)] flex flex-col max-w-4xl mx-auto">

                {/* Chat Header */}
                <div className="flex items-center justify-between py-4 border-b border-slate-200 dark:border-slate-800 mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 shadow-lg">
                            <Bot className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Travel Assistant</h1>
                            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                Online & Ready to help
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={clearChat}
                        className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Clear Chat"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>

                {/* Messages Area */}
                <div
                    ref={chatContainerRef}
                    className="flex-grow overflow-y-auto px-4 py-2 space-y-6 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700"
                >
                    <AnimatePresence initial={false}>
                        {messages.map((msg) => (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                            >
                                {/* Avatar */}
                                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-md ${msg.role === 'user'
                                    ? 'bg-slate-200 dark:bg-slate-700'
                                    : 'bg-gradient-to-br from-primary-500 to-primary-600'
                                    }`}>
                                    {msg.role === 'user' ? (
                                        <User className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                                    ) : (
                                        <Bot className="w-6 h-6 text-white" />
                                    )}
                                </div>

                                {/* Message Bubble */}
                                <div className={`flex flex-col max-w-[85%] sm:max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                    <div className={`px-5 py-4 rounded-2xl shadow-sm ${msg.role === 'user'
                                        ? 'bg-primary-600 text-white rounded-tr-none'
                                        : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-tl-none'
                                        }`}>
                                        <div className={`prose prose-sm max-w-none ${msg.role === 'user'
                                            ? 'prose-invert'
                                            : 'dark:prose-invert'
                                            }`}>
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {msg.content}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-slate-400 mt-1 px-1">
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {isLoading && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex gap-4"
                        >
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-md">
                                <Bot className="w-6 h-6 text-white" />
                            </div>
                            <div className="bg-white dark:bg-slate-800 px-5 py-4 rounded-2xl rounded-tl-none border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-2">
                                <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                                <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                                <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Suggestion Chips */}
                {messages.length < 3 && (
                    <div className="flex gap-2 overflow-x-auto pb-4 px-1 no-scrollbar my-2">
                        {suggestions.map((suggestion, idx) => (
                            <button
                                key={idx}
                                onClick={() => sendMessage(suggestion)}
                                className="px-4 py-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 hover:border-primary-500 hover:text-primary-600 transition-colors whitespace-nowrap shadow-sm"
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                )}

                {/* Input Area */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                    <form onSubmit={handleSubmit} className="relative flex items-end gap-2 p-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg focus-within:ring-2 focus-within:ring-primary-100 dark:focus-within:ring-primary-900/30 transition-all">
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit(e);
                                }
                            }}
                            placeholder="Ask anything about your trip..."
                            className="w-full max-h-32 p-3 bg-transparent border-none resize-none focus:ring-0 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 scrollbar-thin"
                            rows="1"
                        />
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            className="p-3 rounded-xl bg-gradient-to-r from-primary-600 to-accent-600 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none hover:shadow-xl transition-all"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        </motion.button>
                    </form>
                    <p className="text-center text-xs text-slate-400 mt-2">
                        AI can make mistakes. Please verify important travel information.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Chat;
