import { create } from 'zustand';
import { supabase } from '../lib/supabase';

const useBudgetStore = create((set, get) => ({
    expenses: [],
    isLoading: false,
    error: null,
    currency: 'USD',

    fetchExpenses: async () => {
        set({ isLoading: true, error: null });
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('expenses')
                .select('*')
                .order('date', { ascending: false });

            if (error) throw error;
            set({ expenses: data, isLoading: false });
        } catch (error) {
            console.error('Error fetching expenses:', error);
            set({ error: error.message, isLoading: false });
        }
    },

    // Updates the 'budget' field on the TRIP, not a local dictionary
    setTripBudget: async (tripId, amount) => {
        try {
            const { error } = await supabase
                .from('trips')
                .update({ budget: parseFloat(amount) })
                .eq('id', tripId);

            if (error) throw error;
            // Note: This won't update itineraryStore's 'trips' list automatically unless we reload trips.
            //Ideally we should have a single source of truth for trip data.
        } catch (error) {
            console.error('Error setting budget:', error);
        }
    },

    addExpense: async (expense) => {
        set({ isLoading: true, error: null });
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const newExpense = {
                user_id: user.id,
                trip_id: expense.tripId,
                amount: parseFloat(expense.amount),
                category: expense.category,
                description: expense.description,
                date: expense.date || new Date().toISOString(),
            };

            const { data, error } = await supabase
                .from('expenses')
                .insert([newExpense])
                .select()
                .single();

            if (error) throw error;

            set((state) => ({
                expenses: [data, ...state.expenses],
                isLoading: false
            }));
        } catch (error) {
            console.error('Error adding expense:', error);
            set({ error: error.message, isLoading: false });
        }
    },

    deleteExpense: async (id) => {
        set({ isLoading: true, error: null });
        try {
            const { error } = await supabase
                .from('expenses')
                .delete()
                .eq('id', id);

            if (error) throw error;

            set((state) => ({
                expenses: state.expenses.filter(e => e.id !== id),
                isLoading: false
            }));
        } catch (error) {
            console.error('Error deleting expense:', error);
            set({ error: error.message, isLoading: false });
        }
    },

    setCurrency: (currency) => set({ currency }),

    getTripExpenses: (tripId) => {
        return get().expenses.filter(e => e.trip_id === tripId);
    },

    getTotalSpent: (tripId) => {
        const tripExpenses = get().expenses.filter(e => e.trip_id === tripId);
        return tripExpenses.reduce((total, e) => total + (e.amount || 0), 0);
    }
}));

export default useBudgetStore;
