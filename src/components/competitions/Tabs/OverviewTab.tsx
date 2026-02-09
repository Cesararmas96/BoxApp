import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    Calendar,
    MapPin,
    Users,
    Trophy,
    ShieldCheck,
    Timer,
    ChevronRight,
    ArrowUpRight,
    UserCheck
} from 'lucide-react';
import { Competition } from '@/types/competitions';
import { useLanguage } from '@/hooks';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface OverviewTabProps {
    competition: Competition;
    onTabChange: (tab: string) => void;
}

interface StatItem {
    label: string;
    value: number;
    icon: any;
    color: string;
    bgColor: string;
    tab: string;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ competition, onTabChange }) => {
    const { t } = useLanguage();
    const [checkinStats, setCheckinStats] = useState({
        checkedIn: 0,
        waiverSigned: 0,
        total: 0
    });

    useEffect(() => {
        const fetchStats = async () => {
            const { data } = await supabase
                .from('competition_participants')
                .select('checked_in, waiver_signed')
                .eq('competition_id', competition.id);

            if (data) {
                setCheckinStats({
                    checkedIn: data.filter(p => p.checked_in).length,
                    waiverSigned: data.filter(p => p.waiver_signed).length,
                    total: data.length
                });
            }
        };

        fetchStats();
    }, [competition.id]);

    const getCount = (arr: any[] | undefined | null): number => {
        if (!arr) return 0;
        if (arr.length === 1 && 'count' in arr[0]) return arr[0].count;
        return arr.length;
    };

    const stats: StatItem[] = [
        {
            label: t('competitions.athletes'),
            value: getCount(competition.participants),
            icon: Users,
            color: 'text-blue-500',
            bgColor: 'bg-blue-500/10',
            tab: 'participants'
        },
        {
            label: t('competitions.events'),
            value: getCount(competition.events),
            icon: Trophy,
            color: 'text-amber-500',
            bgColor: 'bg-amber-500/10',
            tab: 'events'
        },
        {
            label: t('competitions.judges'),
            value: getCount(competition.judging_staff),
            icon: ShieldCheck,
            color: 'text-emerald-500',
            bgColor: 'bg-emerald-500/10',
            tab: 'judges'
        },
        {
            label: t('competitions.logistics_tab'),
            value: getCount(competition.heats),
            icon: Timer,
            color: 'text-purple-500',
            bgColor: 'bg-purple-500/10',
            tab: 'logistics'
        },
        {
            label: t('competitions.checkin_tab'),
            value: checkinStats.checkedIn,
            icon: UserCheck,
            color: 'text-rose-500',
            bgColor: 'bg-rose-500/10',
            tab: 'checkin'
        }
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Main Info Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 min-w-0">
                <Card className="md:col-span-2 bg-white/5 border-white/10 rounded-[2rem] overflow-hidden relative group min-w-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <CardContent className="p-8 relative z-10">
                        <div className="flex flex-col h-full justify-between gap-6">
                            <div>
                                <Badge className="bg-primary/20 text-primary border-primary/20 mb-4 px-3 py-1 uppercase tracking-widest text-[10px] font-black">
                                    {competition.status}
                                </Badge>
                                <h3 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter mb-4 truncate" title={competition.name}>
                                    {competition.name}
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-white/60">
                                        <Calendar className="h-4 w-4 text-primary" />
                                        <span className="text-sm font-medium">
                                            {competition.start_date ? new Date(competition.start_date).toLocaleDateString() : 'N/A'}
                                            {competition.end_date && ` - ${new Date(competition.end_date).toLocaleDateString()}`}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-white/60">
                                        <MapPin className="h-4 w-4 text-primary" />
                                        <span className="text-sm font-medium">{competition.location || 'No location set'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    onClick={() => onTabChange('settings')}
                                    variant="outline"
                                    className="rounded-xl border-white/10 hover:bg-white/10 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest"
                                >
                                    {t('competitions.edit_competition')}
                                </Button>
                                <Button
                                    onClick={() => onTabChange('leaderboard')}
                                    className="rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:scale-105 transition-transform text-[10px] font-black uppercase tracking-widest gap-2"
                                >
                                    {t('competitions.view_leaderboard')} <ArrowUpRight className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10 rounded-[2rem] overflow-hidden">
                    <CardContent className="p-8 flex flex-col items-center justify-center text-center h-full space-y-4">
                        <div className="h-20 w-20 rounded-3xl bg-primary/20 flex items-center justify-center mb-2">
                            <Trophy className="h-10 w-10 text-primary" />
                        </div>
                        <h4 className="font-black uppercase italic text-xl tracking-tight">{t('competitions.ready_action', { defaultValue: 'Ready for Action?' })}</h4>
                        <p className="text-sm text-white/40 leading-relaxed font-medium">
                            {t('competitions.comp_desc_short', { defaultValue: 'Monitor real-time results and manage all aspects of your competition from this dashboard.' })}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                    <button
                        key={index}
                        onClick={() => onTabChange(stat.tab)}
                        className="group relative bg-white/5 border border-white/10 rounded-[2rem] p-6 text-left transition-all hover:bg-white/10 hover:border-white/20 hover:scale-[1.02]"
                    >
                        <div className={`h-12 w-12 rounded-2xl ${stat.bgColor} flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                            <stat.icon className={`h-6 w-6 ${stat.color}`} />
                        </div>
                        <div className="flex items-center justify-between min-w-0 overflow-hidden">
                            <div className="min-w-0 truncate">
                                <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1 truncate">{stat.label}</p>
                                <p className="text-xl md:text-2xl font-black italic uppercase tracking-tighter truncate">{stat.value}</p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-white/20 group-hover:text-primary transition-colors flex-shrink-0" />
                        </div>
                    </button>
                ))}
            </div>

            {/* Recent Activity or Quick Links Placeholder */}
            <div className="bg-primary/5 rounded-[2rem] p-8 border border-primary/10">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60 mb-6 flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                    {t('competitions.checklist', { defaultValue: 'Competition Checklist' })}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                        { text: t('competitions.step_divisions', { defaultValue: 'Set up Divisions & Categories' }), done: (competition.divisions_count || 0) > 0 },
                        { text: t('competitions.step_events', { defaultValue: 'Configure Events & Scoring' }), done: getCount(competition.events) > 0 },
                        { text: t('competitions.step_athletes', { defaultValue: 'Register Athletes or Teams' }), done: getCount(competition.participants) > 0 },
                        { text: t('competitions.step_heats', { defaultValue: 'Generate Heats & Schedule' }), done: getCount(competition.heats) > 0 },
                    ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                            <div className={`h-5 w-5 rounded-full flex items-center justify-center ${item.done ? 'bg-emerald-500/20 text-emerald-500' : 'bg-white/10 text-white/20'}`}>
                                <ShieldCheck className="h-3 w-3" />
                            </div>
                            <span className={`text-xs font-bold uppercase tracking-wider ${item.done ? 'text-white/80' : 'text-white/40'}`}>
                                {item.text}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
