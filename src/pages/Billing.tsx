import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useSearchParams } from 'react-router-dom';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
    ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import {
    Plus,
    TrendingUp,
    TrendingDown,
    DollarSign,
    Loader2,
    Calendar,
    Briefcase,
    Pencil,
    Trash2,
    MoreVertical,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Users,
    ChevronLeft,
    ChevronRight,
    Clock,
    Search,
    AlertTriangle,
    BarChart3,
    Receipt,
    FileText,
    Activity,
    Target,
    Percent,
    UserMinus,
    Download,
    FileSpreadsheet,
    Filter
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage, useNotification } from '@/hooks';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import {
    ResponsiveDialog as Dialog,
    ResponsiveDialogContent as DialogContent,
    ResponsiveDialogHeader as DialogHeader,
    ResponsiveDialogTitle as DialogTitle,
    ResponsiveDialogDescription as DialogDescription,
    ResponsiveDialogTrigger as DialogTrigger
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Toast } from '@/components/ui/toast-custom';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface Plan {
    id: string;
    name: string;
    price: number;
    interval: string;
    duration_days: number;
    sessions_count?: number;
    has_limit?: boolean;
    total_credits?: number;
}

interface Expense {
    id: string;
    category: string;
    amount: number;
    date: string;
    description: string;
    is_recurring?: boolean;
    recurring_interval?: string;
}

interface Invoice {
    id: string;
    athlete_id?: string;
    user_id?: string;
    membership_id?: string;
    amount: number;
    status: string;
    payment_method?: string;
    notes?: string;
    created_at: string;
    due_date?: string;
    paid_at?: string;
    box_id?: string;
}

const EXPENSE_CATEGORIES = [
    'Rent', 'Utilities', 'Staff', 'Equipment', 'Marketing',
    'Insurance', 'Maintenance', 'Software', 'Taxes', 'Training', 'Other'
];

