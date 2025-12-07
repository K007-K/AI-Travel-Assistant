import { motion } from 'framer-motion';
import {
    Sparkles,
    MapPin,
    Globe,
    Wallet,
    Languages,
    Shield,
    MessageCircle,
    Calendar,
    TrendingUp,
    ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { LogoLoop } from '../ui/LogoLoop';

const features = [
    {
        icon: MessageCircle,
        title: 'AI Travel Chatbot',
        description: 'Get personalized travel advice and recommendations from our intelligent AI assistant.',
        gradient: 'from-blue-500 to-cyan-500',
    },
    {
        icon: Calendar,
        title: 'Smart Itinerary Builder',
        description: 'Create perfect day-by-day travel plans with drag-and-drop simplicity.',
        gradient: 'from-purple-500 to-pink-500',
    },
    {
        icon: MapPin,
        title: 'Discover Hidden Gems',
        description: 'Explore local attractions and authentic experiences off the beaten path.',
        gradient: 'from-orange-500 to-red-500',
    },
    {
        icon: Wallet,
        title: 'Budget Management',
        description: 'Track expenses, set budgets, and get cost-effective travel suggestions.',
        gradient: 'from-green-500 to-emerald-500',
    },
    {
        icon: Languages,
        title: 'Real-time Translation',
        description: 'Break language barriers with instant translation and common phrases.',
        gradient: 'from-indigo-500 to-purple-500',
    },
    {
        icon: Shield,
        title: 'Safety & Alerts',
        description: 'Stay informed with travel advisories and emergency information.',
        gradient: 'from-red-500 to-pink-500',
    },
    {
        icon: Globe,
        title: 'Cultural Insights',
        description: 'Learn local customs, etiquette, and cultural tips for any destination.',
        gradient: 'from-teal-500 to-cyan-500',
    },
    {
        icon: TrendingUp,
        title: 'Seasonal Recommendations',
        description: 'Get destination suggestions based on the best time to visit.',
        gradient: 'from-amber-500 to-orange-500',
    },
];

const LandingPage = () => {
    const destinations = [
        {
            name: 'Araku Valley',
            country: 'India',
            image: 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=800&h=600&fit=crop',
            description: 'Coffee plantations & tribal culture',
        },
        {
            name: 'Goa',
            country: 'India',
            image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&h=600&fit=crop',
            description: 'Beaches & Portuguese heritage',
        },
        {
            name: 'Jaipur',
            country: 'India',
            image: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=800&h=600&fit=crop',
            description: 'Royal palaces & pink city charm',
        },
        {
            name: 'Paris',
            country: 'France',
            image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&h=600&fit=crop',
            description: 'Art, culture & romance',
        },
        {
            name: 'Tokyo',
            country: 'Japan',
            image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&h=600&fit=crop',
            description: 'Tradition meets innovation',
        },
        {
            name: 'Bali',
            country: 'Indonesia',
            image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&h=600&fit=crop',
            description: 'Tropical paradise & temples',
        },
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 },
        },
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { duration: 0.5 },
        },
    };

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="relative section pt-32 pb-20 overflow-hidden">
                {/* Animated Background */}
                <div className="absolute inset-0 -z-10">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-purple-50 to-accent-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900" />
                    <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
                </div>

                <div className="container-custom">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-center max-w-4xl mx-auto"
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6"
                        >
                            <Sparkles className="w-4 h-4 text-primary-600" />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                AI-Powered Travel Planning
                            </span>
                        </motion.div>

                        <h1 className="text-5xl md:text-7xl font-display font-bold mb-6 text-balance">
                            Travel Without{' '}
                            <span className="gradient-text">Stress</span>
                        </h1>

                        <p className="text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-2xl mx-auto text-balance">
                            From planning to exploring, experience seamless travel with AI-powered recommendations,
                            smart budgeting, and cultural insights—all in one platform.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link to="/signup">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="btn btn-primary group"
                                >
                                    Start Planning
                                    <ArrowRight className="inline-block ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </motion.button>
                            </Link>
                            <Link to="/login">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="btn btn-outline"
                                >
                                    Explore Destinations
                                </motion.button>
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Features Section */}
            <section className="section bg-white dark:bg-slate-800/50" id="features">
                <div className="container-custom">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
                            Everything You Need
                        </h2>
                        <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                            Powerful features designed to make your travel experience effortless and memorable.
                        </p>
                    </motion.div>

                    <div className="relative w-full overflow-hidden">
                        <LogoLoop
                            speed={50}
                            direction="left"
                            pauseOnHover={false}
                            items={features.map((feature, index) => (
                                <div
                                    key={index}
                                    className="card h-full min-h-[200px] border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 rounded-2xl flex flex-col items-start gap-4 transition-all duration-300 hover:shadow-xl hover:border-primary-200 dark:hover:border-primary-800"
                                >
                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                        <feature.icon className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-slate-100">
                                            {feature.title}
                                        </h3>
                                        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                                            {feature.description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        />
                    </div>
                </div>
            </section>

            {/* Popular Destinations */}
            <section className="section">
                <div className="container-custom">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
                            Popular Destinations
                        </h2>
                        <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                            Discover amazing places around India and the world.
                        </p>
                    </motion.div>

                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {destinations.map((destination, index) => (
                            <motion.div
                                key={index}
                                variants={itemVariants}
                                whileHover={{ y: -8 }}
                                className="group relative overflow-hidden rounded-2xl aspect-[4/3] cursor-pointer"
                            >
                                <Link to="/login" className="block w-full h-full">
                                    <img
                                        src={destination.image}
                                        alt={destination.name}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                                        <h3 className="text-2xl font-bold mb-1">{destination.name}</h3>
                                        <p className="text-sm text-white/80 mb-2">{destination.country}</p>
                                        <p className="text-sm">{destination.description}</p>
                                    </div>
                                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="p-2 rounded-full bg-white/20 backdrop-blur-sm">
                                            <ArrowRight className="w-5 h-5 text-white" />
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="section bg-gradient-to-br from-primary-600 via-purple-600 to-accent-600 text-white">
                <div className="container-custom text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="max-w-3xl mx-auto"
                    >
                        <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
                            Ready to Start Your Journey?
                        </h2>
                        <p className="text-xl text-white/90 mb-10">
                            Join thousands of travelers who plan smarter with AI assistance.
                        </p>
                        <Link to="/signup">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="btn bg-white text-primary-600 hover:bg-slate-100 shadow-2xl"
                            >
                                Get Started for Free
                                <ArrowRight className="inline-block ml-2 w-5 h-5" />
                            </motion.button>
                        </Link>
                    </motion.div>
                </div>
            </section>
        </div>
    );
};

export default LandingPage;
