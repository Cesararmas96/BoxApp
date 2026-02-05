import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    Activity,
    Users,
    Trophy,
    TrendingUp,
    Zap,
    Clock,
    Flame,
    Calendar
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
import { useTranslation } from 'react-i18next';

interface DashboardProps {
    userProfile?: any;
}

export const Dashboard: React.FC<DashboardProps> = ({ userProfile }) => {
    const { t } = useTranslation();
    const [stats, setStats] = useState({
        members: 0,
        activeWOD: 'Murph Challenge',
        attendance: 85
    });

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        const { count } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });

        setStats(prev => ({ ...prev, members: count || 0 }));
    };

    // Role-based rendering
    if (userProfile?.role_id === 'athlete') {
        return (
            <div className="space-y-8 animate-premium-in">
                <div className="flex flex-col gap-1">
                    <h1 className="text-5xl font-black italic tracking-tighter uppercase text-primary text-glow leading-none">{t('dashboard.athlete_hub')}</h1>
                    <p className="text-muted-foreground font-medium uppercase text-[10px] tracking-[0.3em] opacity-60">{t('dashboard.welcome_back', { name: userProfile.full_name || t('dashboard.athlete_generic') })}</p>
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

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="bg-zinc-950 border-white/5 text-white overflow-hidden relative group">
                    <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-primary/10 blur-[80px] rounded-full group-hover:bg-primary/20 transition-all duration-700" />
                    <div className="absolute top-4 right-4 text-primary opacity-20 transition-all duration-500 group-hover:opacity-40 group-hover:scale-110">
                        <Users className="h-16 w-16" />
                    </div>
                    <CardHeader className="relative z-10">
                        <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 italic mb-2">{t('dashboard.community')}</CardTitle>
                        <CardDescription className="text-zinc-400 font-bold italic text-base uppercase tracking-tight">{t('dashboard.registered_athletes')}</CardDescription>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <div className="text-6xl font-black italic tracking-tighter mb-4 text-white group-hover:text-primary transition-colors duration-500">{stats.members}</div>
                        <Progress value={78} className="h-1 bg-zinc-900 overflow-hidden" />
                        <p className="mt-4 text-[9px] font-black uppercase tracking-widest text-zinc-600">{t('dashboard.growth_cycle')}</p>
                    </CardContent>
                </Card>

                <Card className="glass flex flex-col group">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <div className="space-y-1">
                            <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-primary italic">{t('dashboard.daily_wod')}</CardTitle>
                            <CardDescription className="font-bold text-lg uppercase tracking-tight">{t('dashboard.main_programming')}</CardDescription>
                        </div>
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[9px] font-black animate-pulse px-2 py-0.5">{t('dashboard.live_now')}</Badge>
                    </CardHeader>
                    <CardContent className="pt-6 flex-1 flex flex-col">
                        <div className="text-2xl font-black italic uppercase mb-1 tracking-tight text-glow group-hover:scale-[1.02] transition-transform">The Chief</div>
                        <div className="flex gap-4 text-[10px] font-black text-muted-foreground mb-6 uppercase tracking-widest">
                            <span className="flex items-center gap-1.5 opacity-70"><Clock className="h-3 w-3 text-primary" /> {t('dashboard.amrap', { minutes: 15 })}</span>
                            <span className="flex items-center gap-1.5 opacity-70"><Flame className="h-3 w-3 text-primary" /> {t('dashboard.intense')}</span>
                        </div>
                        <Button variant="outline" className="w-full mt-auto rounded-xl border-white/5 hover:border-primary/20 hover:bg-primary/5">{t('dashboard.view_details')}</Button>
                    </CardContent>
                </Card>

                <Card className="glass relative group overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10">
                        <div className="space-y-1">
                            <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500 italic">{t('dashboard.box_status')}</CardTitle>
                            <CardDescription className="font-bold text-lg uppercase tracking-tight">{t('dashboard.attendance_retention')}</CardDescription>
                        </div>
                        <TrendingUp className="h-5 w-5 text-emerald-500 group-hover:translate-y-[-2px] group-hover:translate-x-[2px] transition-transform" />
                    </CardHeader>
                    <CardContent className="pt-6 relative z-10">
                        <div className="text-4xl font-black italic mb-2 group-hover:text-glow group-hover:text-emerald-500 transition-all">92%</div>
                        <p className="text-[11px] font-medium text-muted-foreground leading-snug uppercase tracking-wider">{t('dashboard.attendance_avg')}</p>
                        <div className="mt-6 flex gap-1.5 h-1.5">
                            {[1, 1, 1, 1, 0.4, 1, 0.8].map((v, i) => (
                                <div key={i} className="flex-1 rounded-full bg-muted-foreground/10 overflow-hidden">
                                    <div className="h-full bg-emerald-500 transition-all duration-1000 delay-300" style={{ width: `${v * 100}%` }} />
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
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center justify-between group p-6 border-b border-primary/5 last:border-0 hover:bg-primary/[0.02] transition-colors">
                                <div className="flex items-center gap-5">
                                    <div className="h-12 w-12 rounded-2xl glass flex items-center justify-center font-black italic group-hover:border-primary/40 transition-all group-hover:scale-110">
                                        <Trophy className="h-5 w-5 group-hover:text-primary transition-colors" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-black text-base uppercase tracking-tight">Fran <span className="text-primary italic ml-2">2:45</span></p>
                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">
                                            {t('dashboard.athlete_generic')} John Doe • <span className="text-primary/70">{t('dashboard.rx')}</span>
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-[8px] font-black tracking-widest px-2">{t('dashboard.new_pb')}</Badge>
                                </div>
                            </div>
                        ))}
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
                                <p className="text-sm font-black uppercase tracking-tight text-white">{t('dashboard.leads_waiting', { count: 3 })}</p>
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
