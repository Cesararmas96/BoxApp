import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    Users,
    TrendingUp,
    Zap,
    ArrowUpRight,
    ArrowDownRight,
    Activity
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
import { Separator } from '@/components/ui/separator';

export const Analytics: React.FC = () => {
    const [stats, setStats] = useState({
        totalMembers: 0,
        activeLeads: 0,
        completedWods: 124,
        attendanceRate: '85%'
    });

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        const { count: memberCount } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });

        const { count: leadCount } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true });

        setStats(prev => ({
            ...prev,
            totalMembers: memberCount || 0,
            activeLeads: leadCount || 0
        }));
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
                    title="Total Members"
                    value={stats.totalMembers}
                    label="+12%"
                    trend="up"
                    icon={Users}
                    color="primary"
                />
                <PerformanceCard
                    title="Growth Leads"
                    value={stats.activeLeads}
                    label="+5.2%"
                    trend="up"
                    icon={Zap}
                    color="orange-500"
                />
                <PerformanceCard
                    title="Training Volume"
                    value={stats.completedWods}
                    label="-2.1%"
                    trend="down"
                    icon={Activity}
                    color="indigo-500"
                />
                <PerformanceCard
                    title="Retention Rate"
                    value={stats.attendanceRate}
                    label="+0.4%"
                    trend="up"
                    icon={TrendingUp}
                    color="emerald-500"
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
