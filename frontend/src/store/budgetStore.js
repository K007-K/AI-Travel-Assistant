import { create } from 'zustand';
import { supabase } from '../lib/supabase';

const useBudgetStore = create((set, get) => ({
    costEvents: [],
    budgetSummary: null,
    isLoading: false,
    error: null,
    currency: 'USD',

    // ─── Server-side aggregation via RPC ───────────────────────
    fetchBudgetSummary: async (tripId) => {
        if (!tripId) return;
        set({ isLoading: true, error: null });
        try {
            const { data, error } = await supabase.rpc('get_trip_budget_summary', {
                p_trip_id: tripId
            });
            if (error) throw error;
            set({ budgetSummary: data, isLoading: false });
        } catch (error) {
            console.error('Error fetching budget summary:', error);
            set({ error: error.message, isLoading: false });
        }
    },

    // ─── Fetch cost_events list for a trip ─────────────────────
    fetchCostEvents: async (tripId) => {
        if (!tripId) return;
        set({ isLoading: true, error: null });
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('cost_events')
                .select('id, source, category, amount, currency, description, metadata, created_at')
                .eq('trip_id', tripId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            set({ costEvents: data || [], isLoading: false });
        } catch (error) {
            console.error('Error fetching cost events:', error);
            set({ error: error.message, isLoading: false });
        }
    },

    // ─── Add a manual expense as a cost_event ──────────────────
    addExpense: async (expense) => {
        set({ isLoading: true, error: null });
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const { data, error } = await supabase
                .from('cost_events')
                .insert([{
                    trip_id: expense.tripId,
                    source: 'manual_expense',
                    category: expense.category,
                    amount: parseFloat(expense.amount),
                    currency: expense.currency || get().currency || 'USD',
                    description: expense.description,
                    metadata: {}
                }])
                .select()
                .single();

            if (error) throw error;

            // Add to local state + refresh server-side summary
            set((state) => ({
                costEvents: [data, ...state.costEvents],
                isLoading: false
            }));
            await get().fetchBudgetSummary(expense.tripId);
        } catch (error) {
            console.error('Error adding expense:', error);
            set({ error: error.message, isLoading: false });
        }
    },

    // ─── Delete a cost_event ───────────────────────────────────
    deleteExpense: async (id) => {
        set({ isLoading: true, error: null });
        try {
            // Find the event to get trip_id before deleting
            const event = get().costEvents.find(e => e.id === id);
            const tripId = event?.metadata?.trip_id || null;

            const { error } = await supabase
                .from('cost_events')
                .delete()
                .eq('id', id);

            if (error) throw error;

            set((state) => ({
                costEvents: state.costEvents.filter(e => e.id !== id),
                isLoading: false
            }));

            // Refresh summary if we know the trip
            if (tripId) {
                await get().fetchBudgetSummary(tripId);
            }
        } catch (error) {
            console.error('Error deleting cost event:', error);
            set({ error: error.message, isLoading: false });
        }
    },

    // ─── Delete cost_event for a specific activity and refresh ─────
    deleteCostEventForActivity: async (tripId, activityId) => {
        try {
            await supabase
                .from('cost_events')
                .delete()
                .eq('trip_id', tripId)
                .eq('source', 'ai_estimate')
                .contains('metadata', { activity_id: activityId });
            // Refresh budget summary
            await get().fetchBudgetSummary(tripId);
        } catch (error) {
            console.error('Error deleting cost event for activity:', error);
        }
    },

    // ─── Sync AI estimates from itinerary into cost_events ─────
    syncAiEstimates: async (tripId, days, currency) => {
        if (!tripId || !days) return;
        try {
            // Step 1: Delete old AI estimates for this trip
            await supabase
                .from('cost_events')
                .delete()
                .eq('trip_id', tripId)
                .eq('source', 'ai_estimate');

            // Step 2: Collect all activities with estimated_cost
            const aiEvents = [];
            for (const day of days) {
                if (!day.activities) continue;
                for (const activity of day.activities) {
                    if (activity.estimated_cost && activity.estimated_cost > 0) {
                        aiEvents.push({
                            trip_id: tripId,
                            source: 'ai_estimate',
                            category: activity.type || 'activities',
                            amount: activity.estimated_cost,
                            currency: currency || 'USD',
                            description: activity.title,
                            metadata: {
                                activity_id: activity.id,
                                day_number: day.dayNumber,
                                activity_title: activity.title
                            }
                        });
                    }
                }
            }

            // Step 3: Batch insert new estimates
            if (aiEvents.length > 0) {
                const { error } = await supabase
                    .from('cost_events')
                    .insert(aiEvents);
                if (error) console.error('Error syncing AI estimates:', error);
            }
        } catch (error) {
            console.error('Error syncing AI estimates:', error);
        }
    },

    // ─── Update trip budget via RPC (atomic stale detection) ─
    setTripBudget: async (tripId, amount) => {
        try {
            const { data, error } = await supabase.rpc('update_trip_budget', {
                p_trip_id: tripId,
                p_new_budget: parseFloat(amount)
            });
            if (error) throw error;
            // Refresh summary to reflect new budget
            await get().fetchBudgetSummary(tripId);
            return data; // { id, budget, itinerary_stale, generated_with_budget, ... }
        } catch (error) {
            console.error('Error setting budget:', error);
            return null;
        }
    },

    setCurrency: (currency) => set({ currency }),
}));

export default useBudgetStore;
