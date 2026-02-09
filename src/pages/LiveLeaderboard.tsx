import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import {
    Trophy,
    Activity,
    Maximize2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Competition, CompetitionParticipant, CompetitionEvent, CompetitionScore } from '@/types/competitions';

// Define the shape that matches our Supabase query exactly
interface ParticipantWithAthlete extends Omit<CompetitionParticipant, 'athlete'> {
    athlete: {
        first_name: string;
        last_name: string;
        avatar_url: string | null;
        id?: string;
        email?: string | null;
    };
}

export const LiveLeaderboard: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [competition, setCompetition] = useState<Competition | null>(null);
    const [participants, setParticipants] = useState<ParticipantWithAthlete[]>([]);
    const [events, setEvents] = useState<CompetitionEvent[]>([]);
    const [scores, setScores] = useState<CompetitionScore[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentDivisionIndex, setCurrentDivisionIndex] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);

    const fetchData = async () => {
        if (!id) return;

        // Fetch Competition
        const { data: compData } = await supabase
            .from('competitions')
            .select('*')
            .eq('id', id)
            .single();

        // Fetch Participants
        const { data: partData } = await supabase
            .from('competition_participants')
            .select(`id, division, athlete:profiles!user_id(first_name, last_name, avatar_url)`)
            .eq('competition_id', id)
            .eq('status', 'active');

        // Fetch Events
        const { data: eventData } = await supabase
            .from('competition_events')
            .select('*')
            .eq('competition_id', id)
            .order('order_index');

        // Fetch Scores
        const eventIds = eventData?.map(e => e.id) || [];
        let scoreData: CompetitionScore[] = [];

        if (eventIds.length > 0) {
            const { data: sData } = await supabase
                .from('competition_scores')
                .select('*')
                .in('event_id', eventIds);

            scoreData = (sData || []) as unknown as CompetitionScore[];
        }

        if (compData) setCompetition(compData as any);
        if (partData) setParticipants(partData as unknown as ParticipantWithAthlete[]);
        if (eventData) setEvents(eventData as unknown as CompetitionEvent[]);
        setScores(scoreData);
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000); // Refresh every 30s
        return () => clearInterval(interval);
    }, [id]);

    // Auto-scroll and Division carousel logic
    useEffect(() => {
        if (loading || participants.length === 0) return;

        const divisions = Array.from(new Set(participants.map(p => p.division).filter(Boolean)));
        if (divisions.length === 0) return;

        const timer = setInterval(() => {
            if (scrollRef.current) {
                const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;

                // If reached bottom, switch division after a pause
                if (scrollTop + clientHeight >= scrollHeight - 10) {
                    setTimeout(() => {
                        setCurrentDivisionIndex((prev) => (prev + 1) % divisions.length);
                        if (scrollRef.current) scrollRef.current.scrollTop = 0;
                    }, 3000);
                } else {
                    scrollRef.current.scrollBy({ top: 1, behavior: 'auto' });
                }
            }
        }, 50);

        return () => clearInterval(timer);
    }, [loading, participants, currentDivisionIndex]);

    const parseScore = (scoreData: any, type: string) => {
        let value = 0;
        let display = '-';
        if (!scoreData) return { value, display };

        if (type === 'for_time') {
            const timeStr = scoreData.time || '99:59';
            const [min, sec] = timeStr.split(':').map(Number);
            value = (min * 60) + sec;
            display = scoreData.time || '-';
        } else if (type === 'amrap') {
            value = Number(scoreData.reps || 0);
            display = `${value} reps`;
        } else if (type === 'rm') {
            value = Number(scoreData.weight || 0);
            display = `${value} kg`;
        }
        return { value, display };
    };

    const calculateRankings = (division: string) => {
        const divParticipants = participants.filter(p => p.division === division);

        return divParticipants.map(p => {
            let totalPoints = 0;
            const eventResults = events.map(event => {
                const pScore = scores.find(s => s.participant_id === p.id && s.event_id === event.id);
                const { value, display } = parseScore(pScore?.score_data, event.wod_type || 'for_time');

                const eventScoresInDiv = scores.filter(s =>
                    s.event_id === event.id &&
                    participants.some(part => part.id === s.participant_id && part.division === division)
                ).map(s => {
                    const parsed = parseScore(s.score_data, event.wod_type || 'for_time');
                    return { ...s, value: parsed.value };
                });

                if (!pScore) {
                    return { score: '-', points: divParticipants.length + 1, rank: '-' };
                }

                const sortedScores = [...eventScoresInDiv].sort((a, b) => {
                    if ((event.wod_type || 'for_time') === 'for_time') return a.value - b.value;
                    return b.value - a.value;
                });

                let rank = sortedScores.findIndex(s => s.participant_id === p.id) + 1;
                totalPoints += rank;

                return { score: display, points: rank, rank };
            });

            return { participant: p, totalPoints, eventResults };
        }).sort((a, b) => a.totalPoints - b.totalPoints);
    };

    const divisions = Array.from(new Set(participants.map(p => p.division).filter(Boolean)));
    const currentDivision = divisions[currentDivisionIndex] as string;
    const rankings = currentDivision ? calculateRankings(currentDivision) : [];

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black flex flex-col items-center justify-center gap-8">
                <div className="h-24 w-24 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                <h1 className="text-4xl font-black italic uppercase tracking-widest text-white animate-pulse">
                    Live Leaderboard
                </h1>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black text-white flex flex-col font-sans selection:bg-primary selection:text-black">
            {/* Header */}
            <header className="h-32 border-b border-white/10 flex items-center justify-between px-12 bg-zinc-950/50 backdrop-blur-xl z-20">
                <div className="flex items-center gap-8">
                    <div className="h-20 w-20 bg-primary flex items-center justify-center rounded-2xl shadow-[0_0_40px_rgba(var(--primary),0.2)]">
                        <Trophy className="h-10 w-10 text-black" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none">
                            {competition?.name}
                        </h1>
                        <div className="flex items-center gap-4 mt-2">
                            <Badge className="bg-primary text-black font-black uppercase italic px-4 py-1 text-lg">
                                {currentDivision}
                            </Badge>
                            <span className="text-muted-foreground font-bold uppercase tracking-widest text-sm flex items-center gap-2">
                                <Activity className="h-4 w-4 text-emerald-500" /> Live Standings
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-12 text-right">
                    <div className="space-y-1">
                        <p className="text-muted-foreground text-xs font-black uppercase tracking-widest">Total Athletes</p>
                        <p className="text-4xl font-black tabular-nums">{rankings.length}</p>
                    </div>
                    <div className="h-12 w-[1px] bg-white/10" />
                    <div className="space-y-1">
                        <p className="text-muted-foreground text-xs font-black uppercase tracking-widest">Clock</p>
                        <p className="text-4xl font-black tabular-nums">
                            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                </div>
            </header>

            {/* Table Header */}
            <div className="h-20 bg-zinc-900 border-b border-white/10 flex items-center px-12 z-10 shrink-0">
                <div className="w-24 text-center text-xs font-black uppercase tracking-widest text-muted-foreground">Rank</div>
                <div className="flex-1 px-8 text-xs font-black uppercase tracking-widest text-muted-foreground">Athlete</div>
                <div className="flex gap-4">
                    {events.map((event, idx) => (
                        <div key={event.id} className="w-40 text-center text-xs font-black uppercase tracking-widest text-primary/60 truncate">
                            {event.title || `EV ${idx + 1}`}
                        </div>
                    ))}
                    <div className="w-32 text-right text-xs font-black uppercase tracking-widest text-primary">Total</div>
                </div>
            </div>

            {/* Scrolling Content */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-hidden"
            >
                <div className="px-12 py-4 space-y-4">
                    {rankings.map((row, idx) => (
                        <div
                            key={row.participant.id}
                            className={`flex items-center h-28 rounded-[2rem] border transition-all duration-500 overflow-hidden ${idx === 0
                                    ? 'bg-yellow-500/10 border-yellow-500/30 shadow-[0_0_30px_rgba(234,179,8,0.05)]'
                                    : idx === 1
                                        ? 'bg-zinc-300/10 border-zinc-300/30'
                                        : idx === 2
                                            ? 'bg-amber-700/10 border-amber-700/30'
                                            : 'bg-white/[0.02] border-white/5'
                                }`}
                        >
                            <div className="w-24 flex items-center justify-center">
                                <div className={`h-16 w-16 rounded-2xl flex items-center justify-center text-4xl font-black italic ${idx === 0 ? 'text-yellow-500' :
                                        idx === 1 ? 'text-zinc-300' :
                                            idx === 2 ? 'text-amber-700' :
                                                'text-white/20'
                                    }`}>
                                    {idx + 1}
                                </div>
                            </div>

                            <div className="flex-1 px-8 flex items-center gap-6">
                                <div className="h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center font-black text-2xl text-primary border border-white/10">
                                    {row.participant.athlete.avatar_url ? (
                                        <img src={row.participant.athlete.avatar_url} className="h-full w-full object-cover rounded-2xl" />
                                    ) : (
                                        <span>{row.participant.athlete.first_name[0]}{row.participant.athlete.last_name[0]}</span>
                                    )}
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black uppercase italic tracking-tighter">
                                        {row.participant.athlete.first_name} {row.participant.athlete.last_name}
                                    </h2>
                                </div>
                            </div>

                            <div className="flex gap-4 items-center">
                                {row.eventResults.map((res, eIdx) => (
                                    <div key={eIdx} className="w-40 text-center">
                                        <p className="text-2xl font-black italic">{res.score}</p>
                                        <p className="text-xs font-bold text-muted-foreground/40 uppercase tracking-widest">{res.points} PTS</p>
                                    </div>
                                ))}
                                <div className="w-32 text-right pr-8">
                                    <div className="inline-block text-right">
                                        <p className="text-5xl font-black italic text-primary leading-none">{row.totalPoints}</p>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-primary/40 text-right mt-1">Points</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer / Stats Bar */}
            <footer className="h-16 bg-zinc-950 border-t border-white/10 flex items-center justify-between px-12 z-20">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Live Feed Active</span>
                    </div>
                </div>
                <div className="flex items-center gap-8">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Next Refresh: <span className="text-primary tabular-nums">30s</span>
                    </p>
                    <div className="flex items-center gap-2 text-primary">
                        <Maximize2 className="h-4 w-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Full Screen Mode</span>
                    </div>
                </div>
            </footer>
        </div>
    );
};
