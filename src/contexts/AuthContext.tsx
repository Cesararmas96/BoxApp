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
    signIn: (credentials: any) => Promise<{ error: any }>;
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

    useEffect(() => {
        // Initial session check
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) fetchProfile(session.user.id);
            else setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log(`Auth Event: ${event}`);
            setSession(session);
            setUser(session?.user ?? null);

            if (session?.user) {
                await fetchProfile(session.user.id);
            } else {
                setUserProfile(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (!error && data) {
                setUserProfile(data);
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
        } finally {
            setLoading(false);
        }
    };

    const signIn = async (credentials: any) => {
        setLoading(true);
        const result = await supabase.auth.signInWithPassword(credentials);
        if (result.error) setLoading(false);
        return result;
    };

    const signUp = async (credentials: any) => {
        setLoading(true);
        const result = await supabase.auth.signUp(credentials);
        if (result.error) setLoading(false);
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
        setLoading(false);
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
