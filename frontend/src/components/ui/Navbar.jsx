import React from 'react';
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

    // Fallback for display name
    const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Traveler';

    const isActive = (path) => location.pathname === path;

    // -------------------------------------------------------------------------
    // RENDER: LANDING PAGE NAVBAR (Unauthenticated)
    // -------------------------------------------------------------------------
    if (!user) {
        return (
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/40 backdrop-blur-2xl border-b border-white/30 shadow-sm transition-all duration-300 supports-[backdrop-filter]:bg-white/20">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-blue-500 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300">
                            <Plane className="w-6 h-6" />
                        </div>
                        <span className="font-display font-bold text-2xl text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">ROAMEO</span>
                    </Link>

                    {/* Landing Page Navigation */}
                    <div className="hidden md:flex items-center gap-6">
                        <Link
                            to="/"
                            className={`text-sm font-medium transition-colors ${isActive('/') ? 'text-blue-600 font-bold' : 'text-slate-600 hover:text-blue-600'}`}
                        >
                            Home
                        </Link>
                        <a
                            href="/#features"
                            className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
                        >
                            Features
                        </a>
                        <Link
                            to="/about"
                            className={`text-sm font-medium transition-colors ${isActive('/about') ? 'text-blue-600 font-bold' : 'text-slate-600 hover:text-blue-600'}`}
                        >
                            About
                        </Link>
                    </div>

                    {/* Auth Buttons */}
                    <div className="flex items-center gap-3">
                        <Link to="/login">
                            <Button variant="ghost" size="sm" className="hover:bg-slate-100 text-slate-600">Log In</Button>
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
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/40 backdrop-blur-2xl border-b border-white/30 shadow-sm transition-all duration-300 supports-[backdrop-filter]:bg-white/20">
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2 group">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-blue-500 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300">
                        <Plane className="w-6 h-6" />
                    </div>
                    <span className="font-display font-bold text-2xl text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">ROAMEO</span>
                </Link>

                {/* Main Navigation */}
                <div className="hidden md:flex items-center gap-2">
                    <Link
                        to="/"
                        className={`px-4 py-2.5 text-sm font-medium transition-all rounded-full ${isActive('/') ? 'bg-slate-100/80 text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'}`}
                    >
                        Home
                    </Link>

                    {/* AI Pill - Special styling */}
                    <Link
                        to="/ai"
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-sm ${isActive('/ai') || isActive('/chat')
                            ? 'bg-gradient-to-r from-purple-50 to-blue-50 text-blue-700 ring-1 ring-blue-100/50'
                            : 'bg-white/80 text-slate-600 hover:bg-white hover:shadow-md ring-1 ring-slate-200/50'
                            }`}
                    >
                        <Sparkles className={`w-4 h-4 ${isActive('/ai') || isActive('/chat') ? 'text-blue-600' : 'text-slate-400'}`} />
                        AI
                    </Link>

                    <div className="w-px h-6 bg-slate-200/50 mx-2"></div>

                    <NavLink to="/my-trips" icon={<Map className={`w-4 h-4 ${isActive('/my-trips') ? 'text-blue-500' : 'text-slate-400 group-hover:text-blue-500'}`} />} label="My Trips" active={isActive('/trips') || isActive('/my-trips')} />
                    <NavLink to="/bookings" icon={<CreditCard className={`w-4 h-4 ${isActive('/bookings') ? 'text-emerald-500' : 'text-slate-400 group-hover:text-emerald-500'}`} />} label="Bookings" active={isActive('/bookings')} />
                    <NavLink to="/budget" icon={<Wallet className={`w-4 h-4 ${isActive('/budget') ? 'text-orange-500' : 'text-slate-400 group-hover:text-orange-500'}`} />} label="Budget" active={isActive('/budget')} />
                    <NavLink to="/ai/translate" icon={<Globe className={`w-4 h-4 ${isActive('/ai/translate') ? 'text-indigo-500' : 'text-slate-400 group-hover:text-indigo-500'}`} />} label="Translate" active={isActive('/ai/translate')} />
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 pl-4 border-l border-slate-200/50 group cursor-pointer relative py-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-white border border-white shadow-md flex items-center justify-center font-bold text-blue-600 text-sm group-hover:shadow-lg transition-all duration-300">
                            {displayName.charAt(0).toUpperCase()}
                        </div>
                        <div className="hidden lg:flex flex-col">
                            <span className="text-sm font-bold text-slate-700 group-hover:text-blue-700 transition-colors">
                                {displayName}
                            </span>
                            <span className="text-xs text-slate-400 font-medium">Traveler</span>
                        </div>

                        {/* Dropdown Menu */}
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

const NavLink = ({ to, icon, label, active }) => (
    <Link
        to={to}
        className={`group flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-full transition-all duration-300 ${active
            ? 'text-slate-900 bg-white shadow-sm ring-1 ring-slate-100'
            : 'text-slate-500 hover:text-slate-900 hover:bg-white/60'
            }`}
    >
        {icon}
        {label}
    </Link>
);

export default Navbar;
