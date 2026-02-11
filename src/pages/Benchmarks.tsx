import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    History,
    Plus,
    Activity,
    Search
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
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
    const [newPR, setNewPR] = useState({ benchmarkId: '', value: '', notes: '' });
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
            }] as any);

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
                    <h1 className="text-4xl font-black italic uppercase tracking-tighter">{t('benchmarks.title')}</h1>
                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-widest opacity-70">{t('benchmarks.subtitle')}</p>
                </div>

                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2 font-black uppercase tracking-widest text-[10px] py-6 px-8 rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 transition-all">
                            <Plus className="h-4 w-4" /> {t('benchmarks.log_new')}
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{t('benchmarks.register_title')}</DialogTitle>
                            <DialogDescription className="sr-only">
                                {t('benchmarks.register_desc')}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">{t('benchmarks.select_benchmark')}</label>
                                {!newPR.benchmarkId ? (
                                    <div className="space-y-2">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder={t('benchmarks.search_placeholder')}
                                                className="pl-9"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                autoFocus
                                            />
                                        </div>
                                        <div className="max-h-[250px] overflow-y-auto border rounded-2xl p-2 bg-black/5 dark:bg-white/5 space-y-1">
                                            {benchmarks
                                                .filter(b => b.name.toLowerCase().includes(searchTerm.toLowerCase()) || b.category?.toLowerCase().includes(searchTerm.toLowerCase()))
                                                .map(b => (
                                                    <button
                                                        key={b.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setNewPR({ ...newPR, benchmarkId: b.id });
                                                            setSearchTerm(''); // Clear search for next time
                                                        }}
                                                        className="w-full text-left px-4 py-3 rounded-xl text-sm transition-all hover:bg-primary/10 hover:translate-x-1 group"
                                                    >
                                                        <div className="flex justify-between items-center">
                                                            <span className="font-bold group-hover:text-primary transition-colors">{b.name}</span>
                                                            <Badge variant="outline" className="text-[9px] uppercase tracking-tighter opacity-70">
                                                                {b.category || 'Standard'}
                                                            </Badge>
                                                        </div>
                                                    </button>
                                                ))}
                                            {benchmarks.length === 0 && (
                                                <p className="text-center py-8 text-xs text-muted-foreground italic">{t('benchmarks.no_movements')}</p>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between p-4 rounded-2xl bg-primary/10 border border-primary/20 animate-in fade-in zoom-in duration-300">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-primary leading-none mb-1">{t('benchmarks.target_benchmark')}</span>
                                            <span className="text-sm font-black uppercase italic tracking-tight">
                                                {benchmarks.find(b => b.id === newPR.benchmarkId)?.name}
                                            </span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setNewPR({ ...newPR, benchmarkId: '' })}
                                            className="text-[9px] font-black uppercase tracking-widest hover:bg-primary/20"
                                        >
                                            {t('benchmarks.change')}
                                        </Button>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">{t('benchmarks.value_placeholder')}</label>
                                <Input
                                    placeholder={t('common.search')}
                                    value={newPR.value}
                                    onChange={(e) => setNewPR({ ...newPR, value: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">{t('benchmarks.notes_placeholder')}</label>
                                <Input
                                    placeholder={t('benchmarks.notes_hint')}
                                    value={newPR.notes}
                                    onChange={(e) => setNewPR({ ...newPR, notes: e.target.value })}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setOpen(false)}>{t('common.cancel')}</Button>
                            <Button onClick={handleAddPR} disabled={!newPR.benchmarkId || !newPR.value}>{t('benchmarks.save_btn')}</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* PR History */}
                <Card className="lg:col-span-2 shadow-2xl shadow-primary/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl font-black italic uppercase tracking-tight">
                            <History className="h-5 w-5 text-primary" /> {t('benchmarks.history_title')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-primary/10">
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest">{t('benchmarks.table_movement')}</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest">{t('benchmarks.table_value')}</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest">{t('benchmarks.table_date')}</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest">{t('benchmarks.table_notes')}</TableHead>
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
                                Showing <span className="text-primary">{Math.min(prs.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(prs.length, currentPage * itemsPerPage)}</span> of {prs.length} {t('benchmarks.history_title').toLowerCase()}
                            </div>
                        </div>
                    )}
                </Card>

                {/* Categories / Quick Stats */}
                <div className="space-y-6">
                    <Card className="shadow-2xl shadow-primary/5">
                        <CardHeader>
                            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60">{t('benchmarks.top_lifts')}</CardTitle>
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
                                <h3 className="text-xs font-black uppercase tracking-[0.2em]">{t('benchmarks.consistency_score')}</h3>
                                <div className="text-4xl font-black italic italic tracking-tighter text-primary">{consistencyScore}%</div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 leading-none">{t('benchmarks.consistency_desc')}</p>
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
