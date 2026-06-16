import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, ArrowRight, Loader, CheckCircle, Eye, EyeOff, Plane } from 'lucide-react';
import useAuthStore from '../store/authStore';

const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [success, setSuccess] = useState(false);
    const [validationError, setValidationError] = useState('');
    const { updatePassword, isLoading, error, clearError } = useAuthStore();
    const navigate = useNavigate();

    useEffect(() => {
        clearError();
    }, [clearError]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        clearError();
        setValidationError('');

        if (password.length < 6) {
            setValidationError('Password must be at least 6 characters.');
            return;
        }
        if (password !== confirmPassword) {
            setValidationError('Passwords do not match.');
            return;
        }

        try {
            await updatePassword(password);
            setSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
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
                    src="https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?q=80&w=3000&auto=format&fit=crop" 
                    alt="Maldives Travel" 
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
                    {success ? (
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
                                <h1 className="text-3xl font-display font-black text-white mb-3 tracking-tight drop-shadow-sm">Secured.</h1>
                                <p className="text-white/70 font-medium leading-relaxed text-sm">
                                    Your password has been updated. You're being redirected to the login page.
                                </p>
                            </div>
                            <div className="flex items-center justify-center gap-3 pt-4">
                                <Loader className="w-5 h-5 animate-spin text-white" />
                                <span className="text-sm font-bold text-white/50 uppercase tracking-widest">Redirecting...</span>
                            </div>
                        </motion.div>
                    ) : (
                        <>
                            <div className="text-center mb-8">
                                <h1 className="text-3xl font-display font-black text-white mb-2 tracking-tight drop-shadow-sm">New Password.</h1>
                                <p className="text-white/70 font-medium text-sm">Create a strong password to secure your itineraries.</p>
                            </div>

                            {(error || validationError) && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-red-500/20 backdrop-blur-md text-red-200 p-4 rounded-2xl text-sm font-medium flex items-center border border-red-500/30 shadow-sm mb-6"
                                >
                                    {validationError || error}
                                </motion.div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-white/80 ml-1 uppercase tracking-wider">New Password</label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-white transition-colors">
                                            <Lock className="w-5 h-5" />
                                        </div>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="flex h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 pl-12 pr-12 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30 focus:bg-white/10 transition-all backdrop-blur-md"
                                            placeholder="••••••••"
                                            autoFocus
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-white/80 ml-1 uppercase tracking-wider">Confirm Password</label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-white transition-colors">
                                            <Lock className="w-5 h-5" />
                                        </div>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="flex h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 pl-12 pr-12 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30 focus:bg-white/10 transition-all backdrop-blur-md"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>

                                {password && (
                                    <div className="space-y-2 pt-2 ml-1">
                                        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold">
                                            <div className={`w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor] ${password.length >= 6 ? 'bg-emerald-400 text-emerald-400' : 'bg-white/20 text-transparent'}`} />
                                            <span className={password.length >= 6 ? 'text-emerald-400' : 'text-white/40'}>At least 6 characters</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold">
                                            <div className={`w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor] ${password === confirmPassword && confirmPassword ? 'bg-emerald-400 text-emerald-400' : 'bg-white/20 text-transparent'}`} />
                                            <span className={password === confirmPassword && confirmPassword ? 'text-emerald-400' : 'text-white/40'}>Passwords match</span>
                                        </div>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full h-12 mt-6 rounded-2xl bg-white hover:bg-slate-50 text-slate-900 font-black flex items-center justify-center gap-2 group transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5"
                                >
                                    {isLoading ? (
                                        <Loader className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            Update Password <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </form>
                        </>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default ResetPassword;
