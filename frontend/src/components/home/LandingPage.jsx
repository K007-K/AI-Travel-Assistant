import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import HeroSection from './HeroSection';
import FeaturesGrid from './FeaturesGrid';
import DestinationShowcase from './DestinationShowcase';
import FreeCTASection from './FreeCTASection';
import SmoothScroller from '../SmoothScroller';

const LandingPage = () => {
    const location = useLocation();

    useEffect(() => {
        if (location.hash) {
            const id = location.hash.substring(1);
            setTimeout(() => {
                const element = document.getElementById(id);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                }
            }, 100);
        }
    }, [location.hash]);

    return (
        <div className="bg-[#fafafa] text-slate-900 min-h-screen font-sans selection:bg-blue-200 selection:text-blue-900 overflow-hidden">
            <SmoothScroller />
            <HeroSection />
            <FeaturesGrid />
            <DestinationShowcase />
            <FreeCTASection />
        </div>
    );
};

export default LandingPage;
