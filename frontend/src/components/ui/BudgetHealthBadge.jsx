import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, OctagonX, TrendingUp } from 'lucide-react';

/**
 * BudgetHealthBadge — glanceable budget status indicator.
 *
 * @param {number} percentUsed   – actual spend % (manual + booking)
 * @param {number} forecastPercent – (actual + ai_estimate) / budget * 100
 * @param {'sm'|'md'} size        – sm = inline pill, md = card-sized
 */
const STATES = [
    { max: 60, label: 'On Track', icon: CheckCircle2, bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400', ring: 'ring-emerald-200 dark:ring-emerald-800' },
    { max: 80, label: 'Watch', icon: TrendingUp, bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400', ring: 'ring-amber-200 dark:ring-amber-800' },
    { max: 100, label: 'Warning', icon: AlertTriangle, bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-600 dark:text-orange-400', ring: 'ring-orange-200 dark:ring-orange-800', pulse: true },
    { max: Infinity, label: 'Over Budget', icon: OctagonX, bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-600 dark:text-red-400', ring: 'ring-red-200 dark:ring-red-800' },
];

const getState = (pct) => STATES.find(s => pct < s.max) || STATES[STATES.length - 1];

const BudgetHealthBadge = ({ percentUsed = 0, forecastPercent, size = 'sm' }) => {
    const effectivePct = forecastPercent ?? percentUsed;
    const state = getState(effectivePct);
    const Icon = state.icon;

    if (size === 'sm') {
        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ${state.bg} ${state.text} ${state.ring} ${state.pulse ? 'animate-pulse' : ''}`}>
                <Icon className="w-3 h-3" />
                {state.label}
            </span>
        );
    }

    // md — card variant for Budget page
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`rounded-2xl p-5 ring-1 ${state.bg} ${state.ring} ${state.pulse ? 'animate-pulse' : ''}`}
        >
            <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${state.bg}`}>
                    <Icon className={`w-5 h-5 ${state.text}`} />
                </div>
                <span className={`font-bold text-sm ${state.text}`}>{state.label}</span>
            </div>
            <div className={`text-2xl font-bold ${state.text}`}>
                {Math.round(effectivePct)}%
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {forecastPercent != null && forecastPercent !== percentUsed
                    ? `${Math.round(percentUsed)}% spent · ${Math.round(forecastPercent)}% forecast`
                    : 'of budget used'
                }
            </p>
        </motion.div>
    );
};

export default BudgetHealthBadge;
