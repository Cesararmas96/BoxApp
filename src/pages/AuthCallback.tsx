import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

/**
 * AuthCallback handles the OAuth redirect (Google, etc.).
 * Supabase client auto-processes the hash tokens (#access_token=...).
 * This page waits for the session to be established and then redirects
 * the user to the dashboard.
 *
 * The box_id reconciliation happens inside AuthContext.fetchProfile,
 * which reads `pending_box_id` from localStorage (set before redirect).
 */
export const AuthCallback: React.FC = () => {
    const navigate = useNavigate();
    const { session, loading, userProfile } = useAuth();

    useEffect(() => {
        if (loading) return;

        if (session && userProfile) {
            // Profile loaded — navigate to dashboard
            navigate('/dashboard', { replace: true });
        } else if (!session) {
            // No session established — OAuth failed or was cancelled
            navigate('/login', { replace: true });
        }
        // If session exists but profile is still loading, wait
    }, [loading, session, userProfile, navigate]);

    return (
        <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center bg-[#050508]">
            <div className="text-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
                <p className="text-zinc-500 font-black italic uppercase tracking-[0.2em] text-xs">
                    Authenticating...
                </p>
            </div>
        </div>
    );
};
