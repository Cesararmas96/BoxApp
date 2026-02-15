import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useLanguage, useNotification } from '@/hooks';
import {
    Timer,
    Plus,
    ChevronRight,
    Clock,
    Settings2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    ResponsiveDialog as Dialog,
    ResponsiveDialogContent as DialogContent,
    ResponsiveDialogDescription as DialogDescription,
    ResponsiveDialogFooter as DialogFooter,
    ResponsiveDialogHeader as DialogHeader,
    ResponsiveDialogTitle as DialogTitle,
    ResponsiveDialogTrigger as DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Competition, CompetitionEvent, CompetitionHeat } from '@/types/competitions';
import { ScrollArea } from '@/components/ui/scroll-area';
import { generateLinearHeats } from '@/utils/heatGenerator';
import { HeatSchedule } from '../HeatSchedule';
import { TimelineView } from '../TimelineView';

interface LogisticsTabProps {
    competition: Competition;
}

export const LogisticsTab: React.FC<LogisticsTabProps> = ({ competition }) => {
    const { t } = useLanguage();
    const { showNotification } = useNotification();

    const [events, setEvents] = useState<CompetitionEvent[]>([]);
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const [heats, setHeats] = useState<CompetitionHeat[]>([]);
    const [allHeats, setAllHeats] = useState<CompetitionHeat[]>([]);
    const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list');
    const [, setLoading] = useState(false);

    const fetchEvents = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('competition_events')
            .select('*')
            .eq('competition_id', competition.id)
            .order('order_index', { ascending: true });

        if (data) {
            setEvents(data as any);
            if (data.length > 0 && !selectedEventId) {
                setSelectedEventId(data[0].id);
            }
        }
        setLoading(false);
    };

    const fetchAllHeats = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('competition_heats')
            .select('*, lane_assignments(*, competition_participants(*, profiles(*)))')
            .eq('competition_id', competition.id)
            .order('start_time', { ascending: true });
        if (data) setAllHeats(data as any);
        setLoading(false);
    };

    const fetchHeats = async () => {
        if (!selectedEventId) return;
        setLoading(true);
        const { data } = await supabase
            .from('competition_heats')
            .select('*, lane_assignments(*, competition_participants(*, profiles(*)))')
            .eq('event_id', selectedEventId)
            .order('start_time', { ascending: true });

        if (data) setHeats(data as any);
        setLoading(false);
    };

    // Fetch events for the competition
    useEffect(() => {
        fetchEvents();
    }, [competition.id]);

    // Fetch heats for the selected event
    useEffect(() => {
        if (viewMode === 'list') {
            fetchHeats();
        } else {
            fetchAllHeats();
        }
    }, [selectedEventId, viewMode]);


    const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
    const [divisions, setDivisions] = useState<{ id: string, name: string }[]>([]);
    const [selectedDivisionId, setSelectedDivisionId] = useState<string>('');
    const [lanesPerHeat, setLanesPerHeat] = useState<number>(8);
    const [isGenerating, setIsGenerating] = useState(false);

    // Fetch divisions
    useEffect(() => {
        const fetchDivisions = async () => {
            const { data } = await supabase
                .from('competition_divisions')
                .select('id, name')
                .eq('competition_id', competition.id);
            if (data) setDivisions(data);
        };
        fetchDivisions();
    }, [competition.id]);

    const handleGenerateHeats = async () => {
        if (!selectedEventId || !selectedDivisionId) return;
        setIsGenerating(true);

        try {
            // 1. Fetch participants for division
            const { data: participants, error: pError } = await supabase
                .from('competition_participants')
                .select('id')
                .eq('division_id', selectedDivisionId)
                ;

            if (pError || !participants) throw new Error('Failed to fetch participants');

            // 2. Generate Heats Locally
            // Map to generic Participant interface if needed, here just passed directly as they have ID
            const generatedHeats = generateLinearHeats(participants as any, lanesPerHeat, heats.length + 1);

            // 3. Save to Supabase
            for (const heat of generatedHeats) {
                // Create Heat
                const { data: heatData, error: hError } = await supabase
                    .from('competition_heats')
                    .insert([{
                        competition_id: competition.id,
                        event_id: selectedEventId,
                        name: `${divisions.find(d => d.id === selectedDivisionId)?.name} - ${heat.name}`,
                        status: 'pending'
                    }])
                    .select()
                    .single();

                if (hError || !heatData) throw new Error('Failed to create heat');

                // Create Lane Assignments
                const assignmentsPayload = heat.assignments.map(a => ({
                    heat_id: heatData.id,
                    participant_id: a.participantId,
                    lane_number: a.lane
                }));

                const { error: lError } = await supabase
                    .from('lane_assignments')
                    .insert(assignmentsPayload);

                if (lError) throw new Error('Failed to assign lanes');
            }

            showNotification('success', t('competitions.heats_generated_success', { count: generatedHeats.length, defaultValue: `GENERATED ${generatedHeats.length} HEATS` }));
            setIsGeneratorOpen(false);
            // Refresh heats list
            if (viewMode === 'list') fetchHeats();
            else fetchAllHeats();

        } catch (error: any) {
            console.error(error);
            showNotification('error', error.message || t('competitions.generation_failed', { defaultValue: 'GENERATION FAILED' }));
        } finally {
            setIsGenerating(false);
        }
    };


    return (
        <div className="grid md:grid-cols-12 gap-10 h-full">
            {/* Event Selection */}
            <div className="md:col-span-3 border-r border-white/5 pr-6 flex flex-col gap-4">
                <div className="space-y-2">
                    <h3 className="text-xl font-black italic uppercase tracking-tight flex items-center gap-3">
                        <Timer className="h-5 w-5 text-primary" />
                        {t('competitions.events', { defaultValue: 'EVENTS' })}
                    </h3>

                    {/* View Switcher */}
                    <div className="flex p-1 bg-white/5 rounded-xl border border-white/5 mt-4">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`flex-1 py-2 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-white'
                                }`}
                        >
                            List
                        </button>
                        <button
                            onClick={() => setViewMode('timeline')}
                            className={`flex-1 py-2 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'timeline' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-white'
                                }`}
                        >
                            Timeline
                        </button>
                    </div>
                </div>

                <ScrollArea className="flex-1 -mx-4 px-4 mt-2">
                    <div className="space-y-2">
                        {events.map(event => (
                            <button
                                key={event.id}
                                onClick={() => setSelectedEventId(event.id)}
                                className={`w-full text-left p-4 rounded-xl border transition-all duration-300 flex items-center justify-between group ${selectedEventId === event.id
                                    ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20'
                                    : 'bg-white/5 border-white/5 hover:bg-white/10 text-muted-foreground hover:text-white'
                                    }`}
                            >
                                <div className="space-y-1">
                                    <span className="font-black italic uppercase tracking-tight text-sm block">{event.title || (event as any).name}</span>
                                    <span className={`text-[10px] font-bold uppercase tracking-wider block ${selectedEventId === event.id ? 'text-primary-foreground/70' : 'text-muted-foreground/50'}`}>{event.wod_type?.replace('_', ' ')}</span>
                                </div>
                                {selectedEventId === event.id && <ChevronRight className="h-4 w-4 animate-in slide-in-from-left-2" />}
                            </button>
                        ))}
                        {events.length === 0 && (
                            <div className="text-center p-8 text-muted-foreground text-xs uppercase tracking-widest font-bold opacity-50">
                                {t('competitions.no_events_found', { defaultValue: 'No events found' })}
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* Heats Management */}
            <div className="md:col-span-9 flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h3 className="text-xl font-black italic uppercase tracking-tight flex items-center gap-3">
                            <Clock className="h-5 w-5 text-primary" />
                            {viewMode === 'timeline' ? t('competitions.full_timeline', { defaultValue: 'FULL TIMELINE' }) : (events.find(e => e.id === selectedEventId)?.title || (events.find(e => e.id === selectedEventId) as any)?.name || t('competitions.select_event_title'))}
                            {viewMode === 'list' && ` - ${t('competitions.heats')}`}
                        </h3>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                            {viewMode === 'timeline' ? t('competitions.timeline_desc', { defaultValue: 'View all scheduled heats chronologically' }) : t('competitions.manage_heats_assignments')}
                        </p>
                    </div>

                    <div className="flex gap-2">
                        {viewMode === 'list' && (
                            <>
                                <Dialog open={isGeneratorOpen} onOpenChange={setIsGeneratorOpen}>
                                    <DialogTrigger asChild>
                                        <Button disabled={!selectedEventId} variant="outline" className="uppercase font-bold text-xs tracking-widest gap-2 border-white/10 hover:bg-white/5">
                                            <Settings2 className="h-4 w-4" /> {t('competitions.generator')}
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="bg-zinc-950 border-white/10">
                                        <DialogHeader>
                                            <DialogTitle className="text-xl font-black italic uppercase">{t('competitions.generate_heats')}</DialogTitle>
                                            <DialogDescription className="text-xs uppercase tracking-widest">
                                                {t('competitions.generate_heats_desc')}
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] uppercase font-black text-muted-foreground">Division</Label>
                                                <Select value={selectedDivisionId} onValueChange={setSelectedDivisionId}>
                                                    <SelectTrigger className="bg-white/5 border-white/10">
                                                        <SelectValue placeholder="Select Division" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {divisions.map(d => (
                                                            <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] uppercase font-black text-muted-foreground">Lanes per Heat</Label>
                                                <Input
                                                    type="number"
                                                    value={lanesPerHeat}
                                                    onChange={(e) => setLanesPerHeat(parseInt(e.target.value))}
                                                    className="bg-white/5 border-white/10"
                                                />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button variant="ghost" onClick={() => setIsGeneratorOpen(false)}>{t('common.cancel')}</Button>
                                            <Button onClick={handleGenerateHeats} disabled={isGenerating || !selectedDivisionId}>
                                                {isGenerating ? t('competitions.generating') : t('competitions.generate')}
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>

                                <Button onClick={async () => {
                                    if (!selectedEventId) return;
                                    const heatName = `${t('competitions.heat')} ${heats.length + 1}`;
                                    const { error } = await supabase.from('competition_heats').insert([{
                                        competition_id: competition.id,
                                        event_id: selectedEventId,
                                        name: heatName,
                                        status: 'pending'
                                    }]);
                                    if (error) showNotification('error', t('competitions.error_creating_heat', { defaultValue: 'ERROR CREATING HEAT' }));
                                    else fetchHeats();
                                }} disabled={!selectedEventId} className="uppercase font-black text-xs tracking-widest gap-2 bg-white/5 hover:bg-primary hover:text-primary-foreground border border-white/10">
                                    <Plus className="h-4 w-4" /> {t('competitions.add_heat')}
                                </Button>
                            </>
                        )}

                        {viewMode === 'timeline' && (
                            <Button onClick={fetchAllHeats} variant="outline" className="uppercase font-bold text-xs tracking-widest gap-2 border-white/10 hover:bg-white/5">
                                Refresh
                            </Button>
                        )}
                    </div>
                </div>

                {viewMode === 'list' ? (
                    <HeatSchedule heats={heats as any} onHeatUpdate={fetchHeats} />
                ) : (
                    <TimelineView heats={allHeats} events={events} />
                )}
            </div>
        </div>
    );
};
