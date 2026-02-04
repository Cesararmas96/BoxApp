import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
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
    sets?: string;
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

const BLOCK_TEMPLATES: Record<string, { label: string, items: Omit<BlockItem, 'id'>[] }[]> = {
    warmup: [
        {
            label: 'General',
            items: [
                { movementName: 'Run', reps: '200m' },
                { movementName: 'Air Squat', sets: '1', reps: '10' },
                { movementName: 'Push-up', sets: '1', reps: '10' },
                { movementName: 'Sit-up', sets: '1', reps: '10' }
            ]
        },
        {
            label: 'Barbell',
            items: [
                { movementName: 'Good Morning', sets: '1', reps: '5', notes: 'Empty Bar' },
                { movementName: 'Back Squat', sets: '1', reps: '5' },
                { movementName: 'Shoulder Press', sets: '1', reps: '5' },
                { movementName: 'Stiff Leg Deadlift', sets: '1', reps: '5' }
            ]
        }
    ],
    strength: [
        {
            label: '5x5 Str',
            items: [{ movementName: 'Back Squat', sets: '5', reps: '5', weight: '75-80%', notes: 'Rest 2-3m' }]
        },
        {
            label: 'Max Effort',
            items: [{ movementName: 'Snatch', sets: 'Build to', reps: '1', weight: 'MAX', notes: 'Quality over weight' }]
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
            items: [
                { movementName: 'Run', reps: '400m' },
                { movementName: 'Thruster', sets: '3', reps: '21', weight: '95/65' },
                { movementName: 'Pull-up', sets: '3', reps: '12' }
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
        <div className="relative">
            <Search className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />
            <Input
                placeholder="Search movement..."
                className="h-7 pl-7 text-[10px] uppercase font-bold italic"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
                <Card className="absolute z-[100] left-0 right-0 top-8 max-h-[200px] overflow-y-auto shadow-2xl p-2 flex flex-col gap-1">
                    {filtered.map(m => (
                        <button
                            key={m.id}
                            onClick={() => {
                                onSelect(m.name);
                                setSearch('');
                            }}
                            className="flex items-center gap-2 p-1.5 hover:bg-muted rounded-lg text-left transition-colors border border-transparent hover:border-primary/20"
                        >
                            <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center">
                                <Dumbbell className="h-3 w-3 text-primary" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase italic leading-none">{m.name}</p>
                                <p className="text-[8px] text-muted-foreground uppercase font-bold">{m.category}</p>
                            </div>
                        </button>
                    ))}
                    {filtered.length === 0 && (
                        <Button
                            variant="ghost"
                            className="h-8 justify-start gap-2 text-[10px] font-black uppercase italic text-primary"
                            onClick={() => {
                                onCreate(search);
                                setSearch('');
                            }}
                        >
                            <Plus className="h-3 w-3" /> Create "{search}"
                        </Button>
                    )}
                </Card>
            )}
        </div>
    );
};

