import React from 'react';
import HeroSection from './HeroSection';
import DestinationsGrid from './DestinationsGrid';
import SmoothScroller from '../SmoothScroller';

const LandingPage = () => {
    return (
        <div className="bg-[#fafafa] text-slate-900 min-h-screen font-sans selection:bg-blue-200 selection:text-blue-900">
            <SmoothScroller />
            <HeroSection />
            <DestinationsGrid />
        </div>
    );
};

export default LandingPage;
