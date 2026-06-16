import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, ArrowRight, Loader, CheckCircle, Plane } from 'lucide-react';
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
        <div className="min-h-screen w-full relative flex items-center justify-center p-4 selection:bg-blue-200/30 selection:text-white overflow-hidden">
            
            {/* Full Screen Cinematic Background */}
            <div className="fixed inset-0 z-0">
                <motion.img 
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 15, ease: "easeOut" }}
                    src="https://images.unsplash.com/photo-1522798514-97ceb8c4f1c8?q=80&w=3000&auto=format&fit=crop" 
                    alt="Santorini Travel" 
                    className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[4px]" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-slate-900/30" />
            </div>

            {/* Logo - Top Left */}
            <Link to="/" className="fixed top-8 left-8 flex items-center gap-2 group z-20">
                <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 group-hover:bg-white/20 transition-all duration-300">
                    <Plane className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-display font-black text-white tracking-tight drop-shadow-md">
                    ROAMEO
                </span>
            </Link>

            {/* Liquid Glass Form Container */}
            <div className="relative z-10 w-full max-w-[420px] mx-auto mt-12">
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="bg-white/10 backdrop-blur-2xl border border-white/20 p-8 sm:p-10 rounded-[2.5rem] shadow-[0_0_80px_rgba(0,0,0,0.5)]"
                >
                    {sent ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                            className="space-y-6 text-center"
                        >
                            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center backdrop-blur-md">
                                <CheckCircle className="w-8 h-8 text-emerald-400" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-display font-black text-white mb-3 tracking-tight drop-shadow-sm">Check your email.</h1>
                                <p className="text-white/70 font-medium leading-relaxed text-sm">
                                    We've sent a password reset link to <strong className="text-white">{email}</strong>.
                                </p>
                            </div>
                            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
                                <p className="text-xs text-white/50">
                                    Didn't receive it? Check your spam folder or 
                                    <button onClick={() => setSent(false)} className="text-white font-bold ml-1 hover:underline underline-offset-4 transition-all">try again</button>.
                                </p>
                            </div>
                            <Link to="/login" className="inline-flex items-center justify-center gap-2 text-sm font-bold text-white/70 hover:text-white transition-colors mt-4 group w-full">
                                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Sign In
                            </Link>
                        </motion.div>
                    ) : (
                        <>
                            <div className="text-center mb-8">
                                <h1 className="text-3xl font-display font-black text-white mb-2 tracking-tight drop-shadow-sm">Reset Password</h1>
                                <p className="text-white/70 font-medium text-sm">Enter your email and we'll send you a link to get back in.</p>
                            </div>

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-red-500/20 backdrop-blur-md text-red-200 p-4 rounded-2xl text-sm font-medium flex items-center border border-red-500/30 shadow-sm mb-6"
                                >
                                    {error}
                                </motion.div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-white/80 ml-1 uppercase tracking-wider">Email</label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-white transition-colors">
                                            <Mail className="w-5 h-5" />
                                        </div>
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="flex h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 pl-12 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30 focus:bg-white/10 transition-all backdrop-blur-md"
                                            placeholder="name@example.com"
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full h-12 mt-6 rounded-2xl bg-white hover:bg-slate-50 text-slate-900 font-black flex items-center justify-center gap-2 group transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5"
                                >
                                    {isLoading ? (
                                        <Loader className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            Send Reset Link <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </form>

                            <div className="text-center mt-8">
                                <Link to="/login" className="inline-flex items-center gap-2 text-sm font-bold text-white/70 hover:text-white transition-colors group">
                                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Sign In
                                </Link>
                            </div>
                        </>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default ForgotPassword;
