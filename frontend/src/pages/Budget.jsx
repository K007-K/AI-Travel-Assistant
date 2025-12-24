import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Wallet, Plus, Trash2, DollarSign, TrendingUp, AlertCircle, ShoppingBag, Coffee, Car, Plane, Home } from 'lucide-react';
import useBudgetStore from '../store/budgetStore';
import useItineraryStore from '../store/itineraryStore';

const CATEGORIES = [
    { id: 'transport', label: 'Transport', icon: Plane, color: '#3b82f6' },
    { id: 'accommodation', label: 'Accommodation', icon: Home, color: '#8b5cf6' },
    { id: 'food', label: 'Food & Dining', icon: Coffee, color: '#f97316' },
    { id: 'activities', label: 'Activities', icon: ShoppingBag, color: '#10b981' },
    { id: 'shopping', label: 'Shopping', icon: ShoppingBag, color: '#ec4899' },
    { id: 'other', label: 'Other', icon: AlertCircle, color: '#64748b' },
];

const Budget = () => {
    const { expenses, addExpense, deleteExpense, currency: globalCurrency } = useBudgetStore();
    const { trips } = useItineraryStore();

    const [selectedTripId, setSelectedTripId] = useState(trips[0]?.id || '');
    const [isAdding, setIsAdding] = useState(false);
    const [newExpense, setNewExpense] = useState({
        amount: '',
        category: 'food',
        description: '',
        date: new Date().toISOString().split('T')[0]
    });

    const currentTrip = trips.find(t => t.id === selectedTripId);

    // Use trip-specific currency if available, otherwise fallback to global
    const currency = currentTrip?.currency || globalCurrency || 'USD';
    const tripExpenses = expenses.filter(e => e.trip_id === selectedTripId);
    const totalBudget = currentTrip?.budget || 0;
    const totalSpent = tripExpenses.reduce((sum, e) => sum + e.amount, 0);
    const remaining = totalBudget - totalSpent;
    const percentageUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    // Prepare chart data
    const chartData = useMemo(() => {
        const data = CATEGORIES.map(cat => {
            const value = tripExpenses
                .filter(e => e.category === cat.id)
                .reduce((sum, e) => sum + e.amount, 0);
            return { name: cat.label, value, color: cat.color };
        }).filter(d => d.value > 0);
        return data;
    }, [tripExpenses]);

    const handleAddSubmit = (e) => {
        e.preventDefault();
        if (!newExpense.amount || !selectedTripId) return;

        addExpense({
            ...newExpense,
            tripId: selectedTripId
        });

        setIsAdding(false);
        setNewExpense({
            amount: '',
            category: 'food',
            description: '',
            date: currentTrip?.startDate || new Date().toISOString().split('T')[0]
        });
    };

    if (trips.length === 0) {
        return (
            <div className="min-h-screen pt-32 container-custom text-center">
                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Wallet className="w-10 h-10 text-slate-400" />
                </div>
                <h2 className="text-2xl font-bold mb-4">No trips created yet</h2>
                <p className="text-slate-500 mb-8">Create a trip first to manage your travel budget.</p>
                {/* Link to itinerary page would go here */}
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 pb-16 bg-slate-50 dark:bg-slate-900">
            <div className="container-custom max-w-7xl mx-auto px-6 md:px-8">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-4">
                    <div>
                        <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-slate-100 mb-2">
                            Budget Manager
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400">
                            Track your travel expenses and stay on budget.
                        </p>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <select
                            value={selectedTripId}
                            onChange={(e) => setSelectedTripId(e.target.value)}
                            className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-primary-500/20"
                        >
                            {trips.map(trip => (
                                <option key={trip.id} value={trip.id}>{trip.title}</option>
                            ))}
                        </select>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                                setNewExpense(prev => ({
                                    ...prev,
                                    date: currentTrip?.startDate || new Date().toISOString().split('T')[0]
                                }));
                                setIsAdding(true);
                            }}
                            className="btn btn-primary flex items-center gap-2 whitespace-nowrap"
                        >
                            <Plus className="w-5 h-5" /> Add Expense
                        </motion.button>
                    </div>
                </div>

                {/* Dashboard Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-12">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white border-none">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-white/20 rounded-lg"><Wallet className="w-5 h-5" /></div>
                            <span className="font-medium text-blue-100">Total Budget</span>
                        </div>
                        <div className="text-3xl font-bold">{currency} {totalBudget.toLocaleString()}</div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card bg-gradient-to-br from-orange-500 to-red-500 text-white border-none">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-white/20 rounded-lg"><TrendingUp className="w-5 h-5" /></div>
                            <span className="font-medium text-orange-100">Total Spent</span>
                        </div>
                        <div className="text-3xl font-bold">{currency} {totalSpent.toLocaleString()}</div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card bg-white dark:bg-slate-800">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg"><DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" /></div>
                            <span className="font-medium text-slate-500 dark:text-slate-400">Remaining</span>
                        </div>
                        <div className={`text-3xl font-bold ${remaining >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                            {currency} {remaining.toLocaleString()}
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full mt-4 overflow-hidden">
                            <div
                                className={`h-full rounded-full ${percentageUsed > 100 ? 'bg-red-500' : 'bg-primary-500'}`}
                                style={{ width: `${Math.min(percentageUsed, 100)}%` }}
                            />
                        </div>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10 mt-4">
                    {/* Charts Section */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="card">
                            <h3 className="text-lg font-bold mb-6 text-slate-800 dark:text-slate-100">Spending Breakdown</h3>
                            <div className="h-64">
                                {chartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={chartData}
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {chartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                            />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-slate-400">
                                        No expenses recorded yet
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Expenses List */}
                    <div className="lg:col-span-2">
                        <div className="card">
                            <h3 className="text-lg font-bold mb-6 text-slate-800 dark:text-slate-100">Recent Transactions</h3>
                            {tripExpenses.length > 0 ? (
                                <div className="space-y-4">
                                    {tripExpenses.map((expense) => {
                                        const category = CATEGORIES.find(c => c.id === expense.category);
                                        const Icon = category?.icon || AlertCircle;
                                        return (
                                            <div key={expense.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-700/30 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors group">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 rounded-full" style={{ backgroundColor: `${category?.color}20`, color: category?.color }}>
                                                        <Icon className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-slate-900 dark:text-slate-100">{expense.description || category?.label}</h4>
                                                        <p className="text-xs text-slate-500">{new Date(expense.date).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className="font-bold text-slate-900 dark:text-slate-100">
                                                        -{currency} {expense.amount.toLocaleString()}
                                                    </span>
                                                    <button
                                                        onClick={() => deleteExpense(expense.id)}
                                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <p className="text-slate-500">No transactions yet. Add an expense to start tracking.</p>
                                </div>
                            )}
                        </div>
                    </div>
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
                                className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md p-8"
                            >
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">Add Expense</h2>
                                <form onSubmit={handleAddSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Amount</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">{currency}</span>
                                            <input
                                                type="number"
                                                autoFocus
                                                required
                                                className="input pl-12"
                                                placeholder="0.00"
                                                value={newExpense.amount}
                                                onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {CATEGORIES.map(cat => (
                                                <button
                                                    key={cat.id}
                                                    type="button"
                                                    onClick={() => setNewExpense({ ...newExpense, category: cat.id })}
                                                    className={`p-2 rounded-lg text-xs font-medium border flex flex-col items-center gap-1 transition-all ${newExpense.category === cat.id
                                                        ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-500 text-primary-700 dark:text-primary-300'
                                                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                                                        }`}
                                                >
                                                    <cat.icon className="w-4 h-4" />
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

                                    <div className="flex gap-3 mt-6">
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
