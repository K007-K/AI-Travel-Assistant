import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, Loader, Plane, Sparkles } from 'lucide-react';
import useAuthStore from '../store/authStore';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, loginWithGoogle, isLoading, error, clearError, isAuthenticated } = useAuthStore();
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/');
        }
    }, [isAuthenticated, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        clearError();
        try {
            await login(email, password);
            navigate('/'); 
        } catch (err) {
            // Error is handled in store
        }
    };

    return (
        <div className="min-h-screen w-full flex bg-white dark:bg-[#030712] selection:bg-blue-200 selection:text-blue-900 overflow-hidden">
            
            {/* Left Side: The Interface */}
            <div className="w-full lg:w-[45%] flex flex-col p-8 sm:p-12 lg:p-16 xl:p-24 relative z-10 overflow-y-auto">
                
                {/* Logo / Back to Home */}
                <Link to="/" className="flex items-center gap-2 group w-max mb-16 lg:mb-auto">
                    <div className="p-2 rounded-xl bg-blue-600 group-hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20">
                        <Plane className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-display font-black text-slate-900 dark:text-white tracking-tight">
                        ROAMEO
                    </span>
                </Link>

                <div className="w-full max-w-md mx-auto my-auto space-y-8">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <h1 className="text-4xl lg:text-5xl font-display font-black text-slate-900 dark:text-white mb-3 tracking-tight">Welcome back.</h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">Enter your credentials to access your trips and AI dashboard.</p>
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

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                        className="space-y-4"
                    >
                        <button
                            onClick={() => loginWithGoogle()}
                            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/[0.08] rounded-2xl hover:bg-slate-50 dark:hover:bg-white/[0.04] hover:shadow-md transition-all font-bold text-slate-700 dark:text-slate-200 group"
                        >
                            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            Continue with Google
                        </button>
                        
                        <div className="relative flex items-center py-4">
                            <div className="flex-grow border-t border-slate-200 dark:border-white/[0.08]"></div>
                            <span className="flex-shrink-0 mx-4 text-xs font-bold uppercase tracking-widest text-slate-400">or</span>
                            <div className="flex-grow border-t border-slate-200 dark:border-white/[0.08]"></div>
                        </div>
                    </motion.div>

                    <motion.form 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
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
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between ml-1">
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Password</label>
                                <Link to="/forgot-password" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:underline underline-offset-4 transition-all">Forgot password?</Link>
                            </div>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="flex h-12 w-full rounded-2xl border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-white/[0.02] px-3 py-2 pl-12 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 focus:bg-white dark:focus:bg-[#0a0a0a] transition-all shadow-sm"
                                    placeholder="••••••••"
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
                                    Sign In <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </motion.form>

                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="text-center text-sm font-medium text-slate-600 dark:text-slate-400 pt-4"
                    >
                        Don't have an account?{' '}
                        <Link to="/signup" className="font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:underline underline-offset-4 transition-all">
                            Create one for free
                        </Link>
                    </motion.div>
                </div>
            </div>

            {/* Right Side: The Vision (Split Screen) */}
            <div className="hidden lg:flex w-[55%] relative overflow-hidden bg-slate-900 rounded-l-[3rem] shadow-[-20px_0_40px_rgba(0,0,0,0.1)] my-4 mr-4">
                <motion.img 
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 10, ease: "easeOut" }}
                    src="https://images.unsplash.com/photo-1499856871958-5b9627545d1a?q=80&w=3000&auto=format&fit=crop" 
                    alt="Paris Travel" 
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
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
                        <Sparkles className="w-8 h-8 text-blue-400 mb-4" />
                        <p className="text-2xl font-serif font-light leading-snug italic mb-6">
                            "Roameo orchestrated a 14-day luxury trip to Paris and the Alps in under 5 seconds. The budgeting was flawless."
                        </p>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-600/20 border border-blue-400/30 flex items-center justify-center font-bold text-blue-300">
                                EC
                            </div>
                            <div>
                                <p className="font-bold text-sm tracking-wide">Elena C.</p>
                                <p className="text-xs text-white/60 font-medium uppercase tracking-widest">Global Nomad</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

        </div>
    );
};

export default Login;
