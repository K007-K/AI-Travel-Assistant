import React from 'react';
import { motion } from 'framer-motion';

// ── Stat Card ────────────────────────────────────────────────────────
const StatCard = ({ label, value, icon: Icon, color, subtext }) => (
    <div className="bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-5 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3 mb-3">
            <div className={`p-2 rounded-xl ${color} shadow-lg`}>
                <Icon className="w-4 h-4 text-white" />
            </div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
        </div>
        <p className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">{value}</p>
        {subtext && <p className="text-[11px] text-slate-400 mt-1.5">{subtext}</p>}
    </div>
);

// ── Envelope Bar ─────────────────────────────────────────────────────
const EnvelopeBar = ({ config, allocated, remaining, currency }) => {
    const used = allocated - (remaining ?? allocated);
    const pct = allocated > 0 ? Math.round((used / allocated) * 100) : 0;
    const isOver = remaining !== undefined && remaining < 0;

    return (
        <div className="py-4 first:pt-0 last:pb-0">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-lg ${config.lightBg}`}>
                        <config.icon className={`w-4 h-4 ${config.textColor}`} />
                    </div>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{config.label}</span>
                </div>
                <div className="text-right">
                    <span className="text-sm font-bold text-slate-800 dark:text-white">
                        {allocated?.toLocaleString()} {currency}
                    </span>
                    {remaining !== undefined && (
                        <span className={`ml-2 text-xs font-medium ${isOver ? 'text-red-500' : 'text-emerald-500'}`}>
                            ({isOver ? '-' : ''}{Math.abs(remaining).toLocaleString()} left)
                        </span>
                    )}
                </div>
            </div>

            <div className="w-full bg-slate-100 dark:bg-white/[0.06] rounded-full h-2 overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(pct, 100)}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className={`h-full rounded-full ${isOver ? 'bg-red-500' : config.color}`}
                />
            </div>

            <div className="flex justify-between mt-1.5">
                <span className="text-[10px] text-slate-400">{pct}% used</span>
                <span className="text-[10px] text-slate-400">
                    {used.toLocaleString()} / {allocated.toLocaleString()} {currency}
                </span>
            </div>
        </div>
    );
};

// ── Budget Overview Panel ────────────────────────────────────────────
const BudgetOverviewPanel = ({
    allocation,
    reconciliation,
    currency,
    envelopeCategories,
    totalBudget,
    totalUsed,
    remaining,
    balanced,
    statIcons,
}) => (
    <>
        {/* Budget Overview Stats */}
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
        >
            <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 border-l-2 border-blue-500 pl-3">
                Budget Overview
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Total Budget"
                    value={`${totalBudget.toLocaleString()} ${currency}`}
                    icon={statIcons.wallet}
                    color="bg-blue-600"
                    subtext={allocation._meta?.budgetTier ? `${allocation._meta.budgetTier} tier` : null}
                />
                <StatCard
                    label="Total Used"
                    value={`${totalUsed.toLocaleString()} ${currency}`}
                    icon={statIcons.trendingDown}
                    color="bg-emerald-600"
                />
                <StatCard
                    label="Remaining"
                    value={`${remaining.toLocaleString()} ${currency}`}
                    icon={statIcons.circleDollarSign}
                    color={remaining < 0 ? 'bg-red-600' : 'bg-violet-600'}
                />
                <StatCard
                    label="Status"
                    value={balanced ? 'Balanced ✓' : `Overshoot: ${reconciliation?.overshoot || 0}`}
                    icon={balanced ? statIcons.checkCircle : statIcons.alertTriangle}
                    color={balanced ? 'bg-emerald-600' : 'bg-red-600'}
                    subtext={`${allocation._meta?.totalDays || 0} days · ${allocation._meta?.travelers || 1} travelers`}
                />
            </div>
        </motion.div>

        {/* Envelope Breakdown */}
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
        >
            <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 border-l-2 border-emerald-500 pl-3">
                Budget Envelopes
            </h2>
            <div className="bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-6">
                <div className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                    {envelopeCategories.map(config => {
                        const allocated = allocation[config.key];
                        if (allocated === undefined || allocated === 0) return null;
                        const rem = allocation[`${config.key}_remaining`];
                        return (
                            <EnvelopeBar
                                key={config.key}
                                config={config}
                                allocated={allocated}
                                remaining={rem}
                                currency={currency}
                            />
                        );
                    })}
                </div>

                {/* Allocation Ratios */}
                {allocation._meta?.ratios && (
                    <div className="mt-5 pt-4 border-t border-slate-100 dark:border-white/[0.06]">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Allocation Ratios</p>
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(allocation._meta.ratios).map(([key, val]) => (
                                <span key={key} className="px-2 py-1 bg-slate-50 dark:bg-white/[0.04] rounded-md text-[10px] font-medium text-slate-500">
                                    {key}: {(val * 100).toFixed(0)}%
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    </>
);

export default React.memo(BudgetOverviewPanel);
