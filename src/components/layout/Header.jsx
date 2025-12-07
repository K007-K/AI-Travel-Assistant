import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Plane, Menu, X, ChevronDown, User, LogOut, Compass, Map, Sparkles, Settings, CreditCard, Globe
} from 'lucide-react';
import { useState } from 'react';
import ThemeToggle from '../ui/ThemeToggle';
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
        { name: 'Features', path: '/#features' }, // Hash link for Features
    ];

    // Authenticated User Navigation
    const userLinks = [
        { name: 'Home', path: '/' },
        { name: 'AI', path: '/chat', icon: Sparkles },
        { name: 'My Trips', path: '/my-trips', icon: Map },
        { name: 'Bookings', path: '/bookings', icon: CreditCard },
        { name: 'Budget', path: '/budget', icon: CreditCard },
        { name: 'Translate', path: '/translate', icon: Globe },
    ];

    const navLinks = isAuthenticated ? userLinks : guestLinks;

    // Scroll to section handling for Features link
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
                                    className="text-slate-700 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors relative group cursor-pointer flex items-center gap-1"
                                >
                                    {link.icon && <link.icon className="w-4 h-4" />}
                                    {link.name}
                                    <motion.span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary-500 to-accent-500 group-hover:w-full transition-all duration-300" />
                                </a>
                            ) : (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className="text-slate-700 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors relative group flex items-center gap-1"
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
                        <ThemeToggle />

                        {isAuthenticated ? (
                            <div className="relative hidden md:block">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                                    className="flex items-center gap-2 p-1 pr-3 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                                >
                                    <img
                                        src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name}`}
                                        alt={user?.name}
                                        className="w-8 h-8 rounded-full"
                                    />
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 max-w-[100px] truncate">
                                        {user?.name || 'User'}
                                    </span>
                                </motion.button>

                                {profileMenuOpen && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-10"
                                            onClick={() => setProfileMenuOpen(false)}
                                        />
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-2 z-20"
                                        >
                                            <div className="p-3 border-b border-slate-100 dark:border-slate-700 mb-2">
                                                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{user?.name}</p>
                                                <p className="text-xs text-slate-500 truncate mb-1">{user?.email}</p>
                                                {user?.createdAt && (
                                                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                                                        Member since {user.createdAt}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Removed My Dashboard and My Budget links */}
                                            <Link
                                                to="/settings"
                                                onClick={() => setProfileMenuOpen(false)}
                                                className="flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors text-sm"
                                            >
                                                <Settings className="w-4 h-4" /> Settings
                                            </Link>

                                            <button
                                                onClick={handleLogout}
                                                className="flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors text-sm mt-1"
                                            >
                                                <LogOut className="w-4 h-4" /> Sign Out
                                            </button>
                                        </motion.div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="hidden md:flex items-center gap-4">
                                <Link to="/login" className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-primary-600 transition-colors">
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
                            className="md:hidden p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
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
                            (link.path.startsWith('/#') && location.pathname === '/') ? (
                                <a
                                    key={link.name}
                                    href={link.path}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleNavClick(link.path);
                                    }}
                                    className="block px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                >
                                    {link.name}
                                </a>
                            ) : (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="block px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                >
                                    {link.name}
                                </Link>
                            )
                        ))}

                        {!isAuthenticated ? (
                            <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-700 space-y-3">
                                <Link
                                    to="/login"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="block w-full text-center py-3 bg-slate-100 dark:bg-slate-700 rounded-xl font-semibold"
                                >
                                    Log In
                                </Link>
                                <Link
                                    to="/signup"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="block w-full text-center py-3 bg-primary-600 text-white rounded-xl font-semibold shadow-lg shadow-primary-500/20"
                                >
                                    Sign Up Free
                                </Link>
                            </div>
                        ) : (
                            <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-700">
                                <div className="flex items-center gap-3 px-4 mb-4">
                                    <img
                                        src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name}`}
                                        alt={user?.name}
                                        className="w-10 h-10 rounded-full"
                                    />
                                    <div>
                                        <p className="font-semibold text-slate-900 dark:text-slate-100">{user?.name}</p>
                                        <p className="text-xs text-slate-500">{user?.email}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left px-4 py-3 text-red-600 dark:text-red-400 font-medium hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg"
                                >
                                    Sign Out
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>
            </nav>
        </motion.header>
    );
};

export default Header;
