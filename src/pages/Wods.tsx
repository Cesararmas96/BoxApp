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
    Scale,
    Trash2,
    Loader2,
    LayoutGrid,
    Dumbbell as MuscleIcon,
    Users,
    Sparkles,
    FileUp,
    Zap,
    History,
    Target
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

const MODALITIES = ['Weightlifting', 'Gymnastics', 'Monostructural', 'Metabolic Conditioning'];
const TRACKS = ['CrossFit', 'Novice', 'Bodybuilding', 'Engine'];

export const Wods: React.FC = () => {
    const [wods, setWods] = useState<WOD[]>([]);
    const [loading, setLoading] = useState(true);
    const [showEditor, setShowEditor] = useState(false);
    const [showResultModal, setShowResultModal] = useState<string | null>(null);
    const [activeTrack, setActiveTrack] = useState<string>('all');

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

    const [resultData, setResultData] = useState({ score: '', notes: '', rx: true });
    const [results, setResults] = useState<any[]>([]);
    const [userPRs, setUserPRs] = useState<any[]>([]);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [bulkText, setBulkText] = useState('');
    const [previewWods, setPreviewWods] = useState<any[]>([]);

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
            const formattedData = data.map(w => ({
                ...w,
                modalities: w.modalities || [],
                lesson_plan: w.lesson_plan || [],
                track: w.track || 'CrossFit'
            }));
            setWods(formattedData);
        }
        setLoading(false);
    };

    const fetchResults = async () => {
        const { data, error } = await supabase
            .from('results')
            .select(`
                *,
                profiles(first_name, last_name)
            `)
            .order('created_at', { ascending: false });
        if (!error && data) setResults(data);
    };

    const fetchUserPRs = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from('personal_records')
            .select(`
                *,
                movements(name)
            `)
            .eq('user_id', user.id);

        if (!error && data) setUserPRs(data);
    };

    const parseBulkText = (text: string) => {
        const days = text.split(/[-_]{3,}/);
        const parsed = days.map(day => {
            const lines = day.trim().split('\n');
            if (lines.length < 2) return null;

            // Simplified parsing
            const title = lines[0].trim().toUpperCase() || 'UNTITLED SESSION';
            const metcon = lines.slice(1).join('\n').trim();

            // Try to detect track
            let track = 'CrossFit';
            if (metcon.toLowerCase().includes('musculación') || metcon.toLowerCase().includes('hipertrofia')) track = 'Bodybuilding';
            if (metcon.toLowerCase().includes('novato')) track = 'Novice';

            return {
                title,
                metcon,
                track,
                date: new Date().toISOString(),
                modalities: [],
                lesson_plan: [],
                stimulus: '',
                scaling_options: ''
            };
        }).filter(Boolean);

        setPreviewWods(parsed);
    };

    const handleBulkImport = async () => {
        setLoading(true);
        const { error } = await supabase
            .from('wods')
            .insert(previewWods);

        if (error) {
            alert('Import failed: ' + error.message);
        } else {
            setShowBulkModal(false);
            setBulkText('');
            setPreviewWods([]);
            fetchWods();
            alert(`Successfully imported ${previewWods.length} sessions!`);
        }
        setLoading(false);
    };

    const calculateWeight = (text: string) => {
        // Regex to find things like "@80%" or "80/85%"
        const percentMatch = text.match(/@?(\d{1,3})%/);
        if (!percentMatch) return null;

        const percent = parseInt(percentMatch[1]) / 100;

        // Try to find a movement in the same line or nearby
        const movement = userPRs.find(pr => text.toLowerCase().includes(pr.movements.name.toLowerCase()));

        if (movement) {
            const calc = Math.round(movement.weight_kg * percent);
            return {
                movement: movement.movements.name,
                percent: Math.round(percent * 100),
                weight: calc
            };
        }
        return null;
    };

    const handlePublishWOD = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase
            .from('wods')
            .insert([{
                ...newWOD,
                date: new Date().toISOString()
            }]);

        if (error) {
            alert('Error publishing WOD: ' + error.message);
        } else {
            setShowEditor(false);
            setNewWOD({
                title: '',
                metcon: '',
                stimulus: '',
                scaling_options: '',
                scaling_beginner: '',
                scaling_intermediate: '',
                scaling_advanced: '',
                scaling_injured: '',
                modalities: [],
                lesson_plan: [],
                track: 'CrossFit'
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

        if (!user) {
            alert('You must be logged in to log a result');
            setLoading(false);
            return;
        }

        const { error } = await supabase
            .from('results')
            .insert([{
                wod_id: showResultModal,
                user_id: user.id,
                result: resultData.score,
                notes: resultData.notes,
                rx: resultData.rx
            }]);

        if (error) {
            alert('Error logging result: ' + error.message);
        } else {
            setShowResultModal(null);
            setResultData({ score: '', notes: '', rx: true });
            fetchResults();
            alert('Result logged successfully!');
        }
        setLoading(false);
    };

    // Bias Checker Logic (Only for CrossFit track)
    const crossfitWods = useMemo(() => wods.filter(w => w.track === 'CrossFit'), [wods]);
    const last7DaysBias = useMemo(() => {
        const counts = { weightlifting: 0, gymnastics: 0, mono: 0, metcon: 0 };
        const totalWods = Math.min(crossfitWods.length, 7);
        if (totalWods === 0) return counts;

        crossfitWods.slice(0, 7).forEach(wod => {
            (wod.modalities || []).forEach(m => {
                if (m.toLowerCase().includes('weightlifting')) counts.weightlifting++;
                if (m.toLowerCase().includes('gymnastics')) counts.gymnastics++;
                if (m.toLowerCase().includes('mono')) counts.mono++;
                if (m.toLowerCase().includes('metcon')) counts.metcon++;
            });
        });
        return counts;
    }, [crossfitWods]);

    const filteredWods = useMemo(() => {
        if (activeTrack === 'all') return wods;
        return wods.filter(w => w.track === activeTrack);
    }, [wods, activeTrack]);

    const addLessonBlock = () => {
        setNewWOD({
            ...newWOD,
            lesson_plan: [...newWOD.lesson_plan, { time: '', activity: '', description: '' }]
        });
    };

    const removeLessonBlock = (index: number) => {
        const updated = [...newWOD.lesson_plan];
        updated.splice(index, 1);
        setNewWOD({ ...newWOD, lesson_plan: updated });
    };

    const updateLessonBlock = (index: number, field: keyof LessonBlock, value: string) => {
        const updated = [...newWOD.lesson_plan];
        updated[index] = { ...updated[index], [field]: value };
        setNewWOD({ ...newWOD, lesson_plan: updated });
    };

    const toggleModality = (mod: string) => {
        const current = [...newWOD.modalities];
        const idx = current.indexOf(mod);
        if (idx > -1) current.splice(idx, 1);
        else current.push(mod);
        setNewWOD({ ...newWOD, modalities: current });
    };

    return (
        <div className="space-y-6 text-left">
            <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-black italic tracking-tighter uppercase text-primary flex items-center gap-2">
                        <Activity className="h-8 w-8 text-primary" /> Programming
                    </h1>
                    <p className="text-muted-foreground text-sm font-bold uppercase italic opacity-70">Design and track daily box performance.</p>
                </div>

                <div className="flex gap-2">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="gap-2 font-black uppercase italic border-primary/40 text-primary">
                                <History className="h-4 w-4" /> My Records
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle className="text-xl font-black italic uppercase">Personal Records (RMs)</DialogTitle>
                                <DialogDescription className="font-bold uppercase text-[10px]">
                                    Update your 1RM for automatic loading calculations.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
                                {userPRs.length === 0 && (
                                    <div className="text-center py-6 border-2 border-dashed rounded-lg opacity-50">
                                        <p className="text-xs font-bold uppercase italic">No records found. Start adding!</p>
                                    </div>
                                )}
                                <div className="grid grid-cols-1 gap-3">
                                    {userPRs.map((pr) => (
                                        <div key={pr.id} className="p-4 bg-muted/40 rounded-xl border border-primary/10 flex items-center justify-between group hover:border-primary/40 transition-all">
                                            <div>
                                                <p className="text-[10px] font-black uppercase text-primary mb-1">{pr.movements?.name}</p>
                                                <div className="flex items-end gap-1">
                                                    <span className="text-2xl font-black italic tracking-tighter">{pr.weight_kg}</span>
                                                    <span className="text-[10px] font-bold uppercase opacity-60 mb-1">KG</span>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="sm" className="h-8 px-2 text-[10px] font-black uppercase opacity-0 group-hover:opacity-100 transition-opacity">
                                                Update
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <DialogFooter>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button className="w-full font-black uppercase italic tracking-widest">
                                            <Plus className="h-4 w-4 mr-2" /> Add New Record
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle className="text-lg font-black uppercase italic">New PR Entry</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4 py-2">
                                            {/* Simplified add logic for now, in a real app would use a select of movements */}
                                            <p className="text-xs text-muted-foreground italic">Add your movement records through the Benchmarks section for full movement list.</p>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={showBulkModal} onOpenChange={setShowBulkModal}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="gap-2 font-black uppercase italic border-primary/40 text-primary">
                                <FileUp className="h-4 w-4" /> Bulk Import
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[700px]">
                            <DialogHeader>
                                <DialogTitle className="text-xl font-black italic uppercase">WOD Mega-Importer</DialogTitle>
                                <DialogDescription className="font-bold uppercase text-[10px]">
                                    Paste your .md or text programming here. Use "---" to separate days.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <Textarea
                                    placeholder="WOD Title&#10;Metcon description...&#10;---&#10;Next Title..."
                                    className="min-h-[300px] font-mono text-xs"
                                    value={bulkText}
                                    onChange={(e) => {
                                        setBulkText(e.target.value);
                                        parseBulkText(e.target.value);
                                    }}
                                />
                                {previewWods.length > 0 && (
                                    <div className="bg-muted p-3 rounded-md">
                                        <p className="text-[10px] font-black uppercase italic mb-2">Detected Sessions ({previewWods.length})</p>
                                        <div className="max-h-[100px] overflow-y-auto space-y-1">
                                            {previewWods.map((w, i) => (
                                                <div key={i} className="text-[9px] font-bold uppercase border-b border-muted-foreground/10 pb-1">
                                                    {i + 1}. {w.title} <span className="text-primary">({w.track})</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <DialogFooter>
                                <Button onClick={handleBulkImport} className="w-full font-black uppercase italic" disabled={loading || previewWods.length === 0}>
                                    {loading ? "Syncing..." : `Finalize ${previewWods.length} Sessions Import`}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={showEditor} onOpenChange={setShowEditor}>
                        <DialogTrigger asChild>
                            <Button className="gap-2 font-black uppercase italic shadow-lg shadow-primary/20">
                                <Plus className="h-4 w-4" /> Program Session
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[800px] h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">Session Designer</DialogTitle>
                                <DialogDescription className="font-bold uppercase text-[10px] opacity-70">
                                    Create a multi-dimensional training session for any track.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handlePublishWOD} className="space-y-6 py-4">
                                <Tabs defaultValue="basics" className="w-full">
                                    <TabsList className="grid w-full grid-cols-4 mb-4">
                                        <TabsTrigger value="basics" className="font-black text-[10px] uppercase">Basics</TabsTrigger>
                                        <TabsTrigger value="plan" className="font-black text-[10px] uppercase">Lesson Plan</TabsTrigger>
                                        <TabsTrigger value="scaling" className="font-black text-[10px] uppercase">Scaling</TabsTrigger>
                                        <TabsTrigger value="meta" className="font-black text-[10px] uppercase">Bias/Meta</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="basics" className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="uppercase text-[10px] font-black">Programming Track</Label>
                                                <Select
                                                    value={newWOD.track}
                                                    onValueChange={(v) => setNewWOD({ ...newWOD, track: v as any })}
                                                >
                                                    <SelectTrigger className="font-bold italic uppercase h-10">
                                                        <SelectValue placeholder="Select track" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {TRACKS.map(t => (
                                                            <SelectItem key={t} value={t} className="font-bold uppercase italic">{t}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="uppercase text-[10px] font-black">WOD Title</Label>
                                                <Input
                                                    placeholder="e.g. MORNING GRIND"
                                                    required
                                                    className="uppercase italic font-bold h-10"
                                                    value={newWOD.title}
                                                    onChange={(e) => setNewWOD({ ...newWOD, title: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="uppercase text-[10px] font-black">Work Description (Metcon/Routine)</Label>
                                            <Textarea
                                                placeholder="5 Rounds for time: 400m Run, 15 Thrusters..."
                                                required
                                                className="min-h-[150px] font-mono text-sm leading-relaxed"
                                                value={newWOD.metcon}
                                                onChange={(e) => setNewWOD({ ...newWOD, metcon: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="uppercase text-[10px] font-black flex items-center gap-1.5"><Flame className="h-3 w-3 text-orange-500" /> Intended Stimulus</Label>
                                            <Textarea
                                                placeholder="Target time, intensity, goals..."
                                                className="text-xs italic"
                                                value={newWOD.stimulus}
                                                onChange={(e) => setNewWOD({ ...newWOD, stimulus: e.target.value })}
                                            />
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="plan" className="space-y-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <Label className="uppercase text-[10px] font-black">Timeline Blocks</Label>
                                            <Button type="button" variant="outline" size="sm" onClick={addLessonBlock} className="h-8 text-[10px] font-black uppercase">
                                                <Plus className="h-3 w-3 mr-1" /> Add Block
                                            </Button>
                                        </div>
                                        <div className="space-y-3">
                                            {newWOD.lesson_plan.map((block, idx) => (
                                                <div key={idx} className="grid grid-cols-12 gap-2 items-start border p-3 rounded-md bg-muted/20 relative group">
                                                    <div className="col-span-2 space-y-1">
                                                        <Label className="text-[9px] uppercase font-black">Time</Label>
                                                        <Input placeholder="5 min" value={block.time} onChange={(e) => updateLessonBlock(idx, 'time', e.target.value)} className="h-8 text-xs font-bold" />
                                                    </div>
                                                    <div className="col-span-4 space-y-1">
                                                        <Label className="text-[9px] uppercase font-black">Activity</Label>
                                                        <Input placeholder="Warmup" value={block.activity} onChange={(e) => updateLessonBlock(idx, 'activity', e.target.value)} className="h-8 text-xs font-bold" />
                                                    </div>
                                                    <div className="col-span-5 space-y-1">
                                                        <Label className="text-[9px] uppercase font-black">Details</Label>
                                                        <Input placeholder="Row 500m..." value={block.description} onChange={(e) => updateLessonBlock(idx, 'description', e.target.value)} className="h-8 text-xs font-bold" />
                                                    </div>
                                                    <div className="col-span-1 pt-6 flex justify-end">
                                                        <Button type="button" variant="ghost" size="icon" onClick={() => removeLessonBlock(idx)} className="h-8 w-8 text-destructive hover:bg-destructive/10">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                            {newWOD.lesson_plan.length === 0 && (
                                                <div className="text-center py-10 border-2 border-dashed rounded-md text-muted-foreground italic text-sm">
                                                    No lesson plan defined. Start by adding a block.
                                                </div>
                                            )}
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="scaling" className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="uppercase text-[10px] font-black text-emerald-500">Beginner Scaling</Label>
                                                <Textarea placeholder="Light weight, simplified movements..." className="h-24 text-xs" value={newWOD.scaling_beginner} onChange={(e) => setNewWOD({ ...newWOD, scaling_beginner: e.target.value })} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="uppercase text-[10px] font-black text-blue-500">Intermediate Scaling</Label>
                                                <Textarea placeholder="Moderate complexity..." className="h-24 text-xs" value={newWOD.scaling_intermediate} onChange={(e) => setNewWOD({ ...newWOD, scaling_intermediate: e.target.value })} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="uppercase text-[10px] font-black text-amber-500">Advanced / Rx+</Label>
                                                <Textarea placeholder="Heavier weight or more reps..." className="h-24 text-xs" value={newWOD.scaling_advanced} onChange={(e) => setNewWOD({ ...newWOD, scaling_advanced: e.target.value })} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="uppercase text-[10px] font-black text-red-500">Injuries / Mods</Label>
                                                <Textarea placeholder="Alternates for knee/shoulder issues..." className="h-24 text-xs" value={newWOD.scaling_injured} onChange={(e) => setNewWOD({ ...newWOD, scaling_injured: e.target.value })} />
                                            </div>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="meta" className="space-y-4">
                                        <Label className="uppercase text-[10px] font-black">Programmed Modalities</Label>
                                        <div className="flex flex-wrap gap-2">
                                            {MODALITIES.map(mod => (
                                                <Button
                                                    key={mod}
                                                    type="button"
                                                    variant={newWOD.modalities.includes(mod) ? "default" : "outline"}
                                                    className="h-8 text-[10px] font-black uppercase italic"
                                                    onClick={() => toggleModality(mod)}
                                                >
                                                    {newWOD.modalities.includes(mod) && <Check className="h-3 w-3 mr-1" />}
                                                    {mod}
                                                </Button>
                                            ))}
                                        </div>
                                        <Alert className="mt-4 border-primary/20 bg-primary/5">
                                            <AlertTriangle className="h-4 w-4 text-primary" />
                                            <AlertDescription className="text-[10px] font-bold uppercase italic ml-2">
                                                Selection affects the Bias Checker for the CrossFit Track.
                                            </AlertDescription>
                                        </Alert>
                                    </TabsContent>
                                </Tabs>

                                <DialogFooter>
                                    <Button type="submit" className="w-full font-black uppercase italic tracking-widest" disabled={loading}>
                                        {loading ? "Syncing..." : "Publish Session"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </header>

            {/* Track Selector Bar */}
            <div className="flex flex-wrap gap-2 pb-2">
                <Button
                    variant={activeTrack === 'all' ? "default" : "outline"}
                    onClick={() => setActiveTrack('all')}
                    className="h-9 px-4 font-black uppercase italic text-[11px] tracking-widest"
                >
                    <LayoutGrid className="h-3.5 w-3.5 mr-2" /> All Tracks
                </Button>
                <Button
                    variant={activeTrack === 'CrossFit' ? "default" : "outline"}
                    onClick={() => setActiveTrack('CrossFit')}
                    className="h-9 px-4 font-black uppercase italic text-[11px] tracking-widest border-primary/40 text-primary"
                >
                    <Activity className="h-3.5 w-3.5 mr-2" /> CrossFit
                </Button>
                <Button
                    variant={activeTrack === 'Novice' ? "default" : "outline"}
                    onClick={() => setActiveTrack('Novice')}
                    className="h-9 px-4 font-black uppercase italic text-[11px] tracking-widest border-emerald-500/40 text-emerald-500"
                >
                    <Users className="h-3.5 w-3.5 mr-2" /> Novice
                </Button>
                <Button
                    variant={activeTrack === 'Bodybuilding' ? "default" : "outline"}
                    onClick={() => setActiveTrack('Bodybuilding')}
                    className="h-9 px-4 font-black uppercase italic text-[11px] tracking-widest border-blue-500/40 text-blue-500"
                >
                    <MuscleIcon className="h-3.5 w-3.5 mr-2" /> Musculación
                </Button>
                <Button
                    variant={activeTrack === 'Engine' ? "default" : "outline"}
                    onClick={() => setActiveTrack('Engine')}
                    className="h-9 px-4 font-black uppercase italic text-[11px] tracking-widest border-orange-500/40 text-orange-500"
                >
                    <Sparkles className="h-3.5 w-3.5 mr-2" /> Engine
                </Button>
            </div>

            {/* Bias Checker Insight (Visible when activeTrack is 'all' or 'CrossFit') */}
            {(activeTrack === 'all' || activeTrack === 'CrossFit') && (
                <Card className="border-2 border-primary/20 shadow-xl overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
                    <CardHeader className="py-4 border-b bg-muted/20">
                        <div className="flex items-center gap-2">
                            <Target className="h-5 w-5 text-primary" />
                            <CardTitle className="text-sm font-black italic uppercase tracking-tighter">CrossFit Bias Checker (Last 7 Days)</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="py-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                    <span className="flex items-center gap-1"><Dumbbell className="h-3 w-3" /> Weightlifting</span>
                                    <span>{last7DaysBias.weightlifting} Sessions</span>
                                </div>
                                <Progress value={(last7DaysBias.weightlifting / 7) * 100} className="h-1.5" />
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                    <span className="flex items-center gap-1"><Zap className="h-3 w-3" /> Gymnastics</span>
                                    <span>{last7DaysBias.gymnastics} Sessions</span>
                                </div>
                                <Progress value={(last7DaysBias.gymnastics / 7) * 100} className="h-1.5" />
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                    <span className="flex items-center gap-1"><Timer className="h-3 w-3" /> Mono / Cardio</span>
                                    <span>{last7DaysBias.mono} Sessions</span>
                                </div>
                                <Progress value={(last7DaysBias.mono / 7) * 100} className="h-1.5" />
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                    <span className="flex items-center gap-1"><Flame className="h-3 w-3" /> Mixed Metcon</span>
                                    <span>{last7DaysBias.metcon} Sessions</span>
                                </div>
                                <Progress value={(last7DaysBias.metcon / 7) * 100} className="h-1.5" />
                            </div>
                        </div>

                        <div className="mt-6 flex flex-wrap gap-4 items-center justify-center py-2 px-4 rounded-full bg-muted/40 text-[9px] font-black uppercase italic tracking-tight">
                            <span className="text-muted-foreground mr-2">Coach Suggestion:</span>
                            {last7DaysBias.weightlifting < 2 && <span className="text-blue-500">Add Strength sessions.</span>}
                            {last7DaysBias.gymnastics < 2 && <span className="text-emerald-500">Need more Gymnastics work.</span>}
                            {last7DaysBias.mono < 1 && <span className="text-amber-500">Increase Monostructural volume.</span>}
                            {Object.values(last7DaysBias).every(v => v >= 1) && <span className="text-emerald-500 flex items-center gap-1"><Check className="h-3 w-3" /> Program Balanced!</span>}
                        </div>
                    </CardContent>
                </Card>
            )}

            <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                    <TabsTrigger value="all" className="font-bold uppercase text-[10px]">Daily Board</TabsTrigger>
                    <TabsTrigger value="history" className="font-bold uppercase text-[10px]">Community Log</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-6">
                    <div className="grid gap-8">
                        {loading && wods.length === 0 ? (
                            <div className="py-20 text-center">
                                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                                <p className="text-xs font-black uppercase italic tracking-widest text-muted-foreground">Accessing Programming Vault...</p>
                            </div>
                        ) : filteredWods.length === 0 ? (
                            <Card className="border-dashed border-2 bg-muted/10">
                                <CardContent className="py-20 text-center">
                                    <Shield className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                                    <p className="text-muted-foreground font-bold uppercase italic">No sessions programmed for this track.</p>
                                </CardContent>
                            </Card>
                        ) : (
                            filteredWods.map(wod => (
                                <Card key={wod.id} className="overflow-hidden border-2 shadow-2xl bg-card transition-all hover:border-primary/40 group">
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
                                                <Badge variant="outline" className="text-[10px] h-5 bg-background font-black border-primary/30 text-primary">
                                                    <Clock className="h-3 w-3 mr-1" /> {new Date(wod.date).toLocaleDateString()}
                                                </Badge>
                                                {wod.modalities?.map(m => (
                                                    <Badge key={m} className="bg-primary/10 text-primary border-none text-[9px] h-5 font-black uppercase">
                                                        {m}
                                                    </Badge>
                                                ))}
                                            </div>
                                            <CardTitle className="text-4xl font-black uppercase tracking-tighter italic text-foreground group-hover:text-primary transition-colors">
                                                {wod.title}
                                            </CardTitle>
                                        </div>
                                        <div className="flex gap-2">
                                            <Dialog open={showResultModal === wod.id} onOpenChange={(open) => setShowResultModal(open ? wod.id : null)}>
                                                <DialogTrigger asChild>
                                                    <Button className="font-black uppercase italic text-xs tracking-tighter shadow-lg active:scale-95 transition-all">
                                                        <Trophy className="h-4 w-4 mr-2" /> Log Performance
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="sm:max-w-[425px]">
                                                    <DialogHeader>
                                                        <DialogTitle className="text-xl font-black uppercase italic tracking-tighter">Save your mark</DialogTitle>
                                                        <DialogDescription className="text-[10px] font-bold uppercase">
                                                            Record results for {wod.title}.
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <form onSubmit={handleLogResult} className="space-y-4 py-4">
                                                        <div className="space-y-2">
                                                            <Label className="text-[10px] font-black uppercase">Result (Time or Reps)</Label>
                                                            <Input
                                                                placeholder="e.g. 12:45 or 150 Reps"
                                                                required
                                                                className="font-black uppercase italic"
                                                                value={resultData.score}
                                                                onChange={(e) => setResultData({ ...resultData, score: e.target.value })}
                                                            />
                                                        </div>
                                                        <div className="flex items-center space-x-3 rounded-xl border-2 p-4 bg-primary/5 border-primary/20">
                                                            <input
                                                                type="checkbox"
                                                                id="rx"
                                                                className="h-5 w-5 rounded border-primary bg-background text-primary focus:ring-primary"
                                                                checked={resultData.rx}
                                                                onChange={(e) => setResultData({ ...resultData, rx: e.target.checked })}
                                                            />
                                                            <div className="grid gap-1 leading-none">
                                                                <label htmlFor="rx" className="text-sm font-black leading-none text-primary uppercase italic">
                                                                    RX Level
                                                                </label>
                                                                <p className="text-[10px] text-muted-foreground uppercase font-bold">
                                                                    As prescribed. Elite movement quality.
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-[10px] font-black uppercase">Coach's Field Notes</Label>
                                                            <Textarea
                                                                placeholder="Any breaks? Scaling used?"
                                                                className="min-h-[80px] text-sm"
                                                                value={resultData.notes}
                                                                onChange={(e) => setResultData({ ...resultData, notes: e.target.value })}
                                                            />
                                                        </div>
                                                        <DialogFooter>
                                                            <Button type="submit" className="w-full font-black uppercase italic tracking-widest">Store Data</Button>
                                                        </DialogFooter>
                                                    </form>
                                                </DialogContent>
                                            </Dialog>
                                        </div>
                                    </CardHeader>
                                    <div className="grid md:grid-cols-7">
                                        {/* Main Content */}
                                        <CardContent className="md:col-span-4 p-8 space-y-8">
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-2 text-xs font-black text-primary uppercase tracking-widest italic">
                                                    <Timer className="h-4 w-4" /> Routine Description
                                                </div>
                                                <div className="rounded-2xl bg-muted/50 p-6 font-mono text-base leading-relaxed border-2 border-dashed border-primary/20 whitespace-pre-wrap">
                                                    {wod.metcon}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-2 text-[10px] font-black text-orange-600 uppercase tracking-widest italic">
                                                        <Flame className="h-4 w-4 ring-1 ring-orange-500/30 rounded-full p-0.5" /> Intended Stimulus
                                                    </div>
                                                    <p className="text-sm text-muted-foreground italic leading-relaxed font-medium bg-orange-500/5 p-4 rounded-xl border border-orange-500/10">
                                                        {wod.stimulus || "Focus on consistency."}
                                                    </p>
                                                </div>
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest italic">
                                                        <Scale className="h-4 w-4 ring-1 ring-blue-500/30 rounded-full p-0.5" /> General Scaling
                                                    </div>
                                                    <p className="text-sm text-muted-foreground italic leading-relaxed font-medium bg-blue-500/5 p-4 rounded-xl border border-blue-500/10">
                                                        {wod.scaling_options || "Adjust weight to maintain intensity."}
                                                    </p>
                                                    {calculateWeight(wod.metcon) && (
                                                        <div className="mt-2 p-3 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-between">
                                                            <div>
                                                                <p className="text-[8px] font-black uppercase text-primary">Your Calculated Load</p>
                                                                <p className="text-xs font-bold italic">{calculateWeight(wod.metcon)?.movement} @ {calculateWeight(wod.metcon)?.percent}%</p>
                                                            </div>
                                                            <div className="text-xl font-black italic text-primary">
                                                                {calculateWeight(wod.metcon)?.weight} <span className="text-[10px] uppercase">kg</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Structured Scaling Logic */}
                                            {wod.track !== 'Bodybuilding' && (
                                                <div className="pt-6 space-y-4">
                                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest italic text-muted-foreground">
                                                        <Shield className="h-4 w-4" /> Class Levels & Options
                                                    </div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        <div className="p-4 rounded-xl border bg-emerald-500/5 border-emerald-500/10 hover:bg-emerald-500/10 transition-colors">
                                                            <Badge className="bg-emerald-500 text-white text-[8px] mb-2 font-black uppercase">Beginner</Badge>
                                                            <p className="text-xs font-bold leading-relaxed">{wod.scaling_beginner || "Talk to coach for mods."}</p>
                                                        </div>
                                                        <div className="p-4 rounded-xl border bg-blue-500/5 border-blue-500/10 hover:bg-blue-500/10 transition-colors">
                                                            <Badge className="bg-blue-500 text-white text-[8px] mb-2 font-black uppercase">Intermediate</Badge>
                                                            <p className="text-xs font-bold leading-relaxed">{wod.scaling_intermediate || "Standard scaling applies."}</p>
                                                        </div>
                                                        <div className="p-4 rounded-xl border bg-amber-500/5 border-amber-500/10 hover:bg-amber-500/10 transition-colors">
                                                            <Badge className="bg-amber-500 text-white text-[8px] mb-2 font-black uppercase">Advanced / RX+</Badge>
                                                            <p className="text-xs font-bold leading-relaxed">{wod.scaling_advanced || "Competitive standards."}</p>
                                                        </div>
                                                        <div className="p-4 rounded-xl border bg-red-500/5 border-red-500/10 hover:bg-red-500/10 transition-colors">
                                                            <Badge className="bg-red-500 text-white text-[8px] mb-2 font-black uppercase">Injury / Limited</Badge>
                                                            <p className="text-xs font-bold leading-relaxed">{wod.scaling_injured || "Custom alternatives."}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>

                                        {/* Lesson Plan Sidebar */}
                                        <div className="md:col-span-3 bg-muted/20 border-l border-muted/30 p-8 space-y-6">
                                            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest italic text-primary">
                                                <Clock className="h-4 w-4" /> Lesson Plan (Timeline)
                                            </div>
                                            <div className="space-y-6 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-primary/20">
                                                {wod.lesson_plan?.map((block, bIdx) => (
                                                    <div key={bIdx} className="relative pl-8 group">
                                                        <div className="absolute left-0 top-1.5 h-6 w-6 rounded-full bg-background border-2 border-primary/40 flex items-center justify-center -ml-0 group-hover:scale-110 transition-transform">
                                                            <div className="h-2 w-2 rounded-full bg-primary" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-[10px] font-black text-primary uppercase italic">{block.time}</span>
                                                                <span className="text-[10px] font-black opacity-40 uppercase tracking-tighter">{block.activity}</span>
                                                            </div>
                                                            <h4 className="text-sm font-black uppercase tracking-tight italic leading-tight group-hover:translate-x-1 transition-transform">{block.activity}</h4>
                                                            <p className="text-xs text-muted-foreground leading-relaxed font-medium">{block.description}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                                {(!wod.lesson_plan || wod.lesson_plan.length === 0) && (
                                                    <div className="text-[10px] font-bold text-muted-foreground uppercase italic pl-8">
                                                        Guided class timeline not specified for this session.
                                                    </div>
                                                )}
                                            </div>

                                            <Separator className="bg-primary/10" />

                                            <div className="space-y-4 pt-4">
                                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest italic text-muted-foreground">
                                                    <Activity className="h-4 w-4" /> Pulse check
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="bg-background rounded-xl p-4 border text-center shadow-sm">
                                                        <div className="text-xl font-black italic text-primary">{results.filter(r => r.wod_id === wod.id).length}</div>
                                                        <div className="text-[8px] font-black uppercase opacity-60">Results Logged</div>
                                                    </div>
                                                    <div className="bg-background rounded-xl p-4 border text-center shadow-sm">
                                                        <div className="text-xl font-black italic text-orange-500">RX</div>
                                                        <div className="text-[8px] font-black uppercase opacity-60">Target Standard</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-zinc-900 py-2 px-8 flex items-center justify-between text-[9px] text-zinc-400 font-bold uppercase tracking-widest italic">
                                        <span className="flex items-center gap-1.5"><Shield className="h-3 w-3 text-primary" /> Official Programmed Session</span>
                                        <span className="flex items-center gap-1.5"><Info className="h-3 w-3" /> System Verified: Box Management Core</span>
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="history" className="mt-6">
                    <Card className="shadow-2xl border-none overflow-hidden bg-muted/10">
                        <CardHeader className="bg-background/80 backdrop-blur-md border-b">
                            <CardTitle className="font-black italic uppercase tracking-tighter text-2xl">Community Leaderboard</CardTitle>
                            <CardDescription className="text-[10px] font-bold uppercase opacity-60">Global performance tracking across all divisions.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0 text-left">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted hover:bg-muted border-none">
                                        <TableHead className="font-black uppercase text-[10px] tracking-widest pl-6">Athlete</TableHead>
                                        <TableHead className="font-black uppercase text-[10px] tracking-widest">WOD Session</TableHead>
                                        <TableHead className="font-black uppercase text-[10px] tracking-widest">Result</TableHead>
                                        <TableHead className="font-black uppercase text-[10px] tracking-widest">Category</TableHead>
                                        <TableHead className="font-black uppercase text-[10px] tracking-widest text-right pr-6">Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {results.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-20">
                                                <Trophy className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                                                <p className="text-muted-foreground font-bold uppercase italic">The leaderboard is empty. Make your mark!</p>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        results.map((res) => (
                                            <TableRow key={res.id} className="hover:bg-primary/5 border-muted/20 transition-colors">
                                                <TableCell className="font-black uppercase italic text-sm pl-6 tracking-tighter">
                                                    {res.profiles?.first_name} {res.profiles?.last_name}
                                                </TableCell>
                                                <TableCell className="text-[10px] font-bold uppercase text-muted-foreground">
                                                    {wods.find(w => w.id === res.wod_id)?.title || "Unknown"}
                                                </TableCell>
                                                <TableCell className="font-black font-mono text-lg text-primary italic tracking-tighter">
                                                    {res.result}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={res.rx ? "default" : "secondary"} className={cn("text-[9px] uppercase font-black px-2 shadow-sm", res.rx ? "bg-primary text-white" : "bg-zinc-200 text-zinc-900")}>
                                                        {res.rx ? "RX Elite" : "Scaled"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right pr-6 font-mono text-[10px] opacity-60">
                                                    {new Date(res.created_at).toLocaleDateString()}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};
