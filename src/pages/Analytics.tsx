import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight,
    AlertTriangle,
    DollarSign,
    HeartPulse,
    Trophy
} from 'lucide-react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export const Analytics: React.FC = () => {
    const [stats, setStats] = useState({
        totalMembers: 0,
        activeLeads: 0,
        completedWods: 124,
        attendanceRate: '85%',
        ltv: 0,
        avgTicket: 0,
        churnRiskCount: 0
    });

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        const [members, leads, invoices, bookings] = await Promise.all([
            supabase.from('profiles').select('*', { count: 'exact', head: true }),
            supabase.from('leads').select('*', { count: 'exact', head: true }),
            supabase.from('invoices').select('amount'),
            supabase.from('bookings').select('athlete_id, created_at')
        ]);

        const totalRevenue = invoices.data?.reduce((acc, inv) => acc + Number(inv.amount), 0) || 0;
        const totalUsers = members.count || 1;

        // Churn Risk: No activity in last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const activeAthletes = new Set(
            bookings.data?.filter(b => new Date(b.created_at) > sevenDaysAgo).map(b => b.athlete_id)
        );
        const churnRiskCount = totalUsers - activeAthletes.size;

        setStats({
            totalMembers: totalUsers,
            activeLeads: leads.count || 0,
            completedWods: 124,
            attendanceRate: '85%',
            ltv: totalRevenue / totalUsers,
            avgTicket: totalRevenue / (invoices.data?.length || 1),
            churnRiskCount
        });
    };

    const PerformanceCard = ({ title, value, label, trend, icon: Icon, color }: any) => (
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
                        <span className={trend === 'up' ? 'text-emerald-500' : 'text-rose-500'}>{label}</span> vs last month
                    </p>
                </div>
            </CardContent>
            <div className={`h-1 w-full bg-${color}/20`} />
        </Card>
    );

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
                <p className="text-muted-foreground text-sm">Real-time performance metrics for your community.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <PerformanceCard
                    title="Average LTV"
                    value={`$${stats.ltv.toFixed(2)}`}
                    label="+8%"
                    trend="up"
                    icon={DollarSign}
                    color="emerald-600"
                />
                <PerformanceCard
                    title="Average Ticket"
                    value={`$${stats.avgTicket.toFixed(2)}`}
                    label="+4.1%"
                    trend="up"
                    icon={TrendingUp}
                    color="indigo-600"
                />
                <PerformanceCard
                    title="Churn Risk"
                    value={stats.churnRiskCount}
                    label="-10%"
                    trend="down"
                    icon={AlertTriangle}
                    color="rose-600"
                />
                <PerformanceCard
                    title="Community Pulse"
                    value="Stable"
                    label="+0.4%"
                    trend="up"
                    icon={HeartPulse}
                    color="orange-600"
                />
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <Card className="lg:col-span-4">
                    <CardHeader>
                        <CardTitle>Attendance Overview</CardTitle>
                        <CardDescription>Daily logins and results posted across all hours.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-center justify-center border-t border-dashed bg-muted/20 m-6 rounded-lg">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <TrendingUp className="h-12 w-12 opacity-20" />
                            <p className="text-sm italic">Growth Chart Preview</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-yellow-500" /> Internal Competitions
                        </CardTitle>
                        <CardDescription>Upcoming and active box events.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="rounded-lg border bg-primary/5 p-4 border-primary/20">
                            <p className="text-xs font-black uppercase tracking-widest text-primary mb-1">Upcoming</p>
                            <h4 className="font-bold text-sm">Winter Open 2026</h4>
                            <p className="text-[10px] text-muted-foreground">Starts in 12 days • 45 athletes registered</p>
                            <Button size="sm" variant="ghost" className="w-full mt-2 h-7 text-[10px] uppercase font-bold">Register Athletes</Button>
                        </div>
                        <p className="text-[10px] text-center text-muted-foreground italic">
                            Create new internal rankings and customized WOD competitions.
                        </p>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-4">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>Latest community updates.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-start gap-4">
                                    <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium leading-none">New result posted by athlete</p>
                                        <p className="text-xs text-muted-foreground">2 hours ago in Morning WOD</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Separator />
                        <Button variant="outline" className="w-full text-xs">View Full Audit Log</Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
