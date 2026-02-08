import React, { useEffect, useState } from 'react';
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
    const { userProfile } = useAuth();
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

            // 1. Members Count
            const { count: membersCount } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true });

            // 2. Pending Leads Count
            const { count: leadsCount } = await supabase
                .from('leads')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'new');

            // 3. Today's WOD (CrossFit track preferred)
            const { data: wodData } = await supabase
                .from('wods')
                .select('*')
                .eq('date', today)
                .order('track', { ascending: true })
                .limit(1);

            // 4. Attendance (Simple avg from last 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const { data: bookingsData } = await supabase
                .from('bookings')
                .select('status')
                .gt('created_at', thirtyDaysAgo.toISOString());

            const totalBookings = bookingsData?.length || 0;
            const attendedBookings = bookingsData?.filter(b => b.status === 'attended').length || 0;
            const attendanceRate = totalBookings > 0 ? Math.round((attendedBookings / totalBookings) * 100) : 0;

            // 5. Recent Results
            const { data: resultsData } = await supabase
                .from('results')
                .select('id, result, rx, wods!wod_id(title), profiles!athlete_id(first_name, last_name)')
                .order('created_at', { ascending: false })
                .limit(3);

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
                    <h1 className="text-5xl font-black italic tracking-tighter uppercase text-primary text-glow leading-none">{t('dashboard.athlete_hub')}</h1>
                    <p className="text-muted-foreground font-medium uppercase text-[10px] tracking-[0.3em] opacity-60">{t('dashboard.welcome_back', { name: `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() || t('dashboard.athlete_generic') })}</p>
                </div>
                <AthleteDashboard />
            </div>
        );
    }

    if (userProfile?.role_id === 'coach') {
        return (
            <div className="space-y-8 animate-premium-in">
                <div className="flex flex-col gap-1">
                    <h1 className="text-5xl font-black italic tracking-tighter uppercase text-primary text-glow leading-none">{t('dashboard.coach_command')}</h1>
                    <p className="text-muted-foreground font-medium uppercase text-[10px] tracking-[0.3em] opacity-60">{t('dashboard.coach_status')}</p>
                </div>
                <CoachDashboard />
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-premium-in">
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 mb-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500">{t('dashboard.system_live')}</span>
                </div>
                <h1 className="text-5xl lg:text-6xl font-black italic tracking-tighter uppercase text-primary text-glow leading-none">{t('dashboard.command_center')}</h1>
                <p className="text-muted-foreground font-medium uppercase text-[10px] tracking-[0.3em] opacity-60 mt-2">Operational Analytics & Global Oversight</p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                <Card className="bg-zinc-950 border-white/5 text-white overflow-hidden relative group shadow-2xl">
                    <div className="absolute top-[-20%] right-[-10%] w-[70%] h-[70%] bg-primary/20 blur-[100px] rounded-full group-hover:bg-primary/30 transition-all duration-1000" />
                    <div className="absolute top-6 right-6 text-primary opacity-20 transition-all duration-700 group-hover:opacity-40 group-hover:scale-125 group-hover:rotate-12">
                        <Users className="h-20 w-20" />
                    </div>
                    <CardHeader className="relative z-10 pt-8 px-8">
                        <CardTitle className="text-[11px] font-black uppercase tracking-[0.4em] text-zinc-500 italic mb-3">{t('dashboard.community')}</CardTitle>
                        <CardDescription className="text-zinc-200 font-bold italic text-xl uppercase tracking-tight leading-none">{t('dashboard.registered_athletes')}</CardDescription>
                    </CardHeader>
                    <CardContent className="relative z-10 px-8 pb-8">
                        <div className="text-7xl font-black italic tracking-tighter mb-6 text-white group-hover:text-primary transition-colors duration-700">{stats.members}</div>
                        <Progress value={78} className="h-1.5 bg-zinc-900 overflow-hidden rounded-full" />
                        <p className="mt-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">{t('dashboard.growth_cycle')}</p>
                    </CardContent>
                </Card>

                <Card className="glass flex flex-col group overflow-hidden border-white/10">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 pt-8 px-8 relative z-10">
                        <div className="space-y-1">
                            <CardTitle className="text-[11px] font-black uppercase tracking-[0.4em] text-primary italic">{t('dashboard.daily_wod')}</CardTitle>
                            <CardDescription className="font-extrabold text-2xl uppercase tracking-tight leading-none text-foreground">{t('dashboard.main_programming')}</CardDescription>
                        </div>
                        <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30 text-[10px] font-black animate-pulse px-3 py-1 rounded-full">{t('dashboard.live_now')}</Badge>
                    </CardHeader>
                    <CardContent className="pt-8 px-8 flex-1 flex flex-col relative z-10">
                        {stats.activeWOD ? (
                            <>
                                <div className="text-3xl font-black italic uppercase mb-2 tracking-tight text-glow group-hover:translate-x-1 transition-transform duration-500 italic">{stats.activeWOD.title}</div>
                                <div className="flex flex-wrap gap-2 text-[11px] font-black text-muted-foreground/80 mb-8 uppercase tracking-[0.15em]">
                                    <span className="flex items-center gap-2 px-3 py-1 bg-primary/5 rounded-full"><Badge variant="outline" className="border-primary/20 text-primary px-2">{stats.activeWOD.track}</Badge></span>
                                    {stats.activeWOD.description?.toLowerCase().includes('amrap') && (
                                        <span className="flex items-center gap-2 px-3 py-1 bg-primary/5 rounded-full"><Clock className="h-3.5 w-3.5 text-primary" /> AMRAP</span>
                                    )}
                                    <span className="flex items-center gap-2 px-3 py-1 bg-primary/5 rounded-full"><Flame className="h-3.5 w-3.5 text-primary" /> {t('dashboard.intense')}</span>
                                </div>
                            </>
                        ) : (
                            <div className="h-24 flex items-center justify-center border border-dashed border-white/5 rounded-2xl mb-8">
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-40 italic">No programming found for today</p>
                            </div>
                        )}
                        <Button
                            variant="outline"
                            className="w-full mt-auto rounded-2xl hover:bg-primary/10 border-primary/10 transition-all font-black tracking-widest text-[10px] h-12"
                            onClick={() => window.location.href = '/wods'}
                        >
                            {t('dashboard.view_details')}
                        </Button>
                    </CardContent>
                </Card>

                <Card className="glass relative group overflow-hidden border-white/10">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 pt-8 px-8 relative z-10">
                        <div className="space-y-1">
                            <CardTitle className="text-[11px] font-black uppercase tracking-[0.4em] text-emerald-500 italic">{t('dashboard.box_status')}</CardTitle>
                            <CardDescription className="font-extrabold text-2xl uppercase tracking-tight leading-none text-foreground">{t('dashboard.attendance_retention')}</CardDescription>
                        </div>
                        <div className="h-10 w-10 glass rounded-full flex items-center justify-center border-emerald-500/20 group-hover:rotate-12 transition-transform duration-500">
                            <TrendingUp className="h-5 w-5 text-emerald-500" />
                        </div>
                    </CardHeader>
                    <CardContent className="pt-8 px-8 relative z-10">
                        <div className="text-5xl font-black italic mb-3 group-hover:text-glow group-hover:text-emerald-500 transition-all duration-700">{stats.attendance}%</div>
                        <p className="text-[12px] font-bold text-muted-foreground/80 leading-snug uppercase tracking-[0.1em]">{t('dashboard.attendance_avg')}</p>
                        <div className="mt-8 flex gap-2 h-2">
                            {[0.8, 0.9, 0.7, 0.85, 0.92, stats.attendance / 100, stats.attendance / 100].map((v, i) => (
                                <div key={i} className="flex-1 rounded-full bg-black/5 dark:bg-white/5 overflow-hidden">
                                    <div className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-1000 delay-300 transform origin-left group-hover:scale-x-110" style={{ width: (v * 100) + '%' }} />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="lg:col-span-2 glass overflow-hidden">
                    <CardHeader className="border-b border-primary/5 pb-4">
                        <CardTitle className="text-xl font-black uppercase italic tracking-tighter text-glow">{t('dashboard.recent_benchmarks')}</CardTitle>
                        <CardDescription className="text-[10px] font-black uppercase tracking-[0.2em]">{t('dashboard.community_records')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-0 p-0">
                        {stats.recentResults?.map((res, i) => (
                            <div key={res.id || i} className="flex items-center justify-between group p-6 border-b border-primary/5 last:border-0 hover:bg-primary/[0.02] transition-colors">
                                <div className="flex items-center gap-5">
                                    <div className="h-12 w-12 rounded-2xl glass flex items-center justify-center font-black italic group-hover:border-primary/40 transition-all">
                                        <Trophy className="h-5 w-5 group-hover:text-primary transition-colors" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-black text-base uppercase tracking-tight">{res.wods?.title || 'Unknown WOD'} <span className="text-primary italic ml-2">{res.result}</span></p>
                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">
                                            {res.profiles?.first_name || ''} {res.profiles?.last_name || ''} • <span className="text-primary/70">{res.rx ? t('dashboard.rx') : 'Scaled'}</span>
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-[8px] font-black tracking-widest px-2">{t('dashboard.new_pb')}</Badge>
                                </div>
                            </div>
                        ))}
                        {(!stats.recentResults || stats.recentResults.length === 0) && (
                            <div className="p-8 text-center opacity-40 text-[10px] font-black uppercase tracking-widest italic">
                                No recent activity found
                            </div>
                        )}
                        <div className="p-4">
                            <Button variant="ghost" className="w-full text-[10px] font-black tracking-[0.3em] uppercase text-muted-foreground/60 hover:text-primary transition-all">
                                {t('dashboard.see_all_results')}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="flex flex-col bg-zinc-950 border-white/5 shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50" />
                    <CardHeader className="relative z-10">
                        <CardTitle className="text-2xl font-black uppercase italic tracking-tighter text-primary text-glow leading-none">{t('dashboard.system_pulse')}</CardTitle>
                        <CardDescription className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 mt-2">{t('dashboard.tasks_alerts')}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-4 relative z-10 pt-4">
                        <div className="flex gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-primary/20 transition-all group/item">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover/item:scale-110 transition-transform">
                                <Zap className="h-5 w-5 text-primary" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-black uppercase tracking-tight text-white">{t('dashboard.leads_waiting', { count: stats.pendingLeads, defaultValue: stats.pendingLeads + ' PENDING LEADS' })}</p>
                                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-relaxed">{t('dashboard.contact_prospects')}</p>
                            </div>
                        </div>
                        <div className="flex gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-indigo-500/20 transition-all group/item">
                            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0 group-hover/item:scale-110 transition-transform">
                                <Calendar className="h-5 w-5 text-indigo-400" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-black uppercase tracking-tight text-white">{t('dashboard.next_wod')}</p>
                                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-relaxed">{t('dashboard.ensure_scaling')}</p>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="pt-0 pb-8 px-8 relative z-10">
                        <Button variant="premium" className="w-full h-14">
                            {t('dashboard.management_hub')}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
};
