import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, ArrowRight, Loader, CheckCircle, Plane, Navigation } from 'lucide-react';
import useAuthStore from '../store/authStore';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);
    const { sendPasswordReset, isLoading, error, clearError } = useAuthStore();

    const handleSubmit = async (e) => {
        e.preventDefault();
        clearError();
        try {
            await sendPasswordReset(email);
            setSent(true);
        } catch (err) {
            // Error handled in store
        }
    };

    return (
        <div className="min-h-screen w-full flex bg-white dark:bg-[#030712] selection:bg-blue-200 selection:text-blue-900 overflow-hidden">
            
            {/* Left Side: The Interface */}
            <div className="w-full lg:w-[45%] flex flex-col p-8 sm:p-12 lg:p-16 xl:p-24 relative z-10 overflow-y-auto">
                
                {/* Logo / Back to Home */}
                <Link to="/" className="flex items-center gap-2 group w-max mb-12 lg:mb-auto">
                    <div className="p-2.5 rounded-xl bg-blue-600 group-hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20">
                        <Plane className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-display font-black text-slate-900 dark:text-white tracking-tight">
                        ROAMEO
                    </span>
                </Link>

                <div className="w-full max-w-md mx-auto my-auto space-y-8">
                    {sent ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                            className="space-y-6"
                        >
                            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                <CheckCircle className="w-8 h-8 text-emerald-500" />
                            </div>
                            <div>
                                <h1 className="text-4xl lg:text-5xl font-display font-black text-slate-900 dark:text-white mb-3 tracking-tight">Check your email.</h1>
                                <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                                    We've sent a password reset link to <strong className="text-slate-900 dark:text-white">{email}</strong>.
                                </p>
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.05] rounded-2xl">
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Didn't receive it? Check your spam folder or 
                                    <button onClick={() => setSent(false)} className="text-blue-600 dark:text-blue-400 font-bold ml-1 hover:underline underline-offset-4 transition-all">try again</button>.
                                </p>
                            </div>
                            <Link to="/login" className="inline-flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors mt-4 group">
                                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Sign In
                            </Link>
                        </motion.div>
                    ) : (
                        <>
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                            >
                                <h1 className="text-4xl lg:text-5xl font-display font-black text-slate-900 dark:text-white mb-3 tracking-tight">Reset Password</h1>
                                <p className="text-slate-500 dark:text-slate-400 font-medium">Enter your email and we'll send you a link to get back into your account.</p>
                            </motion.div>

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 p-4 rounded-2xl text-sm font-medium flex items-center border border-red-100 dark:border-red-500/20 shadow-sm"
                                >
                                    {error}
                                </motion.div>
                            )}

                            <motion.form 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                                onSubmit={handleSubmit} 
                                className="space-y-5"
                            >
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Email</label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                            <Mail className="w-5 h-5" />
                                        </div>
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="flex h-12 w-full rounded-2xl border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-white/[0.02] px-3 py-2 pl-12 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 focus:bg-white dark:focus:bg-[#0a0a0a] transition-all shadow-sm"
                                            placeholder="name@example.com"
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full h-12 mt-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center gap-2 group transition-all shadow-[0_4px_14px_rgba(37,99,235,0.3)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.4)] disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5"
                                >
                                    {isLoading ? (
                                        <Loader className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            Send Reset Link <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </motion.form>

                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.6, delay: 0.3 }}
                                className="mt-8"
                            >
                                <Link to="/login" className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group">
                                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Sign In
                                </Link>
                            </motion.div>
                        </>
                    )}
                </div>
            </div>

            {/* Right Side: The Vision (Split Screen) */}
            <div className="hidden lg:flex w-[55%] relative overflow-hidden bg-slate-900 shadow-[-20px_0_40px_rgba(0,0,0,0.1)]">
                <motion.img 
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 10, ease: "easeOut" }}
                    src="https://images.unsplash.com/photo-1522798514-97ceb8c4f1c8?q=80&w=3000&auto=format&fit=crop" 
                    alt="Santorini Travel" 
                    className="absolute inset-0 w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent" />
                
                {/* Floating Testimonial */}
                <div className="absolute bottom-16 left-16 right-16">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl text-white shadow-2xl relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 to-rose-400" />
                        <Navigation className="w-8 h-8 text-orange-300 mb-4" />
                        <p className="text-2xl font-serif font-light leading-snug italic mb-6">
                            "I lost my itinerary details in transit. One quick password reset and Roameo had my entire Santorini schedule waiting for me seamlessly."
                        </p>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-orange-500/20 border border-orange-400/30 flex items-center justify-center font-bold text-orange-200">
                                JD
                            </div>
                            <div>
                                <p className="font-bold text-sm tracking-wide">Julian D.</p>
                                <p className="text-xs text-white/60 font-medium uppercase tracking-widest">Wanderer</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

        </div>
    );
};

export default ForgotPassword;
