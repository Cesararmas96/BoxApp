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
    UserPlus,
    Trash2,
    Users,
    BarChart,
    ListChecks,
    Search
} from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
    const [athletes, setAthletes] = useState<any[]>([]);
    const [participants, setParticipants] = useState<any[]>([]);
    const [events, setEvents] = useState<any[]>([]);
    const [availableWods, setAvailableWods] = useState<any[]>([]);
    const [searchAthlete, setSearchAthlete] = useState('');
    const [isManageOpen, setIsManageOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('participants');
    const [judges, setJudges] = useState<any[]>([]);
    const [staffMembers, setStaffMembers] = useState<any[]>([]);

    useEffect(() => {
        fetchCompetitions();
        fetchAthletes();
        fetchWods();
        fetchStaff();
    }, []);

    const fetchStaff = async () => {
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .in('role_id', ['admin', 'coach', 'receptionist']);
        if (data) setStaffMembers(data);
    };

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

    const fetchJudges = async (compId: string) => {
        const { data, error } = await supabase
            .from('competition_judges')
            .select('*, profile:profiles(*)')
            .eq('competition_id', compId);

        if (!error && data) setJudges(data);
    };

    const handleManageCompetition = (comp: Competition, tab: string = 'participants') => {
        setSelectedComp(comp);
        fetchParticipants(comp.id);
        fetchEvents(comp.id);
        fetchJudges(comp.id);
        setActiveTab(tab);
        setIsManageOpen(true);
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

    const handleAddJudge = async (profileId: string) => {
        if (!selectedComp) return;

        const { error } = await supabase
            .from('competition_judges')
            .insert([{
                competition_id: selectedComp.id,
                profile_id: profileId
            }]);

        if (error) {
            showNotification('error', 'ERROR ADDING JUDGE: ' + error.message.toUpperCase());
        } else {
            showNotification('success', 'JUDGE ASSIGNED TO COMPETITION');
            fetchJudges(selectedComp.id);
        }
    };

    const handleRemoveJudge = async (judgeId: string) => {
        const { error } = await supabase
            .from('competition_judges')
            .delete()
            .eq('id', judgeId);

        if (error) {
            showNotification('error', 'ERROR REMOVING JUDGE: ' + error.message.toUpperCase());
        } else {
            showNotification('success', 'JUDGE REMOVED FROM COMPETITION');
            if (selectedComp) fetchJudges(selectedComp.id);
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
                                        <Button variant="ghost" size="sm" className="h-8 text-[10px] uppercase font-black tracking-widest gap-1" onClick={() => handleManageCompetition(comp, 'participants')}>
                                            <Users className="h-3 w-3" /> {t('competitions.athletes')}
                                        </Button>
                                        <Button variant="ghost" size="sm" className="h-8 text-[10px] uppercase font-black tracking-widest gap-1" onClick={() => handleManageCompetition(comp, 'events')}>
                                            <ListChecks className="h-3 w-3" /> {t('competitions.events')}
                                        </Button>
                                        <Button size="sm" className="col-span-2 h-8 text-[10px] uppercase font-black tracking-widest gap-1" onClick={() => handleManageCompetition(comp, 'leaderboard')}>
                                            <BarChart className="h-3 w-3" /> {t('competitions.view_brackets')} <ChevronRight className="h-3 w-3" />
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

            {/* Consolidated Management Dialog */}
            <Dialog open={isManageOpen} onOpenChange={setIsManageOpen}>
                <DialogContent className="sm:max-w-[850px] max-h-[90vh] overflow-hidden p-0 gap-0">
                    <DialogHeader className="p-6 pb-0">
                        <DialogTitle className="uppercase italic font-black text-3xl tracking-tighter flex items-center gap-3">
                            <Trophy className="h-8 w-8 text-primary" />
                            {selectedComp?.title}
                        </DialogTitle>
                        <DialogDescription className="uppercase text-[10px] font-bold tracking-[0.2em] text-muted-foreground mt-1">
                            {t('competitions.manage_desc')}
                        </DialogDescription>
                    </DialogHeader>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-4 flex flex-col h-[calc(90vh-100px)]">
                        <div className="px-6 border-b bg-muted/20 flex-shrink-0">
                            <TabsList className="h-12 bg-transparent gap-6 p-0 w-full justify-start overflow-x-auto">
                                <TabsTrigger value="participants" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none h-full px-0 gap-2 uppercase text-[10px] font-black tracking-widest">
                                    <Users className="h-3 w-3" /> {t('competitions.athletes')}
                                </TabsTrigger>
                                <TabsTrigger value="events" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none h-full px-0 gap-2 uppercase text-[10px] font-black tracking-widest">
                                    <ListChecks className="h-3 w-3" /> {t('competitions.events')}
                                </TabsTrigger>
                                <TabsTrigger value="judges" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none h-full px-0 gap-2 uppercase text-[10px] font-black tracking-widest">
                                    <ShieldCheck className="h-3 w-3" /> {t('competitions.judges')}
                                </TabsTrigger>
                                <TabsTrigger value="leaderboard" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none h-full px-0 gap-2 uppercase text-[10px] font-black tracking-widest">
                                    <BarChart className="h-3 w-3" /> {t('competitions.leaderboard')}
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 min-h-0">
                            <TabsContent value="participants" className="mt-0 space-y-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div className="flex flex-col gap-2">
                                            <Label className="text-[10px] font-black uppercase text-muted-foreground">{t('common.search')}</Label>
                                            <div className="relative">
                                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    placeholder={t('competitions.search_placeholder')}
                                                    value={searchAthlete}
                                                    onChange={(e) => setSearchAthlete(e.target.value)}
                                                    className="pl-9 h-10"
                                                />
                                            </div>
                                        </div>
                                        <div className="border rounded-xl divide-y overflow-y-auto h-[400px] bg-muted/5 scrollbar-thin">
                                            {athletes
                                                .filter(a =>
                                                    !participants.some(p => p.athlete_id === a.id) &&
                                                    (`${a.first_name} ${a.last_name}`).toLowerCase().includes(searchAthlete.toLowerCase())
                                                )
                                                .map(athlete => (
                                                    <div key={athlete.id} className="p-3 flex items-center justify-between hover:bg-muted/50 transition-colors">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold border border-primary/5">
                                                                {athlete.first_name?.[0]}{athlete.last_name?.[0]}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold">{athlete.first_name} {athlete.last_name}</p>
                                                                <p className="text-[10px] text-muted-foreground">{athlete.email}</p>
                                                            </div>
                                                        </div>
                                                        <Button size="sm" variant="outline" className="h-8 px-3 text-[10px] uppercase font-black gap-1" onClick={() => handleAddParticipant(athlete.id)}>
                                                            <Plus className="h-3 w-3" /> {t('common.add')}
                                                        </Button>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-[10px] font-black uppercase text-muted-foreground">
                                                {t('competitions.registered_count', { count: participants.length })}
                                            </Label>
                                            <Badge variant="outline" className="text-[8px] font-black px-1.5 h-4 uppercase">{t('competitions.total')}: {participants.length}</Badge>
                                        </div>
                                        <div className="border rounded-xl divide-y overflow-y-auto h-[400px] bg-primary/5 scrollbar-thin border-primary/10">
                                            {participants.length === 0 ? (
                                                <div className="h-full flex flex-col items-center justify-center p-8 text-center text-muted-foreground italic">
                                                    <Users className="h-8 w-8 opacity-20 mb-2" />
                                                    <p className="text-xs">{t('competitions.no_athletes')}</p>
                                                </div>
                                            ) : (
                                                participants.map(p => (
                                                    <div key={p.id} className="p-3 flex items-center justify-between group hover:bg-primary/5 transition-colors">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-black shadow-sm">
                                                                {p.athlete?.first_name?.[0]}{p.athlete?.last_name?.[0]}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-bold">{p.athlete?.first_name} {p.athlete?.last_name}</span>
                                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                                    <Badge className="text-[8px] h-3.5 px-1 uppercase font-black tracking-tighter">{p.category}</Badge>
                                                                    <span className="text-[8px] uppercase font-bold text-muted-foreground">#{p.id.slice(0, 4)}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            onClick={() => handleRemoveParticipant(p.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="events" className="mt-0 space-y-6">
                                <div className="bg-primary/5 p-5 rounded-2xl border border-primary/10 mb-8">
                                    <h4 className="font-black italic text-sm mb-4 uppercase tracking-tighter flex items-center gap-2">
                                        <Plus className="h-4 w-4" /> {t('competitions.add_event')}
                                    </h4>
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase text-muted-foreground px-1">{t('competitions.event_name')}</Label>
                                            <Input
                                                placeholder="e.g. Event 1: Heavy Grace"
                                                value={newEventName}
                                                onChange={(e) => setNewEventName(e.target.value)}
                                                className="bg-background h-11"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase text-muted-foreground px-1">{t('competitions.select_wod')}</Label>
                                            <Select value={selectedWodId} onValueChange={setSelectedWodId}>
                                                <SelectTrigger className="bg-background h-11">
                                                    <SelectValue placeholder={t('competitions.select_wod_placeholder')} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {availableWods.map(wod => (
                                                        <SelectItem key={wod.id} value={wod.id} className="text-xs">{wod.title}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <Button className="w-full mt-5 h-11 uppercase font-black tracking-widest gap-2 shadow-sm" onClick={handleAddEvent}>
                                        <Plus className="h-4 w-4" /> {t('competitions.add_event_btn')}
                                    </Button>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="font-black italic text-sm uppercase tracking-tighter text-muted-foreground px-1 flex items-center gap-2">
                                        <ListChecks className="h-4 w-4" /> {t('competitions.linked_events')}
                                    </h4>
                                    {events.length === 0 ? (
                                        <div className="text-center py-12 border-2 border-dashed rounded-2xl bg-muted/5">
                                            <ListChecks className="h-10 w-10 mx-auto text-muted-foreground opacity-20 mb-3" />
                                            <p className="text-xs text-muted-foreground italic">{t('competitions.no_events')}</p>
                                        </div>
                                    ) : (
                                        <div className="grid gap-3">
                                            {events.map((event, index) => (
                                                <div key={event.id} className="flex items-center justify-between p-4 bg-background border rounded-xl group hover:border-primary transition-all shadow-sm">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-10 w-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-black italic shadow-inner">
                                                            {index + 1}
                                                        </div>
                                                        <div>
                                                            <p className="font-black italic text-base uppercase tracking-tight">{event.name}</p>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <Badge variant="secondary" className="text-[8px] h-3.5 px-1 font-bold uppercase">{t('competitions.order')}: {event.order_index}</Badge>
                                                                <span className="text-[10px] text-muted-foreground font-medium">#{event.id.slice(0, 8)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-50"
                                                        onClick={() => handleRemoveEvent(event.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="judges" className="mt-0 space-y-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <Label className="text-[10px] font-black uppercase text-muted-foreground">{t('competitions.available_staff')}</Label>
                                        <div className="border rounded-xl divide-y overflow-y-auto h-[450px] bg-muted/5 scrollbar-thin">
                                            {staffMembers
                                                .filter(s => !judges.some(j => j.profile_id === s.id))
                                                .map(staff => (
                                                    <div key={staff.id} className="p-3 flex items-center justify-between hover:bg-muted/50 transition-colors">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-10 w-10 rounded-full bg-zinc-100 flex items-center justify-center text-xs font-bold border border-zinc-200">
                                                                {staff.first_name?.[0]}{staff.last_name?.[0]}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold">{staff.first_name} {staff.last_name}</p>
                                                                <Badge variant="outline" className="text-[8px] h-3.5 px-1 uppercase font-black">{staff.role_id}</Badge>
                                                            </div>
                                                        </div>
                                                        <Button size="sm" variant="outline" className="h-8 px-3 text-[10px] uppercase font-black gap-1" onClick={() => handleAddJudge(staff.id)}>
                                                            <UserPlus className="h-3 w-3" /> {t('competitions.appoint')}
                                                        </Button>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <Label className="text-[10px] font-black uppercase text-muted-foreground">{t('competitions.appointed_judges')}</Label>
                                        <div className="border rounded-xl divide-y overflow-y-auto h-[450px] bg-primary/5 scrollbar-thin border-primary/10">
                                            {judges.length === 0 ? (
                                                <div className="h-full flex flex-col items-center justify-center p-8 text-center text-muted-foreground italic">
                                                    <ShieldCheck className="h-8 w-8 opacity-20 mb-2" />
                                                    <p className="text-xs">{t('competitions.no_judges')}</p>
                                                </div>
                                            ) : (
                                                judges.map(judge => (
                                                    <div key={judge.id} className="p-3 flex items-center justify-between group hover:bg-primary/5 transition-colors">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-black shadow-sm">
                                                                {judge.profile?.first_name?.[0]}{judge.profile?.last_name?.[0]}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold">{judge.profile?.first_name} {judge.profile?.last_name}</p>
                                                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">{t('competitions.official_judge')}</p>
                                                            </div>
                                                        </div>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            onClick={() => handleRemoveJudge(judge.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="leaderboard" className="mt-0">
                                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-muted/10 rounded-3xl border-2 border-dashed border-muted">
                                    <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                                        <BarChart className="h-10 w-10 text-primary animate-pulse" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black italic uppercase tracking-tighter">{t('competitions.leaderboard_live')}</h3>
                                        <p className="text-muted-foreground text-xs max-w-xs mx-auto mt-2">
                                            {t('competitions.leaderboard_placeholder')}
                                        </p>
                                    </div>
                                    <Button variant="outline" className="mt-6 border-primary/20 hover:bg-primary/10 hover:text-primary uppercase font-black tracking-widest text-[10px] h-10 px-6 gap-2">
                                        <Settings className="h-3 w-3" /> {t('competitions.configure_brackets')}
                                    </Button>

                                    <div className="grid grid-cols-3 gap-8 mt-12 w-full max-w-md">
                                        <div className="flex flex-col items-center">
                                            <div className="w-12 h-1 bg-zinc-200 rounded-full mb-2"></div>
                                            <div className="w-8 h-8 rounded bg-zinc-100 mb-1"></div>
                                            <div className="w-10 h-2 bg-zinc-50 rounded"></div>
                                        </div>
                                        <div className="flex flex-col items-center -mt-4">
                                            <div className="w-12 h-1 bg-primary rounded-full mb-2"></div>
                                            <div className="w-8 h-8 rounded bg-primary/20 mb-1"></div>
                                            <div className="w-10 h-2 bg-primary/10 rounded"></div>
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <div className="w-12 h-1 bg-zinc-200 rounded-full mb-2"></div>
                                            <div className="w-8 h-8 rounded bg-zinc-100 mb-1"></div>
                                            <div className="w-10 h-2 bg-zinc-50 rounded"></div>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>
                </DialogContent>
            </Dialog>

            <div className="grid gap-6 md:grid-cols-2 mt-8">
                <Card className="bg-primary/5 border-primary/10 group hover:border-primary transition-all">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-primary uppercase italic text-sm tracking-tight">
                            <ShieldCheck className="h-5 w-5" /> {t('competitions.judge_mgt')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{t('competitions.judge_desc')}</p>
                        <Button variant="outline" className="w-full gap-2 border-primary/20 hover:bg-primary/10 hover:text-primary uppercase font-black text-[10px] tracking-widest h-10" onClick={() => {
                            if (competitions.length > 0) handleManageCompetition(competitions[0], 'judges');
                        }}>
                            <UserPlus className="h-4 w-4" /> {t('competitions.manage_judges')}
                        </Button>
                    </CardContent>
                </Card>

                <Card className="group hover:border-primary transition-all">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 uppercase italic text-sm tracking-tight">
                            <Medal className="h-5 w-5 text-yellow-500" /> {t('competitions.scoring_system')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{t('competitions.scoring_desc')}</p>
                        <Button variant="outline" className="w-full gap-2 uppercase font-black text-[10px] tracking-widest h-10">
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
        </div>
    );
};

export default Competitions;
