import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Plane, Github, Mail, Twitter, Instagram } from 'lucide-react';
import { motion } from 'framer-motion';

const Footer = () => {
    const location = useLocation();
    const authRoutes = ['/login', '/signup', '/forgot-password', '/reset-password'];
    if (authRoutes.includes(location.pathname)) {
        return null;
    }

    const currentYear = new Date().getFullYear();

    const footerLinks = {
        explore: [
            { name: 'Discover Destinations', path: '/discover' },
            { name: 'AI Travel Planner', path: '/ai' },
            { name: 'Features', path: '/#features' },
        ],
        tools: [
            { name: 'My Trips', path: '/my-trips' },
            { name: 'Bookings', path: '/bookings' },
            { name: 'Budget Tracker', path: '/budget' },
            { name: 'Translator', path: '/ai/translate' },
        ],
        company: [
            { name: 'About Us', path: '/about' },
            { name: 'Join Free', path: '/signup' },
            { name: 'Log In', path: '/login' },
        ],
    };

    const sectionTitles = {
        explore: 'Explore',
        tools: 'Travel Tools',
        company: 'Account',
    };

    return (
        <footer className="bg-[#030712] relative overflow-hidden pt-20 pb-8 border-t border-white/[0.05]">
            
            {/* Massive Typographic Watermark */}
            <div className="absolute bottom-0 left-0 right-0 overflow-hidden pointer-events-none flex justify-center opacity-[0.03] select-none">
                <h1 className="text-[20vw] font-display font-black text-white leading-none tracking-tighter whitespace-nowrap mb-[-5%]">
                    ROAMEO
                </h1>
            </div>

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8 mb-20">
                    
                    {/* Brand Section */}
                    <div className="lg:col-span-2 pr-8">
                        <Link to="/" className="flex items-center gap-3 mb-6 group inline-flex">
                            <div className="p-2.5 rounded-xl bg-blue-600 group-hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20">
                                <Plane className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-2xl font-display font-black text-white tracking-tight">
                                ROAMEO
                            </span>
                        </Link>
                        <p className="text-base text-slate-400 mb-8 leading-relaxed max-w-sm">
                            Your sentient AI travel companion. Plan flawless itineraries, book spatial experiences, and travel without stress.
                        </p>
                        
                        <div className="flex gap-4">
                            <SocialLink href="https://github.com/K007-K/AI-Travel-Assistant" icon={<Github className="w-5 h-5" />} />
                            <SocialLink href="https://twitter.com" icon={<Twitter className="w-5 h-5" />} />
                            <SocialLink href="https://instagram.com" icon={<Instagram className="w-5 h-5" />} />
                            <SocialLink href="mailto:support@roameo.app" icon={<Mail className="w-5 h-5" />} />
                        </div>
                    </div>

                    {/* Links Sections */}
                    {Object.entries(footerLinks).map(([key, links], index) => (
                        <div key={key} className="lg:col-span-1">
                            <h3 className="font-bold text-white mb-6 uppercase tracking-widest text-xs opacity-90">
                                {sectionTitles[key]}
                            </h3>
                            <ul className="space-y-4">
                                {links.map((link) => (
                                    <li key={link.path}>
                                        {link.path.startsWith('/#') ? (
                                            <a
                                                href={link.path}
                                                className="text-sm font-medium text-slate-400 hover:text-blue-400 transition-colors duration-300 flex items-center group"
                                            >
                                                <span className="w-0 h-[1px] bg-blue-500 mr-0 group-hover:w-3 group-hover:mr-2 transition-all duration-300"></span>
                                                {link.name}
                                            </a>
                                        ) : (
                                            <Link
                                                to={link.path}
                                                className="text-sm font-medium text-slate-400 hover:text-blue-400 transition-colors duration-300 flex items-center group"
                                            >
                                                <span className="w-0 h-[1px] bg-blue-500 mr-0 group-hover:w-3 group-hover:mr-2 transition-all duration-300"></span>
                                                {link.name}
                                            </Link>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Divider */}
                <div className="w-full h-px bg-gradient-to-r from-transparent via-white/[0.1] to-transparent mb-8" />

                {/* Bottom Bar */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <p className="text-xs font-medium text-slate-500">
                        &copy; {currentYear} Roameo Inc. All rights reserved.
                    </p>
                    
                    <div className="flex items-center gap-6">
                        <Link to="/privacy" className="text-xs font-medium text-slate-500 hover:text-slate-300 transition-colors">Privacy Policy</Link>
                        <Link to="/terms" className="text-xs font-medium text-slate-500 hover:text-slate-300 transition-colors">Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

const SocialLink = ({ href, icon }) => (
    <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/[0.08] text-slate-400 flex items-center justify-center hover:bg-blue-600 hover:text-white hover:border-transparent transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_20px_-10px_rgba(37,99,235,0.8)]"
    >
        {icon}
    </a>
);

export default Footer;
