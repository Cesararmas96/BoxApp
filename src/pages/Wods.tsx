import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    Plus,
    Flame,
    Trophy,
    Shield,
    Check,
    Info
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

interface WOD {
    id: string;
    title: string;
    date: string;
    metcon: string;
    stimulus: string;
    scaling_options: string;
}

export const Wods: React.FC = () => {
    const [wods, setWods] = useState<WOD[]>([]);
    const [loading, setLoading] = useState(true);
    const [showEditor, setShowEditor] = useState(false);
    const [showResultModal, setShowResultModal] = useState<string | null>(null);
    const [newWOD, setNewWOD] = useState({ title: '', metcon: '', stimulus: '', scaling_options: '' });
    const [resultData, setResultData] = useState({ score: '', notes: '', rx: true });

    useEffect(() => {
        fetchWods();
    }, []);

    const fetchWods = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('wods')
            .select('*')
            .order('date', { ascending: false });

        if (!error && data) setWods(data);
        setLoading(false);
    };

    const handlePublishWOD = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase
            .from('wods')
            .insert([{
                title: newWOD.title,
                metcon: newWOD.metcon,
                stimulus: newWOD.stimulus,
                scaling_options: newWOD.scaling_options,
                date: new Date().toISOString()
            }]);

        if (error) {
            alert('Error publishing WOD: ' + error.message);
        } else {
            setShowEditor(false);
            setNewWOD({ title: '', metcon: '', stimulus: '', scaling_options: '' });
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
                user_id: user.id, // Fixed column name from previous version
                result: resultData.score,
                notes: resultData.notes,
                rx: resultData.rx
            }]);

        if (error) {
            alert('Error logging result: ' + error.message);
        } else {
            setShowResultModal(null);
            setResultData({ score: '', notes: '', rx: true });
            alert('Result logged successfully!');
        }
        setLoading(false);
    };

    return (
        <div className="space-y-6">
            <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Programming</h1>
                    <p className="text-muted-foreground text-sm">Design and track daily box performance.</p>
                </div>

                <Dialog open={showEditor} onOpenChange={setShowEditor}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" /> Program WOD
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle>New Workout Definition</DialogTitle>
                            <DialogDescription>
                                Create the daily training session for your athletes.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handlePublishWOD} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>WOD Title</Label>
                                <Input
                                    placeholder="e.g. MORNING GRIND"
                                    required
                                    value={newWOD.title}
                                    onChange={(e) => setNewWOD({ ...newWOD, title: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Work Description (Metcon)</Label>
                                <Textarea
                                    placeholder="5 Rounds for time: 400m Run, 15 Thrusters..."
                                    required
                                    className="min-h-[120px]"
                                    value={newWOD.metcon}
                                    onChange={(e) => setNewWOD({ ...newWOD, metcon: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-1.5"><Flame className="h-3 w-3 text-orange-500" /> Stimulus</Label>
                                    <Textarea
                                        placeholder="Target time, intensity..."
                                        className="text-xs"
                                        value={newWOD.stimulus}
                                        onChange={(e) => setNewWOD({ ...newWOD, stimulus: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-1.5"><Shield className="h-3 w-3 text-blue-500" /> Scaling</Label>
                                    <Textarea
                                        placeholder="Mods for beginner/intermediate..."
                                        className="text-xs"
                                        value={newWOD.scaling_options}
                                        onChange={(e) => setNewWOD({ ...newWOD, scaling_options: e.target.value })}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" className="w-full md:w-auto" disabled={loading}>
                                    {loading ? "Publishing..." : "Publish to Board"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </header>

            <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                    <TabsTrigger value="all">Daily Board</TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-6">
                    <div className="grid gap-6">
                        {loading && wods.length === 0 ? (
                            <div className="py-12 text-center text-muted-foreground">Loading workout board...</div>
                        ) : wods.length === 0 ? (
                            <Card className="border-dashed">
                                <CardContent className="py-12 text-center text-muted-foreground">
                                    No WODs programmed for today yet.
                                </CardContent>
                            </Card>
                        ) : (
                            wods.map(wod => (
                                <Card key={wod.id} className="overflow-hidden border-l-4 border-l-primary shadow-md">
                                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="text-[10px] h-5 bg-background font-mono">
                                                    WOD: {new Date(wod.date).toLocaleDateString()}
                                                </Badge>
                                                <Badge className="bg-primary/10 text-primary border-none text-[10px] h-5">METCON</Badge>
                                            </div>
                                            <CardTitle className="text-2xl font-black uppercase tracking-tighter italic">
                                                {wod.title}
                                            </CardTitle>
                                        </div>
                                        <Dialog open={showResultModal === wod.id} onOpenChange={(open) => setShowResultModal(open ? wod.id : null)}>
                                            <DialogTrigger asChild>
                                                <Button size="sm" className="bg-zinc-900 text-white hover:bg-zinc-800">
                                                    <Trophy className="h-4 w-4 mr-2" /> Log Result
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="sm:max-w-[425px]">
                                                <DialogHeader>
                                                    <DialogTitle>Log Your Effort</DialogTitle>
                                                    <DialogDescription>
                                                        Save your performance for {wod.title}.
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <form onSubmit={handleLogResult} className="space-y-4 py-4">
                                                    <div className="space-y-2">
                                                        <Label>Result (Time or Reps)</Label>
                                                        <Input
                                                            placeholder="e.g. 12:45 or 150 Reps"
                                                            required
                                                            value={resultData.score}
                                                            onChange={(e) => setResultData({ ...resultData, score: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="flex items-center space-x-2 rounded-md border p-4 bg-muted/20">
                                                        <input
                                                            type="checkbox"
                                                            id="rx"
                                                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                                            checked={resultData.rx}
                                                            onChange={(e) => setResultData({ ...resultData, rx: e.target.checked })}
                                                        />
                                                        <div className="grid gap-1.5 leading-none">
                                                            <label htmlFor="rx" className="text-sm font-bold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-primary uppercase italic">
                                                                RX Performance
                                                            </label>
                                                            <p className="text-xs text-muted-foreground">
                                                                As prescribed. No scaling allowed.
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Athlete Notes</Label>
                                                        <Textarea
                                                            placeholder="How did it feel? What did you scale?"
                                                            className="min-h-[80px]"
                                                            value={resultData.notes}
                                                            onChange={(e) => setResultData({ ...resultData, notes: e.target.value })}
                                                        />
                                                    </div>
                                                    <DialogFooter>
                                                        <Button type="submit" className="w-full">Save Result</Button>
                                                    </DialogFooter>
                                                </form>
                                            </DialogContent>
                                        </Dialog>
                                    </CardHeader>
                                    <CardContent className="pt-4">
                                        <div className="rounded-md bg-muted/30 p-4 font-mono text-sm leading-relaxed border">
                                            {wod.metcon}
                                        </div>

                                        <Separator className="my-6" />

                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2 text-xs font-black text-orange-600 uppercase tracking-widest italic">
                                                    <Flame className="h-4 w-4" /> Intended Stimulus
                                                </div>
                                                <p className="text-sm text-muted-foreground italic leading-relaxed">
                                                    {wod.stimulus || "Focus on consistency and movement quality."}
                                                </p>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2 text-xs font-black text-blue-600 uppercase tracking-widest italic">
                                                    <Shield className="h-4 w-4" /> Scaling Guide
                                                </div>
                                                <p className="text-sm text-muted-foreground italic leading-relaxed">
                                                    {wod.scaling_options || "Adjust weight to maintain intensity."}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="bg-muted/50 py-3 flex items-center justify-between text-[11px] text-muted-foreground">
                                        <div className="flex items-center gap-4">
                                            <span className="flex items-center gap-1"><Check className="h-3 w-3" /> 12 Logged Today</span>
                                            <span className="flex items-center gap-1"><Flame className="h-3 w-3" /> High Intensity</span>
                                        </div>
                                        <div className="flex items-center gap-1 font-bold">
                                            <Info className="h-3 w-3" /> Programmer: Box Coach
                                        </div>
                                    </CardFooter>
                                </Card>
                            ))
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="history">
                    <Card>
                        <CardHeader>
                            <CardTitle>Workout History</CardTitle>
                            <CardDescription>Archive of past WODs and programming cycles.</CardDescription>
                        </CardHeader>
                        <CardContent className="text-center py-12 text-muted-foreground">
                            Coming soon: Full history view and search.
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};
