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
                price: booking.totalPrice || booking.price,
                date: booking.date,
                status: booking.status || 'confirmed',
                booked_at: new Date().toISOString(),
                trip_id: booking.tripId || null,  // Link to trip if provided
                details: {
                    title: booking.title,
                    subtitle: booking.details,
                    currency: booking.currency,
                    traveler: booking.traveler,
                    addons: booking.addons,
                    basePrice: booking.basePrice,
                    class: booking.trainClass || booking.class,
                    pnr: Math.random().toString(36).substr(2, 6).toUpperCase(),
                    ...booking
                }
            };

            const { data, error } = await supabase
                .from('bookings')
                .insert([newBooking])
                .select()
                .single();

            if (error) throw error;

            // Insert corresponding cost_event if trip is linked
            if (data.trip_id) {
                await supabase.from('cost_events').insert([{
                    trip_id: data.trip_id,
                    source: 'booking',
                    category: data.type,
                    amount: parseFloat(data.price) || 0,
                    currency: booking.currency || 'USD',
                    description: booking.title || `${data.type} booking`,
                    metadata: {
                        booking_id: data.id,
                        booking_type: data.type,
                        pnr: data.details?.pnr
                    }
                }]);
            }

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
            // Get the booking before updating to capture details for audit
            const originalBooking = get().bookings.find(b => b.id === bookingId);

            const { error } = await supabase
                .from('bookings')
                .update({ status: 'cancelled' })
                .eq('id', bookingId);

            if (error) throw error;

            // Insert negative cost_event for audit trail (if booking was linked to a trip)
            if (originalBooking?.trip_id) {
                await supabase.from('cost_events').insert([{
                    trip_id: originalBooking.trip_id,
                    source: 'booking',
                    category: originalBooking.type,
                    amount: -(parseFloat(originalBooking.price) || 0),
                    currency: originalBooking.details?.currency || 'USD',
                    description: 'Booking cancellation',
                    metadata: {
                        booking_id: bookingId,
                        booking_type: originalBooking.type,
                        type: 'cancellation'
                    }
                }]);
            }

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

    clearBookings: () => set({ bookings: [] }),
}));

export default useBookingStore;
