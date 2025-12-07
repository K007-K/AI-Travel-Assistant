import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';

const useBookingStore = create(
    persist(
        (set, get) => ({
            bookings: [],

            // Actions
            addBooking: (booking) => {
                const newBooking = {
                    id: nanoid(),
                    ...booking,
                    status: 'confirmed',
                    bookedAt: Date.now()
                };

                set((state) => ({
                    bookings: [newBooking, ...state.bookings]
                }));

                return newBooking.id;
            },

            cancelBooking: (bookingId) => {
                set((state) => ({
                    bookings: state.bookings.map(b =>
                        b.id === bookingId ? { ...b, status: 'cancelled' } : b
                    )
                }));
            },

            // Getters for Stats
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
        }),
        {
            name: 'travel-booking-storage',
        }
    )
);

export default useBookingStore;
