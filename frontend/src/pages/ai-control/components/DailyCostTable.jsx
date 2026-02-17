import React from 'react';
import { motion } from 'framer-motion';

const DailyCostTable = ({ dailySummary }) => {
    if (!dailySummary || dailySummary.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
        >
            <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 border-l-2 border-violet-500 pl-3">
                Daily Cost Breakdown
            </h2>
            <div className="bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-white/[0.02]">
                                <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase">Day</th>
                                <th className="text-right px-4 py-3 text-xs font-bold text-slate-400 uppercase">Activities</th>
                                <th className="text-right px-4 py-3 text-xs font-bold text-slate-400 uppercase">Travel</th>
                                <th className="text-right px-4 py-3 text-xs font-bold text-slate-400 uppercase">Stay</th>
                                <th className="text-right px-4 py-3 text-xs font-bold text-slate-400 uppercase">Local</th>
                                <th className="text-right px-4 py-3 text-xs font-bold text-emerald-500 uppercase">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                            {dailySummary.map(day => (
                                <tr key={day.day_number} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                                    <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Day {day.day_number}</td>
                                    <td className="px-4 py-3 text-right text-slate-500">{day.activity_cost.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-right text-slate-500">{day.travel_cost.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-right text-slate-500">{day.stay_cost.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-right text-slate-500">{day.local_transport_cost.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                                        {day.total_day_cost.toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
    );
};

export default React.memo(DailyCostTable);
