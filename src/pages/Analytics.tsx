import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import {
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight,
    AlertTriangle,
    DollarSign,
    HeartPulse,
    Trophy,
    Receipt,
    Bell
} from 'lucide-react';
import { useLanguage, useNotification } from '@/hooks';
import { Toast } from '@/components/ui/toast-custom';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface PerformanceCardProps {
    title: string;
    value: string | number;
    label: string;
    trend: 'up' | 'down';
    icon: React.ElementType;
    color: string;
}

const PerformanceCard: React.FC<PerformanceCardProps> = ({ title, value, label, trend, icon: Icon, color }) => {
    const { t } = useLanguage();
    return (
        <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{title}</CardTitle>
                <div className={`p-2 rounded-lg bg-${color}/10`}>
                    <Icon className={`h-4 w-4 text-${color}`} />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <div className="flex items-center mt-1">
                    {trend === 'up' ? (
                        <ArrowUpRight className="h-3 w-3 text-emerald-500 mr-1" />
                    ) : (
                        <ArrowDownRight className="h-3 w-3 text-rose-500 mr-1" />
                    )}
                    <p className="text-xs font-medium text-muted-foreground">
                        <span className={trend === 'up' ? 'text-emerald-500' : 'text-rose-500'}>{label}</span> {t('analytics.vs_last_month')}
                    </p>
                </div>
            </CardContent>
            <div className={`h-1 w-full bg-${color}/20`} />
        </Card>
    );
};

