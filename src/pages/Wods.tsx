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
    GripVertical,
    Trash2,
    Dumbbell,
    Zap as ZapIcon,
    Shield,
    RotateCcw,
    Flame as FlameIcon,
    Copy,
    Pencil,
    Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
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
import { useTranslation } from 'react-i18next';
import { useNotification } from '@/hooks/useNotification';
import { Toast } from '@/components/ui/toast-custom';

interface BlockItem {
    id: string;
    movementName: string;
    reps?: string;
    weight?: string;
    notes?: string;
}

interface SessionBlock {
    id: string;
    type: 'warmup' | 'strength' | 'conditioning' | 'wod' | 'accessory' | 'cooldown';
    title: string;
    items: BlockItem[];
    sets?: string;
    duration?: string;
}

interface LessonBlock {
    time: string;
    activity: string;
    description: string;
}

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

const BLOCK_TEMPLATES: Record<string, { label: string, sets?: string, items: Omit<BlockItem, 'id'>[] }[]> = {
    warmup: [
        {
            label: 'General',
            sets: '1',
            items: [
                { movementName: 'Run', reps: '200m' },
                { movementName: 'Air Squat', reps: '10' },
                { movementName: 'Push-up', reps: '10' },
                { movementName: 'Sit-up', reps: '10' }
            ]
        },
        {
            label: 'Barbell',
            sets: '1',
            items: [
                { movementName: 'Good Morning', reps: '5', notes: 'Empty Bar' },
                { movementName: 'Back Squat', reps: '5' },
                { movementName: 'Shoulder Press', reps: '5' },
                { movementName: 'Stiff Leg Deadlift', reps: '5' }
            ]
        }
    ],
    strength: [
        {
            label: '5x5 Str',
            sets: '5',
            items: [{ movementName: 'Back Squat', reps: '5', weight: '75-80%', notes: 'Rest 2-3m' }]
        },
        {
            label: 'Max Effort',
            sets: 'Build to',
            items: [{ movementName: 'Snatch', reps: '1', weight: 'MAX', notes: 'Quality over weight' }]
        }
    ],
    wod: [
        {
            label: 'AMRAP 12',
            items: [
                { movementName: 'Burpee', reps: '10' },
                { movementName: 'Kettlebell Swing', reps: '15' },
                { movementName: 'Double Under', reps: '20' }
            ]
        },
        {
            label: '3 RFT',
            sets: '3',
            items: [
                { movementName: 'Run', reps: '400m' },
                { movementName: 'Thruster', reps: '21', weight: '95/65' },
                { movementName: 'Pull-up', reps: '12' }
            ]
        }
    ]
};