const PIE_COLORS = [
    'hsl(var(--primary))',
    'hsl(var(--chart-2, 173 58% 39%))',
    'hsl(var(--chart-3, 197 37% 24%))',
    'hsl(var(--chart-4, 43 74% 66%))',
    'hsl(var(--chart-5, 27 87% 67%))',
    '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'
];

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export const Billing: React.FC = () => {
    const { t } = useLanguage();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'dashboard';
    const [plans, setPlans] = useState<Plan[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [allMemberships, setAllMemberships] = useState<any[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);
    const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
    const { currentBox } = useAuth();
    const { notification, showNotification: addNotification, hideNotification, confirmState, showConfirm, hideConfirm } = useNotification();

    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

    // Filter states
    const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

    // Form states
    const [newPlan, setNewPlan] = useState({ name: '', price: '', interval: 'monthly', duration_days: 30, total_credits: 0 });
    const [newExpense, setNewExpense] = useState({ description: '', category: 'Rent', amount: '', date: new Date().toISOString().split('T')[0], is_recurring: false, recurring_interval: 'monthly' });
    const [newMembership, setNewMembership] = useState({
        userId: '',
        planId: '',
        startDate: new Date().toISOString().split('T')[0],
        isUnclear: false
    });
    const [athleteSearch, setAthleteSearch] = useState('');
    const [membershipSearch, setMembershipSearch] = useState('');
    const [invoiceSearch, setInvoiceSearch] = useState('');

    // List states
    const [allAthletes, setAllAthletes] = useState<any[]>([]);
    const [isMembershipDialogOpen, setIsMembershipDialogOpen] = useState(false);

    // Pagination states
    const [membershipsPage, setMembershipsPage] = useState(1);
    const [invoicesPage, setInvoicesPage] = useState(1);
    const itemsPerPage = 8;

    /* ---------------------------------------------------------------- */
    /* Data Fetching                                                     */
    /* ---------------------------------------------------------------- */

    useEffect(() => {
        fetchFinanceData();
    }, []);

    const fetchFinanceData = async () => {
        setLoading(true);
        try {
            const [plansRes, expensesRes, allMembershipsRes, invoicesRes] = await Promise.all([
                supabase.from('plans').select('*').order('name'),
                supabase.from('expenses').select('*').order('date', { ascending: false }),
                supabase.from('memberships').select('*, plans(price, name, duration_days), profiles(first_name, last_name, email)')
                    .eq('box_id', currentBox?.id || ''),
                supabase.from('invoices').select('*').eq('box_id', currentBox?.id || '').order('created_at', { ascending: false })
            ]);

            if (plansRes.error) throw plansRes.error;
            if (expensesRes.error) throw expensesRes.error;

            setPlans(plansRes.data as unknown as Plan[] || []);
            setExpenses((expensesRes.data as any) || []);
            setAllMemberships(allMembershipsRes.data || []);
            setInvoices((invoicesRes.data as unknown as Invoice[]) || []);

            // Fetch athletes
            const athletesData = await supabase
                .from('profiles')
                .select('id, first_name, last_name, email')
                .eq('box_id', currentBox?.id || '')
                .eq('role_id', 'athlete');

            setAllAthletes(athletesData.data || []);
        } catch (error: any) {
            console.error('Error fetching finance data:', error);
            addNotification('error', t('common.error_loading'));
        } finally {
            setLoading(false);
        }
    };

    /* ---------------------------------------------------------------- */
    /* Filtered Data                                                     */
    /* ---------------------------------------------------------------- */

    const filteredExpensesByDate = useMemo(() => {
        return expenses.filter(e => {
            const date = parseISO(e.date);
            return isWithinInterval(date, { start: parseISO(startDate), end: parseISO(endDate) });
        });
    }, [expenses, startDate, endDate]);

    const filteredInvoicesByDate = useMemo(() => {
        return invoices.filter(inv => {
            const date = parseISO(inv.created_at.split('T')[0]);
            return isWithinInterval(date, { start: parseISO(startDate), end: parseISO(endDate) });
        });
    }, [invoices, startDate, endDate]);

    /* ---------------------------------------------------------------- */
    /* Computed KPIs                                                      */
    /* ---------------------------------------------------------------- */

    const kpis = useMemo(() => {
        const now = new Date();

        // Active memberships
        const activeMemberships = allMemberships.filter(m => m.status === 'active');

        // MRR: sum of plan prices for active memberships
        const mrr = activeMemberships.reduce((acc: number, m: any) => {
            const planPrice = m.plans?.price || 0;
            const interval = plans.find(p => p.id === m.plan_id)?.interval;
            if (interval === 'annual') return acc + (planPrice / 12);
            return acc + planPrice;
        }, 0);

        // Total expenses in period
        const periodExpenses = filteredExpensesByDate.reduce((acc, e) => acc + Number(e.amount), 0);

        // Actual revenue in period (from invoices)
        const periodRevenue = filteredInvoicesByDate.filter(inv => inv.status === 'paid')
            .reduce((acc, inv) => acc + Number(inv.amount), 0);

        // Total revenue all time (for LTV context)
        const totalRevenue = invoices.filter(inv => inv.status === 'paid')
            .reduce((acc, inv) => acc + Number(inv.amount), 0);

        // ARPU
        const arpu = activeMemberships.length > 0 ? mrr / activeMemberships.length : 0;

        // Collection Rate: actual revenue / expected revenue (MRR)
        // Since the period might be different from exactly one month, we use MRR as a benchmark
        const collectionRate = mrr > 0 ? Math.min((periodRevenue / mrr) * 100, 100) : 0;

        // Net Operating Margin
        const netMarginAmount = periodRevenue - periodExpenses;
        const netMarginPercent = periodRevenue > 0 ? (netMarginAmount / periodRevenue) * 100 : 0;

        // Churn: memberships that expired in period
        const expiredInPeriod = allMemberships.filter(m => {
            if (!m.end_date || m.status === 'active') return false;
            const endDateObj = parseISO(m.end_date);
            return isWithinInterval(endDateObj, { start: parseISO(startDate), end: parseISO(endDate) });
        }).length;
        
        const totalAtStart = allMemberships.filter(m => {
            const created = parseISO(m.created_at.split('T')[0]);
            return created <= parseISO(startDate);
        }).length || 1;
        const churnRate = (expiredInPeriod / totalAtStart) * 100;

        // LTV: ARPU * average membership lifespan in months
        const avgLifespanMonths = activeMemberships.length > 0
            ? activeMemberships.reduce((acc: number, m: any) => {
                const start = m.start_date ? parseISO(m.start_date) : parseISO(m.created_at.split('T')[0]);
                const months = Math.max(1, (now.getTime() - start.getTime()) / (30 * 24 * 60 * 60 * 1000));
                return acc + months;
            }, 0) / activeMemberships.length
            : 1;
        const ltv = arpu * avgLifespanMonths;

        // Delinquency alerts (always based on 'now', not filtered by period for safety)
        const expiringIn7Days = allMemberships.filter(m => {
            if (!m.end_date || m.status !== 'active') return false;
            const endDateObj = parseISO(m.end_date);
            const diffDays = Math.ceil((endDateObj.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            return diffDays >= 0 && diffDays <= 7;
        });

        const expiredNoRenewal = allMemberships.filter(m => {
            if (!m.end_date) return false;
            const endDateObj = parseISO(m.end_date);
            return endDateObj < now && (m.status === 'active' || m.status === 'expired');
        });

        return {
            mrr,
            periodExpenses,
            periodRevenue,
            totalRevenue,
            arpu,
            collectionRate,
            netMarginAmount,
            netMarginPercent,
            churnRate,
            ltv,
            activeMemberships: activeMemberships.length,
            totalMemberships: allMemberships.length,
            expiringIn7Days,
            expiredNoRenewal
        };
    }, [allMemberships, filteredExpensesByDate, filteredInvoicesByDate, invoices, plans, startDate, endDate]);

    /* ---------------------------------------------------------------- */
    /* Monthly Chart Data (Income vs Expenses last 6 months)             */
    /* ---------------------------------------------------------------- */

    const monthlyChartData = useMemo(() => {
        const data = [];
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const month = d.getMonth();
            const year = d.getFullYear();
            const monthLabel = t(`billing.months.${format(d, 'MMM')}`, { defaultValue: format(d, 'MMM') });

            const income = invoices
                .filter(inv => {
                    const id = parseISO(inv.created_at.split('T')[0]);
                    return id.getMonth() === month && id.getFullYear() === year && inv.status === 'paid';
                })
                .reduce((acc, inv) => acc + Number(inv.amount), 0);

            const expense = expenses
                .filter(e => {
                    const ed = parseISO(e.date);
                    return ed.getMonth() === month && ed.getFullYear() === year;
                })
                .reduce((acc, e) => acc + Number(e.amount), 0);

            data.push({ month: monthLabel, income, expenses: expense });
        }
        return data;
    }, [invoices, expenses, t]);

    /* ---------------------------------------------------------------- */
    /* Expense Pie Chart Data                                            */
    /* ---------------------------------------------------------------- */

    const expensePieData = useMemo(() => {
        const categoryMap: Record<string, number> = {};
        filteredExpensesByDate.forEach(e => {
            categoryMap[e.category] = (categoryMap[e.category] || 0) + Number(e.amount);
        });

        return Object.entries(categoryMap).map(([name, value]) => ({ name: t(`billing.categories.${name}`, { defaultValue: name }), value }));
    }, [filteredExpensesByDate, t]);

    /* ---------------------------------------------------------------- */
    /* Rentability per Plan                                              */
    /* ---------------------------------------------------------------- */

    const planStats = useMemo(() => {
        return plans.map(plan => {
            const membersOnPlan = allMemberships.filter(m => m.plan_id === plan.id && m.status === 'active').length;
            const revenue = membersOnPlan * plan.price;
            return { ...plan, membersOnPlan, revenue };
        }).sort((a, b) => b.revenue - a.revenue);
    }, [plans, allMemberships]);

    /* ---------------------------------------------------------------- */
    /* PDF and CSV Generation                                            */
    /* ---------------------------------------------------------------- */

    const generatePDFReport = () => {
        const doc = new jsPDF();
        
        // Header
        doc.setFontSize(20);
        doc.text(t('billing.report_title'), 14, 20);
        doc.setFontSize(10);
        doc.text(`${t('billing.period')}: ${startDate} - ${endDate}`, 14, 28);
        doc.text(`${t('common.date')}: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`, 14, 34);
        
        // KPI Summary
        doc.setFontSize(14);
        doc.text(t('common.overview'), 14, 45);
        const kpiData = [
            [t('billing.kpi_mrr'), `$${kpis.mrr.toFixed(2)}`],
            [t('billing.chart_income'), `$${kpis.periodRevenue.toFixed(2)}`],
            [t('billing.chart_expenses'), `$${kpis.periodExpenses.toFixed(2)}`],
            [t('billing.kpi_net_margin'), `$${kpis.netMarginAmount.toFixed(2)} (${kpis.netMarginPercent.toFixed(1)}%)`],
            [t('billing.kpi_collection_rate'), `${kpis.collectionRate.toFixed(1)}%`],
            [t('billing.kpi_churn_rate'), `${kpis.churnRate.toFixed(1)}%`]
        ];
        
        autoTable(doc, {
            startY: 50,
            head: [[t('common.category'), t('common.description')]],
            body: kpiData,
            theme: 'grid',
            headStyles: { fillColor: [66, 66, 66] }
        });

        // Invoices Table
        doc.addPage();
        doc.text(t('billing.invoice_history'), 14, 20);
        const invoiceRows = filteredInvoicesByDate.map(inv => {
            const athlete = allAthletes.find(a => a.id === (inv.athlete_id || inv.user_id));
            return [
                athlete ? `${athlete.first_name} ${athlete.last_name}` : 'N/A',
                `$${Number(inv.amount).toFixed(2)}`,
                inv.status,
                format(parseISO(inv.created_at.split('T')[0]), 'yyyy-MM-dd')
            ];
        });

        autoTable(doc, {
            startY: 25,
            head: [[t('common.athlete'), t('billing.amount'), t('common.status'), t('common.date')]],
            body: invoiceRows,
            theme: 'striped'
        });

        // Expenses Table
        doc.addPage();
        doc.text(t('billing.expense_history'), 14, 20);
        const expenseRows = filteredExpensesByDate.map(e => [
            e.description,
            t(`billing.categories.${e.category}`, { defaultValue: e.category }),
            `$${Number(e.amount).toFixed(2)}`,
            e.date
        ]);

        autoTable(doc, {
            startY: 25,
            head: [[t('billing.description'), t('billing.category'), t('billing.amount'), t('common.date')]],
            body: expenseRows,
            theme: 'striped'
        });

        doc.save(`BoxApp_Report_${startDate}_${endDate}.pdf`);
        addNotification('success', t('billing.report_generated'));
    };

    const exportCSV = (type: 'invoices' | 'expenses') => {
        let csvRows: string[] = [];
        let filename = "";

        if (type === 'invoices') {
            const headers = [t('common.athlete'), t('billing.amount'), t('common.status'), t('common.date')];
            csvRows = [headers.join(",")];
            filteredInvoicesByDate.forEach(inv => {
                const athlete = allAthletes.find(a => a.id === (inv.athlete_id || inv.user_id));
                const row = [
                    `"${athlete ? `${athlete.first_name} ${athlete.last_name}` : 'N/A'}"`,
                    inv.amount,
                    inv.status,
                    inv.created_at
                ];
                csvRows.push(row.join(","));
            });
            filename = `Invoices_${startDate}_${endDate}.csv`;
        } else {
            const headers = [t('billing.description'), t('billing.category'), t('billing.amount'), t('common.date')];
            csvRows = [headers.join(",")];
            filteredExpensesByDate.forEach(e => {
                const row = [
                    `"${e.description}"`,
                    e.category,
                    e.amount,
                    e.date
                ];
                csvRows.push(row.join(","));
            });
            filename = `Expenses_${startDate}_${endDate}.csv`;
        }

        const blob = new Blob([csvRows.join("\n")], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    /* ---------------------------------------------------------------- */
    /* Handlers (Plans, Expenses, Memberships)                           */
    /* ---------------------------------------------------------------- */

    const handleCreatePlan = async () => {
        if (!newPlan.name || !newPlan.price) return;
        setLoading(true);
        const planData = {
            name: newPlan.name,
            interval: newPlan.interval,
            duration_days: Number(newPlan.duration_days),
            price: parseFloat(newPlan.price as string),
            box_id: currentBox?.id,
            total_credits: newPlan.interval === 'credits' ? newPlan.total_credits : 0
        };

        const { error } = editingPlan
            ? await supabase.from('plans').update(planData).eq('id', editingPlan.id)
            : await supabase.from('plans').insert([planData]);

        if (error) {
            addNotification('error', t('common.error') + ': ' + error.message);
        } else {
            addNotification('success', editingPlan ? t('billing.plan_updated') : t('billing.plan_created'));
            setIsPlanDialogOpen(false);
            setEditingPlan(null);
            setNewPlan({ name: '', price: '', interval: 'monthly', duration_days: 30, total_credits: 0 });
            fetchFinanceData();
        }
        setLoading(false);
    };

    const handleDeletePlan = async (id: string) => {
        showConfirm({
            title: t('billing.delete_plan_title'),
            description: t('billing.delete_confirm'),
            variant: 'destructive',
            icon: 'destructive',
            onConfirm: async () => {
                setLoading(true);
                const { error } = await supabase.from('plans').delete().eq('id', id);
                if (error) {
                    addNotification('error', t('common.error') + ': ' + error.message);
                } else {
                    addNotification('success', t('billing.plan_deleted'));
                    fetchFinanceData();
                }
                setLoading(false);
            }
        });
    };

    const handleCreateExpense = async () => {
        if (!newExpense.description || !newExpense.amount) return;
        setLoading(true);
        const expenseData = {
            description: newExpense.description,
            category: newExpense.category,
            amount: parseFloat(newExpense.amount as string),
            date: newExpense.date,
            box_id: currentBox?.id
        };

        const { error } = editingExpense
            ? await supabase.from('expenses').update(expenseData).eq('id', editingExpense.id)
            : await supabase.from('expenses').insert([expenseData]);

        if (error) {
            addNotification('error', t('common.error') + ': ' + error.message);
        } else {
            addNotification('success', editingExpense ? t('billing.expense_updated') : t('billing.expense_logged'));
            setIsExpenseDialogOpen(false);
            setEditingExpense(null);
            setNewExpense({ description: '', category: 'Rent', amount: '', date: new Date().toISOString().split('T')[0], is_recurring: false, recurring_interval: 'monthly' });
            fetchFinanceData();
        }
        setLoading(false);
    };

    const handleDeleteExpense = async (id: string) => {
        showConfirm({
            title: t('billing.delete_expense_title'),
            description: t('billing.delete_expense_confirm'),
            variant: 'destructive',
            icon: 'destructive',
            onConfirm: async () => {
                setLoading(true);
                const { error } = await supabase.from('expenses').delete().eq('id', id);
                if (error) {
                    addNotification('error', t('common.error') + ': ' + error.message);
                } else {
                    addNotification('success', t('billing.expense_deleted'));
                    fetchFinanceData();
                }
                setLoading(false);
            }
        });
    };

    const handleMarkPaid = async (membership: any) => {
        setLoading(true);
        try {
            const plan = plans.find(p => p.id === membership.plan_id);
            const amount = plan?.price || 0;

            const { error: invoiceError } = await supabase
                .from('invoices')
                .insert([{
                    athlete_id: membership.athlete_id || membership.user_id,
                    box_id: currentBox?.id,
                    amount: amount,
                    status: 'paid',
                    membership_id: membership.id
                }]);

            if (invoiceError) throw invoiceError;

            let newEndDate = new Date();
            const currentEndDate = membership.end_date ? new Date(membership.end_date) : null;

            if (currentEndDate && currentEndDate > new Date() && membership.status === 'active') {
                newEndDate = new Date(currentEndDate);
            }

            newEndDate.setDate(newEndDate.getDate() + (plan?.duration_days || 30));

            const { error: memberError } = await supabase
                .from('memberships')
                .update({
                    status: 'active',
                    start_date: membership.start_date || new Date().toISOString(),
                    end_date: newEndDate.toISOString()
                })
                .eq('id', membership.id);

            if (memberError) throw memberError;

            addNotification('success', t('billing.success_paid'));
            fetchFinanceData();
        } catch (error: any) {
            console.error('Error marking as paid:', error);
            addNotification('error', t('common.error') + ': ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleExtend = async (membership: any, days: number = 7) => {
        setLoading(true);
        try {
            const currentEndDate = membership.end_date ? new Date(membership.end_date) : new Date();
            const newEndDate = new Date(currentEndDate);
            newEndDate.setDate(newEndDate.getDate() + days);

            const { error } = await supabase
                .from('memberships')
                .update({ end_date: newEndDate.toISOString() })
                .eq('id', membership.id);

            if (error) throw error;
            addNotification('success', t('billing.membership_extended', { days }));
            fetchFinanceData();
        } catch (error: any) {
            console.error('Error extending membership:', error);
            addNotification('error', t('common.error') + ': ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRenew = (membership: any) => {
        handleMarkPaid(membership);
    };

    const handleDeleteMembership = async (id: string) => {
        showConfirm({
            title: t('billing.delete_membership_title'),
            description: t('billing.delete_membership_confirm'),
            variant: 'destructive',
            icon: 'destructive',
            onConfirm: async () => {
                setLoading(true);
                const { error } = await supabase.from('memberships').delete().eq('id', id);
                if (error) {
                    addNotification('error', t('common.error') + ': ' + error.message);
                } else {
                    addNotification('success', t('billing.membership_deleted'));
                    fetchFinanceData();
                }
                setLoading(false);
            }
        });
    };

    const handleActivateMembership = async (id: string, planId: string) => {
        setLoading(true);
        try {
            const plan = plans.find(p => p.id === planId);
            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + (plan?.duration_days || 30));

            const { error } = await supabase
                .from('memberships')
                .update({
                    status: 'active',
                    start_date: startDate.toISOString(),
                    end_date: endDate.toISOString()
                })
                .eq('id', id);

            if (error) throw error;
            addNotification('success', t('billing.membership_activated'));
            fetchFinanceData();
        } catch (error: any) {
            console.error('Error activating membership:', error);
            addNotification('error', t('common.error') + ': ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateMembership = async () => {
        if (!newMembership.userId || !newMembership.planId) {
            addNotification('error', t('billing.error_select_athlete_plan'));
            return;
        }

        if (!currentBox?.id) {
            addNotification('error', t('common.error'));
            return;
        }

        const existingMembership = allMemberships.find(m => (m.athlete_id || m.user_id) === newMembership.userId);
        if (existingMembership) {
            addNotification('error', t('billing.error_existing_membership'));
            return;
        }

        setLoading(true);
        try {
            const plan = plans.find(p => p.id === newMembership.planId);
            const startDateObj = newMembership.isUnclear ? null : new Date(newMembership.startDate + 'T12:00:00');
            let endDateObj = null;
            let status = 'pending';

            if (startDateObj) {
                endDateObj = new Date(startDateObj);
                endDateObj.setDate(endDateObj.getDate() + (plan?.duration_days || 30));
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const compareDate = new Date(startDateObj);
                compareDate.setHours(0, 0, 0, 0);
                status = compareDate <= today ? 'active' : 'pending';
            }

            const { error } = await supabase
                .from('memberships')
                .insert([{
                    athlete_id: newMembership.userId,
                    user_id: newMembership.userId,
                    plan_id: newMembership.planId,
                    box_id: currentBox?.id,
                    start_date: startDateObj ? startDateObj.toISOString() : null,
                    end_date: endDateObj ? endDateObj.toISOString() : null,
                    status
                }]);

            if (error) throw error;

            addNotification('success', t('billing.membership_created'));
            setIsMembershipDialogOpen(false);
            setNewMembership({ userId: '', planId: '', startDate: new Date().toISOString().split('T')[0], isUnclear: false });
            fetchFinanceData();
        } catch (error: any) {
            console.error('Error creating membership:', error);
            addNotification('error', t('billing.error_creating_membership') + ': ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const openEditPlan = (plan: Plan) => {
        setEditingPlan(plan);
        setNewPlan({
            name: plan.name,
            price: plan.price.toString(),
            duration_days: plan.duration_days,
            interval: plan.interval,
            total_credits: (plan as any).total_credits || 0
        });
        setIsPlanDialogOpen(true);
    };

    const openEditExpense = (expense: Expense) => {
        setEditingExpense(expense);
        setNewExpense({
            description: expense.description,
            category: expense.category,
            amount: expense.amount.toString(),
            date: expense.date,
            is_recurring: false,
            recurring_interval: 'monthly'
        });
        setIsExpenseDialogOpen(true);
    };

    /* ---------------------------------------------------------------- */
    /* Filtered/Paginated Data                                           */
    /* ---------------------------------------------------------------- */

    const filteredMembershipsSearch = allMemberships.filter(m => {
        const fullName = `${m.profiles?.first_name} ${m.profiles?.last_name} ${m.profiles?.email}`.toLowerCase();
        return fullName.includes(membershipSearch.toLowerCase());
    });

    const paginatedMemberships = filteredMembershipsSearch.slice((membershipsPage - 1) * itemsPerPage, membershipsPage * itemsPerPage);
    const membershipsTotalPages = Math.ceil(filteredMembershipsSearch.length / itemsPerPage);

    const filteredInvoicesSearch = filteredInvoicesByDate.filter(inv => {
        if (!invoiceSearch) return true;
        const athlete = allAthletes.find(a => a.id === (inv.athlete_id || inv.user_id));
        const name = athlete ? `${athlete.first_name} ${athlete.last_name} ${athlete.email}`.toLowerCase() : '';
        return name.includes(invoiceSearch.toLowerCase()) || inv.status.toLowerCase().includes(invoiceSearch.toLowerCase());
    });
    const paginatedInvoices = filteredInvoicesSearch.slice((invoicesPage - 1) * itemsPerPage, invoicesPage * itemsPerPage);
    const invoicesTotalPages = Math.ceil(filteredInvoicesSearch.length / itemsPerPage);

    /* ---------------------------------------------------------------- */
    /* Render                                                            */
    /* ---------------------------------------------------------------- */

    if (loading && plans.length === 0) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-4 md:space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('billing.title')}</h1>
                    <p className="text-muted-foreground text-xs sm:text-sm">{t('billing.subtitle')}</p>
                </div>
                
                {/* Global Date Filter & Export */}
                <div className="flex flex-col gap-2 w-full md:w-auto md:flex-row md:items-center bg-muted rounded-md p-1 border border-border">
                    <div className="flex items-center gap-2 px-2 md:border-r md:border-border/50">
                        <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                        <Input 
                            type="date" 
                            className="h-8 w-32 text-[10px] bg-background border-none focus-visible:ring-0" 
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                        <span className="text-muted-foreground text-[10px]">to</span>
                        <Input 
                            type="date" 
                            className="h-8 w-32 text-[10px] bg-background border-none focus-visible:ring-0" 
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-9 md:h-8 gap-2 text-[10px] uppercase font-bold tracking-widest justify-center">
                                <Download className="h-3.5 w-3.5" />
                                {t('common.actions')}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>{t('billing.export_pdf')}</DropdownMenuLabel>
                            <DropdownMenuItem onClick={generatePDFReport} className="gap-2 cursor-pointer">
                                <FileText className="h-4 w-4 text-red-500" /> PDF Report
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>{t('billing.export_csv')}</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => exportCSV('invoices')} className="gap-2 cursor-pointer">
                                <FileSpreadsheet className="h-4 w-4 text-green-500" /> Invoices CSV
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => exportCSV('expenses')} className="gap-2 cursor-pointer">
                                <FileSpreadsheet className="h-4 w-4 text-green-500" /> Expenses CSV
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={(val) => setSearchParams({ tab: val })} className="w-full">
                <TabsList className="grid w-full max-w-2xl grid-cols-4 bg-muted/50 p-1 mb-6">
                    <TabsTrigger value="dashboard" className="flex items-center gap-2 text-xs">
                        <BarChart3 className="h-3.5 w-3.5" />
                        {t('billing.dashboard_tab')}
                    </TabsTrigger>
                    <TabsTrigger value="finance" className="flex items-center gap-2 text-xs">
                        <DollarSign className="h-3.5 w-3.5" />
                        {t('billing.finances_tab')}
                    </TabsTrigger>
                    <TabsTrigger value="invoices" className="flex items-center gap-2 text-xs">
                        <Receipt className="h-3.5 w-3.5" />
                        {t('billing.invoices_tab')}
                    </TabsTrigger>
                    <TabsTrigger value="athletes" className="flex items-center gap-2 text-xs">
                        <Users className="h-3.5 w-3.5" />
                        {t('billing.athletes_status_tab')}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="dashboard" className="space-y-6 m-0">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        <KpiCard
                            label={t('billing.kpi_mrr')}
                            value={`$${kpis.mrr.toFixed(0)}`}
                            icon={<TrendingUp className="h-4 w-4" />}
                            color="text-green-500"
                            bgColor="bg-green-500/5 border-green-500/20"
                        />
                        <KpiCard
                            label={t('billing.kpi_monthly_expenses')}
                            value={`$${kpis.periodExpenses.toFixed(0)}`}
                            icon={<TrendingDown className="h-4 w-4" />}
                            color="text-red-500"
                            bgColor="bg-red-500/5 border-red-500/20"
                        />
                        <KpiCard
                            label={t('billing.kpi_net_margin')}
                            value={`$${kpis.netMarginAmount.toFixed(0)}`}
                            subtext={`${kpis.netMarginPercent.toFixed(1)}%`}
                            icon={<DollarSign className="h-4 w-4" />}
                            color={kpis.netMarginAmount >= 0 ? "text-primary" : "text-destructive"}
                            bgColor={kpis.netMarginAmount >= 0 ? "bg-primary/5 border-primary/20" : "bg-destructive/5 border-destructive/20"}
                        />
                        <KpiCard
                            label={t('billing.kpi_arpu')}
                            value={`$${kpis.arpu.toFixed(0)}`}
                            icon={<Target className="h-4 w-4" />}
                            color="text-blue-500"
                            bgColor="bg-blue-500/5 border-blue-500/20"
                        />
                        <KpiCard
                            label={t('billing.kpi_churn_rate')}
                            value={`${kpis.churnRate.toFixed(1)}%`}
                            icon={<UserMinus className="h-4 w-4" />}
                            color={kpis.churnRate > 5 ? "text-red-500" : "text-green-500"}
                            bgColor={kpis.churnRate > 5 ? "bg-red-500/5 border-red-500/20" : "bg-green-500/5 border-green-500/20"}
                        />
                        <KpiCard
                            label={t('billing.kpi_ltv')}
                            value={`$${kpis.ltv.toFixed(0)}`}
                            icon={<Activity className="h-4 w-4" />}
                            color="text-purple-500"
                            bgColor="bg-purple-500/5 border-purple-500/20"
                        />
                    </div>

                    <Card>
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <Percent className="h-4 w-4 text-primary" />
                                    {t('billing.kpi_collection_rate')}
                                </CardTitle>
                                <span className="text-2xl font-bold font-mono text-primary">{kpis.collectionRate.toFixed(0)}%</span>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Progress value={kpis.collectionRate} className="h-2" />
                            <p className="text-xs text-muted-foreground mt-2">
                                {t('billing.collection_rate_desc', { actual: kpis.periodRevenue.toFixed(0), expected: kpis.mrr.toFixed(0) })}
                            </p>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <BarChart3 className="h-4 w-4 text-primary" />
                                    {t('billing.chart_income_vs_expenses')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={280}>
                                    <BarChart data={monthlyChartData} barGap={4}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                        <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                                        <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `$${v}`} />
                                        <RechartsTooltip
                                            contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 12 }}
                                            formatter={(value) => [`$${Number(value).toFixed(0)}`, '']}
                                        />
                                        <Bar dataKey="income" name={t('billing.chart_income')} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="expenses" name={t('billing.chart_expenses')} fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <Briefcase className="h-4 w-4 text-primary" />
                                    {t('billing.chart_expense_distribution')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {expensePieData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={280}>
                                        <PieChart>
                                            <Pie
                                                data={expensePieData}
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={90}
                                                innerRadius={50}
                                                dataKey="value"
                                                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                                                labelLine={false}
                                                style={{ fontSize: 10 }}
                                            >
                                                {expensePieData.map((_entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Legend wrapperStyle={{ fontSize: 10 }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">
                                        {t('billing.no_expenses_this_month')}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {(kpis.expiringIn7Days.length > 0 || kpis.expiredNoRenewal.length > 0) && (
                        <Card className="border-amber-500/30 bg-amber-500/5">
                            <CardHeader>
                                <CardTitle className="text-sm font-medium flex items-center gap-2 text-amber-600">
                                    <AlertTriangle className="h-4 w-4" />
                                    {t('billing.delinquency_alerts')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {kpis.expiringIn7Days.length > 0 && (
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-wider text-amber-600 mb-2">
                                            {t('billing.expiring_soon', { count: kpis.expiringIn7Days.length })}
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {kpis.expiringIn7Days.map((m: any) => {
                                                const endDateObj = parseISO(m.end_date);
                                                const diffDays = Math.ceil((endDateObj.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                                                return (
                                                    <Badge key={m.id} variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-500/30 text-xs">
                                                        {m.profiles?.first_name} {m.profiles?.last_name} — {diffDays}d
                                                    </Badge>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                                {kpis.expiredNoRenewal.length > 0 && (
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-wider text-red-600 mb-2">
                                            {t('billing.expired_no_renewal', { count: kpis.expiredNoRenewal.length })}
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {kpis.expiredNoRenewal.slice(0, 10).map((m: any) => (
                                                <Badge key={m.id} variant="outline" className="bg-red-500/10 text-red-700 border-red-500/30 text-xs">
                                                    {m.profiles?.first_name} {m.profiles?.last_name}
                                                </Badge>
                                            ))}
                                            {kpis.expiredNoRenewal.length > 10 && (
                                                <Badge variant="outline" className="text-xs">+{kpis.expiredNoRenewal.length - 10}</Badge>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <FileText className="h-4 w-4 text-primary" />
                                {t('billing.plan_rentability')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-[10px] font-bold uppercase tracking-widest">{t('billing.plan_name')}</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase tracking-widest text-center">{t('billing.active_members')}</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase tracking-widest text-center">{t('billing.price')}</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase tracking-widest text-right">{t('billing.monthly_revenue')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {planStats.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-6 text-muted-foreground text-sm">
                                                {t('common.no_data')}
                                            </TableCell>
                                        </TableRow>
                                    ) : planStats.map(ps => (
                                        <TableRow key={ps.id}>
                                            <TableCell className="font-medium text-sm">{ps.name}</TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="secondary" className="text-[10px]">{ps.membersOnPlan}</Badge>
                                            </TableCell>
                                            <TableCell className="text-center font-mono text-sm">${ps.price}</TableCell>
                                            <TableCell className="text-right font-mono text-primary font-bold">${ps.revenue.toFixed(0)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="finance" className="space-y-6 m-0">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="text-lg">{t('billing.plans_title')}</CardTitle>
                                <Dialog open={isPlanDialogOpen} onOpenChange={(open) => {
                                    setIsPlanDialogOpen(open);
                                    if (!open) {
                                        setEditingPlan(null);
                                        setNewPlan({ name: '', price: '', interval: 'monthly', duration_days: 30, total_credits: 0 });
                                    }
                                }}>
                                    <DialogTrigger asChild>
                                        <Button size="sm" className="gap-2">
                                            <Plus className="h-3 w-3" /> {t('billing.new_plan')}
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[425px]">
                                        <DialogHeader>
                                            <DialogTitle className="flex items-center gap-2">
                                                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                                    <Briefcase className="h-5 w-5" />
                                                </div>
                                                {editingPlan ? t('billing.edit_plan') : t('billing.create_plan')}
                                            </DialogTitle>
                                            <DialogDescription>{t('billing.plan_desc')}</DialogDescription>
                                        </DialogHeader>
                                        <div className="grid gap-4 py-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="plan-name">{t('billing.plan_name')}</Label>
                                                <Input id="plan-name" placeholder="e.g. Unlimited Monthly" value={newPlan.name} onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })} />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="plan-price">{t('billing.price')}</Label>
                                                    <Input id="plan-price" type="number" placeholder="0.00" value={newPlan.price} onChange={(e) => setNewPlan({ ...newPlan, price: e.target.value })} />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="plan-type">{t('billing.type')}</Label>
                                                    <Select value={newPlan.interval} onValueChange={(val) => setNewPlan({ ...newPlan, interval: val })}>
                                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="monthly">{t('common.monthly')}</SelectItem>
                                                            <SelectItem value="credits">{t('billing.credits')}</SelectItem>
                                                            <SelectItem value="annual">{t('common.annual')}</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            {newPlan.interval === 'credits' && (
                                                <div className="grid gap-2">
                                                    <Label htmlFor="plan-credits">{t('billing.credits')}</Label>
                                                    <Input id="plan-credits" type="number" value={newPlan.total_credits} onChange={(e) => setNewPlan({ ...newPlan, total_credits: parseInt(e.target.value) })} />
                                                </div>
                                            )}
                                        </div>
                                        <Button onClick={handleCreatePlan} disabled={loading} className="w-full">
                                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : editingPlan ? t('billing.save_plan') : t('billing.new_plan')}
                                        </Button>
                                    </DialogContent>
                                </Dialog>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>{t('billing.plan_name')}</TableHead>
                                            <TableHead>{t('billing.type')}</TableHead>
                                            <TableHead className="text-right">{t('billing.price')}</TableHead>
                                            <TableHead className="w-[50px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {plans.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">{t('common.no_data')}</TableCell>
                                            </TableRow>
                                        ) : plans.map((plan: Plan) => (
                                            <TableRow key={plan.id}>
                                                <TableCell className="font-medium">{plan.name}</TableCell>
                                                <TableCell><Badge variant="secondary" className="capitalize text-[10px]">{plan.interval}</Badge></TableCell>
                                                <TableCell className="text-right font-mono text-primary">${plan.price}</TableCell>
                                                <TableCell>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0"><MoreVertical className="h-4 w-4" /></Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>{t('common.actions')}</DropdownMenuLabel>
                                                            <DropdownMenuItem onClick={() => openEditPlan(plan)}><Pencil className="mr-2 h-4 w-4" /> {t('common.edit')}</DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem onClick={() => handleDeletePlan(plan.id)} className="text-destructive focus:text-destructive">
                                                                <Trash2 className="mr-2 h-4 w-4" /> {t('common.delete')}
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="text-lg">{t('billing.expenses_title')}</CardTitle>
                                <Dialog open={isExpenseDialogOpen} onOpenChange={(open) => {
                                    setIsExpenseDialogOpen(open);
                                    if (!open) {
                                        setEditingExpense(null);
                                        setNewExpense({ description: '', category: 'Rent', amount: '', date: new Date().toISOString().split('T')[0], is_recurring: false, recurring_interval: 'monthly' });
                                    }
                                }}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" size="sm" className="gap-2">
                                            <Plus className="h-3 w-3" /> {t('billing.new_expense')}
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[425px]">
                                        <DialogHeader>
                                            <DialogTitle className="flex items-center gap-2">
                                                <div className="p-2 bg-primary/10 rounded-lg text-primary"><DollarSign className="h-5 w-5" /></div>
                                                {editingExpense ? t('billing.edit_expense') : t('billing.add_expense')}
                                            </DialogTitle>
                                            <DialogDescription>{t('billing.expense_desc')}</DialogDescription>
                                        </DialogHeader>
                                        <div className="grid gap-4 py-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="exp-desc">{t('billing.description')}</Label>
                                                <Input id="exp-desc" placeholder="e.g. Monthly Rent" value={newExpense.description} onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })} />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="exp-amount">{t('billing.amount')}</Label>
                                                    <Input id="exp-amount" type="number" placeholder="0.00" value={newExpense.amount} onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })} />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="exp-cat">{t('billing.category')}</Label>
                                                    <Select value={newExpense.category} onValueChange={(val) => setNewExpense({ ...newExpense, category: val })}>
                                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            {EXPENSE_CATEGORIES.map(cat => (
                                                                <SelectItem key={cat} value={cat}>{t(`billing.categories.${cat}`, { defaultValue: cat })}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="exp-date">{t('billing.date')}</Label>
                                                <div className="relative">
                                                    <Input id="exp-date" type="date" value={newExpense.date} onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })} />
                                                    <Calendar className="absolute right-3 top-2.5 h-4 w-4 opacity-50 pointer-events-none" />
                                                </div>
                                            </div>
                                        </div>
                                        <Button onClick={handleCreateExpense} disabled={loading} variant="destructive" className="w-full">
                                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : editingExpense ? t('billing.save_expense') : t('billing.new_expense')}
                                        </Button>
                                    </DialogContent>
                                </Dialog>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>{t('billing.description')}</TableHead>
                                            <TableHead>{t('billing.category')}</TableHead>
                                            <TableHead className="text-right">{t('billing.amount')}</TableHead>
                                            <TableHead className="w-[50px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredExpensesByDate.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">{t('common.no_data')}</TableCell>
                                            </TableRow>
                                        ) : filteredExpensesByDate.slice(0, 10).map((expense: Expense) => (
                                            <TableRow key={expense.id}>
                                                <TableCell className="text-sm">
                                                    <p className="font-medium leading-none">{expense.description}</p>
                                                    <p className="text-[10px] text-muted-foreground">{expense.date}</p>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="text-[10px]">
                                                        {t(`billing.categories.${expense.category}`, { defaultValue: expense.category })}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-red-500">-${expense.amount}</TableCell>
                                                <TableCell>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0"><MoreVertical className="h-4 w-4" /></Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>{t('common.actions')}</DropdownMenuLabel>
                                                            <DropdownMenuItem onClick={() => openEditExpense(expense)}><Pencil className="mr-2 h-4 w-4" /> {t('common.edit')}</DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem onClick={() => handleDeleteExpense(expense.id)} className="text-destructive focus:text-destructive">
                                                                <Trash2 className="mr-2 h-4 w-4" /> {t('common.delete')}
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="invoices" className="m-0">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-xl font-bold italic uppercase tracking-tight flex items-center gap-2">
                                <Receipt className="h-5 w-5 text-primary" />
                                {t('billing.payment_history')}
                            </CardTitle>
                            <div className="relative group w-64 hidden md:block">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    placeholder={t('common.search')}
                                    className="h-9 pl-9 bg-muted/20 border-border rounded-xl text-xs focus:bg-background transition-all"
                                    value={invoiceSearch}
                                    onChange={(e) => { setInvoiceSearch(e.target.value); setInvoicesPage(1); }}
                                />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50">
                                            <TableHead className="font-bold uppercase text-[10px] tracking-widest">{t('common.athlete')}</TableHead>
                                            <TableHead className="font-bold uppercase text-[10px] tracking-widest text-center">{t('billing.amount')}</TableHead>
                                            <TableHead className="font-bold uppercase text-[10px] tracking-widest text-center">{t('common.status')}</TableHead>
                                            <TableHead className="font-bold uppercase text-[10px] tracking-widest">{t('common.date')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredInvoicesSearch.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center py-10 text-muted-foreground text-sm">
                                                    {t('billing.no_invoices')}
                                                </TableCell>
                                            </TableRow>
                                        ) : paginatedInvoices.map((inv) => {
                                            const athlete = allAthletes.find(a => a.id === (inv.athlete_id || inv.user_id));
                                            return (
                                                <TableRow key={inv.id} className="hover:bg-muted/30 transition-colors">
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-sm uppercase">
                                                                {athlete ? `${athlete.first_name} ${athlete.last_name}` : t('billing.unknown_athlete')}
                                                            </span>
                                                            <span className="text-[10px] text-muted-foreground font-mono">
                                                                {athlete?.email || ''}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center font-mono font-bold text-green-500">
                                                        ${Number(inv.amount).toFixed(2)}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge variant={inv.status === 'paid' ? 'default' : 'destructive'} className="text-[10px] uppercase">
                                                            {t(`billing.status_${inv.status}`, { defaultValue: inv.status })}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-xs text-muted-foreground">
                                                        {inv.created_at.split('T')[0]} {inv.created_at.split('T')[1]?.substring(0, 5) || ''}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                                {invoicesTotalPages > 1 && (
                                    <PaginationBar
                                        currentPage={invoicesPage}
                                        totalPages={invoicesTotalPages}
                                        totalItems={filteredInvoicesSearch.length}
                                        itemsPerPage={itemsPerPage}
                                        onPageChange={setInvoicesPage}
                                        t={t}
                                    />
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="athletes" className="m-0">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-xl font-bold italic uppercase tracking-tight flex items-center gap-2">
                                <Users className="h-5 w-5 text-primary" />
                                {t('billing.athlete_status_title')}
                            </CardTitle>

                            <div className="flex items-center gap-3">
                                <div className="relative group w-64 hidden md:block">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <Input
                                        placeholder={t('common.search')}
                                        className="h-9 pl-9 bg-muted/20 border-border rounded-xl text-xs focus:bg-background transition-all"
                                        value={membershipSearch}
                                        onChange={(e) => { setMembershipSearch(e.target.value); setMembershipsPage(1); }}
                                    />
                                </div>
                                <Dialog open={isMembershipDialogOpen} onOpenChange={setIsMembershipDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button size="sm" className="h-10 gap-2 border-primary/20 bg-primary/10 text-primary hover:bg-primary/20">
                                            <Plus className="h-4 w-4" />
                                            {t('billing.add_membership')}
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[425px] glass border-border shadow-2xl p-0 overflow-visible">
                                        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none rounded-lg" />
                                        <DialogHeader className="p-6 pb-0 relative z-0">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="p-2 bg-primary/20 rounded-lg"><Users className="h-5 w-5 text-primary" /></div>
                                                <DialogTitle className="text-xl font-black italic uppercase tracking-tighter text-glow">{t('billing.add_membership')}</DialogTitle>
                                            </div>
                                            <DialogDescription className="text-[10px] uppercase tracking-widest font-bold opacity-60">
                                                {t('billing.add_membership_desc')}
                                            </DialogDescription>
                                        </DialogHeader>

                                        <div className="space-y-5 p-6 relative">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-foreground/70 ml-1">{t('billing.select_athlete')}</Label>
                                                <Select value={newMembership.userId} onValueChange={(val) => setNewMembership({ ...newMembership, userId: val })}>
                                                    <SelectTrigger className="h-12 bg-background border-border rounded-2xl focus:ring-primary/50 transition-all hover:bg-muted">
                                                        <SelectValue placeholder={t('billing.select_athlete')} />
                                                    </SelectTrigger>
                                                    <SelectContent className="glass border-border max-h-[300px] p-0 shadow-2xl">
                                                        <div className="p-2 border-b border-border sticky top-0 bg-background/80 backdrop-blur-md z-10">
                                                            <div className="relative">
                                                                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                                                                <Input
                                                                    placeholder={t('billing.search_athlete_placeholder')}
                                                                    className="h-9 pl-8 text-xs bg-muted/20 border-border rounded-xl"
                                                                    value={athleteSearch}
                                                                    onChange={(e) => setAthleteSearch(e.target.value)}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    onKeyDown={(e) => e.stopPropagation()}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="max-h-[220px] overflow-y-auto p-1 custom-scrollbar">
                                                            {allAthletes
                                                                .filter(a => `${a.first_name} ${a.last_name}`.toLowerCase().includes(athleteSearch.toLowerCase()))
                                                                .map(a => (
                                                                    <SelectItem key={a.id} value={a.id} className="focus:bg-primary/20 focus:text-primary transition-colors cursor-pointer rounded-lg py-3">
                                                                        <div className="flex flex-col gap-0.5">
                                                                            <span className="font-bold text-xs uppercase tracking-tight">{a.first_name} {a.last_name}</span>
                                                                            <span className="text-[9px] opacity-40 font-mono">{a.email}</span>
                                                                        </div>
                                                                    </SelectItem>
                                                                ))}
                                                        </div>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-foreground/70 ml-1">{t('billing.select_plan')}</Label>
                                                <Select value={newMembership.planId} onValueChange={(val) => setNewMembership({ ...newMembership, planId: val })}>
                                                    <SelectTrigger className="h-12 bg-background border-border rounded-2xl focus:ring-primary/50 transition-all hover:bg-muted">
                                                        <SelectValue placeholder={t('billing.select_plan')} />
                                                    </SelectTrigger>
                                                    <SelectContent className="glass border-border p-1 shadow-2xl">
                                                        {plans.map(p => (
                                                            <SelectItem key={p.id} value={p.id} className="focus:bg-primary/20 focus:text-primary transition-colors cursor-pointer rounded-lg py-3">
                                                                <div className="flex justify-between items-center w-full min-w-[200px]">
                                                                    <span className="font-bold text-xs uppercase tracking-tight">{p.name}</span>
                                                                    <span className="text-xs font-black italic text-primary">${p.price}</span>
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div
                                                className={cn(
                                                    "flex items-center space-x-3 p-4 rounded-2xl border transition-all duration-300 cursor-pointer group",
                                                    newMembership.isUnclear ? "bg-primary/20 border-primary/40" : "bg-muted/30 border-border hover:border-primary/30"
                                                )}
                                                onClick={() => setNewMembership({ ...newMembership, isUnclear: !newMembership.isUnclear })}
                                            >
                                                <div className={cn(
                                                    "h-6 w-6 rounded-xl border-2 flex items-center justify-center transition-all duration-300",
                                                    newMembership.isUnclear ? "bg-primary border-primary scale-110" : "border-muted-foreground/30 bg-muted/20"
                                                )}>
                                                    {newMembership.isUnclear && <CheckCircle2 className="h-4 w-4 text-foreground" strokeWidth={3} />}
                                                </div>
                                                <div className="flex flex-col">
                                                    <Label className="text-[11px] font-black uppercase tracking-tight cursor-pointer group-hover:text-primary transition-colors">{t('billing.unclear_start_date')}</Label>
                                                    <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest opacity-60">{t('billing.manual_activation_desc')}</span>
                                                </div>
                                            </div>

                                            {!newMembership.isUnclear && (
                                                <div className="space-y-2 animate-premium-in">
                                                    <Label className="text-[10px] font-black uppercase tracking-widest text-foreground/70 ml-1">{t('billing.start_date')}</Label>
                                                    <div className="relative group">
                                                        <Input type="date" className="h-12 bg-background border-border rounded-2xl pl-10 pr-4" value={newMembership.startDate} onChange={(e) => setNewMembership({ ...newMembership, startDate: e.target.value })} />
                                                        <Calendar className="absolute left-3.5 top-3.5 h-4 w-4 opacity-40 text-primary" />
                                                    </div>
                                                </div>
                                            )}

                                            <div className="pt-2 flex gap-3">
                                                <Button variant="outline" onClick={() => setIsMembershipDialogOpen(false)} className="h-14 flex-1 rounded-2xl border-border font-black italic uppercase tracking-wider text-sm">
                                                    {t('common.cancel')}
                                                </Button>
                                                <Button onClick={handleCreateMembership} disabled={loading || !newMembership.userId || !newMembership.planId} className="h-14 flex-[2] rounded-2xl font-black italic uppercase tracking-wider text-sm bg-gradient-to-r from-primary to-primary/80">
                                                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : t('common.confirm')}
                                                </Button>
                                            </div>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50">
                                            <TableHead className="font-bold uppercase text-[10px] tracking-widest italic">{t('common.athlete')}</TableHead>
                                            <TableHead className="font-bold uppercase text-[10px] tracking-widest italic">{t('billing.plan_name')}</TableHead>
                                            <TableHead className="font-bold uppercase text-[10px] tracking-widest italic text-center">{t('billing.installments')}</TableHead>
                                            <TableHead className="font-bold uppercase text-[10px] tracking-widest italic text-center">{t('common.status')}</TableHead>
                                            <TableHead className="font-bold uppercase text-[10px] tracking-widest italic">{t('billing.renewal_date')}</TableHead>
                                            <TableHead className="font-bold uppercase text-[10px] tracking-widest italic text-right">{t('common.actions')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginatedMemberships.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground italic">
                                                    {t('billing.no_memberships')}
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            paginatedMemberships.map((m) => (
                                                <TableRow key={m.id} className="hover:bg-muted/30 transition-colors">
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-sm uppercase italic">{m.profiles?.first_name} {m.profiles?.last_name}</span>
                                                            <span className="text-[10px] text-muted-foreground font-mono">{m.profiles?.email}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="font-bold uppercase text-[10px] tracking-tighter bg-primary/5 text-primary border-primary/20">
                                                            {plans.find(p => p.id === m.plan_id)?.name || 'Custom Plan'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex justify-center gap-3">
                                                            {[-1, 0, 1].map((offset) => {
                                                                const date = new Date();
                                                                date.setDate(1);
                                                                date.setMonth(date.getMonth() + offset);
                                                                const monthStr = format(date, 'MMM').toUpperCase();
                                                                const hasPayment = invoices.some(inv =>
                                                                    ((inv.athlete_id || inv.user_id) === (m.athlete_id || m.user_id)) &&
                                                                    new Date(inv.created_at).getMonth() === date.getMonth() &&
                                                                    new Date(inv.created_at).getFullYear() === date.getFullYear() &&
                                                                    inv.status === 'paid'
                                                                );
                                                                return (
                                                                    <div key={offset} className="flex flex-col items-center gap-1 min-w-[45px]">
                                                                        <div className={cn(
                                                                            "h-3 w-3 rounded-full transition-all duration-300 border",
                                                                            hasPayment ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)] border-green-400" : "bg-muted border-border"
                                                                        )} />
                                                                        <span className={cn("text-[7px] uppercase font-bold tracking-tighter", offset === 0 ? "text-primary" : "text-muted-foreground")}>
                                                                            {monthStr}
                                                                        </span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <div className="flex justify-center">
                                                            {m.status === 'active' ? (
                                                                <div className="group relative">
                                                                    <CheckCircle2 className="h-5 w-5 text-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.3)]" />
                                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-[8px] text-popover-foreground border shadow-sm uppercase font-bold italic rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{t('billing.status_paid')}</div>
                                                                </div>
                                                            ) : m.status === 'expired' ? (
                                                                <div className="group relative">
                                                                    <XCircle className="h-5 w-5 text-destructive drop-shadow-[0_0_8px_rgba(239,68,68,0.3)]" />
                                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-[8px] text-popover-foreground border shadow-sm uppercase font-bold italic rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{t('billing.status_overdue')}</div>
                                                                </div>
                                                            ) : m.status === 'pending' ? (
                                                                <div className="group relative">
                                                                    <Clock className="h-5 w-5 text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]" />
                                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-[8px] text-popover-foreground border shadow-sm uppercase font-bold italic rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{t('billing.status_pending_activation')}</div>
                                                                </div>
                                                            ) : (
                                                                <div className="group relative">
                                                                    <AlertCircle className="h-5 w-5 text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]" />
                                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-[8px] text-popover-foreground border shadow-sm uppercase font-bold italic rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{t('billing.status_pending')}</div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground">
                                                            <Calendar className="h-3 w-3" />
                                                            {m.end_date ? m.end_date : 'N/A'}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreVertical className="h-4 w-4" /></Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="w-48">
                                                                <DropdownMenuItem className="text-primary cursor-pointer font-bold" onClick={() => handleRenew(m)}>
                                                                    <Briefcase className="mr-2 h-4 w-4" /> {t('billing.renew')}
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem className="cursor-pointer" onClick={() => handleMarkPaid(m)}>
                                                                    <DollarSign className="mr-2 h-4 w-4" /> {t('billing.mark_paid')}
                                                                </DropdownMenuItem>
                                                                {m.status === 'pending' && (
                                                                    <DropdownMenuItem className="text-blue-500 cursor-pointer" onClick={() => handleActivateMembership(m.id, m.plan_id)}>
                                                                        <CheckCircle2 className="mr-2 h-4 w-4 text-blue-500" /> {t('billing.activate_now')}
                                                                    </DropdownMenuItem>
                                                                )}
                                                                <DropdownMenuItem className="cursor-pointer" onClick={() => handleExtend(m)}>
                                                                    <Calendar className="mr-2 h-4 w-4" /> {t('billing.extend')}
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem className="text-destructive focus:text-destructive cursor-pointer" onClick={() => handleDeleteMembership(m.id)}>
                                                                    <Trash2 className="mr-2 h-4 w-4" /> {t('billing.delete')}
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                                {membershipsTotalPages > 1 && (
                                    <PaginationBar
                                        currentPage={membershipsPage}
                                        totalPages={membershipsTotalPages}
                                        totalItems={filteredMembershipsSearch.length}
                                        itemsPerPage={itemsPerPage}
                                        onPageChange={setMembershipsPage}
                                        t={t}
                                    />
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {notification && (
                <Toast type={notification.type} message={notification.message} onClose={hideNotification} />
            )}

            <ConfirmationDialog
                isOpen={confirmState.isOpen}
                onClose={hideConfirm}
                onConfirm={confirmState.onConfirm}
                title={confirmState.title}
                description={confirmState.description}
                variant={confirmState.variant}
                icon={confirmState.icon}
            />
        </div>
    );
};

/* ------------------------------------------------------------------ */
/* Sub-components                                                      */
/* ------------------------------------------------------------------ */

function KpiCard({ label, value, subtext, icon, color, bgColor }: {
    label: string; value: string; subtext?: string;
    icon: React.ReactNode; color: string; bgColor: string;
}) {
    return (
        <Card className={cn("border", bgColor)}>
            <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
                    <span className={color}>{icon}</span>
                </div>
                <div className={cn("text-xl font-bold font-mono", color)}>{value}</div>
                {subtext && <span className="text-[10px] text-muted-foreground">{subtext}</span>}
            </CardContent>
        </Card>
    );
}

function PaginationBar({ currentPage, totalPages, totalItems, itemsPerPage, onPageChange, t }: {
    currentPage: number; totalPages: number; totalItems: number;
    itemsPerPage: number; onPageChange: (p: number) => void; t: any;
}) {
    return (
        <div className="flex items-center justify-between gap-4 p-4 border-t bg-muted/5">
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => onPageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="h-8 text-[10px] font-bold uppercase tracking-widest gap-2">
                    <ChevronLeft className="h-3 w-3" />
                    {t('common.previous')}
                </Button>
                <div className="flex items-center gap-1">
                    {[...Array(totalPages)].map((_, i) => (
                        <Button key={i} variant={currentPage === i + 1 ? "default" : "ghost"} size="sm" onClick={() => onPageChange(i + 1)} className="h-8 w-8 text-[10px] font-bold">
                            {i + 1}
                        </Button>
                    ))}
                </div>
                <Button variant="outline" size="sm" onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="h-8 text-[10px] font-bold uppercase tracking-widest gap-2">
                    {t('common.next')}
                    <ChevronRight className="h-3 w-3" />
                </Button>
            </div>
            <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                {t('common.showing')} {Math.min(totalItems, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(totalItems, currentPage * itemsPerPage)} {t('common.of')} {totalItems}
            </div>
        </div>
    );
}
