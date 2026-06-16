import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, ArrowRight, Loader, CheckCircle, Eye, EyeOff, Plane, ShieldCheck } from 'lucide-react';
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
                    {success ? (
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
                                <h1 className="text-4xl lg:text-5xl font-display font-black text-slate-900 dark:text-white mb-3 tracking-tight">Secured.</h1>
                                <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                                    Your password has been updated. You're being redirected to the login page.
                                </p>
                            </div>
                            <div className="flex items-center gap-3 pt-4">
                                <Loader className="w-5 h-5 animate-spin text-blue-500" />
                                <span className="text-sm font-bold text-slate-400">Redirecting...</span>
                            </div>
                        </motion.div>
                    ) : (
                        <>
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                            >
                                <h1 className="text-4xl lg:text-5xl font-display font-black text-slate-900 dark:text-white mb-3 tracking-tight">New Password.</h1>
                                <p className="text-slate-500 dark:text-slate-400 font-medium">Create a strong password to secure your travel itineraries.</p>
                            </motion.div>

                            {(error || validationError) && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 p-4 rounded-2xl text-sm font-medium flex items-center border border-red-100 dark:border-red-500/20 shadow-sm"
                                >
                                    {validationError || error}
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
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">New Password</label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                            <Lock className="w-5 h-5" />
                                        </div>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="flex h-12 w-full rounded-2xl border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-white/[0.02] px-3 py-2 pl-12 pr-12 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 focus:bg-white dark:focus:bg-[#0a0a0a] transition-all shadow-sm"
                                            placeholder="••••••••"
                                            autoFocus
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Confirm Password</label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                            <Lock className="w-5 h-5" />
                                        </div>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="flex h-12 w-full rounded-2xl border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-white/[0.02] px-3 py-2 pl-12 pr-12 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 focus:bg-white dark:focus:bg-[#0a0a0a] transition-all shadow-sm"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>

                                {password && (
                                    <div className="space-y-2 pt-2 ml-1">
                                        <div className="flex items-center gap-2 text-xs font-bold">
                                            <div className={`w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor] ${password.length >= 6 ? 'bg-emerald-500 text-emerald-500' : 'bg-slate-300 dark:bg-slate-700 text-transparent'}`} />
                                            <span className={password.length >= 6 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}>At least 6 characters</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-bold">
                                            <div className={`w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor] ${password === confirmPassword && confirmPassword ? 'bg-emerald-500 text-emerald-500' : 'bg-slate-300 dark:bg-slate-700 text-transparent'}`} />
                                            <span className={password === confirmPassword && confirmPassword ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}>Passwords match</span>
                                        </div>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full h-12 mt-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center gap-2 group transition-all shadow-[0_4px_14px_rgba(37,99,235,0.3)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.4)] disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5"
                                >
                                    {isLoading ? (
                                        <Loader className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            Update Password <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </motion.form>
                        </>
                    )}
                </div>
            </div>

            {/* Right Side: The Vision (Split Screen) */}
            <div className="hidden lg:flex w-[55%] relative overflow-hidden bg-slate-900 rounded-l-[3rem] shadow-[-20px_0_40px_rgba(0,0,0,0.1)] my-4 mr-4">
                <motion.img 
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 10, ease: "easeOut" }}
                    src="https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?q=80&w=3000&auto=format&fit=crop" 
                    alt="Maldives Travel" 
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
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-cyan-400" />
                        <ShieldCheck className="w-8 h-8 text-cyan-400 mb-4" />
                        <p className="text-2xl font-serif font-light leading-snug italic mb-6">
                            "Knowing my passport copies, bookings, and budget data are secured under Roameo's zero-knowledge architecture gave me total peace of mind in the Maldives."
                        </p>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center font-bold text-cyan-200">
                                SA
                            </div>
                            <div>
                                <p className="font-bold text-sm tracking-wide">Sarah A.</p>
                                <p className="text-xs text-white/60 font-medium uppercase tracking-widest">Digital Nomad</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

        </div>
    );
};

export default ResetPassword;