const MovementSearch: React.FC<{
    movements: any[];
    onSelect: (name: string) => void;
    onCreate: (name: string) => void;
}> = ({ movements, onSelect, onCreate }) => {
    const [search, setSearch] = useState('');
    const filtered = useMemo(() =>
        movements.filter(m => m.name.toLowerCase().includes(search.toLowerCase())).slice(0, 10),
        [movements, search]
    );

    return (
        <div className="relative group/search">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within/search:text-primary transition-all duration-300" />
            <Input
                placeholder="Find or define movement..."
                className="h-12 pl-12 bg-white/5 border-white/5 rounded-2xl font-black uppercase italic text-[10px] tracking-widest focus:ring-primary/20 transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
                <div className="absolute z-[100] left-0 right-0 top-14 glass border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl p-3 flex flex-col gap-2 scale-in-center">
                    {filtered.map(m => (
                        <button
                            key={m.id}
                            onClick={() => {
                                onSelect(m.name);
                                setSearch('');
                            }}
                            className="flex items-center gap-4 p-3 hover:bg-primary/10 rounded-2xl text-left transition-all duration-300 border border-transparent hover:border-primary/20 group/suggest"
                        >
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center transition-transform group-hover/suggest:scale-110">
                                <Dumbbell className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-xs font-black uppercase italic leading-none tracking-tight">{m.name}</p>
                                <p className="text-[9px] text-muted-foreground uppercase font-black opacity-50 mt-1">{m.category}</p>
                            </div>
                            <Plus className="h-4 w-4 text-primary ml-auto opacity-0 group-hover/suggest:opacity-100 transition-opacity" />
                        </button>
                    ))}
                    {filtered.length === 0 && (
                        <Button
                            variant="ghost"
                            className="h-14 justify-start gap-3 rounded-2xl text-xs font-black uppercase italic text-primary hover:bg-primary/10"
                            onClick={() => {
                                onCreate(search);
                                setSearch('');
                            }}
                        >
                            <Plus className="h-5 w-5" /> Define "{search.toUpperCase()}"
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
};

export const Wods: React.FC = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [wods, setWods] = useState<WOD[]>([]);
    const [loading, setLoading] = useState(true);
    const [showEditor, setShowEditor] = useState(false);
    const [editingWodId, setEditingWodId] = useState<string | null>(null);
    const [isCopying, setIsCopying] = useState<string | null>(null);
    const [activeTrack, setActiveTrack] = useState<string>('all');

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
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [idToDelete, setIdToDelete] = useState<string | null>(null);
    const { notification, showNotification, hideNotification } = useNotification();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        fetchWods();
        fetchUserPRs();
        fetchMovements();
    }, []);

    const fetchMovements = async () => {
        const { data } = await supabase.from('movements').select('*').order('name');
        if (data) setMovements(data);
    };

    const addBlock = (type: SessionBlock['type']) => {
        const titles = {
            warmup: t('wods.block_warmup', { defaultValue: 'Warm-up / Movilidad' }),
            strength: t('wods.block_strength', { defaultValue: 'Strength / Skill' }),
            conditioning: t('wods.block_conditioning', { defaultValue: 'Conditioning / Power' }),
            wod: t('wods.block_wod', { defaultValue: 'Metcon / WOD' }),
            accessory: t('wods.block_accessory', { defaultValue: 'Accessory / Core' }),
            cooldown: t('wods.block_cooldown', { defaultValue: 'Cooldown / Recovery' })
        };

        const newBlock: SessionBlock = {
            id: Math.random().toString(36).substr(2, 9),
            type,
            title: titles[type],
            items: []
        };
        setSessionBlocks([...sessionBlocks, newBlock]);
    };

    const addTemplateToBlock = (blockId: string, template: any) => {
        setSessionBlocks(sessionBlocks.map(b => {
            if (b.id === blockId) {
                const newItems = template.items.map((item: any) => ({
                    ...item,
                    id: Math.random().toString(36).substr(2, 9)
                }));
                return {
                    ...b,
                    items: [...b.items, ...newItems],
                    sets: template.sets || b.sets
                };
            }
            return b;
        }));
    };

    const addItemToBlock = (blockId: string, movementName: string) => {
        setSessionBlocks(sessionBlocks.map(b => {
            if (b.id === blockId) {
                const newItem: BlockItem = {
                    id: Math.random().toString(36).substr(2, 9),
                    movementName,
                    reps: '',
                    weight: '',
                    notes: ''
                };
                return { ...b, items: [...b.items, newItem] };
            }
            return b;
        }));
    };

    const updateItem = (blockId: string, itemId: string, updates: Partial<BlockItem>) => {
        setSessionBlocks(sessionBlocks.map(b => {
            if (b.id === blockId) {
                return {
                    ...b,
                    items: b.items.map(item => item.id === itemId ? { ...item, ...updates } : item)
                };
            }
            return b;
        }));
    };


    const removeItem = (blockId: string, itemId: string) => {
        setSessionBlocks(sessionBlocks.map(b => {
            if (b.id === blockId) {
                return { ...b, items: b.items.filter(i => i.id !== itemId) };
            }
            return b;
        }));
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

    const removeBlock = (id: string) => {
        setSessionBlocks(sessionBlocks.filter(b => b.id !== id));
    };

    const updateBlock = (id: string, updates: Partial<SessionBlock>) => {
        setSessionBlocks(sessionBlocks.map(b => b.id === id ? { ...b, ...updates } : b));
    };

    const fetchWods = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('wods')
            .select('*')
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

    const handleDeleteWod = async () => {
        if (!idToDelete) return;

        setLoading(true);
        const { error } = await supabase.from('wods').delete().eq('id', idToDelete);
        if (!error) {
            fetchWods();
        }
        setDeleteConfirmOpen(false);
        setIdToDelete(null);
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
        if (!user) return;
        const { data } = await supabase
            .from('personal_records')
            .select('*, movements(name)')
            .eq('user_id', user.id);
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
            structure: sessionBlocks
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

                                    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                                        {[
                                            { type: 'warmup', icon: <FlameIcon className="h-5 w-5" />, label: 'Warm-up', color: 'border-orange-500/20 text-orange-500 hover:bg-orange-500/10' },
                                            { type: 'strength', icon: <Dumbbell className="h-5 w-5" />, label: 'Strength', color: 'border-blue-500/20 text-blue-500 hover:bg-blue-500/10' },
                                            { type: 'conditioning', icon: <ZapIcon className="h-5 w-5" />, label: 'Power', color: 'border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/10' },
                                            { type: 'wod', icon: <Trophy className="h-5 w-5" />, label: 'WOD', color: 'border-primary/20 text-primary hover:bg-primary/10' },
                                            { type: 'accessory', icon: <Shield className="h-5 w-5" />, label: 'Extra', color: 'border-indigo-500/20 text-indigo-500 hover:bg-indigo-500/10' },
                                            { type: 'cooldown', icon: <RotateCcw className="h-5 w-5" />, label: 'Recovery', color: 'border-zinc-500/20 text-zinc-500 hover:bg-zinc-500/10' }
                                        ].map((btn) => (
                                            <Button
                                                key={btn.type}
                                                type="button"
                                                variant="outline"
                                                onClick={() => addBlock(btn.type as any)}
                                                className={cn(
                                                    "flex-col h-20 gap-2 p-3 rounded-2xl border-2 transition-all hover:scale-105 active:scale-95 bg-white/5",
                                                    btn.color
                                                )}
                                            >
                                                {btn.icon}
                                                <span className="text-[9px] font-black uppercase tracking-widest">{btn.label}</span>
                                            </Button>
                                        ))}
                                    </div>

                                    <div className="space-y-6">
                                        {sessionBlocks.length === 0 ? (
                                            <div className="border-4 border-dashed border-white/5 rounded-[2.5rem] p-20 text-center bg-white/5">
                                                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                                                    <Plus className="h-8 w-8 text-primary" />
                                                </div>
                                                <p className="text-sm font-black uppercase tracking-[0.3em] text-muted-foreground italic">Add your first block to start programming</p>
                                            </div>
                                        ) : isMounted && (
                                            <DragDropContext onDragEnd={(result) => {
                                                const { source, destination, type } = result;
                                                if (!destination) return;

                                                if (type === 'block') {
                                                    const newBlocks = Array.from(sessionBlocks);
                                                    const [reorderedBlock] = newBlocks.splice(source.index, 1);
                                                    newBlocks.splice(destination.index, 0, reorderedBlock);
                                                    setSessionBlocks(newBlocks);
                                                    return;
                                                }

                                                const blockId = source.droppableId.replace('items-', '');
                                                setSessionBlocks(sessionBlocks.map(b => {
                                                    if (b.id === blockId) {
                                                        const newItems = Array.from(b.items);
                                                        const [reorderedItem] = newItems.splice(source.index, 1);
                                                        newItems.splice(destination.index, 0, reorderedItem);
                                                        return { ...b, items: newItems };
                                                    }
                                                    return b;
                                                }));
                                            }}>
                                                <Droppable droppableId="session-blocks" type="block">
                                                    {(provided) => (
                                                        <div
                                                            {...provided.droppableProps}
                                                            ref={provided.innerRef}
                                                            className="space-y-3"
                                                        >
                                                            {sessionBlocks.map((block, index) => (
                                                                <Draggable key={block.id} draggableId={block.id} index={index}>
                                                                    {(provided, snapshot) => (
                                                                        <div
                                                                            ref={provided.innerRef}
                                                                            {...provided.draggableProps}
                                                                            className={cn(
                                                                                "glass border-white/5 rounded-[2.5rem] overflow-hidden group/block transition-all duration-300 mb-6",
                                                                                snapshot.isDragging && "shadow-2xl border-primary/30 scale-[1.02] z-50 ring-4 ring-primary/10"
                                                                            )}
                                                                        >
                                                                            <div className="flex items-center gap-6 px-10 py-6 bg-white/5 border-b border-white/5">
                                                                                <div
                                                                                    {...provided.dragHandleProps}
                                                                                    className="cursor-grab active:cursor-grabbing p-2 text-muted-foreground/30 hover:text-primary transition-colors"
                                                                                >
                                                                                    <GripVertical className="h-6 w-6" />
                                                                                </div>
                                                                                <div className="flex-1 flex items-center gap-4">
                                                                                    <div className={cn(
                                                                                        "h-3 w-3 rounded-full shadow-[0_0_10px_currentColor]",
                                                                                        block.type === 'warmup' && "text-orange-500 bg-orange-500",
                                                                                        block.type === 'strength' && "text-blue-500 bg-blue-500",
                                                                                        block.type === 'conditioning' && "text-emerald-500 bg-emerald-500",
                                                                                        block.type === 'wod' && "text-primary bg-primary",
                                                                                        block.type === 'accessory' && "text-indigo-500 bg-indigo-500",
                                                                                        block.type === 'cooldown' && "text-zinc-500 bg-zinc-500"
                                                                                    )} />
                                                                                    <Input
                                                                                        className="h-10 bg-transparent border-none font-black uppercase italic text-2xl tracking-tighter p-0 focus-visible:ring-0 w-full"
                                                                                        value={block.title}
                                                                                        onChange={(e) => updateBlock(block.id, { title: e.target.value })}
                                                                                    />
                                                                                    <div className="flex items-center gap-3 bg-white/5 rounded-2xl border border-white/10 px-4 h-11 shrink-0">
                                                                                        <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">SETS</span>
                                                                                        <Input
                                                                                            className="h-8 w-12 bg-transparent border-none font-black uppercase italic text-lg p-0 focus-visible:ring-0 text-center"
                                                                                            placeholder="1"
                                                                                            value={block.sets || ''}
                                                                                            onChange={(e) => updateBlock(block.id, { sets: e.target.value })}
                                                                                        />
                                                                                    </div>
                                                                                </div>
                                                                                <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all" onClick={() => removeBlock(block.id)}>
                                                                                    <Trash2 className="h-6 w-6" />
                                                                                </Button>
                                                                            </div>

                                                                            <div className="p-10 space-y-8">
                                                                                <div className="flex flex-wrap gap-2">
                                                                                    {BLOCK_TEMPLATES[block.type]?.map((template) => (
                                                                                        <Button
                                                                                            key={template.label}
                                                                                            variant="outline"
                                                                                            size="sm"
                                                                                            className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white/5 border-white/10 hover:border-primary/40 hover:bg-primary/5 text-muted-foreground hover:text-primary transition-all active:scale-95"
                                                                                            onClick={() => addTemplateToBlock(block.id, template)}
                                                                                        >
                                                                                            {template.label}
                                                                                        </Button>
                                                                                    ))}
                                                                                </div>

                                                                                <MovementSearch
                                                                                    movements={movements}
                                                                                    onSelect={(name) => addItemToBlock(block.id, name)}
                                                                                    onCreate={(name) => {
                                                                                        // Call create here
                                                                                        addItemToBlock(block.id, name);
                                                                                    }}
                                                                                />

                                                                                <Droppable droppableId={`items-${block.id}`} type="item">
                                                                                    {(provided) => (
                                                                                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4 min-h-[50px]">
                                                                                            {block.items.map((item, itemIdx) => (
                                                                                                <Draggable key={item.id} draggableId={item.id} index={itemIdx}>
                                                                                                    {(provided, snapshot) => (
                                                                                                        <div
                                                                                                            ref={provided.innerRef}
                                                                                                            {...provided.draggableProps}
                                                                                                            className={cn(
                                                                                                                "flex flex-col gap-4 p-6 rounded-[2rem] border border-white/10 bg-white/5 group/item transition-all duration-300",
                                                                                                                snapshot.isDragging && "shadow-2xl border-primary/40 bg-white/10 z-50 scale-[1.03]"
                                                                                                            )}
                                                                                                        >
                                                                                                            <div className="flex items-center justify-between">
                                                                                                                <div className="flex items-center gap-4">
                                                                                                                    <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground/30 hover:text-primary transition-colors">
                                                                                                                        <GripVertical className="h-4 w-4" />
                                                                                                                    </div>
                                                                                                                    <p className="text-sm font-black uppercase italic tracking-tight text-foreground">{item.movementName}</p>
                                                                                                                </div>
                                                                                                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => removeItem(block.id, item.id)}>
                                                                                                                    <Trash2 className="h-4 w-4" />
                                                                                                                </Button>
                                                                                                            </div>
                                                                                                            <div className="grid grid-cols-3 gap-4">
                                                                                                                <div className="space-y-1">
                                                                                                                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-1">REPS</p>
                                                                                                                    <Input className="h-10 bg-white/5 border-white/10 rounded-xl text-xs font-bold uppercase italic focus:ring-primary/20" placeholder="e.g. 10" value={item.reps} onChange={e => updateItem(block.id, item.id, { reps: e.target.value })} />
                                                                                                                </div>
                                                                                                                <div className="space-y-1">
                                                                                                                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-1">WEIGHT</p>
                                                                                                                    <Input className="h-10 bg-white/5 border-white/10 rounded-xl text-xs font-bold uppercase italic focus:ring-primary/20" placeholder="e.g. 100kg" value={item.weight} onChange={e => updateItem(block.id, item.id, { weight: e.target.value })} />
                                                                                                                </div>
                                                                                                                <div className="space-y-1">
                                                                                                                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-1">NOTES</p>
                                                                                                                    <Input className="h-10 bg-white/5 border-white/10 rounded-xl text-xs font-bold uppercase italic focus:ring-primary/20" placeholder="..." value={item.notes} onChange={e => updateItem(block.id, item.id, { notes: e.target.value })} />
                                                                                                                </div>
                                                                                                            </div>
                                                                                                        </div>
                                                                                                    )}
                                                                                                </Draggable>
                                                                                            ))}
                                                                                            {provided.placeholder}
                                                                                        </div>
                                                                                    )}
                                                                                </Droppable>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </Draggable>
                                                            ))}
                                                            {provided.placeholder}
                                                        </div>
                                                    )}
                                                </Droppable>
                                            </DragDropContext>
                                        )}
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-8">
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

            {/* Bias Dashboard (Condensed to match UI style) */}
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
                    filteredWods.map(wod => (
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
                                        onClick={() => {
                                            setIdToDelete(wod.id);
                                            setDeleteConfirmOpen(true);
                                        }}
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

            {/* Premium Toast Notification System */}
            {notification && (
                <Toast
                    type={notification.type}
                    message={notification.message}
                    onClose={hideNotification}
                />
            )}

            {/* Premium Confirmation Dialog */}
            <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <DialogContent shadow-none className="sm:max-w-[400px] border-destructive/20 bg-background/95 backdrop-blur-xl">
                    <DialogHeader className="space-y-4">
                        <div className="mx-auto h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center border-2 border-destructive/20 shadow-[0_0_30px_rgba(239,68,68,0.1)]">
                            <Trash2 className="h-10 w-10 text-destructive animate-pulse" />
                        </div>
                        <div className="space-y-2 text-center">
                            <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter text-destructive">
                                {t('common.confirm_delete', { defaultValue: 'CONFIRMAR ELIMINACIÓN' })}
                            </DialogTitle>
                            <p className="text-sm font-bold uppercase italic tracking-tight text-muted-foreground opacity-70 px-4 leading-relaxed">
                                {t('wods.delete_warning', { defaultValue: '¿ESTÁS SEGURO DE QUE DESEAS ELIMINAR ESTE WOD? ESTA ACCIÓN NO SE PUEDE DESHACER.' })}
                            </p>
                        </div>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-3 mt-6">
                        <Button
                            variant="outline"
                            className="font-black uppercase italic h-14 border-muted-foreground/20 hover:bg-muted/50 text-base"
                            onClick={() => {
                                setDeleteConfirmOpen(false);
                                setIdToDelete(null);
                            }}
                        >
                            {t('common.cancel', { defaultValue: 'CANCELAR' })}
                        </Button>
                        <Button
                            variant="destructive"
                            className="font-black uppercase italic h-14 shadow-xl shadow-destructive/20 text-base"
                            onClick={handleDeleteWod}
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : t('common.delete', { defaultValue: 'ELIMINAR' })}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};
