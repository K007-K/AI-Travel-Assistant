import React, { useState } from 'react';
import { Loader2, Wallet } from 'lucide-react';
import { AIPageLayout } from './components/AIPageLayout';
import { aiManager } from '../../api/aiManager';

export const BudgetPage = () => {
    // Simple chat-like interface optimized for budget numbers
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSend = async () => {
        if (!input.trim()) return;
        setLoading(true);
        const userMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');

        try {
            const response = await aiManager.runAgent('BUDGET_VALIDATOR', input);
            let aiContent = "";
            if (response.status_message) {
                aiContent = response.status_message + (response.fixes ? "\n\n**Suggested Fixes:**\n" + response.fixes.map(f => `- ${f}`).join('\n') : "");
            } else {
                aiContent = JSON.stringify(response, null, 2);
            }

            setMessages(prev => [...prev, { role: 'ai', content: aiContent, type: response.is_valid ? 'success' : 'warning' }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'ai', content: "Error checking budget." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AIPageLayout
            title="Budget Advisor"
            subtitle="Validate travel costs and detect under-budgeting risks."
            icon={<Wallet className="w-6 h-6" />}
            color="orange"
        >
            <div className="max-w-3xl mx-auto flex flex-col h-[70vh] bg-white dark:bg-white/[0.03] rounded-2xl border border-slate-200 dark:border-white/[0.06] shadow-sm overflow-hidden">
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {messages.length === 0 && (
                        <div className="text-center text-slate-400 mt-20">
                            <Wallet className="w-16 h-16 mx-auto mb-4 opacity-20" />
                            <p>Tell me your plan: "Planning 5 days in Paris with $1000"</p>
                        </div>
                    )}
                    {messages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] p-5 rounded-2xl ${msg.role === 'user'
                                    ? 'bg-slate-100 dark:bg-white/[0.05] text-slate-800 dark:text-slate-200 rounded-br-none'
                                    : msg.type === 'success'
                                        ? 'bg-green-50 border border-green-100 text-slate-800 dark:text-slate-200 rounded-bl-none'
                                        : 'bg-orange-50 border border-orange-100 text-slate-800 dark:text-slate-200 rounded-bl-none'
                                }`}>
                                <div className="whitespace-pre-wrap">{msg.content}</div>
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="flex justify-start">
                            <div className="bg-slate-50 dark:bg-[#0a0a0a] p-4 rounded-2xl rounded-bl-none flex gap-2 items-center text-slate-500 dark:text-slate-400 text-sm">
                                <Loader2 className="w-4 h-4 animate-spin" /> Crunching numbers...
                            </div>
                        </div>
                    )}
                </div>
                <div className="p-4 border-t border-slate-100 dark:border-white/[0.06] bg-slate-50 dark:bg-[#0a0a0a] grid grid-cols-[1fr,auto] gap-2">
                    <input
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSend()}
                        placeholder="e.g. Is $500 enough for a weekend in New York?"
                        className="px-4 py-3 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || loading}
                        className="px-6 bg-slate-900 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors"
                    >
                        Check
                    </button>
                </div>
            </div>
        </AIPageLayout>
    )
}
