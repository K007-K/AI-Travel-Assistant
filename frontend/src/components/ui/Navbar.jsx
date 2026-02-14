import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    Sparkles,
    Map,
    CreditCard,
    Wallet,
    Globe,
    Plane,
    LogOut,
    Settings
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { Button } from '../ui/button';

const Navbar = () => {
    const { user, profile, logout } = useAuthStore();
    const location = useLocation();
    const [scrolled, setScrolled] = useState(false);

    // Routes that have a dark hero image behind the navbar
    const isDarkHeroPage = useMemo(() => {
        return location.pathname.startsWith('/destination/');
    }, [location.pathname]);

    // Track scroll position — once past the hero (~420px), switch to "scrolled" mode
    useEffect(() => {
        if (!isDarkHeroPage) {
            setScrolled(false);
            return;
        }
        const handleScroll = () => setScrolled(window.scrollY > 400);
        handleScroll(); // run on mount
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [isDarkHeroPage]);

    // Determine if text should be light (white) — only when on dark hero AND not scrolled
    const isLight = isDarkHeroPage && !scrolled;

    // Fallback for display name
    const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Traveler';

    const isActive = (path) => location.pathname === path;

    // -------------------------------------------------------------------------
    // Navbar background — SAME glassmorphism on all pages, only text changes
    // -------------------------------------------------------------------------
    const navBg = 'bg-white/40 backdrop-blur-2xl border-b border-white/30 shadow-sm supports-[backdrop-filter]:bg-white/20';

    // -------------------------------------------------------------------------
    // RENDER: LANDING PAGE NAVBAR (Unauthenticated)
    // -------------------------------------------------------------------------
    if (!user) {
        return (
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navBg}`}>
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-blue-500 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300">
                            <Plane className="w-6 h-6" />
                        </div>
                        <span className={`font-display font-bold text-2xl tracking-tight group-hover:text-blue-400 transition-colors ${isLight ? 'text-white' : 'text-slate-900'}`}>ROAMEO</span>
                    </Link>

                    {/* Landing Page Navigation */}
                    <div className="hidden md:flex items-center gap-6">
                        <Link
                            to="/"
                            className={`text-sm font-medium transition-colors ${isActive('/') ? 'text-blue-400 font-bold' : isLight ? 'text-white/80 hover:text-white' : 'text-slate-600 hover:text-blue-600'}`}
                        >
                            Home
                        </Link>
                        <a
                            href="/#features"
                            className={`text-sm font-medium transition-colors ${isLight ? 'text-white/80 hover:text-white' : 'text-slate-600 hover:text-blue-600'}`}
                        >
                            Features
                        </a>
                        <Link
                            to="/about"
                            className={`text-sm font-medium transition-colors ${isActive('/about') ? 'text-blue-400 font-bold' : isLight ? 'text-white/80 hover:text-white' : 'text-slate-600 hover:text-blue-600'}`}
                        >
                            About
                        </Link>
                    </div>

                    {/* Auth Buttons */}
                    <div className="flex items-center gap-3">
                        <Link to="/login">
                            <Button variant="ghost" size="sm" className={isLight ? 'hover:bg-white/10 text-white' : 'hover:bg-slate-100 text-slate-600'}>Log In</Button>
                        </Link>
                        <Link to="/signup">
                            <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20 rounded-full px-6">Sign Up</Button>
                        </Link>
                    </div>
                </div>
            </nav>
        );
    }

    // -------------------------------------------------------------------------
    // RENDER: DASHBOARD NAVBAR (Authenticated)
    // -------------------------------------------------------------------------
    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navBg}`}>
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2 group">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-blue-500 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300">
                        <Plane className="w-6 h-6" />
                    </div>
                    <span className={`font-display font-bold text-2xl tracking-tight transition-colors duration-300 ${isLight ? 'text-white group-hover:text-blue-300' : 'text-slate-900 group-hover:text-blue-600'}`}>ROAMEO</span>
                </Link>

                {/* Main Navigation */}
                <div className="hidden md:flex items-center gap-2">
                    <Link
                        to="/"
                        className={`px-4 py-2.5 text-sm font-medium transition-all duration-300 rounded-full ${isActive('/')
                            ? (isLight ? 'bg-white/20 text-white shadow-sm' : 'bg-slate-100/80 text-slate-900 shadow-sm')
                            : (isLight ? 'text-white/80 hover:text-white hover:bg-white/10' : 'text-slate-500 hover:text-slate-900 hover:bg-white/50')
                            }`}
                    >
                        Home
                    </Link>

                    {/* AI Pill - Special styling */}
                    <Link
                        to="/ai"
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 shadow-sm ${isActive('/ai') || isActive('/chat')
                            ? 'bg-gradient-to-r from-purple-50 to-blue-50 text-blue-700 ring-1 ring-blue-100/50'
                            : isLight
                                ? 'bg-white/15 text-white hover:bg-white/25 ring-1 ring-white/20'
                                : 'bg-white/80 text-slate-600 hover:bg-white hover:shadow-md ring-1 ring-slate-200/50'
                            }`}
                    >
                        <Sparkles className={`w-4 h-4 ${isActive('/ai') || isActive('/chat') ? 'text-blue-600' : isLight ? 'text-white/70' : 'text-slate-400'}`} />
                        AI
                    </Link>

                    <div className={`w-px h-6 mx-2 transition-colors duration-300 ${isLight ? 'bg-white/20' : 'bg-slate-200/50'}`}></div>

                    <NavLink to="/my-trips" icon={<Map className="w-4 h-4" />} label="My Trips" active={isActive('/trips') || isActive('/my-trips')} isLight={isLight} />
                    <NavLink to="/bookings" icon={<CreditCard className="w-4 h-4" />} label="Bookings" active={isActive('/bookings')} isLight={isLight} />
                    <NavLink to="/budget" icon={<Wallet className="w-4 h-4" />} label="Budget" active={isActive('/budget')} isLight={isLight} />
                    <NavLink to="/ai/translate" icon={<Globe className="w-4 h-4" />} label="Translate" active={isActive('/ai/translate')} isLight={isLight} />
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-3 pl-4 border-l group cursor-pointer relative py-2 transition-colors duration-300 ${isLight ? 'border-white/20' : 'border-slate-200/50'}`}>
                        <div className={`w-10 h-10 rounded-full border shadow-md flex items-center justify-center font-bold text-sm group-hover:shadow-lg transition-all duration-300 ${isLight
                            ? 'bg-white/20 border-white/30 text-white'
                            : 'bg-gradient-to-br from-blue-100 to-white border-white text-blue-600'
                            }`}>
                            {displayName.charAt(0).toUpperCase()}
                        </div>
                        <div className="hidden lg:flex flex-col">
                            <span className={`text-sm font-bold transition-colors duration-300 ${isLight ? 'text-white group-hover:text-blue-200' : 'text-slate-700 group-hover:text-blue-700'}`}>
                                {displayName}
                            </span>
                            <span className={`text-xs font-medium transition-colors duration-300 ${isLight ? 'text-white/60' : 'text-slate-400'}`}>Traveler</span>
                        </div>

                        {/* Dropdown Menu — always light for readability */}
                        <div className="absolute right-0 top-full mt-2 w-56 py-2 bg-white/90 backdrop-blur-xl rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-white/20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-50">
                            <Link to="/settings" className="flex items-center gap-3 px-4 py-3 text-sm text-slate-600 hover:bg-blue-50/50 hover:text-blue-600 transition-colors">
                                <div className="p-1.5 rounded-lg bg-slate-50 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-500 transition-colors">
                                    <Settings className="w-4 h-4" />
                                </div>
                                Settings
                            </Link>
                            <div className="h-px bg-slate-100 my-1 mx-4"></div>
                            <button
                                onClick={() => logout()}
                                className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50/50 flex items-center gap-3 transition-colors"
                            >
                                <div className="p-1.5 rounded-lg bg-red-50 text-red-500">
                                    <LogOut className="w-4 h-4" />
                                </div>
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};

const NavLink = ({ to, icon, label, active, isLight }) => (
    <Link
        to={to}
        className={`group flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-full transition-all duration-300 ${active
            ? (isLight ? 'text-white bg-white/20 shadow-sm ring-1 ring-white/20' : 'text-slate-900 bg-white shadow-sm ring-1 ring-slate-100')
            : (isLight ? 'text-white/80 hover:text-white hover:bg-white/10' : 'text-slate-500 hover:text-slate-900 hover:bg-white/60')
            }`}
    >
        {icon}
        {label}
    </Link>
);

export default Navbar;
