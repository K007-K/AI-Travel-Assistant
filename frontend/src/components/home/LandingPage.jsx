import React from 'react';
import HeroSection from './HeroSection';
import FeaturesGrid from './FeaturesGrid';
import DestinationShowcase from './DestinationShowcase';
import SmoothScroller from '../SmoothScroller';

const LandingPage = () => {
    return (
        <div className="bg-[#fafafa] text-slate-900 min-h-screen font-sans selection:bg-blue-200 selection:text-blue-900 overflow-hidden">
            <SmoothScroller />
            <HeroSection />
            <FeaturesGrid />
            <DestinationShowcase />
        </div>
    );
};

export default LandingPage;
