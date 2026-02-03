import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    Plus,
    TrendingUp,
    TrendingDown,
    DollarSign,
    AlertCircle
} from 'lucide-react';
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
    const [plans, setPlans] = useState<Plan[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFinanceData();
    }, []);

    const fetchFinanceData = async () => {
        setLoading(true);
        const [plansRes, expensesRes] = await Promise.all([
            supabase.from('plans').select('*'),
            supabase.from('expenses').select('*').order('date', { ascending: false })
        ]);

        if (!plansRes.error) setPlans(plansRes.data || []);
        if (!expensesRes.error) setExpenses(expensesRes.data || []);
        setLoading(false);
    };

    const totalExpenses = expenses.reduce((acc, curr) => acc + Number(curr.amount), 0);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Finance & Billing</h1>
                <p className="text-muted-foreground text-sm">Manage membership plans, invoices, and operating costs.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-green-500/20 bg-green-500/5">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Estimated Income</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-mono">$0.00</div>
                        <p className="text-xs text-muted-foreground">Based on active memberships</p>
                    </CardContent>
                </Card>
                <Card className="border-red-500/20 bg-red-500/5">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Operating Expenses</CardTitle>
                        <TrendingDown className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-mono">
                            ${totalExpenses.toFixed(2)}
                        </div>
                        <p className="text-xs text-muted-foreground">Total for current period</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Net Profitability</CardTitle>
                        <DollarSign className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-mono">--</div>
                        <p className="text-xs text-muted-foreground">ROI analysis enabled</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg">Membership Plans</CardTitle>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button size="sm" className="gap-2">
                                    <Plus className="h-3 w-3" /> New Plan
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Create New Plan</DialogTitle>
                                </DialogHeader>
                                <div className="py-8 text-center text-muted-foreground">
                                    <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                    <p className="text-sm italic">Plan configuration module coming soon.</p>
                                </div>
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
                                            <TableCell className="text-right font-mono">${plan.price}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg">Recent Expenses</CardTitle>
                        <Button variant="outline" size="sm" className="gap-2">
                            <Plus className="h-3 w-3" /> Add Expense
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
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
                                            No expenses recorded.
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
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
