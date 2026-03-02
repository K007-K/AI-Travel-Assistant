/**
 * BudgetTab — Budget planner + Financial Intelligence Panel
 *
 * Extracted from ItineraryBuilder to reduce monolith size.
 * Receives all necessary state and handlers as props.
 */

import { motion, AnimatePresence } from 'framer-motion';
import {
    Wallet, Sparkles, Loader2, Save, DollarSign, TrendingUp,
    ShieldCheck, AlertCircle, AlertTriangle, BarChart3, Lightbulb, CheckCircle2,
} from 'lucide-react';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';

const BudgetTab = ({
    trip,
    budgetInput,
    setBudgetInput,
    currencyInput,
    setCurrencyInput,
    isAnalyzing,
    aiInsights,
    budgetSummary,
    activeCurrencySymbol: _activeCurrencySymbol,
    handleAnalyzeBudget,
    handleSaveBudget,
}) => {
    // Compute financial values from RPC data
    const bs = budgetSummary || {};
    const totalBudget = bs.total_budget || parseFloat(budgetInput) || 0;
    const actualSpent = bs.total_spent || 0;
    const aiEstimated = bs.ai_estimated_total || 0;
    const forecastTotal = actualSpent + aiEstimated;
    const forecastPercent = totalBudget > 0 ? Math.round((forecastTotal / totalBudget) * 100 * 10) / 10 : 0;
    const remainingForecast = totalBudget - forecastTotal;
    const categories = bs.category_breakdown || [];
    const cur = currencyInput || bs.currency || 'USD';

    // Risk level (deterministic)
    const riskLevel = forecastPercent >= 100 ? 'CRITICAL' : forecastPercent >= 80 ? 'HIGH' : forecastPercent >= 60 ? 'MODERATE' : 'LOW';
    const riskConfig = {
        LOW: { color: 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800', icon: <ShieldCheck className="w-5 h-5" />, label: 'Low Risk' },
        MODERATE: { color: 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800', icon: <AlertCircle className="w-5 h-5" />, label: 'Moderate Risk' },
        HIGH: { color: 'text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800', icon: <AlertTriangle className="w-5 h-5" />, label: 'High Risk' },
        CRITICAL: { color: 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800', icon: <AlertTriangle className="w-5 h-5" />, label: 'Critical' },
    };
    const risk = riskConfig[riskLevel];
    const hasData = totalBudget > 0;

    return (
        <div className={`transition-opacity duration-300`}>
            <div className="max-w-5xl mx-auto">

                {/* Budget Input Card */}
                <Card className="rounded-3xl overflow-hidden border-border mb-6">
                    <div className="p-6 md:p-8 bg-gradient-to-br from-primary/5 via-background to-accent/5">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="p-2.5 rounded-xl bg-primary/10">
                                <Wallet className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-foreground">Trip Budget Planner</h2>
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground ml-[52px] mb-6">Set your per-person budget for {trip.destination} and let AI analyze your spending plan.</p>

                        <div className="flex flex-col sm:flex-row gap-3 items-end">
                            <div className="flex-grow">
                                <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Budget per person</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-primary">{currencyInput}</span>
                                    <input
                                        type="number"
                                        value={budgetInput}
                                        onChange={e => setBudgetInput(e.target.value)}
                                        className="flex h-12 w-full rounded-xl border border-input bg-background px-3 py-2 pl-14 text-lg font-semibold ring-offset-background placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary transition-all"
                                        placeholder="2000"
                                    />
                                </div>
                            </div>
                            <div className="w-full sm:w-32">
                                <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Currency</label>
                                <select value={currencyInput} onChange={e => setCurrencyInput(e.target.value)} className="flex h-12 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary transition-all">
                                    {['USD', 'EUR', 'GBP', 'INR', 'AUD', 'JPY', 'CAD', 'SGD', 'THB', 'MXN'].map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto">
                                <Button onClick={handleAnalyzeBudget} disabled={isAnalyzing || !budgetInput} className="h-12 px-6 flex-1 sm:flex-none rounded-xl gap-2 font-semibold">
                                    {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Analyze
                                </Button>
                                <Button variant="outline" onClick={handleSaveBudget} className="h-12 px-5 rounded-xl font-semibold">
                                    <Save className="w-4 h-4 mr-1.5" /> Save
                                </Button>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Loading Skeleton */}
                <AnimatePresence>
                    {isAnalyzing && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {[0, 1, 2, 3].map(i => (
                                    <div key={i} className="rounded-2xl border border-border bg-card p-5 space-y-3" style={{ animationDelay: `${i * 150}ms` }}>
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-muted animate-pulse" />
                                            <div className="h-4 w-24 rounded bg-muted animate-pulse" />
                                        </div>
                                        <div className="h-7 w-32 rounded bg-muted animate-pulse" />
                                        <div className="h-2 w-full rounded-full bg-muted animate-pulse" />
                                    </div>
                                ))}
                            </div>
                            <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
                                <div className="h-5 w-44 rounded bg-muted animate-pulse" />
                                {[0, 1, 2, 3, 4, 5].map(i => (
                                    <div key={i} className="flex justify-between items-center py-2">
                                        <div className="h-4 w-36 rounded bg-muted animate-pulse" />
                                        <div className="h-4 w-24 rounded bg-muted animate-pulse" />
                                    </div>
                                ))}
                            </div>
                            <p className="text-center text-sm text-muted-foreground animate-pulse">✨ AI is analyzing your financials for {trip.destination}...</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Top Summary Cards */}
                {!isAnalyzing && hasData && (
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Trip Budget */}
                            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl border border-border bg-card p-5">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30"><Wallet className="w-4 h-4 text-blue-600 dark:text-blue-400" /></div>
                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Trip Budget</span>
                                </div>
                                <div className="text-2xl font-bold text-foreground">{cur} {totalBudget.toLocaleString()}</div>
                                <p className="text-xs text-muted-foreground mt-1">per person · {trip.days?.length || 0} days · 👥 {trip.travelers || 1} traveler{(trip.travelers || 1) > 1 ? 's' : ''}</p>
                            </motion.div>

                            {/* Actual Spent */}
                            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="rounded-2xl border border-border bg-card p-5">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="p-1.5 rounded-lg bg-violet-100 dark:bg-violet-900/30"><DollarSign className="w-4 h-4 text-violet-600 dark:text-violet-400" /></div>
                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Actual Spent</span>
                                </div>
                                <div className="text-2xl font-bold text-foreground">{cur} {actualSpent.toLocaleString()}</div>
                                <p className="text-xs text-muted-foreground mt-1">Manual + Bookings</p>
                            </motion.div>

                            {/* Forecast */}
                            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl border border-border bg-card p-5">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="p-1.5 rounded-lg bg-cyan-100 dark:bg-cyan-900/30"><TrendingUp className="w-4 h-4 text-cyan-600 dark:text-cyan-400" /></div>
                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Forecast</span>
                                </div>
                                <div className={`text-2xl font-bold ${forecastPercent >= 100 ? 'text-red-500' : 'text-foreground'}`}>{cur} {forecastTotal.toLocaleString()}</div>
                                <div className="w-full bg-muted h-1.5 rounded-full mt-2 overflow-hidden">
                                    <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(forecastPercent, 100)}%` }} transition={{ duration: 1, ease: "easeOut" }}
                                        className={`h-full rounded-full ${forecastPercent >= 100 ? 'bg-red-500' : forecastPercent >= 80 ? 'bg-orange-500' : forecastPercent >= 60 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">{forecastPercent}% of budget</p>
                            </motion.div>

                            {/* Risk Level */}
                            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className={`rounded-2xl border p-5 ${risk.color}`}>
                                <div className="flex items-center gap-2 mb-2">
                                    {risk.icon}
                                    <span className="text-xs font-medium uppercase tracking-wide">Risk Level</span>
                                </div>
                                <div className="text-2xl font-bold">{riskLevel}</div>
                                <p className="text-xs mt-1 opacity-80">{risk.label}</p>
                            </motion.div>
                        </div>

                        {/* Financial Summary Panel */}
                        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-2xl border border-border bg-card p-6">
                            <h3 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-primary" /> Financial Summary
                            </h3>
                            <div className="divide-y divide-border">
                                {[
                                    { label: 'Total Budget', value: `${cur} ${totalBudget.toLocaleString()}`, accent: false, source: 'user' },
                                    { label: 'Actual Spent (Manual + Bookings)', value: `${cur} ${actualSpent.toLocaleString()}`, accent: false, source: 'system' },
                                    { label: 'AI Estimated Spend', value: `${cur} ${aiEstimated.toLocaleString()}`, accent: false, source: 'ai' },
                                    { label: 'Forecast Total', value: `${cur} ${forecastTotal.toLocaleString()}`, accent: forecastPercent >= 100, source: 'system' },
                                    { label: 'Remaining (Forecast)', value: `${cur} ${remainingForecast.toLocaleString()}`, accent: remainingForecast < 0, source: 'system' },
                                    { label: 'Forecast Utilization', value: `${forecastPercent}%`, accent: forecastPercent >= 80, source: 'system' },
                                    ...(trip.travelers > 1 ? [{ label: `Group Total (${trip.travelers} travelers)`, value: `${cur} ${(totalBudget * trip.travelers).toLocaleString()}`, accent: false, source: 'system' }] : []),
                                ].map((row, i) => (
                                    <div key={i} className="flex justify-between items-center py-3">
                                        <span className="text-sm text-muted-foreground flex items-center gap-2">
                                            {row.label}
                                            {row.source === 'ai' && <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400 font-bold uppercase">AI est.</span>}
                                            {row.source === 'system' && <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 font-bold uppercase">System</span>}
                                        </span>
                                        <span className={`text-sm font-semibold ${row.accent ? 'text-red-500' : 'text-foreground'}`}>{row.value}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Projected Cost Allocation */}
                        {categories.length > 0 && (
                            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="rounded-2xl border border-border bg-card p-6">
                                <h3 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
                                    <span className="text-lg">📊</span> Projected Cost Allocation
                                </h3>
                                <div className="flex gap-4 mb-4 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-blue-500" /> Manual</span>
                                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-violet-500" /> Booking</span>
                                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-cyan-400" /> AI Estimate</span>
                                </div>
                                <div className="space-y-4">
                                    {categories.map((cat, i) => {
                                        const catTotal = parseFloat(cat.total) || 0;
                                        const manual = parseFloat(cat.by_source?.manual) || 0;
                                        const booking = parseFloat(cat.by_source?.booking) || 0;
                                        const aiEst = parseFloat(cat.by_source?.ai_estimate) || 0;
                                        const catPercent = totalBudget > 0 ? Math.round((catTotal / totalBudget) * 100) : 0;
                                        const manualPct = catTotal > 0 ? (manual / catTotal) * 100 : 0;
                                        const bookingPct = catTotal > 0 ? (booking / catTotal) * 100 : 0;
                                        const aiPct = catTotal > 0 ? (aiEst / catTotal) * 100 : 0;
                                        return (
                                            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.08 }}>
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-sm font-medium text-foreground capitalize">{cat.category}</span>
                                                    <span className="text-sm text-muted-foreground">{cur} {catTotal.toLocaleString()} <span className="text-xs">({catPercent}%)</span></span>
                                                </div>
                                                <div className="w-full bg-muted rounded-full h-3 overflow-hidden flex">
                                                    {manual > 0 && <motion.div initial={{ width: 0 }} animate={{ width: `${manualPct}%` }} transition={{ duration: 0.8, delay: 0.6 + i * 0.08 }} className="h-full bg-blue-500" title={`Manual: ${cur} ${manual.toLocaleString()}`} />}
                                                    {booking > 0 && <motion.div initial={{ width: 0 }} animate={{ width: `${bookingPct}%` }} transition={{ duration: 0.8, delay: 0.7 + i * 0.08 }} className="h-full bg-violet-500" title={`Booking: ${cur} ${booking.toLocaleString()}`} />}
                                                    {aiEst > 0 && <motion.div initial={{ width: 0 }} animate={{ width: `${aiPct}%` }} transition={{ duration: 0.8, delay: 0.8 + i * 0.08 }} className="h-full bg-cyan-400" title={`AI Estimate: ${cur} ${aiEst.toLocaleString()}`} />}
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}

                        {/* Risk Assessment */}
                        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className={`rounded-2xl border p-5 ${risk.color}`}>
                            <h3 className="text-base font-bold mb-2 flex items-center gap-2">
                                {risk.icon} Risk Assessment
                            </h3>
                            <p className="text-sm leading-relaxed">
                                {riskLevel === 'LOW' && `Forecast utilization is within safe range at ${forecastPercent}%. Your budget of ${cur} ${totalBudget.toLocaleString()} comfortably covers projected expenses.`}
                                {riskLevel === 'MODERATE' && `Forecast utilization is at ${forecastPercent}%. Budget is being used efficiently but monitor spending closely. Remaining forecast: ${cur} ${remainingForecast.toLocaleString()}.`}
                                {riskLevel === 'HIGH' && `Forecast utilization is elevated at ${forecastPercent}%. Projected expenses are approaching the budget limit. Only ${cur} ${Math.max(0, remainingForecast).toLocaleString()} remains.`}
                                {riskLevel === 'CRITICAL' && `Projected expenses exceed budget by ${cur} ${Math.abs(remainingForecast).toLocaleString()} (${forecastPercent}% utilization). Immediate budget review recommended.`}
                            </p>
                        </motion.div>

                        {/* AI Financial Insights */}
                        {aiInsights && (
                            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="rounded-2xl border border-border bg-card p-6 space-y-5">
                                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-primary" /> AI Financial Insights
                                </h3>
                                {aiInsights.summary && (
                                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                                        <p className="text-sm text-foreground leading-relaxed">{aiInsights.summary}</p>
                                    </div>
                                )}
                                {aiInsights.risk_analysis && (
                                    <div className="p-4 rounded-xl bg-muted/50">
                                        <h4 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-1.5">
                                            <ShieldCheck className="w-4 h-4 text-muted-foreground" /> Risk Analysis
                                        </h4>
                                        <p className="text-sm text-muted-foreground leading-relaxed">{aiInsights.risk_analysis}</p>
                                    </div>
                                )}
                                {aiInsights.category_insights?.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
                                            <BarChart3 className="w-4 h-4 text-muted-foreground" /> Category Insights
                                        </h4>
                                        <div className="space-y-2">
                                            {aiInsights.category_insights.map((insight, i) => (
                                                <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 + i * 0.06 }}
                                                    className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                                                    <div className="mt-0.5 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                        <CheckCircle2 className="w-3 h-3 text-primary" />
                                                    </div>
                                                    <p className="text-sm text-muted-foreground leading-relaxed">{insight}</p>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {aiInsights.recommendations?.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
                                            <Lightbulb className="w-4 h-4 text-amber-500" /> Recommendations
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {aiInsights.recommendations.map((rec, i) => (
                                                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 + i * 0.06 }}
                                                    className="flex items-start gap-3 p-3 rounded-xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors">
                                                    <span className="text-amber-500 font-bold text-sm mt-px">{i + 1}.</span>
                                                    <p className="text-sm text-muted-foreground leading-relaxed">{rec}</p>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </motion.div>
                )}

                {/* Empty State */}
                {!isAnalyzing && !hasData && !aiInsights && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/5 flex items-center justify-center">
                            <Sparkles className="w-7 h-7 text-primary/40" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">Financial Intelligence Panel</h3>
                        <p className="text-sm text-muted-foreground max-w-md mx-auto">Enter your budget above and click <strong>Save</strong> to see your financial summary. Then click <strong>Analyze</strong> to get AI-powered financial insights for {trip.destination}.</p>
                    </motion.div>
                )}

            </div>
        </div>
    );
};

export default BudgetTab;
