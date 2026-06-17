import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    Sparkles,
    Map,
    CreditCard,
    Heart,
    Globe,
    Plane,
    LogOut,
    Settings,
    Menu,
    X,
    LayoutDashboard
} from 'lucide-react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import useAuthStore from '../../store/authStore';
import { LiquidContainer } from './liquid-glass-button';

const Navbar = () => {
    const { user, profile, logout } = useAuthStore();
    const location = useLocation();
    const navigate = useNavigate();

    // Check if scrolled past hero to transition navbar
    const [scrolled, setScrolled] = useState(false);
    const [isDarkBg, setIsDarkBg] = useState(true);
    const { scrollY } = useScroll();
    
    useMotionValueEvent(scrollY, "change", (latest) => {
        setScrolled(latest > 50);
    });

    React.useEffect(() => {
        const checkSectionTheme = () => {
            const sections = document.querySelectorAll('section');
            const navCenterY = 50; // approximate vertical center of the navbar
            
            let currentSection = null;
            for (const section of sections) {
                const rect = section.getBoundingClientRect();
                if (rect.top <= navCenterY && rect.bottom >= navCenterY) {
                    currentSection = section;
                    break;
                }
            }
            
            if (currentSection) {
                const isDark = currentSection.classList.contains('bg-black') || 
                               currentSection.classList.contains('bg-[#030712]');
                setIsDarkBg(isDark);
            } else {
                // Fallback to document level theme if no section intersects
                const isDocumentDark = document.documentElement.classList.contains('dark');
                setIsDarkBg(isDocumentDark);
            }
        };

        window.addEventListener('scroll', checkSectionTheme, { passive: true });
        // Run on mount and location change
        checkSectionTheme();
        return () => window.removeEventListener('scroll', checkSectionTheme);
    }, [location.pathname]); // Added location.pathname to dependency array

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);

    const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Traveler';
    const isActive = (path) => {
        if (path.startsWith('/#')) {
            return location.pathname === '/' && location.hash === path.substring(1);
        }
        return location.pathname === path;
    };

    // Hide navbar on auth routes for split-screen immersion
    const authRoutes = ['/login', '/signup', '/forgot-password', '/reset-password'];
    if (authRoutes.includes(location.pathname)) {
        return null;
    }

    // Outer container (controls detachment from top)
    const navContainerClass = scrolled 
        ? 'py-4' // Scrolled: Detached
        : 'py-0 bg-transparent'; // Top: Attached edge-to-edge

    const NavContainer = ({ children }) => {
        if (scrolled) {
            return (
                <div className={`flex items-center justify-between w-full h-[4.5rem] px-4 md:px-6 transition-all duration-500 backdrop-blur-2xl shadow-2xl rounded-full border ${isDarkBg ? 'bg-[#030712]/60 border-white/10' : 'bg-white/60 border-slate-200/50'}`}>
                    {children}
                </div>
            );
        }
        return (
            <div className="flex items-center justify-between w-full max-w-7xl px-6 h-24 transition-all duration-500">
                {children}
            </div>
        );
    };

    // Colors transition based on scroll and background
    const baseTextColor = isDarkBg ? 'text-white' : 'text-slate-900';
    const mutedTextColor = isDarkBg ? 'text-white/80' : 'text-slate-600';

    const logoTextClass = scrolled ? `${baseTextColor} drop-shadow-sm transition-colors duration-300` : 'text-white drop-shadow-md';
    const linkTextClass = scrolled ? `${mutedTextColor} hover:text-blue-600 transition-colors duration-300` : 'text-white/90 hover:text-white drop-shadow-sm transition-colors duration-300';
    const activeLinkClass = scrolled ? `${baseTextColor} font-bold hover:text-blue-600 transition-colors duration-300` : 'text-white font-bold drop-shadow-md transition-colors duration-300';
    
    const loginClass = scrolled ? `${baseTextColor} font-bold hover:text-blue-600 transition-colors duration-300` : 'text-white font-bold drop-shadow-md hover:text-white/90 transition-colors duration-300';
    const getStartedClass = scrolled 
        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-[0_4px_14px_rgba(37,99,235,0.3)] hover:-translate-y-0.5'
        : ''; // Will be wrapped in LiquidContainer

    const logoIconBg = scrolled ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-white text-blue-600 shadow-md shadow-white/20';

    const handleNavClick = (path) => {
        setMobileMenuOpen(false);
        if (path.startsWith('/#')) {
            if (location.pathname !== '/') {
                navigate(path);
            } else {
                navigate(path, { replace: true });
                setTimeout(() => {
                    const element = document.getElementById(path.substring(2));
                    if (element) {
                        element.scrollIntoView({ behavior: 'smooth' });
                    }
                }, 50);
            }
        }
    };

    const guestLinks = [
        { name: 'Home', path: '/' },
        { name: 'Features', path: '/#features' },
        { name: 'Showcase', path: '/#showcase' },
        { name: 'Join Free', path: '/#join' },
    ];

    // -------------------------------------------------------------------------
    // RENDER: LANDING PAGE NAVBAR (Unauthenticated)
    // -------------------------------------------------------------------------
    if (!user) {
        return (
            <motion.nav 
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${navContainerClass}`}
                initial={{ y: -100 }}
                animate={{ y: 0 }}
            >
                <div className={`mx-auto transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${scrolled ? 'max-w-6xl px-4 md:px-6' : 'w-full max-w-7xl px-6'}`}>
                    <NavContainer>
                        
                        <div className="flex items-center relative z-10">
                            <Link 
                                to="/" 
                                onClick={() => {
                                    if (location.pathname === '/') window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="flex items-center gap-3 group"
                            >
                                <motion.div whileHover={{ rotate: 15 }} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-300 ${logoIconBg}`}>
                                    <Plane className="w-5 h-5 ml-0.5" />
                                </motion.div>
                                <span className={`font-display font-black text-2xl tracking-tight transition-colors duration-300 ${logoTextClass}`}>
                                    ROAMEO
                                </span>
                            </Link>
                        </div>

                        {/* Central Navigation - Floating Pill Indicator */}
                        <div className="hidden lg:flex items-center absolute left-1/2 -translate-x-1/2">
                            <div className="flex items-center gap-2 p-1.5 rounded-full transition-colors duration-300">
                                {guestLinks.map((link) => {
                                    const active = isActive(link.path);
                                    return link.path.startsWith('/#') ? (
                                        <a 
                                            key={link.name}
                                            href={link.path}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleNavClick(link.path);
                                            }}
                                            className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all relative cursor-pointer ${active ? activeLinkClass : linkTextClass}`}
                                        >
                                            {link.name}
                                        </a>
                                    ) : (
                                        <Link 
                                            key={link.name}
                                            to={link.path} 
                                            onClick={() => {
                                                if (link.path === '/' && location.pathname === '/') {
                                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                                }
                                            }}
                                            className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all relative ${active ? activeLinkClass : linkTextClass}`}
                                        >
                                            {link.name}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Right Actions */}
                        <div className="hidden lg:flex items-center justify-end gap-6 z-10 relative pointer-events-auto">
                            <button onClick={() => navigate('/login')} className={`text-sm font-bold transition-colors ${loginClass}`}>
                                Log In
                            </button>
                            
                            {scrolled ? (
                                <button onClick={() => navigate('/signup')} className={`px-6 py-3 rounded-full text-sm font-bold transition-all duration-300 ${getStartedClass}`}>
                                    Get Started
                                </button>
                            ) : (
                                <LiquidContainer onClick={() => navigate('/signup')} className="px-6 py-2.5 rounded-full text-sm font-bold text-white shadow-lg bg-white/20 backdrop-blur-md border border-white/30 hover:bg-white/30 transition-all duration-300">
                                    Get Started
                                </LiquidContainer>
                            )}
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className={`lg:hidden p-2 rounded-xl transition-colors z-10 ${scrolled ? 'bg-slate-100 text-slate-600' : 'bg-white/20 text-white backdrop-blur-md border border-white/30'}`}
                        >
                            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </NavContainer>

                    {/* Mobile Menu */}
                    <AnimatePresence>
                        {mobileMenuOpen && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="lg:hidden overflow-hidden mt-2 bg-white rounded-3xl shadow-xl border border-slate-200"
                            >
                                <div className="p-4 space-y-2">
                                    {guestLinks.map((link) => (
                                        <Link
                                            key={link.name}
                                            to={link.path}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="block px-5 py-3.5 rounded-2xl text-slate-700 font-bold hover:bg-slate-50 transition-colors"
                                        >
                                            {link.name}
                                        </Link>
                                    ))}
                                    <div className="pt-4 mt-4 border-t border-slate-100 space-y-3">
                                        <button onClick={() => { setMobileMenuOpen(false); navigate('/login'); }} className="block w-full text-center py-3.5 bg-slate-50 rounded-2xl font-bold text-slate-700">
                                            Log In
                                        </button>
                                        <button onClick={() => { setMobileMenuOpen(false); navigate('/signup'); }} className="block w-full text-center py-3.5 bg-blue-600 text-white rounded-2xl font-bold shadow-lg">
                                            Get Started
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.nav>
        );
    }

    // -------------------------------------------------------------------------
    // RENDER: DASHBOARD NAVBAR (Authenticated)
    // -------------------------------------------------------------------------
    return (
        <motion.nav 
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${navContainerClass}`}
            initial={{ y: -100 }}
            animate={{ y: 0 }}
        >
            <div className={`mx-auto transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${scrolled ? 'max-w-6xl px-4 md:px-6' : 'w-full max-w-7xl px-6'}`}>
                <NavContainer>
                    
                    {/* Logo Area */}
                    <div className="flex items-center relative z-10">
                        <Link 
                            to="/" 
                            onClick={() => {
                                if (location.pathname === '/') window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="flex items-center gap-3 group"
                        >
                            <motion.div whileHover={{ rotate: 15 }} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-300 ${logoIconBg}`}>
                                <Plane className="w-5 h-5 ml-0.5" />
                            </motion.div>
                            <span className={`hidden md:block font-display font-black text-2xl tracking-tight transition-colors duration-300 ${logoTextClass}`}>
                                ROAMEO
                            </span>
                        </Link>
                    </div>

                    {/* Main Navigation */}
                    <div className="hidden lg:flex items-center absolute left-1/2 -translate-x-1/2">
                        <div className="flex items-center gap-2 p-1.5 rounded-full transition-colors duration-300">
                            <NavLink to="/" icon={<Globe className="w-4 h-4" />} label="Home" active={isActive('/')} scrolled={scrolled} />
                            <NavLink to="/ai" icon={<Sparkles className="w-4 h-4" />} label="AI Core" active={isActive('/ai') || isActive('/chat')} scrolled={scrolled} />
                            <NavLink to="/my-trips" icon={<Map className="w-4 h-4" />} label="Trips" active={isActive('/trips') || isActive('/my-trips')} scrolled={scrolled} />
                            <NavLink to="/bookings" icon={<CreditCard className="w-4 h-4" />} label="Bookings" active={isActive('/bookings')} scrolled={scrolled} />
                            <NavLink to="/favourites" icon={<Heart className="w-4 h-4" />} label="Saved" active={isActive('/favourites')} scrolled={scrolled} />
                        </div>
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center justify-end gap-2 z-10">
                        <div className="group relative">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                                className={`flex items-center gap-2 p-1 pr-3 rounded-full border transition-all duration-300 ${scrolled ? 'bg-slate-100 border-slate-200' : 'bg-white/20 backdrop-blur-md border-white/30'}`}
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ${scrolled ? 'bg-white text-blue-600' : 'bg-white text-blue-600'}`}>
                                    {displayName.charAt(0).toUpperCase()}
                                </div>
                                <span className={`text-sm font-bold max-w-[100px] truncate ${scrolled ? 'text-slate-700' : 'text-white'}`}>
                                    {displayName}
                                </span>
                            </motion.button>

                            {/* Dropdown Menu */}
                            <AnimatePresence>
                                {profileMenuOpen && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setProfileMenuOpen(false)} />
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                            className="absolute right-0 top-full mt-3 w-64 bg-white rounded-3xl shadow-xl border border-slate-200 p-2 z-20"
                                        >
                                            <div className="p-4 border-b border-slate-100 mb-2">
                                                <p className="text-sm font-bold text-slate-900">{displayName}</p>
                                                <p className="text-xs font-medium text-slate-500 mt-1 truncate">{user.email}</p>
                                            </div>
                                            <Link to="/settings" onClick={() => setProfileMenuOpen(false)} className="flex items-center gap-3 w-full p-3 rounded-2xl hover:bg-slate-50 text-slate-700 transition-colors text-sm font-bold">
                                                <Settings className="w-4 h-4" /> Settings
                                            </Link>
                                            <button onClick={() => { logout(); setProfileMenuOpen(false); }} className="flex items-center gap-3 w-full p-3 rounded-2xl hover:bg-red-50 text-red-600 transition-colors text-sm font-bold mt-1">
                                                <LogOut className="w-4 h-4" /> Sign Out
                                            </button>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Mobile Menu Button for Authenticated State */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className={`lg:hidden p-2 ml-2 rounded-xl transition-colors ${scrolled ? 'bg-slate-100 text-slate-600' : 'bg-white/20 text-white backdrop-blur-md border border-white/30'}`}
                        >
                            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </NavContainer>

                {/* Mobile Menu for Authenticated State */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="lg:hidden overflow-hidden mt-2 bg-white rounded-3xl shadow-xl border border-slate-200"
                        >
                            <div className="p-4 space-y-2">
                                <Link to="/" onClick={() => setMobileMenuOpen(false)} className="block px-5 py-3.5 rounded-2xl text-slate-700 font-bold hover:bg-slate-50">Home</Link>
                                <Link to="/ai" onClick={() => setMobileMenuOpen(false)} className="block px-5 py-3.5 rounded-2xl text-blue-600 font-bold hover:bg-slate-50">AI Core</Link>
                                <Link to="/my-trips" onClick={() => setMobileMenuOpen(false)} className="block px-5 py-3.5 rounded-2xl text-slate-700 font-bold hover:bg-slate-50">Trips</Link>
                                <Link to="/bookings" onClick={() => setMobileMenuOpen(false)} className="block px-5 py-3.5 rounded-2xl text-slate-700 font-bold hover:bg-slate-50">Bookings</Link>
                                <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="w-full text-left px-5 py-3.5 text-red-600 font-bold hover:bg-red-50 rounded-2xl mt-4 border-t border-slate-100">Sign Out</button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.nav>
    );
};

const NavLink = ({ to, icon, label, active, scrolled }) => {
    const linkTextClass = scrolled ? 'text-slate-600 hover:text-slate-900' : 'text-white/90 hover:text-white drop-shadow-sm';
    const activeLinkClass = scrolled ? 'text-blue-600 font-bold' : 'text-white font-bold drop-shadow-md';

    return (
        <Link
            to={to}
            className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all relative flex items-center gap-2 cursor-pointer ${active ? activeLinkClass : linkTextClass}`}
        >
            <span>{icon}</span>
            <span>{label}</span>
        </Link>
    );
};

export default Navbar;
