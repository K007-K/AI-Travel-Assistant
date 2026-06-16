import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import {
    Plane, Menu, X, Settings, CreditCard, LogOut, Map, LayoutDashboard, Plus
} from 'lucide-react';
import { useState } from 'react';

import useAuthStore from '../../store/authStore';

const Header = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const { user, isAuthenticated, logout } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();

    // Track scroll for floating pill effect
    const { scrollY } = useScroll();
    useMotionValueEvent(scrollY, "change", (latest) => {
        if (latest > 50) {
            setIsScrolled(true);
        } else {
            setIsScrolled(false);
        }
    });

    const handleLogout = () => {
        logout();
        setProfileMenuOpen(false);
        navigate('/');
    };

    // Guest Navigation (Updated to match requested structure)
    const guestLinks = [
        { name: 'Home', path: '/' },
        { name: 'Features', path: '/#features' },
        { name: 'Showcase', path: '/#showcase' },
        { name: 'Pricing', path: '/#pricing' },
    ];

    // Authenticated User Navigation
    const userLinks = [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
        { name: 'My Trips', path: '/my-trips', icon: Map },
        { name: 'Bookings', path: '/bookings', icon: CreditCard },
        { name: 'Budget', path: '/budget', icon: CreditCard },
    ];

    const navLinks = isAuthenticated ? userLinks : guestLinks;

    const handleNavClick = (path) => {
        setMobileMenuOpen(false);
        if (path.startsWith('/#')) {
            const element = document.getElementById(path.substring(2));
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        }
    };

    return (
        <motion.header
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                isScrolled 
                    ? 'py-4' // Scrolled: Add top padding to detach from edge
                    : 'py-0 border-b border-slate-200/20 dark:border-slate-800/20 bg-white/10 dark:bg-slate-900/10 backdrop-blur-md' // Top: Full width, subtle border
            }`}
        >
            <div className={`mx-auto transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                isScrolled
                    ? 'max-w-6xl px-4 md:px-6' // Scrolled: Shrink to pill width
                    : 'w-full px-6 md:px-12' // Top: Full width
            }`}>
                <div className={`flex items-center justify-between transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    isScrolled
                        ? 'h-[4.5rem] rounded-[2.5rem] bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border border-white/40 dark:border-slate-700/50 shadow-[0_8px_32px_rgba(0,0,0,0.08)] px-4 md:px-6'
                        : 'h-24'
                }`}>
                    
                    {/* Left Section: Logo */}
                    <Link to="/" className="flex items-center gap-3 group relative z-10">
                        <motion.div
                            whileHover={{ rotate: 15 }}
                            className="p-2.5 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20"
                        >
                            <Plane className="w-5 h-5" />
                        </motion.div>
                        <span className="text-2xl font-display font-black tracking-tight text-slate-900 dark:text-white">
                            ROAMEO
                        </span>
                    </Link>

                    {/* Center Section: Navigation */}
                    <div className="hidden lg:flex items-center absolute left-1/2 -translate-x-1/2">
                        <div className={`flex items-center gap-2 p-1.5 rounded-full transition-colors duration-300 ${
                            isScrolled ? 'bg-slate-100/50 dark:bg-slate-800/50' : ''
                        }`}>
                            {navLinks.map((link) => {
                                const isActive = link.path === '/' ? location.pathname === '/' && !location.hash : location.hash === link.path.substring(1);
                                
                                return (link.path.startsWith('/#') && location.pathname === '/') ? (
                                    <a
                                        key={link.name}
                                        href={link.path}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleNavClick(link.path);
                                        }}
                                        className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all relative cursor-pointer flex items-center gap-2
                                            ${isActive 
                                                ? 'text-blue-600' 
                                                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
                                            }
                                        `}
                                    >
                                        {link.icon && <link.icon className="w-4 h-4" />}
                                        {link.name}
                                        {isActive && (
                                            <motion.div 
                                                layoutId="activeNavIndicator"
                                                className="absolute inset-0 bg-white dark:bg-slate-800 rounded-full shadow-sm -z-10 border border-slate-200/50 dark:border-slate-700/50"
                                            />
                                        )}
                                    </a>
                                ) : (
                                    <Link
                                        key={link.path}
                                        to={link.path}
                                        className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all relative flex items-center gap-2
                                            ${isActive 
                                                ? 'text-blue-600' 
                                                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
                                            }
                                        `}
                                    >
                                        {link.icon && <link.icon className="w-4 h-4" />}
                                        {link.name}
                                        {isActive && (
                                            <motion.div 
                                                layoutId="activeNavIndicator"
                                                className="absolute inset-0 bg-white dark:bg-slate-800 rounded-full shadow-sm -z-10 border border-slate-200/50 dark:border-slate-700/50"
                                            />
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right Section: Auth & Actions */}
                    <div className="flex items-center gap-4 z-10">
                        {isAuthenticated ? (
                            <div className="relative hidden md:flex items-center gap-4">
                                <Link to="/ai/chat">
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-2.5 rounded-full font-bold text-sm shadow-md transition-all"
                                    >
                                        <Plus className="w-4 h-4" />
                                        <span>New Trip</span>
                                    </motion.button>
                                </Link>

                                <div className="relative hidden md:block">
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                                        className="flex items-center gap-2 p-1 pr-3 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
                                            {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                                        </div>
                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200 max-w-[100px] truncate">
                                            {user?.name || user?.email?.split('@')[0] || 'User'}
                                        </span>
                                    </motion.button>

                                    <AnimatePresence>
                                        {profileMenuOpen && (
                                            <>
                                                <div
                                                    className="fixed inset-0 z-10"
                                                    onClick={() => setProfileMenuOpen(false)}
                                                />
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                                    className="absolute right-0 top-full mt-3 w-64 bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 z-20"
                                                >
                                                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 mb-2">
                                                        <p className="text-sm font-bold text-slate-900 dark:text-white">{user?.name || user?.email?.split('@')[0]}</p>
                                                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate mt-1">{user?.email}</p>
                                                    </div>

                                                    <Link
                                                        to="/settings"
                                                        onClick={() => setProfileMenuOpen(false)}
                                                        className="flex items-center gap-3 w-full p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors text-sm font-bold"
                                                    >
                                                        <Settings className="w-4 h-4" /> Settings
                                                    </Link>

                                                    <button
                                                        onClick={handleLogout}
                                                        className="flex items-center gap-3 w-full p-3 rounded-2xl hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors text-sm font-bold mt-1"
                                                    >
                                                        <LogOut className="w-4 h-4" /> Sign Out
                                                    </button>
                                                </motion.div>
                                            </>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        ) : (
                            <div className="hidden lg:flex items-center gap-6">
                                <Link to="/login" className="text-sm font-bold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors">
                                    Log In
                                </Link>
                                <Link to="/signup" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-6 py-3 rounded-full shadow-[0_4px_14px_rgba(37,99,235,0.3)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.4)] transition-all hover:-translate-y-0.5">
                                    Get Started
                                </Link>
                            </div>
                        )}

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="lg:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                            {mobileMenuOpen ? (
                                <X className="w-6 h-6" />
                            ) : (
                                <Menu className="w-6 h-6" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu Dropdown */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="lg:hidden overflow-hidden mt-2 bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800"
                        >
                            <div className="p-4 space-y-2">
                                {navLinks.map((link) => (
                                    <Link
                                        key={link.name}
                                        to={link.path}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="block px-5 py-3.5 rounded-2xl text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                    >
                                        {link.name}
                                    </Link>
                                ))}
                                {!isAuthenticated ? (
                                    <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                                        <Link
                                            to="/login"
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="block w-full text-center py-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold text-slate-700 dark:text-slate-300"
                                        >
                                            Log In
                                        </Link>
                                        <Link
                                            to="/signup"
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="block w-full text-center py-3.5 bg-blue-600 text-white rounded-2xl font-bold shadow-lg"
                                        >
                                            Get Started
                                        </Link>
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-left px-5 py-3.5 text-red-600 font-bold hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl"
                                    >
                                        Sign Out
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.header>
    );
};

export default Header;
