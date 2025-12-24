import { create } from 'zustand';
import { supabase } from '../lib/supabase';

const useItineraryStore = create((set, get) => ({
    trips: [],
    currentTrip: null,
    isLoading: false,
    error: null,

    // Actions
    fetchTrips: async () => {
        set({ isLoading: true, error: null });
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('trips')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            set({ trips: data, isLoading: false });
        } catch (error) {
            console.error('Error fetching trips:', error);
            set({ error: error.message, isLoading: false });
        }
    },

    createTrip: async (tripData) => {
        set({ isLoading: true, error: null });
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            // Handle multi-segment logic
            let tripDays = [];
            let currentDayCount = 0;
            const segments = tripData.segments || [
                { location: tripData.destination, days: tripData.duration }
            ];

            segments.forEach(segment => {
                for (let i = 0; i < segment.days; i++) {
                    currentDayCount++;
                    tripDays.push({
                        id: `day-${currentDayCount}`,
                        dayNumber: currentDayCount,
                        location: segment.location,
                        activities: []
                    });
                }
            });

            const newTrip = {
                user_id: user.id,
                title: tripData.title,
                destination: segments[0].location,
                start_date: tripData.startDate,
                end_date: tripData.endDate,
                budget: tripData.budget || 0,
                currency: tripData.currency || 'USD',
                travelers: tripData.travelers || 1,
                pinned: false,
                segments: segments,
                days: tripDays,
            };

            const { data, error } = await supabase
                .from('trips')
                .insert([newTrip])
                .select()
                .single();

            if (error) throw error;

            set((state) => ({
                trips: [data, ...state.trips],
                currentTrip: data,
                isLoading: false
            }));
            return data.id;
        } catch (error) {
            console.error('Error creating trip:', error);
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    deleteTrip: async (tripId) => {
        set({ isLoading: true, error: null });
        try {
            const { error } = await supabase
                .from('trips')
                .delete()
                .eq('id', tripId);

            if (error) throw error;

            set((state) => ({
                trips: state.trips.filter(trip => trip.id !== tripId),
                currentTrip: state.currentTrip?.id === tripId ? null : state.currentTrip,
                isLoading: false
            }));
        } catch (error) {
            console.error('Error deleting trip:', error);
            set({ error: error.message, isLoading: false });
        }
    },

    togglePinTrip: async (tripId) => {
        const trip = get().trips.find(t => t.id === tripId);
        if (!trip) return;

        const newPinnedStatus = !trip.pinned;

        // Optimistic update
        set((state) => ({
            trips: state.trips.map(t =>
                t.id === tripId ? { ...t, pinned: newPinnedStatus } : t
            )
        }));

        try {
            const { error } = await supabase
                .from('trips')
                .update({ pinned: newPinnedStatus })
                .eq('id', tripId);

            if (error) {
                // Revert on error
                set((state) => ({
                    trips: state.trips.map(t =>
                        t.id === tripId ? { ...t, pinned: !newPinnedStatus } : t
                    )
                }));
                throw error;
            }
        } catch (error) {
            console.error('Error pinning trip:', error);
        }
    },

    setCurrentTrip: (tripId) => {
        const trip = get().trips.find(t => t.id === tripId);
        set({ currentTrip: trip || null });
    },

    // Complex JSONB updates for activities
    // Since JSONB updates are tricky with partial nested updates, 
    // we'll update the local state first, then push the entire 'days' array to Supabase.
    updateTripDays: async (tripId, newDays) => {
        // Optimistic update
        set((state) => ({
            trips: state.trips.map(t => t.id === tripId ? { ...t, days: newDays } : t),
            currentTrip: state.currentTrip?.id === tripId ? { ...state.currentTrip, days: newDays } : state.currentTrip
        }));

        try {
            const { error } = await supabase
                .from('trips')
                .update({ days: newDays })
                .eq('id', tripId);

            if (error) throw error;
        } catch (error) {
            console.error('Error updating trip days:', error);
            // Ideally revert here, but for now we just log
        }
    },

    updateTrip: async (tripId, updates) => {
        set({ isLoading: true, error: null });
        try {
            const { error } = await supabase
                .from('trips')
                .update(updates)
                .eq('id', tripId);

            if (error) throw error;

            set((state) => ({
                trips: state.trips.map(t =>
                    t.id === tripId ? { ...t, ...updates } : t
                ),
                currentTrip: state.currentTrip?.id === tripId ? { ...state.currentTrip, ...updates } : state.currentTrip,
                isLoading: false
            }));
        } catch (error) {
            console.error('Error updating trip:', error);
            set({ error: error.message, isLoading: false });
        }
    },

    addActivity: async (tripId, dayId, activity) => {
        const store = get();
        const trip = store.trips.find(t => t.id === tripId);
        if (!trip) return;

        const updatedDays = trip.days.map(day => {
            if (day.id !== dayId) return day;
            return {
                ...day,
                activities: [...(day.activities || []), {
                    id: crypto.randomUUID(),
                    ...activity,
                    location: activity.location || day.location,
                    time: activity.time || '09:00',
                    type: activity.type || 'sightseeing',
                    isCompleted: false,
                    rating: 0
                }]
            };
        });

        await store.updateTripDays(tripId, updatedDays);
    },

    deleteActivity: async (tripId, dayId, activityId) => {
        const store = get();
        const trip = store.trips.find(t => t.id === tripId);
        if (!trip) return;

        const updatedDays = trip.days.map(day => {
            if (day.id !== dayId) return day;
            return {
                ...day,
                activities: day.activities.filter(a => a.id !== activityId)
            };
        });

        await store.updateTripDays(tripId, updatedDays);
    },

    toggleActivityComplete: async (tripId, dayId, activityId) => {
        const store = get();
        const trip = store.trips.find(t => t.id === tripId);
        if (!trip) return;

        const updatedDays = trip.days.map(day => {
            if (day.id !== dayId) return day;
            return {
                ...day,
                activities: day.activities.map(a =>
                    a.id === activityId ? { ...a, isCompleted: !a.isCompleted } : a
                )
            };
        });

        await store.updateTripDays(tripId, updatedDays);
    },

    reorderActivities: async (tripId, dayId, newActivities) => {
        const store = get();
        const trip = store.trips.find(t => t.id === tripId);
        if (!trip) return;

        const updatedDays = trip.days.map(day =>
            day.id === dayId ? { ...day, activities: newActivities } : day
        );

        await store.updateTripDays(tripId, updatedDays);
    },

    rateActivity: async (tripId, dayId, activityId, rating) => {
        const store = get();
        const trip = store.trips.find(t => t.id === tripId);
        if (!trip) return;

        const updatedDays = trip.days.map(day => {
            if (day.id !== dayId) return day;
            return {
                ...day,
                activities: day.activities.map(a =>
                    a.id === activityId ? { ...a, rating: rating } : a
                )
            };
        });

        await store.updateTripDays(tripId, updatedDays);
    }
}));

export default useItineraryStore;
