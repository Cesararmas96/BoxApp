import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Activity, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

export const AthleteDashboard: React.FC = () => {
    const { user } = useAuth();
    const [metrics, setMetrics] = useState({
        prs: 0,
        attendance: 0,
        loading: true
    });

    useEffect(() => {
        if (user?.id) fetchMetrics(user.id);
    }, [user]);

    const fetchMetrics = async (userId: string) => {
        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            // 1. Fetch PRs (Results marked as RX or just count results)
            const { count: prCount } = await supabase
                .from('results')
                .select('*', { count: 'exact', head: true })
                .eq('athlete_id', userId)
                .eq('rx', true)
                .gt('created_at', thirtyDaysAgo.toISOString());

            // 2. Attendance (Bookings marked as attended)
            const { data: bookings } = await supabase
                .from('bookings')
                .select('status')
                .eq('user_id', userId)
                .gt('created_at', thirtyDaysAgo.toISOString());

            const totalBookings = (bookings as any[])?.length || 0;
            const attendedCount = (bookings as any[])?.filter((b: any) => b.status === 'attended').length || 0;
            const attendanceRate = totalBookings > 0 ? Math.round((attendedCount / totalBookings) * 100) : 0;

            setMetrics({
                prs: prCount || 0,
                attendance: attendanceRate,
                loading: false
            });
        } catch (error) {
            console.error('Error fetching athlete metrics:', error);
            setMetrics(prev => ({ ...prev, loading: false }));
        }
    };

    return (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card className="col-span-full bg-primary/20 border-primary/30 shadow-premium overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50" />
                <CardHeader className="relative z-10 pt-8 px-8">
                    <CardTitle className="flex items-center gap-3 text-2xl font-black italic uppercase tracking-tighter text-glow translate-y-0 group-hover:-translate-y-1 transition-transform">
                        <div className="h-12 w-12 rounded-2xl glass flex items-center justify-center border-primary/30">
                            <Trophy className="h-6 w-6 text-primary group-hover:scale-125 transition-transform" />
                        </div>
                        Today's Mission
                    </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10 px-8 pb-8">
                    <p className="text-base font-bold uppercase tracking-wide opacity-80 leading-relaxed max-w-2xl italic">Master the day's challenge. Check the WOD section and dominate your performance logging!</p>
                </CardContent>
            </Card>

            <Card className="glass relative group overflow-hidden border-border">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <CardHeader className="pt-8 px-8">
                    <CardTitle className="text-[11px] font-black uppercase tracking-[0.4em] text-primary italic flex items-center gap-3">
                        <Activity className="h-4 w-4" /> Personal Progress
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-8 pb-8">
                    <div className="text-5xl font-black italic tracking-tighter mb-2 group-hover:text-primary transition-colors duration-500">
                        {metrics.prs} {metrics.prs === 1 ? 'PR' : 'PRs'}
                    </div>
                    <p className="text-[11px] font-bold text-muted-foreground/80 uppercase tracking-widest leading-relaxed">Logged in the last 30 days — {metrics.prs > 5 ? 'Record Breaking Pace' : 'Stay Consistent'}</p>
                </CardContent>
            </Card>

            <Card className="glass relative group overflow-hidden border-border">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <CardHeader className="pt-8 px-8">
                    <CardTitle className="text-[11px] font-black uppercase tracking-[0.4em] text-emerald-500 italic flex items-center gap-3">
                        <Calendar className="h-4 w-4" /> Attendance
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-8 pb-8">
                    <div className="text-5xl font-black italic tracking-tighter mb-2 group-hover:text-emerald-500 transition-colors duration-500">{metrics.attendance}%</div>
                    <p className="text-[11px] font-bold text-muted-foreground/80 uppercase tracking-widest leading-relaxed">Class consistency — {metrics.attendance > 80 ? 'Elite Discipline Level' : 'On Track'}</p>
                </CardContent>
            </Card>
        </div>
    );
};
