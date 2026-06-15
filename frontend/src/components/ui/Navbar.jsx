import React, { useRef, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    Sparkles,
    Map,
    CreditCard,
    Heart,
    Globe,
    Plane,
    LogOut,
    Settings
} from 'lucide-react';
import { motion } from 'framer-motion';
import useAuthStore from '../../store/authStore';

const Navbar = () => {
    const { user, profile, logout } = useAuthStore();
    const location = useLocation();
    
    // Check if scrolled
    const [scrolled, setScrolled] = useState(false);
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Traveler';
    const isActive = (path) => location.pathname === path;

    // ── Ultra-Luxury Minimalist Glass ──
    const pillBg = scrolled 
        ? 'bg-white/90 backdrop-blur-2xl border border-slate-200/50 shadow-sm'
        : 'bg-white/50 backdrop-blur-2xl border border-white/60 shadow-sm';

    const textClass = 'text-slate-600 hover:text-slate-900';
    const activeClass = 'bg-white shadow-sm text-slate-900';

    // -------------------------------------------------------------------------
    // RENDER: LANDING PAGE NAVBAR (Unauthenticated)
    // -------------------------------------------------------------------------
    if (!user) {
        return (
            <motion.nav 
                className="fixed top-6 left-0 right-0 z-50 flex justify-center pointer-events-none px-4"
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
                <div className={`pointer-events-auto flex items-center justify-between pl-3 pr-3 py-2.5 rounded-full transition-all duration-500 max-w-4xl w-full ${pillBg}`}>
                    
                    {/* Logo Area */}
                    <div className="flex-1 flex items-center">
                        <Link to="/" className="flex items-center gap-3 pl-2 group">
                            <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white">
                                <Plane className="w-4 h-4 ml-0.5" />
                            </div>
                            <span className="font-display font-bold text-lg tracking-tight text-slate-900">
                                ROAMEO
                            </span>
                        </Link>
                    </div>

                    {/* Central Navigation */}
                    <div className="hidden md:flex items-center justify-center gap-2 flex-1">
                        {['Home', 'Features', 'About'].map((item) => {
                            const path = item === 'Home' ? '/' : `/${item.toLowerCase()}`;
                            const active = isActive(path) || (item === 'Features' && location.hash === '#features');
                            
                            return (
                                <Link 
                                    key={item}
                                    to={item === 'Features' ? '/#features' : path} 
                                    className={`relative px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${active ? activeClass : textClass}`}
                                >
                                    <span className="relative z-10">{item}</span>
                                </Link>
                            );
                        })}
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center justify-end gap-3 flex-1 pr-1">
                        <Link to="/login" className="px-4 py-2 rounded-full text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">
                            Log In
                        </Link>
                        
                        <Link to="/signup">
                            <div className="px-6 py-2.5 rounded-full text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-md">
                                Get Started
                            </div>
                        </Link>
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
            className="fixed top-6 left-0 right-0 z-50 flex justify-center pointer-events-none px-4"
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
            <div className={`pointer-events-auto flex items-center justify-between p-2.5 rounded-full transition-all duration-500 w-fit gap-4 ${pillBg}`}>
                
                {/* Logo */}
                <Link to="/" className="flex items-center gap-3 pl-2 pr-2">
                    <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white">
                        <Plane className="w-4 h-4 ml-0.5" />
                    </div>
                </Link>

                <div className="w-px h-4 bg-slate-200"></div>

                {/* Main Navigation */}
                <div className="hidden lg:flex items-center gap-2">
                    <NavLink to="/" icon={<Globe className="w-4 h-4" />} label="Home" active={isActive('/')} />
                    
                    <Link to="/ai" className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full transition-all duration-300 ${isActive('/ai') || isActive('/chat')
                        ? 'bg-slate-900 text-white shadow-md'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                    }`}>
                        <Sparkles className={`w-4 h-4 ${isActive('/ai') || isActive('/chat') ? 'text-white' : 'text-slate-400'}`} />
                        AI Core
                    </Link>

                    <NavLink to="/my-trips" icon={<Map className="w-4 h-4" />} label="Trips" active={isActive('/trips') || isActive('/my-trips')} />
                    <NavLink to="/bookings" icon={<CreditCard className="w-4 h-4" />} label="Bookings" active={isActive('/bookings')} />
                    <NavLink to="/favourites" icon={<Heart className="w-4 h-4" />} label="Saved" active={isActive('/favourites')} />
                </div>

                <div className="w-px h-4 bg-slate-200"></div>

                {/* Right Actions */}
                <div className="flex items-center gap-2 pr-1">
                    <div className="group relative">
                        <div className="cursor-pointer px-1">
                            <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors">
                                {displayName.charAt(0).toUpperCase()}
                            </div>
                        </div>

                        {/* Dropdown Menu */}
                        <div className="absolute right-0 top-full mt-2 w-56 py-2 rounded-2xl shadow-xl border bg-white border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                            <div className="px-4 py-3 border-b border-slate-50">
                                <p className="text-sm font-bold text-slate-900">{displayName}</p>
                                <p className="text-xs text-slate-500">{user.email}</p>
                            </div>
                            <div className="py-2">
                                <Link to="/settings" className="flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900">
                                    <Settings className="w-4 h-4" />
                                    Settings
                                </Link>
                                <button
                                    onClick={() => logout()}
                                    className="w-full text-left px-4 py-2 text-sm text-red-500 flex items-center gap-3 hover:bg-red-50 mt-1"
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

const NavLink = ({ to, icon, label, active }) => (
    <Link
        to={to}
        className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full transition-all duration-300 ${active ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'}`}
    >
        <span className={`${active ? 'text-slate-900' : 'text-slate-400'}`}>
            {icon}
        </span>
        <span>{label}</span>
    </Link>
);

export default Navbar;
