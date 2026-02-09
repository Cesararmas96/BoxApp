
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, Users, MoreVertical, Timer } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface Heat {
    id: string;
    name: string;
    start_time: string | null;
    status: string;
    event_id: string;
    lane_assignments: {
        lane_number: number;
        participant_id: string;
        competition_participants: {
            first_name: string;
            last_name: string;
        }
    }[];
}

interface HeatScheduleProps {
    heats: Heat[];
    onHeatUpdate: () => void; // Callback to refresh data
}

export const HeatSchedule: React.FC<HeatScheduleProps> = ({ heats, onHeatUpdate }) => {

    if (heats.length === 0) {
        return (
            <div className="col-span-full text-center p-12 bg-white/5 rounded-[2rem] border border-dashed border-white/10 flex flex-col items-center justify-center gap-4 opacity-50">
                <Timer className="h-12 w-12 text-muted-foreground" />
                <p className="font-bold uppercase tracking-widest text-muted-foreground">No heats created yet</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-y-auto">
            {heats.map(heat => (
                <div key={heat.id} className="bg-white/5 border border-white/5 rounded-[2rem] p-6 space-y-6 hover:border-primary/20 transition-colors">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <span className="font-black text-primary">{heat.name.replace('Heat ', '')}</span>
                            </div>
                            <div>
                                <h4 className="font-black italic uppercase text-lg truncate max-w-[200px]">{heat.name}</h4>
                                <Badge variant="outline" className="text-[10px] border-white/10 text-muted-foreground">{heat.status}</Badge>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" className="hover:bg-white/10 rounded-full h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <Calendar className="h-3 w-3" /> Start Time
                            </label>
                            <Input
                                type="datetime-local"
                                className="bg-black/20 border-white/5 text-xs h-9"
                                value={heat.start_time ? new Date(heat.start_time).toISOString().slice(0, 16) : ''}
                                onChange={async (e) => {
                                    await supabase.from('competition_heats').update({ start_time: e.target.value }).eq('id', heat.id);
                                    onHeatUpdate();
                                }}
                            />
                        </div>

                        <div className="border-t border-white/5 pt-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-3">
                                <Users className="h-3 w-3" /> Athletes / Lanes
                            </label>
                            <div className="space-y-2">
                                <div className="grid grid-cols-2 gap-2">
                                    {heat.lane_assignments?.sort((a, b) => a.lane_number - b.lane_number).map((assignment) => (
                                        <div key={assignment.participant_id} className="flex items-center gap-3 p-2 bg-black/20 rounded-lg border border-white/5">
                                            <div className="h-6 w-6 rounded flex items-center justify-center bg-white/5 text-[10px] font-black text-muted-foreground border border-white/5">
                                                {assignment.lane_number}
                                            </div>
                                            <span className="text-[10px] font-bold uppercase truncate">
                                                {assignment.competition_participants?.first_name} {assignment.competition_participants?.last_name}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                {(!heat.lane_assignments || heat.lane_assignments.length === 0) && (
                                    <div className="text-center p-4 border border-dashed border-white/10 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group">
                                        <span className="text-xs font-bold text-muted-foreground group-hover:text-primary transition-colors uppercase tracking-wider">Manage Lanes</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
