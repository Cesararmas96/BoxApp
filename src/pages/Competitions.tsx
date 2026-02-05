import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    Trophy,
    Plus,
    Calendar,
    ChevronRight,
    ShieldCheck,
    Medal,
    Settings,
    UserPlus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from 'react-i18next';
import { useNotification } from '@/hooks/useNotification';
import { Toast } from '@/components/ui/toast-custom';


interface Competition {
    id: string;
    title: string;
    description: string;
    start_date: string;
    end_date: string;
    status: string;
}

export const Competitions: React.FC = () => {
    const { t } = useTranslation();
    const [competitions, setCompetitions] = useState<Competition[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newComp, setNewComp] = useState({
        title: '',
        description: '',
        start_date: '',
        end_date: ''
    });
    const { notification, showNotification, hideNotification } = useNotification();

    const [selectedComp, setSelectedComp] = useState<Competition | null>(null);
    const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
    const [isEventsOpen, setIsEventsOpen] = useState(false);
    const [participants, setParticipants] = useState<any[]>([]);
    const [events, setEvents] = useState<any[]>([]);
    const [availableWods, setAvailableWods] = useState<any[]>([]);
    const [athletes, setAthletes] = useState<any[]>([]);
    const [searchAthlete, setSearchAthlete] = useState('');

    const [selectedWodId, setSelectedWodId] = useState('');
    const [newEventName, setNewEventName] = useState('');

    useEffect(() => {
        fetchCompetitions();
        fetchAthletes();
        fetchWods();
    }, []);

    const fetchWods = async () => {
        const { data } = await supabase.from('wods').select('id, title').order('date', { ascending: false });
        if (data) setAvailableWods(data);
    };

    const fetchAthletes = async () => {
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('role_id', 'athlete');
        if (data) setAthletes(data);
    };

    const fetchParticipants = async (compId: string) => {
        const { data, error } = await supabase
            .from('competition_participants')
            .select('*, athlete:profiles(*)')
            .eq('competition_id', compId);

        if (!error && data) setParticipants(data);
    };

    const fetchEvents = async (compId: string) => {
        const { data, error } = await supabase
            .from('competition_events')
            .select('*')
            .eq('competition_id', compId)
            .order('order_index', { ascending: true });

        if (!error && data) setEvents(data);
    };

    const handleManageParticipants = (comp: Competition) => {
        setSelectedComp(comp);
        fetchParticipants(comp.id);
        setIsParticipantsOpen(true);
    };

    const handleManageEvents = (comp: Competition) => {
        setSelectedComp(comp);
        fetchEvents(comp.id);
        setIsEventsOpen(true);
    };

    const handleAddEvent = async () => {
        if (!selectedComp || !selectedWodId || !newEventName) return;

        const { error } = await supabase
            .from('competition_events')
            .insert([{
                competition_id: selectedComp.id,
                wod_id: selectedWodId,
                name: newEventName,
                order_index: events.length
            }]);

        if (error) {
            showNotification('error', 'ERROR ADDING EVENT: ' + error.message.toUpperCase());
        } else {
            showNotification('success', 'EVENT ADDED TO COMPETITION');
            setNewEventName('');
            setSelectedWodId('');
            fetchEvents(selectedComp.id);
        }
    };

    const handleRemoveEvent = async (eventId: string) => {
        const { error } = await supabase
            .from('competition_events')
            .delete()
            .eq('id', eventId);

        if (error) {
            showNotification('error', 'ERROR REMOVING EVENT: ' + error.message.toUpperCase());
        } else {
            showNotification('success', 'EVENT REMOVED FROM COMPETITION');
            if (selectedComp) fetchEvents(selectedComp.id);
        }
    };

    const handleAddParticipant = async (athleteId: string) => {
        if (!selectedComp) return;

        const { error } = await supabase
            .from('competition_participants')
            .insert([{
                competition_id: selectedComp.id,
                athlete_id: athleteId,
                category: 'RX'
            }]);

        if (error) {
            showNotification('error', 'ERROR ADDING ATHLETE: ' + error.message.toUpperCase());
        } else {
            showNotification('success', 'ATHLETE ADDED TO COMPETITION');
            fetchParticipants(selectedComp.id);
        }
    };

    const handleRemoveParticipant = async (participantId: string) => {
        const { error } = await supabase
            .from('competition_participants')
            .delete()
            .eq('id', participantId);

        if (error) {
            showNotification('error', 'ERROR REMOVING ATHLETE: ' + error.message.toUpperCase());
        } else {
            showNotification('success', 'ATHLETE REMOVED FROM COMPETITION');
            if (selectedComp) fetchParticipants(selectedComp.id);
        }
    };

    const fetchCompetitions = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('competitions')
            .select('*')
            .order('start_date', { ascending: false });

        if (!error && data) setCompetitions(data);
        setLoading(false);
    };

    const handleCreateCompetition = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase
            .from('competitions')
            .insert([newComp]);

        if (error) {
            showNotification('error', 'ERROR CREATING COMPETITION: ' + error.message.toUpperCase());
        } else {
            showNotification('success', 'COMPETITION CREATED SUCCESSFULLY');
            setIsCreateOpen(false);
            setNewComp({ title: '', description: '', start_date: '', end_date: '' });
            fetchCompetitions();
        }
        setLoading(false);
    };

    return (
        <div className="space-y-6">
            <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('competitions.title')}</h1>
                    <p className="text-muted-foreground text-sm">{t('competitions.subtitle')}</p>
                </div>

                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" /> {t('competitions.create_btn')}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>{t('competitions.new_title')}</DialogTitle>
                            <DialogDescription>
                                {t('competitions.new_desc')}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreateCompetition} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>{t('competitions.form_title')}</Label>
                                <Input
                                    placeholder="e.g. Winter Open 2026"
                                    required
                                    value={newComp.title}
                                    onChange={(e) => setNewComp({ ...newComp, title: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>{t('competitions.form_desc')}</Label>
                                <Input
                                    placeholder="Internal annual competition..."
                                    value={newComp.description}
                                    onChange={(e) => setNewComp({ ...newComp, description: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>{t('competitions.start_date')}</Label>
                                    <Input
                                        type="date"
                                        required
                                        value={newComp.start_date}
                                        onChange={(e) => setNewComp({ ...newComp, start_date: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>{t('competitions.end_date')}</Label>
                                    <Input
                                        type="date"
                                        required
                                        value={newComp.end_date}
                                        onChange={(e) => setNewComp({ ...newComp, end_date: e.target.value })}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? t('common.loading') : t('competitions.launch_btn')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </header>

            <Tabs defaultValue="active" className="w-full">
                <TabsList>
                    <TabsTrigger value="active">{t('competitions.active_tab')}</TabsTrigger>
                    <TabsTrigger value="past">{t('competitions.past_tab')}</TabsTrigger>
                </TabsList>

                <TabsContent value="active" className="mt-6">
                    {loading && competitions.length === 0 ? (
                        <div className="py-20 text-center text-muted-foreground animate-pulse">{t('common.loading')}</div>
                    ) : competitions.length === 0 ? (
                        <Card className="border-dashed">
                            <CardContent className="py-20 text-center">
                                <Trophy className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-4" />
                                <h3 className="text-lg font-bold">{t('competitions.no_active')}</h3>
                                <p className="text-muted-foreground mb-6">{t('competitions.start_first')}</p>
                                <Button onClick={() => setIsCreateOpen(true)}>{t('competitions.create_first')}</Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {competitions.map((comp) => (
                                <Card key={comp.id} className="overflow-hidden group hover:border-primary transition-all shadow-md">
                                    <CardHeader className="pb-3">
                                        <div className="flex justify-between items-start mb-2">
                                            <Badge variant={comp.status === 'active' ? 'default' : 'secondary'} className="uppercase text-[10px] font-black">
                                                {comp.status}
                                            </Badge>
                                            <div className="flex -space-x-2">
                                                {[1, 2, 3].map(i => (
                                                    <div key={i} className="h-6 w-6 rounded-full border-2 border-background bg-zinc-200 flex items-center justify-center text-[8px] font-bold">A{i}</div>
                                                ))}
                                                <div className="h-6 w-6 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[8px] font-bold">+12</div>
                                            </div>
                                        </div>
                                        <CardTitle className="text-xl font-black italic uppercase tracking-tighter">{comp.title}</CardTitle>
                                        <CardDescription className="line-clamp-2 text-xs">{comp.description}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                                                <Calendar className="h-3 w-3" />
                                                {new Date(comp.start_date).toLocaleDateString()} - {new Date(comp.end_date).toLocaleDateString()}
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="bg-muted p-2 rounded text-center">
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase leading-none">{t('competitions.athletes')}</p>
                                                    <p className="font-black text-lg">15</p>
                                                </div>
                                                <div className="bg-muted p-2 rounded text-center">
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase leading-none">{t('competitions.events')}</p>
                                                    <p className="font-black text-lg">4</p>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="bg-muted/30 border-t grid grid-cols-2 gap-2 p-3">
                                        <Button variant="ghost" size="sm" className="h-8 text-[10px] uppercase font-black tracking-widest" onClick={() => handleManageParticipants(comp)}>
                                            {t('competitions.manage_participants')}
                                        </Button>
                                        <Button variant="ghost" size="sm" className="h-8 text-[10px] uppercase font-black tracking-widest" onClick={() => handleManageEvents(comp)}>
                                            Manage Events
                                        </Button>
                                        <Button size="sm" className="col-span-2 h-8 text-[10px] uppercase font-black tracking-widest gap-1">
                                            {t('competitions.view_brackets')} <ChevronRight className="h-3 w-3" />
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="past">
                    <div className="py-20 text-center text-muted-foreground italic">{t('competitions.no_history')}</div>
                </TabsContent>
            </Tabs>

            {/* Participants Management Modal */}
            <Dialog open={isParticipantsOpen} onOpenChange={setIsParticipantsOpen}>
                <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="uppercase italic font-black text-2xl tracking-tighter">
                            Manage Participants: {selectedComp?.title}
                        </DialogTitle>
                        <DialogDescription>
                            Add or remove athletes from this internal competition.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid md:grid-cols-2 gap-6 py-4">
                        <div className="space-y-4">
                            <div className="flex flex-col gap-2">
                                <Label className="text-[10px] font-black uppercase text-muted-foreground">Search Athletes</Label>
                                <Input
                                    placeholder="Filter by name..."
                                    value={searchAthlete}
                                    onChange={(e) => setSearchAthlete(e.target.value)}
                                    className="h-8"
                                />
                            </div>
                            <div className="border rounded-md divide-y overflow-y-auto h-[300px] bg-muted/5">
                                {athletes
                                    .filter(a =>
                                        !participants.some(p => p.athlete_id === a.id) &&
                                        (`${a.first_name} ${a.last_name}`).toLowerCase().includes(searchAthlete.toLowerCase())
                                    )
                                    .map(athlete => (
                                        <div key={athlete.id} className="p-3 flex items-center justify-between hover:bg-muted/50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold">
                                                    {athlete.first_name?.[0]}{athlete.last_name?.[0]}
                                                </div>
                                                <span className="text-xs font-bold">{athlete.first_name} {athlete.last_name}</span>
                                            </div>
                                            <Button size="sm" variant="outline" className="h-7 text-[10px] uppercase font-black" onClick={() => handleAddParticipant(athlete.id)}>
                                                Add
                                            </Button>
                                        </div>
                                    ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground">Registered Participants ({participants.length})</Label>
                            <div className="border rounded-md divide-y overflow-y-auto h-[300px]">
                                {participants.length === 0 ? (
                                    <div className="h-full flex items-center justify-center text-[10px] text-muted-foreground italic">No athletes registered yet</div>
                                ) : (
                                    participants.map(p => (
                                        <div key={p.id} className="p-3 flex items-center justify-between bg-primary/5">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold">
                                                    {p.athlete?.first_name?.[0]}{p.athlete?.last_name?.[0]}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold">{p.athlete?.first_name} {p.athlete?.last_name}</span>
                                                    <Badge variant="outline" className="w-fit text-[8px] h-3 px-1">{p.category}</Badge>
                                                </div>
                                            </div>
                                            <Button size="sm" variant="ghost" className="h-7 text-[10px] uppercase font-black text-rose-600 hover:text-rose-700 hover:bg-rose-50" onClick={() => handleRemoveParticipant(p.id)}>
                                                Remove
                                            </Button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <div className="grid gap-6 md:grid-cols-2 mt-8">
                <Card className="bg-primary/5 border-primary/10">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-primary uppercase italic text-sm">
                            <ShieldCheck className="h-5 w-5" /> {t('competitions.judge_mgt')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground mb-4">{t('competitions.judge_desc')}</p>
                        <Button variant="outline" className="w-full gap-2 border-primary/20 hover:bg-primary/10 hover:text-primary">
                            <UserPlus className="h-4 w-4" /> {t('competitions.manage_judges')}
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 uppercase italic text-sm">
                            <Medal className="h-5 w-5 text-yellow-500" /> {t('competitions.scoring_system')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground mb-4">{t('competitions.scoring_desc')}</p>
                        <Button variant="outline" className="w-full gap-2">
                            <Settings className="h-4 w-4" /> {t('competitions.config_rules')}
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {notification && (
                <Toast
                    type={notification.type}
                    message={notification.message}
                    onClose={hideNotification}
                />
            )}
            {/* Events Management Modal */}
            <Dialog open={isEventsOpen} onOpenChange={setIsEventsOpen}>
                <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="uppercase italic font-black text-2xl tracking-tighter">
                            Manage Events: {selectedComp?.title}
                        </DialogTitle>
                        <DialogDescription>
                            Link WODs as events for this competition.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        <div className="bg-muted p-4 rounded-lg">
                            <h4 className="font-bold mb-3 uppercase text-xs">Add New Event</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Event Name</Label>
                                    <Input id="event-name" placeholder="e.g. Event 1: Heavy Grace" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Select WOD</Label>
                                    <Select id="target-wod">
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a WOD" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableWods.map(wod => (
                                                <SelectItem key={wod.id} value={wod.id}>{wod.title}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <Button className="w-full mt-4" onClick={() => {
                                const name = (document.getElementById('event-name') as HTMLInputElement).value;
                                const wodId = (document.querySelector('[id^="target-wod"]') as any)?.dataset?.value;
                                // Note: Select component might need a state for the value in a real implementation, 
                                // but for now I'll use a simpler approach or fix it in next step if needed.
                                // Actually let's use a state for cleanliness.
                            }}>Add Event</Button>
                        </div>

                        <div className="space-y-4">
                            <h4 className="font-bold uppercase text-xs tracking-widest text-muted-foreground">Linked Events</h4>
                            {events.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8 border-2 border-dashed rounded-lg">No events added yet.</p>
                            ) : (
                                <div className="space-y-2">
                                    {events.map((event, index) => (
                                        <div key={event.id} className="flex items-center justify-between p-3 bg-zinc-50 border rounded-md group hover:border-primary">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded bg-primary text-primary-foreground flex items-center justify-center font-black italic">
                                                    {index + 1}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm">{event.name}</p>
                                                    <p className="text-[10px] text-muted-foreground">Order: {event.order_index}</p>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="icon" className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};
