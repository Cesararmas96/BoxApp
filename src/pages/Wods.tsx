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
    Search
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

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <Label className="uppercase text-[10px] font-black">{t('wods.routine_structure')}</Label>
                                            <div className="flex gap-1.5">
                                                <Button type="button" variant="outline" size="sm" onClick={() => setNewWOD(prev => ({ ...prev, metcon: prev.metcon + (prev.metcon ? "\n\n" : "") + "### WARM UP\n- " }))} className="h-7 text-[8px] font-black uppercase text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/10">
                                                    {t('wods.add_warmup')}
                                                </Button>
                                                <Button type="button" variant="outline" size="sm" onClick={() => setNewWOD(prev => ({ ...prev, metcon: prev.metcon + (prev.metcon ? "\n\n" : "") + "### STRENGTH\n- " }))} className="h-7 text-[8px] font-black uppercase text-blue-500 border-blue-500/20 hover:bg-blue-500/10">
                                                    {t('wods.add_strength')}
                                                </Button>
                                                <Button type="button" variant="outline" size="sm" onClick={() => setNewWOD(prev => ({ ...prev, metcon: prev.metcon + (prev.metcon ? "\n\n" : "") + "### METCON\n- " }))} className="h-7 text-[8px] font-black uppercase text-primary border-primary/20 hover:bg-primary/10">
                                                    {t('wods.add_metcon')}
                                                </Button>
                                            </div>
                                        </div>
                                        <Textarea
                                            placeholder={t('wods.placeholder_movements')}
                                            className="min-h-[250px] font-mono text-sm border-2"
                                            value={newWOD.metcon}
                                            onChange={(e) => setNewWOD({ ...newWOD, metcon: e.target.value })}
                                        />
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
