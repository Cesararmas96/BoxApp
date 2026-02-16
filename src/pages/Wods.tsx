import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import {
    Plus,
    Trophy,
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
    LayoutGrid,
    List,
    X,
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
    ResponsiveDialog as Dialog,
    ResponsiveDialogContent as DialogContent,
    ResponsiveDialogDescription as DialogDescription,
    ResponsiveDialogHeader as DialogHeader,
    ResponsiveDialogTitle as DialogTitle,
    ResponsiveDialogTrigger as DialogTrigger,
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
    const dateInputRef = React.useRef<HTMLInputElement>(null);
    const { user, currentBox } = useAuth();
    const [wods, setWods] = useState<WOD[]>([]);
    const [loading, setLoading] = useState(true);
    const [showEditor, setShowEditor] = useState(false);
    const [editingWodId, setEditingWodId] = useState<string | null>(null);
    const [isCopying, setIsCopying] = useState<string | null>(null);
    const [activeTrack, setActiveTrack] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState(1);

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
    const [selectedMonth, setSelectedMonth] = useState<string>('all');
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');
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
            date: wod.date ? new Date(wod.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
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
            showNotification('success', t('wods.delete_success'));
        } else {
            showNotification('error', t('wods.delete_error'));
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

        const finalShareText = `${wod.title.toUpperCase()}\n\n${cleanText}\n\n${t('wods.stimulus').toUpperCase()}: ${wod.stimulus}\n${t('wods.scaling').toUpperCase()}: ${wod.scaling_options}`;

        navigator.clipboard.writeText(finalShareText);
        showNotification('success', t('wods.copy_success'));
        setIsCopying(wod.id);
        setTimeout(() => setIsCopying(null), 2000);
    };

    const fetchUserPRs = async () => {
        if (!user || !currentBox) return;
        const { data } = await supabase
            .from('personal_records')
            .select('*, movements(name)')
            .eq('user_id', user.id)
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
            showNotification('success', editingWodId ? t('wods.update_success') : t('wods.publish_success'));
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
            showNotification('error', t('wods.publish_error', { error: error.message.toUpperCase() }));
        }
        setLoading(false);
    };


    const calculateWeight = (text: string) => {
        const percentMatch = text.match(/@?(\d{1,3})%/);
        if (!percentMatch) return null;
        const percent = parseInt(percentMatch[1]) / 100;

        // Find a movement that matches the text
        const movement = userPRs.find(pr =>
            pr.movements?.name && text.toLowerCase().includes(pr.movements.name.toLowerCase())
        );

        if (movement && movement.value) {
            // Parse numeric weight from string value (e.g., "100kg" -> 100)
            const numericValue = parseFloat(movement.value.replace(/[^0-9.]/g, ''));
            if (!isNaN(numericValue)) {
                const weight = Math.round(numericValue * percent);
                return {
                    name: movement.movements.name,
                    percent: Math.round(percent * 100),
                    weight: `${weight}${movement.value.replace(/[0-9.]/g, '')}` || `${weight}kg`
                };
            }
        }
        return null;
    };

    const availableMonths = useMemo(() => {
        const months = new Set<string>();
        wods.forEach(wod => {
            if (wod.date) {
                const dateStr = wod.date.split('T')[0].replace(/-/g, '/');
                const date = new Date(dateStr);
                months.add(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
            }
        });
        return Array.from(months).sort((a, b) => b.localeCompare(a));
    }, [wods]);

    const filteredWods = useMemo(() => {
        let items = wods;
        if (activeTrack !== 'all') {
            items = items.filter(w => w.track === activeTrack);
        }
        if (selectedMonth !== 'all') {
            items = items.filter(w => w.date && w.date.startsWith(selectedMonth));
        }
        if (selectedDate) {
            items = items.filter(w => {
                if (!w.date) return false;
                const wodDate = w.date.includes('T') ? w.date.split('T')[0] : w.date;
                return wodDate === selectedDate;
            });
        }
        if (searchQuery) {
            items = items.filter(w =>
                w.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                w.metcon.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        return items;
    }, [wods, activeTrack, searchQuery, selectedMonth, selectedDate]);

    const itemsPerPage = viewMode === 'compact' ? 50 : 12;

    const paginatedWods = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredWods.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredWods, currentPage, itemsPerPage]);

    const groupedByDate = useMemo(() => {
        const groups: { [key: string]: WOD[] } = {};
        paginatedWods.forEach(wod => {
            const dateKey = wod.date;
            if (!groups[dateKey]) groups[dateKey] = [];
            groups[dateKey].push(wod);
        });
        return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
    }, [paginatedWods]);

    const getWeekRange = (dateStr: string) => {
        if (!dateStr) return { start: '---', end: '---', monday: '' };
        try {
            const dStr = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
            const normalizedDate = dStr.replace(/-/g, '/');
            const date = new Date(normalizedDate);

            if (isNaN(date.getTime())) return { start: '---', end: '---', monday: '' };

            const day = date.getDay();
            const diff = date.getDate() - day + (day === 0 ? -6 : 1);
            const monday = new Date(date.getTime());
            monday.setDate(diff);

            const sunday = new Date(monday.getTime());
            sunday.setDate(monday.getDate() + 6);

            return {
                start: monday.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
                end: sunday.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
                monday: monday.toISOString().split('T')[0]
            };
        } catch (e) {
            return { start: '---', end: '---', monday: '' };
        }
    };

    const totalPages = Math.ceil(filteredWods.length / itemsPerPage);

    const last7DaysBias = useMemo(() => {
        const counts = { weightlifting: 0, gymnastics: 0, mono: 0, metcon: 0 };
        if (!newWOD.date) return counts;

        const currentWodDate = new Date(newWOD.date + 'T12:00:00');
        if (isNaN(currentWodDate.getTime())) return counts;

        const dayOfWeek = currentWodDate.getDay();
        const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const monday = new Date(currentWodDate);
        monday.setDate(currentWodDate.getDate() - diffToMonday);

        const saturday = new Date(monday);
        saturday.setDate(monday.getDate() + 5);

        const mondayStr = monday.toISOString().split('T')[0];
        const saturdayStr = saturday.toISOString().split('T')[0];

        const currentTrack = newWOD.track || 'CrossFit';

        const filteredWodsForWeek = wods.filter(w => {
            if (w.track !== currentTrack || w.id === editingWodId) return false;
            const d = w.date?.split('T')[0];
            return d && d >= mondayStr && d <= saturdayStr;
        });

        const allWodsForAnalysis = [...filteredWodsForWeek];
        allWodsForAnalysis.push({ ...newWOD, id: 'current' } as any);

        allWodsForAnalysis.forEach(w => {
            (w.modalities || []).forEach(m => {
                const lower = m.toLowerCase();
                if (lower.includes('weightlifting')) counts.weightlifting++;
                if (lower.includes('gymnastics')) counts.gymnastics++;
                if (lower.includes('mono')) counts.mono++;
                if (lower.includes('metcon')) counts.metcon++;
            });
        });
        return counts;
    }, [wods, newWOD.modalities, newWOD.track, newWOD.date, editingWodId]);

    return (
        <div className="space-y-4 md:space-y-6 text-left">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t('wods.title')}</h1>
                    <p className="text-muted-foreground text-xs sm:text-sm">{t('wods.subtitle')}</p>
                </div>

                <div className="flex flex-col gap-2 w-full md:w-auto md:flex-row md:items-center">
                    <Dialog open={showEditor} onOpenChange={(open) => {
                        if (open && !editingWodId) {
                            const now = new Date();
                            const defaultDate = new Date(now);
                            if (now.getHours() >= 16) defaultDate.setDate(now.getDate() + 1);
                            setNewWOD(prev => ({ ...prev, date: defaultDate.toISOString().split('T')[0] }));
                        }
                        setShowEditor(open);
                        if (!open) {
                            setEditingWodId(null);
                            const now = new Date();
                            const defaultDate = new Date(now);
                            if (now.getHours() >= 16) defaultDate.setDate(now.getDate() + 1);
                            setNewWOD({
                                title: '', metcon: '', stimulus: '', scaling_options: '',
                                scaling_beginner: '', scaling_intermediate: '', scaling_advanced: '',
                                scaling_injured: '', modalities: [], lesson_plan: [], track: 'CrossFit',
                                date: defaultDate.toISOString().split('T')[0]
                            });
                            setSessionBlocks([]);
                        }
                    }}>
                        <DialogTrigger asChild>
                            <Button className="gap-2 w-full md:w-auto h-10 md:h-9 text-[10px] font-black uppercase tracking-widest">
                                <Plus className="h-4 w-4" />
                                {t('wods.new_session')}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[850px] h-[90vh] overflow-hidden p-0 gap-0 border-border bg-background/95 backdrop-blur-xl rounded-[3rem] shadow-2xl flex flex-col">
                            <div className="bg-primary/[0.05] dark:bg-primary/20 p-10 border-b border-border relative overflow-hidden flex-shrink-0">
                                <Trophy className="absolute -right-10 -bottom-10 h-48 w-48 text-primary/5 -rotate-12" />
                                <DialogHeader>
                                    <DialogTitle className="text-4xl font-black italic uppercase tracking-tighter">
                                        {editingWodId ? t('wods.edit_session') : t('wods.designer_title')}
                                    </DialogTitle>
                                    <DialogDescription className="uppercase text-[10px] font-bold tracking-[0.3em] text-primary/60 mt-4 px-1 flex items-center gap-2">
                                        <span className="h-1 w-1 rounded-full bg-primary" />
                                        {editingWodId ? t('wods.modify_params') : t('wods.designer_subtitle')}
                                    </DialogDescription>
                                </DialogHeader>
                            </div>

                            <div className="flex-1 overflow-y-auto p-10 space-y-12">
                                {/* Analyzer inside Editor */}
                                {newWOD.track === 'CrossFit' && (
                                    <div className="p-6 rounded-[2rem] bg-primary/[0.03] border border-primary/10 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Target className="h-4 w-4 text-primary" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-primary">{t('wods.bias_checker')}</span>
                                            </div>
                                            <span className="text-[9px] font-bold text-muted-foreground uppercase">{t('wods.bias_subtitle')}</span>
                                        </div>
                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                            {Object.entries(last7DaysBias).map(([key, count]) => (
                                                <div key={key} className="space-y-1.5">
                                                    <div className="flex justify-between items-end">
                                                        <span className="text-[8px] font-black uppercase tracking-widest opacity-50">{t(`wods.modalities.${key}`)}</span>
                                                        <span className="text-[10px] font-black italic">{count}/7</span>
                                                    </div>
                                                    <div className="h-1 w-full bg-muted/30 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-primary transition-all duration-1000"
                                                            style={{ width: `${(count / 7) * 100}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <Label className="uppercase text-[10px] font-black tracking-widest text-primary px-1">{t('wods.track')}</Label>
                                        <Select value={newWOD.track} onValueChange={(v) => setNewWOD({ ...newWOD, track: v as any })}>
                                            <SelectTrigger className="font-black italic uppercase h-14 bg-muted/30 dark:bg-muted border-border rounded-2xl focus:ring-primary/20 hover:border-primary/50 transition-colors">
                                                <SelectValue placeholder={t('wods.select_track')} />
                                            </SelectTrigger>
                                            <SelectContent className="glass border-border rounded-2xl">
                                                {TRACKS.map(track => (
                                                    <SelectItem key={track} value={track} className="font-black uppercase italic py-3">
                                                        {t(`wods.tracks.${track.toLowerCase()}`)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-3">
                                            <Label className="uppercase text-[10px] font-black tracking-widest text-primary px-1">{t('wods.wod_title')}</Label>
                                            <Input
                                                placeholder={t('wods.morning_grind')}
                                                className="uppercase italic font-black h-14 bg-muted/30 dark:bg-muted border-border rounded-2xl focus:ring-primary/20 focus:border-primary/50 transition-all"
                                                value={newWOD.title}
                                                onChange={(e) => setNewWOD({ ...newWOD, title: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="uppercase text-[10px] font-black tracking-widest text-primary px-1">{t('wods.date', { defaultValue: 'PROGRAM DATE' })}</Label>
                                            <Input
                                                type="date"
                                                value={newWOD.date}
                                                onChange={(e) => setNewWOD({ ...newWOD, date: e.target.value })}
                                                className="font-black italic h-14 bg-muted/30 dark:bg-muted border-border rounded-2xl focus:ring-primary/20 focus:border-primary/50 transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <Label className="uppercase text-[10px] font-black tracking-widest text-primary px-1">{t('wods.stimulus_modalities')}</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {['Weightlifting', 'Gymnastics', 'Mono', 'Metcon'].map((m) => {
                                            const isSelected = (newWOD.modalities || []).includes(m);
                                            return (
                                                <Button
                                                    key={m}
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        const next = isSelected
                                                            ? (newWOD.modalities || []).filter(curr => curr !== m)
                                                            : [...(newWOD.modalities || []), m];
                                                        setNewWOD({ ...newWOD, modalities: next });
                                                    }}
                                                    className={cn(
                                                        "h-9 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all",
                                                        isSelected
                                                            ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                                                            : "bg-muted/30 border-border hover:border-primary/30"
                                                    )}
                                                >
                                                    {t(`wods.modalities.${m.toLowerCase()}`)}
                                                </Button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <Label className="uppercase text-xs font-black tracking-widest leading-none">{t('wods.routine_structure')}</Label>
                                            <p className="text-[10px] text-muted-foreground font-bold italic uppercase opacity-50">{t('wods.build_blocks')}</p>
                                        </div>
                                    </div>

                                    <WODDesigner
                                        sessionBlocks={sessionBlocks}
                                        setSessionBlocks={setSessionBlocks}
                                        movements={movements}
                                    />

                                    <div className="grid md:grid-cols-2 gap-8 pt-8">
                                        <div className="space-y-3">
                                            <Label className="uppercase text-[10px] font-black tracking-widest text-orange-600 dark:text-orange-500 px-1">{t('wods.stimulus')}</Label>
                                            <Textarea className="h-32 text-xs italic font-bold bg-muted/30 dark:bg-muted border-border rounded-2xl p-4 focus:ring-orange-500/20 focus:border-orange-500/50 transition-all text-foreground/80" value={newWOD.stimulus} onChange={e => setNewWOD({ ...newWOD, stimulus: e.target.value })} />
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="uppercase text-[10px] font-black tracking-widest text-blue-600 dark:text-blue-500 px-1">{t('wods.scaling')}</Label>
                                            <Textarea className="h-32 text-xs italic font-bold bg-muted/30 dark:bg-muted border-border rounded-2xl p-4 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all text-foreground/80" value={newWOD.scaling_options} onChange={e => setNewWOD({ ...newWOD, scaling_options: e.target.value })} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-10 border-t border-border bg-muted/50 flex-shrink-0">
                                <Button
                                    onClick={handlePublishManual}
                                    className="w-full h-16 rounded-2xl font-black uppercase tracking-widest text-base shadow-2xl shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
                                    disabled={loading}
                                >
                                    {loading ? <Loader2 className="animate-spin" /> : editingWodId ? t('wods.update_btn') : t('wods.publish')}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Quick Actions & Filters Bar */}
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between bg-muted/50 p-2 rounded-[2rem] border border-border" >
                <div className="flex flex-wrap gap-2">
                    <Button
                        variant={activeTrack === 'all' ? "default" : "ghost"}
                        onClick={() => setActiveTrack('all')}
                        className={cn(
                            "h-10 px-6 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all",
                            activeTrack === 'all' ? "shadow-lg shadow-primary/20" : "hover:bg-muted"
                        )}
                    >
                        {t('wods.all_tracks')}
                    </Button>
                    {TRACKS.map(track => (
                        <Button
                            key={track}
                            variant={activeTrack === track ? "default" : "ghost"}
                            onClick={() => setActiveTrack(track)}
                            className={cn(
                                "h-10 px-6 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all",
                                activeTrack === track ? "shadow-lg shadow-primary/20" : "hover:bg-muted",
                                track === 'CrossFit' && activeTrack !== track && "text-primary/60 hover:text-primary",
                                track === 'Novice' && activeTrack !== track && "text-emerald-500/60 hover:text-emerald-500",
                                track === 'Bodybuilding' && activeTrack !== track && "text-blue-500/60 hover:text-blue-500",
                                track === 'Engine' && activeTrack !== track && "text-orange-500/60 hover:text-orange-500"
                            )}
                        >
                            {t(`wods.tracks.${track.toLowerCase()}`)}
                        </Button>
                    ))}
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative group flex-1 md:w-48">
                        <Input
                            ref={dateInputRef}
                            type="date"
                            className="px-4 h-11 rounded-xl border-border bg-muted/30 dark:bg-muted focus:ring-primary/20 focus:border-primary/50 transition-all text-[10px] font-black uppercase tracking-widest cursor-pointer [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-inner-spin-button]:hidden [&::-webkit-clear-button]:hidden"
                            value={selectedDate}
                            onChange={(e) => {
                                setSelectedDate(e.target.value);
                                if (e.target.value) setSelectedMonth('all');
                            }}
                            onClick={() => {
                                try {
                                    dateInputRef.current?.showPicker();
                                } catch (e) {
                                    // Fallback for older browsers
                                }
                            }}
                        />
                        {!selectedDate ? (
                            <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none group-focus-within:text-primary transition-colors" />
                        ) : (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setSelectedDate('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground z-10"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>

                    <div className="relative group flex-1 md:w-64">
                        <Input
                            placeholder={t('common.search')}
                            className="px-4 h-11 rounded-xl border-border bg-muted/30 dark:bg-muted focus:ring-primary/20 focus:border-primary/50 transition-all text-xs font-bold uppercase tracking-wider [&::-webkit-search-cancel-button]:appearance-none"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {!searchQuery ? (
                            <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none group-focus-within:text-primary transition-colors" />
                        ) : (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setSearchQuery('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground z-10"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>

                    <div className="flex bg-muted/30 dark:bg-muted p-1 rounded-xl border border-border shrink-0">
                        <Button
                            variant={viewMode === 'grid' ? "secondary" : "ghost"}
                            size="icon"
                            onClick={() => setViewMode('grid')}
                            className="h-9 w-9 rounded-lg"
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={viewMode === 'compact' ? "secondary" : "ghost"}
                            size="icon"
                            onClick={() => setViewMode('compact')}
                            className="h-9 w-9 rounded-lg"
                        >
                            <List className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div >

            {/* Month Navigator */}
            {
                availableMonths.length > 1 && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide">
                        <Button
                            variant={selectedMonth === 'all' ? "secondary" : "ghost"}
                            onClick={() => {
                                setSelectedMonth('all');
                                setSelectedDate('');
                            }}
                            className="h-8 rounded-full px-5 text-[9px] font-black uppercase tracking-widest whitespace-nowrap border border-border"
                        >
                            {t('common.all')}
                        </Button>
                        {availableMonths.map(month => {
                            const [year, monthNum] = month.split('-');
                            const date = new Date(parseInt(year), parseInt(monthNum) - 1);
                            const monthName = date.toLocaleDateString(undefined, { month: 'short' });
                            return (
                                <Button
                                    key={month}
                                    variant={selectedMonth === month ? "secondary" : "ghost"}
                                    onClick={() => {
                                        setSelectedMonth(month);
                                        setSelectedDate('');
                                    }}
                                    className="h-8 rounded-full px-5 text-[9px] font-black uppercase tracking-widest whitespace-nowrap border border-border"
                                >
                                    {monthName} {year}
                                </Button>
                            );
                        })}
                    </div>
                )
            }

            {/* Bias Dashboard */}
            {
                (activeTrack === 'all' || activeTrack === 'CrossFit') && (
                    <Card className="border-border glass rounded-[2rem] overflow-hidden shadow-2xl">
                        <CardHeader className="py-6 border-b border-border bg-primary/10">
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
                        <CardContent className="py-4">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                {Object.entries(last7DaysBias).map(([key, count]) => (
                                    <div key={key} className="space-y-2">
                                        <div className="flex justify-between items-end">
                                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">{key}</span>
                                            <span className="text-xs font-black italic text-primary">{count} <span className="text-[9px] opacity-40">/ 7</span></span>
                                        </div>
                                        <div className="h-1.5 w-full bg-muted/50 rounded-full overflow-hidden border border-border">
                                            <div
                                                className="h-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)] transition-all duration-1000"
                                                style={{ width: `${(count / 7) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )
            }

            {/* Board Feed - Grouped by Date */}
            <div className="space-y-16">
                {wods.length === 0 && !loading ? (
                    <Card className="border-dashed border-2 border-border py-24 text-center glass rounded-[3rem]">
                        <div className="space-y-6">
                            <div className="h-20 w-20 rounded-full bg-muted/50 mx-auto flex items-center justify-center border border-border">
                                <Calendar className="h-10 w-10 text-muted-foreground/40" />
                            </div>
                            <div className="space-y-2">
                                <p className="text-xl font-black uppercase italic tracking-tight text-muted-foreground/60">{t('common.no_data')}</p>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">{t('wods.empty_desc', { defaultValue: 'START PROGRAMMING YOUR FIRST SESSION' })}</p>
                            </div>
                        </div>
                    </Card>
                ) : (
                    groupedByDate.map(([date, dateWods], index) => {
                        const week = getWeekRange(date);
                        const prevDate = index > 0 ? groupedByDate[index - 1][0] : null;
                        const prevWeek = prevDate ? getWeekRange(prevDate).monday : null;
                        const showWeekHeader = index === 0 || week.monday !== prevWeek;

                        return (
                            <div key={date} className="space-y-8">
                                {showWeekHeader && (
                                    <div className="flex items-center gap-6 px-4">
                                        <div className="flex items-center gap-3">
                                            <Calendar className="h-5 w-5 text-primary" />
                                            <h3 className="text-sm font-black uppercase tracking-[0.3em] text-primary/80 italic">
                                                {t('common.week', { defaultValue: 'WEEK' })}: {week.start} - {week.end}
                                            </h3>
                                        </div>
                                        <div className="h-px flex-1 bg-gradient-to-r from-primary/20 to-transparent" />
                                    </div>
                                )}

                                <div className="space-y-6">
                                    <div className="flex items-center gap-4 px-4">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-muted/30 px-3 py-1 rounded-full border border-border">
                                            {date ? new Date(date.split('T')[0].replace(/-/g, '/')).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase() : '---'}
                                        </span>
                                        <div className="h-px flex-1 bg-muted/40" />
                                    </div>

                                    <div className={cn(
                                        "grid gap-8 items-start",
                                        viewMode === 'grid' ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"
                                    )}>
                                        {dateWods.map(wod => viewMode === 'compact' ? (
                                            <div key={wod.id} className="group flex items-center justify-between p-4 bg-muted/30 border border-border rounded-2xl hover:border-primary/20 transition-all duration-300 shadow-sm dark:shadow-lg dark:hover:shadow-primary/5">
                                                <div className="flex items-center gap-6 min-w-0">
                                                    <Badge className={cn(
                                                        "text-[9px] h-5 px-2 font-black uppercase tracking-widest border-none shrink-0",
                                                        wod.track === 'CrossFit' && "bg-primary text-primary-foreground",
                                                        wod.track === 'Novice' && "bg-emerald-500 text-foreground",
                                                        wod.track === 'Bodybuilding' && "bg-blue-500 text-foreground",
                                                        wod.track === 'Engine' && "bg-orange-500 text-foreground"
                                                    )}>
                                                        {wod.track}
                                                    </Badge>
                                                    <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4 min-w-0">
                                                        <h4 className="font-black uppercase italic tracking-tight text-sm text-foreground group-hover:text-primary transition-colors truncate">
                                                            {wod.title}
                                                        </h4>
                                                        <p className="text-[10px] font-medium text-muted-foreground line-clamp-1 hidden md:block">
                                                            {wod.metcon.replace(/[*#]/g, '')}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10" onClick={() => handleCopyWod(wod)}>
                                                        {isCopying === wod.id ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10" onClick={() => handleEditWod(wod)}>
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10" onClick={() => showConfirm({
                                                        title: t('common.confirm_delete'),
                                                        description: t('wods.delete_warning'),
                                                        onConfirm: () => handleDeleteWod(wod.id),
                                                        variant: 'destructive',
                                                        icon: 'destructive'
                                                    })}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <Card key={wod.id} className="border-border bg-card rounded-[2rem] overflow-hidden group hover:border-primary/20 transition-all duration-500 shadow-xl hover:shadow-primary/5 h-full flex flex-col">
                                                <CardHeader className="flex flex-col md:flex-row md:items-start justify-between gap-4 p-6 border-b border-border bg-muted/20 flex-shrink-0">
                                                    <div className="space-y-4">
                                                        <div className="flex flex-wrap items-center gap-3">
                                                            <Badge className={cn(
                                                                "text-[10px] h-6 px-3 font-black uppercase tracking-widest border-none shadow-lg",
                                                                wod.track === 'CrossFit' && "bg-primary text-primary-foreground shadow-primary/20",
                                                                wod.track === 'Novice' && "bg-emerald-500 text-foreground shadow-emerald-500/20",
                                                                wod.track === 'Bodybuilding' && "bg-blue-500 text-foreground shadow-blue-500/20",
                                                                wod.track === 'Engine' && "bg-orange-500 text-foreground shadow-orange-500/20"
                                                            )}>
                                                                {wod.track} {t('wods.track')?.toUpperCase()}
                                                            </Badge>
                                                        </div>
                                                        <CardTitle className="text-2xl md:text-3xl font-black uppercase tracking-tighter italic text-foreground group-hover:text-primary transition-all duration-500 line-clamp-2">
                                                            {wod.title}
                                                        </CardTitle>
                                                    </div>
                                                    <div className="flex items-center gap-2 bg-muted/30 p-2 rounded-2xl border border-border">
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
                                                        <div className="w-px h-6 bg-muted/50 mx-1" />
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
                                                <CardContent className="p-6 flex-1">
                                                    <div className="space-y-6">
                                                        <div className="space-y-4">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center">
                                                                        <Timer className="h-3 w-3 text-primary" />
                                                                    </div>
                                                                    <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">{t('wods.block_wod_short')}</span>
                                                                </div>
                                                                <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40">{t('common.structured', { defaultValue: 'STRUCTURED' })}</span>
                                                            </div>

                                                            {wod.structure && wod.structure.length > 0 ? (
                                                                <div className="space-y-4 relative">
                                                                    <div className="absolute left-4 top-0 bottom-0 w-px bg-muted/30" />
                                                                    {wod.structure.map((block) => (
                                                                        <div key={block.id} className="relative pl-10 group/block">
                                                                            <div className="absolute left-2.5 top-1.5 h-3 w-3 rounded-full border-2 border-primary bg-background dark:bg-card z-10 shadow-[0_0_8px_rgba(var(--primary),0.3)]" />
                                                                            <div className="flex items-center justify-between mb-2">
                                                                                <h4 className="text-sm font-black uppercase italic text-foreground tracking-tight">{block.title}</h4>
                                                                                {block.sets && (
                                                                                    <div className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[8px] font-black uppercase tracking-widest border border-primary/20">
                                                                                        {block.sets} {t('wods.sets', { defaultValue: 'SETS' })}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                            <div className="grid gap-2">
                                                                                {block.items.map((item) => (
                                                                                    <div key={item.id} className="flex items-center gap-4 p-3 rounded-xl bg-muted/20 border border-border/50 hover:border-primary/20 hover:bg-primary/5 transition-all duration-300 group/movement">
                                                                                        {(() => {
                                                                                            const mov = movements.find((m: any) => m.name === item.movementName);
                                                                                            return mov?.image_url ? (
                                                                                                <div className="h-8 w-8 rounded-lg overflow-hidden bg-muted/30 border border-muted-foreground/10 flex-shrink-0">
                                                                                                    <img src={mov.image_url} alt={item.movementName} className="w-full h-full object-contain" />
                                                                                                </div>
                                                                                            ) : null;
                                                                                        })()}
                                                                                        <div className="flex-1 space-y-0.5">
                                                                                            <p className="text-[11px] font-black uppercase italic tracking-tight">{item.movementName}</p>
                                                                                            {item.notes && <p className="text-[8px] text-muted-foreground uppercase font-bold tracking-widest opacity-60 line-clamp-1">{item.notes}</p>}
                                                                                        </div>
                                                                                        <div className="flex gap-4">
                                                                                            {item.reps && (
                                                                                                <div className="text-right min-w-[30px]">
                                                                                                    <p className="text-[10px] font-black italic">{item.reps}</p>
                                                                                                </div>
                                                                                            )}
                                                                                            {item.weight && (
                                                                                                <div className="text-right min-w-[30px]">
                                                                                                    <p className="text-[10px] font-black italic text-primary">{item.weight}</p>
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
                                                                <div className="p-6 rounded-2xl bg-muted/20 border border-border font-mono text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap shadow-inner relative overflow-hidden italic">
                                                                    <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                                                                    {wod.metcon}
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div className="p-4 rounded-2xl border border-orange-500/20 bg-orange-500/5 space-y-2 relative overflow-hidden group/callout">
                                                                <ZapIcon className="absolute -right-2 -top-2 h-16 w-16 text-orange-500/5 -rotate-12 group-hover:scale-110 transition-transform duration-700" />
                                                                <p className="text-[9px] font-black uppercase text-orange-500 tracking-[0.2em]">{t('wods.stimulus')}</p>
                                                                <p className="text-xs font-bold italic text-foreground/70/70 leading-relaxed relative z-10">{wod.stimulus || "Max effort within capacity."}</p>
                                                            </div>
                                                            <div className="p-4 rounded-2xl border border-blue-500/20 bg-blue-500/5 space-y-2 relative overflow-hidden group/callout">
                                                                <Shield className="absolute -right-2 -top-2 h-16 w-16 text-blue-500/5 -rotate-12 group-hover:scale-110 transition-transform duration-700" />
                                                                <p className="text-[9px] font-black uppercase text-blue-500 tracking-[0.2em]">{t('wods.scaling')}</p>
                                                                <p className="text-xs font-bold italic text-foreground/70/70 leading-relaxed relative z-10">{wod.scaling_options || "Scale weight to maintain intensity."}</p>
                                                            </div>
                                                        </div>

                                                        {calculateWeight(wod.metcon) && (
                                                            <div className="p-4 rounded-xl border border-primary/20 bg-primary/[0.03] flex items-center justify-between shadow-sm">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                                        <Dumbbell className="h-5 w-5 text-primary" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[9px] font-black uppercase text-primary/60 mb-0.5 tracking-widest">{t('wods.calculated_loading')}</p>
                                                                        <p className="text-sm font-black italic tracking-tight">{calculateWeight(wod.metcon)?.name} @ {calculateWeight(wod.metcon)?.percent}%</p>
                                                                    </div>
                                                                </div>
                                                                <div className="text-2xl font-black italic tracking-tighter text-primary">
                                                                    {calculateWeight(wod.metcon)?.weight}<span className="text-[10px] ml-1 opacity-60 uppercase font-black">kg</span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Pagination Controls */}
            {
                totalPages > 1 && (
                    <div className="flex items-center justify-between gap-4 mt-12 bg-muted/50 p-4 rounded-[2rem] border border-border">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="h-12 w-12 rounded-2xl bg-muted/50 hover:bg-muted border border-border disabled:opacity-20 flex items-center justify-center p-0"
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
                                                    currentPage === pageNumber ? "shadow-lg shadow-primary/20" : "bg-muted/50 hover:bg-muted"
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
                                className="h-12 w-12 rounded-2xl bg-muted/50 hover:bg-muted border border-border disabled:opacity-20 flex items-center justify-center p-0"
                            >
                                <ChevronRight className="h-6 w-6" />
                            </Button>
                        </div>
                        <div className="hidden md:block px-6">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">
                                {t('common.showing')} <span className="text-primary">{Math.min(filteredWods.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filteredWods.length, currentPage * itemsPerPage)}</span> {t('common.of')} {filteredWods.length} {t('wods.title')?.toLowerCase()}
                            </p>
                        </div>
                    </div>
                )
            }

            {/* Premium Toast Notification System */}
            {
                notification && (
                    <Toast
                        type={notification.type}
                        message={notification.message}
                        onClose={hideNotification}
                    />
                )
            }

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
        </div >
    );
};
