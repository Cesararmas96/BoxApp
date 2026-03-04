import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

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
    DollarSign,
    UserCheck,
    LayoutDashboard,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AthleteDashboard } from '@/components/AthleteDashboard';
import { CoachDashboard } from '@/components/CoachDashboard';
import { KpiCard, AlertsPanel, QuickActionsBar } from '@/components/admin';
import type { AdminAlert } from '@/components/admin';
import { useLanguage } from '@/hooks';
import { useAuth } from '@/contexts/AuthContext';

// ─── KPI metric shape ────────────────────────────────────────────────────────
interface KpiState { value: number | string; loading: boolean; error: boolean; delta?: number; }
const KPI_INIT: KpiState = { value: 0, loading: true, error: false };

// ─── Status badge for Mi Box tab ─────────────────────────────────────────────
const BOX_STATUS_LABELS: Record<string, { label: string; className: string }> = {
    active:    { label: 'Activo',     className: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' },
    trial:     { label: 'Trial',      className: 'bg-amber-500/20 text-amber-400 border border-amber-500/30' },
    suspended: { label: 'Suspendido', className: 'bg-red-500/20 text-red-400 border border-red-500/30' },
    cancelled: { label: 'Cancelado',  className: 'bg-zinc-500/20 text-zinc-400 border border-zinc-500/30' },
};

export const Dashboard: React.FC = () => {
    const { t } = useLanguage();
    const { userProfile, currentBox, isAdmin } = useAuth();
    const [stats, setStats] = useState({
        members: 0,
        activeWOD: null as any,
        attendance: 0,
        pendingLeads: 0,
        totalBookings: 0,
        recentResults: [] as any[]
    });

    // ── Admin KPI state ───────────────────────────────────────────────────────
    const [kpiRevenue, setKpiRevenue] = useState<KpiState>(KPI_INIT);
    const [kpiMembers, setKpiMembers] = useState<KpiState>(KPI_INIT);
    const [kpiSessions, setKpiSessions] = useState<KpiState>(KPI_INIT);
    const [kpiLeads, setKpiLeads] = useState<KpiState>(KPI_INIT);
    const [alerts, setAlerts] = useState<AdminAlert[]>([]);
    const [alertsLoading, setAlertsLoading] = useState(true);

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

    // ── Admin: load KPIs and alerts ───────────────────────────────────────────
    useEffect(() => {
        if (!isAdmin || !currentBox?.id) return;

        const boxId = currentBox.id;
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const today = new Date().toISOString().split('T')[0];

        const loadKpis = async () => {
            const [revenueRes, membersRes, sessionsRes, leadsRes] = await Promise.allSettled([
                supabase.from('invoices').select('amount').eq('box_id', boxId).gte('created_at', startOfMonth.toISOString()),
                supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('box_id', boxId).gte('created_at', startOfMonth.toISOString()),
                supabase.from('sessions').select('id', { count: 'exact', head: true }).eq('box_id', boxId).gte('start_time', `${today}T00:00:00`).lte('start_time', `${today}T23:59:59`),
                supabase.from('leads').select('id', { count: 'exact', head: true }).eq('box_id', boxId).eq('status', 'new'),
            ]);

            if (revenueRes.status === 'fulfilled' && !revenueRes.value.error) {
                const total = (revenueRes.value.data as any[])?.reduce((s, r) => s + Number(r.amount ?? 0), 0) ?? 0;
                setKpiRevenue({ value: total, loading: false, error: false });
            } else {
                setKpiRevenue({ value: 0, loading: false, error: true });
            }

            if (membersRes.status === 'fulfilled' && !membersRes.value.error) {
                setKpiMembers({ value: membersRes.value.count ?? 0, loading: false, error: false });
            } else {
                setKpiMembers({ value: 0, loading: false, error: true });
            }

            if (sessionsRes.status === 'fulfilled' && !sessionsRes.value.error) {
                setKpiSessions({ value: sessionsRes.value.count ?? 0, loading: false, error: false });
            } else {
                setKpiSessions({ value: 0, loading: false, error: true });
            }

            if (leadsRes.status === 'fulfilled' && !leadsRes.value.error) {
                setKpiLeads({ value: leadsRes.value.count ?? 0, loading: false, error: false });
            } else {
                setKpiLeads({ value: 0, loading: false, error: true });
            }
        };

        const loadAlerts = async () => {
            const generated: AdminAlert[] = [];
            // Pending invoices (no due_date column — surface all pending as potential attention items)
            const { count: pendingCount } = await supabase
                .from('invoices')
                .select('id', { count: 'exact', head: true })
                .eq('box_id', boxId)
                .eq('status', 'pending');
            if (pendingCount && pendingCount > 0) {
                generated.push({
                    id: 'pending-payments',
                    type: 'warning',
                    message: `${pendingCount} pago${pendingCount > 1 ? 's' : ''} pendiente${pendingCount > 1 ? 's' : ''} de confirmar`,
                    actionLabel: 'Ver pagos',
                    actionHref: '/billing',
                });
            }
            // New leads waiting
            const { count: newLeads } = await supabase
                .from('leads')
                .select('id', { count: 'exact', head: true })
                .eq('box_id', boxId)
                .eq('status', 'new');
            if (newLeads && newLeads > 0) {
                generated.push({
                    id: 'new-leads',
                    type: 'info',
                    message: `${newLeads} lead${newLeads > 1 ? 's' : ''} nuevo${newLeads > 1 ? 's' : ''} esperando contacto`,
                    actionLabel: 'Ver leads',
                    actionHref: '/leads',
                });
            }
            setAlerts(generated.slice(0, 5));
            setAlertsLoading(false);
        };

        loadKpis();
        loadAlerts();
    }, [isAdmin, currentBox?.id]);

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
        <div className="space-y-6 animate-premium-in">
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 mb-1">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{t('dashboard.system_live')}</span>
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-foreground leading-none">{t('dashboard.command_center')}</h1>
                <p className="text-muted-foreground text-sm mt-1">{t('dashboard.analytics_subtitle', { defaultValue: 'Operational Analytics & Global Oversight' })}</p>
            </div>

            <Tabs defaultValue="resumen" className="w-full">
                <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent space-x-6 overflow-x-auto overflow-y-hidden scrollbar-none">
                    <TabsTrigger value="resumen" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2 shrink-0">
                        Resumen
                    </TabsTrigger>
                    {isAdmin && (
                        <TabsTrigger value="operaciones" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2 shrink-0">
                            Operaciones
                        </TabsTrigger>
                    )}
                    {isAdmin && (
                        <TabsTrigger value="mi-box" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2 shrink-0">
                            Mi Box
                        </TabsTrigger>
                    )}
                </TabsList>

                {/* ── Tab: Resumen (existing content) ──────────────────────── */}
                <TabsContent value="resumen" className="pt-6">
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
                </TabsContent>

                {/* ── Tab: Operaciones (admin only) ────────────────────────── */}
                {isAdmin && (
                    <TabsContent value="operaciones" className="pt-6 space-y-6">
                        {/* KPI Cards */}
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <KpiCard
                                label="Ingresos del mes"
                                value={kpiRevenue.value}
                                icon={<DollarSign className="h-4 w-4" />}
                                loading={kpiRevenue.loading}
                                error={kpiRevenue.error}
                                unit="$"
                            />
                            <KpiCard
                                label="Nuevos miembros"
                                value={kpiMembers.value}
                                icon={<Users className="h-4 w-4" />}
                                loading={kpiMembers.loading}
                                error={kpiMembers.error}
                            />
                            <KpiCard
                                label="Clases hoy"
                                value={kpiSessions.value}
                                icon={<Calendar className="h-4 w-4" />}
                                loading={kpiSessions.loading}
                                error={kpiSessions.error}
                            />
                            <KpiCard
                                label="Leads nuevos"
                                value={kpiLeads.value}
                                icon={<UserCheck className="h-4 w-4" />}
                                loading={kpiLeads.loading}
                                error={kpiLeads.error}
                            />
                        </div>

                        {/* Alerts + Quick Actions */}
                        <div className="grid gap-6 md:grid-cols-2">
                            <AlertsPanel alerts={alerts} loading={alertsLoading} />
                            <Card className="border-none shadow-premium bg-card/50 backdrop-blur-xl">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base font-semibold">Acciones rápidas</CardTitle>
                                    <CardDescription className="text-xs">Ejecuta tareas operativas sin salir del dashboard</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <QuickActionsBar />
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                )}

                {/* ── Tab: Mi Box (admin only) ─────────────────────────────── */}
                {isAdmin && (
                    <TabsContent value="mi-box" className="pt-6">
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            <Card className="border-none shadow-premium bg-card/50 backdrop-blur-xl">
                                <CardHeader>
                                    <div className="flex items-center gap-2">
                                        <LayoutDashboard className="h-5 w-5 text-primary" />
                                        <CardTitle className="text-base">Estado del Box</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Nombre</p>
                                        <p className="font-medium mt-0.5">{currentBox?.name ?? '—'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider">URL (slug)</p>
                                        <p className="font-mono text-sm mt-0.5">{currentBox?.slug ?? '—'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Estado</p>
                                        {currentBox?.subscription_status && (
                                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${BOX_STATUS_LABELS[currentBox.subscription_status]?.className ?? ''}`}>
                                                {BOX_STATUS_LABELS[currentBox.subscription_status]?.label ?? currentBox.subscription_status}
                                            </span>
                                        )}
                                    </div>
                                    {currentBox?.trial_ends_at && currentBox.subscription_status === 'trial' && (
                                        <div>
                                            <p className="text-xs text-muted-foreground uppercase tracking-wider">Trial vence</p>
                                            <p className="text-sm mt-0.5">
                                                {new Date(currentBox.trial_ends_at).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })}
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                                <CardFooter className="gap-2 flex-wrap">
                                    <Button variant="outline" size="sm" asChild>
                                        <Link to="/settings">Configurar Box →</Link>
                                    </Button>
                                    <Button variant="ghost" size="sm" asChild>
                                        <Link to="/settings?tab=subscription">Suscripción</Link>
                                    </Button>
                                </CardFooter>
                            </Card>
                        </div>
                    </TabsContent>
                )}
            </Tabs>
        </div>
    );
};
