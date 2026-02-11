import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Wallet, Plus, Trash2, DollarSign, TrendingUp, AlertCircle, ShoppingBag, Coffee, Car, Plane, Home, Sparkles, Receipt, BarChart3 } from 'lucide-react';
import useBudgetStore from '../store/budgetStore';
import useItineraryStore from '../store/itineraryStore';
import BudgetHealthBadge from '../components/ui/BudgetHealthBadge';

const CATEGORIES = [
    { id: 'transport', label: 'Transport', icon: Plane, color: '#3b82f6' },
    { id: 'accommodation', label: 'Accommodation', icon: Home, color: '#8b5cf6' },
    { id: 'food', label: 'Food & Dining', icon: Coffee, color: '#f97316' },
    { id: 'activities', label: 'Activities', icon: ShoppingBag, color: '#10b981' },
    { id: 'shopping', label: 'Shopping', icon: ShoppingBag, color: '#ec4899' },
    { id: 'other', label: 'Other', icon: AlertCircle, color: '#64748b' },
    { id: 'flight', label: 'Flight', icon: Plane, color: '#0ea5e9' },
    { id: 'hotel', label: 'Hotel', icon: Home, color: '#a855f7' },
    { id: 'train', label: 'Train', icon: Car, color: '#f59e0b' },
    { id: 'sightseeing', label: 'Sightseeing', icon: ShoppingBag, color: '#06b6d4' },
];

const CATEGORY_COLORS = Object.fromEntries(CATEGORIES.map(c => [c.id, c.color]));

