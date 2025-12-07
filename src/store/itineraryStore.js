import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';

const useItineraryStore = create(
    persist(
        (set, get) => ({
            trips: [],
            currentTrip: null,

            // Actions
            togglePinTrip: (tripId) => {
                set((state) => ({
                    trips: state.trips.map(trip =>
                        trip.id === tripId ? { ...trip, pinned: !trip.pinned } : trip
                    )
                }));
            },

            createTrip: (tripData) => {
                // Handle multi-segment logic
                let tripDays = [];
                let currentDayCount = 0;

                // Segments: [{ location: 'Paris', days: 3 }, { location: 'London', days: 2 }]
                // If legacy call (no segments), create 1 segment
                const segments = tripData.segments || [
                    { location: tripData.destination, days: tripData.duration }
                ];

                segments.forEach(segment => {
                    for (let i = 0; i < segment.days; i++) {
                        currentDayCount++;
                        tripDays.push({
                            id: `day-${currentDayCount}`,
                            dayNumber: currentDayCount,
                            location: segment.location, // Track location per day
                            activities: []
                        });
                    }
                });

                const newTrip = {
                    id: nanoid(),
                    title: tripData.title,
                    destination: segments[0].location, // Primary destination is the first one
                    segments: segments, // Store segments for reference
                    startDate: tripData.startDate,
                    endDate: tripData.endDate,
                    budget: tripData.budget || 0,
                    currency: tripData.currency || 'USD',
                    travelers: tripData.travelers || 1,
                    days: tripDays,
                    pinned: false,
                    createdAt: Date.now(),
                };

                set((state) => ({
                    trips: [newTrip, ...state.trips],
                    currentTrip: newTrip
                }));
                return newTrip.id;
            },

            updateTrip: (tripId, updates) => {
                set((state) => ({
                    trips: state.trips.map(trip =>
                        trip.id === tripId ? { ...trip, ...updates } : trip
                    ),
                    currentTrip: state.currentTrip?.id === tripId
                        ? { ...state.currentTrip, ...updates }
                        : state.currentTrip
                }));
            },

            deleteTrip: (tripId) => {
                set((state) => ({
                    trips: state.trips.filter(trip => trip.id !== tripId),
                    currentTrip: state.currentTrip?.id === tripId ? null : state.currentTrip
                }));
            },

            setCurrentTrip: (tripId) => {
                const trip = get().trips.find(t => t.id === tripId);
                set({ currentTrip: trip || null });
            },

            addActivity: (tripId, dayId, activity) => {
                set((state) => {
                    const tripIndex = state.trips.findIndex(t => t.id === tripId);
                    if (tripIndex === -1) return state;

                    const updatedTrip = { ...state.trips[tripIndex] };
                    const dayIndex = updatedTrip.days.findIndex(d => d.id === dayId);

                    if (dayIndex === -1) return state;

                    const newActivity = {
                        id: nanoid(),
                        ...activity,
                        // Ensure activity inherits day's location if not specified
                        location: activity.location || updatedTrip.days[dayIndex].location,
                        time: activity.time || '09:00',
                        type: activity.type || 'sightseeing',
                        isCompleted: false,
                        rating: 0
                    };

                    updatedTrip.days[dayIndex] = {
                        ...updatedTrip.days[dayIndex],
                        activities: [...updatedTrip.days[dayIndex].activities, newActivity]
                    };

                    const newTrips = [...state.trips];
                    newTrips[tripIndex] = updatedTrip;

                    return {
                        trips: newTrips,
                        currentTrip: state.currentTrip?.id === tripId ? updatedTrip : state.currentTrip
                    };
                });
            },

            deleteActivity: (tripId, dayId, activityId) => {
                set((state) => {
                    const tripIndex = state.trips.findIndex(t => t.id === tripId);
                    if (tripIndex === -1) return state;

                    const updatedTrip = { ...state.trips[tripIndex] };
                    const dayIndex = updatedTrip.days.findIndex(d => d.id === dayId);

                    if (dayIndex === -1) return state;

                    updatedTrip.days[dayIndex] = {
                        ...updatedTrip.days[dayIndex],
                        activities: updatedTrip.days[dayIndex].activities.filter(a => a.id !== activityId)
                    };

                    const newTrips = [...state.trips];
                    newTrips[tripIndex] = updatedTrip;

                    return {
                        trips: newTrips,
                        currentTrip: state.currentTrip?.id === tripId ? updatedTrip : state.currentTrip
                    };
                });
            },

            toggleActivityComplete: (tripId, dayId, activityId) => {
                set((state) => {
                    const tripIndex = state.trips.findIndex(t => t.id === tripId);
                    if (tripIndex === -1) return state;

                    const updatedTrip = { ...state.trips[tripIndex] };
                    updatedTrip.days = updatedTrip.days.map(day => {
                        if (day.id !== dayId) return day;
                        return {
                            ...day,
                            activities: day.activities.map(activity =>
                                activity.id === activityId
                                    ? { ...activity, isCompleted: !activity.isCompleted }
                                    : activity
                            )
                        };
                    });

                    const newTrips = [...state.trips];
                    newTrips[tripIndex] = updatedTrip;

                    return {
                        trips: newTrips,
                        currentTrip: state.currentTrip?.id === tripId ? updatedTrip : state.currentTrip
                    };
                });
            },

            rateActivity: (tripId, dayId, activityId, rating) => {
                set((state) => {
                    const tripIndex = state.trips.findIndex(t => t.id === tripId);
                    if (tripIndex === -1) return state;

                    const updatedTrip = { ...state.trips[tripIndex] };
                    updatedTrip.days = updatedTrip.days.map(day => {
                        if (day.id !== dayId) return day;
                        return {
                            ...day,
                            activities: day.activities.map(activity =>
                                activity.id === activityId
                                    ? { ...activity, rating: rating }
                                    : activity
                            )
                        };
                    });

                    const newTrips = [...state.trips];
                    newTrips[tripIndex] = updatedTrip;

                    return {
                        trips: newTrips,
                        currentTrip: state.currentTrip?.id === tripId ? updatedTrip : state.currentTrip
                    };
                });
            },

            reorderActivities: (tripId, dayId, newActivities) => {
                set((state) => {
                    const tripIndex = state.trips.findIndex(t => t.id === tripId);
                    if (tripIndex === -1) return state;

                    const updatedTrip = { ...state.trips[tripIndex] };
                    updatedTrip.days = updatedTrip.days.map(day =>
                        day.id === dayId ? { ...day, activities: newActivities } : day
                    );

                    const newTrips = [...state.trips];
                    newTrips[tripIndex] = updatedTrip;

                    return {
                        trips: newTrips,
                        currentTrip: state.currentTrip?.id === tripId ? updatedTrip : state.currentTrip
                    };
                });
            },
        }),
        {
            name: 'travel-itinerary-storage',
        }
    )
);

export default useItineraryStore;
