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
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-black italic tracking-tighter uppercase text-primary">{t('dashboard.athlete_hub')}</h1>
                    <p className="text-muted-foreground">{t('dashboard.welcome_back', { name: userProfile.full_name || t('dashboard.athlete_generic') })}</p>
                </div>
                <AthleteDashboard />
            </div>
        );
    }

    if (userProfile?.role_id === 'coach') {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-black italic tracking-tighter uppercase text-primary">{t('dashboard.coach_command')}</h1>
                    <p className="text-muted-foreground">{t('dashboard.coach_status')}</p>
                </div>
                <CoachDashboard />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-black italic tracking-tighter uppercase text-primary">{t('dashboard.command_center')}</h1>
                <p className="text-muted-foreground flex items-center gap-2">
                    <Activity className="h-4 w-4 text-emerald-500" /> {t('dashboard.system_live')}
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="bg-zinc-950 border-primary/20 text-white overflow-hidden shadow-2xl relative">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Users className="h-24 w-24" />
                    </div>
                    <CardHeader>
                        <CardTitle className="text-sm font-black uppercase tracking-widest text-primary italic">{t('dashboard.community')}</CardTitle>
                        <CardDescription className="text-zinc-400">{t('dashboard.registered_athletes')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-5xl font-black italic tracking-tighter mb-4">{stats.members}</div>
                        <Progress value={78} className="h-1 bg-zinc-800" />
                        <p className="mt-2 text-xs text-zinc-500">{t('dashboard.growth_cycle')}</p>
                    </CardContent>
                </Card>

                <Card className="border shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <div className="space-y-1">
                            <CardTitle className="text-sm font-black uppercase tracking-widest italic">{t('dashboard.daily_wod')}</CardTitle>
                            <CardDescription>{t('dashboard.main_programming')}</CardDescription>
                        </div>
                        <Badge variant="outline" className="bg-primary/10 text-primary border-none text-[10px]">{t('dashboard.live_now')}</Badge>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="text-xl font-black italic uppercase mb-2 tracking-tight">The Chief</div>
                        <div className="flex gap-4 text-xs font-mono text-muted-foreground mb-4">
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {t('dashboard.amrap', { minutes: 15 })}</span>
                            <span className="flex items-center gap-1"><Flame className="h-3 w-3" /> {t('dashboard.intense')}</span>
                        </div>
                        <Button variant="outline" className="w-full text-xs font-bold uppercase tracking-wider h-8">{t('dashboard.view_details')}</Button>
                    </CardContent>
                </Card>

                <Card className="border shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <div className="space-y-1">
                            <CardTitle className="text-sm font-black uppercase tracking-widest italic">{t('dashboard.box_status')}</CardTitle>
                            <CardDescription>{t('dashboard.attendance_retention')}</CardDescription>
                        </div>
                        <TrendingUp className="h-5 w-5 text-emerald-500" />
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="text-3xl font-black italic mb-2">92%</div>
                        <p className="text-xs text-muted-foreground leading-snug">{t('dashboard.attendance_avg')}</p>
                        <div className="mt-4 flex gap-1">
                            {[1, 1, 1, 1, 0, 1, 1].map((v, i) => (
                                <div key={i} className={`h-1 flex-1 rounded-full ${v ? 'bg-emerald-500' : 'bg-muted'}`} />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-lg font-black uppercase italic tracking-tight">{t('dashboard.recent_benchmarks')}</CardTitle>
                        <CardDescription>{t('dashboard.community_records')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-black italic group-hover:bg-primary/10 transition-colors">
                                        <Trophy className="h-5 w-5 group-hover:text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm">Fran (2:45)</p>
                                        <p className="text-xs text-muted-foreground">{t('dashboard.athlete_generic')} John Doe • {t('dashboard.rx')}</p>
                                    </div>
                                </div>
                                <Badge variant="secondary" className="text-[10px]">{t('dashboard.new_pb')}</Badge>
                            </div>
                        ))}
                        <Button variant="ghost" className="w-full text-xs text-muted-foreground hover:text-foreground">{t('dashboard.see_all_results')}</Button>
                    </CardContent>
                </Card>

                <Card className="flex flex-col bg-zinc-900 border-zinc-800 text-white shadow-2xl">
                    <CardHeader>
                        <CardTitle className="text-lg font-black uppercase italic tracking-tight text-primary">{t('dashboard.system_pulse')}</CardTitle>
                        <CardDescription className="text-zinc-500">{t('dashboard.tasks_alerts')}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-4">
                        <div className="flex gap-4 p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                            <Zap className="h-5 w-5 text-primary mt-1" />
                            <div className="space-y-1">
                                <p className="text-sm font-bold tracking-tight">{t('dashboard.leads_waiting', { count: 3 })}</p>
                                <p className="text-xs text-zinc-500">{t('dashboard.contact_prospects')}</p>
                            </div>
                        </div>
                        <div className="flex gap-4 p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                            <Calendar className="h-5 w-5 text-indigo-400 mt-1" />
                            <div className="space-y-1">
                                <p className="text-sm font-bold tracking-tight">{t('dashboard.next_wod')}</p>
                                <p className="text-xs text-zinc-500">{t('dashboard.ensure_scaling')}</p>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="pt-0 pb-6 px-6">
                        <Button className="w-full bg-zinc-100 text-zinc-950 font-black uppercase italic tracking-widest hover:bg-zinc-200">
                            {t('dashboard.management_hub')}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
};