const Budget = () => {
    const {
        costEvents, budgetSummary, addExpense, deleteExpense,
        fetchCostEvents, fetchBudgetSummary, currency: globalCurrency
    } = useBudgetStore();
    const { trips, fetchTrips, isLoading: tripsLoading } = useItineraryStore();

    const [selectedTripId, setSelectedTripId] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [newExpense, setNewExpense] = useState({
        amount: '',
        category: 'food',
        description: '',
        date: new Date().toISOString().split('T')[0]
    });

    const currentTrip = trips.find(t => t.id === selectedTripId);

    // Fetch trips on mount if not already loaded
    useEffect(() => {
        fetchTrips();
    }, [fetchTrips]);

    // Auto-select first trip when trips arrive
    useEffect(() => {
        if (trips.length > 0 && !selectedTripId) {
            setSelectedTripId(trips[0].id);
        }
    }, [trips, selectedTripId]);

    // Fetch budget data when trip changes
    useEffect(() => {
        if (selectedTripId) {
            fetchBudgetSummary(selectedTripId);
            fetchCostEvents(selectedTripId);
        }
    }, [selectedTripId, fetchBudgetSummary, fetchCostEvents]);

    // Derive display values
    const currency = budgetSummary?.currency || currentTrip?.currency || globalCurrency || 'USD';
    const totalBudget = budgetSummary?.total_budget ?? (currentTrip?.budget || 0);
    const totalSpent = budgetSummary?.total_spent ?? 0;
    const remaining = budgetSummary?.remaining ?? (totalBudget - totalSpent);
    const percentageUsed = budgetSummary?.percent_used ?? 0;
    const aiEstimatedTotal = budgetSummary?.ai_estimated_total ?? 0;
    const forecastTotal = totalSpent + aiEstimatedTotal;
    const forecastPercent = totalBudget > 0 ? Math.round((forecastTotal / totalBudget) * 100 * 10) / 10 : 0;
    const aiEstimatePercent = totalBudget > 0 ? Math.min((aiEstimatedTotal / totalBudget) * 100, 100 - Math.min(percentageUsed, 100)) : 0;

    // Chart data
    const chartData = (budgetSummary?.category_breakdown || []).map(cat => {
        const knownCat = CATEGORIES.find(c => c.id === cat.category);
        return {
            name: knownCat?.label || cat.category,
            value: cat.total,
            color: CATEGORY_COLORS[cat.category] || '#94a3b8'
        };
    }).filter(d => d.value > 0);

    const displayExpenses = costEvents.filter(e => e.source === 'manual_expense');

    const handleAddSubmit = (e) => {
        e.preventDefault();
        if (!newExpense.amount || !selectedTripId) return;
        addExpense({
            ...newExpense,
            tripId: selectedTripId,
            currency: currency,
        });
        setIsAdding(false);
        setNewExpense({
            amount: '',
            category: 'food',
            description: '',
            date: currentTrip?.startDate || new Date().toISOString().split('T')[0]
        });
    };

    if (tripsLoading || (trips.length === 0 && !selectedTripId)) {
        if (tripsLoading) {
            return (
                <div className="min-h-screen pt-32 flex flex-col items-center justify-center text-center">
                    <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mb-4" />
                    <p className="text-slate-500 text-sm">Loading your trips…</p>
                </div>
            );
        }
        return (
            <div className="min-h-screen pt-32 container-custom text-center">
                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Wallet className="w-10 h-10 text-slate-400" />
                </div>
                <h2 className="text-2xl font-bold mb-4">No trips created yet</h2>
                <p className="text-slate-500 mb-8">Create a trip first to manage your travel budget.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 pb-16 bg-slate-50 dark:bg-slate-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-slate-100 mb-1">
                            Budget Manager
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">
                            Track your travel expenses and stay on budget.
                        </p>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <select
                            value={selectedTripId}
                            onChange={(e) => setSelectedTripId(e.target.value)}
                            className="flex-1 md:flex-none p-2.5 pr-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium outline-none focus:ring-2 focus:ring-primary-500/20 min-w-[180px]"
                        >
                            {trips.map(trip => (
                                <option key={trip.id} value={trip.id}>{trip.title}</option>
                            ))}
                        </select>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                                setNewExpense(prev => ({
                                    ...prev,
                                    date: currentTrip?.startDate || new Date().toISOString().split('T')[0]
                                }));
                                setIsAdding(true);
                            }}
                            className="btn btn-primary flex items-center gap-2 whitespace-nowrap text-sm px-4 py-2.5"
                        >
                            <Plus className="w-4 h-4" /> Add Expense
                        </motion.button>
                    </div>
                </div>

                {/* Dashboard Cards — 4 equal-height cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {/* Total Budget */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl p-5 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/20"
                    >
                        <div className="flex items-center gap-2.5 mb-3">
                            <div className="p-2 bg-white/20 rounded-lg"><Wallet className="w-4 h-4" /></div>
                            <span className="text-sm font-medium text-blue-100">Total Budget</span>
                        </div>
                        <div className="text-2xl font-bold">{currency} {totalBudget.toLocaleString()}</div>
                        <p className="text-xs text-blue-200 mt-1">Per person</p>
                    </motion.div>

                    {/* Total Spent */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        className="rounded-2xl p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm"
                    >
                        <div className="flex items-center gap-2.5 mb-3">
                            <div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-lg"><TrendingUp className="w-4 h-4 text-rose-600 dark:text-rose-400" /></div>
                            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Spent</span>
                        </div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{currency} {totalSpent.toLocaleString()}</div>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Manual + Bookings</p>
                    </motion.div>

                    {/* Remaining */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="rounded-2xl p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm"
                    >
                        <div className="flex items-center gap-2.5 mb-3">
                            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg"><DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /></div>
                            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Remaining</span>
                        </div>
                        <div className={`text-2xl font-bold ${remaining >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                            {currency} {remaining.toLocaleString()}
                        </div>
                        {/* Progress bar */}
                        <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full mt-3 overflow-hidden flex">
                            <div
                                className={`h-full rounded-full transition-all ${percentageUsed > 100 ? 'bg-red-500' : 'bg-blue-500'}`}
                                style={{ width: `${Math.min(percentageUsed, 100)}%` }}
                            />
                            {aiEstimatePercent > 0 && (
                                <div
                                    className="h-full bg-violet-400/60"
                                    style={{
                                        width: `${Math.min(aiEstimatePercent, 100 - Math.min(percentageUsed, 100))}%`,
                                        backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.4) 2px, rgba(255,255,255,0.4) 4px)'
                                    }}
                                />
                            )}
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-400">
                            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" /> Spent</span>
                            {aiEstimatePercent > 0 && <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-violet-400 inline-block" /> AI Est.</span>}
                        </div>
                    </motion.div>

                    {/* Status / Forecast */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="rounded-2xl p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col"
                    >
                        <BudgetHealthBadge percentUsed={percentageUsed} forecastPercent={forecastPercent} size="md" />
                        {aiEstimatedTotal > 0 && (
                            <div className="mt-auto pt-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                                <Sparkles className="w-3 h-3 text-violet-500" />
                                AI estimates: {currency} {aiEstimatedTotal.toLocaleString()}
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* Bottom section: Pie Chart + Cost Sources | Transactions */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left column: Charts */}
                    <div className="space-y-6">
                        {/* Pie Chart */}
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="rounded-2xl p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm"
                        >
                            <h3 className="text-base font-bold mb-4 text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                <BarChart3 className="w-4 h-4 text-slate-400" /> Spending Breakdown
                            </h3>
                            <div className="h-56">
                                {chartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={chartData}
                                                innerRadius={55}
                                                outerRadius={75}
                                                paddingAngle={4}
                                                dataKey="value"
                                            >
                                                {chartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: '13px' }}
                                                formatter={(value) => [`${currency} ${value.toLocaleString()}`, '']}
                                            />
                                            <Legend
                                                iconType="circle"
                                                iconSize={8}
                                                wrapperStyle={{ fontSize: '12px' }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3">
                                        <div className="w-14 h-14 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                                            <BarChart3 className="w-6 h-6 text-slate-300 dark:text-slate-500" />
                                        </div>
                                        <p className="text-sm">No expenses recorded yet</p>
                                        <p className="text-xs text-slate-300 dark:text-slate-600">Add expenses or generate an itinerary</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {/* Category Source Split */}
                        {(budgetSummary?.category_breakdown || []).length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.25 }}
                                className="rounded-2xl p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm"
                            >
                                <h3 className="text-base font-bold mb-4 text-slate-800 dark:text-slate-100">Cost Sources</h3>
                                <div className="space-y-3">
                                    {(budgetSummary?.category_breakdown || []).map((cat) => {
                                        const knownCat = CATEGORIES.find(c => c.id === cat.category);
                                        const manual = cat.by_source?.manual || 0;
                                        const booking = cat.by_source?.booking || 0;
                                        const aiEst = cat.by_source?.ai_estimate || 0;
                                        const catTotal = manual + booking + aiEst;
                                        if (catTotal <= 0) return null;
                                        const CatIcon = knownCat?.icon || AlertCircle;
                                        return (
                                            <div key={cat.category} className="flex items-center gap-3">
                                                <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${knownCat?.color || '#94a3b8'}15` }}>
                                                    <CatIcon className="w-3.5 h-3.5" style={{ color: knownCat?.color || '#94a3b8' }} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-xs font-medium text-slate-600 dark:text-slate-300 truncate">{knownCat?.label || cat.category}</span>
                                                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100 ml-2">{currency} {catTotal.toLocaleString()}</span>
                                                    </div>
                                                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden flex">
                                                        {manual > 0 && <div className="h-full bg-blue-500" style={{ width: `${(manual / catTotal) * 100}%` }} />}
                                                        {booking > 0 && <div className="h-full bg-emerald-500" style={{ width: `${(booking / catTotal) * 100}%` }} />}
                                                        {aiEst > 0 && <div className="h-full bg-violet-400" style={{ width: `${(aiEst / catTotal) * 100}%` }} />}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 text-[10px] text-slate-400">
                                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" /> Manual</span>
                                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> Booking</span>
                                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-violet-400 inline-block" /> AI Est.</span>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Right column: Transactions */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="lg:col-span-2 rounded-2xl p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm"
                    >
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                <Receipt className="w-4 h-4 text-slate-400" /> Recent Transactions
                            </h3>
                            {displayExpenses.length > 0 && (
                                <span className="text-xs font-medium text-slate-400 bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-full">
                                    {displayExpenses.length} item{displayExpenses.length !== 1 ? 's' : ''}
                                </span>
                            )}
                        </div>
                        {displayExpenses.length > 0 ? (
                            <div className="space-y-2">
                                {displayExpenses.map((expense) => {
                                    const category = CATEGORIES.find(c => c.id === expense.category);
                                    const Icon = category?.icon || AlertCircle;
                                    return (
                                        <div key={expense.id} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-700/30 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors group">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${category?.color}15`, color: category?.color }}>
                                                    <Icon className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100">{expense.description || category?.label}</h4>
                                                    <p className="text-[11px] text-slate-400">{new Date(expense.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                                                    -{currency} {expense.amount.toLocaleString()}
                                                </span>
                                                <button
                                                    onClick={() => deleteExpense(expense.id)}
                                                    className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-16">
                                <div className="w-14 h-14 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Receipt className="w-6 h-6 text-slate-300 dark:text-slate-500" />
                                </div>
                                <p className="text-sm font-medium text-slate-500 mb-1">No transactions yet</p>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">Add an expense to start tracking spending.</p>
                                <button
                                    onClick={() => {
                                        setNewExpense(prev => ({
                                            ...prev,
                                            date: currentTrip?.startDate || new Date().toISOString().split('T')[0]
                                        }));
                                        setIsAdding(true);
                                    }}
                                    className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 transition-colors"
                                >
                                    <Plus className="w-4 h-4" /> Add your first expense
                                </button>
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* Add Expense Modal */}
                <AnimatePresence>
                    {isAdding && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsAdding(false)}
                                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6"
                            >
                                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-5">Add Expense</h2>
                                <form onSubmit={handleAddSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Amount</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{currency}</span>
                                            <input
                                                type="number"
                                                autoFocus
                                                required
                                                className="input pl-14"
                                                placeholder="0.00"
                                                value={newExpense.amount}
                                                onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
                                        <div className="grid grid-cols-3 gap-1.5">
                                            {CATEGORIES.filter(c => !['flight', 'hotel', 'train', 'sightseeing'].includes(c.id)).map(cat => (
                                                <button
                                                    key={cat.id}
                                                    type="button"
                                                    onClick={() => setNewExpense({ ...newExpense, category: cat.id })}
                                                    className={`p-2 rounded-lg text-xs font-medium border flex flex-col items-center gap-1 transition-all ${newExpense.category === cat.id
                                                        ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-500 text-primary-700 dark:text-primary-300'
                                                        : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                                                        }`}
                                                >
                                                    <cat.icon className="w-3.5 h-3.5" />
                                                    {cat.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Lunch at Cafe"
                                            className="input"
                                            value={newExpense.description}
                                            onChange={e => setNewExpense({ ...newExpense, description: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date</label>
                                        <input
                                            type="date"
                                            required
                                            min={currentTrip?.startDate}
                                            max={currentTrip?.endDate}
                                            className="input"
                                            value={newExpense.date}
                                            onChange={e => setNewExpense({ ...newExpense, date: e.target.value })}
                                        />
                                    </div>

                                    <div className="flex gap-3 mt-5">
                                        <button
                                            type="button"
                                            onClick={() => setIsAdding(false)}
                                            className="flex-1 btn bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-1 btn btn-primary"
                                        >
                                            Add Expense
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Budget;
