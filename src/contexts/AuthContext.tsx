import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
    session: Session | null;
    user: User | null;
    userProfile: any | null;
    loading: boolean;
    isAdmin: boolean;
    isCoach: boolean;
    isAthlete: boolean;
    signIn: (credentials: any) => Promise<{ error: any; data?: any }>;
    signUp: (credentials: any) => Promise<{ data: any; error: any }>;
    resetPassword: (email: string) => Promise<{ error: any }>;
    updateUser: (attributes: any) => Promise<{ data: any; error: any }>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    const isAdmin = userProfile?.role_id === 'admin';
    const isCoach = userProfile?.role_id === 'coach';
    const isAthlete = userProfile?.role_id === 'athlete';

    const fetchProfile = async (userId: string) => {
        console.log('[AuthContext] fetchProfile started for:', userId);

        // Safety timeout to prevent indefinite loading
        const timeoutId = setTimeout(() => {
            console.warn('[AuthContext] fetchProfile timed out, forcing loading to false');
            setLoading(false);
        }, 5000);

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.warn('[AuthContext] Error fetching profile:', error.message);
                setUserProfile(null);
            } else {
                console.log('[AuthContext] Profile loaded successfully');
                setUserProfile(data);
            }
        } catch (err) {
            console.error('[AuthContext] Unexpected error in fetchProfile:', err);
        } finally {
            clearTimeout(timeoutId);
            setLoading(false);
            console.log('[AuthContext] Loading set to false');
        }
    };

    useEffect(() => {
        // Initial session check
        console.log('[AuthContext] Initial session check...');
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
            } else {
                setLoading(false);
                console.log('[AuthContext] No initial session, loading set to false');
            }
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
            console.log(`[AuthContext] OnAuthStateChange: ${event}`, newSession?.user?.id);

            setSession(newSession);
            setUser(newSession?.user ?? null);

            if (newSession?.user) {
                // Only fetch if session changed or event is SIGNED_IN
                // This helps avoid redundant fetches but ensures we get the latest profile
                fetchProfile(newSession.user.id);
            } else {
                setUserProfile(null);
                setLoading(false);
                console.log('[AuthContext] Clear session, loading set to false');
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const signIn = async (credentials: any) => {
        setLoading(true);
        console.log('[AuthContext] SignIn process started');
        const result = await supabase.auth.signInWithPassword(credentials);

        if (result.error) {
            setLoading(false);
            console.log('[AuthContext] SignIn error, loading set to false');
        } else if (result.data.user) {
            // Explicitly fetch profile to ensure it's ready when the promise resolves
            await fetchProfile(result.data.user.id);
        }

        return result;
    };

    const signUp = async (credentials: any) => {
        setLoading(true);
        const result = await supabase.auth.signUp(credentials);
        if (result.error || !result.data.user) {
            setLoading(false);
        } else {
            // For sign up, we might not have a profile yet if it's created via trigger
            // but we call it anyway to be sure
            await fetchProfile(result.data.user.id);
        }
        return result;
    };

    const resetPassword = async (email: string) => {
        setLoading(true);
        const result = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });
        setLoading(false);
        return result;
    };

    const updateUser = async (attributes: any) => {
        setLoading(true);
        const result = await supabase.auth.updateUser(attributes);
        setLoading(false);
        return result;
    };

    const signOut = async () => {
        setLoading(true);
        await supabase.auth.signOut();
        // onAuthStateChange will handle resetting state
    };

    const value = {
        session,
        user,
        userProfile,
        loading,
        isAdmin,
        isCoach,
        isAthlete,
        signIn,
        signUp,
        resetPassword,
        updateUser,
        signOut
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
