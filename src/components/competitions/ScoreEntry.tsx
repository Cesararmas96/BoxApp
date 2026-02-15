import React, { useState, useEffect } from 'react';
import {
    ResponsiveDialog as Dialog,
    ResponsiveDialogContent as DialogContent,
    ResponsiveDialogHeader as DialogHeader,
    ResponsiveDialogTitle as DialogTitle,
    ResponsiveDialogFooter as DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Timer, Dumbbell, Repeat } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useNotification } from '@/hooks';
import { SignaturePad } from '@/components/ui/signature-pad';

import { CompetitionEvent } from '@/types/competitions';

interface ScoreEntryProps {
    isOpen: boolean;
    onClose: () => void;
    assignment: any; // Lane Assignment with participant details
    event: CompetitionEvent;
    heatId: string;
    onScoreSubmitted: () => void;
}

export const ScoreEntry: React.FC<ScoreEntryProps> = ({ isOpen, onClose, assignment, event, onScoreSubmitted }) => {
    const { showNotification } = useNotification();
    const [score, setScore] = useState<string>('');
    const [tieBreak, setTieBreak] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [judgeSignature, setJudgeSignature] = useState<string | null>(null);
    const [athleteSignature, setAthleteSignature] = useState<string | null>(null);

    // Initial load check for existing score
    useEffect(() => {
        if (isOpen && assignment && event) {
            const fetchScore = async () => {
                const { data } = await supabase
                    .from('competition_scores')
                    .select('*')
                    .eq('event_id', event.id)
                    .eq('participant_id', assignment.participant_id)
                    .single();

                if (data) {
                    const scoreRecord = data as any;
                    // Pre-fill existing score
                    if (event.wod_type === 'for_time') {
                        setScore(scoreRecord.score_data?.time || '');
                    } else if (event.wod_type === 'amrap') {
                        setScore(scoreRecord.score_data?.reps || '');
                    } else if (event.wod_type === 'rm') {
                        setScore(scoreRecord.score_data?.weight || '');
                    }
                    setTieBreak(scoreRecord.tie_break_data?.time || '');
                } else {
                    setScore('');
                    setTieBreak('');
                }
            };
            fetchScore();
        }
    }, [isOpen, assignment, event]);

    const handleSubmit = async () => {
        if (!score) return;
        setLoading(true);

        const scoreData: any = {};
        if (event.wod_type === 'for_time') scoreData.time = score;
        else if (event.wod_type === 'amrap') scoreData.reps = score;
        else if (event.wod_type === 'rm') scoreData.weight = score;

        const tieBreakData = tieBreak ? { time: tieBreak } : {};

        // Upsert score
        const { error } = await supabase
            .from('competition_scores')
            .upsert({
                competition_id: event.competition_id,
                event_id: event.id,
                participant_id: assignment.participant_id,
                lane_id: assignment.id,
                score_data: scoreData,
                tie_break_data: tieBreakData,
                judge_signature: judgeSignature,
                athlete_signature: athleteSignature,
                status: 'submitted',
                updated_at: new Date().toISOString()
            } as any, {
                onConflict: 'competition_id,event_id,participant_id'
            });

        setLoading(false);

        if (error) {
            console.error(error);
            showNotification('error', 'FAILED TO SUBMIT SCORE');
        } else {
            showNotification('success', 'SCORE SUBMITTED');
            onScoreSubmitted();
            onClose();
        }
    };

    if (!assignment || !event) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-[#09090b] border-border text-foreground rounded-[2rem] sm:max-w-[400px]">
                <DialogHeader className="text-center">
                    <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">
                        {assignment.competition_participants?.first_name} {assignment.competition_participants?.last_name}
                    </DialogTitle>
                    <div className="flex justify-center gap-2 mt-2">
                        <span className="bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded">
                            LANE {assignment.lane_number}
                        </span>
                        <span className="bg-muted/50 text-muted-foreground text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded">
                            {event.title}
                        </span>
                    </div>
                </DialogHeader>

                <div className="py-6 space-y-6">
                    {/* Main Score Input */}
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2 justify-center">
                            {event.wod_type === 'for_time' && <Timer className="h-4 w-4" />}
                            {event.wod_type === 'amrap' && <Repeat className="h-4 w-4" />}
                            {event.wod_type === 'rm' && <Dumbbell className="h-4 w-4" />}
                            {event.wod_type === 'for_time' ? 'TIME (MM:SS)' :
                                event.wod_type === 'amrap' ? 'TOTAL REPS' :
                                    event.wod_type === 'rm' ? 'WEIGHT (KG/LB)' : 'SCORE'}
                        </Label>
                        <div className="relative">
                            <Input
                                value={score}
                                onChange={(e) => setScore(e.target.value)}
                                className="text-center text-4xl font-black h-20 bg-black/40 border-border rounded-2xl focus:border-primary/50 transition-colors"
                                placeholder={event.wod_type === 'for_time' ? '00:00' : '0'}
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Tie Break Input (Conditional) */}
                    {(event.tie_break_strategy || event.wod_type === 'amrap') && (
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 text-center block">
                                TIE BREAK TIME
                            </Label>
                            <Input
                                value={tieBreak}
                                onChange={(e) => setTieBreak(e.target.value)}
                                className="text-center font-bold h-12 bg-muted/50 border-border rounded-xl w-1/2 mx-auto"
                                placeholder="00:00"
                            />
                        </div>
                    )}

                    {/* Signatures */}
                    <div className="grid grid-cols-1 gap-4 pt-4 border-t border-border">
                        <SignaturePad
                            label="JUDGE SIGNATURE"
                            onChange={setJudgeSignature}
                        />
                        <SignaturePad
                            label="ATHLETE SIGNATURE"
                            onChange={setAthleteSignature}
                        />
                    </div>
                </div>

                <DialogFooter className="flex-col sm:flex-col gap-2">
                    <Button
                        onClick={handleSubmit}
                        disabled={loading || !score || !judgeSignature || !athleteSignature}
                        className="w-full h-14 text-lg font-black uppercase tracking-widest rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                        {loading ? 'SUBMITTING...' : 'SUBMIT SCORE'}
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="w-full h-10 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:bg-muted rounded-xl"
                    >
                        CANCEL
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
