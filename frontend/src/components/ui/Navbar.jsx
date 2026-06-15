import React, { useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    Sparkles,
    Map,
    CreditCard,
    Wallet,
    Globe,
    Plane,
    LogOut,
    Settings,
    Moon,
    Sun,
    Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../../store/authStore';
import { Button } from '../ui/Button';
import useBackgroundBrightness from '../../hooks/useBackgroundBrightness';
import { useTheme } from '../../providers/ThemeProvider';

// ── Magnetic Wrapper for 2026 Physics-Based UI ──
const MagneticButton = ({ children, className }) => {
    const ref = useRef(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    const handleMouse = (e) => {
        if (!ref.current) return;
        const { clientX, clientY } = e;
        const { height, width, left, top } = ref.current.getBoundingClientRect();
        const middleX = clientX - (left + width / 2);
        const middleY = clientY - (top + height / 2);
        setPosition({ x: middleX * 0.2, y: middleY * 0.2 });
    };

    const reset = () => {
        setPosition({ x: 0, y: 0 });
    };

    return (
        <motion.div
            ref={ref}
            onMouseMove={handleMouse}
            onMouseLeave={reset}
            animate={{ x: position.x, y: position.y }}
            transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
            className={className}
        >
            {children}
        </motion.div>
    );
};

const Navbar = () => {
    const { user, profile, logout } = useAuthStore();
    const location = useLocation();
    const navRef = useRef(null);
    const { theme, resolvedTheme, setTheme } = useTheme();
    const isDark = resolvedTheme === 'dark';

    const isOverDark = useBackgroundBrightness(navRef);
    const isLight = isOverDark || isDark;
    const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Traveler';
    const isActive = (path) => location.pathname === path;

    const toggleTheme = () => setTheme(isDark ? 'light' : 'dark');

    // ── Ultra Premium Glassmorphism Pill Style ──
    const pillBg = isDark
        ? 'bg-black/50 backdrop-blur-3xl border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.8)]'
        : 'bg-white/50 backdrop-blur-3xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.08)]';

    const ThemeBtn = () => (
        <MagneticButton>
            <motion.button
                onClick={toggleTheme}
                className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${isDark
                    ? 'bg-white/[0.08] hover:bg-white/[0.15] text-amber-400 border border-white/[0.05]'
                    : 'bg-white hover:bg-slate-50 text-slate-600 shadow-sm border border-slate-200/50'
                    }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Toggle theme"
            >
                <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                        key={theme}
                        initial={{ y: -15, opacity: 0, rotate: -90, filter: 'blur(4px)' }}
                        animate={{ y: 0, opacity: 1, rotate: 0, filter: 'blur(0px)' }}
                        exit={{ y: 15, opacity: 0, rotate: 90, filter: 'blur(4px)' }}
                        transition={{ duration: 0.3, ease: "circOut" }}
                    >
                        {isDark ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
                    </motion.div>
                </AnimatePresence>
            </motion.button>
        </MagneticButton>
    );

    // -------------------------------------------------------------------------
    // RENDER: LANDING PAGE NAVBAR (Unauthenticated)
    // -------------------------------------------------------------------------
    if (!user) {
        return (
            <motion.nav 
                ref={navRef} 
                className="fixed top-6 left-0 right-0 z-50 flex justify-center pointer-events-none px-4"
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
                <div className={`pointer-events-auto flex items-center justify-between px-6 py-3 rounded-full transition-all duration-500 max-w-5xl w-full ${pillBg}`}>
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-3 group">
                        <motion.div 
                            className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/30"
                            whileHover={{ rotate: 15, scale: 1.05 }}
                            transition={{ type: "spring", stiffness: 300, damping: 10 }}
                        >
                            <Plane className="w-5 h-5" />
                        </motion.div>
                        <span className={`font-display font-bold text-xl tracking-tight transition-colors duration-300 ${isLight ? 'text-white' : 'text-slate-900'}`}>ROAMEO</span>
                    </Link>

                    {/* Landing Page Navigation */}
                    <div className="hidden md:flex items-center gap-2">
                        <MagneticButton>
                            <Link to="/" className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${isActive('/') ? (isLight ? 'bg-white/20 text-white' : 'bg-slate-100 text-blue-600') : (isLight ? 'text-white/80 hover:text-white hover:bg-white/10' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50')}`}>
                                Home
                            </Link>
                        </MagneticButton>
                        <MagneticButton>
                            <a href="/#features" className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${isLight ? 'text-white/80 hover:text-white hover:bg-white/10' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}>
                                Features
                            </a>
                        </MagneticButton>
                        <MagneticButton>
                            <Link to="/about" className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${isActive('/about') ? (isLight ? 'bg-white/20 text-white' : 'bg-slate-100 text-blue-600') : (isLight ? 'text-white/80 hover:text-white hover:bg-white/10' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50')}`}>
                                About
                            </Link>
                        </MagneticButton>
                    </div>

                    {/* Auth Buttons + Theme Toggle */}
                    <div className="flex items-center gap-3">
                        <ThemeBtn />
                        <MagneticButton>
                            <Link to="/login" className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${isLight ? 'text-white hover:bg-white/10' : 'text-slate-700 hover:bg-slate-100'}`}>
                                Log In
                            </Link>
                        </MagneticButton>
                        <MagneticButton>
                            <Link to="/signup">
                                <motion.div 
                                    whileHover={{ scale: 1.05 }} 
                                    whileTap={{ scale: 0.95 }}
                                    className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-bold px-6 py-2.5 rounded-full shadow-lg hover:shadow-xl transition-all"
                                >
                                    Get Started
                                </motion.div>
                            </Link>
                        </MagneticButton>
                    </div>
                </div>
            </motion.nav>
        );
    }

    // -------------------------------------------------------------------------
    // RENDER: DASHBOARD NAVBAR (Authenticated)
    // -------------------------------------------------------------------------
    return (
        <motion.nav 
            ref={navRef} 
            className="fixed top-6 left-0 right-0 z-50 flex justify-center pointer-events-none px-4"
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
            <div className={`pointer-events-auto flex items-center justify-between px-3 py-2.5 rounded-full transition-all duration-500 w-fit gap-6 ${pillBg}`}>
                {/* Logo */}
                <Link to="/" className="flex items-center gap-3 pl-3 group">
                    <motion.div 
                        className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/30"
                        whileHover={{ rotate: 15, scale: 1.05 }}
                    >
                        <Plane className="w-4 h-4" />
                    </motion.div>
                    <span className={`font-display font-bold text-lg tracking-tight hidden md:block transition-colors duration-300 ${isLight ? 'text-white' : 'text-slate-900'}`}>ROAMEO</span>
                </Link>

                {/* Main Navigation (Pill structure inner links) */}
                <div className="hidden lg:flex items-center gap-1">
                    <NavLink to="/" icon={<Globe className="w-4 h-4" />} label="Home" active={isActive('/')} isLight={isLight} isDark={isDark} />
                    
                    {/* Special AI Nav Pill */}
                    <MagneticButton>
                        <Link to="/ai" className={`group flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-full transition-all duration-300 ${isActive('/ai') || isActive('/chat')
                            ? (isDark ? 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/30' : 'bg-gradient-to-r from-purple-50 to-blue-50 text-blue-700 ring-1 ring-blue-200')
                            : (isLight ? 'text-white hover:bg-white/10 ring-1 ring-white/10' : 'text-slate-700 hover:bg-slate-100 ring-1 ring-slate-200/50')
                        }`}>
                            <Sparkles className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive('/ai') || isActive('/chat') ? (isDark ? 'text-blue-400' : 'text-blue-600') : isLight ? 'text-white/70' : 'text-slate-400'}`} />
                            AI Core
                        </Link>
                    </MagneticButton>

                    <div className={`w-px h-5 mx-1 transition-colors duration-300 ${isLight ? 'bg-white/20' : 'bg-slate-200/50'}`}></div>

                    <NavLink to="/my-trips" icon={<Map className="w-4 h-4" />} label="Trips" active={isActive('/trips') || isActive('/my-trips')} isLight={isLight} isDark={isDark} />
                    <NavLink to="/bookings" icon={<CreditCard className="w-4 h-4" />} label="Bookings" active={isActive('/bookings')} isLight={isLight} isDark={isDark} />
                    <NavLink to="/favourites" icon={<Heart className="w-4 h-4" />} label="Saved" active={isActive('/favourites')} isLight={isLight} isDark={isDark} />
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2 pr-1">
                    <ThemeBtn />
                    <div className={`flex items-center gap-2 pl-3 ml-1 border-l group cursor-pointer relative py-1 transition-colors duration-300 ${isLight ? 'border-white/20' : 'border-slate-200/50'}`}>
                        <MagneticButton>
                            <motion.div 
                                className={`w-10 h-10 rounded-full border flex items-center justify-center font-bold text-sm shadow-md transition-all duration-300 ${isLight
                                    ? 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                }`}
                            >
                                {displayName.charAt(0).toUpperCase()}
                            </motion.div>
                        </MagneticButton>

                        {/* Dropdown Menu */}
                        <div className={`absolute right-0 top-full mt-4 w-56 py-2 rounded-2xl shadow-2xl border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-4 group-hover:translate-y-0 z-50 ${isDark
                            ? 'bg-[#1a1a1a]/95 backdrop-blur-xl border-white/[0.08]'
                            : 'bg-white/95 backdrop-blur-xl border-slate-200/60'
                            }`}>
                            <div className="px-4 py-3 border-b border-white/5 dark:border-white/10">
                                <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{displayName}</p>
                                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{user.email}</p>
                            </div>
                            <div className="py-2">
                                <Link to="/settings" className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${isDark ? 'text-slate-300 hover:bg-white/[0.06] hover:text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
                                    <Settings className="w-4 h-4" />
                                    Settings
                                </Link>
                                <button
                                    onClick={() => logout()}
                                    className={`w-full text-left px-4 py-2.5 text-sm text-red-500 flex items-center gap-3 transition-colors ${isDark ? 'hover:bg-red-500/10' : 'hover:bg-red-50'}`}
                                >
                                    <LogOut className="w-4 h-4" />
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.nav>
    );
};

const NavLink = ({ to, icon, label, active, isLight, isDark }) => (
    <MagneticButton>
        <Link
            to={to}
            className={`group flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full transition-all duration-300 ${active
                ? (isLight
                    ? 'text-white bg-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]'
                    : 'text-slate-900 bg-white shadow-sm ring-1 ring-slate-200')
                : (isLight ? 'text-white/80 hover:text-white hover:bg-white/10' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50')
                }`}
        >
            <span className={`transition-transform duration-300 group-hover:scale-110 ${active ? (isLight ? 'text-white' : 'text-blue-600') : ''}`}>
                {icon}
            </span>
            {label}
        </Link>
    </MagneticButton>
);

export default Navbar;
