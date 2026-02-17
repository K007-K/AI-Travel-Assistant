import React, { useState } from 'react';
import { Brain } from 'lucide-react';
import { AIPageLayout } from './components/AIPageLayout';

export const MemoryPage = () => {
    // Mock memory data
    const [memories] = useState([
        { id: 1, type: 'Preference', content: 'Prefers boutique hotels over chains' },
        { id: 2, type: 'Need', content: 'Requires vegan food options' },
        { id: 3, type: 'History', content: 'Visited Japan in 2023' },
    ]);

    return (
        <AIPageLayout
            title="Travel Memory"
            subtitle="View and manage what Roameo learns about your preferences."
            icon={<Brain className="w-6 h-6" />}
            color="purple"
        >
            <div className="max-w-2xl mx-auto space-y-6">
                {memories.map(mem => (
                    <div key={mem.id} className="bg-white dark:bg-white/[0.03] p-6 rounded-2xl border border-slate-200 dark:border-white/[0.06] flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xs uppercase">
                                {mem.type[0]}
                            </div>
                            <div>
                                <p className="font-bold text-slate-800">{mem.content}</p>
                                <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">{mem.type}</p>
                            </div>
                        </div>
                        <button className="text-slate-400 hover:text-red-500 text-sm font-medium">Forget</button>
                    </div>
                ))}

                <div className="p-8 bg-purple-50 rounded-2xl text-center">
                    <p className="text-purple-800 font-medium mb-2">Roameo learns from your chats.</p>
                    <p className="text-sm text-purple-600/70">It never stores sensitive data like credit cards or specific addresses.</p>
                </div>
            </div>
        </AIPageLayout>
    )
}