export const Analytics: React.FC = () => {
    const { t } = useLanguage();
    const { currentBox } = useAuth();
    const [stats, setStats] = useState({
        totalMembers: 0,
        activeLeads: 0,
        completedWods: 124,
        attendanceRate: '85%',
        ltv: 0,
        avgTicket: 0,
        churnRiskCount: 0
    });

    const [atRiskAthletes, setAtRiskAthletes] = useState<any[]>([]);
    const [unpaidAthletes, setUnpaidAthletes] = useState<any[]>([]);
    const { notification, showNotification, hideNotification } = useNotification();

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        const [members, leads, invoices, bookings] = await Promise.all([
            supabase.from('profiles').select('*').eq('box_id', currentBox?.id || ''),
            supabase.from('leads').select('*', { count: 'exact', head: true }).eq('box_id', currentBox?.id || ''),
            supabase.from('invoices').select('*, profiles(*)').eq('box_id', currentBox?.id || ''),
            supabase.from('bookings').select('user_id, created_at').eq('box_id', currentBox?.id || '')
        ]);

        const totalRevenue = invoices.data?.reduce((acc, inv) => acc + Number(inv.amount), 0) || 0;
        const totalUsers = members.data?.length || 1;

        // Churn Risk Detection (No attendance in 10 days)
        const tenDaysAgo = new Date();
        tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

        const activeIds = new Set(
            (bookings.data as any[])?.filter(b => b.created_at && new Date(b.created_at) > tenDaysAgo).map(b => b.user_id)
        );

        const riskAthletes = members.data?.filter(m => m.role_id === 'athlete' && !activeIds.has(m.id)) || [];
        setAtRiskAthletes(riskAthletes);

        // Payment Risk Detection — single pass with Map to avoid multiple iterations
        const unpaidByUser = new Map<string, { totalDebt: number; invoiceCount: number; profile: any }>();
        for (const inv of invoices.data || []) {
            if (inv.status !== 'unpaid' && inv.status !== 'overdue') continue;
            if (!inv.user_id) continue;
            const profile = Array.isArray(inv.profiles) ? inv.profiles[0] : inv.profiles;
            const existing = unpaidByUser.get(inv.user_id as string);
            if (existing) {
                existing.totalDebt += inv.amount || 0;
                existing.invoiceCount += 1;
            } else {
                unpaidByUser.set(inv.user_id as string, { totalDebt: inv.amount || 0, invoiceCount: 1, profile });
            }
        }
        const uniqueUnpaidUsers = Array.from(unpaidByUser.values())
            .filter(({ profile }) => profile?.id)
            .map(({ totalDebt, invoiceCount, profile }) => ({ ...profile, totalDebt, invoiceCount }));

        setUnpaidAthletes(uniqueUnpaidUsers);

        setStats({
            totalMembers: totalUsers,
            activeLeads: leads.count || 0,
            completedWods: 124,
            attendanceRate: '85%',
            ltv: totalRevenue / totalUsers,
            avgTicket: totalRevenue / (invoices.data?.length || 1),
            churnRiskCount: riskAthletes.length
        });
    };

    const handleAlertCoach = async (athlete: any, type: 'inactivity' | 'payment') => {
        // Verify session before invoking
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            console.error('Cant trigger coach alert: No active session');
            showNotification('error', 'Failed to send alert: No active session.');
            return;
        }

        supabase.functions.invoke('coach-alerts', {
            body: {
                athlete_id: athlete.id,
                athlete_name: `${athlete.first_name} ${athlete.last_name}`,
                alert_type: type,
                box_id: currentBox?.id
            }
        }).catch(err => console.error('Failed to trigger coach alert:', err));

        showNotification('success', 'COACH ALERTED SUCCESSFULLY');
    };

    return (
        <div className="space-y-4 md:space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{t('analytics.title')}</h1>
                <p className="text-muted-foreground text-xs sm:text-sm">{t('analytics.subtitle')}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <PerformanceCard
                    title={t('analytics.ltv')}
                    value={`$${stats.ltv.toFixed(2)}`}
                    label="+8%"
                    trend="up"
                    icon={DollarSign}
                    color="emerald-600"
                />
                <PerformanceCard
                    title={t('analytics.avg_ticket')}
                    value={`$${stats.avgTicket.toFixed(2)}`}
                    label="+4.1%"
                    trend="up"
                    icon={TrendingUp}
                    color="indigo-600"
                />
                <PerformanceCard
                    title={t('analytics.churn_risk')}
                    value={stats.churnRiskCount}
                    label="-10%"
                    trend="down"
                    icon={AlertTriangle}
                    color="rose-600"
                />
                <PerformanceCard
                    title={t('analytics.community_pulse')}
                    value={t('analytics.stable')}
                    label="+0.4%"
                    trend="up"
                    icon={HeartPulse}
                    color="orange-600"
                />
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <Card className="lg:col-span-4">
                    <CardHeader>
                        <CardTitle>{t('analytics.attendance')}</CardTitle>
                        <CardDescription>{t('analytics.attendance_desc')}</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-center justify-center border-t border-dashed bg-muted/20 m-6 rounded-lg">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <TrendingUp className="h-12 w-12 opacity-20" />
                            <p className="text-sm italic">{t('analytics.growth_preview')}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-yellow-500" /> {t('analytics.competitions')}
                        </CardTitle>
                        <CardDescription>{t('analytics.competitions_desc')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="rounded-lg border bg-primary/5 p-4 border-primary/20">
                            <p className="text-xs font-black uppercase tracking-widest text-primary mb-1">{t('analytics.upcoming')}</p>
                            <h4 className="font-bold text-sm">Winter Open 2026</h4>
                            <p className="text-[10px] text-muted-foreground">
                                {t('analytics.starts_in', { count: 12 })} • {t('analytics.athletes_registered', { count: 45 })}
                            </p>
                            <Button size="sm" variant="ghost" className="w-full mt-2 h-7 text-[10px] uppercase font-bold">{t('analytics.register_athletes')}</Button>
                        </div>
                        <p className="text-[10px] text-center text-muted-foreground italic">
                            {t('analytics.create_rankings')}
                        </p>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-4">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-rose-600 flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5" /> {t('analytics.inactivity_alert')}
                            </CardTitle>
                            <CardDescription>{t('analytics.inactivity_desc')}</CardDescription>
                        </div>
                        <Badge variant="destructive">{t('analytics.at_risk', { count: atRiskAthletes.length })}</Badge>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="divide-y divide-border">
                            {atRiskAthletes.length === 0 ? (
                                <p className="py-8 text-center text-muted-foreground italic text-sm">{t('analytics.no_inactivity')}</p>
                            ) : (
                                atRiskAthletes.slice(0, 3).map((athlete) => (
                                    <div key={athlete.id} className="py-3 flex items-center justify-between group">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-xs font-bold uppercase transition-all group-hover:bg-rose-600 group-hover:text-white">
                                                {athlete.first_name?.[0]}{athlete.last_name?.[0]}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold leading-none">{athlete.first_name} {athlete.last_name}</p>
                                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                                                    {t('analytics.days_inactive', { count: 12 })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                className="h-8 text-[10px] font-black uppercase bg-rose-600 hover:bg-rose-700"
                                                onClick={() => handleAlertCoach(athlete, 'inactivity')}
                                            >
                                                {t('analytics.alert_coach')}
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-3">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-orange-600 flex items-center gap-2">
                                <Receipt className="h-5 w-5" /> {t('analytics.payment_risk')}
                            </CardTitle>
                            <CardDescription>{t('analytics.payment_desc')}</CardDescription>
                        </div>
                        <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">
                            {t('analytics.pending', { count: unpaidAthletes.length })}
                        </Badge>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="divide-y divide-border">
                            {unpaidAthletes.length === 0 ? (
                                <p className="py-8 text-center text-muted-foreground italic text-sm">{t('analytics.no_payment_risk')}</p>
                            ) : (
                                unpaidAthletes.slice(0, 3).map((athlete) => (
                                    <div key={athlete.id} className="py-3 flex items-center justify-between group">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-xs font-bold uppercase transition-all group-hover:bg-orange-600 group-hover:text-white">
                                                {athlete.first_name?.[0]}{athlete.last_name?.[0]}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold leading-none">{athlete.first_name} {athlete.last_name}</p>
                                                <p className="text-[10px] text-orange-600 font-bold uppercase tracking-tighter">
                                                    {t('analytics.debt_label', { amount: athlete.totalDebt.toFixed(2) })}
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-8 w-8 p-0 rounded-full hover:bg-orange-600 hover:text-white transition-colors"
                                            onClick={() => handleAlertCoach(athlete, 'payment')}
                                        >
                                            <Bell className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>
                        {unpaidAthletes.length > 3 && (
                            <Button variant="ghost" className="w-full text-[10px] uppercase font-bold tracking-[0.2em]">
                                {t('analytics.view_all', { count: unpaidAthletes.length })}
                            </Button>
                        )}
                    </CardContent>
                </Card>
            </div>

            {notification && (
                <Toast
                    type={notification.type}
                    message={notification.message}
                    onClose={hideNotification}
                />
            )}
        </div>
    );
};
