import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    History,
    Plus,
    Activity,
    Search
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
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
    notes: string | null;
    movements: {
        name: string;
        category: string;
    }
}

export const Benchmarks: React.FC = () => {
    const { t } = useTranslation();
    const { user, currentBox } = useAuth();
    const [benchmarks, setBenchmarks] = useState<Benchmark[]>([]);
    const [prs, setPrs] = useState<PR[]>([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [consistencyScore, setConsistencyScore] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    useEffect(() => {
        fetchPRData();
    }, []);

    const fetchPRData = async () => {
        setLoading(true);
        if (!user || !currentBox) return;

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const [benchRes, prRes, attendanceRes] = await Promise.all([
            supabase.from('movements').select('*').eq('box_id', currentBox.id),
            supabase.from('personal_records')
                .select('*, movements(name, category)')
                .eq('user_id', user.id)
                .eq('box_id', currentBox.id)
                .order('performed_at', { ascending: false }),
            supabase.from('bookings')
                .select('id')
                .eq('user_id', user.id)
                .eq('box_id', currentBox.id)
                .eq('status', 'attended')
                .gt('created_at', thirtyDaysAgo.toISOString())
        ]);

        if (!benchRes.error) setBenchmarks(benchRes.data as unknown as Benchmark[] || []);
        if (!prRes.error) setPrs(prRes.data as unknown as PR[] || []);

        // Calculate consistency - Target 12 sessions / month = 100%
        const attendanceCount = attendanceRes.data?.length || 0;
        setConsistencyScore(Math.min(100, Math.round((attendanceCount / 12) * 100)));

        setLoading(false);
    };

    const paginatedPrs = prs.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const totalPages = Math.ceil(prs.length / itemsPerPage);

    const handleAddPR = async () => {
        if (!user || !currentBox) return;

        const { error } = await supabase
            .from('personal_records')
            .insert([{
                user_id: user.id,
                box_id: currentBox.id,
                movement_id: newPR.benchmarkId,
                value: newPR.value,
                notes: newPR.notes,
                performed_at: new Date().toISOString()
            }]);

        if (!error) {
            setOpen(false);
            setNewPR({ benchmarkId: '', value: '', notes: '' });
            fetchPRData();
        } else {
            console.error('Error logging PR:', error);
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
                                <div className="space-y-2">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search movement..."
                                            className="pl-9"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <div className="max-h-[200px] overflow-y-auto border rounded-md p-1 bg-black/5 dark:bg-white/5">
                                        {benchmarks
                                            .filter(b => b.name.toLowerCase().includes(searchTerm.toLowerCase()) || b.category?.toLowerCase().includes(searchTerm.toLowerCase()))
                                            .map(b => (
                                                <button
                                                    key={b.id}
                                                    type="button"
                                                    onClick={() => setNewPR({ ...newPR, benchmarkId: b.id })}
                                                    className={cn(
                                                        "w-full text-left px-3 py-2 rounded-md text-sm transition-colors mb-1",
                                                        newPR.benchmarkId === b.id
                                                            ? "bg-primary text-primary-foreground font-bold"
                                                            : "hover:bg-primary/10 text-muted-foreground hover:text-foreground"
                                                    )}
                                                >
                                                    <div className="flex justify-between items-center">
                                                        <span>{b.name}</span>
                                                        <Badge variant="outline" className="text-[9px] uppercase tracking-tighter opacity-70">
                                                            {b.category || 'Standard'}
                                                        </Badge>
                                                    </div>
                                                </button>
                                            ))}
                                        {benchmarks.length === 0 && (
                                            <p className="text-center py-4 text-xs text-muted-foreground">No movements found</p>
                                        )}
                                    </div>
                                </div>
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
                                                {pr.notes || '-'}
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
                            {(() => {
                                // Extract numeric value for comparison
                                const parseWeight = (val: string) => {
                                    const num = parseFloat(val.replace(/[^0-9.]/g, ''));
                                    return isNaN(num) ? 0 : num;
                                };

                                return ['Back Squat', 'Front Squat', 'Deadlift', 'Clean & Jerk', 'Snatch', 'Bench Press'].map(movementName => {
                                    const movementsPRs = prs.filter(p => p.movements.name.toLowerCase() === movementName.toLowerCase());
                                    const best = movementsPRs.length > 0
                                        ? movementsPRs.reduce((prev, curr) => parseWeight(curr.value) > parseWeight(prev.value) ? curr : prev)
                                        : null;

                                    // Always show these three, others only if they exist
                                    const isCore = ['Back Squat', 'Clean & Jerk', 'Snatch'].includes(movementName);
                                    if (!best && !isCore) return null;

                                    return (
                                        <div key={movementName} className="flex items-center justify-between border-b pb-2 last:border-0 group">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{movementName}</span>
                                            <span className="font-mono font-black text-primary group-hover:scale-110 transition-transform">
                                                {best?.value || "---"}
                                            </span>
                                        </div>
                                    )
                                }).filter(Boolean);
                            })()}
                        </CardContent>
                    </Card>

                    <Card className="bg-primary/5 border-primary/20">
                        <CardContent className="pt-6">
                            <div className="flex flex-col items-center text-center space-y-2">
                                <Activity className="h-10 w-10 text-primary animate-pulse" />
                                <h3 className="text-xs font-black uppercase tracking-[0.2em]">{t('analytics.attendance')} Score</h3>
                                <div className="text-4xl font-black italic italic tracking-tighter text-primary">{consistencyScore}%</div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 leading-none">Last 30 days active track</p>
                                <div className="h-1.5 w-full bg-primary/10 rounded-full mt-4 overflow-hidden border border-primary/5">
                                    <div
                                        className="h-full bg-primary transition-all duration-1000 shadow-[0_0_15px_rgba(var(--primary),0.5)]"
                                        style={{ width: `${consistencyScore}%` }}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};
