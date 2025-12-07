import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Save, CreditCard, Calendar, Plane, Hotel, Train, Moon, Sun, Bell, Shield, ChevronRight } from 'lucide-react';
import useAuthStore from '../store/authStore';
import useItineraryStore from '../store/itineraryStore';
import useBookingStore from '../store/bookingStore'; // [NEW]
import ThemeToggle from '../components/ui/ThemeToggle'; // We might need to extract the toggle logic if button is custom

const Settings = () => {
    const { user } = useAuthStore();
    const { trips } = useItineraryStore();
    const { getStats } = useBookingStore(); // [NEW]
    const bookingStats = getStats(); // [NEW] Get real stats

    // Profile State
    const [profile, setProfile] = useState({
        name: user?.name || '',
        email: user?.email || '',
        mobile: '+1 (555) 123-4567', // Mock mobile for now
    });

    const [isEditing, setIsEditing] = useState(false);

    // Stats Calculation
    // Combine Trip Budget + Actual Bookings
    const plannedBudget = trips.reduce((acc, trip) => acc + (parseFloat(trip.budget) || 0), 0);
    const totalSpent = plannedBudget + bookingStats.totalSpent;

    const stats = {
        spent: totalSpent,
        trips: trips.length,
        flights: bookingStats.flights,
        hotels: bookingStats.hotels,
        trains: bookingStats.trains
    };

    const handleSaveProfile = (e) => {
        e.preventDefault();
        setIsEditing(false);
        // In a real app, we'd call an update action in authStore here
    };

    return (
        <div className="min-h-screen pt-24 pb-12 bg-slate-50 dark:bg-slate-900 transition-colors">
            <div className="container-custom max-w-5xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Settings</h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your profile and preferences</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Profile Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="lg:col-span-1 space-y-6"
                    >
                        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-100 dark:border-slate-700">
                            <div className="flex flex-col items-center text-center">
                                <div className="relative mb-4">
                                    <img
                                        src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name}`}
                                        alt={user?.name}
                                        className="w-24 h-24 rounded-full border-4 border-white dark:border-slate-700 shadow-md"
                                    />
                                    <button className="absolute bottom-0 right-0 p-2 bg-primary-600 rounded-full text-white shadow-lg hover:bg-primary-700 transition-colors">
                                        <User className="w-4 h-4" />
                                    </button>
                                </div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{profile.name}</h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{profile.email}</p>
                                <div className="mt-4 py-2 px-4 bg-slate-100 dark:bg-slate-700/50 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                                    Member Since {user?.createdAt || 'Dec 2025'}
                                </div>
                            </div>

                            <div className="mt-8 space-y-4">
                                <div className="p-4 bg-slate-50 dark:bg-slate-700/30 rounded-2xl flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
                                            <Plane className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{stats.trips} Trips</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Total Planned</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 bg-slate-50 dark:bg-slate-700/30 rounded-2xl flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl text-emerald-600 dark:text-emerald-400">
                                            <CreditCard className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">${stats.spent.toLocaleString()}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Total Spent</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Right Column: Details & Preferences */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Personal Information */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-700"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                    Personal Information
                                </h3>
                                <button
                                    onClick={() => setIsEditing(!isEditing)}
                                    className={`text-sm font-medium px-4 py-2 rounded-xl transition-colors ${isEditing ? 'bg-slate-100 dark:bg-slate-700 text-slate-600' : 'bg-primary-50 dark:bg-primary-900/20 text-primary-600'}`}
                                >
                                    {isEditing ? 'Cancel' : 'Edit'}
                                </button>
                            </div>

                            <form onSubmit={handleSaveProfile} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Full Name</label>
                                        <div className="relative">
                                            <User className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                                            <input
                                                type="text"
                                                disabled={!isEditing}
                                                value={profile.name}
                                                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Phone Number</label>
                                        <div className="relative">
                                            <Phone className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                                            <input
                                                type="text"
                                                disabled={!isEditing}
                                                value={profile.mobile}
                                                onChange={(e) => setProfile({ ...profile, mobile: e.target.value })}
                                                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email Address</label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                                            <input
                                                type="email"
                                                disabled={true}
                                                value={profile.email}
                                                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-500 cursor-not-allowed"
                                            />
                                        </div>
                                        <p className="text-xs text-slate-400 ml-1">Email address cannot be changed</p>
                                    </div>
                                </div>

                                {isEditing && (
                                    <div className="flex justify-end pt-4">
                                        <button
                                            type="submit"
                                            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl shadow-lg shadow-primary-500/30 transition-all flex items-center gap-2"
                                        >
                                            <Save className="w-4 h-4" />
                                            Save Changes
                                        </button>
                                    </div>
                                )}
                            </form>
                        </motion.div>

                        {/* Booking Statistics */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-700"
                        >
                            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
                                Your Travel Stats
                            </h3>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-900/20 border border-sky-100 dark:border-sky-800/50 flex flex-col items-center justify-center text-center gap-2">
                                    <Plane className="w-6 h-6 text-sky-500" />
                                    <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.flights}</span>
                                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Flights Booked</span>
                                </div>
                                <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 flex flex-col items-center justify-center text-center gap-2">
                                    <Hotel className="w-6 h-6 text-indigo-500" />
                                    <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.hotels}</span>
                                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Hotels Stays</span>
                                </div>
                                <div className="p-4 rounded-2xl bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/50 flex flex-col items-center justify-center text-center gap-2">
                                    <Train className="w-6 h-6 text-orange-500" />
                                    <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.trains}</span>
                                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Train Rides</span>
                                </div>
                            </div>
                        </motion.div>

                        {/* Preferences */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-700"
                        >
                            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-6">Preferences</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer group">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2.5 bg-purple-100 dark:bg-purple-900/30 rounded-xl text-purple-600 dark:text-purple-400 group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
                                            <Moon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900 dark:text-slate-100">Dark Mode</p>
                                            <p className="text-xs text-slate-500">Toggle application theme</p>
                                        </div>
                                    </div>
                                    <div className="pointer-events-none">
                                        {/* This is just visual context, the ThemeToggle component handles the logic globally, but here we might want a custom toggle switch. 
                                            For now, let's just place the existing ThemeToggle here or rely on the header. 
                                            Actually, let's put the ThemeToggle right here. */}
                                        <div className="pointer-events-auto">
                                            <ThemeToggle />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer group">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2.5 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl text-yellow-600 dark:text-yellow-400 group-hover:bg-yellow-200 dark:group-hover:bg-yellow-900/50 transition-colors">
                                            <Bell className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900 dark:text-slate-100">Notifications</p>
                                            <p className="text-xs text-slate-500">Manage email alerts</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-400" />
                                </div>

                                <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer group">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2.5 bg-teal-100 dark:bg-teal-900/30 rounded-xl text-teal-600 dark:text-teal-400 group-hover:bg-teal-200 dark:group-hover:bg-teal-900/50 transition-colors">
                                            <Shield className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900 dark:text-slate-100">Privacy & Security</p>
                                            <p className="text-xs text-slate-500">Password and account access</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-400" />
                                </div>
                            </div>
                        </motion.div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
