import { create } from 'zustand';
import { supabase } from '../lib/supabase';

const useBookingStore = create((set, get) => ({
    bookings: [],
    isLoading: false,
    error: null,

    fetchBookings: async () => {
        set({ isLoading: true, error: null });
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('bookings')
                .select('*')
                .order('booked_at', { ascending: false });

            if (error) throw error;
            set({ bookings: data, isLoading: false });
        } catch (error) {
            console.error('Error fetching bookings:', error);
            set({ error: error.message, isLoading: false });
        }
    },

    addBooking: async (booking) => {
        set({ isLoading: true, error: null });
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            // Schema Mapping: Map complex object to DB columns
            const newBooking = {
                user_id: user.id,
                type: booking.type,
                // Use totalPrice if available (from wizard), else fallback to price
                price: booking.totalPrice || booking.price,
                date: booking.date,
                status: booking.status || 'confirmed',
                booked_at: new Date().toISOString(),
                // Store all rich metadata in the JSONB column
                details: {
                    title: booking.title,
                    subtitle: booking.details, // 'details' string from mock data
                    currency: booking.currency,
                    traveler: booking.traveler,
                    addons: booking.addons,
                    basePrice: booking.basePrice,
                    class: booking.trainClass || booking.class,
                    pnr: Math.random().toString(36).substr(2, 6).toUpperCase(), // Generate Mock PNR
                    ...booking // Include everything else just in case
                }
            };

            const { data, error } = await supabase
                .from('bookings')
                .insert([newBooking])
                .select()
                .single();

            if (error) throw error;

            set((state) => ({
                bookings: [data, ...state.bookings],
                isLoading: false
            }));

            return data.id;
        } catch (error) {
            console.error('Error adding booking:', error);
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    cancelBooking: async (bookingId) => {
        set({ isLoading: true, error: null });
        try {
            const { error } = await supabase
                .from('bookings')
                .update({ status: 'cancelled' })
                .eq('id', bookingId);

            if (error) throw error;

            set((state) => ({
                bookings: state.bookings.map(b =>
                    b.id === bookingId ? { ...b, status: 'cancelled' } : b
                ),
                isLoading: false
            }));
        } catch (error) {
            console.error('Error cancelling booking:', error);
            set({ error: error.message, isLoading: false });
        }
    },

    // Getters for Stats (Client-side calculation based on fetched data)
    getStats: () => {
        const bookings = get().bookings;
        const activeBookings = bookings.filter(b => b.status !== 'cancelled');

        return {
            totalSpent: activeBookings.reduce((acc, b) => acc + (parseFloat(b.price) || 0), 0),
            totalBookings: activeBookings.length,
            flights: activeBookings.filter(b => b.type === 'flight').length,
            hotels: activeBookings.filter(b => b.type === 'hotel').length,
            trains: activeBookings.filter(b => b.type === 'train').length,
        };
    },

    clearBookings: () => set({ bookings: [] }),
}));

export default useBookingStore;
