import { motion } from 'framer-motion';
import {
    Sparkles, MapPin, Wallet, MessageCircle, Calendar, ArrowRight, Shield, Globe
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { LogoLoop } from '../ui/LogoLoop';
import { Button } from '../ui/Button';
import useAuthStore from '../../store/authStore';

const LandingPage = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuthStore();

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

    const features = [
        {
            icon: MessageCircle,
            title: "AI Travel Chatbot",
            description: "Get personalized travel recommendations and instant answers from our intelligent AI-powered assistant.",
            color: "text-blue-500",
            bg: "bg-blue-50"
        },
        {
            icon: Calendar,
            title: "Smart Itinerary Builder",
            description: "Create and customize perfect day-by-day travel plans with our intuitive drag-and-drop interface.",
            color: "text-purple-500",
            bg: "bg-purple-50"
        },
        {
            icon: MapPin,
            title: "Discover Hidden Gems",
            description: "Explore authentic local attractions and experiences that most tourists miss on their journey.",
            color: "text-orange-500",
            bg: "bg-orange-50"
        },
        {
            icon: Wallet,
            title: "Smart Budget Tracking",
            description: "Monitor your travel expenses in real-time and get accurate cost estimates to stay on budget.",
            color: "text-green-500",
            bg: "bg-green-50"
        },
        {
            icon: Shield,
            title: "Verified Recommendations",
            description: "Every place, restaurant, and hotel is verified to ensure quality, safety, and authenticity.",
            color: "text-teal-500",
            bg: "bg-teal-50"
        },
        {
            icon: Globe,
            title: "Translation & Communication",
            description: "Break language barriers with instant translation tools to communicate confidently anywhere.",
            color: "text-indigo-500",
            bg: "bg-indigo-50"
        }
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2,
                duration: 0.8
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 50 } }
    };

    return (
        <div className="min-h-screen bg-white overflow-x-hidden">
            {/* Hero Section */}
            <section className="relative pt-32 pb-20 flex flex-col items-center text-center px-4 bg-gradient-to-b from-white via-blue-50/20 to-white">
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                    className="max-w-4xl mx-auto z-10"
                >
                    <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-blue-100 shadow-sm text-blue-600 text-sm font-medium mb-8 hover:scale-105 transition-transform cursor-default">
                        <Sparkles className="w-4 h-4" />
                        <span>AI-Powered Travel Planning</span>
                    </motion.div>

                    <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-display font-bold mb-6 text-slate-900 tracking-tight leading-tight">
                        Travel Without <span className="text-blue-600 inline-block">Stress</span>
                    </motion.h1>

                    <motion.p variants={itemVariants} className="text-xl text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed">
                        From planning to exploring, experience seamless travel with AI-powered recommendations, smart budgeting, and cultural insights.
                    </motion.p>

                    <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button
                            onClick={() => isAuthenticated ? navigate('/ai/chat') : navigate('/login')}
                            size="lg"
                            className="text-lg px-8 h-12 w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-500/20 rounded-xl transition-all hover:scale-105 hover:-translate-y-0.5 active:scale-95 duration-300"
                        >
                            Start Planning <ArrowRight className="ml-2 w-5 h-5" />
                        </Button>
                        <a href="#destinations">
                            <Button variant="outline" size="lg" className="text-lg px-8 h-12 w-full sm:w-auto border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 rounded-xl transition-all hover:scale-105 duration-300">
                                Explore Destinations
                            </Button>
                        </a>
                    </motion.div>
                </motion.div>

                {/* Smooth Gradient Blobs */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1.5 }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-400/5 rounded-full blur-[120px] -z-0 pointer-events-none"
                />
            </section>

            {/* Everything You Need Section (Features Loop) */}
            <section id="features" className="pt-20 pb-12 bg-white relative overflow-hidden">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 mb-10 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.6 }}
                    >
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold mb-4 text-slate-900">
                            Everything You Need
                        </h2>
                        <p className="text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto">
                            Powerful features designed to make your travel experience effortless.
                        </p>
                    </motion.div>
                </div>

                <div className="w-full pb-8">
                    <LogoLoop
                        speed={280}
                        direction="left"
                        pauseOnHover={false}
                        items={features.map((feature, index) => (
                            <motion.div
                                key={index}
                                whileHover={{
                                    scale: 1.08,
                                    y: -12,
                                    zIndex: 50,
                                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)"
                                }}
                                layout
                                transition={{ type: "tween", duration: 0.1, ease: "easeOut" }}
                                className="bg-white rounded-2xl p-6 border border-slate-100 shadow-md shadow-slate-200/40 w-[260px] mx-2 h-[300px] flex flex-col items-start justify-between text-left cursor-pointer"
                            >
                                <div className={`w-12 h-12 rounded-xl ${feature.bg} ${feature.color} flex items-center justify-center mb-4`}>
                                    <feature.icon className="w-6 h-6" />
                                </div>
                                <h3 className="text-base sm:text-lg font-bold mb-2 text-slate-900 leading-tight">{feature.title}</h3>
                                <p className="text-slate-600 leading-relaxed text-xs sm:text-sm">
                                    {feature.description}
                                </p>
                            </motion.div>
                        ))}
                    />
                </div>
            </section>

            {/* Popular Destinations */}
            <section id="destinations" className="pt-12 pb-20 relative bg-slate-50/50 overflow-hidden">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 mb-10 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold mb-4 text-slate-900">
                            Popular Destinations
                        </h2>
                        <p className="text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto">
                            Discover amazing places around the world.
                        </p>
                    </motion.div>
                </div>

                <div className="w-full pb-8">
                    <LogoLoop
                        speed={270}
                        direction="right"
                        pauseOnHover={false}
                        items={destinations.map((destination, index) => (
                            <motion.div
                                key={index}
                                whileHover={{ y: -12, scale: 1.03 }}
                                layout
                                transition={{ type: "tween", duration: 0.1, ease: "easeOut" }}
                                className="group relative overflow-hidden rounded-2xl w-[260px] sm:w-[280px] h-[380px] sm:h-[400px] mx-2 cursor-pointer shadow-lg hover:shadow-2xl bg-slate-800"
                            >
                                <div onClick={() => isAuthenticated ? navigate('/ai/chat') : navigate('/login')} className="block w-full h-full relative">
                                    <img
                                        src={destination.image}
                                        alt={destination.name}
                                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                                        loading="eager"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.parentElement.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                                        }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent group-hover:from-black/90 transition-all duration-300" />

                                    <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 text-white transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                                        <h3 className="text-xl sm:text-2xl font-bold mb-1.5 drop-shadow-lg">{destination.name}</h3>
                                        <p className="text-xs sm:text-sm text-white/95 mb-2.5 font-medium flex items-center gap-1.5 drop-shadow">
                                            <MapPin className="w-3.5 h-3.5" /> {destination.country}
                                        </p>
                                        <p className="text-xs sm:text-sm text-white/90 opacity-0 group-hover:opacity-100 transition-opacity duration-300 line-clamp-2 drop-shadow">
                                            {destination.description}
                                        </p>
                                    </div>

                                    <div className="absolute top-4 right-4 translate-x-12 group-hover:translate-x-0 transition-transform duration-300 delay-75">
                                        <div className="p-2.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white hover:text-blue-600 transition-colors">
                                            <ArrowRight className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    />
                </div>
            </section>

            {/* Final CTA Section */}
            <section className="section py-32 relative overflow-hidden bg-white">
                <div className="container-custom max-w-7xl mx-auto px-6 md:px-8">
                    <div className="relative rounded-3xl overflow-hidden px-8 sm:px-12 py-20 text-center bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 shadow-2xl shadow-blue-900/30">
                        {/* Glossy overlay layers */}
                        <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-black/10"></div>
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.3)_0%,transparent_50%)]"></div>

                        {/* Shine effect */}
                        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-white/30 via-white/10 to-transparent rounded-full blur-3xl opacity-40"></div>

                        {/* Glass reflection */}
                        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-white/25 to-transparent opacity-60"></div>



                        {/* Ambient light orbs */}
                        <div className="absolute -top-24 -right-24 w-80 h-80 bg-blue-300/40 rounded-full blur-3xl"></div>
                        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-blue-800/30 rounded-full blur-3xl"></div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="relative z-10 max-w-3xl mx-auto"
                        >
                            <h2 className="text-4xl md:text-5xl font-display font-bold mb-6 text-white leading-tight drop-shadow-lg">
                                Ready to plan your next trip?
                            </h2>
                            <p className="text-xl text-blue-50 mb-10 font-light drop-shadow-md">
                                Join thousands of travelers getting honest, vibe-based recommendations.
                            </p>
                            <Button
                                onClick={() => isAuthenticated ? navigate('/ai/chat') : navigate('/signup')}
                                size="lg"
                                className="bg-white/95 backdrop-blur-sm text-blue-600 hover:bg-white hover:shadow-2xl hover:shadow-white/50 text-lg px-10 h-14 shadow-xl mb-6 rounded-xl font-bold transition-all hover:scale-105 border border-white/50"
                            >
                                Plan My First Trip
                            </Button>
                            <p className="text-sm text-blue-100 font-medium mt-4 drop-shadow">
                                Free to try • No credit card • No commitment
                            </p>
                        </motion.div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default LandingPage;
