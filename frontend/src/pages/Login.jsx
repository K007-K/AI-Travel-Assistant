import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, Loader, Plane } from 'lucide-react';
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
        <div className="min-h-screen w-full relative flex items-center justify-center p-4 selection:bg-blue-200/30 selection:text-white overflow-hidden">
            
            {/* Full Screen Cinematic Background */}
            <div className="fixed inset-0 z-0">
                <motion.img 
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 15, ease: "easeOut" }}
                    src="https://images.unsplash.com/photo-1540541338287-41700207dee6?q=80&w=3000&auto=format&fit=crop" 
                    alt="Luxury Resort" 
                    className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-black/30" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
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
                    className="bg-black/30 backdrop-blur-2xl border border-white/20 p-8 sm:p-10 rounded-[2.5rem] shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
                >
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-display font-black text-white mb-2 tracking-tight drop-shadow-sm">Welcome back.</h1>
                        <p className="text-white/70 font-medium text-sm">Enter your credentials to continue your journey.</p>
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

                    <div className="space-y-4 mb-6">
                        <button
                            onClick={() => loginWithGoogle()}
                            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all font-bold text-white group backdrop-blur-md"
                        >
                            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            Continue with Google
                        </button>
                        
                        <div className="relative flex items-center py-2">
                            <div className="flex-grow border-t border-white/10"></div>
                            <span className="flex-shrink-0 mx-4 text-[10px] font-bold uppercase tracking-widest text-white/50">or</span>
                            <div className="flex-grow border-t border-white/10"></div>
                        </div>
                    </div>

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
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between ml-1">
                                <label className="block text-xs font-bold text-white/80 uppercase tracking-wider">Password</label>
                                <Link to="/forgot-password" className="text-xs font-bold text-white/60 hover:text-white hover:underline underline-offset-4 transition-all">Forgot?</Link>
                            </div>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-white transition-colors">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="flex h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 pl-12 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30 focus:bg-white/10 transition-all backdrop-blur-md"
                                    placeholder="••••••••"
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
                                    Sign In <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="text-center text-sm font-medium text-white/60 pt-6 mt-6 border-t border-white/10">
                        Don't have an account?{' '}
                        <Link to="/signup" className="font-bold text-white hover:underline underline-offset-4 transition-all">
                            Create one for free
                        </Link>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Login;
