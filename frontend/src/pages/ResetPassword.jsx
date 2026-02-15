import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, ArrowRight, Loader, CheckCircle, Eye, EyeOff } from 'lucide-react';
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
    }, []);

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

    const inputClasses = "flex h-11 w-full rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-white/[0.04] px-3 py-2 pl-12 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-colors";

    if (success) {
        return (
            <div className="min-h-screen pt-20 pb-12 flex items-center justify-center bg-slate-50 dark:bg-[#0a0a0a] px-4">
                <div className="w-full max-w-md">
                    <div className="bg-white dark:bg-[#111111] rounded-3xl shadow-xl dark:shadow-2xl dark:shadow-black/50 overflow-hidden border border-slate-200 dark:border-white/[0.08] p-8">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center space-y-4"
                        >
                            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-500/10 flex items-center justify-center">
                                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                            </div>
                            <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Password Updated!</h2>
                            <p className="text-slate-600 dark:text-slate-400 text-sm">
                                Your password has been reset successfully. Redirecting to login…
                            </p>
                            <div className="flex justify-center">
                                <Loader className="w-5 h-5 animate-spin text-blue-500" />
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-20 pb-12 flex items-center justify-center bg-slate-50 dark:bg-[#0a0a0a] px-4">
            <div className="w-full max-w-md">
                <div className="bg-white dark:bg-[#111111] rounded-3xl shadow-xl dark:shadow-2xl dark:shadow-black/50 overflow-hidden border border-slate-200 dark:border-white/[0.08] p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white mb-2">Reset Password</h1>
                        <p className="text-slate-600 dark:text-slate-400">Enter your new password below.</p>
                    </div>

                    {(error || validationError) && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm mb-6 text-center border border-transparent dark:border-red-500/20"
                        >
                            {validationError || error}
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">New Password</label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={`${inputClasses} pr-12`}
                                    placeholder="••••••••"
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Confirm Password</label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className={inputClasses}
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {password && (
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2 text-xs">
                                    <div className={`w-1.5 h-1.5 rounded-full ${password.length >= 6 ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                                    <span className={password.length >= 6 ? 'text-green-600 dark:text-green-400' : 'text-slate-500 dark:text-slate-500'}>At least 6 characters</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                    <div className={`w-1.5 h-1.5 rounded-full ${password === confirmPassword && confirmPassword ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                                    <span className={password === confirmPassword && confirmPassword ? 'text-green-600 dark:text-green-400' : 'text-slate-500 dark:text-slate-500'}>Passwords match</span>
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center justify-center gap-2 group transition-all shadow-lg shadow-blue-600/20 dark:shadow-blue-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
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
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
