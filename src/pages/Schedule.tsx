import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    Calendar as CalendarIcon,
    Plus,
    ChevronLeft,
    ChevronRight,
    Users as UsersIcon,
    Info,
    Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Session {
    id: string;
    title: string;
    start_time: string;
    end_time: string;
    type_id: string;
    coach_id: string;
    capacity: number;
    location_id: string;
    session_types: {
        name: string;
        color: string;
    };
    coaches?: {
        first_name: string;
        last_name: string;
    };
}

export const Schedule: React.FC = () => {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewDate, setViewDate] = useState(new Date());
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isFeedbackOpen, setIsFeedbackOpen] = useState<string | null>(null);
    const [feedback, setFeedback] = useState({ effort: 5, fatigue: 3, satisfaction: '😀', note: '' });

    useEffect(() => {
        fetchSessions();
    }, [viewDate]);

    const fetchSessions = async () => {
        setLoading(true);
        const start = new Date(viewDate);
        start.setHours(0, 0, 0, 0);
        start.setDate(start.getDate() - start.getDay());

        const end = new Date(start);
        end.setDate(end.getDate() + 7);

        const { data, error } = await supabase
            .from('sessions')
            .select(`
                *,
                session_types (name, color)
            `)
            .gte('start_time', start.toISOString())
            .lt('start_time', end.toISOString())
            .order('start_time', { ascending: true });

        if (!error && data) setSessions(data);
        setLoading(false);
    };

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const getDatesOfWeek = () => {
        const start = new Date(viewDate);
        start.setDate(start.getDate() - start.getDay());
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(start);
            d.setDate(d.getDate() + i);
            return d;
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Schedule</h1>
                    <p className="text-muted-foreground text-sm">Dynamic class programming and athlete bookings.</p>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex items-center bg-muted rounded-md p-1">
                        <Button variant="ghost" size="icon" onClick={() => {
                            const d = new Date(viewDate);
                            d.setDate(d.getDate() - 7);
                            setViewDate(d);
                        }}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="px-4 text-sm font-medium">
                            {getDatesOfWeek()[0].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} -
                            {getDatesOfWeek()[6].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                        <Button variant="ghost" size="icon" onClick={() => {
                            const d = new Date(viewDate);
                            d.setDate(d.getDate() + 7);
                            setViewDate(d);
                        }}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>

                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <Plus className="h-4 w-4" /> Program Session
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Program New Session</DialogTitle>
                            </DialogHeader>
                            <div className="py-4 space-y-4">
                                <p className="text-sm text-muted-foreground italic flex items-center gap-2">
                                    <Info className="h-4 w-4" /> Interface for creating recurring classes coming soon.
                                </p>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                                <Button disabled>Create Session</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                {getDatesOfWeek().map((date, i) => {
                    const isToday = date.toDateString() === new Date().toDateString();
                    const daySessions = sessions.filter(s => new Date(s.start_time).toDateString() === date.toDateString());

                    return (
                        <Card key={i} className={cn("border-muted", isToday && "border-primary shadow-lg ring-1 ring-primary/20")}>
                            <CardHeader className="p-3 text-center border-b bg-muted/30">
                                <p className="text-[10px] uppercase font-bold text-muted-foreground">{weekDays[i]}</p>
                                <p className={cn("text-lg font-black tracking-tighter", isToday && "text-primary")}>
                                    {date.getDate()}
                                </p>
                            </CardHeader>
                            <CardContent className="p-2 space-y-2 min-h-[300px]">
                                {loading ? (
                                    <div className="animate-pulse space-y-2">
                                        <div className="h-10 bg-muted rounded-md" />
                                        <div className="h-10 bg-muted rounded-md" />
                                    </div>
                                ) : (
                                    <>
                                        {daySessions.map((session) => (
                                            <div
                                                key={session.id}
                                                className="group p-2 rounded-lg border bg-card hover:bg-muted/50 transition-all cursor-pointer relative overflow-hidden"
                                                style={{ borderLeftColor: session.session_types.color, borderLeftWidth: '4px' }}
                                            >
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                                                        {new Date(session.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    <Badge variant="outline" className="text-[8px] h-4 px-1 uppercase font-bold opacity-70">
                                                        {session.session_types.name}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs font-bold truncate leading-none mb-1">{session.title || session.session_types.name}</p>
                                                <div className="flex items-center justify-between mt-1">
                                                    <div className="flex items-center gap-1 text-muted-foreground">
                                                        <UsersIcon className="h-2.5 w-2.5" />
                                                        <span className="text-[9px]">0/{session.capacity}</span>
                                                    </div>

                                                    {session.type_id === 'functional' && new Date(session.start_time) < new Date() && (
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-5 w-5 rounded-full hover:text-yellow-500"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setIsFeedbackOpen(session.id);
                                                            }}
                                                        >
                                                            <Star className="h-3 w-3 fill-current" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        {daySessions.length === 0 && (
                                            <div className="h-full flex flex-col items-center justify-center opacity-20 py-8">
                                                <CalendarIcon className="h-8 w-8 mb-2" />
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-center">Empty Day</p>
                                            </div>
                                        )}
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <Dialog open={!!isFeedbackOpen} onOpenChange={(open) => !open && setIsFeedbackOpen(null)}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Session Feedback</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">How hard was the effort? (1-10)</label>
                            <input
                                type="range" min="1" max="10"
                                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                                value={feedback.effort}
                                onChange={(e) => setFeedback({ ...feedback, effort: Number(e.target.value) })}
                            />
                            <div className="flex justify-between text-[10px] text-muted-foreground uppercase font-bold">
                                <span>Easy</span>
                                <span>Scale of RPE: {feedback.effort}</span>
                                <span>Max</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Satisfaction</label>
                            <div className="flex justify-around bg-muted/30 p-2 rounded-md">
                                {['😀', '😐', '😔'].map(emo => (
                                    <button
                                        key={emo}
                                        className={cn("text-2xl grayscale hover:grayscale-0 transition-all", feedback.satisfaction === emo && "grayscale-0 scale-125")}
                                        onClick={() => setFeedback({ ...feedback, satisfaction: emo })}
                                    >
                                        {emo}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Note to Coach (Private)</label>
                            <Input
                                placeholder="Any pain or special feeling?"
                                className="text-xs"
                                value={feedback.note}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFeedback({ ...feedback, note: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            className="w-full"
                            onClick={async () => {
                                const { data: { user } } = await supabase.auth.getUser();
                                if (!user) return;

                                const { error } = await supabase
                                    .from('functional_feedback')
                                    .insert([{
                                        session_id: isFeedbackOpen,
                                        athlete_id: user.id,
                                        effort_score: feedback.effort,
                                        fatigue_level: feedback.fatigue,
                                        satisfaction: feedback.satisfaction,
                                        coach_private_note: feedback.note
                                    }]);

                                if (!error) {
                                    setIsFeedbackOpen(null);
                                    alert("Success! Your feedback helps us improve.");
                                }
                            }}
                        >
                            Save Wellness Data
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
