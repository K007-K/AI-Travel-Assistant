import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, ArrowRight, Loader, CheckCircle } from 'lucide-react';
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
        <div className="min-h-screen pt-20 pb-12 flex items-center justify-center bg-slate-50 dark:bg-[#0a0a0a] px-4">
            <div className="w-full max-w-md">
                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700 p-8">
                    {sent ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center space-y-4"
                        >
                            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                            </div>
                            <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-slate-100">Check Your Email</h2>
                            <p className="text-slate-600 dark:text-slate-400 text-sm">
                                We've sent a password reset link to <strong className="text-slate-900 dark:text-slate-100">{email}</strong>. Click the link in the email to reset your password.
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-500">
                                Didn't receive it? Check your spam folder or
                                <button onClick={() => setSent(false)} className="text-primary-600 dark:text-primary-400 font-semibold ml-1 hover:underline">try again</button>
                            </p>
                            <Link to="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-500 mt-4">
                                <ArrowLeft className="w-4 h-4" /> Back to Sign In
                            </Link>
                        </motion.div>
                    ) : (
                        <>
                            <div className="text-center mb-8">
                                <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-slate-100 mb-2">Forgot Password?</h1>
                                <p className="text-slate-600 dark:text-slate-400">Enter your email and we'll send you a reset link.</p>
                            </div>

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm mb-6 text-center"
                                >
                                    {error}
                                </motion.div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                            <Mail className="w-5 h-5" />
                                        </div>
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="input pl-12"
                                            placeholder="you@example.com"
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="btn btn-primary w-full flex items-center justify-center gap-2 group"
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

                            <div className="mt-8 text-center">
                                <Link to="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-500">
                                    <ArrowLeft className="w-4 h-4" /> Back to Sign In
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
