import React from 'react';
import {
    Clock,
    Calendar,
    Users,
    ArrowRight,
    Search
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguage } from '@/hooks';
import { CompetitionHeat as Heat, CompetitionEvent as Event } from '@/types/competitions';

interface TimelineViewProps {
    heats: Heat[];
    events: Event[];
}

export const TimelineView: React.FC<TimelineViewProps> = ({ heats, events }) => {
    const { t } = useLanguage();

    // Sort heats by start time
    const sortedHeats = [...heats].sort((a, b) => {
        if (!a.start_time) return 1;
        if (!b.start_time) return -1;
        return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
    });

    const formatTime = (dateString: string | null) => {
        if (!dateString) return '--:--';
        return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
    };

    const getEventTitle = (eventId: string) => {
        const event = events.find(e => e.id === eventId);
        return event?.title || (event as any)?.name || 'Unknown Event';
    };

    if (heats.length === 0) {
        return (
            <div className="h-[400px] flex flex-col items-center justify-center text-muted-foreground gap-4 bg-white/5 rounded-[2rem] border border-dashed border-white/10">
                <Calendar className="h-12 w-12 opacity-20" />
                <p className="font-bold uppercase tracking-widest text-xs opacity-50">
                    {t('logistics.no_heats_scheduled', { defaultValue: 'No heats scheduled yet' })}
                </p>
            </div>
        );
    }

    return (
        <ScrollArea className="h-full">
            <div className="relative pl-8 pr-4 py-6 space-y-8">
                {/* Timeline Line */}
                <div className="absolute left-[1.125rem] top-0 bottom-0 w-[2px] bg-gradient-to-b from-primary/50 via-primary/10 to-transparent" />

                {sortedHeats.map((heat, index) => {
                    const isFirstOfDate = index === 0 ||
                        (heat.start_time && sortedHeats[index - 1].start_time &&
                            new Date(heat.start_time).toDateString() !== new Date(sortedHeats[index - 1].start_time!).toDateString());

                    return (
                        <div key={heat.id} className="relative">
                            {/* Date Header */}
                            {isFirstOfDate && heat.start_time && (
                                <div className="mb-6 -ml-8 flex items-center gap-4">
                                    <div className="z-10 bg-zinc-950 px-3 py-1 border border-white/10 rounded-full">
                                        <span className="text-[10px] font-black uppercase tracking-tighter text-primary italic">
                                            {formatDate(heat.start_time)}
                                        </span>
                                    </div>
                                    <div className="h-[1px] flex-1 bg-white/5" />
                                </div>
                            )}

                            {/* Timeline Dot */}
                            <div className="absolute -left-[1.4rem] top-1.5 h-3 w-3 rounded-full border-2 border-primary bg-zinc-950 z-10 shadow-[0_0_10px_rgba(var(--primary),0.3)]" />

                            {/* Heat Card */}
                            <div className="group bg-white/5 hover:bg-white/10 border border-white/5 hover:border-primary/20 rounded-2xl p-5 transition-all duration-500 hover:translate-x-1">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xl font-black italic uppercase italic tracking-tight text-white group-hover:text-primary transition-colors">
                                                {heat.name}
                                            </span>
                                            <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-widest border-white/10 text-muted-foreground">
                                                {heat.status}
                                            </Badge>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Clock className="h-3.5 w-3.5 text-primary/60" />
                                                <span className="text-xs font-bold uppercase tracking-wider tabular-nums">
                                                    {formatTime(heat.start_time)}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <ArrowRight className="h-3.5 w-3.5 text-primary/40" />
                                                <span className="text-xs font-bold uppercase tracking-wider">
                                                    {getEventTitle(heat.event_id)}
                                                </span>
                                            </div>
                                            {heat.lane_count && (
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <Users className="h-3.5 w-3.5 text-primary/60" />
                                                    <span className="text-xs font-bold uppercase tracking-wider">
                                                        {heat.lane_count} Lanes
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {/* Quick Action Button */}
                                        <button className="h-10 px-4 rounded-xl bg-white/5 hover:bg-primary hover:text-primary-foreground border border-white/5 transition-all flex items-center gap-2 group/btn">
                                            <span className="text-[10px] font-black uppercase tracking-widest">Details</span>
                                            <Search className="h-3.5 w-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                                        </button>
                                    </div>
                                </div>

                                {heat.notes && (
                                    <div className="mt-4 pt-4 border-t border-white/5">
                                        <p className="text-[10px] text-muted-foreground/80 leading-relaxed font-medium capitalize">
                                            {heat.notes}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </ScrollArea>
    );
};
