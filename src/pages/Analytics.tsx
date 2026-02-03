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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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

    const [atRiskAthletes, setAtRiskAthletes] = useState<any[]>([]);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        const [members, leads, invoices, bookings] = await Promise.all([
            supabase.from('profiles').select('*'),
            supabase.from('leads').select('*', { count: 'exact', head: true }),
            supabase.from('invoices').select('amount'),
            supabase.from('bookings').select('athlete_id, created_at')
        ]);

        const totalRevenue = invoices.data?.reduce((acc, inv) => acc + Number(inv.amount), 0) || 0;
        const totalUsers = members.data?.length || 1;

        // Churn Risk Detection (No attendance in 10 days)
        const tenDaysAgo = new Date();
        tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

        const activeIds = new Set(
            bookings.data?.filter(b => new Date(b.created_at) > tenDaysAgo).map(b => b.athlete_id)
        );

        const riskAthletes = members.data?.filter(m => m.role_id === 'athlete' && !activeIds.has(m.id)) || [];
        setAtRiskAthletes(riskAthletes);

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
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-rose-600 flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5" /> Inactivity Alert
                            </CardTitle>
                            <CardDescription>Athletes with no attendance in +10 days.</CardDescription>
                        </div>
                        <Badge variant="destructive">{atRiskAthletes.length} At Risk</Badge>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="divide-y divide-border">
                            {atRiskAthletes.length === 0 ? (
                                <p className="py-8 text-center text-muted-foreground italic text-sm">Perfect! All athletes are active.</p>
                            ) : (
                                atRiskAthletes.slice(0, 5).map((athlete) => (
                                    <div key={athlete.id} className="py-3 flex items-center justify-between group">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-xs font-bold uppercase transition-all group-hover:bg-rose-600 group-hover:text-white">
                                                {athlete.first_name?.[0]}{athlete.last_name?.[0]}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold leading-none">{athlete.first_name} {athlete.last_name}</p>
                                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">12 Days Inactive</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button size="sm" variant="outline" className="h-8 text-[10px] font-black uppercase">Message</Button>
                                            <Button size="sm" className="h-8 text-[10px] font-black uppercase bg-rose-600 hover:bg-rose-700">Alert Coach</Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        {atRiskAthletes.length > 5 && (
                            <Button variant="ghost" className="w-full text-[10px] uppercase font-bold tracking-[0.2em]">View All {atRiskAthletes.length} Athletes</Button>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
