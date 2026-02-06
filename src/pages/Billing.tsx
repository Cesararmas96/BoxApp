import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

import {
    Plus,
    TrendingUp,
    TrendingDown,
    DollarSign,
    Loader2,
    Calendar,
    Tag,
    Briefcase,
    Pencil,
    Trash2,
    MoreVertical,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Users
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
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
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

interface Plan {
    id: string;
    name: string;
    price: number;
    interval: string;
    duration_days: number;
    sessions_count?: number;
    has_limit?: boolean;
}

interface Expense {
    id: string;
    category: string;
    amount: number;
    date: string;
    description: string;
}

export const Billing: React.FC = () => {
    const { t } = useLanguage();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [memberships, setMemberships] = useState<any[]>([]);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);
    const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
    const [estimatedIncome, setEstimatedIncome] = useState(0);
    const { currentBox } = useAuth();
    const {
        notification,
        showNotification: addNotification,
        hideNotification,
        confirmState,
        showConfirm,
        hideConfirm
    } = useNotification();

    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

    // Form states
    const [newPlan, setNewPlan] = useState({ name: '', price: '', interval: 'monthly', duration_days: 30, sessions_count: 0, has_limit: false });
    const [newExpense, setNewExpense] = useState({ description: '', category: 'Rent', amount: '', date: new Date().toISOString().split('T')[0] });

    useEffect(() => {
        fetchFinanceData();
    }, []);

    const fetchFinanceData = async () => {
        setLoading(true);
        try {
            const [plansRes, expensesRes, membershipsRes, invoicesRes] = await Promise.all([
                supabase.from('plans').select('*').order('name'),
                supabase.from('expenses').select('*').order('date', { ascending: false }),
                supabase.from('memberships').select('*, plans(price)').eq('status', 'active'),
                supabase.from('invoices').select('*').order('created_at', { ascending: false })
            ]);

            if (plansRes.error) throw plansRes.error;
            if (expensesRes.error) throw expensesRes.error;

            setPlans(plansRes.data || []);
            setExpenses((expensesRes.data as any) || []);
            setInvoices(invoicesRes.data || []);

            // Calculate estimated income from active memberships
            const income = (membershipsRes.data || []).reduce((acc: number, m: any) => {
                return acc + (m.plans?.price || 0);
            }, 0);
            setEstimatedIncome(income);

        } catch (error: any) {
            console.error('Error fetching finance data:', error);
            addNotification('error', t('common.error_loading'));
        } finally {
            // Fetch Memberships for status overview
            const { data: membershipData } = await supabase
                .from('memberships')
                .select('*, profiles(first_name, last_name, email)')
                .eq('box_id', currentBox?.id);

            setMemberships(membershipData || []);
            setLoading(false);
        }
    };

    const handleCreatePlan = async () => {
        if (!newPlan.name || !newPlan.price) return;
        setLoading(true);
        const { type, ...restOfPlan } = newPlan;
        const planData = {
            ...restOfPlan,
            interval: type,
            price: parseFloat(newPlan.price as string),
            box_id: currentBox?.id
        };

        const { error } = editingPlan
            ? await supabase.from('plans').update(planData).eq('id', editingPlan.id)
            : await supabase.from('plans').insert([planData]);

        if (error) {
            addNotification('error', `Error ${editingPlan ? 'updating' : 'creating'} plan: ` + error.message);
        } else {
            addNotification('success', editingPlan ? t('billing.plan_updated') : t('billing.plan_created'));
            setIsPlanDialogOpen(false);
            setEditingPlan(null);
            setNewPlan({ name: '', price: '', type: 'monthly', duration_days: 30, total_credits: 0 });
            fetchFinanceData();
        }
        setLoading(false);
    };

    const handleDeletePlan = async (id: string) => {
        showConfirm({
            title: t('billing.delete_plan_title', { defaultValue: 'Delete Plan' }),
            description: t('billing.delete_confirm'),
            variant: 'destructive',
            icon: 'destructive',
            onConfirm: async () => {
                setLoading(true);
                const { error } = await supabase.from('plans').delete().eq('id', id);
                if (error) {
                    addNotification('error', 'Error deleting plan: ' + error.message);
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
            ...newExpense,
            amount: parseFloat(newExpense.amount as string),
            box_id: currentBox?.id
        };

        const { error } = editingExpense
            ? await supabase.from('expenses').update(expenseData).eq('id', editingExpense.id)
            : await supabase.from('expenses').insert([expenseData]);

        if (error) {
            addNotification('error', `Error ${editingExpense ? 'recording' : 'logging'} expense: ` + error.message);
        } else {
            addNotification('success', editingExpense ? t('billing.expense_updated') : t('billing.expense_logged'));
            setIsExpenseDialogOpen(false);
            setEditingExpense(null);
            setNewExpense({ description: '', category: 'Rent', amount: '', date: new Date().toISOString().split('T')[0] });
            fetchFinanceData();
        }
        setLoading(false);
    };

    const handleDeleteExpense = async (id: string) => {
        showConfirm({
            title: t('billing.delete_expense_title', { defaultValue: 'Delete Expense' }),
            description: t('billing.delete_expense_confirm'),
            variant: 'destructive',
            icon: 'destructive',
            onConfirm: async () => {
                setLoading(true);
                const { error } = await supabase.from('expenses').delete().eq('id', id);
                if (error) {
                    addNotification('error', 'Error deleting expense: ' + error.message);
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
                    user_id: membership.user_id,
                    box_id: currentBox?.id,
                    amount: amount,
                    status: 'paid',
                    due_date: new Date().toISOString()
                }]);

            if (invoiceError) throw invoiceError;

            // Update membership status to active and extend end_date
            const newEndDate = new Date();
            newEndDate.setDate(newEndDate.getDate() + (plan?.duration_days || 30));

            const { error: memberError } = await supabase
                .from('memberships')
                .update({
                    status: 'active',
                    end_date: newEndDate.toISOString()
                })
                .eq('id', membership.id);

            if (memberError) throw memberError;

            addNotification('success', t('billing.success_paid', { defaultValue: 'Payment recorded successfully' }));
            fetchFinanceData();
        } catch (error: any) {
            console.error('Error marking as paid:', error);
            addNotification('error', 'Error processing payment: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteMembership = async (id: string) => {
        showConfirm({
            title: t('billing.delete_membership_title', { defaultValue: 'Cancel Membership' }),
            description: t('billing.delete_membership_confirm', { defaultValue: 'Are you sure you want to delete this membership? This action cannot be undone.' }),
            variant: 'destructive',
            icon: 'destructive',
            onConfirm: async () => {
                setLoading(true);
                const { error } = await supabase
                    .from('memberships')
                    .delete()
                    .eq('id', id);

                if (error) {
                    addNotification('error', 'Error deleting membership: ' + error.message);
                } else {
                    addNotification('success', t('billing.membership_deleted'));
                    fetchFinanceData();
                }
                setLoading(false);
            }
        });
    };

    const openEditPlan = (plan: Plan) => {
        setEditingPlan(plan);
        setNewPlan({
            name: plan.name,
            price: plan.price.toString(),
            duration_days: plan.duration_days.toString(),
            interval: plan.interval,
            sessions_count: plan.sessions_count || 0,
            has_limit: plan.has_limit || false
        });
        setIsPlanDialogOpen(true);
    };

    const openEditExpense = (expense: Expense) => {
        setEditingExpense(expense);
        setNewExpense({
            description: expense.description,
            category: expense.category,
            amount: expense.amount.toString(),
            date: expense.date
        });
        setIsExpenseDialogOpen(true);
    };

    const totalExpenses = expenses.reduce((acc, curr) => acc + Number(curr.amount), 0);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{t('billing.title')}</h1>
                <p className="text-muted-foreground text-sm">{t('billing.subtitle')}</p>
            </div>

            <Tabs defaultValue="finance" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2 bg-muted/50 p-1 mb-6">
                    <TabsTrigger value="finance" className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Finances
                    </TabsTrigger>
                    <TabsTrigger value="athletes" className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Athletes Status
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="finance" className="space-y-6 m-0">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="border-green-500/20 bg-green-500/5">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">{t('billing.metrics_income')}</CardTitle>
                                <TrendingUp className="h-4 w-4 text-green-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold font-mono text-green-500">
                                    ${estimatedIncome.toFixed(2)}
                                </div>
                                <p className="text-xs text-muted-foreground">{t('billing.metrics_desc', { count: estimatedIncome / 100 })}</p>
                            </CardContent>
                        </Card>
                        <Card className="border-red-500/20 bg-red-500/5">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">{t('billing.metrics_expenses')}</CardTitle>
                                <TrendingDown className="h-4 w-4 text-red-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold font-mono text-red-500">
                                    ${totalExpenses.toFixed(2)}
                                </div>
                                <p className="text-xs text-muted-foreground">{t('common.no_data', { defaultValue: 'Total for current period' })}</p>
                            </CardContent>
                        </Card>
                        <Card className={cn(
                            "border-primary/20",
                            (estimatedIncome - totalExpenses) >= 0 ? "bg-primary/5" : "bg-destructive/5"
                        )}>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">{t('billing.metrics_profit')}</CardTitle>
                                <DollarSign className="h-4 w-4 text-primary" />
                            </CardHeader>
                            <CardContent>
                                <div className={cn(
                                    "text-2xl font-bold font-mono",
                                    (estimatedIncome - totalExpenses) >= 0 ? "text-primary" : "text-destructive"
                                )}>
                                    ${(estimatedIncome - totalExpenses).toFixed(2)}
                                </div>
                                <p className="text-xs text-muted-foreground">ROI analysis metrics</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="text-lg">{t('billing.plans_title')}</CardTitle>
                                <Dialog open={isPlanDialogOpen} onOpenChange={(open) => {
                                    setIsPlanDialogOpen(open);
                                    if (!open) {
                                        setEditingPlan(null);
                                        setNewPlan({ name: '', price: '', type: 'monthly', duration_days: 30, total_credits: 0 });
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
                                                <Tag className="h-5 w-5 text-primary" />
                                                {editingPlan ? t('billing.edit_plan') : t('billing.new_plan')}
                                            </DialogTitle>
                                            <DialogDescription className="sr-only">
                                                Configure plan details including name, price, and duration.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="grid gap-4 py-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="plan-name">{t('billing.plan_name')}</Label>
                                                <Input
                                                    id="plan-name"
                                                    placeholder="e.g. Unlimited Monthly"
                                                    value={newPlan.name}
                                                    onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="plan-price">{t('billing.price')}</Label>
                                                    <Input
                                                        id="plan-price"
                                                        type="number"
                                                        placeholder="0.00"
                                                        value={newPlan.price}
                                                        onChange={(e) => setNewPlan({ ...newPlan, price: e.target.value })}
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="plan-type">{t('billing.type')}</Label>
                                                    <Select
                                                        value={newPlan.type}
                                                        onValueChange={(val) => setNewPlan({ ...newPlan, type: val })}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="monthly">{t('common.monthly', { defaultValue: 'Monthly' })}</SelectItem>
                                                            <SelectItem value="credits">{t('billing.credits')}</SelectItem>
                                                            <SelectItem value="annual">{t('common.annual', { defaultValue: 'Annual' })}</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            {newPlan.type === 'credits' && (
                                                <div className="grid gap-2">
                                                    <Label htmlFor="plan-credits">{t('billing.credits')}</Label>
                                                    <Input
                                                        id="plan-credits"
                                                        type="number"
                                                        value={newPlan.total_credits}
                                                        onChange={(e) => setNewPlan({ ...newPlan, total_credits: parseInt(e.target.value) })}
                                                    />
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
                                        {loading ? (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center py-8">
                                                    <div className="animate-pulse space-y-2">
                                                        <div className="h-4 bg-muted rounded w-3/4 mx-auto"></div>
                                                        <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : plans.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                                                    {t('common.no_data')}
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            plans.map((plan) => (
                                                <TableRow key={plan.id}>
                                                    <TableCell className="font-medium">{plan.name}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="secondary" className="capitalize text-[10px]">
                                                            {plan.type}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono text-primary">${plan.price}</TableCell>
                                                    <TableCell>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                                    <MoreVertical className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuLabel>{t('common.actions')}</DropdownMenuLabel>
                                                                <DropdownMenuItem onClick={() => openEditPlan(plan)}>
                                                                    <Pencil className="mr-2 h-4 w-4" /> {t('common.edit')}
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    onClick={() => handleDeletePlan(plan.id)}
                                                                    className="text-destructive focus:text-destructive"
                                                                >
                                                                    <Trash2 className="mr-2 h-4 w-4" /> {t('common.delete')}
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
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
                                        setNewExpense({ description: '', category: 'Rent', amount: '', date: new Date().toISOString().split('T')[0] });
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
                                                <Briefcase className="h-5 w-5 text-destructive" />
                                                {editingExpense ? t('billing.edit_expense') : t('billing.new_expense')}
                                            </DialogTitle>
                                            <DialogDescription className="sr-only">
                                                Register or edit business expenses to track your box finances.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="grid gap-4 py-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="exp-desc">{t('billing.description')}</Label>
                                                <Input
                                                    id="exp-desc"
                                                    placeholder="e.g. Monthly Rent"
                                                    value={newExpense.description}
                                                    onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="exp-amount">{t('billing.amount')}</Label>
                                                    <Input
                                                        id="exp-amount"
                                                        type="number"
                                                        placeholder="0.00"
                                                        value={newExpense.amount}
                                                        onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="exp-cat">{t('billing.category')}</Label>
                                                    <Select
                                                        value={newExpense.category}
                                                        onValueChange={(val) => setNewExpense({ ...newExpense, category: val })}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Rent">{t('billing.categories.Rent')}</SelectItem>
                                                            <SelectItem value="Utilities">{t('billing.categories.Utilities')}</SelectItem>
                                                            <SelectItem value="Equipment">{t('billing.categories.Equipment')}</SelectItem>
                                                            <SelectItem value="Staff">{t('billing.categories.Staff')}</SelectItem>
                                                            <SelectItem value="Marketing">{t('billing.categories.Marketing')}</SelectItem>
                                                            <SelectItem value="Other">{t('billing.categories.Other')}</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="exp-date">{t('billing.date')}</Label>
                                                <div className="relative">
                                                    <Input
                                                        id="exp-date"
                                                        type="date"
                                                        value={newExpense.date}
                                                        onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                                                    />
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
                                        {loading ? (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center py-8">
                                                    <div className="animate-pulse space-y-2">
                                                        <div className="h-4 bg-muted rounded w-3/4 mx-auto"></div>
                                                        <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : expenses.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                                                    {t('common.no_data', { defaultValue: 'No expenses recorded.' })}
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            expenses.map((expense) => (
                                                <TableRow key={expense.id}>
                                                    <TableCell className="text-sm">
                                                        <p className="font-medium lead-none">{expense.description}</p>
                                                        <p className="text-[10px] text-muted-foreground">{new Date(expense.date).toLocaleDateString()}</p>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="text-[10px]">
                                                            {t(`billing.categories.${expense.category}`, { defaultValue: expense.category })}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono text-red-500">
                                                        -${expense.amount}
                                                    </TableCell>
                                                    <TableCell>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                                    <MoreVertical className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuLabel>{t('common.actions')}</DropdownMenuLabel>
                                                                <DropdownMenuItem onClick={() => openEditExpense(expense)}>
                                                                    <Pencil className="mr-2 h-4 w-4" /> {t('common.edit')}
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    onClick={() => handleDeleteExpense(expense.id)}
                                                                    className="text-destructive focus:text-destructive"
                                                                >
                                                                    <Trash2 className="mr-2 h-4 w-4" /> {t('common.delete')}
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="athletes" className="m-0">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl font-bold italic uppercase tracking-tight flex items-center gap-2">
                                <Users className="h-5 w-5 text-primary" />
                                Monthly Payments & Status
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50">
                                            <TableHead className="font-bold uppercase text-[10px] tracking-widest italic">Athlete</TableHead>
                                            <TableHead className="font-bold uppercase text-[10px] tracking-widest italic">Plan</TableHead>
                                            <TableHead className="font-bold uppercase text-[10px] tracking-widest italic text-center">Installments</TableHead>
                                            <TableHead className="font-bold uppercase text-[10px] tracking-widest italic text-center">Status</TableHead>
                                            <TableHead className="font-bold uppercase text-[10px] tracking-widest italic">Renewal</TableHead>
                                            <TableHead className="font-bold uppercase text-[10px] tracking-widest italic text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {memberships.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground italic">
                                                    No membership records found for this box.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            memberships.map((m) => (
                                                <TableRow key={m.id} className="hover:bg-muted/30 transition-colors">
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-sm uppercase italic">
                                                                {m.profiles?.first_name} {m.profiles?.last_name}
                                                            </span>
                                                            <span className="text-[10px] text-muted-foreground font-mono">
                                                                {m.profiles?.email}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="font-bold uppercase text-[10px] tracking-tighter bg-primary/5 text-primary border-primary/20">
                                                            {plans.find(p => p.id === m.plan_id)?.name || 'Custom Plan'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex justify-center gap-1">
                                                            {[...Array(6)].map((_, i) => {
                                                                const date = new Date();
                                                                date.setMonth(date.getMonth() - (5 - i));
                                                                const monthStr = date.toLocaleString('default', { month: 'short' });
                                                                const hasPayment = invoices.some(inv =>
                                                                    inv.user_id === m.user_id &&
                                                                    new Date(inv.created_at).getMonth() === date.getMonth() &&
                                                                    new Date(inv.created_at).getFullYear() === date.getFullYear() &&
                                                                    inv.status === 'paid'
                                                                );

                                                                return (
                                                                    <div key={i} className="flex flex-col items-center gap-1">
                                                                        <div className={cn(
                                                                            "h-2 w-2 rounded-full transition-all duration-300",
                                                                            hasPayment ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-zinc-800"
                                                                        )} />
                                                                        <span className="text-[7px] text-muted-foreground uppercase font-bold">{t(`billing.months.${monthStr}`, { defaultValue: monthStr })}</span>
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
                                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-[8px] text-white uppercase font-bold italic rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                                                        {t('billing.status_paid')}
                                                                    </div>
                                                                </div>
                                                            ) : m.status === 'expired' ? (
                                                                <div className="group relative">
                                                                    <XCircle className="h-5 w-5 text-destructive drop-shadow-[0_0_8px_rgba(239,68,68,0.3)]" />
                                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-[8px] text-white uppercase font-bold italic rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                                                        {t('billing.status_overdue')}
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="group relative">
                                                                    <AlertCircle className="h-5 w-5 text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]" />
                                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-[8px] text-white uppercase font-bold italic rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                                                        {t('billing.status_pending')}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground">
                                                            <Calendar className="h-3 w-3" />
                                                            {m.end_date ? new Date(m.end_date).toLocaleDateString() : 'N/A'}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-zinc-800">
                                                                    <MoreVertical className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="w-40 bg-zinc-900 border-zinc-800">
                                                                <DropdownMenuItem
                                                                    className="text-zinc-400 focus:text-white cursor-pointer"
                                                                    onClick={() => handleMarkPaid(m)}
                                                                >
                                                                    <DollarSign className="mr-2 h-4 w-4" /> {t('billing.mark_paid')}
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem className="text-zinc-400 focus:text-white cursor-pointer">
                                                                    <Calendar className="mr-2 h-4 w-4" /> {t('common.edit', { defaultValue: 'Extend' })}
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator className="bg-zinc-800" />
                                                                <DropdownMenuItem
                                                                    className="text-destructive focus:text-destructive cursor-pointer"
                                                                    onClick={() => handleDeleteMembership(m.id)}
                                                                >
                                                                    <Trash2 className="mr-2 h-4 w-4" /> {t('common.delete')}
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {notification && (
                <Toast
                    type={notification.type}
                    message={notification.message}
                    onClose={hideNotification}
                />
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
