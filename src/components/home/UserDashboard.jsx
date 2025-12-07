import { motion } from 'framer-motion';
import { Plus, Map, Calendar, Wallet, Globe, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

const UserDashboard = () => {
    const { user } = useAuthStore();

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <div className="min-h-screen pt-24 pb-12 bg-slate-50 dark:bg-slate-900">
            <div className="container-custom">
                {/* Welcome Section */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12"
                >
                    <h1 className="text-3xl md:text-4xl font-display font-bold text-slate-900 dark:text-slate-100 mb-2">
                        Welcome back, <span className="gradient-text">{user?.name}</span>!
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400">
                        Ready for your next adventure?
                    </p>
                </motion.div>

                {/* Quick Actions Grid */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16"
                >
                    {/* Plan New Trip */}
                    <motion.div variants={itemVariants}>
                        <Link to="/chat" className="card hover:shadow-lg transition-all group h-full block">
                            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Plus className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Plan New Trip</h3>
                            <p className="text-slate-600 dark:text-slate-400 text-sm">
                                Start a chat with the AI assistant to create a personalized itinerary.
                            </p>
                            <div className="mt-4 flex items-center text-blue-600 dark:text-blue-400 font-medium text-sm">
                                Start Planning <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </Link>
                    </motion.div>

                    {/* View Itineraries */}
                    <motion.div variants={itemVariants}>
                        <Link to="/itinerary" className="card hover:shadow-lg transition-all group h-full block">
                            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Map className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">My Trips</h3>
                            <p className="text-slate-600 dark:text-slate-400 text-sm">
                                Access and manage your saved trips and itineraries.
                            </p>
                            <div className="mt-4 flex items-center text-purple-600 dark:text-purple-400 font-medium text-sm">
                                View Trips <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </Link>
                    </motion.div>

                    {/* Manage Budget */}
                    <motion.div variants={itemVariants}>
                        <Link to="/budget" className="card hover:shadow-lg transition-all group h-full block">
                            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Wallet className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Expense Tracker</h3>
                            <p className="text-slate-600 dark:text-slate-400 text-sm">
                                Monitor your travel spending and stay within budget.
                            </p>
                            <div className="mt-4 flex items-center text-emerald-600 dark:text-emerald-400 font-medium text-sm">
                                Manage Budget <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </Link>
                    </motion.div>
                </motion.div>

                {/* Explore Section */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Explore More</h2>
                        <Link to="/discover" className="text-primary-600 hover:text-primary-700 font-medium text-sm">
                            View All Destinations
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="group relative overflow-hidden rounded-2xl aspect-video cursor-pointer">
                            <img
                                src="https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&h=600&fit=crop"
                                alt="Paris"
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                            <div className="absolute bottom-4 left-4 text-white">
                                <h3 className="font-bold text-lg">Paris, France</h3>
                                <p className="text-sm opacity-90">Art & Romance</p>
                            </div>
                        </div>
                        <div className="group relative overflow-hidden rounded-2xl aspect-video cursor-pointer">
                            <img
                                src="https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&h=600&fit=crop"
                                alt="Tokyo"
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                            <div className="absolute bottom-4 left-4 text-white">
                                <h3 className="font-bold text-lg">Tokyo, Japan</h3>
                                <p className="text-sm opacity-90">Future City</p>
                            </div>
                        </div>
                        <div className="group relative overflow-hidden rounded-2xl aspect-video cursor-pointer">
                            <img
                                src="https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&h=600&fit=crop"
                                alt="Bali"
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                            <div className="absolute bottom-4 left-4 text-white">
                                <h3 className="font-bold text-lg">Bali, Indonesia</h3>
                                <p className="text-sm opacity-90">Tropical Paradise</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default UserDashboard;
