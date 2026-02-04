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
    Trash2
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
}

const MODALITIES = ['Weightlifting', 'Gymnastics', 'Monostructural', 'Metabolic Conditioning'];

export const Wods: React.FC = () => {
    const [wods, setWods] = useState<WOD[]>([]);
    const [loading, setLoading] = useState(true);
    const [showEditor, setShowEditor] = useState(false);
    const [showResultModal, setShowResultModal] = useState<string | null>(null);
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
        lesson_plan: [] as LessonBlock[]
    });
    const [resultData, setResultData] = useState({ score: '', notes: '', rx: true });
    const [results, setResults] = useState<any[]>([]);

    useEffect(() => {
        fetchWods();
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
            // Ensure array fields are not null
            const formattedData = data.map(w => ({
                ...w,
                modalities: w.modalities || [],
                lesson_plan: w.lesson_plan || []
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
                lesson_plan: []
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

    // Bias Checker Logic
    const last7DaysBias = useMemo(() => {
        const counts = { weightlifting: 0, gymnastics: 0, mono: 0, metcon: 0 };
        const totalWods = Math.min(wods.length, 7);
        if (totalWods === 0) return counts;

        wods.slice(0, 7).forEach(wod => {
            (wod.modalities || []).forEach(m => {
                if (m.toLowerCase().includes('weightlifting')) counts.weightlifting++;
                if (m.toLowerCase().includes('gymnastics')) counts.gymnastics++;
                if (m.toLowerCase().includes('mono')) counts.mono++;
                if (m.toLowerCase().includes('metcon')) counts.metcon++;
            });
        });
        return counts;
    }, [wods]);

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
                    <Dialog open={showEditor} onOpenChange={setShowEditor}>
                        <DialogTrigger asChild>
                            <Button className="gap-2 font-black uppercase italic shadow-lg shadow-primary/20">
                                <Plus className="h-4 w-4" /> Program WOD
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[800px] h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">Advanced WOD Designer</DialogTitle>
                                <DialogDescription className="font-bold uppercase text-[10px] opacity-70">
                                    Create a multi-dimensional training session with scaling and lesson plan.
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
                                        <div className="space-y-2">
                                            <Label className="uppercase text-[10px] font-black">WOD Title</Label>
                                            <Input
                                                placeholder="e.g. MORNING GRIND"
                                                required
                                                className="uppercase italic font-bold"
                                                value={newWOD.title}
                                                onChange={(e) => setNewWOD({ ...newWOD, title: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="uppercase text-[10px] font-black">Work Description (Metcon)</Label>
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
                                            <CardDescription className="text-[10px] font-bold uppercase italic ml-2">
                                                Selection affects the Bias Checker (CrossFit Methodology Compliance).
                                            </CardDescription>
                                        </Alert>
                                    </TabsContent>
                                </Tabs>

                                <DialogFooter>
                                    <Button type="submit" className="w-full font-black uppercase italic tracking-widest" disabled={loading}>
                                        {loading ? "Syncing..." : "Publish Session to Box Board"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </header>

            {/* Bias Checker Insight */}
            <Card className="border-2 border-primary/20 shadow-xl overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
                <CardHeader className="py-4 border-b bg-muted/20">
                    <div className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-primary" />
                        <CardTitle className="text-sm font-black italic uppercase tracking-tighter">Programming Bias Checker (Last 7 Days)</CardTitle>
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
                        ) : wods.length === 0 ? (
                            <Card className="border-dashed border-2 bg-muted/10">
                                <CardContent className="py-20 text-center">
                                    <Shield className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                                    <p className="text-muted-foreground font-bold uppercase italic">No WODs programmed for this period.</p>
                                </CardContent>
                            </Card>
                        ) : (
                            wods.map(wod => (
                                <Card key={wod.id} className="overflow-hidden border-2 shadow-2xl bg-card transition-all hover:border-primary/40 group">
                                    <CardHeader className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b bg-muted/10">
                                        <div className="space-y-2">
                                            <div className="flex flex-wrap items-center gap-2">
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
                                                    <Timer className="h-4 w-4" /> Workout Description
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
                                                </div>
                                            </div>

                                            {/* Structured Scaling Logic */}
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

// Missing Loader2 icon
const Loader2 = ({ className }: { className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn("animate-spin", className)}
    >
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
);
