import React from 'react';
import { Link } from 'react-router-dom';
import {
    Sparkles,
    Map,
    CreditCard,
    Wallet,
    Globe,
    Sun,
    Plus,
    ArrowRight,
    Plane
} from 'lucide-react';
import { motion } from 'framer-motion';
import useAuthStore from '../../store/authStore';
import { Button } from '../ui/Button';
import Navbar from '../ui/Navbar';

const UserDashboard = () => {
    const { user, profile } = useAuthStore();

    // Fallback for display name
    const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Traveler';

    // Animation Variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
    };

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-[#0a0a0a] font-sans selection:bg-blue-100 dark:selection:bg-blue-900/40 transition-colors duration-300">
            <Navbar />

            <main className="pt-28 pb-20 px-6">
                <div className="max-w-7xl mx-auto">
                    {/* Greeting Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="mb-10"
                    >
                        <h1 className="text-3xl sm:text-4xl font-display font-bold text-slate-900 dark:text-white tracking-tight mb-2">
                            Welcome back, <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-400 dark:to-cyan-400">{displayName}</span>!
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-lg">
                            Ready for your next adventure?
                        </p>
                    </motion.div>

                    {/* Dashboard Grid */}
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16"
                    >
                        {/* Card 1: Plan New Trip */}
                        <motion.div
                            variants={itemVariants}
                            className="bg-white dark:bg-white/[0.03] rounded-3xl p-8 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)] dark:shadow-none border border-slate-100 dark:border-white/[0.06] hover:shadow-[0_8px_30px_-6px_rgba(0,0,0,0.1)] dark:hover:border-white/[0.12] dark:hover:bg-white/[0.05] transition-all duration-300 flex flex-col justify-between group h-full"
                        >
                            <div>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                        <Plus className="w-6 h-6" />
                                    </div>
                                </div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Plan New Trip</h2>
                                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6">
                                    Start a chat with the AI assistant to create a personalized itinerary for your next journey.
                                </p>
                            </div>
                            <Link to="/ai/chat" className="inline-flex items-center text-blue-600 dark:text-blue-400 font-semibold text-sm hover:text-blue-700 dark:hover:text-blue-300 transition-colors group-hover:translate-x-1 duration-300">
                                Start Planning <ArrowRight className="w-4 h-4 ml-1.5" />
                            </Link>
                        </motion.div>

                        {/* Card 2: My Trips */}
                        <motion.div
                            variants={itemVariants}
                            className="bg-white dark:bg-white/[0.03] rounded-3xl p-8 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)] dark:shadow-none border border-slate-100 dark:border-white/[0.06] hover:shadow-[0_8px_30px_-6px_rgba(0,0,0,0.1)] dark:hover:border-white/[0.12] dark:hover:bg-white/[0.05] transition-all duration-300 flex flex-col justify-between group h-full"
                        >
                            <div>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400">
                                        <Map className="w-6 h-6" />
                                    </div>
                                </div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">My Trips</h2>
                                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6">
                                    Access and manage your saved trips and itineraries.
                                </p>
                            </div>
                            <Link to="/my-trips" className="inline-flex items-center text-purple-600 dark:text-purple-400 font-semibold text-sm hover:text-purple-700 dark:hover:text-purple-300 transition-colors group-hover:translate-x-1 duration-300">
                                View Trips <ArrowRight className="w-4 h-4 ml-1.5" />
                            </Link>
                        </motion.div>

                        {/* Card 3: Expense Tracker */}
                        <motion.div
                            variants={itemVariants}
                            className="bg-white dark:bg-white/[0.03] rounded-3xl p-8 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)] dark:shadow-none border border-slate-100 dark:border-white/[0.06] hover:shadow-[0_8px_30px_-6px_rgba(0,0,0,0.1)] dark:hover:border-white/[0.12] dark:hover:bg-white/[0.05] transition-all duration-300 flex flex-col justify-between group h-full"
                        >
                            <div>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                        <Wallet className="w-6 h-6" />
                                    </div>
                                </div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Expense Tracker</h2>
                                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6">
                                    Monitor your travel spending and stay within budget.
                                </p>
                            </div>
                            <Link to="/budget" className="inline-flex items-center text-emerald-600 dark:text-emerald-400 font-semibold text-sm hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors group-hover:translate-x-1 duration-300">
                                Manage Budget <ArrowRight className="w-4 h-4 ml-1.5" />
                            </Link>
                        </motion.div>
                    </motion.div>

                    {/* Explore Section */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Explore More</h2>
                            <Link to="/discover" className="text-blue-600 dark:text-blue-400 text-sm font-semibold hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                                View All Destinations
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <ExploreCard
                                destId="d16"
                                title="Paris, France"
                                subtitle="Art & Romance"
                                image="https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80&w=800"
                            />
                            <ExploreCard
                                destId="d17"
                                title="Tokyo, Japan"
                                subtitle="Future City"
                                image="https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&q=80&w=800"
                            />
                            <ExploreCard
                                destId="d18"
                                title="Bali, Indonesia"
                                subtitle="Tropical Paradise"
                                image="https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&q=80&w=800"
                            />
                        </div>
                    </motion.div>
                </div>
            </main>
        </div>
    );
};

// Sub-component for Explore Cards
const ExploreCard = ({ destId, title, subtitle, image }) => (
    <Link
        to={`/destination/${destId}`}
        className="group relative h-64 rounded-3xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl dark:shadow-black/40 dark:hover:shadow-black/60 transition-all duration-500 block border border-transparent dark:border-white/[0.06]"
    >
        <img
            src={image}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
        <div className="absolute bottom-0 left-0 p-6 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
            <h3 className="text-white font-bold text-lg mb-1">{title}</h3>
            <p className="text-white/80 text-sm font-medium">{subtitle}</p>
        </div>
    </Link>
);

export default UserDashboard;
