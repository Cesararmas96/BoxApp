import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    Plus,
    Trophy,
    Activity,
    Timer,
    Target,
    Loader2,
    History,
    Calendar,
    Search,
    GripVertical,
    Trash2,
    Settings2,
    Dumbbell,
    Zap as ZapIcon,
    Shield,
    RotateCcw,
    Flame as FlameIcon
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
import { Separator } from "@/components/ui/separator";
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

interface SessionBlock {
    id: string;
    type: 'warmup' | 'strength' | 'conditioning' | 'wod' | 'accessory' | 'cooldown';
    title: string;
    content: string;
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
}

const TRACKS = ['CrossFit', 'Novice', 'Bodybuilding', 'Engine'];

const BLOCK_TEMPLATES: Record<string, { label: string, content: string }[]> = {
    warmup: [
        { label: 'General', content: '3 Rounds:\n- 200m Run\n- 10 Air Squats\n- 10 Push-ups\n- 10 Sit-ups' },
        { label: 'Barbell', content: 'Con barra vacía:\n- 5 Good Mornings\n- 5 Back Squats\n- 5 Shoulder Press\n- 5 Stiff Leg Deadlifts' },
        { label: 'Mobility', content: 'Focus on:\n- 1 min Pigeon Stretch / side\n- 1 min Couch Stretch / side\n- 10 Scapular Pull-ups' }
    ],
    strength: [
        { label: '5x5', content: '5 Sets of 5 Reps @ 75-80%\nRest 2-3 mins between sets.\nMovement: ' },
        { label: '3x10', content: '3 Sets of 10 Reps\nFocus on quality of movement.\nMovement: ' },
        { label: 'EMOM Str', content: 'EMOM 10 mins:\n- 3 Reps @ 80%\nMovement: ' },
        { label: 'Max Effort', content: 'Build to a Heavy Single for the day.\nMovement: ' }
    ],
    wod: [
        { label: 'AMRAP', content: 'AMRAP in 12 minutes:\n- 10 Burpees\n- 15 Kettlebell Swings\n- 20 Double Unders' },
        { label: 'For Time', content: '3 Rounds for Time:\n- 400m Run\n- 21 Thrusters\n- 12 Pull-ups' },
        { label: 'EMOM WOD', content: 'EMOM 20 minutes:\n- Min 1: 15 Wall Balls\n- Min 2: 12 Cal Row\n- Min 3: 15 Box Jumps\n- Min 4: Rest' },
        { label: 'Tabata', content: '8 Rounds (20s On / 10s Off):\n- Movement 1\n- Movement 2' }
    ],
    accessory: [
        { label: 'Core', content: '3 Rounds:\n- 20 Hollow Rocks\n- 20 Superman\n- 1 min Plank' },
        { label: 'Bodybuilding', content: '3-4 Sets:\n- 12-15 Bicep Curls\n- 12-15 Tricep Extensions' }
    ]
};

