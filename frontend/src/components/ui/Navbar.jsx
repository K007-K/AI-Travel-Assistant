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
import useBackgroundBrightness from '../../hooks/useBackgroundBrightness';
import { useTheme } from '../../providers/ThemeProvider';

// ── Ultra-Smooth Magnetic Physics ──
const MagneticButton = ({ children, className, spring = { type: "spring", stiffness: 150, damping: 15, mass: 0.1 } }) => {
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
            transition={spring}
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

    // ── Dynamic Background Detection ──
    const isOverDark = useBackgroundBrightness(navRef);
    const isLightContent = isOverDark || isDark; // If background is dark, text must be light
    
    const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Traveler';
    const isActive = (path) => location.pathname === path;

    const toggleTheme = () => setTheme(isDark ? 'light' : 'dark');

    // ── Masterpiece Glassmorphism ──
    // Instead of milky white (which turns grey over black), we use ultra-sheer transparency
    // with heavy blur, fine borders, and an inner light reflection (box-shadow inset).
    const pillBg = isLightContent
        ? 'bg-[#ffffff08] backdrop-blur-3xl border border-white/[0.12] shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]'
        : 'bg-white/60 backdrop-blur-3xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.8)]';

    const ThemeBtn = () => (
        <MagneticButton>
            <motion.button
                onClick={toggleTheme}
                className={`relative flex items-center justify-center w-10 h-10 rounded-full transition-colors duration-300 ${isLightContent
                    ? 'hover:bg-white/[0.08] text-white/90 hover:text-white'
                    : 'hover:bg-slate-900/5 text-slate-600 hover:text-slate-900'
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
                <div className={`pointer-events-auto flex items-center justify-between pl-2 pr-2 py-2 rounded-full transition-all duration-500 max-w-4xl w-full ${pillBg}`}>
                    
                    {/* Logo Area */}
                    <div className="flex-1 flex items-center">
                        <MagneticButton>
                            <Link to="/" className="flex items-center gap-3 pl-2 group">
                                <motion.div 
                                    className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 ring-1 ring-white/20"
                                    whileHover={{ rotate: 15, scale: 1.05 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 10 }}
                                >
                                    <Plane className="w-5 h-5 ml-0.5" />
                                </motion.div>
                                <span className={`font-display font-bold text-xl tracking-tight transition-colors duration-300 ${isLightContent ? 'text-white' : 'text-slate-900'}`}>
                                    ROAMEO
                                </span>
                            </Link>
                        </MagneticButton>
                    </div>

                    {/* Central Navigation */}
                    <div className="hidden md:flex items-center justify-center gap-1 flex-1">
                        {['Home', 'Features', 'About'].map((item) => {
                            const path = item === 'Home' ? '/' : `/${item.toLowerCase()}`;
                            const active = isActive(path) || (item === 'Features' && location.hash === '#features');
                            
                            return (
                                <MagneticButton key={item}>
                                    <Link 
                                        to={item === 'Features' ? '/#features' : path} 
                                        className={`relative px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${isLightContent ? 'text-white/80 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
                                    >
                                        <span className="relative z-10">{item}</span>
                                        {active && (
                                            <motion.div 
                                                layoutId="nav-indicator"
                                                className={`absolute inset-0 rounded-full ${isLightContent ? 'bg-white/[0.08] border border-white/[0.05]' : 'bg-slate-900/5'}`}
                                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                            />
                                        )}
                                    </Link>
                                </MagneticButton>
                            );
                        })}
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center justify-end gap-1 flex-1 pr-1">
                        <ThemeBtn />
                        <div className={`w-px h-5 mx-2 transition-colors duration-300 ${isLightContent ? 'bg-white/10' : 'bg-slate-200'}`}></div>
                        
                        <MagneticButton>
                            <Link to="/login" className={`px-4 py-2.5 rounded-full text-sm font-semibold transition-colors duration-300 ${isLightContent ? 'text-white/90 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}>
                                Log In
                            </Link>
                        </MagneticButton>
                        
                        <MagneticButton>
                            <Link to="/signup">
                                <motion.div 
                                    whileHover={{ scale: 1.02 }} 
                                    whileTap={{ scale: 0.98 }}
                                    className={`relative overflow-hidden group px-6 py-2.5 rounded-full text-sm font-bold shadow-lg transition-all ${isLightContent 
                                        ? 'bg-white text-slate-900 hover:shadow-white/20' 
                                        : 'bg-slate-900 text-white hover:shadow-slate-900/20'}`}
                                >
                                    <span className="relative z-10">Get Started</span>
                                    {/* Subtle shine effect on hover */}
                                    <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-0" />
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
            <div className={`pointer-events-auto flex items-center justify-between p-2 rounded-full transition-all duration-500 w-fit gap-2 ${pillBg}`}>
                
                {/* Logo */}
                <MagneticButton>
                    <Link to="/" className="flex items-center gap-3 pl-2 pr-4 group">
                        <motion.div 
                            className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 ring-1 ring-white/20"
                            whileHover={{ rotate: 15, scale: 1.05 }}
                        >
                            <Plane className="w-5 h-5 ml-0.5" />
                        </motion.div>
                    </Link>
                </MagneticButton>

                <div className={`w-px h-5 mx-1 transition-colors duration-300 ${isLightContent ? 'bg-white/10' : 'bg-slate-200'}`}></div>

                {/* Main Navigation */}
                <div className="hidden lg:flex items-center gap-1">
                    <NavLink to="/" icon={<Globe className="w-4 h-4" />} label="Home" active={isActive('/')} isLight={isLightContent} />
                    
                    {/* Special AI Nav Pill */}
                    <MagneticButton>
                        <Link to="/ai" className={`relative group flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-full transition-all duration-300 overflow-hidden ${isActive('/ai') || isActive('/chat')
                            ? (isLightContent ? 'text-white' : 'text-blue-700')
                            : (isLightContent ? 'text-white/80 hover:text-white' : 'text-slate-600 hover:text-slate-900')
                        }`}>
                            {(isActive('/ai') || isActive('/chat')) && (
                                <motion.div 
                                    layoutId="nav-indicator-auth"
                                    className={`absolute inset-0 rounded-full ${isLightContent ? 'bg-blue-500/20 border border-blue-400/30' : 'bg-blue-50 border border-blue-200'}`}
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <span className="relative z-10 flex items-center gap-2">
                                <Sparkles className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive('/ai') || isActive('/chat') ? (isLightContent ? 'text-blue-400' : 'text-blue-600') : (isLightContent ? 'text-white/70' : 'text-slate-400')}`} />
                                AI Core
                            </span>
                        </Link>
                    </MagneticButton>

                    <NavLink to="/my-trips" icon={<Map className="w-4 h-4" />} label="Trips" active={isActive('/trips') || isActive('/my-trips')} isLight={isLightContent} />
                    <NavLink to="/bookings" icon={<CreditCard className="w-4 h-4" />} label="Bookings" active={isActive('/bookings')} isLight={isLightContent} />
                    <NavLink to="/favourites" icon={<Heart className="w-4 h-4" />} label="Saved" active={isActive('/favourites')} isLight={isLightContent} />
                </div>

                <div className={`w-px h-5 mx-2 transition-colors duration-300 ${isLightContent ? 'bg-white/10' : 'bg-slate-200'}`}></div>

                {/* Right Actions */}
                <div className="flex items-center gap-1 pr-1">
                    <ThemeBtn />
                    
                    <div className="group relative">
                        <MagneticButton>
                            <div className="cursor-pointer px-2 py-1">
                                <motion.div 
                                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${isLightContent
                                        ? 'bg-[#ffffff15] text-white border border-white/10 hover:bg-[#ffffff25]'
                                        : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'
                                    }`}
                                >
                                    {displayName.charAt(0).toUpperCase()}
                                </motion.div>
                            </div>
                        </MagneticButton>

                        {/* Dropdown Menu */}
                        <div className={`absolute right-0 top-full mt-2 w-56 py-2 rounded-2xl shadow-2xl border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-4 group-hover:translate-y-0 z-50 ${isDark
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

const NavLink = ({ to, icon, label, active, isLight }) => (
    <MagneticButton>
        <Link
            to={to}
            className={`relative group flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-full transition-colors duration-300 ${active
                ? (isLight ? 'text-white' : 'text-slate-900')
                : (isLight ? 'text-white/80 hover:text-white' : 'text-slate-600 hover:text-slate-900')
                }`}
        >
            {active && (
                <motion.div 
                    layoutId="nav-indicator-auth"
                    className={`absolute inset-0 rounded-full ${isLight ? 'bg-white/[0.08] border border-white/[0.05]' : 'bg-slate-900/5 border border-slate-200/50'}`}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
            )}
            <span className={`relative z-10 transition-transform duration-300 group-hover:scale-110 ${active ? (isLight ? 'text-white' : 'text-blue-600') : ''}`}>
                {icon}
            </span>
            <span className="relative z-10">{label}</span>
        </Link>
    </MagneticButton>
);

export default Navbar;
