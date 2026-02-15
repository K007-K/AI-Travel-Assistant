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
                <div className="bg-white dark:bg-[#111111] rounded-3xl shadow-xl dark:shadow-2xl dark:shadow-black/50 overflow-hidden border border-slate-200 dark:border-white/[0.08] p-8">
                    {sent ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center space-y-4"
                        >
                            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-500/10 flex items-center justify-center">
                                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                            </div>
                            <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Check Your Email</h2>
                            <p className="text-slate-600 dark:text-slate-400 text-sm">
                                We've sent a password reset link to <strong className="text-slate-900 dark:text-white">{email}</strong>. Click the link in the email to reset your password.
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-500">
                                Didn't receive it? Check your spam folder or
                                <button onClick={() => setSent(false)} className="text-primary-600 dark:text-blue-400 font-semibold ml-1 hover:underline">try again</button>
                            </p>
                            <Link to="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 dark:text-blue-400 hover:text-primary-500 mt-4">
                                <ArrowLeft className="w-4 h-4" /> Back to Sign In
                            </Link>
                        </motion.div>
                    ) : (
                        <>
                            <div className="text-center mb-8">
                                <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white mb-2">Forgot Password?</h1>
                                <p className="text-slate-600 dark:text-slate-400">Enter your email and we'll send you a reset link.</p>
                            </div>

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm mb-6 text-center border border-transparent dark:border-red-500/20"
                                >
                                    {error}
                                </motion.div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                                            <Mail className="w-5 h-5" />
                                        </div>
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="flex h-11 w-full rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-white/[0.04] px-3 py-2 pl-12 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-colors"
                                            placeholder="you@example.com"
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center justify-center gap-2 group transition-all shadow-lg shadow-blue-600/20 dark:shadow-blue-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
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
                                <Link to="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 dark:text-blue-400 hover:text-primary-500">
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
