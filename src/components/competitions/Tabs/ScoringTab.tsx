import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage, useNotification } from '@/hooks';
import {
    Trophy,
    Search,
    Filter,
    ChevronRight,
    QrCode,
    Timer,
    Dumbbell,
    Calendar,
    CheckCircle2,
    Circle,
    AlertCircle
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Competition } from '@/types/competitions';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScoreEntry } from '../ScoreEntry';

interface ScoringTabProps {
    competition: Competition;
}

export const ScoringTab: React.FC<ScoringTabProps> = ({ competition }) => {
    const { t } = useLanguage();
    const { user } = useAuth();
    const [events, setEvents] = useState<any[]>([]);
    const [selectedEventId, setSelectedEventId] = useState<string>('');
    const [heats, setHeats] = useState<any[]>([]);
    const [selectedHeatId, setSelectedHeatId] = useState<string>('all');
    const [loading, setLoading] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
    const [isScoreEntryOpen, setIsScoreEntryOpen] = useState(false);

    // Fetch Events for the selector
    useEffect(() => {
        const fetchEvents = async () => {
            if (!competition?.id) return;
            const { data } = await supabase
                .from('competition_events')
                .select('*')
                .eq('competition_id', competition.id)
                .order('order_index', { ascending: true });

            if (data) {
                setEvents(data);
                if (data.length > 0) setSelectedEventId(data[0].id);
            }
        };
        fetchEvents();
    }, [competition?.id]);

    // Fetch Heats and Assignments
    useEffect(() => {
        const fetchHeatsAndLanes = async () => {
            if (!selectedEventId) return;
            setLoading(true);

            // Fetch heats with lane assignments and participants
            let query = supabase
                .from('competition_heats')
                .select(`
                    *,
                    lane_assignments (
                        id,
                        lane_number,
                        participant_id,
                        competition_participants (
                            id,
                            first_name,
                            last_name,
                            division,
                            team_id,
                            competition_teams (name)
                        )
                    )
                `)
                .eq('event_id', selectedEventId)
                .order('start_time', { ascending: true });

            if (selectedHeatId !== 'all') {
                query = query.eq('id', selectedHeatId);
            }

            const { data, error } = await query;
            if (data) setHeats(data);
            setLoading(false);
        };

        fetchHeatsAndLanes();
    }, [selectedEventId, selectedHeatId]);

    // Helper to get status color (placeholder logic)
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'text-green-500 bg-green-500/10 border-green-500/20';
            case 'inprogress': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
            default: return 'text-muted-foreground bg-white/5 border-white/10';
        }
    };

    return (
        <div className="space-y-6 h-full flex flex-col">
            {/* Header / Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-end md:items-center justify-between flex-shrink-0">
                <div className="space-y-1">
                    <h3 className="text-xl font-black italic uppercase tracking-tight flex items-center gap-3">
                        <QrCode className="h-5 w-5 text-primary" />
                        {t('competitions.scoring', { defaultValue: 'SCORE ENTRY' })}
                    </h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                        {t('competitions.scoring_desc', { defaultValue: 'SELECT EVENT AND ATHLETE TO SCORE' })}
                    </p>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                        <SelectTrigger className="w-full md:w-[200px] bg-white/5 border-white/10 text-xs font-bold uppercase tracking-wider h-10">
                            <SelectValue placeholder="SELECT EVENT" />
                        </SelectTrigger>
                        <SelectContent>
                            {events.map(event => (
                                <SelectItem key={event.id} value={event.id} className="text-xs font-bold uppercase">
                                    {event.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={selectedHeatId} onValueChange={setSelectedHeatId}>
                        <SelectTrigger className="w-full md:w-[150px] bg-white/5 border-white/10 text-xs font-bold uppercase tracking-wider h-10">
                            <SelectValue placeholder="ALL HEATS" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all" className="text-xs font-bold uppercase">All Heats</SelectItem>
                            {heats.map(heat => (
                                <SelectItem key={heat.id} value={heat.id} className="text-xs font-bold uppercase">
                                    {heat.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Content using Grid for Heats */}
            <div className="grid grid-cols-1 gap-8 overflow-y-auto min-h-0 custom-scrollbar pr-2">
                {heats.map(heat => (
                    <div key={heat.id} className="space-y-3">
                        <div className="flex items-center gap-4 sticky top-0 bg-[#09090b] z-10 py-2 border-b border-white/5">
                            <Badge variant="outline" className="text-xs font-black uppercase tracking-widest px-3 py-1 border-primary/20 bg-primary/5 text-primary">
                                {heat.name}
                            </Badge>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                <Calendar className="h-3 w-3" />
                                {heat.start_time ? new Date(heat.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'NOT SCHEDULED'}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {heat.lane_assignments?.sort((a: any, b: any) => a.lane_number - b.lane_number).map((assignment: any) => (
                                <Card
                                    key={assignment.id}
                                    className="p-4 bg-white/5 border-white/5 hover:border-primary/50 hover:bg-white/10 transition-all cursor-pointer group relative overflow-hidden"
                                    onClick={() => {
                                        setSelectedAssignment(assignment);
                                        setIsScoreEntryOpen(true);
                                    }}
                                >
                                    <div className="absolute top-0 left-0 w-1 h-full bg-white/10 group-hover:bg-primary transition-colors" />
                                    <div className="flex items-center gap-4">
                                        <div className="flex flex-col items-center justify-center h-10 w-10 bg-black/40 rounded-lg border border-white/5 group-hover:border-primary/20 transition-colors">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-[-2px]">LANE</span>
                                            <span className="text-xl font-black text-white leading-none">{assignment.lane_number}</span>
                                        </div>

                                        <div className="space-y-1 min-w-0">
                                            <h4 className="font-bold text-sm uppercase truncate text-white group-hover:text-primary transition-colors">
                                                {assignment.competition_participants?.first_name} {assignment.competition_participants?.last_name}
                                            </h4>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="secondary" className="text-[9px] h-4 px-1 rounded-sm bg-white/10 text-muted-foreground hover:bg-white/20">
                                                    {assignment.competition_participants?.division || 'RX'}
                                                </Badge>
                                                {assignment.competition_participants?.competition_teams && (
                                                    <span className="text-[9px] font-bold text-muted-foreground/60 uppercase truncate">
                                                        {assignment.competition_participants.competition_teams.name}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Status Indicator (Placeholder) */}
                                        <div className="ml-auto">
                                            <Circle className="h-4 w-4 text-muted-foreground/20" />
                                        </div>
                                    </div>
                                </Card>
                            ))}
                            {(!heat.lane_assignments || heat.lane_assignments.length === 0) && (
                                <div className="col-span-full py-8 text-center border border-dashed border-white/10 rounded-xl">
                                    <p className="text-xs font-bold text-muted-foreground/50 uppercase tracking-widest">No athletes assigned to this heat</p>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {heats.length === 0 && !loading && (
                    <div className="flex flex-col items-center justify-center h-64 border border-dashed border-white/10 rounded-3xl bg-white/5">
                        <Search className="h-8 w-8 text-muted-foreground mb-4" />
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">No heats found for this event</p>
                    </div>
                )}
            </div>

            <ScoreEntry
                isOpen={isScoreEntryOpen}
                onClose={() => setIsScoreEntryOpen(false)}
                assignment={selectedAssignment}
                event={events.find(e => e.id === selectedEventId)}
                heatId={selectedHeatId}
                onScoreSubmitted={() => {
                    if (selectedEventId) {
                        // We could refactor the fetch into a useCallback to call it here
                        // For now we will allow the user to continue without full refresh or implement a light refresh
                        // A simple hack is toggle selectedHeatId to 'all' and back or similar, 
                        // but ideally we just close it.
                    }
                    setIsScoreEntryOpen(false);
                }}
            />
        </div>
    );
};
