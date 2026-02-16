import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    Calendar as CalendarIcon,
    Plus,
    ChevronLeft,
    ChevronRight,
    Trophy,
    RefreshCw,
    Users,
    Trash2,
    MessageSquare,
    Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
    ResponsiveDialog as Dialog,
    ResponsiveDialogContent as DialogContent,
    ResponsiveDialogHeader as DialogHeader,
    ResponsiveDialogTitle as DialogTitle,
    ResponsiveDialogDescription as DialogDescription,
    ResponsiveDialogTrigger as DialogTrigger,
    ResponsiveDialogFooter as DialogFooter
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
    stimulus?: string | null;
    scaling_options?: string | null;
    scaling_beginner?: string | null;
    scaling_intermediate?: string | null;
    scaling_advanced?: string | null;
    modalities?: string[] | null;
    structure?: any[] | null;
}

export const Schedule: React.FC = () => {
    const { t } = useLanguage();
    const { user, currentBox, isAthlete } = useAuth();
    const [sessions, setSessions] = useState<any[]>([]);
    const [wods, setWods] = useState<WODSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewDate, setViewDate] = useState(new Date());
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isFeedbackOpen, setIsFeedbackOpen] = useState<string | null>(null);
    const [selectedWod, setSelectedWod] = useState<WODSummary | null>(null);
    const [selectedSession, setSelectedSession] = useState<any | null>(null);
    const [selectedViewerDate, setSelectedViewerDate] = useState<Date>(new Date());
    const [feedback, setFeedback] = useState({ effort: 5, fatigue: 3, satisfaction: '😀', note: '' });
    const [isAssigningWod, setIsAssigningWod] = useState<{ track: string, date: Date } | null>(null);
    const [recentWods, setRecentWods] = useState<WODSummary[]>([]);
    const [isUnlinkingWod, setIsUnlinkingWod] = useState<string | null>(null);
    const [selectedDayIndex, setSelectedDayIndex] = useState<number>(() => {
        const today = new Date();
        const day = today.getDay();
        return day === 0 ? 5 : Math.min(day - 1, 5);
    });
    const dayScrollRef = useRef<HTMLDivElement>(null);
    const { notification, showNotification, hideNotification } = useNotification();

    useEffect(() => {
        if (currentBox?.id) {
            fetchData();
        }
    }, [viewDate, currentBox?.id]);

    // Keep selected day pill visible on small screens
    useEffect(() => {
        const el = dayScrollRef.current;
        if (!el) return;
        const btn = el.querySelector<HTMLButtonElement>(`button[data-day-index="${selectedDayIndex}"]`);
        btn?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }, [selectedDayIndex]);

    // Sync mobile day selector when navigating weeks
    useEffect(() => {
        const today = new Date();
        const start = new Date(viewDate);
        const day = start.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        start.setDate(start.getDate() + diff);
        start.setHours(0, 0, 0, 0);
        const dates = Array.from({ length: 6 }, (_, i) => {
            const d = new Date(start);
            d.setDate(d.getDate() + i);
            return d;
        });
        const todayIdx = dates.findIndex(d => d.toDateString() === today.toDateString());
        setSelectedDayIndex(todayIdx >= 0 ? todayIdx : 0);
    }, [viewDate]);

    const formatDateForQuery = (date: Date) => {
        return date.toISOString().split('T')[0];
    };

    const fetchData = async () => {
        setLoading(true);
        await Promise.all([fetchSessions(), fetchWods()]);
        setLoading(false);
    };

    const fetchSessions = async () => {
        if (!currentBox?.id) return;
        const dates = getDatesOfWeek();
        const start = dates[0];
        const end = new Date(dates[5]);
        end.setDate(end.getDate() + 1); // Up to Sunday morning

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
        const dates = getDatesOfWeek();
        const start = dates[0];
        const end = new Date(dates[5]);
        end.setDate(end.getDate() + 1); // Up to Sunday morning

        const { data, error } = await supabase
            .from('wods')
            .select('*')
            .eq('box_id', currentBox.id)
            .gte('date', formatDateForQuery(start))
            .lt('date', formatDateForQuery(end));

        if (!error && data) {
            setWods(data as any);
        }
    };

    const fetchRecentWods = async () => {
        if (!currentBox?.id) return;
        const { data, error } = await supabase
            .from('wods')
            .select('*')
            .eq('box_id', currentBox.id)
            .order('created_at', { ascending: false })
            .limit(10);

        if (!error && data) {
            setRecentWods(data as any);
        }
    };

    const handleUnlinkWod = async (wodId: string) => {
        const { error } = await supabase
            .from('wods')
            .update({ date: undefined, track: undefined } as any)
            .eq('id', wodId);

        if (!error) {
            showNotification('success', 'PROGRAMMING UNLINKED');
            fetchWods();
            setIsUnlinkingWod(null);
        } else {
            showNotification('error', 'FAILED TO UNLINK: ' + error.message);
        }
    };

    const getDatesOfWeek = () => {
        const start = new Date(viewDate);
        const day = start.getDay();
        // Adjust to Monday: If Sunday (0), go back 6 days. Otherwise go back (day - 1) days.
        const diff = day === 0 ? -6 : 1 - day;
        start.setDate(start.getDate() + diff);
        start.setHours(0, 0, 0, 0);

        return Array.from({ length: 6 }, (_, i) => { // length 6 for Mon-Sat
            const d = new Date(start);
            d.setDate(d.getDate() + i);
            return d;
        });
    };

    const weekDays = [
        t('common.mon', { defaultValue: 'MON' }),
        t('common.tue', { defaultValue: 'TUE' }),
        t('common.wed', { defaultValue: 'WED' }),
        t('common.thu', { defaultValue: 'THU' }),
        t('common.fri', { defaultValue: 'FRI' }),
        t('common.sat', { defaultValue: 'SAT' })
    ];

    const getMatchedWod = (session: any, date: Date) => {
        if (!session || !date || isNaN(date.getTime())) return null;
        const localDateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        return wods.find(w => {
            if (!w.date || !w.track) return false;
            const wodDateStr = w.date.split('T')[0];
            const sessionTypeName = (session.session_types?.name || '').toLowerCase();
            const trackName = w.track.toLowerCase();

            return wodDateStr === localDateStr && (
                sessionTypeName.includes(trackName) ||
                (trackName === 'crossfit' && (sessionTypeName.includes('functional') || sessionTypeName.includes('wods')))
            );
        });
    };

    return (
        <div className="space-y-4 md:space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t('schedule.title')}</h1>
                    <p className="text-muted-foreground text-xs sm:text-sm">{t('schedule.subtitle')}</p>
                </div>

                <div className="flex flex-col gap-2 w-full md:w-auto md:flex-row md:items-center">
                    <div className="flex items-center bg-muted rounded-md p-1 w-full md:w-auto">
                        <Button variant="ghost" size="icon" className="h-10 w-10 md:h-9 md:w-9" onClick={() => {
                            const d = new Date(viewDate);
                            d.setDate(d.getDate() - 7);
                            setViewDate(d);
                        }}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="flex-1 px-2 md:px-4 text-xs md:text-sm font-medium text-center whitespace-nowrap">
                            {getDatesOfWeek()[0].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} -
                            {getDatesOfWeek()[5].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                        <Button variant="ghost" size="icon" className="h-10 w-10 md:h-9 md:w-9" onClick={() => {
                            const d = new Date(viewDate);
                            d.setDate(d.getDate() + 7);
                            setViewDate(d);
                        }}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 w-full md:w-auto md:flex md:items-center">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-10 md:h-8 w-full px-3 text-[10px] font-black uppercase tracking-widest border-primary/20 text-primary hover:bg-primary/10"
                            onClick={() => setViewDate(new Date())}
                        >
                            <Zap className="h-3 w-3 mr-1" />
                            {t('schedule.today', { defaultValue: 'Today' })}
                        </Button>

                        <Dialog open={isCreateOpen} onOpenChange={(open) => {
                            setIsCreateOpen(open);
                            if (open) setSelectedViewerDate(new Date());
                        }}>
                            <DialogTrigger asChild>
                                <Button className="gap-2 h-10 md:h-9 w-full md:w-auto">
                                    <Plus className="h-4 w-4" /> {t('schedule.program_btn')}
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[700px] rounded-3xl border-border bg-card backdrop-blur-2xl shadow-2xl p-4 sm:p-6">
                                <DialogHeader className="mb-6">
                                    <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter text-foreground">
                                        {t('schedule.programming_viewer', { defaultValue: 'PROGRAMMING VIEWER' })}
                                    </DialogTitle>
                                    <DialogDescription className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mt-1">
                                        Manage and assign WODs to specific tracks
                                    </DialogDescription>
                                </DialogHeader>

                            {/* Day Selector within Modal - Enhanced touch targets */}
                            <div className="flex items-center justify-between bg-muted p-1.5 rounded-2xl border border-border mb-8 shadow-inner gap-1">
                                {getDatesOfWeek().map((date, i) => {
                                    const isSelected = selectedViewerDate.toDateString() === date.toDateString();
                                    const isToday = date.toDateString() === new Date().toDateString();
                                    const localDateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                                    const hasWod = wods.some(w => w.date?.split('T')[0] === localDateStr);
                                    return (
                                        <button
                                            key={i}
                                            onClick={() => setSelectedViewerDate(date)}
                                            className={cn(
                                                "flex-1 min-h-[52px] min-w-[44px] py-2.5 rounded-xl transition-all duration-300 flex flex-col items-center justify-center gap-1 relative overflow-hidden",
                                                isSelected
                                                    ? "bg-primary text-foreground shadow-lg shadow-primary/30 scale-105 z-10"
                                                    : isToday
                                                        ? "bg-primary/10 text-primary"
                                                        : "hover:bg-muted text-muted-foreground hover:text-foreground/80"
                                            )}
                                        >
                                            {isSelected && (
                                                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
                                            )}
                                            <span className="text-[9px] font-black uppercase tracking-wider">{weekDays[i]}</span>
                                            <span className="text-base font-black italic tracking-tighter leading-none">{date.getDate()}</span>
                                            {hasWod && !isSelected && (
                                                <div className={cn("w-1 h-1 rounded-full", isToday ? "bg-primary" : "bg-primary/50")} />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {['CrossFit', 'Novice', 'Bodybuilding', 'Engine'].map(track => {
                                    const targetDateStr = `${selectedViewerDate.getFullYear()}-${String(selectedViewerDate.getMonth() + 1).padStart(2, '0')}-${String(selectedViewerDate.getDate()).padStart(2, '0')}`;
                                    const trackWod = wods.find(w =>
                                        w.track?.toLowerCase().trim() === track.toLowerCase().trim() &&
                                        w.date?.split('T')[0] === targetDateStr
                                    );

                                    return (
                                        <Card key={track} className="bg-muted border-border overflow-hidden group hover:border-primary/50 transition-all duration-500 shadow-2xl relative">
                                            <CardHeader className="p-4 border-b border-border flex flex-row items-center justify-between bg-muted">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                                    <span className="font-black italic uppercase tracking-widest text-[10px] text-foreground/80">{track}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {trackWod ? (
                                                        <Badge variant="outline" className="text-[7px] font-black bg-emerald-500/5 text-emerald-400 border-emerald-500/20 px-1.5 py-0 uppercase tracking-widest">ACTIVE</Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-[7px] font-black text-muted-foreground border-border px-1.5 py-0 uppercase tracking-widest italic">Wait</Badge>
                                                    )}
                                                </div>
                                            </CardHeader>
                                            <CardContent className="p-5 min-h-[140px] flex flex-col justify-center">
                                                {trackWod ? (
                                                    <div className="space-y-4">
                                                        <h3 className="text-sm font-black uppercase text-foreground leading-tight line-clamp-2 tracking-tight italic">
                                                            {trackWod.title}
                                                        </h3>
                                                        <div className="flex items-center justify-between pt-2">
                                                            <Button
                                                                variant="link"
                                                                className="p-0 h-auto text-[10px] text-primary font-black uppercase tracking-widest hover:no-underline hover:text-primary/80 transition-colors flex items-center gap-1"
                                                                onClick={() => setSelectedWod(trackWod)}
                                                            >
                                                                View Workout <ChevronRight className="h-3 w-3" />
                                                            </Button>

                                                            <div className="flex items-center gap-2">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 rounded-xl bg-muted/50 hover:bg-primary/20 hover:text-primary text-muted-foreground border border-border transition-all"
                                                                    onClick={() => {
                                                                        fetchRecentWods();
                                                                        setIsAssigningWod({ track, date: selectedViewerDate });
                                                                    }}
                                                                >
                                                                    <RefreshCw className="h-3.5 w-3.5" />
                                                                </Button>

                                                                {isUnlinkingWod === trackWod.id ? (
                                                                    <div className="flex items-center gap-1">
                                                                        <Button
                                                                            variant="destructive"
                                                                            size="sm"
                                                                            className="h-8 px-2 text-[8px] font-black uppercase"
                                                                            onClick={() => handleUnlinkWod(trackWod.id)}
                                                                        >
                                                                            CONFIRM
                                                                        </Button>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-8 w-8 rounded-xl"
                                                                            onClick={() => setIsUnlinkingWod(null)}
                                                                        >
                                                                            <Plus className="h-3 w-3 rotate-45" />
                                                                        </Button>
                                                                    </div>
                                                                ) : (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 rounded-xl bg-muted/50 hover:bg-red-500/20 hover:text-red-500 text-muted-foreground border border-border"
                                                                        onClick={() => setIsUnlinkingWod(trackWod.id)}
                                                                    >
                                                                        <Trash2 className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-center space-y-4">
                                                        <div className="space-y-1 opacity-20">
                                                            <p className="text-[10px] text-muted-foreground uppercase font-black italic tracking-widest">No programming</p>
                                                            <div className="h-px w-8 bg-muted-foreground/30 mx-auto" />
                                                        </div>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 rounded-xl border-dashed border-border text-[9px] font-black uppercase tracking-widest hover:border-primary/50 hover:bg-primary/5 transition-all"
                                                            onClick={() => {
                                                                fetchRecentWods();
                                                                setIsAssigningWod({ track, date: selectedViewerDate });
                                                            }}
                                                        >
                                                            Assign Existing
                                                        </Button>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                            <DialogFooter className="mt-6">
                                <Button variant="outline" className="w-full rounded-2xl border-border h-12 uppercase font-black tracking-widest text-[10px]" onClick={() => setIsCreateOpen(false)}>{t('common.close', { defaultValue: 'CLOSE' })}</Button>
                            </DialogFooter>
                        </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </div>

            {/* Mobile Day Selector Pills */}
            <div className="md:hidden">
                <div
                    ref={dayScrollRef}
                    className="flex items-center bg-muted/30 p-1.5 rounded-2xl border border-border gap-1 overflow-x-auto"
                >
                    {getDatesOfWeek().map((date, i) => {
                        const isToday = date.toDateString() === new Date().toDateString();
                        const isSelected = selectedDayIndex === i;
                        const hasSessions = sessions.some(s => new Date(s.start_time).toDateString() === date.toDateString());
                        const localDateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                        const hasWods = wods.some(w => w.date?.split('T')[0] === localDateStr);

                        return (
                            <button
                                key={i}
                                data-day-index={i}
                                onClick={() => setSelectedDayIndex(i)}
                                className={cn(
                                    "flex-none w-[56px] min-h-[52px] py-2 rounded-xl transition-all duration-300 flex flex-col items-center justify-center gap-0.5 relative active:scale-[0.98]",
                                    isSelected
                                        ? "bg-primary text-foreground shadow-lg shadow-primary/20 scale-[1.05] z-10"
                                        : isToday
                                            ? "bg-primary/10 text-primary"
                                            : "text-muted-foreground hover:bg-muted"
                                )}
                            >
                                <span className="text-[9px] font-black uppercase tracking-wider">{weekDays[i]}</span>
                                <span className="text-base font-black italic tracking-tighter leading-none">{date.getDate()}</span>
                                {(hasSessions || hasWods) && !isSelected && (
                                    <div className={cn(
                                        "w-1 h-1 rounded-full mt-0.5",
                                        isToday ? "bg-primary" : "bg-primary/50"
                                    )} />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 md:gap-6">
                {getDatesOfWeek().map((date, i) => {
                    const isToday = date.toDateString() === new Date().toDateString();
                    const daySessions = sessions.filter(s => new Date(s.start_time).toDateString() === date.toDateString());

                    return (
                        <Card key={i} className={cn(
                            "glass overflow-hidden transition-all duration-500 border-border",
                            isToday ? "border-primary/50 shadow-2xl shadow-primary/10 ring-1 ring-primary/20 md:scale-[1.02] z-10" : "opacity-90 hover:opacity-100 hover:scale-[1.01]",
                            selectedDayIndex === i ? "block" : "hidden md:block"
                        )}>
                            <CardHeader className={cn(
                                "p-4 text-center border-b border-border",
                                isToday ? "bg-primary/10" : "bg-muted"
                            )}>
                                <p className="text-[10px] uppercase font-black tracking-[0.3em] text-muted-foreground/60 italic">{weekDays[i]}</p>
                                <p className={cn(
                                    "text-2xl font-black italic tracking-tighter mt-1",
                                    isToday ? "text-primary" : "text-foreground"
                                )}>
                                    {date.getDate()}
                                </p>
                            </CardHeader>
                            <CardContent className="p-3 space-y-4 min-h-[260px] md:min-h-[300px] flex flex-col">
                                {loading ? (
                                    <div className="animate-pulse space-y-3">
                                        <div className="h-20 bg-muted/50 rounded-2xl" />
                                        <div className="h-20 bg-muted/50 rounded-2xl" />
                                    </div>
                                ) : (
                                    <>
                                        {/* General Day Programming Summary */}
                                        {(() => {
                                            const localDateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                                            const dayWods = wods.filter(w => w.date?.split('T')[0] === localDateStr);

                                            // Store it in a variable for later use in the empty state check
                                            const hasProgramming = dayWods.length > 0;

                                            if (hasProgramming) {
                                                return (
                                                    <div className="mb-4 p-3 rounded-2xl bg-primary/5 border border-primary/10">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <p className="text-[8px] font-black uppercase tracking-widest text-primary italic">Daily Programming</p>
                                                            <Trophy className="h-3 w-3 text-primary/40" />
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            {dayWods.slice(0, 3).map((wod, idx) => (
                                                                <div
                                                                    key={idx}
                                                                    className="flex items-center justify-between group/wodlink cursor-pointer"
                                                                    onClick={() => setSelectedWod(wod)}
                                                                >
                                                                    <div className="flex flex-col">
                                                                        <span className="text-[7px] font-black text-muted-foreground uppercase tracking-tighter group-hover/wodlink:text-primary transition-colors">{wod.track}</span>
                                                                        <span className="text-[10px] font-bold text-foreground truncate italic leading-tight group-hover/wodlink:text-primary transition-colors">{wod.title}</span>
                                                                    </div>
                                                                    <ChevronRight className="h-2.5 w-2.5 text-muted-foreground group-hover/wodlink:text-primary transition-colors" />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })()}

                                        {daySessions.length > 0 && (
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="h-px flex-1 bg-muted/50" />
                                                    <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Sessions</span>
                                                    <span className="h-px flex-1 bg-muted/50" />
                                                </div>
                                                <div className="space-y-3">
                                                    {daySessions.map((session) => (
                                                        <div
                                                            key={session.id}
                                                            className="group p-3 rounded-2xl border border-border bg-muted hover:bg-muted hover:border-primary/30 transition-all cursor-pointer relative overflow-hidden active:scale-[0.98]"
                                                            onClick={() => {
                                                                setSelectedSession(session);
                                                            }}
                                                        >
                                                            <div className="absolute top-0 left-0 bottom-0 w-1" style={{ backgroundColor: session.session_types?.color }} />

                                                            <div className="flex justify-between items-center mb-2">
                                                                <span className="text-[9px] font-black italic tracking-widest text-primary/80 uppercase">
                                                                    {new Date(session.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                                <Badge variant="glow" className="text-[7px] h-3.5 px-1.5 tracking-widest leading-none bg-primary/20">
                                                                    {session.session_types?.name}
                                                                </Badge>
                                                            </div>

                                                            <p className="text-xs font-black italic uppercase tracking-tight text-foreground group-hover:text-primary transition-colors mb-2">
                                                                {session.title || session.session_types?.name}
                                                            </p>

                                                            {/* WOD Integration */}
                                                            {(() => {
                                                                const matchedWod = getMatchedWod(session, date);
                                                                if (matchedWod) {
                                                                    return (
                                                                        <div
                                                                            className="mt-2 p-2 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-all group/swod"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setSelectedWod(matchedWod);
                                                                            }}
                                                                        >
                                                                            <p className="text-[8px] font-black text-primary uppercase italic flex items-center gap-1 mb-0.5">
                                                                                <Trophy className="h-2 w-2" /> Programmed
                                                                            </p>
                                                                            <p className="text-[9px] font-bold text-muted-foreground truncate uppercase">{matchedWod.title}</p>
                                                                        </div>
                                                                    );
                                                                }
                                                                return null;
                                                            })()}

                                                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                                                                <div className="flex items-center gap-1.5 text-muted-foreground/40">
                                                                    <Users className="h-3 w-3" />
                                                                    <span className="text-[9px] font-black uppercase tracking-widest italic truncate max-w-[80px]">
                                                                        {session.profiles ? `${session.profiles.first_name} ${session.profiles.last_name}` : 'Coach'}
                                                                    </span>
                                                                </div>
                                                                {isAthlete && (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="h-6 gap-1 px-2 text-[8px] font-black uppercase tracking-widest text-primary/60 hover:text-primary hover:bg-primary/10 rounded-lg"
                                                                        onClick={(e: React.MouseEvent) => {
                                                                            e.stopPropagation();
                                                                            setIsFeedbackOpen(session.id);
                                                                        }}
                                                                    >
                                                                        <MessageSquare className="h-2.5 w-2.5" />
                                                                        {t('schedule.give_feedback', { defaultValue: 'Feedback' })}
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {(() => {
                                            const localDateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                                            const hasProgramming = wods.some(w => w.date?.split('T')[0] === localDateStr);

                                            if (daySessions.length === 0 && !hasProgramming) {
                                                return (
                                                    <div className="flex-1 flex flex-col items-center justify-center opacity-10 py-8">
                                                        <CalendarIcon className="h-8 w-8 mb-2" />
                                                        <p className="text-[8px] font-black uppercase tracking-[0.2em] text-center">No Activity</p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })()}
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <Dialog open={!!selectedWod} onOpenChange={(open) => !open && setSelectedWod(null)}>
                <DialogContent className="sm:max-w-[600px] border-border glass shadow-2xl p-0 overflow-hidden rounded-3xl">
                    <div className="h-32 bg-primary/20 relative flex items-end p-8 overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <Trophy className="h-32 w-32 rotate-12" />
                        </div>
                        <div className="relative z-10 w-full flex items-center justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Badge className="bg-primary text-foreground text-[9px] font-black uppercase italic tracking-widest">
                                        {selectedWod?.track} TRACK
                                    </Badge>
                                    <Badge variant="outline" className="border-border text-foreground text-[9px] font-black uppercase tracking-tighter bg-muted/50">
                                        {selectedWod?.date && new Date(selectedWod.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                    </Badge>
                                </div>
                                <h2 className="text-3xl font-black uppercase italic tracking-tight text-foreground line-clamp-1">
                                    {selectedWod?.title}
                                </h2>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 max-h-[70vh] overflow-y-auto space-y-8">
                        {/* Metcon / Main Body */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <span className="h-px flex-1 bg-muted/50" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-primary/60 italic">Workout Structure</span>
                                <span className="h-px flex-1 bg-muted/50" />
                            </div>

                            {selectedWod?.structure && selectedWod.structure.length > 0 ? (
                                <div className="space-y-6">
                                    {selectedWod.structure.map((block: any) => (
                                        <div key={block.id} className="p-5 rounded-2xl bg-muted/50 border border-border hover:bg-muted transition-all">
                                            <p className="text-[10px] font-black uppercase text-primary mb-3 italic tracking-[0.2em]">{block.title}</p>
                                            <div className="space-y-3">
                                                {block.items.map((item: any) => (
                                                    <div key={item.id} className="flex justify-between items-start gap-3">
                                                        <div className="flex-1">
                                                            <p className="text-xs font-black uppercase italic leading-none text-foreground">{item.movementName}</p>
                                                            {item.notes && <p className="text-[9px] text-muted-foreground uppercase font-bold mt-1.5 opacity-60 leading-tight">{item.notes}</p>}
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="px-3 py-1 rounded-lg bg-primary/10 border border-primary/20">
                                                                <p className="text-[11px] font-black italic text-primary">
                                                                    {item.sets && `${item.sets} x `}{item.reps} {item.weight && `@ ${item.weight}`}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-6 rounded-3xl bg-muted border border-border font-mono text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap italic">
                                    {selectedWod?.metcon}
                                </div>
                            )}
                        </div>

                        {/* Stimulus & Scaling */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {selectedWod?.stimulus && (
                                <div className="space-y-2">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-primary italic">Target Stimulus</h4>
                                    <p className="text-xs text-muted-foreground uppercase font-bold leading-relaxed">{selectedWod.stimulus}</p>
                                </div>
                            )}
                            {selectedWod?.scaling_options && (
                                <div className="space-y-2">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-primary italic">General Scaling</h4>
                                    <p className="text-xs text-muted-foreground uppercase font-bold leading-relaxed">{selectedWod.scaling_options}</p>
                                </div>
                            )}
                        </div>

                        {/* Detailed Scaling levels */}
                        {(selectedWod?.scaling_beginner || selectedWod?.scaling_intermediate || selectedWod?.scaling_advanced) && (
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-primary italic">Level Specific Scaling</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {selectedWod.scaling_beginner && (
                                        <div className="p-3 rounded-xl bg-green-500/5 border border-green-500/10">
                                            <p className="text-[9px] font-black text-green-500 uppercase mb-1">Beginner</p>
                                            <p className="text-[10px] font-bold text-foreground/70 italic">{selectedWod.scaling_beginner}</p>
                                        </div>
                                    )}
                                    {selectedWod.scaling_intermediate && (
                                        <div className="p-3 rounded-xl bg-orange-500/5 border border-orange-500/10">
                                            <p className="text-[9px] font-black text-orange-500 uppercase mb-1">Intermediate</p>
                                            <p className="text-[10px] font-bold text-foreground/70 italic">{selectedWod.scaling_intermediate}</p>
                                        </div>
                                    )}
                                    {selectedWod.scaling_advanced && (
                                        <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
                                            <p className="text-[9px] font-black text-blue-500 uppercase mb-1">Advanced</p>
                                            <p className="text-[10px] font-bold text-foreground/70 italic">{selectedWod.scaling_advanced}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Modalities */}
                        {selectedWod?.modalities && selectedWod.modalities.length > 0 && (
                            <div className="flex gap-2 flex-wrap">
                                {selectedWod.modalities.map(m => (
                                    <Badge key={m} variant="secondary" className="bg-muted/50 text-[8px] font-black uppercase tracking-widest border border-border px-3 py-1 h-auto active:scale-95 transition-transform cursor-default">
                                        {m}
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Assign WOD Dialog */}
            <Dialog open={!!isAssigningWod} onOpenChange={(open) => !open && setIsAssigningWod(null)}>
                <DialogContent className="sm:max-w-[450px] border-border glass rounded-3xl p-4 sm:p-6">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black uppercase italic tracking-tight text-primary">Assign Programming</DialogTitle>
                        <DialogDescription className="text-[10px] font-bold uppercase opacity-60">
                            Select a previously created WOD for {isAssigningWod?.track} track on {isAssigningWod?.date.toLocaleDateString()}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="mt-6 space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                        {recentWods.length > 0 ? (
                            recentWods.map(wod => (
                                <div
                                    key={wod.id}
                                    className="p-4 rounded-2xl bg-muted/50 border border-border hover:border-primary/50 cursor-pointer transition-all group active:scale-[0.98]"
                                    onClick={async () => {
                                        if (!isAssigningWod || !currentBox?.id) return;
                                        // Update the WOD to the new date and track
                                        const { error } = await supabase
                                            .from('wods')
                                            .update({
                                                date: formatDateForQuery(isAssigningWod.date),
                                                track: isAssigningWod.track
                                            })
                                            .eq('id', wod.id);

                                        if (!error) {
                                            showNotification('success', 'PROGRAMMING ASSIGNED');
                                            fetchWods();
                                            setIsAssigningWod(null);
                                        } else {
                                            showNotification('error', 'FAILED TO ASSIGN: ' + error.message);
                                        }
                                    }}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <Badge className="bg-white/10 text-[8px] font-black uppercase tracking-widest">{wod.track || 'Unassigned'}</Badge>
                                        <span className="text-[8px] font-bold opacity-40 uppercase">{wod.date ? new Date(wod.date).toLocaleDateString() : 'No date'}</span>
                                    </div>
                                    <h4 className="text-xs font-black uppercase italic text-foreground group-hover:text-primary transition-colors">{wod.title}</h4>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12 opacity-20 italic">
                                <p className="text-xs uppercase font-black">No recent WODs found</p>
                            </div>
                        )}
                    </div>
                    <DialogFooter className="mt-6">
                        <Button variant="outline" className="w-full rounded-2xl h-12 uppercase font-black tracking-widest text-[10px]" onClick={() => setIsAssigningWod(null)}>Cancel</Button>
                    </DialogFooter>
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

            {/* Session Details Modal (Members / Attendance) */}
            <Dialog open={!!selectedSession} onOpenChange={(open) => !open && setSelectedSession(null)}>
                <DialogContent className="sm:max-w-[450px] border-border glass max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <div className="flex items-center justify-between mb-2">
                            <Badge variant="glow" style={{ backgroundColor: selectedSession?.session_types?.color }}>
                                {selectedSession?.session_types?.name}
                            </Badge>
                            <span className="text-[10px] font-black italic text-primary/60">
                                {selectedSession && new Date(selectedSession.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                        <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter text-primary">
                            {selectedSession?.title || selectedSession?.session_types?.name}
                        </DialogTitle>
                        <DialogDescription className="text-[10px] font-bold uppercase opacity-60">
                            {t('schedule.session_overview', { defaultValue: 'Session Details & Programming' })}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-6 space-y-8">
                        {/* Coach Info */}
                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/50 border border-border">
                            <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center font-black text-lg text-primary">
                                {selectedSession?.profiles?.first_name?.charAt(0)}{selectedSession?.profiles?.last_name?.charAt(0)}
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Assigned Coach</p>
                                <p className="text-lg font-black uppercase italic leading-none">{selectedSession?.profiles?.first_name} {selectedSession?.profiles?.last_name}</p>
                            </div>
                        </div>

                        {/* WOD Integration in Session Details */}
                        {(() => {
                            const matchedWod = getMatchedWod(selectedSession, new Date(selectedSession?.start_time));
                            if (matchedWod) {
                                return (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <span className="h-px flex-1 bg-muted/50" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-primary italic">Daily Programming</span>
                                            <span className="h-px flex-1 bg-muted/50" />
                                        </div>
                                        <div
                                            className="p-6 rounded-3xl bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-all group cursor-pointer"
                                            onClick={() => setSelectedWod(matchedWod)}
                                        >
                                            <div className="flex items-center justify-between mb-4">
                                                <Badge className="bg-primary text-foreground text-[9px] font-black uppercase tracking-widest">{matchedWod.track} TRACK</Badge>
                                                <Trophy className="h-4 w-4 text-primary" />
                                            </div>
                                            <h3 className="text-2xl font-black uppercase italic tracking-tight text-foreground group-hover:text-primary transition-colors mb-4">{matchedWod.title}</h3>

                                            {/* Content Preview */}
                                            <div className="space-y-3 bg-muted/50 p-4 rounded-2xl border border-border mb-4">
                                                {matchedWod.metcon && (
                                                    <div>
                                                        <p className="text-[7px] font-black uppercase text-primary tracking-widest mb-1 italic">Workout</p>
                                                        <p className="text-xs text-foreground/80 line-clamp-3 leading-relaxed">{matchedWod.metcon}</p>
                                                    </div>
                                                )}
                                                {matchedWod.stimulus && !matchedWod.metcon && (
                                                    <div>
                                                        <p className="text-[7px] font-black uppercase text-primary tracking-widest mb-1 italic">Goal</p>
                                                        <p className="text-xs text-foreground/80 line-clamp-3 leading-relaxed">{matchedWod.stimulus}</p>
                                                    </div>
                                                )}
                                            </div>

                                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest flex items-center gap-2">
                                                <div className="h-1 w-1 bg-primary rounded-full animate-pulse" />
                                                Click for full modality & scaling details
                                            </p>
                                        </div>
                                    </div>
                                );
                            }
                            return (
                                <div className="text-center py-8 px-4 rounded-3xl border border-dashed border-border opacity-40">
                                    <p className="text-[10px] font-black uppercase tracking-widest">No programming assigned to this track yet</p>
                                </div>
                            );
                        })()}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" className="w-full h-12 rounded-2xl font-black uppercase tracking-widest border-border" onClick={() => setSelectedSession(null)}>
                            {t('common.close', { defaultValue: 'CLOSE' })}
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
