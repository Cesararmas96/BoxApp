import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useLanguage } from '@/hooks';
import {
    BarChart,
    Trophy,
    Users,
    Medal,
    Timer,
    Dumbbell
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Database } from '@/types/supabase';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { Competition, CompetitionParticipant, CompetitionEvent, CompetitionScore } from '@/types/competitions';

interface LeaderboardTabProps {
    competition: Competition;
}

// Local wrapper for calculation convenience
interface ParticipantWithAthlete extends CompetitionParticipant {
    athlete: {
        first_name: string;
        last_name: string;
    };
}

export const LeaderboardTab: React.FC<LeaderboardTabProps> = ({ competition }) => {
    const { t } = useLanguage();

    const [participants, setParticipants] = useState<ParticipantWithAthlete[]>([]);
    const [events, setEvents] = useState<CompetitionEvent[]>([]);
    const [scores, setScores] = useState<CompetitionScore[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDivision, setSelectedDivision] = useState<string>('all');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            // Fetch Participants
            const { data: partData } = await supabase
                .from('competition_participants')
                .select(`id, division, athlete:profiles!user_id(first_name, last_name)`)
                .eq('competition_id', competition.id)
                .eq('status', 'active');

            // Fetch Events
            const { data: eventData } = await supabase
                .from('competition_events')
                .select('*')
                .eq('competition_id', competition.id)
                .order('order_index');

            // Fetch Scores
            // We need event IDs first
            const eventIds = eventData?.map(e => e.id) || [];
            let scoreData: CompetitionScore[] = [];

            if (eventIds.length > 0) {
                const { data: sData } = await supabase
                    .from('competition_scores')
                    .select('*')
                    .in('event_id', eventIds)
                    .in('status', ['submitted', 'verified']); // Only count valid scores

                scoreData = (sData || []) as CompetitionScore[];
            }

            if (partData) setParticipants(partData as unknown as ParticipantWithAthlete[]);
            if (eventData) setEvents(eventData as unknown as CompetitionEvent[]);
            setScores(scoreData as CompetitionScore[]);
            setLoading(false);
        };
        fetchData();
    }, [competition.id]);

    // Parse Score Data Helper
    const parseScore = (scoreData: any, type: string) => {
        let value = 0;
        let display = '-';

        if (!scoreData) return { value, display };

        if (type === 'for_time') {
            const timeStr = scoreData.time || '99:59'; // High default for no score
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

    // Calculate Leaderboard
    const calculateLeaderboard = () => {
        const divisions = Array.from(new Set(participants.map(p => p.division).filter(Boolean)));
        const filteredDivisions = selectedDivision === 'all' ? divisions : [selectedDivision];

        return filteredDivisions.map(div => {
            const divParticipants = participants.filter(p => p.division === div);

            const rankedParticipants = divParticipants.map(p => {
                let totalPoints = 0;
                const eventResults = events.map(event => {
                    const pScore = scores.find(s => s.participant_id === p.id && s.event_id === event.id);

                    const { value, display } = parseScore(pScore?.score_data, event.wod_type || 'for_time');

                    // Ranking Logic (Low Point System)
                    // Get all valid scores for this event and division
                    const eventScoresInDiv = scores.filter(s =>
                        s.event_id === event.id &&
                        participants.some(part => part.id === s.participant_id && part.division === div)
                    ).map(s => {
                        const parsed = parseScore(s.score_data, event.wod_type || 'for_time');
                        return { ...s, value: parsed.value };
                    });

                    // Sort scores to determine rank
                    // Include the current participant even if they have 0/default score for ranking context if needed, 
                    // but usually we rank only those with scores or handle DNF. 
                    // For simplicity, we compare values.

                    // Check if current participant has a valid score entry
                    if (!pScore) {
                        return {
                            eventId: event.id,
                            score: '-',
                            points: divParticipants.length + 1, // Last place penalty
                            rank: '-'
                        };
                    }

                    const sortedScores = [...eventScoresInDiv].sort((a, b) => {
                        if ((event.wod_type || 'for_time') === 'for_time') return a.value - b.value; // Lower time is better
                        return b.value - a.value; // Higher is better
                    });

                    // Find rank (1-based)
                    let rank = sortedScores.findIndex(s => s.participant_id === p.id) + 1;
                    let points = rank;

                    totalPoints += points;

                    return {
                        eventId: event.id,
                        score: display,
                        points: points,
                        rank: rank
                    };
                });

                // Sort by total points (Low Point System: Lower is better)
                return {
                    participant: p,
                    totalPoints,
                    eventResults
                };
            });

            return {
                division: div,
                rankings: rankedParticipants.sort((a, b) => a.totalPoints - b.totalPoints)
            };
        });
    };



    const leaderboardData = calculateLeaderboard();
    const divisions = Array.from(new Set(participants.map(p => p.division).filter(Boolean)));

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground animate-pulse">Calculating standings...</p>
            </div>
        );
    }

    if (participants.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-10 space-y-4 opacity-50">
                <Users className="h-16 w-16 text-muted-foreground" />
                <p className="font-bold uppercase tracking-widest text-muted-foreground">No athletes registered</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 h-full flex flex-col">
            <div className="flex items-center justify-between flex-shrink-0">
                <div className="space-y-1">
                    <h3 className="text-xl font-black italic uppercase tracking-tight flex items-center gap-3">
                        <BarChart className="h-5 w-5 text-primary" />
                        {t('competitions.leaderboard', { defaultValue: 'LEADERBOARD' })}
                    </h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                        {t('competitions.live_standings', { defaultValue: 'LIVE STANDINGS' })}
                    </p>
                </div>

                <div className="w-[200px]">
                    <Select value={selectedDivision} onValueChange={setSelectedDivision}>
                        <SelectTrigger className="bg-white/5 border-white/10 h-10 rounded-xl">
                            <SelectValue placeholder="All Divisions" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">ALL DIVISIONS</SelectItem>
                            {divisions.map(div => (
                                <SelectItem key={div} value={div as string}>{div}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <ScrollArea className="flex-1 -mr-4 pr-4">
                <div className="space-y-12 pb-10">
                    {leaderboardData.map((divData) => (
                        <div key={divData.division as string} className="space-y-6">
                            <div className="flex items-center gap-4">
                                <Badge className="bg-primary text-primary-foreground hover:bg-primary h-8 px-4 text-xs font-black uppercase tracking-widest rounded-lg">
                                    {divData.division}
                                </Badge>
                                <div className="h-px flex-1 bg-white/5" />
                            </div>

                            <div className="bg-white/5 border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left min-w-[800px]">
                                        <thead>
                                            <tr className="bg-white/5 border-b border-white/5">
                                                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground w-20 text-center">#</th>
                                                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Athlete</th>
                                                {events.map((event, idx) => (
                                                    <th key={event.id} className="p-6 text-[10px] font-black uppercase tracking-widest text-center text-primary/60 min-w-[100px]">
                                                        {event.title || event.name || `EV ${idx + 1}`}
                                                    </th>
                                                ))}
                                                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-right text-primary w-32">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {divData.rankings.map((row, idx) => (
                                                <tr key={row.participant.id} className="border-b border-white/5 last:border-none hover:bg-white/5 transition-colors group">
                                                    <td className="p-6 text-center">
                                                        <div className={`mx-auto h-8 w-8 rounded-lg flex items-center justify-center font-black text-xs shadow-lg ${idx === 0 ? 'bg-yellow-500 text-black shadow-yellow-500/20' :
                                                            idx === 1 ? 'bg-zinc-300 text-black shadow-zinc-300/20' :
                                                                idx === 2 ? 'bg-amber-700 text-white shadow-amber-700/20' :
                                                                    'bg-white/10 text-muted-foreground'
                                                            }`}>
                                                            {idx + 1}
                                                        </div>
                                                    </td>
                                                    <td className="p-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center font-black text-primary text-xs border border-primary/10 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                                                {row.participant.athlete.first_name?.[0]}{row.participant.athlete.last_name?.[0]}
                                                            </div>
                                                            <div>
                                                                <p className="font-black text-sm uppercase tracking-tight text-white/90 group-hover:text-primary transition-colors">{row.participant.athlete.first_name} {row.participant.athlete.last_name}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    {row.eventResults.map((res) => (
                                                        <td key={res.eventId} className="p-6 text-center">
                                                            <div className="space-y-1">
                                                                <p className="font-black italic text-sm">{res.score}</p>
                                                                {res.rank !== '-' && (
                                                                    <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">({res.points} pts)</p>
                                                                )}
                                                            </div>
                                                        </td>
                                                    ))}
                                                    <td className="p-6 text-right">
                                                        <div className="inline-flex flex-col items-end justify-center px-4 py-2 rounded-xl bg-primary/5 border border-primary/10 group-hover:bg-primary/10 transition-colors">
                                                            <span className="text-xl font-black italic text-primary leading-none">{row.totalPoints}</span>
                                                            <span className="text-[8px] font-black uppercase tracking-widest text-primary/40 mt-0.5">PTS</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
};
