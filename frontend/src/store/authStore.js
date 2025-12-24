import { create } from 'zustand';
import { supabase } from '../lib/supabase';

const useAuthStore = create((set, get) => ({
    user: null,
    profile: null,
    isAuthenticated: false,
    isLoading: true, // Start loading to check session
    error: null,

    // Initialize Auth Listener
    initializeAuth: async () => {
        set({ isLoading: true });
        console.log('AuthStore: initializing...');

        try {
            // Get initial session
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) console.error('AuthStore: Error getting session', error);

            console.log('AuthStore: Initial session:', session?.user?.email || 'No session');

            if (session?.user) {
                await get().fetchProfile(session.user.id);
                set({ user: session.user, isAuthenticated: true, isLoading: false });
            } else {
                set({ user: null, profile: null, isAuthenticated: false, isLoading: false });
            }

            // Listen for changes
            const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
                console.log(`AuthStore: Auth event ${event}`, session?.user?.email);

                if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
                    if (session?.user) {
                        await get().fetchProfile(session.user.id);
                        set({ user: session.user, isAuthenticated: true, isLoading: false });
                    } else {
                        // INITIAL_SESSION with no user = not logged in
                        set({ user: null, profile: null, isAuthenticated: false, isLoading: false });
                    }
                } else if (event === 'SIGNED_OUT') {
                    set({ user: null, profile: null, isAuthenticated: false, isLoading: false });
                }
            });
            return () => subscription.unsubscribe();
        } catch (error) {
            console.error('AuthStore: Initialization error', error);
            set({ isLoading: false });
        }
    },

    fetchProfile: async (userId) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 is "Row not found" - acceptable for new users
                console.error('Error fetching profile:', error);
            }

            if (data) {
                set({ profile: data });
            }
        } catch (err) {
            console.error('Unexpected error fetching profile:', err);
        }
    },

    updateProfile: async (updates) => {
        set({ isLoading: true, error: null });
        try {
            const { user } = get();
            if (!user) throw new Error('No user logged in');

            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    ...updates,
                    updated_at: new Date(),
                });

            if (error) throw error;

            // Refresh profile data
            await get().fetchProfile(user.id);
            set({ isLoading: false });
        } catch (error) {
            set({ isLoading: false, error: error.message });
            throw error;
        }
    },

    loginWithGoogle: async () => {
        set({ isLoading: true, error: null });
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                },
            });
            if (error) throw error;
        } catch (error) {
            set({ isLoading: false, error: error.message });
            throw error;
        }
    },

    login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;
            // State update handled by onAuthStateChange
            return data.user;
        } catch (error) {
            set({ isLoading: false, error: error.message });
            throw error;
        }
    },

    signup: async (name, email, password) => {
        set({ isLoading: true, error: null });
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: name,
                    },
                },
            });

            if (error) throw error;

            if (data?.user) {
                // Create Profile
                // Note: Ideally handled by Database Trigger, but doing client-side for immediate MVP if trigger isn't set
                const { error: profileError } = await supabase
                    .from('profiles')
                    .upsert({
                        id: data.user.id,
                        full_name: name,
                        username: email.split('@')[0],
                        updated_at: new Date(),
                    });

                if (profileError) console.error('Error creating profile:', profileError);
            }

            return data.user;
        } catch (error) {
            set({ isLoading: false, error: error.message });
            throw error;
        }
    },

    logout: async () => {
        set({ isLoading: true, error: null });
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            // State update handled by onAuthStateChange
        } catch (error) {
            set({ isLoading: false, error: error.message });
        }
    },

    deleteAccount: async () => {
        set({ isLoading: true, error: null });
        try {
            const { error } = await supabase.rpc('delete_user');
            if (error) throw error;
            await get().logout();
        } catch (error) {
            set({ isLoading: false, error: error.message });
            throw error;
        }
    },

    clearError: () => set({ error: null })
}));

export default useAuthStore;
