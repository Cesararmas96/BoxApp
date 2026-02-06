import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    Calendar as CalendarIcon,
    Plus,
    ChevronLeft,
    ChevronRight,
    Trophy,
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
import { useLanguage, useNotification } from '@/hooks';
import { Toast } from '@/components/ui/toast-custom';
import { useAuth } from '@/contexts/AuthContext';

interface WODSummary {
    id: string;
    title: string | null;
    date: string | null;
    track: string | null;
    metcon: string | null;
    structure?: any[] | null;
}

export const Schedule: React.FC = () => {
    const { t } = useLanguage();
    const { user, currentBox } = useAuth();
    const [sessions, setSessions] = useState<any[]>([]);
    const [wods, setWods] = useState<WODSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewDate, setViewDate] = useState(new Date());
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isFeedbackOpen, setIsFeedbackOpen] = useState<string | null>(null);
    const [selectedWod, setSelectedWod] = useState<WODSummary | null>(null);
    const [feedback, setFeedback] = useState({ effort: 5, fatigue: 3, satisfaction: '😀', note: '' });
    const { notification, showNotification, hideNotification } = useNotification();

    useEffect(() => {
        fetchData();
    }, [viewDate]);

    const fetchData = async () => {
        setLoading(true);
        await Promise.all([fetchSessions(), fetchWods()]);
        setLoading(false);
    };

    const fetchSessions = async () => {
        if (!currentBox?.id) return;
        const start = new Date(viewDate);
        start.setDate(start.getDate() - start.getDay());
        const end = new Date(start);
        end.setDate(end.getDate() + 7);

        const { data, error } = await supabase
            .from('sessions')
            .select(`
                *,
                session_types (name, color),
                profiles:coach_id (first_name, last_name)
            `)
            .eq('box_id', currentBox.id)
            .gte('start_time', start.toISOString())
            .lt('start_time', end.toISOString())
            .order('start_time', { ascending: true });

        if (!error && data) {
            setSessions(data);
        }
    };

    const fetchWods = async () => {
        if (!currentBox?.id) return;
        const start = new Date(viewDate);
        start.setDate(start.getDate() - start.getDay());
        const end = new Date(start);
        end.setDate(end.getDate() + 7);

        const { data, error } = await supabase
            .from('wods')
            .select('*')
            .eq('box_id', currentBox.id)
            .gte('date', start.toISOString())
            .lt('date', end.toISOString());

        if (!error && data) {
            setWods(data as any);
        }
    };

    const getDatesOfWeek = () => {
        const start = new Date(viewDate);
        start.setDate(start.getDate() - start.getDay());
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(start);
            d.setDate(d.getDate() + i);
            return d;
        });
    };

    const weekDays = [
        t('common.sun', { defaultValue: 'SUN' }),
        t('common.mon', { defaultValue: 'MON' }),
        t('common.tue', { defaultValue: 'TUE' }),
        t('common.wed', { defaultValue: 'WED' }),
        t('common.thu', { defaultValue: 'THU' }),
        t('common.fri', { defaultValue: 'FRI' }),
        t('common.sat', { defaultValue: 'SAT' })
    ];

    const getMatchedWod = (session: any, date: Date) => {
        const localDateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        return wods.find(w => {
            if (!w.date || !w.track) return false;
            const wodDateStr = w.date.split('T')[0];
            const sessionTypeName = session.session_types?.name?.toLowerCase() || '';
            const trackName = w.track.toLowerCase();

            return wodDateStr === localDateStr && (
                sessionTypeName.includes(trackName) ||
                (trackName === 'crossfit' && (sessionTypeName.includes('functional') || sessionTypeName.includes('wods')))
            );
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('schedule.title')}</h1>
                    <p className="text-muted-foreground text-sm">{t('schedule.subtitle')}</p>
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
                                <Plus className="h-4 w-4" /> {t('schedule.program_btn')}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[700px] rounded-3xl border-white/10 glass">
                            <DialogHeader>
                                <DialogTitle className="text-3xl font-black italic uppercase tracking-tight text-primary">
                                    {t('schedule.programming_viewer', { defaultValue: 'PROGRAMMING VIEWER' })}
                                </DialogTitle>
                                <DialogDescription className="sr-only">
                                    Display of programmed workouts for the different tracks today
                                </DialogDescription>
                            </DialogHeader>
                            <div className="py-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                {['CrossFit', 'Novice', 'Bodybuilding', 'Engine'].map(track => {
                                    const date = new Date();
                                    const localDateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                                    const trackWod = wods.find(w => w.track === track && w.date?.split('T')[0] === localDateStr);

                                    return (
                                        <Card key={track} className="bg-white/5 border-white/5 overflow-hidden">
                                            <CardHeader className="p-4 border-b border-white/5 flex flex-row items-center justify-between">
                                                <Badge className="font-black italic uppercase tracking-widest">{track}</Badge>
                                                {trackWod && <Badge variant="outline" className="text-[8px] opacity-60">ACTIVE</Badge>}
                                            </CardHeader>
                                            <CardContent className="p-4 min-h-[100px] flex flex-col justify-center">
                                                {trackWod ? (
                                                    <div className="space-y-2">
                                                        <p className="text-xs font-black uppercase text-white/90">{trackWod.title}</p>
                                                        <Button
                                                            variant="link"
                                                            className="p-0 h-auto text-[10px] text-primary font-bold uppercase tracking-widest"
                                                            onClick={() => setSelectedWod(trackWod)}
                                                        >
                                                            View Details →
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <p className="text-[10px] text-muted-foreground uppercase font-bold italic opacity-40">No programming found for today</p>
                                                )}
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                            <DialogFooter>
                                <Button variant="outline" className="rounded-xl border-white/10" onClick={() => setIsCreateOpen(false)}>{t('common.close', { defaultValue: 'CLOSE' })}</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-7 gap-6">
                {getDatesOfWeek().map((date, i) => {
                    const isToday = date.toDateString() === new Date().toDateString();
                    const daySessions = sessions.filter(s => new Date(s.start_time).toDateString() === date.toDateString());

                    return (
                        <Card key={i} className={cn(
                            "glass overflow-hidden transition-all duration-500 border-white/5",
                            isToday ? "border-primary/50 shadow-2xl shadow-primary/10 ring-1 ring-primary/20 scale-[1.02] z-10" : "opacity-90 hover:opacity-100 hover:scale-[1.01]"
                        )}>
                            <CardHeader className={cn(
                                "p-4 text-center border-b border-white/5",
                                isToday ? "bg-primary/10" : "bg-zinc-950/20"
                            )}>
                                <p className="text-[10px] uppercase font-black tracking-[0.3em] text-muted-foreground/60 italic">{weekDays[i]}</p>
                                <p className={cn(
                                    "text-2xl font-black italic tracking-tighter mt-1",
                                    isToday ? "text-primary text-glow" : "text-white"
                                )}>
                                    {date.getDate()}
                                </p>
                            </CardHeader>
                            <CardContent className="p-3 space-y-4 min-h-[400px]">
                                {loading ? (
                                    <div className="animate-pulse space-y-3">
                                        <div className="h-20 bg-white/5 rounded-2xl" />
                                        <div className="h-20 bg-white/5 rounded-2xl" />
                                    </div>
                                ) : (
                                    <>
                                        {daySessions.map((session) => (
                                            <div
                                                key={session.id}
                                                className="group p-3 rounded-2xl border border-white/5 bg-zinc-950/40 hover:bg-zinc-900/60 hover:border-primary/30 transition-all cursor-pointer relative overflow-hidden active:scale-[0.98]"
                                                onClick={() => {
                                                    // Potential session details action
                                                }}
                                            >
                                                <div className="absolute top-0 left-0 bottom-0 w-1" style={{ backgroundColor: session.session_types.color }} />

                                                <div className="flex justify-between items-center mb-3">
                                                    <span className="text-[10px] font-black italic tracking-widest text-primary/80 uppercase">
                                                        {new Date(session.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    <Badge variant="glow" className="text-[8px] h-4 px-2 tracking-widest leading-none bg-primary/20">
                                                        {session.session_types.name}
                                                    </Badge>
                                                </div>

                                                <p className="text-sm font-black italic uppercase tracking-tight text-white/90 mb-2 leading-none group-hover:text-primary transition-colors">
                                                    {session.title || session.session_types.name}
                                                </p>

                                                {/* WOD Integration */}
                                                {(() => {
                                                    const matchedWod = getMatchedWod(session, date);

                                                    if (matchedWod) {
                                                        return (
                                                            <div
                                                                className="mt-3 p-2.5 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-all shadow-inner group/wod relative overflow-hidden"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedWod(matchedWod);
                                                                }}
                                                            >
                                                                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover/wod:opacity-100 transition-opacity" />
                                                                <div className="flex items-center gap-2 text-[9px] font-black text-primary uppercase italic mb-1 tracking-tighter">
                                                                    <div className="p-1 bg-primary rounded-md">
                                                                        <Trophy className="h-2.5 w-2.5 text-white" />
                                                                    </div>
                                                                    WOD Programmed
                                                                </div>
                                                                <p className="text-[10px] font-bold uppercase truncate leading-tight text-white/70">{matchedWod.title}</p>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                })()}

                                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                                                    <div className="flex items-center gap-1.5 text-muted-foreground/60">
                                                        <Users className="h-3 w-3" />
                                                        <span className="text-[10px] font-bold uppercase tracking-widest">0 / {session.capacity}</span>
                                                    </div>

                                                    {session.type_id === 'functional' && new Date(session.start_time) < new Date() && (
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-6 w-6 rounded-full hover:bg-yellow-500/20 hover:text-yellow-500"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setIsFeedbackOpen(session.id);
                                                            }}
                                                        >
                                                            <Star className="h-3.5 w-3.5 fill-current" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        {daySessions.length === 0 && (
                                            <div className="flex-1 flex flex-col items-center justify-center opacity-10 py-12">
                                                <CalendarIcon className="h-10 w-10 mb-3" />
                                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-center">{t('schedule.empty_day')}</p>
                                            </div>
                                        )}
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <Dialog open={!!selectedWod} onOpenChange={(open) => !open && setSelectedWod(null)}>
                <DialogContent className="sm:max-w-[500px] border-primary/20 shadow-2xl">
                    <DialogHeader>
                        <div className="flex items-center gap-2 mb-2">
                            <Badge className="bg-primary text-white text-[9px] font-black uppercase italic">
                                {selectedWod?.track} {t('schedule.track_suffix')}
                            </Badge>
                            <Badge variant="outline" className="text-[9px] font-black opacity-60">
                                {selectedWod?.date && new Date(selectedWod.date).toLocaleDateString()}
                            </Badge>
                        </div>
                        <DialogTitle className="text-2xl font-black uppercase italic tracking-tight text-primary">
                            {selectedWod?.title}
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                            {t('schedule.workout_details_desc') || 'Workout details view'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-4 py-4">
                        {selectedWod?.structure && selectedWod.structure.length > 0 ? (
                            <div className="space-y-4">
                                {selectedWod.structure.map((block: any) => (
                                    <div key={block.id} className="p-3 rounded-xl bg-muted/30 border border-muted-foreground/10">
                                        <p className="text-[10px] font-black uppercase text-primary mb-2 italic tracking-widest">{block.title}</p>
                                        <div className="space-y-2">
                                            {block.items.map((item: any) => (
                                                <div key={item.id} className="flex justify-between items-start gap-2">
                                                    <div className="flex-1">
                                                        <p className="text-xs font-bold uppercase leading-none">{item.movementName}</p>
                                                        {item.notes && <p className="text-[8px] text-muted-foreground uppercase opacity-70 mt-0.5">{item.notes}</p>}
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[10px] font-black italic text-primary/80">
                                                            {item.sets && `${item.sets} x `}{item.reps} {item.weight && `@ ${item.weight}`}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-4 rounded-xl bg-muted/40 font-mono text-sm whitespace-pre-wrap">
                                {selectedWod?.metcon}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={!!isFeedbackOpen} onOpenChange={(open) => !open && setIsFeedbackOpen(null)}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>{t('schedule.feedback_title')}</DialogTitle>
                        <DialogDescription className="sr-only">
                            {t('schedule.feedback_title')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t('schedule.effort_label')}</label>
                            <input
                                type="range" min="1" max="10"
                                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                                value={feedback.effort}
                                onChange={(e) => setFeedback({ ...feedback, effort: Number(e.target.value) })}
                            />
                            <div className="flex justify-between text-[10px] text-muted-foreground uppercase font-bold">
                                <span>{t('schedule.effort_easy')}</span>
                                <span>{t('schedule.rpe_scale', { value: feedback.effort })}</span>
                                <span>{t('schedule.effort_max')}</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t('schedule.satisfaction')}</label>
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
                            <label className="text-sm font-medium">{t('schedule.note_to_coach')}</label>
                            <Input
                                placeholder={t('schedule.note_placeholder')}
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
                                    showNotification('success', t('schedule.feedback_success').toUpperCase());
                                } else {
                                    showNotification('error', 'ERROR SAVING FEEDBACK: ' + error.message.toUpperCase());
                                }
                            }}
                        >
                            {t('schedule.save_wellness')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {notification && (
                <Toast
                    type={notification.type}
                    message={notification.message}
                    onClose={hideNotification}
                />
            )}
        </div>
    );
};
