import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';

const useBudgetStore = create(
    persist(
        (set, get) => ({
            expenses: [],
            budgets: {}, // { tripId: budgetAmount }
            currency: 'USD',

            setTripBudget: (tripId, amount) => {
                set((state) => ({
                    budgets: { ...state.budgets, [tripId]: parseFloat(amount) }
                }));
            },

            addExpense: (expense) => {
                set((state) => ({
                    expenses: [{
                        id: nanoid(),
                        amount: parseFloat(expense.amount),
                        category: expense.category,
                        description: expense.description,
                        date: expense.date || new Date().toISOString(),
                        tripId: expense.tripId,
                        timestamp: Date.now()
                    }, ...state.expenses]
                }));
            },

            deleteExpense: (id) => {
                set((state) => ({
                    expenses: state.expenses.filter(e => e.id !== id)
                }));
            },

            setCurrency: (currency) => set({ currency }),

            getTripExpenses: (tripId) => {
                return get().expenses.filter(e => e.tripId === tripId);
            },

            getTotalSpent: (tripId) => {
                const tripExpenses = get().expenses.filter(e => e.tripId === tripId);
                return tripExpenses.reduce((total, e) => total + e.amount, 0);
            }
        }),
        {
            name: 'travel-budget-storage',
        }
    )
);

export default useBudgetStore;
