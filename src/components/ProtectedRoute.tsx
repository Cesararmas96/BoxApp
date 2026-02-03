import { ReactNode } from 'react';

interface ProtectedRouteProps {
    children: ReactNode;
    userProfile: any;
    allowedRoles?: string[];
}

export const ProtectedRoute = ({ children, userProfile, allowedRoles }: ProtectedRouteProps) => {
    if (!userProfile) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
                    <p className="text-muted-foreground font-medium uppercase tracking-widest text-xs">Authenticating Security Clearance...</p>
                </div>
            </div>
        );
    }

    if (allowedRoles && !allowedRoles.includes(userProfile.role_id)) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <div className="p-4 bg-destructive/10 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-destructive"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /><path d="m14.5 9-5 5" /><path d="m9.5 9 5 5" /></svg>
                </div>
                <h2 className="text-2xl font-black italic uppercase tracking-tighter text-destructive">Access Denied</h2>
                <p className="text-muted-foreground text-center max-w-md">Your current role <strong>({userProfile.role_id})</strong> does not have the required permissions to access this high-security sector.</p>
            </div>
        );
    }

    return <>{children}</>;
};
