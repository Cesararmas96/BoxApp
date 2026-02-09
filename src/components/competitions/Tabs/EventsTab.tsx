import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage, useNotification } from '@/hooks';
import {
    ListChecks,
    Plus,
    Trash2,
    Timer,
    Dumbbell,
    Trophy,
    FileText,
    Video
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Competition, CompetitionEvent } from '@/types/competitions';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Switch } from '@/components/ui/switch';

interface EventsTabProps {
    competition: Competition;
}

export const EventsTab: React.FC<EventsTabProps> = ({ competition }) => {
    const { t } = useLanguage();
    const { currentBox } = useAuth();
    const { showNotification, showConfirm } = useNotification();

    const [events, setEvents] = useState<CompetitionEvent[]>([]);
    const [availableWods, setAvailableWods] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Form State
    const [newEvent, setNewEvent] = useState({
        title: '',
        wod_id: 'custom', // 'custom' or UUID
        wod_type: 'for_time',
        scoring_type: 'start_date', // defaults, will adjust
        time_cap_seconds: 0,
        description: '',
        standards_text: '',
        standards_video_url: '',
        tie_break_strategy: ''
    });

    useEffect(() => {
        if (currentBox && competition) {
            fetchEvents();
            fetchWods();
        }
    }, [currentBox, competition]);

    const fetchWods = async () => {
        if (!currentBox) return;
        const { data } = await supabase
            .from('wods')
            .select('id, title, date, structure')
            .eq('box_id', currentBox.id)
            .order('date', { ascending: false });
        if (data) setAvailableWods(data);
    };

    const fetchEvents = async () => {
        const { data, error } = await supabase
            .from('competition_events')
            .select('*')
            .eq('competition_id', competition.id)
            .order('order_index', { ascending: true });

        if (error) {
            console.error('Error fetching events:', error);
        } else if (data) {
            setEvents(data as unknown as CompetitionEvent[]);
        }
    };

    const handleWodSelect = (wodId: string) => {
        if (wodId === 'custom') {
            setNewEvent({ ...newEvent, wod_id: 'custom' });
            return;
        }

        const selectedWod = availableWods.find(w => w.id === wodId);
        if (selectedWod) {
            // Auto-fill details from WOD Structure
            let type = 'for_time';
            let timeCap = 0;
            let tieBreak = '';

            if (selectedWod.structure && Array.isArray(selectedWod.structure)) {
                // Find first main block
                const mainBlock = selectedWod.structure.find((b: any) =>
                    ['wod', 'conditioning', 'strength'].includes(b.type)
                );

                if (mainBlock) {
                    // Map format
                    if (mainBlock.format === 'amrap') type = 'amrap';
                    if (mainBlock.format === 'rm') type = 'rm';
                    // Complex usually rm
                    if (mainBlock.format === 'complex') type = 'complex';

                    // Parse Time Cap (often "12:00" or "15")
                    if (mainBlock.timeCap || mainBlock.duration) {
                        const timeStr = mainBlock.timeCap || mainBlock.duration;
                        const parts = timeStr.toString().split(':');
                        if (parts.length === 2) {
                            timeCap = (parseInt(parts[0]) * 60) + parseInt(parts[1]);
                        } else {
                            timeCap = parseInt(parts[0]) * 60;
                        }
                    }

                    if (mainBlock.tieBreak) tieBreak = mainBlock.tieBreak;
                }
            }

            setNewEvent({
                ...newEvent,
                wod_id: wodId,
                title: selectedWod.title,
                wod_type: type,
                time_cap_seconds: isNaN(timeCap) ? 0 : timeCap,
                tie_break_strategy: tieBreak
            });
        }
    };

    const handleAddEvent = async () => {
        if (!competition || !newEvent.title) return;

        // Determine scoring type based on wod_type if not explicitly set logic 
        // For simplicity, we map wod_type to scoring_type
        let scoringType = 'time'; // Default
        if (newEvent.wod_type === 'amrap' || newEvent.wod_type === 'max_reps') scoringType = 'reps';
        if (newEvent.wod_type === 'rm' || newEvent.wod_type === 'complex') scoringType = 'weight';

        const payload = {
            competition_id: competition.id,
            box_id: currentBox?.id,
            title: newEvent.title,
            wod_id: newEvent.wod_id === 'custom' ? null : newEvent.wod_id,
            wod_type: newEvent.wod_type,
            scoring_type: scoringType,
            description: newEvent.description,
            time_cap_seconds: newEvent.time_cap_seconds || null,
            standards_text: newEvent.standards_text,
            standards_video_url: newEvent.standards_video_url,
            tie_break_strategy: newEvent.tie_break_strategy,
            order_index: events.length + 1
        };

        const { error } = await supabase
            .from('competition_events')
            .insert([payload]);

        if (error) {
            showNotification('error', t('competitions.errors.add_event', { defaultValue: 'ERROR ADDING EVENT' }) + ': ' + error.message.toUpperCase());
        } else {
            showNotification('success', t('competitions.success.event_added', { defaultValue: 'EVENT ADDED TO COMPETITION' }));
            // Reset form
            setNewEvent({
                title: '',
                wod_id: 'custom',
                wod_type: 'for_time',
                scoring_type: 'time',
                time_cap_seconds: 0,
                description: '',
                standards_text: '',
                standards_video_url: '',
                tie_break_strategy: ''
            });
            fetchEvents();
        }
    };

    const handleRemoveEvent = async (eventId: string) => {
        showConfirm({
            title: t('common.confirm_delete', { defaultValue: 'CONFIRMAR ELIMINACIÓN' }),
            description: t('competitions.remove_event_warning', { defaultValue: '¿ESTÁS SEGURO DE QUE DESEAS ELIMINAR ESTE EVENTO? ESTA ACCIÓN NO SE PUEDE DESHACER.' }),
            onConfirm: async () => {
                const { error } = await supabase
                    .from('competition_events')
                    .delete()
                    .eq('id', eventId);

                if (error) {
                    showNotification('error', t('competitions.errors.remove_event', { defaultValue: 'ERROR REMOVING EVENT' }) + ': ' + error.message.toUpperCase());
                } else {
                    showNotification('success', t('competitions.success.event_removed', { defaultValue: 'EVENT REMOVED FROM COMPETITION' }));
                    fetchEvents();
                }
            },
            variant: 'destructive',
            icon: 'destructive'
        });
    };

    return (
        <div className="grid md:grid-cols-12 gap-10">
            {/* Left Column: Form */}
            <div className="md:col-span-5 space-y-6">
                <div className="space-y-2">
                    <h3 className="text-xl font-black italic uppercase tracking-tight flex items-center gap-3">
                        <Plus className="h-5 w-5 text-primary" />
                        {t('competitions.add_event')}
                    </h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{t('competitions.event_details')}</p>
                </div>

                <div className="space-y-4 bg-white/5 p-6 rounded-[2rem] border border-white/5">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('competitions.import_wod_lbl', { defaultValue: 'Import WOD (Optional)' })}</Label>
                        <Select
                            value={newEvent.wod_id || 'custom'}
                            onValueChange={handleWodSelect}
                        >
                            <SelectTrigger className="bg-zinc-900/50 border-white/10">
                                <SelectValue placeholder={t('competitions.select_wod_placeholder', { defaultValue: 'Select from WODs' })} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="custom">{t('competitions.custom_event', { defaultValue: 'Custom Event' })}</SelectItem>
                                {availableWods.map(wod => (
                                    <SelectItem key={wod.id} value={wod.id}>
                                        {wod.date} - {wod.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('common.title')}</Label>
                        <Input
                            value={newEvent.title}
                            onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                            placeholder="ex. Event 1: Fran"
                            className="bg-zinc-900/50 border-white/10"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('competitions.wod_type_lbl', { defaultValue: 'WOD Type' })}</Label>
                            <Select
                                value={newEvent.wod_type}
                                onValueChange={(v) => setNewEvent({ ...newEvent, wod_type: v })}
                            >
                                <SelectTrigger className="bg-zinc-900/50 border-white/10 uppercase font-black text-[10px]">
                                    <SelectValue placeholder={t('competitions.select_type_placeholder', { defaultValue: 'Select Type' })} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="for_time" className="font-black italic uppercase text-[10px] tracking-widest">FOR TIME</SelectItem>
                                    <SelectItem value="amrap" className="font-black italic uppercase text-[10px] tracking-widest">AMRAP</SelectItem>
                                    <SelectItem value="rm" className="font-black italic uppercase text-[10px] tracking-widest">RM</SelectItem>
                                    <SelectItem value="max_reps" className="font-black italic uppercase text-[10px] tracking-widest">MAX REPS</SelectItem>
                                    <SelectItem value="complex" className="font-black italic uppercase text-[10px] tracking-widest">COMPLEX</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Time Cap (sec)</Label>
                            <Input
                                type="number"
                                value={newEvent.time_cap_seconds || ''}
                                onChange={(e) => setNewEvent({ ...newEvent, time_cap_seconds: parseInt(e.target.value) || 0 })}
                                placeholder="ex. 600"
                                className="bg-zinc-900/50 border-white/10"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tie Break Strategy</Label>
                        <Input
                            value={newEvent.tie_break_strategy || ''}
                            onChange={(e) => setNewEvent({ ...newEvent, tie_break_strategy: e.target.value })}
                            placeholder="ex. Time after 3rd round"
                            className="bg-zinc-900/50 border-white/10"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('common.description')}</Label>
                        <Textarea
                            value={newEvent.description}
                            onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                            placeholder={t('competitions.event_desc_placeholder', { defaultValue: 'Describe the event...' })}
                            className="bg-zinc-900/50 border-white/10 min-h-[100px]"
                        />
                    </div>

                    <div className="space-y-2">
                        <Button
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black italic uppercase tracking-tighter h-12 rounded-xl"
                            onClick={handleAddEvent}
                        >
                            {t('competitions.add_to_comp', { defaultValue: 'Add to Competition' })}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Right Column: List */}
            <div className="md:col-span-7 space-y-6">
                <div className="space-y-2">
                    <h3 className="text-xl font-black italic uppercase tracking-tight flex items-center gap-3">
                        <ListChecks className="h-5 w-5 text-primary" />
                        {t('competitions.events_list')}
                        <Badge variant="outline" className="ml-auto font-black italic">{events.length}</Badge>
                    </h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{t('competitions.manage_events')}</p>
                </div>

                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                    {events.map((event, index) => (
                        <div key={event.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/30 transition-all group relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-colors" />
                            <div className="flex justify-between items-start gap-4 pl-2">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary" className="text-[9px] font-black uppercase bg-zinc-800 text-muted-foreground">
                                            #{index + 1}
                                        </Badge>
                                        <h4 className="font-black italic uppercase text-lg tracking-tight">{event.title}</h4>
                                    </div>
                                    <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                                        <span className="flex items-center gap-1"><Timer className="h-3 w-3" /> {event.wod_type?.replace('_', ' ')}</span>
                                        {event.time_cap_seconds && (
                                            <span className="flex items-center gap-1">CAP: {Math.floor(event.time_cap_seconds / 60)}:{(event.time_cap_seconds % 60).toString().padStart(2, '0')}</span>
                                        )}
                                    </div>
                                    {event.description && (
                                        <p className="text-xs text-muted-foreground line-clamp-2 mt-2">{event.description}</p>
                                    )}
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                                    onClick={() => handleRemoveEvent(event.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                    {events.length === 0 && (
                        <div className="py-20 text-center text-muted-foreground space-y-2 bg-white/5 rounded-[2rem] border-dashed border-2 border-white/10">
                            <Trophy className="h-10 w-10 mx-auto opacity-20" />
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-50">{t('competitions.no_events')}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
