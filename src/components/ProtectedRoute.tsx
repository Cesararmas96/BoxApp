import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ShieldAlert, Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
    children: ReactNode;
    allowedRoles?: string[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
    const { userProfile, loading, session } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground font-black italic uppercase tracking-[0.2em] text-[10px]">
                        Synchronizing Security Clearance...
                    </p>
                </div>
            </div>
        );
    }

    if (!session) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (!userProfile) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <ShieldAlert className="h-12 w-12 text-zinc-500 animate-pulse" />
                <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs italic">
                    Access Denied: Terminal Not Identified
                </p>
            </div>
        );
    }

    if (allowedRoles && (!userProfile.role_id || !allowedRoles.includes(userProfile.role_id))) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6 bg-card/20 backdrop-blur-3xl rounded-[2rem] border border-white/5 m-4">
                <div className="p-6 bg-destructive/10 rounded-full shadow-2xl shadow-destructive/20 animate-bounce">
                    <ShieldAlert className="h-12 w-12 text-destructive" />
                </div>
                <div className="text-center space-y-2">
                    <h2 className="text-3xl font-black italic uppercase tracking-tighter text-destructive text-glow">
                        Access Restricted
                    </h2>
                    <p className="text-muted-foreground font-medium text-sm tracking-wide max-w-sm mx-auto uppercase">
                        Protocol error: current credentials
                        <span className="text-primary font-black mx-1 italic">({userProfile.role_id || 'UNKNOWN'})</span>
                        insufficient for this sector.
                    </p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};