export const Wods: React.FC = () => {
    const { t } = useTranslation();
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
        track: 'CrossFit' as any
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
                return { ...b, items: [...b.items, ...newItems] };
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
                    sets: '',
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
            setWods(data.map(w => ({
                ...w,
                modalities: w.modalities || [],
                lesson_plan: w.lesson_plan || [],
                track: w.track || 'CrossFit'
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
            track: wod.track
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
                    if (item.sets) line += `: ${item.sets} x`;
                    if (item.reps) line += ` ${item.reps}`;
                    if (item.weight) line += ` (${item.weight})`;
                    return line;
                }).join('\n');
                return `[${block.title.toUpperCase()}]\n${items}`;
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
        const { data: { user } } = await supabase.auth.getUser();
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
            structure: sessionBlocks,
            date: new Date().toISOString()
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
                scaling_injured: '', modalities: [], lesson_plan: [], track: 'CrossFit'
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
            <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold italic tracking-tighter uppercase text-primary flex items-center gap-2">
                        <Activity className="h-8 w-8 text-primary" /> {t('wods.title')}
                    </h1>
                    <p className="text-muted-foreground text-sm font-bold uppercase italic opacity-70">{t('wods.subtitle')}</p>
                </div>

                <div className="flex gap-2">
                    <Dialog open={showEditor} onOpenChange={(open) => {
                        setShowEditor(open);
                        if (!open) {
                            setEditingWodId(null);
                            setNewWOD({
                                title: '', metcon: '', stimulus: '', scaling_options: '',
                                scaling_beginner: '', scaling_intermediate: '', scaling_advanced: '',
                                scaling_injured: '', modalities: [], lesson_plan: [], track: 'CrossFit'
                            });
                            setSessionBlocks([]);
                        }
                    }}>
                        <DialogTrigger asChild>
                            <Button className="gap-2 font-black uppercase italic shadow-lg shadow-primary/20">
                                <Plus className="h-4 w-4" /> {t('wods.new_session')}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[800px] h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">
                                    {editingWodId ? 'Edit Session' : t('wods.designer_title')}
                                </DialogTitle>
                                <DialogDescription className="font-bold uppercase text-[10px] opacity-70">
                                    {editingWodId ? 'Modify the existing workout parameters' : t('wods.designer_subtitle')}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-6 mt-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="uppercase text-[10px] font-black">{t('wods.track')}</Label>
                                        <Select value={newWOD.track} onValueChange={(v) => setNewWOD({ ...newWOD, track: v as any })}>
                                            <SelectTrigger className="font-bold italic uppercase h-10">
                                                <SelectValue placeholder="Select track" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {TRACKS.map(t => <SelectItem key={t} value={t} className="font-bold uppercase italic">{t}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="uppercase text-[10px] font-black">{t('wods.wod_title')}</Label>
                                        <Input
                                            placeholder="e.g. MORNING GRIND"
                                            className="uppercase italic font-bold h-10"
                                            value={newWOD.title}
                                            onChange={(e) => setNewWOD({ ...newWOD, title: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between border-b pb-2">
                                        <Label className="uppercase text-[10px] font-black">{t('wods.routine_structure')}</Label>
                                        <span className="text-[10px] text-muted-foreground font-bold italic uppercase">Build your session block by block</span>
                                    </div>

                                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                                        {[
                                            { type: 'warmup', icon: <FlameIcon className="h-3.5 w-3.5" />, label: t('wods.block_warmup_short', { defaultValue: 'Warm-up' }), color: 'text-orange-500 bg-orange-500/10 border-orange-500/20' },
                                            { type: 'strength', icon: <Dumbbell className="h-3.5 w-3.5" />, label: t('wods.block_strength_short', { defaultValue: 'Strength' }), color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
                                            { type: 'conditioning', icon: <ZapIcon className="h-3.5 w-3.5" />, label: t('wods.block_conditioning_short', { defaultValue: 'Power' }), color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
                                            { type: 'wod', icon: <Trophy className="h-3.5 w-3.5" />, label: t('wods.block_wod_short', { defaultValue: 'WOD' }), color: 'text-primary bg-primary/10 border-primary/20' },
                                            { type: 'accessory', icon: <Shield className="h-3.5 w-3.5" />, label: t('wods.block_accessory_short', { defaultValue: 'Extra' }), color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20' },
                                            { type: 'cooldown', icon: <RotateCcw className="h-3.5 w-3.5" />, label: t('wods.block_cooldown_short', { defaultValue: 'Recovery' }), color: 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20' }
                                        ].map((btn) => (
                                            <Button
                                                key={btn.type}
                                                type="button"
                                                variant="outline"
                                                onClick={() => addBlock(btn.type as any)}
                                                className={cn("flex-col h-16 gap-1 p-2 border-2", btn.color)}
                                            >
                                                {btn.icon}
                                                <span className="text-[8px] font-black uppercase tracking-tight">{btn.label}</span>
                                            </Button>
                                        ))}
                                    </div>

                                    <div className="space-y-4">
                                        {sessionBlocks.length === 0 ? (
                                            <div className="border-2 border-dashed rounded-xl p-12 text-center opacity-30">
                                                <Plus className="h-8 w-8 mx-auto mb-2" />
                                                <p className="text-[10px] font-black uppercase tracking-widest italic">Add your first block to start programming</p>
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
                                                                        <Card
                                                                            ref={provided.innerRef}
                                                                            {...provided.draggableProps}
                                                                            className={cn(
                                                                                "border shadow-sm group transition-shadow bg-background",
                                                                                snapshot.isDragging && "shadow-2xl border-primary/50 relative z-50"
                                                                            )}
                                                                        >
                                                                            <div className="flex items-center gap-3 px-3 py-2 bg-muted/30 border-b">
                                                                                <div
                                                                                    {...provided.dragHandleProps}
                                                                                    className="cursor-grab active:cursor-grabbing"
                                                                                >
                                                                                    <GripVertical className="h-4 w-4 text-muted-foreground opacity-50 hover:opacity-100 transition-opacity" />
                                                                                </div>
                                                                                <div className="flex-1 flex items-center gap-2">
                                                                                    <div className={cn(
                                                                                        "h-2 w-2 rounded-full",
                                                                                        block.type === 'warmup' && "bg-orange-500",
                                                                                        block.type === 'strength' && "bg-blue-500",
                                                                                        block.type === 'conditioning' && "bg-emerald-500",
                                                                                        block.type === 'wod' && "bg-primary",
                                                                                        block.type === 'accessory' && "bg-indigo-500",
                                                                                        block.type === 'cooldown' && "bg-zinc-500"
                                                                                    )} />
                                                                                    <Input
                                                                                        className="h-6 bg-transparent border-none font-black uppercase italic text-[10px] tracking-tight p-0 focus-visible:ring-0"
                                                                                        value={block.title}
                                                                                        onChange={(e) => updateBlock(block.id, { title: e.target.value })}
                                                                                    />
                                                                                    <div className="flex items-center gap-1 bg-background/50 rounded-md border px-1.5 h-6">
                                                                                        <span className="text-[8px] font-black uppercase opacity-50">SETS:</span>
                                                                                        <Input
                                                                                            className="h-4 w-12 bg-transparent border-none font-black uppercase italic text-[10px] p-0 focus-visible:ring-0 text-center"
                                                                                            placeholder="1"
                                                                                            value={block.sets || ''}
                                                                                            onChange={(e) => updateBlock(block.id, { sets: e.target.value })}
                                                                                        />
                                                                                    </div>
                                                                                </div>
                                                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeBlock(block.id)}>
                                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                                </Button>
                                                                            </div>
                                                                            <div className="p-0">
                                                                                <div className="px-3 pt-3 space-y-3">
                                                                                    <div className="flex flex-wrap gap-1">
                                                                                        {BLOCK_TEMPLATES[block.type]?.map((template) => (
                                                                                            <Button
                                                                                                key={template.label}
                                                                                                variant="secondary"
                                                                                                size="sm"
                                                                                                className="h-5 px-2 text-[8px] font-bold uppercase tracking-wider bg-primary/5 hover:bg-primary/20 text-primary border border-primary/10"
                                                                                                onClick={() => addTemplateToBlock(block.id, template)}
                                                                                            >
                                                                                                {template.label}
                                                                                            </Button>
                                                                                        ))}
                                                                                    </div>
                                                                                    <MovementSearch
                                                                                        movements={movements}
                                                                                        onSelect={(name) => addItemToBlock(block.id, name)}
                                                                                        onCreate={async (name) => {
                                                                                            const { data, error } = await supabase
                                                                                                .from('movements')
                                                                                                .insert([{ name, category: 'Other' }])
                                                                                                .select()
                                                                                                .single();
                                                                                            if (!error && data) {
                                                                                                fetchMovements();
                                                                                                addItemToBlock(block.id, data.name);
                                                                                            }
                                                                                        }}
                                                                                    />
                                                                                </div>
                                                                                <div className="p-3">
                                                                                    <Droppable droppableId={`items-${block.id}`} type="item">
                                                                                        {(provided) => (
                                                                                            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2 min-h-[50px]">
                                                                                                {block.items.map((item, itemIdx) => (
                                                                                                    <Draggable key={item.id} draggableId={item.id} index={itemIdx}>
                                                                                                        {(provided, snapshot) => (
                                                                                                            <div
                                                                                                                ref={provided.innerRef}
                                                                                                                {...provided.draggableProps}
                                                                                                                className={cn(
                                                                                                                    "flex flex-col gap-1.5 p-2 rounded-lg border bg-muted/5 group/item",
                                                                                                                    snapshot.isDragging && "shadow-lg border-primary/40 bg-background z-50"
                                                                                                                )}
                                                                                                            >
                                                                                                                <div className="flex items-center justify-between">
                                                                                                                    <div className="flex items-center gap-2">
                                                                                                                        <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing p-1">
                                                                                                                            <GripVertical className="h-3 w-3 opacity-50" />
                                                                                                                        </div>
                                                                                                                        <p className="text-[10px] font-black uppercase italic text-primary">{item.movementName}</p>
                                                                                                                    </div>
                                                                                                                    <Button variant="ghost" size="icon" className="h-4 w-4 text-destructive" onClick={() => removeItem(block.id, item.id)}>
                                                                                                                        <Trash2 className="h-3 w-3" />
                                                                                                                    </Button>
                                                                                                                </div>
                                                                                                                <div className="grid grid-cols-3 gap-2">
                                                                                                                    <Input className="h-6 text-[9px] font-bold" placeholder="REPS" value={item.reps} onChange={e => updateItem(block.id, item.id, { reps: e.target.value })} />
                                                                                                                    <Input className="h-6 text-[9px] font-bold" placeholder="WEIGHT" value={item.weight} onChange={e => updateItem(block.id, item.id, { weight: e.target.value })} />
                                                                                                                    <Input className="h-6 text-[9px] font-bold" placeholder="NOTES" value={item.notes} onChange={e => updateItem(block.id, item.id, { notes: e.target.value })} />
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
                                                                        </Card>
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

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="uppercase text-[10px] font-black text-orange-500">{t('wods.stimulus')}</Label>
                                        <Textarea className="h-20 text-xs italic" value={newWOD.stimulus} onChange={e => setNewWOD({ ...newWOD, stimulus: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="uppercase text-[10px] font-black text-blue-500">{t('wods.scaling')}</Label>
                                        <Textarea className="h-20 text-xs italic" value={newWOD.scaling_options} onChange={e => setNewWOD({ ...newWOD, scaling_options: e.target.value })} />
                                    </div>
                                </div>

                                <Button onClick={handlePublishManual} className="w-full font-black uppercase italic" disabled={loading}>
                                    {loading ? <Loader2 className="animate-spin" /> : t('wods.publish')}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </header>

            {/* Quick Actions & Filters Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="flex flex-wrap gap-2">
                    <Button variant={activeTrack === 'all' ? "default" : "outline"} onClick={() => setActiveTrack('all')} className="h-9 px-4 font-black uppercase italic text-[10px] tracking-widest">
                        {t('wods.all_tracks')}
                    </Button>
                    {TRACKS.map(t => (
                        <Button
                            key={t}
                            variant={activeTrack === t ? "default" : "outline"}
                            onClick={() => setActiveTrack(t)}
                            className={cn(
                                "h-9 px-4 font-black uppercase italic text-[10px] tracking-widest",
                                t === 'CrossFit' && "border-primary/40 text-primary",
                                t === 'Novice' && "border-emerald-500/40 text-emerald-500",
                                t === 'Bodybuilding' && "border-blue-500/40 text-blue-500",
                                t === 'Engine' && "border-orange-500/40 text-orange-500"
                            )}
                        >
                            {t}
                        </Button>
                    ))}
                </div>

                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={t('common.search')}
                        className="pl-8 h-9 text-xs focus-visible:ring-primary"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Bias Dashboard (Condensed to match UI style) */}
            {(activeTrack === 'all' || activeTrack === 'CrossFit') && (
                <Card className="border shadow-xl overflow-hidden">
                    <CardHeader className="py-4 border-b bg-muted/20">
                        <div className="flex items-center gap-2">
                            <Target className="h-4 w-4 text-primary" />
                            <CardTitle className="text-sm font-bold uppercase italic tracking-tight">{t('wods.bias_checker')}</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="py-6">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                            {Object.entries(last7DaysBias).map(([key, count]) => (
                                <div key={key} className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-60">
                                        <span>{key}</span>
                                        <span>{count} / 7</span>
                                    </div>
                                    <Progress value={(count / 7) * 100} className="h-1.5" />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Board Feed */}
            <div className="grid gap-6">
                {wods.length === 0 && !loading ? (
                    <Card className="border-dashed border-2 py-20 text-center bg-muted/10">
                        <div className="space-y-4">
                            <Calendar className="h-12 w-12 text-muted-foreground/30 mx-auto" />
                            <p className="text-muted-foreground font-bold uppercase italic">{t('common.no_data')}</p>
                        </div>
                    </Card>
                ) : (
                    filteredWods.map(wod => (
                        <Card key={wod.id} className="border shadow-xl overflow-hidden group hover:border-primary/40 transition-all">
                            <CardHeader className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b bg-muted/10">
                                <div className="space-y-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Badge className={cn(
                                            "text-[9px] h-5 font-black uppercase italic",
                                            wod.track === 'CrossFit' && "bg-primary text-white",
                                            wod.track === 'Novice' && "bg-emerald-500 text-white",
                                            wod.track === 'Bodybuilding' && "bg-blue-500 text-white",
                                            wod.track === 'Engine' && "bg-orange-500 text-white"
                                        )}>
                                            {wod.track} Track
                                        </Badge>
                                        <Badge variant="outline" className="text-[10px] h-5 bg-background font-black border-primary/30 text-primary uppercase">
                                            {new Date(wod.date).toLocaleDateString()}
                                        </Badge>
                                    </div>
                                    <CardTitle className="text-3xl font-bold uppercase tracking-tight italic text-foreground group-hover:text-primary transition-colors">
                                        {wod.title}
                                    </CardTitle>
                                </div>
                                <div className="flex gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                                        onClick={() => handleCopyWod(wod)}
                                    >
                                        {isCopying === wod.id ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-blue-500"
                                        onClick={() => handleEditWod(wod)}
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                        onClick={() => {
                                            setIdToDelete(wod.id);
                                            setDeleteConfirmOpen(true);
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-8">
                                <div className="space-y-8">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between border-b border-primary/10 pb-2">
                                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary italic">
                                                <Timer className="h-4 w-4" /> {t('wods.routine_description')}
                                            </div>
                                            <Badge variant="secondary" className="text-[8px] font-black uppercase tracking-tighter opacity-50">STRUCTURED VIEW</Badge>
                                        </div>

                                        {wod.structure && wod.structure.length > 0 ? (
                                            <div className="grid gap-4">
                                                {wod.structure.map((block) => (
                                                    <div key={block.id} className="relative pl-6 border-l-2 border-muted hover:border-primary/30 transition-colors group/timeline">
                                                        <div className="absolute -left-[5px] top-0 h-2 w-2 rounded-full bg-muted group-hover/timeline:bg-primary transition-colors" />
                                                        <div className="flex items-center justify-between mb-2">
                                                            <p className="text-[10px] font-black uppercase italic text-primary/70 tracking-tighter">{block.title}</p>
                                                            {block.sets && (
                                                                <Badge variant="outline" className="text-[8px] font-black py-0 h-4 bg-primary/5 text-primary border-primary/20">
                                                                    {block.sets} SETS
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <div className="grid gap-1.5">
                                                            {block.items.map((item) => (
                                                                <div key={item.id} className="flex items-start gap-4 p-3 rounded-xl bg-muted/20 border border-transparent hover:border-primary/10 hover:bg-muted/30 transition-all">
                                                                    <div className="flex-1">
                                                                        <p className="text-xs font-black uppercase italic leading-none">{item.movementName}</p>
                                                                        {item.notes && <p className="text-[8px] text-muted-foreground uppercase font-bold mt-1 opacity-70">{item.notes}</p>}
                                                                    </div>
                                                                    <div className="flex gap-3">
                                                                        {item.sets && (
                                                                            <div className="text-right">
                                                                                <p className="text-[8px] font-black uppercase opacity-40 leading-none mb-1">Sets</p>
                                                                                <p className="text-[10px] font-bold italic">{item.sets}</p>
                                                                            </div>
                                                                        )}
                                                                        {item.reps && (
                                                                            <div className="text-right">
                                                                                <p className="text-[8px] font-black uppercase opacity-40 leading-none mb-1">Reps</p>
                                                                                <p className="text-[10px] font-bold italic">{item.reps}</p>
                                                                            </div>
                                                                        )}
                                                                        {item.weight && (
                                                                            <div className="text-right">
                                                                                <p className="text-[8px] font-black uppercase opacity-40 leading-none mb-1">Load</p>
                                                                                <p className="text-[10px] font-bold italic text-primary">{item.weight}</p>
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
                                            <div className="p-8 rounded-2xl bg-muted/40 font-mono text-lg border-2 border-muted leading-relaxed whitespace-pre-wrap shadow-inner relative overflow-hidden">
                                                <div className="absolute top-0 left-0 w-1 h-full bg-primary/20" />
                                                {wod.metcon}
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid sm:grid-cols-2 gap-6">
                                        <div className="p-5 rounded-xl border-2 border-orange-500/10 bg-orange-500/[0.02] space-y-2 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 p-2 opacity-5 text-orange-500">
                                                <ZapIcon className="h-12 w-12" />
                                            </div>
                                            <p className="text-[10px] font-black uppercase text-orange-600 italic tracking-widest">{t('wods.stimulus')}</p>
                                            <p className="text-sm font-bold italic text-muted-foreground leading-relaxed relative z-10">{wod.stimulus || "Max effort within capacity."}</p>
                                        </div>
                                        <div className="p-5 rounded-xl border-2 border-blue-500/10 bg-blue-500/[0.02] space-y-2 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 p-2 opacity-5 text-blue-500">
                                                <Shield className="h-12 w-12" />
                                            </div>
                                            <p className="text-[10px] font-black uppercase text-blue-600 italic tracking-widest">{t('wods.scaling')}</p>
                                            <p className="text-sm font-bold italic text-muted-foreground leading-relaxed relative z-10">{wod.scaling_options || "Scale weight to maintain intensity."}</p>
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
