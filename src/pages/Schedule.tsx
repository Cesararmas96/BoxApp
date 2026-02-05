import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    Calendar as CalendarIcon,
    Plus,
    ChevronLeft,
    ChevronRight,
    Users as UsersIcon,
    Info,
    Star,
    Dumbbell,
    Trophy
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
import { useTranslation } from 'react-i18next';
import { useNotification } from '@/hooks/useNotification';
import { Toast } from '@/components/ui/toast-custom';
import { useAuth } from '@/contexts/AuthContext';

interface WODSummary {
    id: string;
    title: string;
    date: string;
    track: string;
    metcon: string;
    structure?: any[];
}

export const Schedule: React.FC = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
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

    const fetchWods = async () => {
        const start = new Date(viewDate);
        start.setHours(0, 0, 0, 0);
        start.setDate(start.getDate() - start.getDay());

        const end = new Date(start);
        end.setDate(end.getDate() + 7);

        const { data } = await supabase
            .from('wods')
            .select('*')
            .gte('date', start.toISOString())
            .lt('date', end.toISOString());

        if (data) setWods(data);
    };

    const fetchSessions = async () => {
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
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{t('schedule.new_title')}</DialogTitle>
                            </DialogHeader>
                            <div className="py-4 space-y-4">
                                <p className="text-sm text-muted-foreground italic flex items-center gap-2">
                                    <Info className="h-4 w-4" /> {t('schedule.coming_soon')}
                                </p>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>{t('common.cancel')}</Button>
                                <Button disabled>{t('schedule.create_btn')}</Button>
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

                                                {/* WOD Integration */}
                                                {(() => {
                                                    const localDateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                                                    const matchedWod = wods.find(w => {
                                                        const wodDateStr = w.date.split('T')[0];
                                                        return wodDateStr === localDateStr &&
                                                            (session.session_types.name.toLowerCase().includes(w.track.toLowerCase()) ||
                                                                (w.track === 'CrossFit' && session.session_types.name.toLowerCase().includes('functional')));
                                                    });

                                                    if (matchedWod) {
                                                        return (
                                                            <div
                                                                className="mt-2 p-1.5 rounded bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-colors"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedWod(matchedWod);
                                                                }}
                                                            >
                                                                <div className="flex items-center gap-1 text-[8px] font-black text-primary uppercase italic mb-0.5">
                                                                    <Trophy className="h-2 w-2" /> {t('schedule.programmed_wod')}
                                                                </div>
                                                                <p className="text-[9px] font-bold uppercase truncate leading-tight opacity-80">{matchedWod.title}</p>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                })()}

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
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-center">{t('schedule.empty_day')}</p>
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
                                {selectedWod && new Date(selectedWod.date).toLocaleDateString()}
                            </Badge>
                        </div>
                        <DialogTitle className="text-2xl font-black uppercase italic tracking-tight text-primary">
                            {selectedWod?.title}
                        </DialogTitle>
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
