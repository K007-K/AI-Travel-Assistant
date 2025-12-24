import React from 'react';
import { Info } from 'lucide-react';
import { AIPageLayout } from './components/AIPageLayout';

export const ExplainabilityPage = () => {
    // Placeholder for now as this usually depends on session context
    return (
        <AIPageLayout
            title="AI Transparency"
            subtitle="Understand WHY Roameo made specific planning decisions."
            icon={<Info className="w-6 h-6" />}
            color="teal"
        >
            <div className="max-w-2xl mx-auto text-center py-20 text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl">
                <Info className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <h3 className="text-xl font-bold text-slate-700 mb-2">No Decisions to Explain Yet</h3>
                <p>Run a planning agent first, then come here to see the reasoning breakdown.</p>
            </div>
        </AIPageLayout>
    )
}
