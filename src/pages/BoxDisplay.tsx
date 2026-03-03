import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    Timer,
    Trophy,
    Flame,
    Play,
    Pause,
    RotateCcw,
    Monitor,
    ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface WOD {
    id: string;
    title: string;
    metcon: string;
    stimulus: string;
    date: string;
}

interface Result {
    id: string;
    result: string;
    rx: boolean;
    profiles: {
        first_name: string;
        last_name: string;
    };
}

export const BoxDisplay: React.FC = () => {
    const navigate = useNavigate();
    const [currentWod, setCurrentWod] = useState<WOD | null>(null);
    const [results, setResults] = useState<Result[]>([]);
    const [time, setTime] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [timerType, setTimerType] = useState<'stopwatch' | 'countdown'>('stopwatch');
    const [initialTime] = useState(600);
    const [currentTime, setCurrentTime] = useState(new Date());

    // Live clock — updates every second
    useEffect(() => {
        const clockInterval = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(clockInterval);
    }, []);

    useEffect(() => {
        fetchTodayWod();

        const subscription = supabase
            .channel('realtime-results')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'results' }, () => {
                fetchResults();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, []);

    useEffect(() => {
        if (currentWod) {
            fetchResults();
        }
    }, [currentWod]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isRunning) {
            interval = setInterval(() => {
                setTime(prev => timerType === 'stopwatch' ? prev + 1 : Math.max(0, prev - 1));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isRunning, timerType]);

    const fetchTodayWod = async () => {
        const { data, error } = await supabase
            .from('wods')
            .select('*')
            .order('date', { ascending: false })
            .limit(1)
            .single();

        if (!error && data) {
            setCurrentWod(data as unknown as WOD);
        }
    };

    const fetchResults = async () => {
        if (!currentWod) return;
        const { data, error } = await supabase
            .from('results')
            .select(`
                id,
                result,
                rx,
                profiles (first_name, last_name)
            `)
            .eq('wod_id', currentWod.id)
            .order('rx', { ascending: false });

        if (!error && data) {
            setResults(data as any);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const toggleTimer = () => setIsRunning(!isRunning);
    const resetTimer = () => {
        setIsRunning(false);
        setTime(timerType === 'stopwatch' ? 0 : initialTime);
    };

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                e.preventDefault();
                toggleTimer();
            } else if (e.code === 'KeyR') {
                resetTimer();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isRunning, timerType]);

    return (
        // Force dark mode: this page always runs on dark backgrounds (TV display context)
        <div className="dark">
            <div className="min-h-[100dvh] bg-background text-foreground p-4 md:p-6 flex flex-col gap-6 animate-in fade-in duration-500 overflow-x-hidden">
                {/* Header */}
                <header className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(-1)}
                            className="h-10 w-10 md:h-12 md:w-12 rounded-full"
                        >
                            <ArrowLeft className="h-5 w-5 md:h-6 md:w-6" />
                        </Button>
                        <div className="h-10 w-10 md:h-12 md:w-12 bg-primary rounded-lg flex items-center justify-center">
                            <Monitor className="text-primary-foreground h-6 w-6 md:h-8 md:w-8" />
                        </div>
                        <div>
                            <h1 className="text-xl md:text-2xl font-black italic tracking-tighter uppercase leading-none">
                                BoxApp <span className="text-primary italic">Live</span>
                            </h1>
                            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground">
                                Internal Community Board
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6 self-end md:self-auto">
                        <div className="text-right">
                            <p className="text-3xl md:text-4xl font-black font-mono tracking-tight">
                                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            <p className="text-[10px] md:text-xs text-muted-foreground uppercase font-bold tracking-widest">
                                {currentTime.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => window.location.reload()}
                            className="h-10 w-10"
                        >
                            <RotateCcw className="h-4 w-4" />
                        </Button>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 flex-1 min-h-0">
                    {/* Left Column: Timer & WOD */}
                    <div className="md:col-span-8 flex flex-col gap-6">
                        {/* Timer Section */}
                        <Card className="flex-1 flex flex-col overflow-hidden">
                            <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                                <div className="flex items-center gap-2">
                                    <Timer className="h-6 w-6 text-primary" />
                                    <span className="font-black italic uppercase tracking-wider text-xl">Tactical Timer</span>
                                </div>
                                <div className="flex gap-2">
                                    <Badge
                                        className={`cursor-pointer ${timerType === 'stopwatch' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
                                        onClick={() => { setTimerType('stopwatch'); setTime(0); }}
                                    >
                                        FOR TIME
                                    </Badge>
                                    <Badge
                                        className={`cursor-pointer ${timerType === 'countdown' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
                                        onClick={() => { setTimerType('countdown'); setTime(initialTime); }}
                                    >
                                        AMRAP
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 flex flex-col items-center justify-center p-4 md:p-0 min-h-[300px]">
                                {/* Timer uses inline style for glow so it always tracks the brand primary color */}
                                <div
                                    className={cn(
                                        "text-[8rem] md:text-[18rem] font-black font-mono tracking-tighter tabular-nums leading-none select-none text-primary transition-all duration-500",
                                        isRunning && "animate-pulse scale-105"
                                    )}
                                    style={{
                                        filter: isRunning
                                            ? 'drop-shadow(0 0 80px hsl(var(--primary) / 0.5))'
                                            : 'drop-shadow(0 0 30px hsl(var(--primary) / 0.2))'
                                    }}
                                >
                                    {formatTime(time)}
                                </div>
                                <div className="flex gap-8 mt-4 md:mt-0 mb-8 scale-125 md:scale-150">
                                    <Button
                                        size="lg"
                                        variant={isRunning ? "destructive" : "default"}
                                        onClick={toggleTimer}
                                        className="h-16 w-16 rounded-full shadow-lg"
                                    >
                                        {isRunning ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 ml-1" />}
                                    </Button>
                                    <Button
                                        size="lg"
                                        variant="outline"
                                        onClick={resetTimer}
                                        className="h-16 w-16 rounded-full"
                                    >
                                        <RotateCcw className="h-8 w-8" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* WOD Section */}
                        <Card className="overflow-hidden relative min-h-[300px] md:h-[35%]">
                            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                <Flame className="h-32 md:h-48 w-32 md:w-48" />
                            </div>
                            <CardHeader className="pb-2">
                                <div className="flex items-center gap-2 mb-1">
                                    <Badge className="bg-primary/20 text-primary border-none text-[10px]">PROGRAMMING</Badge>
                                    <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">
                                        {currentWod?.date ? new Date(currentWod.date).toLocaleDateString() : 'TODAY'}
                                    </span>
                                </div>
                                <CardTitle className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter">
                                    {currentWod?.title || 'No WOD Scheduled'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                                    <div className="bg-muted/40 rounded-xl p-4 md:p-6 border border-border overflow-auto max-h-[300px] md:max-h-none">
                                        <pre className="font-mono text-xl md:text-2xl text-foreground whitespace-pre-wrap leading-tight">
                                            {currentWod?.metcon || 'Check back later for programming.'}
                                        </pre>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <p className="text-primary text-xs font-black uppercase tracking-[0.3em] flex items-center gap-2">
                                                <Flame className="h-4 w-4" /> Intended Stimulus
                                            </p>
                                            <p className="text-muted-foreground text-base md:text-lg italic leading-snug">
                                                {currentWod?.stimulus || 'Focus on movement quality and consistency.'}
                                            </p>
                                        </div>
                                        <Separator />
                                        <div className="flex justify-between items-center text-muted-foreground font-bold uppercase tracking-widest text-xs">
                                            <span>Status: Active Session</span>
                                            <span>Capacity: Open</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Leaderboard */}
                    <div className="md:col-span-4 flex flex-col gap-6 min-h-0 pb-6 md:pb-0">
                        <Card className="flex-1 flex flex-col overflow-hidden min-h-[400px]">
                            <CardHeader className="border-b">
                                <div className="flex items-center gap-3">
                                    <Trophy className="h-6 w-6 text-yellow-500" />
                                    <CardTitle className="text-xl font-black italic uppercase">Live Leaderboard</CardTitle>
                                </div>
                                <CardDescription className="text-[10px] font-bold uppercase tracking-widest">
                                    Real-time Athlete Tracking
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-0 overflow-auto scrollbar-hide flex-1">
                                <div className="divide-y divide-border">
                                    {results.length === 0 ? (
                                        <div className="py-20 text-center flex flex-col items-center gap-4 text-muted-foreground">
                                            <Trophy className="h-12 w-12 opacity-20" />
                                            <p className="text-sm font-bold uppercase tracking-[0.2em]">Board is awaiting results</p>
                                        </div>
                                    ) : (
                                        results.map((res, i) => (
                                            <div
                                                key={res.id}
                                                className="flex items-center justify-between p-4 md:p-6 hover:bg-muted/30 transition-colors animate-in slide-in-from-right duration-500"
                                                style={{ animationDelay: `${i * 100}ms` }}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 bg-muted rounded-md flex items-center justify-center font-black text-xl italic text-muted-foreground">
                                                        {i + 1}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-lg md:text-xl font-black italic uppercase tracking-tight">
                                                            {res.profiles.first_name?.[0]}. {res.profiles.last_name}
                                                        </span>
                                                        <Badge
                                                            variant={res.rx ? "default" : "outline"}
                                                            className={`w-fit py-0 text-[9px] font-black uppercase ${res.rx ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30' : 'text-muted-foreground border-border'}`}
                                                        >
                                                            {res.rx ? "RX" : "SCALED"}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <div className="text-3xl md:text-4xl font-black font-mono tracking-tighter text-primary italic">
                                                    {res.result}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <div className="grid grid-cols-2 gap-4 h-[100px] md:h-[120px]">
                            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex flex-col justify-between">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Logged Results</span>
                                <span className="text-4xl md:text-5xl font-black italic text-foreground">{results.length}</span>
                            </div>
                            <div className="bg-card border border-border rounded-xl p-4 flex flex-col justify-between">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">RX Rate</span>
                                <span className="text-4xl md:text-5xl font-black italic text-foreground">
                                    {results.length > 0 ? Math.round((results.filter(r => r.rx).length / results.length) * 100) : 0}%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <footer className="mt-4 flex flex-col md:flex-row items-center justify-between text-muted-foreground text-[10px] font-bold uppercase tracking-widest border-t border-border pt-6 gap-2">
                    <div className="flex items-center gap-6">
                        <span className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-green-500" />
                            System Status: Online
                        </span>
                        <span>Server: US-WEST-2</span>
                    </div>
                    <div>Press [F11] for Fullscreen Optimization</div>
                </footer>
            </div>
        </div>
    );
};
