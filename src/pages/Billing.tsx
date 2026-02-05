import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useTranslation } from 'react-i18next';
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
    MoreVertical
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/hooks/useNotification';
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
import { Toast } from '@/components/ui/toast-custom';
import { cn } from '@/lib/utils';

interface Plan {
    id: string;
    name: string;
    price: number;
    type: string;
    duration_days?: number;
    total_credits?: number;
}

interface Expense {
    id: string;
    category: string;
    amount: number;
    date: string;
    description: string;
}

export const Billing: React.FC = () => {
    const { t } = useTranslation();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);
    const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
    const [estimatedIncome, setEstimatedIncome] = useState(0);
    const { currentBox } = useAuth();
    const { notification, showNotification: addNotification, hideNotification } = useNotification();

    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

    // Form states
    const [newPlan, setNewPlan] = useState({ name: '', price: '', type: 'monthly', duration_days: 30, total_credits: 0 });
    const [newExpense, setNewExpense] = useState({ description: '', category: 'Rent', amount: '', date: new Date().toISOString().split('T')[0] });

    useEffect(() => {
        fetchFinanceData();
    }, []);

    const fetchFinanceData = async () => {
        setLoading(true);
        try {
            const [plansRes, expensesRes, membershipsRes] = await Promise.all([
                supabase.from('plans').select('*').order('name'),
                supabase.from('expenses').select('*').order('date', { ascending: false }),
                supabase.from('memberships').select('*, plans(price)').eq('status', 'active')
            ]);

            if (plansRes.error) throw plansRes.error;
            if (expensesRes.error) throw expensesRes.error;

            setPlans((plansRes.data || []).map((p: any) => ({ ...p, type: p.interval })) || []);
            setExpenses((expensesRes.data as any) || []);

            // Calculate estimated income from active memberships
            const income = (membershipsRes.data || []).reduce((acc: number, m: any) => {
                return acc + (m.plans?.price || 0);
            }, 0);
            setEstimatedIncome(income);

        } catch (error: any) {
            console.error('Error fetching finance data:', error);
            addNotification('error', t('common.error_loading'));
        } finally {
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
            addNotification('success', `Plan ${editingPlan ? 'updated' : 'created'} successfully`);
            setIsPlanDialogOpen(false);
            setEditingPlan(null);
            setNewPlan({ name: '', price: '', type: 'monthly', duration_days: 30, total_credits: 0 });
            fetchFinanceData();
        }
        setLoading(false);
    };

    const handleDeletePlan = async (id: string) => {
        if (!window.confirm(t('billing.delete_confirm'))) return;
        setLoading(true);
        const { error } = await supabase.from('plans').delete().eq('id', id);
        if (error) {
            addNotification('error', 'Error deleting plan: ' + error.message);
        } else {
            addNotification('success', 'Plan deleted successfully');
            fetchFinanceData();
        }
        setLoading(false);
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
            addNotification('success', `Expense ${editingExpense ? 'updated' : 'recorded'} successfully`);
            setIsExpenseDialogOpen(false);
            setEditingExpense(null);
            setNewExpense({ description: '', category: 'Rent', amount: '', date: new Date().toISOString().split('T')[0] });
            fetchFinanceData();
        }
        setLoading(false);
    };

    const handleDeleteExpense = async (id: string) => {
        if (!window.confirm(t('billing.delete_expense_confirm'))) return;
        setLoading(true);
        const { error } = await supabase.from('expenses').delete().eq('id', id);
        if (error) {
            addNotification('error', 'Error deleting expense: ' + error.message);
        } else {
            addNotification('success', 'Expense deleted successfully');
            fetchFinanceData();
        }
        setLoading(false);
    };

    const openEditPlan = (plan: Plan) => {
        setEditingPlan(plan);
        setNewPlan({
            name: plan.name,
            price: plan.price.toString(),
            type: plan.type,
            duration_days: plan.duration_days || 30,
            total_credits: plan.total_credits || 0
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
                                    <TableHead>Plan Name</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead className="text-right">Price</TableHead>
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
                                            No plans defined.
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
                                                    {expense.category}
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