const COMMON_MOVEMENTS = [
    { name: 'Air Squat', category: 'Gymnastics', icon: <Activity className="h-4 w-4" />, image: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=50&h=50&fit=crop' },
    { name: 'Back Squat', category: 'Weightlifting', icon: <Dumbbell className="h-4 w-4" />, image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=50&h=50&fit=crop' },
    { name: 'Deadlift', category: 'Weightlifting', icon: <Dumbbell className="h-4 w-4" />, image: 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=50&h=50&fit=crop' },
    { name: 'Power Clean', category: 'Weightlifting', icon: <ZapIcon className="h-4 w-4" />, image: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=50&h=50&fit=crop' },
    { name: 'Snatch', category: 'Weightlifting', icon: <ZapIcon className="h-4 w-4" />, image: 'https://images.unsplash.com/photo-1541534741688-6078c64b547d?w=50&h=50&fit=crop' },
    { name: 'Burpee', category: 'Gymnastics', icon: <FlameIcon className="h-4 w-4" />, image: 'https://images.unsplash.com/photo-1599058917233-35835270c14c?w=50&h=50&fit=crop' },
    { name: 'Box Jump', category: 'Gymnastics', icon: <Trophy className="h-4 w-4" />, image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=50&h=50&fit=crop' },
    { name: 'Wall Ball', category: 'Weightlifting', icon: <Target className="h-4 w-4" />, image: 'https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=50&h=50&fit=crop' },
    { name: 'Pull-up', category: 'Gymnastics', icon: <Activity className="h-4 w-4" />, image: 'https://images.unsplash.com/photo-1598971639058-fab3c023bf30?w=50&h=50&fit=crop' },
    { name: 'Double Under', category: 'Mono', icon: <Timer className="h-4 w-4" />, image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=50&h=50&fit=crop' },
    { name: 'Row', category: 'Mono', icon: <Activity className="h-4 w-4" />, image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=50&h=50&fit=crop' },
    { name: 'Run', category: 'Mono', icon: <Timer className="h-4 w-4" />, image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=50&h=50&fit=crop' },
    { name: 'Thruster', category: 'Weightlifting', icon: <FlameIcon className="h-4 w-4" />, image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=50&h=50&fit=crop' }
];

export const Wods: React.FC = () => {
    const { t } = useTranslation();
    const [wods, setWods] = useState<WOD[]>([]);
    const [loading, setLoading] = useState(true);
    const [showEditor, setShowEditor] = useState(false);
    const [showResultModal, setShowResultModal] = useState<string | null>(null);
    const [activeTrack, setActiveTrack] = useState<string>('all');

    // UI State for Editor
    const [, setEditorMode] = useState<'manual' | 'bulk'>('manual');
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
    const [movementSearch, setMovementSearch] = useState('');
    const [manualEntryStatus, setManualEntryStatus] = useState<Record<string, boolean>>({});

    const [userPRs, setUserPRs] = useState<any[]>([]);
    const [results, setResults] = useState<any[]>([]);
    const [resultData, setResultData] = useState({ score: '', notes: '', rx: true });
    const [searchQuery, setSearchQuery] = useState('');

    // Bulk Import Logic
    const [bulkRawText, setBulkRawText] = useState('');
    const [stagedWods, setStagedWods] = useState<any[]>([]);

    useEffect(() => {
        fetchWods();
        fetchUserPRs();
    }, []);

    useEffect(() => {
        if (!showResultModal) {
            fetchResults();
        }
    }, [wods, showResultModal]);

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
            content: ''
        };
        setSessionBlocks([...sessionBlocks, newBlock]);
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

    const fetchResults = async () => {
        const { data } = await supabase
            .from('results')
            .select('*, profiles(first_name, last_name)')
            .order('created_at', { ascending: false });
        if (data) setResults(data);
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

    // --- SMART PARSER LOGIC ---
    const parseProgramming = (text: string) => {
        const sections = text.split(/[-_=]{3,}/).filter(s => s.trim().length > 10);

        const parsed = sections.map((section, idx) => {
            const lines = section.trim().split('\n');
            const title = lines[0].trim().toUpperCase() || `SESSION ${idx + 1}`;
            const metcon = lines.slice(1).join('\n').trim();

            let track = 'CrossFit';
            if (metcon.toLowerCase().includes('musculación') || metcon.toLowerCase().includes('hipertrofia')) track = 'Bodybuilding';
            if (metcon.toLowerCase().includes('novato')) track = 'Novice';

            const stimulusMatch = metcon.match(/(Stimulus|Target|Objetivo):?\s*([^\n]+)/i);
            const stimulus = stimulusMatch ? stimulusMatch[2] : '';

            return {
                title,
                metcon,
                track,
                stimulus,
                date: new Date().toISOString(),
                modalities: [],
                lesson_plan: []
            };
        });

        setStagedWods(parsed);
    };

    const importStagedWods = async () => {
        setLoading(true);
        const { error } = await supabase.from('wods').insert(stagedWods);
        if (!error) {
            setStagedWods([]);
            setBulkRawText('');
            setShowEditor(false);
            fetchWods();
        } else {
            alert('Error: ' + error.message);
        }
        setLoading(false);
    };

    const handlePublishManual = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Construct metcon from blocks if they exist
        let finalMetcon = newWOD.metcon;
        if (sessionBlocks.length > 0) {
            finalMetcon = sessionBlocks.map(b => `### ${b.title.toUpperCase()}\n${b.content}`).join('\n\n');
        }

        const { error } = await supabase.from('wods').insert([{
            ...newWOD,
            metcon: finalMetcon,
            date: new Date().toISOString()
        }]);

        if (!error) {
            setShowEditor(false);
            setNewWOD({
                title: '', metcon: '', stimulus: '', scaling_options: '',
                scaling_beginner: '', scaling_intermediate: '', scaling_advanced: '',
                scaling_injured: '', modalities: [], lesson_plan: [], track: 'CrossFit'
            });
            setSessionBlocks([]);
            fetchWods();
        }
        setLoading(false);
    };

    const handleLogResult = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!showResultModal) return;
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { error } = await supabase.from('results').insert([{
                wod_id: showResultModal,
                user_id: user.id,
                result: resultData.score,
                notes: resultData.notes,
                rx: resultData.rx
            }]);
            if (!error) {
                setShowResultModal(null);
                setResultData({ score: '', notes: '', rx: true });
                fetchResults();
            }
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
                    <Dialog open={showEditor} onOpenChange={setShowEditor}>
                        <DialogTrigger asChild>
                            <Button className="gap-2 font-black uppercase italic shadow-lg shadow-primary/20">
                                <Plus className="h-4 w-4" /> {t('wods.new_session')}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[800px] h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">{t('wods.designer_title')}</DialogTitle>
                                <DialogDescription className="font-bold uppercase text-[10px] opacity-70">
                                    {t('wods.designer_subtitle')}
                                </DialogDescription>
                            </DialogHeader>

                            <Tabs defaultValue="manual" className="mt-4" onValueChange={(v) => setEditorMode(v as any)}>
                                <TabsList className="grid w-full grid-cols-2 mb-6">
                                    <TabsTrigger value="manual" className="font-black text-[10px] uppercase">{t('wods.manual_draft')}</TabsTrigger>
                                    <TabsTrigger value="bulk" className="font-black text-[10px] uppercase">{t('wods.smart_import')}</TabsTrigger>
                                </TabsList>

                                <TabsContent value="manual" className="space-y-6">
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
                                            ) : (
                                                <div className="space-y-3">
                                                    {sessionBlocks.map((block, index) => (
                                                        <Card key={block.id} className="border shadow-sm overflow-hidden group">
                                                            <div className="flex items-center gap-3 px-3 py-2 bg-muted/30 border-b">
                                                                <GripVertical className="h-4 w-4 text-muted-foreground opacity-50" />
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
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className={cn("h-6 w-6", manualEntryStatus[block.id] ? "text-primary" : "text-muted-foreground")}
                                                                        onClick={() => setManualEntryStatus({ ...manualEntryStatus, [block.id]: !manualEntryStatus[block.id] })}
                                                                    >
                                                                        <Settings2 className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-6 w-6 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                                                        onClick={() => removeBlock(block.id)}
                                                                    >
                                                                        <Trash2 className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                            <div className="p-0 space-y-3">
                                                                {/* Visual Tools Bar */}
                                                                <div className="px-3 pt-3 space-y-3">
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="flex flex-wrap gap-1">
                                                                            {BLOCK_TEMPLATES[block.type]?.map((template) => (
                                                                                <Button
                                                                                    key={template.label}
                                                                                    variant="secondary"
                                                                                    size="sm"
                                                                                    className="h-5 px-2 text-[8px] font-bold uppercase tracking-wider bg-primary/5 hover:bg-primary/20 text-primary border border-primary/10"
                                                                                    onClick={() => updateBlock(block.id, { content: template.content })}
                                                                                >
                                                                                    {template.label}
                                                                                </Button>
                                                                            ))}
                                                                        </div>
                                                                    </div>

                                                                    <div className="relative">
                                                                        <Search className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />
                                                                        <Input
                                                                            placeholder="Search movement..."
                                                                            className="h-7 pl-7 text-[10px] uppercase font-bold italic"
                                                                            onChange={(e) => setMovementSearch(e.target.value)}
                                                                        />
                                                                        {movementSearch && (
                                                                            <Card className="absolute z-50 left-0 right-0 top-8 max-h-[200px] overflow-y-auto shadow-2xl p-2 grid grid-cols-2 gap-2">
                                                                                {COMMON_MOVEMENTS
                                                                                    .filter(m => m.name.toLowerCase().includes(movementSearch.toLowerCase()))
                                                                                    .map(m => (
                                                                                        <button
                                                                                            key={m.name}
                                                                                            onClick={() => {
                                                                                                updateBlock(block.id, { content: block.content + (block.content ? '\n- ' : '- ') + m.name });
                                                                                                setMovementSearch('');
                                                                                            }}
                                                                                            className="flex items-center gap-2 p-1.5 hover:bg-muted rounded-lg text-left transition-colors border border-transparent hover:border-primary/20"
                                                                                        >
                                                                                            <img src={m.image} alt={m.name} className="h-8 w-8 rounded object-cover shadow-sm" />
                                                                                            <div>
                                                                                                <p className="text-[10px] font-black uppercase italic leading-none">{m.name}</p>
                                                                                                <p className="text-[8px] text-muted-foreground uppercase font-bold">{m.category}</p>
                                                                                            </div>
                                                                                        </button>
                                                                                    ))}
                                                                            </Card>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* Content View / Manual Edit Toggle */}
                                                                <div className="px-3 pb-3">
                                                                    {manualEntryStatus[block.id] ? (
                                                                        <Textarea
                                                                            className="border focus-visible:ring-primary min-h-[120px] text-xs font-mono p-3 leading-relaxed bg-muted/10"
                                                                            placeholder="Describe the activities..."
                                                                            value={block.content}
                                                                            onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                                                                        />
                                                                    ) : (
                                                                        <div
                                                                            className="min-h-[60px] p-3 rounded-lg border border-dashed border-primary/20 bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors"
                                                                            onClick={() => setManualEntryStatus({ ...manualEntryStatus, [block.id]: true })}
                                                                        >
                                                                            {block.content ? (
                                                                                <pre className="text-xs font-mono whitespace-pre-wrap">{block.content}</pre>
                                                                            ) : (
                                                                                <p className="text-[10px] text-muted-foreground font-bold uppercase italic text-center py-2">No content. Click to type or use the tools above.</p>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </Card>
                                                    ))}
                                                </div>
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
                                </TabsContent>

                                <TabsContent value="bulk" className="space-y-6">
                                    <div className="space-y-4">
                                        <Label className="uppercase text-[10px] font-black">{t('wods.bulk_placeholder')}</Label>
                                        <Textarea
                                            className="min-h-[300px] font-mono text-xs border-2"
                                            placeholder="WOD 1...&#10;---&#10;WOD 2..."
                                            value={bulkRawText}
                                            onChange={(e) => {
                                                setBulkRawText(e.target.value);
                                                parseProgramming(e.target.value);
                                            }}
                                        />
                                        {stagedWods.length > 0 && (
                                            <div className="grid gap-2 border p-4 rounded-xl bg-muted/20">
                                                <p className="text-[10px] font-black uppercase italic mb-2">{t('wods.detected_sessions')} ({stagedWods.length})</p>
                                                {stagedWods.map((w, i) => (
                                                    <div key={i} className="text-[10px] font-bold uppercase flex items-center justify-between border-b pb-1">
                                                        <span>{i + 1}. {w.title}</span>
                                                        <Badge variant="outline" className="text-[8px]">{w.track}</Badge>
                                                    </div>
                                                ))}
                                                <Button onClick={importStagedWods} className="mt-4 font-black uppercase italic" disabled={loading}>
                                                    {loading ? <Loader2 className="animate-spin" /> : t('wods.import_days', { count: stagedWods.length })}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>
                            </Tabs>
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
                                <div className="flex gap-2">
                                    <Dialog open={showResultModal === wod.id} onOpenChange={(open) => setShowResultModal(open ? wod.id : null)}>
                                        <DialogTrigger asChild>
                                            <Button size="sm" className="font-black uppercase italic text-[10px] tracking-tight h-8">
                                                <Trophy className="h-3.5 w-3.5 mr-2" /> {t('wods.log_result')}
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-[400px]">
                                            <DialogHeader>
                                                <DialogTitle className="text-xl font-bold uppercase italic">{t('wods.log_result')}</DialogTitle>
                                            </DialogHeader>
                                            <form onSubmit={handleLogResult} className="space-y-4 py-4">
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-black uppercase tracking-widest">Mark / Score</Label>
                                                    <Input className="h-12 font-black italic text-lg" placeholder="e.g. 15:30" required value={resultData.score} onChange={e => setResultData({ ...resultData, score: e.target.value })} />
                                                </div>
                                                <div className="flex items-center space-x-2 border p-3 rounded-lg bg-muted/30">
                                                    <input type="checkbox" id="rx_log" className="h-4 w-4" checked={resultData.rx} onChange={e => setResultData({ ...resultData, rx: e.target.checked })} />
                                                    <label htmlFor="rx_log" className="text-xs font-bold uppercase italic">RX Standard</label>
                                                </div>
                                                <Button type="submit" className="w-full font-black uppercase italic">{t('common.save')}</Button>
                                            </form>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </CardHeader>
                            <CardContent className="p-8 grid md:grid-cols-12 gap-10">
                                <div className="md:col-span-8 space-y-8">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary italic">
                                            <Timer className="h-4 w-4" /> {t('wods.routine_description')}
                                        </div>
                                        <div className="p-6 rounded-2xl bg-muted/40 font-mono text-base border leading-relaxed whitespace-pre-wrap">
                                            {wod.metcon}
                                        </div>
                                    </div>

                                    <div className="grid sm:grid-cols-2 gap-6">
                                        <div className="p-4 rounded-xl border bg-orange-500/5 space-y-2">
                                            <p className="text-[10px] font-black uppercase text-orange-600 italic">{t('wods.stimulus')}</p>
                                            <p className="text-xs font-semibold italic text-muted-foreground leading-relaxed">{wod.stimulus || "Max effort within capacity."}</p>
                                        </div>
                                        <div className="p-4 rounded-xl border bg-blue-500/5 space-y-2">
                                            <p className="text-[10px] font-black uppercase text-blue-600 italic">{t('wods.scaling')}</p>
                                            <p className="text-xs font-semibold italic text-muted-foreground leading-relaxed">{wod.scaling_options || "Scale weight to maintain intensity."}</p>
                                        </div>
                                    </div>

                                    {calculateWeight(wod.metcon) && (
                                        <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-between">
                                            <div>
                                                <p className="text-[10px] font-black uppercase text-primary mb-1">{t('wods.calculated_loading')}</p>
                                                <p className="text-sm font-bold italic">{calculateWeight(wod.metcon)?.name} @ {calculateWeight(wod.metcon)?.percent}%</p>
                                            </div>
                                            <div className="text-3xl font-black italic tracking-tighter text-primary">
                                                {calculateWeight(wod.metcon)?.weight}<span className="text-xs ml-1">KG</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="md:col-span-4 border-l pl-10 space-y-6">
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-60 italic">
                                        <History className="h-4 w-4" /> {t('wods.latest_results')}
                                    </div>
                                    <div className="space-y-3">
                                        {results.filter(r => r.wod_id === wod.id).length === 0 ? (
                                            <div className="py-10 text-center border-2 border-dashed rounded-xl opacity-30 text-[10px] font-black uppercase italic">{t('common.no_data')}</div>
                                        ) : (
                                            results.filter(r => r.wod_id === wod.id).slice(0, 5).map(r => (
                                                <div key={r.id} className="flex items-center justify-between p-3 bg-muted/40 rounded-lg border border-transparent hover:border-primary/20 transition-all">
                                                    <div>
                                                        <p className="text-[10px] font-bold uppercase truncate w-24">{r.profiles?.first_name} {r.profiles?.last_name}</p>
                                                        <p className="text-[8px] font-black text-primary uppercase italic">{r.rx ? 'RX' : 'SCL'}</p>
                                                    </div>
                                                    <span className="font-black italic text-sm">{r.result}</span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    <Separator />
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="text-center">
                                            <p className="text-xl font-black italic">{results.filter(r => r.wod_id === wod.id).length}</p>
                                            <p className="text-[8px] font-black uppercase opacity-60">{t('wods.results_logged')}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xl font-black italic text-primary">
                                                {results.filter(r => r.wod_id === wod.id).length > 0
                                                    ? Math.round((results.filter(r => r.wod_id === wod.id && r.rx).length / results.filter(r => r.wod_id === wod.id).length) * 100)
                                                    : 0}%
                                            </p>
                                            <p className="text-[8px] font-black uppercase opacity-60">{t('wods.rx_rate')}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};
