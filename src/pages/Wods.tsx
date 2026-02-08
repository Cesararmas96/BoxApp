import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import {
    Plus,
    Trophy,
    Activity,
    Timer,
    Target,
    Loader2,
    Calendar,
    Search,
    Trash2,
    Dumbbell,
    Zap as ZapIcon,
    Shield,
    Copy,
    Pencil,
    Check,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { WODDesigner, SessionBlock, LessonBlock } from '@/components/WODDesigner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useLanguage, useNotification } from '@/hooks';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Toast } from '@/components/ui/toast-custom';

interface WOD {
    id: string;
    title: string;
    date: string;
    metcon: string;
    stimulus: string;
    scaling_options: string;
    lesson_plan: LessonBlock[];
    scaling_beginner: string;
    scaling_intermediate: string;
    scaling_advanced: string;
    scaling_injured: string;
    modalities: string[];
    track: 'CrossFit' | 'Novice' | 'Bodybuilding' | 'Engine';
    structure?: SessionBlock[];
}

const TRACKS = ['CrossFit', 'Novice', 'Bodybuilding', 'Engine'];



export const Wods: React.FC = () => {
    const { t } = useLanguage();
    const { user, currentBox } = useAuth();
    const [wods, setWods] = useState<WOD[]>([]);
    const [loading, setLoading] = useState(true);
    const [showEditor, setShowEditor] = useState(false);
    const [editingWodId, setEditingWodId] = useState<string | null>(null);
    const [isCopying, setIsCopying] = useState<string | null>(null);
    const [activeTrack, setActiveTrack] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    // UI State for Editor
    const [newWOD, setNewWOD] = useState({
        title: '',
        metcon: '',
        stimulus: '',
        scaling_options: '',
        scaling_beginner: '',
        scaling_intermediate: '',
        scaling_advanced: '',
        scaling_injured: '',
        modalities: [] as string[],
        lesson_plan: [] as LessonBlock[],
        track: 'CrossFit' as any,
        date: new Date().toISOString().split('T')[0]
    });

    const [sessionBlocks, setSessionBlocks] = useState<SessionBlock[]>([]);
    const [movements, setMovements] = useState<any[]>([]);
    const [userPRs, setUserPRs] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const { notification, showNotification, hideNotification, confirmState, showConfirm, hideConfirm } = useNotification();


    useEffect(() => {
        if (currentBox) {
            fetchWods();
            fetchUserPRs();
            fetchMovements();
        }
    }, [currentBox, user]);

    const fetchMovements = async () => {
        if (!currentBox) return;
        const { data } = await supabase
            .from('movements')
            .select('*')
            .eq('box_id', currentBox.id)
            .order('name');
        if (data) setMovements(data);
    };

    const generateBlockContent = (block: SessionBlock) => {
        let header = '';
        if (block.sets) header = `**[${block.sets} SETS]**\n`;

        const items = block.items.map(item => {
            let line = `- **${item.movementName}**:`;
            if (item.reps) line += ` ${item.reps}`;
            if (item.weight) line += ` (${item.weight})`;
            if (item.notes) line += ` // ${item.notes}`;
            return line;
        }).join('\n');

        return header + items;
    };



    const fetchWods = async () => {
        if (!currentBox) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('wods')
            .select('*')
            .eq('box_id', currentBox.id)
            .order('date', { ascending: false });

        if (!error && data) {
            setWods(data.map((w: any) => ({
                ...w,
                modalities: w.modalities || [],
                lesson_plan: w.lesson_plan || [],
                track: w.track || 'CrossFit',
                metcon: w.metcon || '',
                stimulus: w.stimulus || '',
                scaling_options: w.scaling_options || '',
                scaling_beginner: w.scaling_beginner || '',
                scaling_intermediate: w.scaling_intermediate || '',
                scaling_advanced: w.scaling_advanced || '',
                scaling_injured: w.scaling_injured || ''
            })));
        }
        setLoading(false);
    };

    const handleEditWod = (wod: WOD) => {
        setEditingWodId(wod.id);
        setNewWOD({
            title: wod.title,
            metcon: wod.metcon,
            stimulus: wod.stimulus,
            scaling_options: wod.scaling_options,
            scaling_beginner: wod.scaling_beginner,
            scaling_intermediate: wod.scaling_intermediate,
            scaling_advanced: wod.scaling_advanced,
            scaling_injured: wod.scaling_injured,
            modalities: wod.modalities,
            lesson_plan: wod.lesson_plan,
            track: wod.track,
            date: new Date(wod.date).toISOString().split('T')[0]
        });

        if (wod.structure) {
            setSessionBlocks(wod.structure);
        } else {
            // Fallback for old records without structure
            setSessionBlocks([]);
        }

        setShowEditor(true);
    };

    const handleDeleteWod = async (id: string) => {
        setLoading(true);
        const { error } = await supabase.from('wods').delete().eq('id', id);
        if (!error) {
            fetchWods();
            showNotification('success', 'SESSION DELETED SUCCESSFULLY');
        } else {
            showNotification('error', 'FAILED TO DELETE SESSION');
        }
        setLoading(false);
    };

    const handleCopyWod = (wod: WOD) => {
        let cleanText = '';

        if (wod.structure && wod.structure.length > 0) {
            cleanText = wod.structure.map(block => {
                const items = block.items.map(item => {
                    let line = `- ${item.movementName}`;
                    if (item.reps) line += `: ${item.reps}`;
                    if (item.weight) line += ` (${item.weight})`;
                    return line;
                }).join('\n');

                let blockTitle = block.title.toUpperCase();
                if (block.sets) blockTitle += ` [${block.sets} SETS]`;

                return `[${blockTitle}]\n${items}`;
            }).join('\n\n');
        } else {
            // Clean markdown fallback
            cleanText = wod.metcon
                .replace(/###\s+/g, '')
                .replace(/\*\*/g, '')
                .replace(/•/g, '-')
                .trim();
        }

        const finalShareText = `${wod.title.toUpperCase()}\n\n${cleanText}\n\nSTIMULUS: ${wod.stimulus}\nSCALING: ${wod.scaling_options}`;

        navigator.clipboard.writeText(finalShareText);
        showNotification('success', 'WOD COPIED TO CLIPBOARD');
        setIsCopying(wod.id);
        setTimeout(() => setIsCopying(null), 2000);
    };

    const fetchUserPRs = async () => {
        if (!user || !currentBox) return;
        const { data } = await supabase
            .from('personal_records')
            .select('*, movements(name)')
            .eq('athlete_id', user.id)
            .eq('box_id', currentBox.id);
        if (data) setUserPRs(data);
    };


    const handlePublishManual = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Construct metcon from blocks if they exist
        let finalMetcon = newWOD.metcon;
        if (sessionBlocks.length > 0) {
            finalMetcon = sessionBlocks.map(b => `### ${b.title.toUpperCase()}\n${generateBlockContent(b)}`).join('\n\n');
        }

        const wodData = {
            ...newWOD,
            metcon: finalMetcon,
            structure: sessionBlocks,
            box_id: currentBox?.id
        };

        let error;
        if (editingWodId) {
            const { error: updateError } = await supabase
                .from('wods')
                .update(wodData)
                .eq('id', editingWodId);
            error = updateError;
        } else {
            const { error: insertError } = await supabase
                .from('wods')
                .insert([wodData]);
            error = insertError;
        }

        if (!error) {
            showNotification('success', editingWodId ? 'SESSION UPDATED SUCCESSFULLY' : 'WOD PUBLISHED TO TRACKS');
            setShowEditor(false);
            setEditingWodId(null);
            setNewWOD({
                title: '', metcon: '', stimulus: '', scaling_options: '',
                scaling_beginner: '', scaling_intermediate: '', scaling_advanced: '',
                scaling_injured: '', modalities: [], lesson_plan: [], track: 'CrossFit',
                date: new Date().toISOString().split('T')[0]
            });
            setSessionBlocks([]);
            fetchWods();
        } else {
            showNotification('error', `PUBLISH ERROR: ${error.message.toUpperCase()}`);
        }
        setLoading(false);
    };


    const calculateWeight = (text: string) => {
        const percentMatch = text.match(/@?(\d{1,3})%/);
        if (!percentMatch) return null;
        const percent = parseInt(percentMatch[1]) / 100;
        const movement = userPRs.find(pr => text.toLowerCase().includes(pr.movements.name.toLowerCase()));
        if (movement) {
            const weight = Math.round(movement.weight_kg * percent);
            return { name: movement.movements.name, percent: Math.round(percent * 100), weight };
        }
        return null;
    };

    const filteredWods = useMemo(() => {
        let items = wods;
        if (activeTrack !== 'all') {
            items = items.filter(w => w.track === activeTrack);
        }
        if (searchQuery) {
            items = items.filter(w =>
                w.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                w.metcon.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        return items;
    }, [wods, activeTrack, searchQuery]);

    const paginatedWods = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredWods.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredWods, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredWods.length / itemsPerPage);

    const last7DaysBias = useMemo(() => {
        const counts = { weightlifting: 0, gymnastics: 0, mono: 0, metcon: 0 };
        const cf = wods.filter(w => w.track === 'CrossFit').slice(0, 7);
        cf.forEach(w => {
            (w.modalities || []).forEach(m => {
                const lower = m.toLowerCase();
                if (lower.includes('weightlifting')) counts.weightlifting++;
                if (lower.includes('gymnastics')) counts.gymnastics++;
                if (lower.includes('mono')) counts.mono++;
                if (lower.includes('metcon')) counts.metcon++;
            });
        });
        return counts;
    }, [wods]);

    return (
        <div className="space-y-6 text-left">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter text-foreground leading-none flex items-center gap-4">
                        <Activity className="h-8 w-8 md:h-12 md:w-12 text-primary" />
                        {t('wods.title')}
                    </h1>
                    <p className="text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground/60 px-1">
                        {t('wods.subtitle')}
                    </p>
                </div>

                <div className="flex gap-2">
                    <Dialog open={showEditor} onOpenChange={(open) => {
                        setShowEditor(open);
                        if (!open) {
                            setEditingWodId(null);
                            setNewWOD({
                                title: '', metcon: '', stimulus: '', scaling_options: '',
                                scaling_beginner: '', scaling_intermediate: '', scaling_advanced: '',
                                scaling_injured: '', modalities: [], lesson_plan: [], track: 'CrossFit',
                                date: new Date().toISOString().split('T')[0]
                            });
                            setSessionBlocks([]);
                        }
                    }}>
                        <DialogTrigger asChild>
                            <Button className="h-14 px-8 rounded-2xl gap-3 shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] font-black uppercase tracking-widest text-xs">
                                <Plus className="h-5 w-5" />
                                {t('wods.new_session')}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[850px] h-[90vh] overflow-hidden p-0 gap-0 border-white/10 glass rounded-[3rem] shadow-2xl flex flex-col">
                            <div className="bg-primary/10 p-10 border-b border-white/5 relative overflow-hidden flex-shrink-0">
                                <Trophy className="absolute -right-10 -bottom-10 h-48 w-48 text-primary/5 -rotate-12" />
                                <DialogHeader>
                                    <DialogTitle className="text-4xl font-black italic uppercase tracking-tighter">
                                        {editingWodId ? 'Edit Session' : t('wods.designer_title')}
                                    </DialogTitle>
                                    <DialogDescription className="uppercase text-[10px] font-bold tracking-[0.3em] text-primary/60 mt-4 px-1 flex items-center gap-2">
                                        <div className="h-1 w-1 rounded-full bg-primary" />
                                        {editingWodId ? 'Modify technical parameters' : t('wods.designer_subtitle')}
                                    </DialogDescription>
                                </DialogHeader>
                            </div>

                            <div className="flex-1 overflow-y-auto p-10 space-y-12">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <Label className="uppercase text-[10px] font-black tracking-widest text-primary/60 px-1">{t('wods.track')}</Label>
                                        <Select value={newWOD.track} onValueChange={(v) => setNewWOD({ ...newWOD, track: v as any })}>
                                            <SelectTrigger className="font-black italic uppercase h-14 bg-white/5 border-white/10 rounded-2xl focus:ring-primary/20">
                                                <SelectValue placeholder="Select track" />
                                            </SelectTrigger>
                                            <SelectContent className="glass border-white/10 rounded-2xl">
                                                {TRACKS.map(t => <SelectItem key={t} value={t} className="font-black uppercase italic py-3">{t}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-3">
                                            <Label className="uppercase text-[10px] font-black tracking-widest text-primary/60 px-1">{t('wods.wod_title')}</Label>
                                            <Input
                                                placeholder="e.g. MORNING GRIND"
                                                className="uppercase italic font-black h-14 bg-white/5 border-white/10 rounded-2xl focus:ring-primary/20"
                                                value={newWOD.title}
                                                onChange={(e) => setNewWOD({ ...newWOD, title: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="uppercase text-[10px] font-black tracking-widest text-primary/60 px-1">{t('wods.date', { defaultValue: 'PROGRAM DATE' })}</Label>
                                            <Input
                                                type="date"
                                                value={newWOD.date}
                                                onChange={(e) => setNewWOD({ ...newWOD, date: e.target.value })}
                                                className="font-black italic h-14 bg-white/5 border-white/10 rounded-2xl focus:ring-primary/20"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <Label className="uppercase text-xs font-black tracking-widest leading-none">{t('wods.routine_structure')}</Label>
                                            <p className="text-[10px] text-muted-foreground font-bold italic uppercase opacity-50">Build your session block by block</p>
                                        </div>
                                    </div>

                                    <WODDesigner
                                        sessionBlocks={sessionBlocks}
                                        setSessionBlocks={setSessionBlocks}
                                        movements={movements}
                                    />

                                    <div className="grid md:grid-cols-2 gap-8 pt-8">
                                        <div className="space-y-3">
                                            <Label className="uppercase text-[10px] font-black tracking-widest text-orange-500 px-1">{t('wods.stimulus')}</Label>
                                            <Textarea className="h-32 text-xs italic font-bold bg-white/5 border-white/10 rounded-2xl p-4 focus:ring-orange-500/20" value={newWOD.stimulus} onChange={e => setNewWOD({ ...newWOD, stimulus: e.target.value })} />
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="uppercase text-[10px] font-black tracking-widest text-blue-500 px-1">{t('wods.scaling')}</Label>
                                            <Textarea className="h-32 text-xs italic font-bold bg-white/5 border-white/10 rounded-2xl p-4 focus:ring-blue-500/20" value={newWOD.scaling_options} onChange={e => setNewWOD({ ...newWOD, scaling_options: e.target.value })} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-10 border-t border-white/5 bg-white/5 flex-shrink-0">
                                <Button
                                    onClick={handlePublishManual}
                                    className="w-full h-16 rounded-2xl font-black uppercase tracking-widest text-base shadow-2xl shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
                                    disabled={loading}
                                >
                                    {loading ? <Loader2 className="animate-spin" /> : editingWodId ? 'UPDATE SESSION' : t('wods.publish')}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </header>

            {/* Quick Actions & Filters Bar */}
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between bg-white/5 p-2 rounded-[2rem] border border-white/5">
                <div className="flex flex-wrap gap-2">
                    <Button
                        variant={activeTrack === 'all' ? "default" : "ghost"}
                        onClick={() => setActiveTrack('all')}
                        className={cn(
                            "h-10 px-6 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all",
                            activeTrack === 'all' ? "shadow-lg shadow-primary/20" : "hover:bg-white/10"
                        )}
                    >
                        {t('wods.all_tracks')}
                    </Button>
                    {TRACKS.map(t => (
                        <Button
                            key={t}
                            variant={activeTrack === t ? "default" : "ghost"}
                            onClick={() => setActiveTrack(t)}
                            className={cn(
                                "h-10 px-6 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all",
                                activeTrack === t ? "shadow-lg shadow-primary/20" : "hover:bg-white/10",
                                t === 'CrossFit' && activeTrack !== t && "text-primary/60 hover:text-primary",
                                t === 'Novice' && activeTrack !== t && "text-emerald-500/60 hover:text-emerald-500",
                                t === 'Bodybuilding' && activeTrack !== t && "text-blue-500/60 hover:text-blue-500",
                                t === 'Engine' && activeTrack !== t && "text-orange-500/60 hover:text-orange-500"
                            )}
                        >
                            {t}
                        </Button>
                    ))}
                </div>

                <div className="relative group w-full md:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                        placeholder={t('common.search')}
                        className="pl-12 h-11 rounded-xl border-white/10 bg-white/5 focus:ring-primary/20 transition-all text-xs font-bold uppercase tracking-wider"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Bias Dashboard */}
            {(activeTrack === 'all' || activeTrack === 'CrossFit') && (
                <Card className="border-white/10 glass rounded-[2rem] overflow-hidden shadow-2xl">
                    <CardHeader className="py-6 border-b border-white/5 bg-primary/10">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                                <Target className="h-6 w-6 text-primary-foreground" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-black italic uppercase tracking-tighter">{t('wods.bias_checker')}</CardTitle>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-primary/60">{t('wods.bias_subtitle', { defaultValue: '7-DAY PROGRAMMING ANALYSIS' })}</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="py-8">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-10">
                            {Object.entries(last7DaysBias).map(([key, count]) => (
                                <div key={key} className="space-y-4">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">{key}</span>
                                        <span className="text-sm font-black italic text-primary">{count} <span className="text-[10px] opacity-40">/ 7</span></span>
                                    </div>
                                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                                        <div
                                            className="h-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)] transition-all duration-1000"
                                            style={{ width: `${(count / 7) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Board Feed */}
            <div className="grid gap-6">
                {wods.length === 0 && !loading ? (
                    <Card className="border-dashed border-2 border-white/10 py-24 text-center glass rounded-[3rem]">
                        <div className="space-y-6">
                            <div className="h-20 w-20 rounded-full bg-white/5 mx-auto flex items-center justify-center border border-white/10">
                                <Calendar className="h-10 w-10 text-muted-foreground/40" />
                            </div>
                            <div className="space-y-2">
                                <p className="text-xl font-black uppercase italic tracking-tight text-muted-foreground/60">{t('common.no_data')}</p>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">{t('wods.empty_desc', { defaultValue: 'START PROGRAMMING YOUR FIRST SESSION' })}</p>
                            </div>
                        </div>
                    </Card>
                ) : (
                    paginatedWods.map(wod => (
                        <Card key={wod.id} className="border-white/5 glass rounded-[2.5rem] overflow-hidden group hover:border-primary/30 transition-all duration-500 shadow-xl hover:shadow-primary/5">
                            <CardHeader className="flex flex-col md:flex-row md:items-start justify-between gap-6 p-10 border-b border-white/5 bg-white/5">
                                <div className="space-y-4">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <Badge className={cn(
                                            "text-[10px] h-6 px-3 font-black uppercase tracking-widest border-none shadow-lg",
                                            wod.track === 'CrossFit' && "bg-primary text-primary-foreground shadow-primary/20",
                                            wod.track === 'Novice' && "bg-emerald-500 text-white shadow-emerald-500/20",
                                            wod.track === 'Bodybuilding' && "bg-blue-500 text-white shadow-blue-500/20",
                                            wod.track === 'Engine' && "bg-orange-500 text-white shadow-orange-500/20"
                                        )}>
                                            {wod.track} TRACK
                                        </Badge>
                                        <Badge variant="outline" className="text-[10px] h-6 px-3 bg-white/5 font-black border-white/10 text-white/60 uppercase tracking-widest">
                                            {new Date(wod.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()}
                                        </Badge>
                                    </div>
                                    <CardTitle className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic text-foreground group-hover:text-primary transition-all duration-500">
                                        {wod.title}
                                    </CardTitle>
                                </div>
                                <div className="flex items-center gap-2 bg-white/5 p-2 rounded-2xl border border-white/5">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-10 w-10 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                                        onClick={() => handleCopyWod(wod)}
                                    >
                                        {isCopying === wod.id ? <Check className="h-5 w-5 text-emerald-500" /> : <Copy className="h-5 w-5" />}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-10 w-10 rounded-xl text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 transition-all"
                                        onClick={() => handleEditWod(wod)}
                                    >
                                        <Pencil className="h-5 w-5" />
                                    </Button>
                                    <div className="w-px h-6 bg-white/5 mx-1" />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-10 w-10 rounded-xl text-destructive hover:bg-destructive/10 transition-all"
                                        onClick={() => showConfirm({
                                            title: t('common.confirm_delete', { defaultValue: 'CONFIRMAR ELIMINACIÓN' }),
                                            description: t('wods.delete_warning', { defaultValue: '¿ESTÁS SEGURO DE QUE DESEAS ELIMINAR ESTE WOD? ESTA ACCIÓN NO SE PUEDE DESHACER.' }),
                                            onConfirm: () => handleDeleteWod(wod.id),
                                            variant: 'destructive',
                                            icon: 'destructive'
                                        })}
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-10">
                                <div className="space-y-10">
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                                    <Timer className="h-4 w-4 text-primary" />
                                                </div>
                                                <p className="text-sm font-black uppercase tracking-[0.2em] text-primary italic">{t('wods.routine_description')}</p>
                                            </div>
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">STRUCTURED VIEW</span>
                                        </div>

                                        {wod.structure && wod.structure.length > 0 ? (
                                            <div className="space-y-8 relative">
                                                <div className="absolute left-6 top-0 bottom-0 w-px bg-white/5" />
                                                {wod.structure.map((block) => (
                                                    <div key={block.id} className="relative pl-14 group/block">
                                                        <div className="absolute left-4 top-2 h-4 w-4 rounded-full border-2 border-primary bg-background z-10 shadow-[0_0_10px_rgba(var(--primary),0.3)]" />
                                                        <div className="flex items-center justify-between mb-4">
                                                            <h4 className="text-lg font-black uppercase italic text-foreground tracking-tight">{block.title}</h4>
                                                            {block.sets && (
                                                                <div className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20">
                                                                    {block.sets} SETS
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="grid gap-3">
                                                            {block.items.map((item) => (
                                                                <div key={item.id} className="flex items-center gap-6 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/20 hover:bg-primary/5 transition-all duration-300 group/movement">
                                                                    <div className="flex-1 space-y-1">
                                                                        <p className="text-sm font-black uppercase italic tracking-tight">{item.movementName}</p>
                                                                        {item.notes && <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest opacity-60">{item.notes}</p>}
                                                                    </div>
                                                                    <div className="flex gap-6">
                                                                        {item.reps && (
                                                                            <div className="text-center min-w-[50px]">
                                                                                <p className="text-[8px] font-black uppercase text-muted-foreground/40 mb-1 tracking-widest">REPS</p>
                                                                                <p className="text-xs font-black italic">{item.reps}</p>
                                                                            </div>
                                                                        )}
                                                                        {item.weight && (
                                                                            <div className="text-center min-w-[50px]">
                                                                                <p className="text-[8px] font-black uppercase text-primary/40 mb-1 tracking-widest">LOAD</p>
                                                                                <p className="text-xs font-black italic text-primary">{item.weight}</p>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 font-mono text-lg text-foreground/80 leading-relaxed whitespace-pre-wrap shadow-inner relative overflow-hidden italic">
                                                <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />
                                                {wod.metcon}
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="p-6 rounded-[2rem] border border-orange-500/20 bg-orange-500/5 space-y-3 relative overflow-hidden group/callout">
                                            <ZapIcon className="absolute -right-4 -top-4 h-24 w-24 text-orange-500/5 -rotate-12 group-hover:scale-110 transition-transform duration-700" />
                                            <p className="text-[10px] font-black uppercase text-orange-500 tracking-[0.2em]">{t('wods.stimulus')}</p>
                                            <p className="text-sm font-bold italic text-white/70 leading-relaxed relative z-10">{wod.stimulus || "Max effort within capacity."}</p>
                                        </div>
                                        <div className="p-6 rounded-[2rem] border border-blue-500/20 bg-blue-500/5 space-y-3 relative overflow-hidden group/callout">
                                            <Shield className="absolute -right-4 -top-4 h-24 w-24 text-blue-500/5 -rotate-12 group-hover:scale-110 transition-transform duration-700" />
                                            <p className="text-[10px] font-black uppercase text-blue-500 tracking-[0.2em]">{t('wods.scaling')}</p>
                                            <p className="text-sm font-bold italic text-white/70 leading-relaxed relative z-10">{wod.scaling_options || "Scale weight to maintain intensity."}</p>
                                        </div>
                                    </div>

                                    {calculateWeight(wod.metcon) && (
                                        <div className="p-6 rounded-2xl border-2 border-primary/20 bg-primary/[0.03] flex items-center justify-between shadow-sm">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <Dumbbell className="h-6 w-6 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase text-primary/60 mb-0.5 tracking-widest">{t('wods.calculated_loading')}</p>
                                                    <p className="text-lg font-black italic tracking-tight">{calculateWeight(wod.metcon)?.name} @ {calculateWeight(wod.metcon)?.percent}%</p>
                                                </div>
                                            </div>
                                            <div className="text-4xl font-black italic tracking-tighter text-primary">
                                                {calculateWeight(wod.metcon)?.weight}<span className="text-xs ml-1 opacity-60">KG</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between gap-4 mt-12 bg-white/5 p-4 rounded-[2rem] border border-white/5">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="h-12 w-12 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-20 flex items-center justify-center p-0"
                        >
                            <ChevronLeft className="h-6 w-6" />
                        </Button>
                        <div className="flex items-center gap-2">
                            {[...Array(totalPages)].map((_, i) => {
                                const pageNumber = i + 1;
                                // Simple logic to show current, first, last, and pages around current
                                if (
                                    pageNumber === 1 ||
                                    pageNumber === totalPages ||
                                    Math.abs(pageNumber - currentPage) <= 1
                                ) {
                                    return (
                                        <Button
                                            key={pageNumber}
                                            variant={currentPage === pageNumber ? "default" : "ghost"}
                                            onClick={() => setCurrentPage(pageNumber)}
                                            className={cn(
                                                "h-12 w-12 rounded-2xl font-black italic",
                                                currentPage === pageNumber ? "shadow-lg shadow-primary/20" : "bg-white/5 hover:bg-white/10"
                                            )}
                                        >
                                            {pageNumber}
                                        </Button>
                                    );
                                } else if (
                                    pageNumber === currentPage - 2 ||
                                    pageNumber === currentPage + 2
                                ) {
                                    return <span key={pageNumber} className="text-muted-foreground">...</span>;
                                }
                                return null;
                            })}
                        </div>
                        <Button
                            variant="ghost"
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="h-12 w-12 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-20 flex items-center justify-center p-0"
                        >
                            <ChevronRight className="h-6 w-6" />
                        </Button>
                    </div>
                    <div className="hidden md:block px-6">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">
                            Showing <span className="text-primary">{Math.min(filteredWods.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filteredWods.length, currentPage * itemsPerPage)}</span> of {filteredWods.length} sessions
                        </p>
                    </div>
                </div>
            )}

            {/* Premium Toast Notification System */}
            {notification && (
                <Toast
                    type={notification.type}
                    message={notification.message}
                    onClose={hideNotification}
                />
            )}

            {/* Premium Confirmation Dialog */}
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
