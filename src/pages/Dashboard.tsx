import React, { useEffect, useState } from 'react';

const ATTENDANCE_BAR_STATIC = [0.8, 0.9, 0.7, 0.85, 0.92];
import { supabase } from '@/lib/supabaseClient';
import {
    Users,
    Trophy,
    TrendingUp,
    Zap,
    Clock,
    Flame,
    Calendar,
} from 'lucide-react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from "@/components/ui/progress"
import { AthleteDashboard } from '@/components/AthleteDashboard';
import { CoachDashboard } from '@/components/CoachDashboard';
import { useLanguage } from '@/hooks';
import { useAuth } from '@/contexts/AuthContext';

export const Dashboard: React.FC = () => {
    const { t } = useLanguage();
    const { userProfile, currentBox } = useAuth();
    const [stats, setStats] = useState({
        members: 0,
        activeWOD: null as any,
        attendance: 0,
        pendingLeads: 0,
        totalBookings: 0,
        recentResults: [] as any[]
    });

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const boxId = currentBox?.id || '';

            const [
                { count: membersCount },
                { count: leadsCount },
                { data: wodData },
                { data: bookingsData },
                { data: resultsData }
            ] = await Promise.all([
                supabase
                    .from('profiles')
                    .select('*', { count: 'exact', head: true })
                    .eq('box_id', boxId),
                supabase
                    .from('leads')
                    .select('*', { count: 'exact', head: true })
                    .eq('box_id', boxId)
                    .eq('status', 'new'),
                supabase
                    .from('wods')
                    .select('*')
                    .eq('box_id', boxId)
                    .eq('date', today)
                    .order('track', { ascending: true })
                    .limit(1),
                supabase
                    .from('bookings')
                    .select('status')
                    .eq('box_id', boxId)
                    .gt('created_at', thirtyDaysAgo.toISOString()),
                supabase
                    .from('results')
                    .select('id, result, rx, wods (title), profiles (first_name, last_name)')
                    .eq('box_id', boxId)
                    .order('created_at', { ascending: false })
                    .limit(3)
            ]);

            const totalBookings = bookingsData?.length || 0;
            const attendedBookings = bookingsData?.filter(b => b.status === 'attended').length || 0;
            const attendanceRate = totalBookings > 0 ? Math.round((attendedBookings / totalBookings) * 100) : 0;

            setStats({
                members: membersCount || 0,
                activeWOD: wodData?.[0] || null,
                attendance: attendanceRate,
                pendingLeads: leadsCount || 0,
                totalBookings,
                recentResults: (resultsData as any[]) || []
            });
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        }
    };

    // Role-based rendering
    if (userProfile?.role_id === 'athlete') {
        return (
            <div className="space-y-8 animate-premium-in">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-foreground leading-none">{t('dashboard.athlete_hub')}</h1>
                    <p className="text-muted-foreground text-sm mt-1">{t('dashboard.welcome_back', { name: `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() || t('dashboard.athlete_generic') })}</p>
                </div>
                <AthleteDashboard />
            </div>
        );
    }

    if (userProfile?.role_id === 'coach') {
        return (
            <div className="space-y-8 animate-premium-in">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-foreground leading-none">{t('dashboard.coach_command')}</h1>
                    <p className="text-muted-foreground text-sm mt-1">{t('dashboard.coach_status')}</p>
                </div>
                <CoachDashboard />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-premium-in">
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 mb-1">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{t('dashboard.system_live')}</span>
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-foreground leading-none">{t('dashboard.command_center')}</h1>
                <p className="text-muted-foreground text-sm mt-1">{t('dashboard.analytics_subtitle', { defaultValue: 'Operational Analytics & Global Oversight' })}</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Members card */}
                <Card className="overflow-hidden relative group bg-primary/5 border-primary/10">
                    <div className="absolute top-6 right-6 text-primary/10">
                        <Users className="h-16 w-16" />
                    </div>
                    <CardHeader className="relative z-10 pb-2">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('dashboard.community')}</CardTitle>
                        <CardDescription className="text-foreground font-semibold text-lg">{t('dashboard.registered_athletes')}</CardDescription>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <div className="text-5xl font-bold tracking-tight mb-4 text-foreground">{stats.members}</div>
                        <Progress value={78} className="h-1.5" />
                        <p className="mt-3 text-xs text-muted-foreground">{t('dashboard.growth_cycle')}</p>
                    </CardContent>
                </Card>

                {/* WOD card */}
                <Card className="flex flex-col group overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <div className="space-y-1">
                            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-primary">{t('dashboard.daily_wod')}</CardTitle>
                            <CardDescription className="font-semibold text-lg text-foreground">{t('dashboard.main_programming')}</CardDescription>
                        </div>
                        <Badge variant="glow" className="text-xs">{t('dashboard.live_now')}</Badge>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col">
                        {stats.activeWOD ? (
                            <>
                                <div className="text-2xl font-bold text-foreground mb-2">{stats.activeWOD.title}</div>
                                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-6">
                                    <Badge variant="outline" className="text-primary border-primary/20">{stats.activeWOD.track}</Badge>
                                    {stats.activeWOD.description?.toLowerCase().includes('amrap') && (
                                        <span className="flex items-center gap-1.5 px-2 py-0.5 bg-muted rounded-full"><Clock className="h-3 w-3 text-primary" /> AMRAP</span>
                                    )}
                                    <span className="flex items-center gap-1.5 px-2 py-0.5 bg-muted rounded-full"><Flame className="h-3 w-3 text-primary" /> {t('dashboard.intense')}</span>
                                </div>
                            </>
                        ) : (
                            <div className="h-20 flex items-center justify-center border border-dashed border-border rounded-xl mb-6">
                                <p className="text-xs text-muted-foreground">No programming found for today</p>
                            </div>
                        )}
                        <Button
                            variant="outline"
                            className="w-full mt-auto"
                            onClick={() => window.location.href = '/wods'}
                        >
                            {t('dashboard.view_details')}
                        </Button>
                    </CardContent>
                </Card>

                {/* Attendance card */}
                <Card className="relative group overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <div className="space-y-1">
                            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">{t('dashboard.box_status')}</CardTitle>
                            <CardDescription className="font-semibold text-lg text-foreground">{t('dashboard.attendance_retention')}</CardDescription>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                            <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold mb-2 text-foreground">{stats.attendance}%</div>
                        <p className="text-xs text-muted-foreground">{t('dashboard.attendance_avg')}</p>
                        <div className="mt-6 flex gap-1.5 h-1.5">
                            {[...ATTENDANCE_BAR_STATIC, stats.attendance / 100, stats.attendance / 100].map((v, i) => (
                                <div key={i} className="flex-1 rounded-full bg-muted overflow-hidden">
                                    <div className="h-full bg-emerald-500 transition-all duration-700" style={{ width: (v * 100) + '%' }} />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Recent benchmarks */}
                <Card className="lg:col-span-2 overflow-hidden">
                    <CardHeader className="border-b border-border pb-4">
                        <CardTitle className="text-lg font-semibold">{t('dashboard.recent_benchmarks')}</CardTitle>
                        <CardDescription className="text-xs text-muted-foreground">{t('dashboard.community_records')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-0 p-0">
                        {stats.recentResults?.map((res, i) => (
                            <div key={res.id || i} className="flex items-center justify-between group p-4 border-b border-border last:border-0 hover:bg-muted transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                                        <Trophy className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm text-foreground">{res.wods?.title || 'Unknown WOD'} <span className="text-primary ml-1">{res.result}</span></p>
                                        <p className="text-xs text-muted-foreground">
                                            {res.profiles?.first_name || ''} {res.profiles?.last_name || ''} · <span className="text-primary/70">{res.rx ? t('dashboard.rx') : 'Scaled'}</span>
                                        </p>
                                    </div>
                                </div>
                                <Badge variant="secondary" className="text-xs">{t('dashboard.new_pb')}</Badge>
                            </div>
                        ))}
                        {(!stats.recentResults || stats.recentResults.length === 0) && (
                            <div className="p-8 text-center text-sm text-muted-foreground">
                                No recent activity found
                            </div>
                        )}
                        <div className="p-3">
                            <Button variant="ghost" className="w-full text-xs text-muted-foreground hover:text-primary">
                                {t('dashboard.see_all_results')}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* System Pulse card */}
                <Card className="flex flex-col overflow-hidden">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-foreground">{t('dashboard.system_pulse')}</CardTitle>
                        <CardDescription className="text-xs text-muted-foreground">{t('dashboard.tasks_alerts')}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-3 pt-0">
                        <div className="flex gap-3 p-3 rounded-xl bg-muted/50 border border-border hover:border-primary/20 transition-colors">
                            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                <Zap className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-foreground">{t('dashboard.leads_waiting', { count: stats.pendingLeads, defaultValue: stats.pendingLeads + ' PENDING LEADS' })}</p>
                                <p className="text-xs text-muted-foreground">{t('dashboard.contact_prospects')}</p>
                            </div>
                        </div>
                        <div className="flex gap-3 p-3 rounded-xl bg-muted/50 border border-border hover:border-indigo-500/20 transition-colors">
                            <div className="h-9 w-9 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
                                <Calendar className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-foreground">{t('dashboard.next_wod')}</p>
                                <p className="text-xs text-muted-foreground">{t('dashboard.ensure_scaling')}</p>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="pt-0">
                        <Button variant="default" className="w-full">
                            {t('dashboard.management_hub')}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
};
