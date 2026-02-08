import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    History,
    Plus,
    Activity
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
    DialogDescription,
    DialogTrigger,
    DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';

interface Benchmark {
    id: string;
    name: string;
    category: string;
}

interface PR {
    id: string;
    movement_id: string;
    value: string;
    performed_at: string;
    movements: {
        name: string;
    }
}

export const Benchmarks: React.FC = () => {
    const { user } = useAuth();
    const [benchmarks, setBenchmarks] = useState<Benchmark[]>([]);
    const [prs, setPrs] = useState<PR[]>([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [newPR, setNewPR] = useState({ benchmarkId: '', value: '', notes: '' });
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        fetchPRData();
    }, []);

    const fetchPRData = async () => {
        setLoading(true);
        if (!user) return;

        const [benchRes, prRes] = await Promise.all([
            supabase.from('movements').select('*'),
            supabase.from('personal_records')
                .select('*, movements(name)')
                .eq('user_id', user.id)
                .order('performed_at', { ascending: false })
        ]);

        if (!benchRes.error) setBenchmarks(benchRes.data as unknown as Benchmark[] || []);
        if (!prRes.error) setPrs(prRes.data as unknown as PR[] || []);
        setLoading(false);
    };

    const paginatedPrs = prs.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const totalPages = Math.ceil(prs.length / itemsPerPage);

    const handleAddPR = async () => {
        if (!user) return;

        const { error } = await supabase
            .from('personal_records')
            .insert([{
                user_id: user.id,
                movement_id: newPR.benchmarkId,
                value: newPR.value,
                performed_at: new Date().toISOString()
            }]);

        if (!error) {
            setOpen(false);
            setNewPR({ benchmarkId: '', value: '', notes: '' });
            fetchPRData();
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Benchmarks & PRs</h1>
                    <p className="text-muted-foreground text-sm">Track your performance milestones and all-time records.</p>
                </div>

                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" /> Log New PR
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Register Personal Record</DialogTitle>
                            <DialogDescription className="sr-only">
                                Log your progress and keep track of your performance milestones.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Select Benchmark</label>
                                <select
                                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={newPR.benchmarkId}
                                    onChange={(e) => setNewPR({ ...newPR, benchmarkId: e.target.value })}
                                >
                                    <option value="">-- Choose --</option>
                                    {benchmarks.map(b => (
                                        <option key={b.id} value={b.id}>{b.name} ({b.category})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Result (e.g. 100kg, 10:00, 50 reps)</label>
                                <Input
                                    placeholder="Value"
                                    value={newPR.value}
                                    onChange={(e) => setNewPR({ ...newPR, value: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Notes (Optional)</label>
                                <Input
                                    placeholder="Feelings, context..."
                                    value={newPR.notes}
                                    onChange={(e) => setNewPR({ ...newPR, notes: e.target.value })}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                            <Button onClick={handleAddPR} disabled={!newPR.benchmarkId || !newPR.value}>Save PR</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* PR History */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <History className="h-5 w-5 text-primary" /> History of PRs
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Benchmark</TableHead>
                                    <TableHead>Record</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Notes</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-8">
                                            <div className="animate-pulse space-y-2">
                                                <div className="h-4 bg-muted rounded w-3/4 mx-auto"></div>
                                                <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : prs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                            No PRs logged yet. Get after it!
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedPrs.map((pr) => (
                                        <TableRow key={pr.id}>
                                            <TableCell className="font-bold">{pr.movements.name}</TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="font-mono text-sm px-3">
                                                    {pr.value}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {new Date(pr.performed_at).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-xs italic truncate max-w-[150px]">
                                                -
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between gap-4 p-4 border-t bg-muted/5 rounded-b-[2.5rem]">
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="h-8 px-2 font-bold uppercase text-[9px] tracking-widest gap-1"
                                >
                                    Prev
                                </Button>
                                <div className="flex items-center gap-1">
                                    {[...Array(totalPages)].map((_, i) => {
                                        const pageNumber = i + 1;
                                        if (
                                            pageNumber === 1 ||
                                            pageNumber === totalPages ||
                                            Math.abs(pageNumber - currentPage) <= 1
                                        ) {
                                            return (
                                                <Button
                                                    key={pageNumber}
                                                    variant={currentPage === pageNumber ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => setCurrentPage(pageNumber)}
                                                    className="h-8 w-8 font-bold text-[9px]"
                                                >
                                                    {pageNumber}
                                                </Button>
                                            );
                                        } else if (
                                            pageNumber === currentPage - 2 ||
                                            pageNumber === currentPage + 2
                                        ) {
                                            return <span key={pageNumber} className="text-muted-foreground text-xs">...</span>;
                                        }
                                        return null;
                                    })}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className="h-8 px-2 font-bold uppercase text-[9px] tracking-widest gap-1"
                                >
                                    Next
                                </Button>
                            </div>
                            <div className="hidden sm:block text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
                                Showing <span className="text-primary">{Math.min(prs.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(prs.length, currentPage * itemsPerPage)}</span> of {prs.length} records
                            </div>
                        </div>
                    )}
                </Card>

                {/* Categories / Quick Stats */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">Top Lifts</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {['Back Squat', 'Deadlift', 'Clean & Jerk'].map(movementName => {
                                const best = prs.find(p => p.movements.name.toLowerCase() === movementName.toLowerCase());
                                return (
                                    <div key={movementName} className="flex items-center justify-between border-b pb-2 last:border-0">
                                        <span className="text-sm font-medium capitalize">{movementName}</span>
                                        <span className="font-mono font-bold text-primary">{best?.value || "N/A"}</span>
                                    </div>
                                )
                            })}
                        </CardContent>
                    </Card>

                    <Card className="bg-primary/5 border-primary/20">
                        <CardContent className="pt-6">
                            <div className="flex flex-col items-center text-center space-y-2">
                                <Activity className="h-8 w-8 text-primary" />
                                <h3 className="font-bold">Consistency Score</h3>
                                <p className="text-2xl font-black text-primary">85%</p>
                                <p className="text-xs text-muted-foreground">Based on your activity in the last 30 days.</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};
