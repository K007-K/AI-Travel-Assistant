import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, Mail, Phone, Save, CreditCard, Plane, Hotel, Train,
    Moon, Sun, Monitor, Shield, MapPin, Globe,
    Loader, Trash2, AlertTriangle, Check, Eye, EyeOff, Lock,
    DollarSign, Palette
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import useItineraryStore from '../store/itineraryStore';
import useBookingStore from '../store/bookingStore';
import { useTheme } from '../providers/ThemeProvider';

const Settings = () => {
    const { user, profile: authProfile, updateProfile, updatePassword, deleteAccount, isLoading } = useAuthStore();
    const { trips } = useItineraryStore();
    const { bookings } = useBookingStore();
    const { theme, setTheme } = useTheme();

    // Booking stats
    const activeBookings = bookings.filter(b => b.status !== 'cancelled');
    const bookingStats = {
        totalSpent: activeBookings.reduce((acc, b) => acc + (parseFloat(b.price) || 0), 0),
        flights: activeBookings.filter(b => b.type === 'flight').length,
        hotels: activeBookings.filter(b => b.type === 'hotel').length,
        trains: activeBookings.filter(b => b.type === 'train').length,
    };

    // Profile state
    const [profile, setProfile] = useState({
        name: user?.user_metadata?.full_name || authProfile?.full_name || user?.email?.split('@')[0] || '',
        email: user?.email || '',
        mobile: authProfile?.mobile || '',
        location: authProfile?.location || '',
        travel_style: authProfile?.website || '',
    });

    const [isEditing, setIsEditing] = useState(false);
    const [profileToast, setProfileToast] = useState(null); // { type: 'success'|'error', message }

    // Password state
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [passwords, setPasswords] = useState({ newPassword: '', confirmPassword: '' });
    const [showNewPw, setShowNewPw] = useState(false);
    const [showConfirmPw, setShowConfirmPw] = useState(false);
    const [passwordToast, setPasswordToast] = useState(null);
    const [passwordLoading, setPasswordLoading] = useState(false);

    // Currency state
    const [currency, setCurrency] = useState(() => {
        const saved = localStorage.getItem('preferred_currency');
        if (saved) {
            try { return JSON.parse(saved); } catch { return { code: 'USD', symbol: '$', rate: 1 }; }
        }
        return { code: 'USD', symbol: '$', rate: 1 };
    });

    // Sync profile state when authProfile changes
    useEffect(() => {
        if (authProfile) {
            setProfile(prev => ({
                ...prev,
                name: authProfile.full_name || prev.name,
                mobile: authProfile.mobile || prev.mobile,
                location: authProfile.location || prev.location,
                travel_style: authProfile.website || prev.travel_style,
            }));
        }
    }, [authProfile]);

    // Auto-dismiss toasts
    useEffect(() => {
        if (profileToast) {
            const t = setTimeout(() => setProfileToast(null), 3500);
            return () => clearTimeout(t);
        }
    }, [profileToast]);
    useEffect(() => {
        if (passwordToast) {
            const t = setTimeout(() => setPasswordToast(null), 3500);
            return () => clearTimeout(t);
        }
    }, [passwordToast]);

    // Stats
    const plannedBudget = trips.reduce((acc, trip) => acc + (parseFloat(trip.budget) || 0), 0);
    const totalSpent = plannedBudget + bookingStats.totalSpent;
    const stats = {
        spent: totalSpent,
        trips: trips.length,
        flights: bookingStats.flights,
        hotels: bookingStats.hotels,
        trains: bookingStats.trains
    };

    // Member since
    const memberSince = user?.created_at
        ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        : '—';

    // Handlers
    const handleSaveProfile = async (e) => {
        e.preventDefault();
        try {
            await updateProfile({
                full_name: profile.name,
                mobile: profile.mobile,
                location: profile.location,
                website: profile.travel_style,
            });
            setIsEditing(false);
            setProfileToast({ type: 'success', message: 'Profile updated successfully' });
        } catch (error) {
            setProfileToast({ type: 'error', message: error.message || 'Failed to update profile' });
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passwords.newPassword.length < 6) {
            setPasswordToast({ type: 'error', message: 'Password must be at least 6 characters' });
            return;
        }
        if (passwords.newPassword !== passwords.confirmPassword) {
            setPasswordToast({ type: 'error', message: 'Passwords do not match' });
            return;
        }
        setPasswordLoading(true);
        try {
            await updatePassword(passwords.newPassword);
            setPasswords({ newPassword: '', confirmPassword: '' });
            setShowPasswordForm(false);
            setPasswordToast({ type: 'success', message: 'Password changed successfully' });
        } catch (error) {
            setPasswordToast({ type: 'error', message: error.message || 'Failed to change password' });
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleCurrencyChange = (code) => {
        const newCurrency = code === 'INR'
            ? { code: 'INR', symbol: '₹', rate: 84 }
            : { code: 'USD', symbol: '$', rate: 1 };
        setCurrency(newCurrency);
        localStorage.setItem('preferred_currency', JSON.stringify(newCurrency));
    };

    const handleDeleteAccount = async () => {
        if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
            try {
                await deleteAccount();
            } catch (error) {
                alert('Failed to delete account: ' + error.message);
            }
        }
    };

    // Toast component
    const Toast = ({ toast }) => (
        <AnimatePresence>
            {toast && (
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium ${toast.type === 'success'
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50'
                        : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/50'
                        }`}
                >
                    {toast.type === 'success' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    {toast.message}
                </motion.div>
            )}
        </AnimatePresence>
    );

    const themeOptions = [
        { value: 'light', label: 'Light', icon: Sun },
        { value: 'dark', label: 'Dark', icon: Moon },
        { value: 'system', label: 'System', icon: Monitor },
    ];

    const inputClass = "w-full pl-12 pr-12 py-3 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:opacity-60 disabled:cursor-not-allowed transition-all";

    return (
        <div className="min-h-screen pt-28 pb-16 bg-slate-50 dark:bg-[#0a0a0a] transition-colors duration-300">
            <div className="max-w-6xl mx-auto px-6 md:px-8 space-y-10">

                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Settings</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your profile, preferences, and security</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* ─── Left Column: Profile Card ─── */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="lg:col-span-1 space-y-6"
                    >
                        <div className="bg-white dark:bg-white/[0.03] rounded-3xl p-6 shadow-xl shadow-slate-200/50 dark:shadow-black/30 border border-slate-100 dark:border-white/[0.06]">
                            <div className="flex flex-col items-center text-center">
                                <img
                                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=3b82f6&color=fff&size=96&bold=true`}
                                    alt={profile.name}
                                    className="w-24 h-24 rounded-full border-4 border-white dark:border-white/[0.1] shadow-md mb-4"
                                />
                                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{profile.name}</h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{profile.email}</p>
                                <div className="mt-4 py-2 px-4 bg-slate-100 dark:bg-white/[0.04] rounded-full text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                                    Member since {memberSince}
                                </div>
                            </div>

                            <div className="mt-8 space-y-3">
                                <div className="p-4 bg-slate-50 dark:bg-white/[0.03] rounded-2xl flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
                                        <Plane className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{stats.trips} Trips</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Total Planned</p>
                                    </div>
                                </div>
                                <div className="p-4 bg-slate-50 dark:bg-white/[0.03] rounded-2xl flex items-center gap-3">
                                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl text-emerald-600 dark:text-emerald-400">
                                        <CreditCard className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{currency.symbol}{stats.spent.toLocaleString()}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Total Spent</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* ─── Right Column ─── */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* ═══ Personal Information ═══ */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white dark:bg-white/[0.03] rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-white/[0.06]"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Personal Information</h3>
                                <div className="flex items-center gap-3">
                                    <Toast toast={profileToast} />
                                    <button
                                        onClick={() => setIsEditing(!isEditing)}
                                        className={`text-sm font-medium px-4 py-2 rounded-xl transition-colors ${isEditing ? 'bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'}`}
                                    >
                                        {isEditing ? 'Cancel' : 'Edit'}
                                    </button>
                                </div>
                            </div>

                            <form onSubmit={handleSaveProfile} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Full Name</label>
                                        <div className="relative">
                                            <User className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                                            <input type="text" disabled={!isEditing} value={profile.name}
                                                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                                className={inputClass} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Phone Number</label>
                                        <div className="relative">
                                            <Phone className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                                            <input type="text" disabled={!isEditing} value={profile.mobile}
                                                onChange={(e) => setProfile({ ...profile, mobile: e.target.value })}
                                                className={inputClass} placeholder="+1 (555) 000-0000" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Location</label>
                                        <div className="relative">
                                            <MapPin className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                                            <input type="text" disabled={!isEditing} value={profile.location}
                                                onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                                                className={inputClass} placeholder="New York, USA" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Travel Style</label>
                                        <div className="relative">
                                            <Globe className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                                            <input type="text" disabled={!isEditing} value={profile.travel_style || ''}
                                                onChange={(e) => setProfile({ ...profile, travel_style: e.target.value })}
                                                className={inputClass} placeholder="Adventure, Budget, Luxury..." />
                                        </div>
                                    </div>

                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email Address</label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                                            <input type="email" disabled value={profile.email}
                                                className={`${inputClass} text-slate-500 cursor-not-allowed`} />
                                        </div>
                                        <p className="text-xs text-slate-400 ml-1">Email cannot be changed</p>
                                    </div>
                                </div>

                                {isEditing && (
                                    <div className="flex justify-end pt-4">
                                        <button type="submit" disabled={isLoading}
                                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2 disabled:opacity-70">
                                            {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                            Save Changes
                                        </button>
                                    </div>
                                )}
                            </form>
                        </motion.div>

                        {/* ═══ Travel Stats ═══ */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white dark:bg-white/[0.03] rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-white/[0.06]"
                        >
                            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-6">Your Travel Stats</h3>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-900/15 border border-sky-100 dark:border-sky-800/40 flex flex-col items-center justify-center text-center gap-2">
                                    <Plane className="w-6 h-6 text-sky-500" />
                                    <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.flights}</span>
                                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Flights</span>
                                </div>
                                <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-900/15 border border-indigo-100 dark:border-indigo-800/40 flex flex-col items-center justify-center text-center gap-2">
                                    <Hotel className="w-6 h-6 text-indigo-500" />
                                    <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.hotels}</span>
                                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Hotels</span>
                                </div>
                                <div className="p-4 rounded-2xl bg-orange-50 dark:bg-orange-900/15 border border-orange-100 dark:border-orange-800/40 flex flex-col items-center justify-center text-center gap-2">
                                    <Train className="w-6 h-6 text-orange-500" />
                                    <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.trains}</span>
                                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Trains</span>
                                </div>
                            </div>
                        </motion.div>

                        {/* ═══ Preferences ═══ */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-white dark:bg-white/[0.03] rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-white/[0.06]"
                        >
                            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-6">Preferences</h3>
                            <div className="space-y-6">

                                {/* Theme */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2.5 bg-violet-100 dark:bg-violet-900/30 rounded-xl text-violet-600 dark:text-violet-400">
                                            <Palette className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900 dark:text-slate-100">Appearance</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Choose your preferred theme</p>
                                        </div>
                                    </div>
                                    <div className="flex bg-slate-100 dark:bg-white/[0.06] rounded-xl p-1 gap-1">
                                        {themeOptions.map(opt => {
                                            const Icon = opt.icon;
                                            const isActive = theme === opt.value;
                                            return (
                                                <button
                                                    key={opt.value}
                                                    onClick={() => setTheme(opt.value)}
                                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${isActive
                                                        ? 'bg-white dark:bg-white/[0.1] text-slate-900 dark:text-white shadow-sm'
                                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                                                        }`}
                                                >
                                                    <Icon className="w-3.5 h-3.5" />
                                                    {opt.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="border-t border-slate-100 dark:border-white/[0.06]" />

                                {/* Currency */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl text-emerald-600 dark:text-emerald-400">
                                            <DollarSign className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900 dark:text-slate-100">Currency</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Default currency for bookings & budgets</p>
                                        </div>
                                    </div>
                                    <div className="flex bg-slate-100 dark:bg-white/[0.06] rounded-xl p-1 gap-1">
                                        {[{ code: 'USD', label: '$ USD' }, { code: 'INR', label: '₹ INR' }].map(opt => (
                                            <button
                                                key={opt.code}
                                                onClick={() => handleCurrencyChange(opt.code)}
                                                className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${currency.code === opt.code
                                                    ? 'bg-white dark:bg-white/[0.1] text-slate-900 dark:text-white shadow-sm'
                                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                                                    }`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* ═══ Security — Change Password ═══ */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.35 }}
                            className="bg-white dark:bg-white/[0.03] rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-white/[0.06]"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-teal-100 dark:bg-teal-900/30 rounded-xl text-teal-600 dark:text-teal-400">
                                        <Shield className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Security</h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Manage your account password</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {!showPasswordForm && (
                                        <button
                                            onClick={() => setShowPasswordForm(true)}
                                            className="text-sm font-medium px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                                        >
                                            Change Password
                                        </button>
                                    )}
                                </div>
                            </div>
                            {/* Password change success/error toast — full width, clearly visible */}
                            <Toast toast={passwordToast} />

                            <AnimatePresence>
                                {showPasswordForm && (
                                    <motion.form
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.25 }}
                                        className="overflow-hidden"
                                        onSubmit={handleChangePassword}
                                    >
                                        <div className="pt-6 space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">New Password</label>
                                                    <div className="relative">
                                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                                        <input
                                                            type={showNewPw ? 'text' : 'password'}
                                                            value={passwords.newPassword}
                                                            onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                                                            className={inputClass}
                                                            placeholder="Min 6 characters"
                                                            required
                                                            minLength={6}
                                                        />
                                                        <button type="button" onClick={() => setShowNewPw(!showNewPw)}
                                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                                                            {showNewPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Confirm Password</label>
                                                    <div className="relative">
                                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                                        <input
                                                            type={showConfirmPw ? 'text' : 'password'}
                                                            value={passwords.confirmPassword}
                                                            onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                                                            className={inputClass}
                                                            placeholder="Repeat password"
                                                            required
                                                            minLength={6}
                                                        />
                                                        <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)}
                                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                                                            {showConfirmPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex justify-end gap-3 pt-2">
                                                <button type="button" onClick={() => { setShowPasswordForm(false); setPasswords({ newPassword: '', confirmPassword: '' }); }}
                                                    className="px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-white/[0.06] rounded-xl hover:bg-slate-200 dark:hover:bg-white/[0.1] transition-colors">
                                                    Cancel
                                                </button>
                                                <button type="submit" disabled={passwordLoading}
                                                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2 disabled:opacity-70">
                                                    {passwordLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                                                    Update Password
                                                </button>
                                            </div>
                                        </div>
                                    </motion.form>
                                )}
                            </AnimatePresence>
                        </motion.div>

                        {/* ═══ Danger Zone ═══ */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="bg-red-50 dark:bg-red-900/10 rounded-3xl p-8 shadow-sm border border-red-100 dark:border-red-900/30"
                        >
                            <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-4 flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5" />
                                Danger Zone
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                                Once you delete your account, there is no going back. All your trips, bookings, and data will be permanently removed.
                            </p>
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-slate-500 dark:text-slate-400">
                                    Permanently delete your account and all data
                                </div>
                                <button
                                    onClick={handleDeleteAccount}
                                    className="px-6 py-3 bg-white dark:bg-red-950 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 font-medium rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all flex items-center gap-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete Account
                                </button>
                            </div>
                        </motion.div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
