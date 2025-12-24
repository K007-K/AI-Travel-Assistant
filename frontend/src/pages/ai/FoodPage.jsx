import React, { useState } from 'react';
import { Loader2, Utensils } from 'lucide-react';
import { AIPageLayout } from './components/AIPageLayout';
import { aiManager } from '../../api/aiManager';

export const FoodPage = () => {
    // Similar chat interface but styled for Food
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
            const response = await aiManager.runAgent('FOOD_DISCOVERY', input);
            const recommendations = response.recommendations || [];
            let aiContent = recommendations.map(r => `**${r.name}** (${r.price_range})\n${r.cuisine} · ${r.reason}`).join('\n\n');
            if (!aiContent) aiContent = JSON.stringify(response, null, 2);

            setMessages(prev => [...prev, { role: 'ai', content: aiContent }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'ai', content: "Failed to find food." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AIPageLayout
            title="Food Discovery"
            subtitle="Find verified local eats based on your diet and budget."
            icon={<Utensils className="w-6 h-6" />}
            color="amber"
        >
            <div className="max-w-3xl mx-auto flex flex-col h-[70vh] bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {messages.length === 0 && (
                        <div className="text-center text-slate-400 mt-20">
                            <Utensils className="w-16 h-16 mx-auto mb-4 opacity-20" />
                            <p>Ask for recommendations: "Best vegan tacos in Mexico City"</p>
                        </div>
                    )}
                    {messages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] p-5 rounded-2xl ${msg.role === 'user'
                                    ? 'bg-slate-100 text-slate-800 rounded-br-none'
                                    : 'bg-amber-50 border border-amber-100 text-slate-800 rounded-bl-none'
                                }`}>
                                <div className="whitespace-pre-wrap">{msg.content}</div>
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="flex justify-start">
                            <div className="bg-slate-50 p-4 rounded-2xl rounded-bl-none flex gap-2 items-center text-slate-500 text-sm">
                                <Loader2 className="w-4 h-4 animate-spin" /> Scanning menus...
                            </div>
                        </div>
                    )}
                </div>
                <div className="p-4 border-t border-slate-100 bg-slate-50 grid grid-cols-[1fr,auto] gap-2">
                    <input
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSend()}
                        placeholder="e.g. Best Ramen in Tokyo for cheap"
                        className="px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || loading}
                        className="px-6 bg-slate-900 text-white font-bold rounded-xl hover:bg-amber-600 transition-colors"
                    >
                        Find
                    </button>
                </div>
            </div>
        </AIPageLayout>
    )
}
