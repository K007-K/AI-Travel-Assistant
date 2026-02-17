import React from 'react';
import { motion } from 'framer-motion';
import {
    Train, Plane, Car, Bus, Ship,
    AlertTriangle, TrendingUp,
    CheckCircle2,
} from 'lucide-react';

// ── Transport icon map ───────────────────────────────────────────────
const TRANSPORT_ICONS = { train: Train, flight: Plane, car: Car, bus: Bus, ferry: Ship };

// ── Decision Card ────────────────────────────────────────────────────
const DecisionCard = ({ segment }) => {
    const meta = segment.metadata || {};
    const TransportIcon = TRANSPORT_ICONS[meta.transport_mode] || Train;

    const typeLabels = {
        outbound_travel: 'Outbound',
        return_travel: 'Return',
        intercity_travel: 'Intercity',
    };

    return (
        <div className="bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-xl p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-slate-100 dark:bg-white/[0.06] mt-0.5">
                    <TransportIcon className="w-4 h-4 text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate">{segment.title}</h4>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 ml-2 whitespace-nowrap">
                            {(segment.estimated_cost || 0).toLocaleString()}
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                        <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold rounded-md uppercase">
                            {typeLabels[segment.type] || segment.type}
                        </span>
                        {meta.transport_mode && (
                            <span className="px-2 py-0.5 bg-slate-100 dark:bg-white/[0.06] text-slate-500 text-[10px] font-medium rounded-md">
                                {meta.transport_mode}
                            </span>
                        )}
                        {meta.from && (
                            <span className="px-2 py-0.5 bg-slate-100 dark:bg-white/[0.06] text-slate-500 text-[10px] font-medium rounded-md">
                                {meta.from}
                            </span>
                        )}
                        {meta.per_person > 0 && (
                            <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-medium rounded-md">
                                ~{meta.per_person}/person
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ── Risk Item ────────────────────────────────────────────────────────
const RiskItem = ({ risk }) => {
    const severityColors = {
        high: 'border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10',
        medium: 'border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10',
        low: 'border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.03]',
    };
    const iconColors = {
        high: 'text-red-500',
        medium: 'text-amber-500',
        low: 'text-slate-400',
    };

    return (
        <div className={`border rounded-xl p-4 ${severityColors[risk.severity] || severityColors.low}`}>
            <div className="flex items-start gap-3">
                <div className="mt-0.5">
                    {risk.severity === 'high'
                        ? <AlertTriangle className={`w-4 h-4 ${iconColors.high}`} />
                        : <TrendingUp className={`w-4 h-4 ${iconColors[risk.severity] || iconColors.low}`} />
                    }
                </div>
                <div>
                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-0.5">{risk.title}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">{risk.description}</p>
                    <span className={`inline-block mt-2 text-[10px] font-bold uppercase tracking-wider ${iconColors[risk.severity] || iconColors.low}`}>
                        {risk.severity} severity
                    </span>
                </div>
            </div>
        </div>
    );
};

// ── Decision & Risk Panel ────────────────────────────────────────────
const DecisionRiskPanel = ({ rawSegments, risks }) => (
    <>
        {/* Decision Logs */}
        {rawSegments.length > 0 && (
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
            >
                <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 border-l-2 border-orange-500 pl-3">
                    Transport Decision Logs
                </h2>
                <div className="space-y-3">
                    {rawSegments.map((seg, i) => (
                        <DecisionCard key={i} segment={seg} />
                    ))}
                </div>
            </motion.div>
        )}

        {/* Risk Monitor */}
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
        >
            <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 border-l-2 border-red-500 pl-3">
                Risk Monitor
            </h2>
            {risks.length > 0 ? (
                <div className="space-y-3">
                    {risks.map((r, i) => <RiskItem key={i} risk={r} />)}
                </div>
            ) : (
                <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl p-4 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">All systems nominal — no budget risks detected</span>
                </div>
            )}
        </motion.div>
    </>
);

export default React.memo(DecisionRiskPanel);
