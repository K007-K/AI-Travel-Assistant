import { motion } from 'framer-motion';
import { Plane, Users, Globe, Award, MapPin, Wallet, Sparkles } from 'lucide-react';

const About = () => {
    return (
        <div className="min-h-screen pt-24 pb-12">
            <div className="container-custom">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-4xl mx-auto text-center mb-16"
                >
                    <h1 className="text-4xl md:text-5xl font-display font-bold mb-6">
                        About <span className="gradient-text">ROAMEO</span>
                    </h1>
                    <p className="text-xl text-slate-600 dark:text-slate-400 text-balance">
                        We are on a mission to revolutionize travel planning by combining the power of AI with the joy of discovery.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="card text-center p-8"
                    >
                        <div className="w-16 h-16 mx-auto bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-6">
                            <Plane className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="text-xl font-bold mb-4">Smart Planning</h3>
                        <p className="text-slate-600 dark:text-slate-400">
                            Our AI algorithms analyze thousands of data points to create personalized itineraries that match your style.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="card text-center p-8"
                    >
                        <div className="w-16 h-16 mx-auto bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-6">
                            <Users className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h3 className="text-xl font-bold mb-4">Community Driven</h3>
                        <p className="text-slate-600 dark:text-slate-400">
                            Join a global community of travelers sharing hidden gems, tips, and authentic experiences.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                        className="card text-center p-8"
                    >
                        <div className="w-16 h-16 mx-auto bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-6">
                            <Globe className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <h3 className="text-xl font-bold mb-4">Sustainable Travel</h3>
                        <p className="text-slate-600 dark:text-slate-400">
                            We promote responsible tourism by highlighting eco-friendly accommodations and activities.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.4 }}
                        className="card text-center p-8"
                    >
                        <div className="w-16 h-16 mx-auto bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mb-6">
                            <MapPin className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                        </div>
                        <h3 className="text-xl font-bold mb-4">Hidden Gems</h3>
                        <p className="text-slate-600 dark:text-slate-400">
                            Go beyond the tourist traps with recommendations for local favorites and secret spots.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5 }}
                        className="card text-center p-8"
                    >
                        <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
                            <Wallet className="w-8 h-8 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="text-xl font-bold mb-4">Budget Control</h3>
                        <p className="text-slate-600 dark:text-slate-400">
                            Real-time expense tracking and budget alerts ensure you enjoy your trip without breaking the bank.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.6 }}
                        className="card text-center p-8"
                    >
                        <div className="w-16 h-16 mx-auto bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center mb-6">
                            <Sparkles className="w-8 h-8 text-pink-600 dark:text-pink-400" />
                        </div>
                        <h3 className="text-xl font-bold mb-4">24/7 AI Support</h3>
                        <p className="text-slate-600 dark:text-slate-400">
                            Our intelligent assistant is always available to help with translations, directions, and changes.
                        </p>
                    </motion.div>
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="bg-gradient-to-br from-primary-600 to-accent-600 rounded-3xl p-12 text-white text-center"
                >
                    <Award className="w-16 h-16 mx-auto mb-6 text-white/80" />
                    <h2 className="text-3xl md:text-4xl font-bold mb-6">Why Choose ROAMEO?</h2>
                    <p className="text-xl text-white/90 max-w-2xl mx-auto mb-8">
                        Because your time is precious. We handle the logistics so you can focus on making memories.
                    </p>
                </motion.div>
            </div>
        </div>
    );
};

export default About;
