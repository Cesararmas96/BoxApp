import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    Plus,
    Flame,
    Trophy,
    Shield,
    Check,
    Info,
    Clock,
    Activity,
    Dumbbell,
    Timer,
    AlertTriangle,
    Minus,
    ChevronRight,
    Target,
    Zap,
    Scale,
    Trash2,
    Loader2,
    LayoutGrid,
    Dumbbell as MuscleIcon,
    Users,
    Sparkles,
    FileUp,
    Zap as Flash,
    History,
    Save,
    Wand2,
    Calendar,
    ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

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

export const Wods: React.FC = () => {
    const [wods, setWods] = useState<WOD[]>([]);
    const [loading, setLoading] = useState(true);
    const [showEditor, setShowEditor] = useState(false);
    const [showResultModal, setShowResultModal] = useState<string | null>(null);
    const [activeTrack, setActiveTrack] = useState<string>('all');

    // UI State for Editor
    const [editorMode, setEditorMode] = useState<'manual' | 'bulk'>('manual');
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

    const [userPRs, setUserPRs] = useState<any[]>([]);
    const [results, setResults] = useState<any[]>([]);
    const [resultData, setResultData] = useState({ score: '', notes: '', rx: true });

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
        // Detect sections separated by common md dividers
        const sections = text.split(/[-_=]{3,}/).filter(s => s.trim().length > 10);

        const parsed = sections.map((section, idx) => {
            const lines = section.trim().split('\n');
            const title = lines[0].trim().toUpperCase() || `SESSION ${idx + 1}`;
            const metcon = lines.slice(1).join('\n').trim();

            // Intelligent Category Detection
            let track = 'CrossFit';
            if (metcon.toLowerCase().includes('musculación') || metcon.toLowerCase().includes('hipertrofia')) track = 'Bodybuilding';
            if (metcon.toLowerCase().includes('novato')) track = 'Novice';

            // Detect Intended Stimulus (often includes "Stimulus", "Target", or "%")
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
        const { error } = await supabase.from('wods').insert([{
            ...newWOD,
            date: new Date().toISOString()
        }]);
        if (!error) {
            setShowEditor(false);
            setNewWOD({
                title: '', metcon: '', stimulus: '', scaling_options: '',
                scaling_beginner: '', scaling_intermediate: '', scaling_advanced: '',
                scaling_injured: '', modalities: [], lesson_plan: [], track: 'CrossFit'
            });
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
        if (activeTrack === 'all') return wods;
        return wods.filter(w => w.track === activeTrack);
    }, [wods, activeTrack]);

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
                <div>
                    <h1 className="text-4xl font-black italic tracking-tighter uppercase text-primary flex items-center gap-3">
                        <Activity className="h-10 w-10 text-primary animate-pulse" /> Core Programming
                    </h1>
                    <p className="text-muted-foreground text-xs font-black uppercase italic tracking-widest opacity-60">Box Management & Athlete Performance Insight</p>
                </div>

                <div className="flex gap-2">
                    <Dialog open={showEditor} onOpenChange={setShowEditor}>
                        <DialogTrigger asChild>
                            <Button className="h-12 px-8 gap-2 font-black uppercase italic tracking-widest shadow-[0_10px_20px_rgba(255,22,22,0.2)] hover:scale-105 transition-all">
                                <Plus className="h-5 w-5" /> Start New Session
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[1000px] h-[95vh] p-0 overflow-hidden bg-black text-white border-zinc-800">
                            <div className="flex h-full">
                                {/* Sidebar - Mode Switch */}
                                <div className="w-1/4 border-r border-zinc-800 p-6 space-y-8 bg-zinc-950/50">
                                    <div className="space-y-2">
                                        <h2 className="text-2xl font-black uppercase italic tracking-tighter text-primary">Designer</h2>
                                        <p className="text-[10px] font-bold uppercase opacity-50">Select your preferred tool</p>
                                    </div>
                                    <div className="flex flex-col gap-3">
                                        <Button
                                            variant={editorMode === 'bulk' ? 'default' : 'ghost'}
                                            className={cn("justify-start gap-4 h-14 font-black uppercase italic relative overflow-hidden", editorMode === 'bulk' ? 'bg-primary' : 'text-zinc-400')}
                                            onClick={() => setEditorMode('bulk')}
                                        >
                                            <Wand2 className="h-5 w-5" /> .MD Bulk Smart Import
                                            {editorMode === 'bulk' && <div className="absolute right-[-10px] top-0 bottom-0 w-4 bg-white/20 skew-x-12" />}
                                        </Button>
                                        <Button
                                            variant={editorMode === 'manual' ? 'default' : 'ghost'}
                                            className={cn("justify-start gap-4 h-14 font-black uppercase italic relative overflow-hidden", editorMode === 'manual' ? 'bg-primary' : 'text-zinc-400')}
                                            onClick={() => setEditorMode('manual')}
                                        >
                                            <Save className="h-5 w-5" /> Manual Entry
                                            {editorMode === 'manual' && <div className="absolute right-[-10px] top-0 bottom-0 w-4 bg-white/20 skew-x-12" />}
                                        </Button>
                                    </div>
                                    <div className="pt-20">
                                        <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-3">
                                            <p className="text-[9px] font-black uppercase text-primary">Coach Tip</p>
                                            <p className="text-xs italic text-zinc-400 font-medium">Use separators like "---" in bulk mode to automatically split sessions by day.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Main Editor Area */}
                                <div className="flex-1 overflow-y-auto p-10 bg-zinc-900/30">
                                    {editorMode === 'bulk' ? (
                                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-sm font-black uppercase italic tracking-widest text-primary">Raw Programming Feed</Label>
                                                    <Badge variant="outline" className="text-[10px] font-black uppercase border-primary/40 text-primary">Smart detection Active</Badge>
                                                </div>
                                                <Textarea
                                                    className="min-h-[300px] bg-black border-zinc-800 text-zinc-100 font-mono text-sm leading-relaxed p-6 focus:border-primary transition-all rounded-2xl"
                                                    placeholder="Lunes: Clean Complex&#10;5 Rounds...&#10;---&#10;Martes: Conditioning..."
                                                    value={bulkRawText}
                                                    onChange={(e) => {
                                                        setBulkRawText(e.target.value);
                                                        parseProgramming(e.target.value);
                                                    }}
                                                />
                                            </div>

                                            {stagedWods.length > 0 && (
                                                <div className="space-y-4">
                                                    <Label className="text-sm font-black uppercase italic tracking-widest">Live Preview ({stagedWods.length} Sessions)</Label>
                                                    <div className="grid grid-cols-1 gap-4">
                                                        {stagedWods.map((w, i) => (
                                                            <div key={i} className="group border border-zinc-800 rounded-2xl p-6 bg-zinc-950 hover:border-primary/50 transition-all flex items-start justify-between">
                                                                <div className="space-y-2">
                                                                    <div className="flex items-center gap-2">
                                                                        <Badge className="bg-primary/20 text-primary text-[9px] font-black uppercase italic">{w.track}</Badge>
                                                                        <span className="text-xs font-black uppercase tracking-tighter italic text-zinc-500">Preview {i + 1}</span>
                                                                    </div>
                                                                    <h3 className="text-2xl font-black uppercase italic text-white group-hover:text-primary transition-colors">{w.title}</h3>
                                                                    <p className="text-xs text-zinc-400 line-clamp-2 italic font-medium">{w.metcon}</p>
                                                                </div>
                                                                <Flash className="h-5 w-5 text-zinc-700 group-hover:text-primary animate-pulse" />
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <Button
                                                        onClick={importStagedWods}
                                                        className="w-full h-16 font-black uppercase italic tracking-widest text-lg shadow-2xl"
                                                        disabled={loading}
                                                    >
                                                        {loading ? <Loader2 className="animate-spin h-6 w-6" /> : `Commit ${stagedWods.length} Days to Programming`}
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <form onSubmit={handlePublishManual} className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-300">
                                            <div className="grid grid-cols-2 gap-8">
                                                <div className="space-y-3">
                                                    <Label className="text-[10px] font-black uppercase italic tracking-widest text-primary">Track</Label>
                                                    <Select value={newWOD.track} onValueChange={(v) => setNewWOD({ ...newWOD, track: v as any })}>
                                                        <SelectTrigger className="h-14 bg-black border-zinc-800 font-black uppercase italic tracking-wider">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-black border-zinc-800">
                                                            {TRACKS.map(t => <SelectItem key={t} value={t} className="font-black uppercase italic text-xs">{t}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-3">
                                                    <Label className="text-[10px] font-black uppercase italic tracking-widest text-primary">Title</Label>
                                                    <Input
                                                        className="h-14 bg-black border-zinc-800 font-black uppercase italic text-xl tracking-tighter"
                                                        placeholder="SESSION NAME"
                                                        value={newWOD.title}
                                                        onChange={(e) => setNewWOD({ ...newWOD, title: e.target.value })}
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-6">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-[10px] font-black uppercase italic tracking-widest text-primary">Session Structure (Forms & Blocks)</Label>
                                                    <div className="flex gap-2">
                                                        <Button type="button" variant="outline" size="sm" onClick={() => setNewWOD(prev => ({ ...prev, metcon: prev.metcon + (prev.metcon ? "\n\n" : "") + "### WARM UP\n- " }))} className="h-7 text-[8px] font-black uppercase border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10">
                                                            + Add Warm-up
                                                        </Button>
                                                        <Button type="button" variant="outline" size="sm" onClick={() => setNewWOD(prev => ({ ...prev, metcon: prev.metcon + (prev.metcon ? "\n\n" : "") + "### STRENGTH / SKILL\n- " }))} className="h-7 text-[8px] font-black uppercase border-blue-500/30 text-blue-500 hover:bg-blue-500/10">
                                                            + Add Strength
                                                        </Button>
                                                        <Button type="button" variant="outline" size="sm" onClick={() => setNewWOD(prev => ({ ...prev, metcon: prev.metcon + (prev.metcon ? "\n\n" : "") + "### METCON\n- " }))} className="h-7 text-[8px] font-black uppercase border-primary/30 text-primary hover:bg-primary/10">
                                                            + Add Metcon
                                                        </Button>
                                                        <Button type="button" variant="outline" size="sm" onClick={() => setNewWOD(prev => ({ ...prev, metcon: prev.metcon + (prev.metcon ? "\n\n" : "") + "### ACCESSORY\n- " }))} className="h-7 text-[8px] font-black uppercase border-orange-500/30 text-orange-500 hover:bg-orange-500/10">
                                                            + Add Accessory
                                                        </Button>
                                                    </div>
                                                </div>
                                                <Textarea
                                                    className="min-h-[300px] bg-black border-zinc-800 font-mono text-zinc-200 leading-relaxed text-base p-8 focus:border-primary transition-all rounded-[30px] shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]"
                                                    placeholder="Use the buttons above to build your daily plan section by section, just like in wods.md..."
                                                    value={newWOD.metcon}
                                                    onChange={(e) => setNewWOD({ ...newWOD, metcon: e.target.value })}
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-8">
                                                <div className="space-y-3">
                                                    <Label className="text-[10px] font-black uppercase italic tracking-widest text-orange-500">Stimulus / Goals</Label>
                                                    <Textarea
                                                        className="h-32 bg-black border-zinc-800 text-xs italic font-semibold"
                                                        placeholder="Target intensity..."
                                                        value={newWOD.stimulus}
                                                        onChange={(e) => setNewWOD({ ...newWOD, stimulus: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-3">
                                                    <Label className="text-[10px] font-black uppercase italic tracking-widest text-blue-500">Scaling Strategy</Label>
                                                    <Textarea
                                                        className="h-32 bg-black border-zinc-800 text-xs italic font-semibold"
                                                        placeholder="How to adapt..."
                                                        value={newWOD.scaling_options}
                                                        onChange={(e) => setNewWOD({ ...newWOD, scaling_options: e.target.value })}
                                                    />
                                                </div>
                                            </div>

                                            <Button type="submit" className="w-full h-20 font-black uppercase italic tracking-widest text-xl rounded-2xl shadow-2xl" disabled={loading}>
                                                {loading ? <Loader2 className="animate-spin" /> : "Publish Daily Board"}
                                            </Button>
                                        </form>
                                    )}
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </header>

            {/* Quick Track Filter */}
            <div className="flex flex-wrap gap-3 pb-2 overflow-x-auto">
                <Button
                    variant={activeTrack === 'all' ? "default" : "outline"}
                    onClick={() => setActiveTrack('all')}
                    className="h-10 px-6 font-black uppercase italic text-[11px] tracking-widest rounded-full"
                >
                    <LayoutGrid className="h-4 w-4 mr-2" /> Global Feed
                </Button>
                {TRACKS.map(t => (
                    <Button
                        key={t}
                        variant={activeTrack === t ? "default" : "outline"}
                        onClick={() => setActiveTrack(t)}
                        className={cn(
                            "h-10 px-6 font-black uppercase italic text-[11px] tracking-widest rounded-full",
                            t === 'CrossFit' && "border-primary/40 text-primary",
                            t === 'Novice' && "border-emerald-500/40 text-emerald-500",
                            t === 'Bodybuilding' && "border-blue-500/40 text-blue-500",
                            t === 'Engine' && "border-orange-500/40 text-orange-500"
                        )}
                    >
                        {t === 'CrossFit' && <Activity className="h-4 w-4 mr-2" />}
                        {t === 'Novice' && <Users className="h-4 w-4 mr-2" />}
                        {t === 'Bodybuilding' && <MuscleIcon className="h-4 w-4 mr-2" />}
                        {t === 'Engine' && <Sparkles className="h-4 w-4 mr-2" />}
                        {t}
                    </Button>
                ))}

                <Separator orientation="vertical" className="h-10 bg-zinc-800 mx-2" />

                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="h-10 px-6 font-black uppercase italic text-[11px] tracking-widest rounded-full border-zinc-700">
                            <History className="h-4 w-4 mr-2 text-zinc-400" /> Personal RMs
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[450px]">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black italic uppercase italic tracking-tighter">Personal Records</DialogTitle>
                            <DialogDescription className="font-bold uppercase text-[10px] opacity-60">Your unique power markers for automatic bar loading.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto overflow-x-hidden pr-2">
                            {userPRs.length === 0 ? (
                                <div className="py-10 text-center opacity-30 italic font-black uppercase">No records found. Visit Benchmarks to sync.</div>
                            ) : (
                                <div className="grid grid-cols-1 gap-3">
                                    {userPRs.map((pr) => (
                                        <div key={pr.id} className="p-4 bg-zinc-100 rounded-2xl flex items-center justify-between group hover:bg-zinc-200 transition-all border-b-4 border-zinc-300">
                                            <div>
                                                <p className="text-[10px] font-black uppercase text-primary mb-1">{pr.movements?.name}</p>
                                                <div className="flex items-end gap-1">
                                                    <span className="text-3xl font-black italic tracking-tighter">{pr.weight_kg}</span>
                                                    <span className="text-[10px] font-black uppercase opacity-60 mb-1">KG</span>
                                                </div>
                                            </div>
                                            <Badge className="bg-black text-white text-[9px] font-black uppercase">Verified</Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Bias Dashboard (Condensed) */}
            {(activeTrack === 'all' || activeTrack === 'CrossFit') && (
                <div className="grid md:grid-cols-4 gap-4">
                    {Object.entries(last7DaysBias).map(([key, count]) => (
                        <Card key={key} className="bg-zinc-950 border-zinc-900 border-2 overflow-hidden relative group">
                            <div className="absolute top-0 left-0 w-1 h-full bg-primary/40 group-hover:bg-primary transition-all" />
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 italic">{key}</p>
                                    <p className="text-2xl font-black italic tracking-tighter text-white">{count} <span className="text-[10px] opacity-40">Sets</span></p>
                                </div>
                                <Activity className="h-6 w-6 text-zinc-800 group-hover:text-primary/20 transition-colors" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Main Board Feed */}
            <div className="grid gap-10 pt-4">
                {loading && wods.length === 0 ? (
                    <div className="py-40 text-center space-y-4">
                        <Loader2 className="h-14 w-14 animate-spin text-primary mx-auto mb-4" />
                        <p className="text-xl font-black uppercase italic tracking-widest text-zinc-800">Booting Programming Engine...</p>
                    </div>
                ) : filteredWods.length === 0 ? (
                    <div className="py-40 text-center rounded-[40px] border-4 border-dashed border-zinc-100 bg-zinc-50">
                        <Calendar className="h-16 w-16 text-zinc-200 mx-auto mb-6" />
                        <p className="text-2xl font-black uppercase italic tracking-widest text-zinc-300">Zero Sessions Detected for this Track.</p>
                    </div>
                ) : (
                    filteredWods.map(wod => (
                        <Card key={wod.id} className="relative overflow-hidden border-4 border-zinc-950 shadow-[20px_20px_0px_#000] bg-white transition-all transform hover:-translate-x-1 hover:-translate-y-1">
                            {/* Track Tag Stencil */}
                            <div className={cn(
                                "absolute top-0 right-0 px-8 py-2 font-black uppercase italic text-xs tracking-tighter text-white skew-x-[-15deg] mr-[-10px] shadow-lg",
                                wod.track === 'CrossFit' && "bg-primary",
                                wod.track === 'Novice' && "bg-emerald-600",
                                wod.track === 'Bodybuilding' && "bg-blue-600",
                                wod.track === 'Engine' && "bg-orange-600"
                            )}>
                                {wod.track} DIVISION
                            </div>

                            <CardHeader className="p-10 border-b-4 border-zinc-950 space-y-4">
                                <div className="flex items-center gap-3">
                                    <Badge variant="outline" className="h-7 px-4 border-2 border-zinc-950 text-xs font-black uppercase italic rounded-none tracking-widest">
                                        {new Date(wod.date).toLocaleDateString()}
                                    </Badge>
                                    {calculateWeight(wod.metcon) && (
                                        <Badge className="h-7 px-4 bg-zinc-950 text-white border-2 border-zinc-950 text-[10px] font-black uppercase italic rounded-none tracking-widest flex items-center gap-2">
                                            <Target className="h-3 w-3 text-primary" /> Load calc: {calculateWeight(wod.metcon)?.weight}kg
                                        </Badge>
                                    )}
                                </div>
                                <CardTitle className="text-6xl font-black uppercase italic tracking-tighter leading-none text-zinc-950 break-words">
                                    {wod.title}
                                </CardTitle>
                            </CardHeader>

                            <div className="grid md:grid-cols-12 min-h-[400px]">
                                <CardContent className="md:col-span-8 p-12 space-y-12">
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3 text-sm font-black uppercase italic tracking-widest text-primary">
                                            <Timer className="h-5 w-5" /> The Routine
                                        </div>
                                        <div className="p-10 bg-zinc-100 rounded-[30px] border-4 border-zinc-950 text-xl font-mono leading-relaxed text-zinc-950 whitespace-pre-wrap shadow-inner">
                                            {wod.metcon}
                                        </div>
                                    </div>

                                    <div className="grid sm:grid-cols-2 gap-10">
                                        <div className="space-y-4">
                                            <p className="text-[10px] font-black uppercase italic tracking-widest text-orange-600 flex items-center gap-2">
                                                <Flame className="h-4 w-4" /> Focus & Stimulus
                                            </p>
                                            <p className="text-sm font-bold italic text-zinc-700 bg-orange-50 p-6 rounded-2xl border-2 border-orange-100 min-h-[100px]">
                                                {wod.stimulus || "Max effort within capacity."}
                                            </p>
                                        </div>
                                        <div className="space-y-4">
                                            <p className="text-[10px] font-black uppercase italic tracking-widest text-blue-600 flex items-center gap-2">
                                                <Scale className="h-4 w-4" /> Scaling Logic
                                            </p>
                                            <p className="text-sm font-bold italic text-zinc-700 bg-blue-50 p-6 rounded-2xl border-2 border-blue-100 min-h-[100px]">
                                                {wod.scaling_options || "Move at a steady, conversational pace."}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>

                                <div className="md:col-span-4 bg-zinc-950 p-12 space-y-10">
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3 text-xs font-black uppercase italic tracking-widest text-primary">
                                            <History className="h-5 w-5" /> Athlete Hall
                                        </div>
                                        <ScrollArea className="h-[250px] pr-4">
                                            <div className="space-y-3">
                                                {results.filter(r => r.wod_id === wod.id).length === 0 ? (
                                                    <div className="py-10 text-center opacity-20 font-black uppercase text-xs italic text-white border-2 border-dashed border-zinc-800 rounded-2xl">Board Empty</div>
                                                ) : (
                                                    results.filter(r => r.wod_id === wod.id).map(r => (
                                                        <div key={r.id} className="flex items-center justify-between p-4 bg-zinc-900 rounded-xl hover:bg-zinc-800 transition-colors border-l-4 border-primary/40">
                                                            <div className="space-y-0.5">
                                                                <p className="text-[10px] font-black uppercase text-white italic tracking-tighter truncate w-32">{r.profiles?.first_name} {r.profiles?.last_name}</p>
                                                                <p className="text-[8px] font-black text-primary uppercase italic">{r.rx ? 'As Prescribed' : 'Modified'}</p>
                                                            </div>
                                                            <span className="text-xl font-black italic tracking-tighter text-white">{r.result}</span>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </ScrollArea>
                                    </div>

                                    <Dialog open={showResultModal === wod.id} onOpenChange={(open) => setShowResultModal(open ? wod.id : null)}>
                                        <DialogTrigger asChild>
                                            <Button className="w-full h-16 rounded-[20px] bg-white text-black font-black uppercase italic tracking-widest text-lg hover:bg-primary hover:text-white transition-all transform hover:scale-105 active:scale-95 group shadow-2xl">
                                                <Trophy className="h-6 w-6 mr-3 group-hover:animate-bounce" /> Log Result
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-[400px]">
                                            <DialogHeader>
                                                <DialogTitle className="text-2xl font-black uppercase italic italic tracking-tighter">Enter Your Mark</DialogTitle>
                                            </DialogHeader>
                                            <form onSubmit={handleLogResult} className="space-y-6 py-4">
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-black uppercase italic tracking-widest">Score / Result</Label>
                                                    <Input className="h-14 text-2xl font-black uppercase italic tracking-tighter" required value={resultData.score} onChange={e => setResultData({ ...resultData, score: e.target.value })} />
                                                </div>
                                                <div className="flex items-center space-x-3 rounded-2xl border-4 p-5 bg-primary/5 border-zinc-950">
                                                    <input type="checkbox" id="rx" className="h-6 w-6 rounded border-zinc-950 bg-white text-primary" checked={resultData.rx} onChange={e => setResultData({ ...resultData, rx: e.target.checked })} />
                                                    <label htmlFor="rx" className="text-sm font-black uppercase italic text-zinc-950">RX Standard</label>
                                                </div>
                                                <Button type="submit" className="w-full h-16 font-black uppercase italic tracking-widest">Post to Board</Button>
                                            </form>
                                        </DialogContent>
                                    </Dialog>

                                    <div className="pt-8 border-t border-zinc-800">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <p className="text-[8px] font-black uppercase text-zinc-500 tracking-widest">Athletes</p>
                                                <p className="text-2xl font-black italic text-white tracking-tighter">{results.filter(r => r.wod_id === wod.id).length}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[8px] font-black uppercase text-zinc-500 tracking-widest">RX Rate</p>
                                                <p className="text-2xl font-black italic text-primary tracking-tighter">
                                                    {results.filter(r => r.wod_id === wod.id && r.rx).length > 0
                                                        ? Math.round((results.filter(r => r.wod_id === wod.id && r.rx).length / results.filter(r => r.wod_id === wod.id).length) * 100)
                                                        : 0}%
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};
