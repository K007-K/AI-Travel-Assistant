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
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../../store/authStore';

const Navbar = () => {
    const { user, profile, logout } = useAuthStore();
    const location = useLocation();
    
    // Check if scrolled past hero to transition navbar
    const [scrolled, setScrolled] = useState(false);
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Traveler';
    const isActive = (path) => location.pathname === path;

    // ── Transparent to Solid White Transition ──
    const navContainerClass = scrolled 
        ? 'bg-white shadow-md py-3'
        : 'bg-transparent py-6';

    const logoTextClass = scrolled ? 'text-slate-900' : 'text-white drop-shadow-md';
    const linkTextClass = scrolled ? 'text-slate-600 hover:text-blue-600' : 'text-white hover:text-white/80 drop-shadow-sm';
    const activeLinkClass = scrolled ? 'text-blue-600 font-bold' : 'text-white font-bold drop-shadow-md';
    
    const loginClass = scrolled ? 'text-slate-700 hover:text-blue-600' : 'text-white hover:text-white/80 drop-shadow-sm';
    const getStartedClass = scrolled 
        ? 'bg-blue-600 text-white hover:bg-blue-700'
        : 'bg-white text-slate-900 hover:bg-slate-100 shadow-lg';

    const logoIconBg = scrolled ? 'bg-blue-600 text-white' : 'bg-white text-blue-600';

    // -------------------------------------------------------------------------
    // RENDER: LANDING PAGE NAVBAR (Unauthenticated)
    // -------------------------------------------------------------------------
    if (!user) {
        return (
            <motion.nav 
                className={`fixed top-0 left-0 right-0 z-50 flex justify-center transition-all duration-500 ${navContainerClass}`}
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
                <div className="flex items-center justify-between w-full max-w-7xl px-6">
                    
                    {/* Logo Area */}
                    <div className="flex-1 flex items-center">
                        <Link to="/" className="flex items-center gap-3 group">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300 shadow-sm ${logoIconBg}`}>
                                <Plane className="w-4 h-4 ml-0.5" />
                            </div>
                            <span className={`font-display font-black text-xl tracking-tight transition-colors duration-300 ${logoTextClass}`}>
                                ROAMEO
                            </span>
                        </Link>
                    </div>

                    {/* Central Navigation */}
                    <div className="hidden md:flex items-center justify-center gap-8 flex-1">
                        {['Home', 'Destinations', 'Tours', 'Blog'].map((item) => {
                            const path = item === 'Home' ? '/' : `/${item.toLowerCase()}`;
                            const active = isActive(path) || (item === 'Destinations' && location.hash === '#destinations');
                            
                            return (
                                <Link 
                                    key={item}
                                    to={item === 'Destinations' ? '/#destinations' : path} 
                                    className={`text-sm font-semibold transition-all duration-300 relative group ${active ? activeLinkClass : linkTextClass}`}
                                >
                                    {item}
                                    {/* Minimalist underline hover effect */}
                                    <div className={`absolute -bottom-1 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full ${scrolled ? 'bg-blue-600' : 'bg-white'}`} />
                                    {active && <div className={`absolute -bottom-1 left-0 w-full h-0.5 ${scrolled ? 'bg-blue-600' : 'bg-white'}`} />}
                                </Link>
                            );
                        })}
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center justify-end gap-6 flex-1">
                        <Link to="/login" className={`text-sm font-bold transition-colors ${loginClass}`}>
                            Log In
                        </Link>
                        
                        <Link to="/signup">
                            <div className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${getStartedClass}`}>
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
            className={`fixed top-0 left-0 right-0 z-50 flex justify-center transition-all duration-500 ${navContainerClass}`}
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
            <div className="flex items-center justify-between w-full max-w-7xl px-6">
                
                {/* Logo */}
                <Link to="/" className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300 shadow-sm ${logoIconBg}`}>
                        <Plane className="w-4 h-4 ml-0.5" />
                    </div>
                </Link>

                {/* Main Navigation */}
                <div className="hidden lg:flex items-center gap-6">
                    <NavLink to="/" icon={<Globe className="w-4 h-4" />} label="Home" active={isActive('/')} scrolled={scrolled} />
                    
                    <Link to="/ai" className={`flex items-center gap-2 text-sm font-bold transition-all duration-300 ${isActive('/ai') || isActive('/chat')
                        ? (scrolled ? 'text-blue-600' : 'text-amber-300 drop-shadow-md')
                        : (scrolled ? 'text-slate-600 hover:text-blue-600' : 'text-white hover:text-white/80 drop-shadow-sm')
                    }`}>
                        <Sparkles className="w-4 h-4" />
                        AI Core
                    </Link>

                    <NavLink to="/my-trips" icon={<Map className="w-4 h-4" />} label="Trips" active={isActive('/trips') || isActive('/my-trips')} scrolled={scrolled} />
                    <NavLink to="/bookings" icon={<CreditCard className="w-4 h-4" />} label="Bookings" active={isActive('/bookings')} scrolled={scrolled} />
                    <NavLink to="/favourites" icon={<Heart className="w-4 h-4" />} label="Saved" active={isActive('/favourites')} scrolled={scrolled} />
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2">
                    <div className="group relative">
                        <div className="cursor-pointer px-1">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-colors shadow-sm ${scrolled ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-white text-blue-600 hover:bg-white/90'}`}>
                                {displayName.charAt(0).toUpperCase()}
                            </div>
                        </div>

                        {/* Dropdown Menu */}
                        <div className="absolute right-0 top-full mt-4 w-56 py-2 rounded-xl shadow-xl border bg-white border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                            <div className="px-4 py-3 border-b border-slate-50">
                                <p className="text-sm font-bold text-slate-900">{displayName}</p>
                                <p className="text-xs text-slate-500">{user.email}</p>
                            </div>
                            <div className="py-2">
                                <Link to="/settings" className="flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-blue-600">
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

const NavLink = ({ to, icon, label, active, scrolled }) => {
    const linkTextClass = scrolled ? 'text-slate-600 hover:text-blue-600' : 'text-white hover:text-white/80 drop-shadow-sm';
    const activeLinkClass = scrolled ? 'text-blue-600 font-bold' : 'text-white font-bold drop-shadow-md';

    return (
        <Link
            to={to}
            className={`flex items-center gap-2 text-sm font-semibold transition-all duration-300 relative group ${active ? activeLinkClass : linkTextClass}`}
        >
            <span>{icon}</span>
            <span>{label}</span>
            <div className={`absolute -bottom-1 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full ${scrolled ? 'bg-blue-600' : 'bg-white'}`} />
            {active && <div className={`absolute -bottom-1 left-0 w-full h-0.5 ${scrolled ? 'bg-blue-600' : 'bg-white'}`} />}
        </Link>
    );
};

export default Navbar;
