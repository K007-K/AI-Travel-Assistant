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

    if (success) {
        return (
            <div className="min-h-screen pt-20 pb-12 flex items-center justify-center bg-slate-50 dark:bg-[#0a0a0a] px-4">
                <div className="w-full max-w-md">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700 p-8">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center space-y-4"
                        >
                            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                            </div>
                            <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-slate-100">Password Updated!</h2>
                            <p className="text-slate-600 dark:text-slate-400 text-sm">
                                Your password has been reset successfully. Redirecting to login…
                            </p>
                            <div className="flex justify-center">
                                <Loader className="w-5 h-5 animate-spin text-primary-600" />
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
                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700 p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-slate-100 mb-2">Reset Password</h1>
                        <p className="text-slate-600 dark:text-slate-400">Enter your new password below.</p>
                    </div>

                    {(error || validationError) && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm mb-6 text-center"
                        >
                            {validationError || error}
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">New Password</label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input pl-12 pr-12"
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
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="input pl-12"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {password && (
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2 text-xs">
                                    <div className={`w-1.5 h-1.5 rounded-full ${password.length >= 6 ? 'bg-green-500' : 'bg-slate-300'}`} />
                                    <span className={password.length >= 6 ? 'text-green-600 dark:text-green-400' : 'text-slate-500'}>At least 6 characters</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                    <div className={`w-1.5 h-1.5 rounded-full ${password === confirmPassword && confirmPassword ? 'bg-green-500' : 'bg-slate-300'}`} />
                                    <span className={password === confirmPassword && confirmPassword ? 'text-green-600 dark:text-green-400' : 'text-slate-500'}>Passwords match</span>
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn btn-primary w-full flex items-center justify-center gap-2 group"
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
