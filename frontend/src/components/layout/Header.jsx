import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plane, Menu, X, Sparkles, Settings, CreditCard, Globe, LogOut, Map, LayoutDashboard, Plus
} from 'lucide-react';
import { useState } from 'react';

import useAuthStore from '../../store/authStore';

const Header = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const { user, isAuthenticated, logout } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        setProfileMenuOpen(false);
        navigate('/');
    };

    // Guest Navigation
    const guestLinks = [
        { name: 'Home', path: '/' },
        { name: 'About', path: '/about' },
        { name: 'Features', path: '/#features' },
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
            className="fixed top-0 left-0 right-0 z-50 glass border-b border-slate-200/50 dark:border-slate-700/50"
        >
            <nav className="container-custom">
                <div className="flex items-center justify-between h-20">
                    {/* Logo - Rebranded to ROAMEO */}
                    <Link to="/" className="flex items-center gap-2 group">
                        <motion.div
                            whileHover={{ rotate: 15 }}
                            className="p-2 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500"
                        >
                            <Plane className="w-6 h-6 text-white" />
                        </motion.div>
                        <span className="text-xl font-display font-bold gradient-text">
                            ROAMEO
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => (
                            (link.path.startsWith('/#') && location.pathname === '/') ? (
                                <a
                                    key={link.name}
                                    href={link.path}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleNavClick(link.path);
                                    }}
                                    className="text-muted-foreground hover:text-primary font-medium transition-colors relative group cursor-pointer flex items-center gap-1"
                                >
                                    {link.icon && <link.icon className="w-4 h-4" />}
                                    {link.name}
                                    <motion.span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary-500 to-accent-500 group-hover:w-full transition-all duration-300" />
                                </a>
                            ) : (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className="text-muted-foreground hover:text-primary font-medium transition-colors relative group flex items-center gap-1"
                                >
                                    {link.icon && <link.icon className="w-4 h-4" />}
                                    {link.name}
                                    <motion.span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary-500 to-accent-500 group-hover:w-full transition-all duration-300" />
                                </Link>
                            )
                        ))}
                    </div>

                    {/* Right Section */}
                    <div className="flex items-center gap-4">


                        {isAuthenticated ? (
                            <div className="relative hidden md:flex items-center gap-4">
                                <Link to="/ai/chat">
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="hidden md:flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-full font-medium text-sm shadow-md hover:shadow-lg transition-all"
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
                                        className="flex items-center gap-2 p-1 pr-3 rounded-full bg-secondary/50 border border-border"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm border border-primary/20">
                                            {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                                        </div>
                                        <span className="text-sm font-medium text-foreground max-w-[100px] truncate">
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
                                                    className="absolute right-0 top-full mt-2 w-64 bg-popover rounded-2xl shadow-xl border border-border p-2 z-20"
                                                >
                                                    <div className="p-3 border-b border-border/50 mb-2">
                                                        <p className="text-sm font-semibold text-foreground">{user?.name || user?.email?.split('@')[0]}</p>
                                                        <p className="text-xs text-muted-foreground truncate mb-1">{user?.email}</p>
                                                    </div>

                                                    <Link
                                                        to="/settings"
                                                        onClick={() => setProfileMenuOpen(false)}
                                                        className="flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-accent text-foreground transition-colors text-sm"
                                                    >
                                                        <Settings className="w-4 h-4" /> Settings
                                                    </Link>

                                                    <button
                                                        onClick={handleLogout}
                                                        className="flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-destructive/10 text-destructive transition-colors text-sm mt-1"
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
                            <div className="hidden md:flex items-center gap-4">
                                <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                                    Log In
                                </Link>
                                <Link to="/signup" className="btn btn-primary text-sm px-5 py-2.5 rounded-full">
                                    Sign Up
                                </Link>
                            </div>
                        )}

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden p-2 rounded-lg hover:bg-accent transition-colors"
                        >
                            {mobileMenuOpen ? (
                                <X className="w-6 h-6" />
                            ) : (
                                <Menu className="w-6 h-6" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                <motion.div
                    initial={false}
                    animate={{
                        height: mobileMenuOpen ? 'auto' : 0,
                        opacity: mobileMenuOpen ? 1 : 0,
                    }}
                    className="md:hidden overflow-hidden"
                >
                    <div className="py-4 space-y-2">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                to={link.path}
                                onClick={() => setMobileMenuOpen(false)}
                                className="block px-4 py-3 rounded-lg text-foreground hover:bg-accent transition-colors"
                            >
                                {link.name}
                            </Link>
                        ))}
                        {!isAuthenticated ? (
                            <div className="pt-4 mt-4 border-t border-border space-y-3">
                                <Link
                                    to="/login"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="block w-full text-center py-3 bg-secondary rounded-xl font-semibold"
                                >
                                    Log In
                                </Link>
                                <Link
                                    to="/signup"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="block w-full text-center py-3 bg-primary text-primary-foreground rounded-xl font-semibold shadow-lg"
                                >
                                    Sign Up Free
                                </Link>
                            </div>
                        ) : (
                            <button
                                onClick={handleLogout}
                                className="w-full text-left px-4 py-3 text-destructive font-medium hover:bg-destructive/10 rounded-lg"
                            >
                                Sign Out
                            </button>
                        )}
                    </div>
                </motion.div>
            </nav>
        </motion.header >
    );
};

export default Header;
