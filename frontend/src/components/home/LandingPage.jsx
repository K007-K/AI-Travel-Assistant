import React from 'react';
import HeroSection from './HeroSection';
import SmoothScroller from '../SmoothScroller';

const LandingPage = () => {
    return (
        <div className="bg-[#fafafa] text-slate-900 min-h-screen font-sans selection:bg-blue-200/50 overflow-hidden">
            <SmoothScroller />
            <HeroSection />
            {/* Future Sections will go here in Phase 4 and 5 */}
            <div className="h-[50vh] bg-white flex items-center justify-center border-t border-slate-100">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin mx-auto" />
                    <p className="text-slate-400 font-medium tracking-wide uppercase text-sm">Building Next Phases...</p>
                </div>
            </div>
        </div>
    );
};

export default LandingPage;
