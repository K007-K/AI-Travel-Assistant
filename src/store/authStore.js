import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
    persist(
        (set) => ({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,

            login: async (email, password) => {
                set({ isLoading: true, error: null });
                // Simulate API call
                return new Promise((resolve, reject) => {
                    setTimeout(() => {
                        if (email && password) {
                            // Mock successful login
                            const mockUser = {
                                id: '1',
                                name: email.split('@')[0], // Use part of email as name for now
                                email: email,
                                avatar: `https://ui-avatars.com/api/?name=${email.split('@')[0]}&background=0D8ABC&color=fff`,
                                createdAt: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                            };
                            set({ user: mockUser, isAuthenticated: true, isLoading: false });
                            resolve(mockUser);
                        } else {
                            set({ isLoading: false, error: 'Invalid credentials' });
                            reject(new Error('Invalid credentials'));
                        }
                    }, 1000);
                });
            },

            signup: async (name, email, password) => {
                set({ isLoading: true, error: null });
                // Simulate API call
                return new Promise((resolve, reject) => {
                    setTimeout(() => {
                        if (name && email && password) {
                            // Mock successful signup
                            const mockUser = {
                                id: '1',
                                name: name,
                                email: email,
                                avatar: `https://ui-avatars.com/api/?name=${name}&background=0D8ABC&color=fff`,
                                createdAt: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                            };
                            set({ user: mockUser, isAuthenticated: true, isLoading: false });
                            resolve(mockUser);
                        } else {

                            set({ isLoading: false, error: 'Missing required fields' });
                            reject(new Error('Missing required fields'));
                        }
                    }, 1000);
                });
            },

            logout: () => {
                set({ user: null, isAuthenticated: false });
            },

            clearError: () => set({ error: null })
        }),
        {
            name: 'travel-auth-storage',
            partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }), // Only persist user and auth status
        }
    )
);

export default useAuthStore;
