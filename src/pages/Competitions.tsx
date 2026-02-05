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
    const [newEventName, setNewEventName] = useState('');
    const [selectedWodId, setSelectedWodId] = useState('');

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
        <div className="p-6 lg:p-10 space-y-10 max-w-7xl mx-auto pb-20">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter text-foreground leading-none">
                        {t('competitions.title')}
                    </h1>
                    <p className="text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground/60 px-1">
                        {t('competitions.subtitle')}
                    </p>
                </div>

                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="h-14 px-8 rounded-2xl gap-3 shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] font-black uppercase tracking-widest text-xs">
                            <Plus className="h-5 w-5" />
                            {t('competitions.create_btn')}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden border-white/10 glass rounded-[2.5rem]">
                        <div className="bg-primary/10 p-10 border-b border-white/5 relative overflow-hidden">
                            <Trophy className="absolute -right-10 -bottom-10 h-40 w-40 text-primary/5 -rotate-12" />
                            <DialogHeader>
                                <DialogTitle className="text-4xl font-black italic uppercase tracking-tighter">{t('competitions.new_title')}</DialogTitle>
                                <DialogDescription className="uppercase text-[10px] font-bold tracking-[0.2em] text-primary/60">
                                    {t('competitions.new_desc')}
                                </DialogDescription>
                            </DialogHeader>
                        </div>
                        <form onSubmit={handleCreateCompetition} className="p-10 space-y-8">
                            <div className="space-y-3">
                                <Label className="px-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">{t('competitions.form_title')}</Label>
                                <Input
                                    placeholder="e.g. Winter Open 2026"
                                    required
                                    value={newComp.title}
                                    onChange={(e) => setNewComp({ ...newComp, title: e.target.value })}
                                    className="h-14 bg-white/5 border-white/10 text-lg font-bold rounded-2xl focus:ring-primary/20 px-6"
                                />
                            </div>
                            <div className="space-y-3">
                                <Label className="px-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">{t('competitions.form_desc')}</Label>
                                <Input
                                    placeholder="Internal annual competition..."
                                    value={newComp.description}
                                    onChange={(e) => setNewComp({ ...newComp, description: e.target.value })}
                                    className="h-14 bg-white/5 border-white/10 text-lg font-bold rounded-2xl focus:ring-primary/20 px-6"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <Label className="px-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">{t('competitions.start_date')}</Label>
                                    <Input
                                        type="date"
                                        required
                                        value={newComp.start_date}
                                        onChange={(e) => setNewComp({ ...newComp, start_date: e.target.value })}
                                        className="h-14 bg-white/5 border-white/10 font-bold rounded-2xl focus:ring-primary/20 px-6"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <Label className="px-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">{t('competitions.end_date')}</Label>
                                    <Input
                                        type="date"
                                        required
                                        value={newComp.end_date}
                                        onChange={(e) => setNewComp({ ...newComp, end_date: e.target.value })}
                                        className="h-14 bg-white/5 border-white/10 font-bold rounded-2xl focus:ring-primary/20 px-6"
                                    />
                                </div>
                            </div>
                            <DialogFooter className="pt-4">
                                <Button type="submit" className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20" disabled={loading}>
                                    {loading ? t('common.loading') : t('competitions.launch_btn')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </header>

            <Tabs defaultValue="active" className="w-full">
                <TabsList className="bg-transparent border-b rounded-none h-12 p-0 gap-8">
                    <TabsTrigger value="active" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none h-full px-0 font-black uppercase text-[10px] tracking-widest">{t('competitions.active_tab')}</TabsTrigger>
                    <TabsTrigger value="past" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none h-full px-0 font-black uppercase text-[10px] tracking-widest">{t('competitions.past_tab')}</TabsTrigger>
                </TabsList>

                <TabsContent value="active" className="mt-10">
                    {loading && competitions.length === 0 ? (
                        <div className="py-20 text-center text-muted-foreground animate-pulse font-black uppercase tracking-widest text-xs">{t('common.loading')}</div>
                    ) : competitions.length === 0 ? (
                        <Card className="border-dashed border-2 bg-primary/5 rounded-[2.5rem]">
                            <CardContent className="py-24 text-center">
                                <Trophy className="h-20 w-20 mx-auto text-primary/20 mb-6" />
                                <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-2">{t('competitions.no_active')}</h3>
                                <p className="text-muted-foreground text-sm mb-8 max-w-xs mx-auto">{t('competitions.start_first')}</p>
                                <Button onClick={() => setIsCreateOpen(true)} className="rounded-xl px-8 h-12 font-black uppercase tracking-widest text-xs">{t('competitions.create_first')}</Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                            {competitions.map((comp) => (
                                <Card key={comp.id} className="overflow-hidden group hover:border-primary/30 transition-all duration-500 shadow-xl hover:shadow-primary/5 border-white/5 glass rounded-[2rem] flex flex-col">
                                    <CardHeader className="pb-4 pt-8 px-8">
                                        <div className="flex justify-between items-start mb-4">
                                            <Badge variant="glow" className="uppercase text-[10px] font-black px-3 py-1 rounded-full border-primary/20">
                                                {comp.status}
                                            </Badge>
                                            <div className="flex -space-x-3">
                                                {[1, 2, 3].map(i => (
                                                    <div key={i} className="h-8 w-8 rounded-full border-2 border-zinc-900 bg-zinc-800 flex items-center justify-center text-[8px] font-black text-white shadow-lg overflow-hidden relative">
                                                        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent" />
                                                        A{i}
                                                    </div>
                                                ))}
                                                <div className="h-8 w-8 rounded-full border-2 border-zinc-900 bg-zinc-900/50 backdrop-blur-md flex items-center justify-center text-[8px] font-black text-primary shadow-lg">+12</div>
                                            </div>
                                        </div>
                                        <CardTitle className="text-3xl font-black italic uppercase tracking-tighter mb-2 group-hover:text-primary transition-colors">{comp.title}</CardTitle>
                                        <CardDescription className="line-clamp-2 text-xs font-medium text-muted-foreground/70 leading-relaxed uppercase tracking-wide">
                                            {comp.description}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="px-8 pb-8 flex-1">
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-2.5 text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">
                                                <Calendar className="h-4 w-4 text-primary/40" />
                                                {new Date(comp.start_date).toLocaleDateString()} - {new Date(comp.end_date).toLocaleDateString()}
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 text-center transition-transform group-hover:scale-[1.02]">
                                                    <p className="text-[10px] font-black text-primary/60 uppercase leading-none mb-2 tracking-widest">{t('competitions.athletes')}</p>
                                                    <p className="font-black italic text-2xl tracking-tighter">15</p>
                                                </div>
                                                <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 text-center transition-transform group-hover:scale-[1.02]">
                                                    <p className="text-[10px] font-black text-primary/60 uppercase leading-none mb-2 tracking-widest">{t('competitions.events')}</p>
                                                    <p className="font-black italic text-2xl tracking-tighter">4</p>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="bg-white/5 border-t border-white/5 grid grid-cols-2 gap-3 p-6 mt-auto">
                                        <Button variant="ghost" size="sm" className="h-10 text-[10px] uppercase font-black tracking-widest gap-2 bg-white/5 hover:bg-white/10 rounded-xl" onClick={() => handleManageCompetition(comp, 'participants')}>
                                            <Users className="h-4 w-4 text-primary" /> {t('competitions.athletes')}
                                        </Button>
                                        <Button variant="ghost" size="sm" className="h-10 text-[10px] uppercase font-black tracking-widest gap-2 bg-white/5 hover:bg-white/10 rounded-xl" onClick={() => handleManageCompetition(comp, 'events')}>
                                            <ListChecks className="h-4 w-4 text-primary" /> {t('competitions.events')}
                                        </Button>
                                        <Button className="col-span-2 h-12 text-[10px] uppercase font-black tracking-widest gap-2 rounded-xl shadow-lg shadow-primary/10 group/btn" onClick={() => handleManageCompetition(comp, 'leaderboard')}>
                                            <BarChart className="h-4 w-4" /> {t('competitions.view_brackets')}
                                            <ChevronRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
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
                <DialogContent className="sm:max-w-[950px] max-h-[90vh] overflow-hidden p-0 gap-0 border-white/10 glass rounded-[3rem] shadow-2xl">
                    <div className="bg-primary/10 p-10 border-b border-white/5 relative overflow-hidden flex-shrink-0">
                        <Trophy className="absolute -right-10 -bottom-10 h-48 w-48 text-primary/5 -rotate-12" />
                        <DialogHeader>
                            <DialogTitle className="uppercase italic font-black text-4xl md:text-5xl tracking-tighter flex items-center gap-4">
                                <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                                    <Trophy className="h-8 w-8 text-primary-foreground" />
                                </div>
                                {selectedComp?.title}
                            </DialogTitle>
                            <DialogDescription className="uppercase text-[10px] font-bold tracking-[0.3em] text-primary/60 mt-4 px-1 flex items-center gap-2">
                                <div className="h-1 w-1 rounded-full bg-primary" />
                                {t('competitions.manage_desc')}
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col h-[calc(90vh-160px)]">
                        <div className="px-10 border-b bg-white/5 flex-shrink-0">
                            <TabsList className="h-16 bg-transparent gap-10 p-0 w-full justify-start overflow-x-auto scrollbar-none">
                                <TabsTrigger value="participants" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none h-full px-0 gap-2.5 uppercase text-[10px] font-black tracking-[0.15em] transition-all hover:text-primary/70">
                                    <Users className="h-4 w-4" /> {t('competitions.athletes')}
                                </TabsTrigger>
                                <TabsTrigger value="events" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none h-full px-0 gap-2.5 uppercase text-[10px] font-black tracking-[0.15em] transition-all hover:text-primary/70">
                                    <ListChecks className="h-4 w-4" /> {t('competitions.events')}
                                </TabsTrigger>
                                <TabsTrigger value="judges" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none h-full px-0 gap-2.5 uppercase text-[10px] font-black tracking-[0.15em] transition-all hover:text-primary/70">
                                    <ShieldCheck className="h-4 w-4" /> {t('competitions.judges')}
                                </TabsTrigger>
                                <TabsTrigger value="leaderboard" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none h-full px-0 gap-2.5 uppercase text-[10px] font-black tracking-[0.15em] transition-all hover:text-primary/70">
                                    <BarChart className="h-4 w-4" /> {t('competitions.leaderboard')}
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="flex-1 overflow-y-auto p-10 min-h-0 bg-white/5">
                            <TabsContent value="participants" className="mt-0 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="grid md:grid-cols-2 gap-10">
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <h3 className="text-xl font-black italic uppercase tracking-tight flex items-center gap-3">
                                                <UserPlus className="h-5 w-5 text-primary" />
                                                {t('competitions.reg_athletes')}
                                            </h3>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{t('competitions.search_placeholder')}</p>
                                        </div>
                                        <div className="relative group">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                            <Input
                                                placeholder={t('common.search')}
                                                value={searchAthlete}
                                                onChange={(e) => setSearchAthlete(e.target.value)}
                                                className="pl-12 h-14 rounded-2xl border-white/10 bg-white/5 focus:ring-primary/20 transition-all text-sm font-medium"
                                            />
                                        </div>
                                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-none">
                                            {athletes
                                                .filter(a =>
                                                    !participants.some(p => p.athlete_id === a.id) &&
                                                    (`${a.first_name || ''} ${a.last_name || ''}`).toLowerCase().includes(searchAthlete.toLowerCase())
                                                )
                                                .map(athlete => (
                                                    <div
                                                        key={athlete.id}
                                                        className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/30 hover:bg-primary/5 transition-all group"
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center font-black text-primary text-xs border border-primary/10">
                                                                {athlete.first_name?.[0]}{athlete.last_name?.[0]}
                                                            </div>
                                                            <div className="space-y-1">
                                                                <p className="text-sm font-black uppercase tracking-tight">{athlete.first_name} {athlete.last_name}</p>
                                                                <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest leading-none">{athlete.email}</p>
                                                            </div>
                                                        </div>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handleAddParticipant(athlete.id)}
                                                            className="rounded-xl hover:bg-primary hover:text-primary-foreground transition-all px-4 h-9 font-bold uppercase text-[10px] tracking-widest opacity-0 group-hover:opacity-100"
                                                        >
                                                            <Plus className="h-3 w-3 mr-2" />
                                                            {t('common.add')}
                                                        </Button>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <h3 className="text-xl font-black italic uppercase tracking-tight flex items-center gap-3">
                                                <Users className="h-5 w-5 text-primary" />
                                                {t('competitions.current_athletes')}
                                            </h3>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                                                {participants.length} {t('competitions.athletes_registered')}
                                            </p>
                                        </div>
                                        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 scrollbar-none">
                                            {participants.map((p) => (
                                                <div
                                                    key={p.id}
                                                    className="flex items-center justify-between p-4 rounded-2xl bg-primary/5 border border-primary/10 group transition-all"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center font-black text-primary-foreground text-xs shadow-lg shadow-primary/20">
                                                            {p.athlete?.first_name?.[0]}{p.athlete?.last_name?.[0]}
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-sm font-black uppercase tracking-tight">{p.athlete?.first_name} {p.athlete?.last_name}</p>
                                                            <div className="flex items-center gap-2">
                                                                <Badge className="bg-primary/20 text-primary text-[8px] h-4 px-1.5 border-none font-black uppercase tracking-widest">{p.category}</Badge>
                                                                <span className="text-[10px] font-bold text-primary/40 uppercase tracking-widest">#{p.id.slice(0, 4)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleRemoveParticipant(p.id)}
                                                        className="text-destructive hover:bg-destructive/10 hover:text-destructive rounded-xl opacity-0 group-hover:opacity-100 transition-all font-bold uppercase text-[10px] tracking-widest"
                                                    >
                                                        <Trash2 className="h-3 w-3 mr-2" />
                                                        {t('common.remove')}
                                                    </Button>
                                                </div>
                                            ))}
                                            {participants.length === 0 && (
                                                <div className="flex flex-col items-center justify-center py-24 bg-white/5 rounded-[2.5rem] border border-dashed border-white/10 space-y-4">
                                                    <Users className="h-12 w-12 text-muted-foreground/10" />
                                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/30">{t('competitions.no_athletes')}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="events" className="mt-0 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="bg-white/5 p-10 rounded-[2.5rem] border border-white/5 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                                        <Trophy className="h-24 w-24 text-primary" />
                                    </div>
                                    <h4 className="font-black italic text-xl mb-6 uppercase tracking-tight flex items-center gap-3">
                                        <Plus className="h-6 w-6 text-primary" />
                                        {t('competitions.add_event')}
                                    </h4>
                                    <div className="grid sm:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase text-primary/60 px-1 tracking-widest">{t('competitions.event_name')}</Label>
                                            <Input
                                                placeholder="e.g. Event 1: Heavy Grace"
                                                value={newEventName}
                                                onChange={(e) => setNewEventName(e.target.value)}
                                                className="bg-white/5 border-white/10 h-14 rounded-2xl focus:ring-primary/20 transition-all font-medium"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase text-primary/60 px-1 tracking-widest">{t('competitions.select_wod')}</Label>
                                            <Select value={selectedWodId} onValueChange={setSelectedWodId}>
                                                <SelectTrigger className="bg-white/5 border-white/10 h-14 rounded-2xl focus:ring-primary/20 transition-all">
                                                    <SelectValue placeholder={t('competitions.select_wod_placeholder')} />
                                                </SelectTrigger>
                                                <SelectContent className="glass border-white/10 rounded-2xl overflow-hidden p-2">
                                                    {availableWods.map(wod => (
                                                        <SelectItem key={wod.id} value={wod.id} className="rounded-xl focus:bg-primary/10 py-3 text-sm font-medium">
                                                            {wod.title}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <Button className="w-full mt-10 h-14 rounded-2xl uppercase font-black tracking-widest gap-3 shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all" onClick={handleAddEvent}>
                                        <Plus className="h-5 w-5" /> {t('competitions.add_event_btn')}
                                    </Button>
                                </div>

                                <div className="space-y-6">
                                    <h4 className="font-black italic text-sm uppercase tracking-widest text-muted-foreground/40 px-1 flex items-center gap-3">
                                        <div className="h-0.5 w-6 bg-primary/20" />
                                        {t('competitions.linked_events')}
                                    </h4>
                                    {events.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-20 bg-white/5 rounded-[2.5rem] border border-dashed border-white/10 space-y-4">
                                            <ListChecks className="h-10 w-10 text-muted-foreground/10" />
                                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/30">{t('competitions.no_events')}</p>
                                        </div>
                                    ) : (
                                        <div className="grid gap-4">
                                            {events.map((event, index) => (
                                                <div
                                                    key={event.id}
                                                    className="p-6 flex items-center justify-between rounded-2xl bg-white/5 border border-white/5 transition-all group hover:border-primary/30"
                                                >
                                                    <div className="flex items-center gap-6">
                                                        <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/10 flex items-center justify-center font-black italic text-lg text-primary shadow-sm">
                                                            {index + 1}
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="font-black italic text-lg uppercase tracking-tight">{event.name}</p>
                                                            <div className="flex items-center gap-3">
                                                                <Badge className="bg-primary/10 text-primary border-none text-[8px] h-4 px-1.5 font-black uppercase tracking-widest">{t('competitions.order')}: {event.order_index}</Badge>
                                                                <span className="text-[10px] text-muted-foreground/40 font-bold uppercase tracking-widest">#{event.id.slice(0, 8)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-10 w-10 text-rose-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500/10 rounded-xl"
                                                        onClick={() => handleRemoveEvent(event.id)}
                                                    >
                                                        <Trash2 className="h-5 w-5" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="judges" className="mt-0 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="grid md:grid-cols-2 gap-10">
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <h3 className="text-xl font-black italic uppercase tracking-tight flex items-center gap-3">
                                                <ShieldCheck className="h-5 w-5 text-primary" />
                                                {t('competitions.available_staff')}
                                            </h3>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{t('competitions.judge_desc')}</p>
                                        </div>
                                        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 scrollbar-none">
                                            {staffMembers
                                                .filter(s => !judges.some(j => j.profile_id === s.id))
                                                .map(staff => (
                                                    <div
                                                        key={staff.id}
                                                        className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/30 hover:bg-primary/5 transition-all group"
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className="h-10 w-10 rounded-xl bg-zinc-100 flex items-center justify-center font-black text-zinc-500 text-xs border border-zinc-200">
                                                                {staff.first_name?.[0]}{staff.last_name?.[0]}
                                                            </div>
                                                            <div className="space-y-1">
                                                                <p className="text-sm font-black uppercase tracking-tight">{staff.first_name} {staff.last_name}</p>
                                                                <Badge variant="outline" className="border-zinc-200 text-[8px] h-4 px-1.5 font-black uppercase tracking-widest text-zinc-400">{staff.role_id}</Badge>
                                                            </div>
                                                        </div>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handleAddJudge(staff.id)}
                                                            className="rounded-xl hover:bg-primary hover:text-primary-foreground transition-all px-4 h-9 font-bold uppercase text-[10px] tracking-widest opacity-0 group-hover:opacity-100"
                                                        >
                                                            <UserPlus className="h-3 w-3 mr-2" />
                                                            {t('competitions.appoint')}
                                                        </Button>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <h3 className="text-xl font-black italic uppercase tracking-tight flex items-center gap-3">
                                                <div className="h-2 w-2 rounded-full bg-primary" />
                                                {t('competitions.appointed_judges')}
                                            </h3>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                                                {judges.length} {t('competitions.official_judge')}
                                            </p>
                                        </div>
                                        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 scrollbar-none">
                                            {judges.map(judge => (
                                                <div
                                                    key={judge.id}
                                                    className="flex items-center justify-between p-4 rounded-2xl bg-primary/5 border border-primary/10 group transition-all"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center font-black text-primary-foreground text-xs shadow-lg shadow-primary/20">
                                                            {judge.profile?.first_name?.[0]}{judge.profile?.last_name?.[0]}
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-sm font-black uppercase tracking-tight">{judge.profile?.first_name} {judge.profile?.last_name}</p>
                                                            <p className="text-[10px] font-bold text-primary/60 uppercase tracking-widest leading-none">
                                                                {t('competitions.official_judge')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleRemoveJudge(judge.id)}
                                                        className="text-destructive hover:bg-destructive/10 hover:text-destructive rounded-xl opacity-0 group-hover:opacity-100 transition-all font-bold uppercase text-[10px] tracking-widest"
                                                    >
                                                        <Trash2 className="h-3 w-3 mr-2" />
                                                        {t('common.remove')}
                                                    </Button>
                                                </div>
                                            ))}
                                            {judges.length === 0 && (
                                                <div className="flex flex-col items-center justify-center py-24 bg-white/5 rounded-[2.5rem] border border-dashed border-white/10 space-y-4">
                                                    <ShieldCheck className="h-12 w-12 text-muted-foreground/10" />
                                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/30">{t('competitions.no_judges')}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="leaderboard" className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex flex-col items-center justify-center py-24 text-center space-y-10 bg-white/5 rounded-[3rem] border border-white/5 relative overflow-hidden group">
                                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

                                    <div className="relative">
                                        <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-150 transform group-hover:scale-[2] transition-transform duration-1000" />
                                        <div className="relative h-28 w-28 rounded-[2rem] bg-primary flex items-center justify-center shadow-2xl shadow-primary/20 transform group-hover:rotate-6 transition-transform">
                                            <BarChart className="h-14 w-14 text-primary-foreground" />
                                        </div>
                                    </div>

                                    <div className="space-y-4 max-w-sm px-6 relative z-10">
                                        <h3 className="text-3xl font-black italic uppercase tracking-tighter">{t('competitions.leaderboard_live')}</h3>
                                        <p className="text-muted-foreground/60 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
                                            {t('competitions.leaderboard_placeholder')}
                                        </p>
                                    </div>

                                    <Button className="h-14 px-10 rounded-2xl uppercase font-black tracking-widest text-xs gap-3 shadow-xl shadow-primary/20 hover:scale-[1.05] active:scale-[0.95] transition-all relative z-10">
                                        <Settings className="h-4 w-4" /> {t('competitions.configure_brackets')}
                                    </Button>

                                    <div className="grid grid-cols-3 gap-12 mt-16 w-full max-w-md px-10 relative opacity-40 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700">
                                        <div className="flex flex-col items-center space-y-3">
                                            <div className="w-16 h-1.5 bg-zinc-500/20 rounded-full" />
                                            <div className="w-12 h-14 rounded-xl bg-white/5 border border-white/10" />
                                            <div className="w-14 h-3 bg-white/5 rounded-full" />
                                        </div>
                                        <div className="flex flex-col items-center space-y-3 -mt-6">
                                            <div className="w-16 h-1.5 bg-primary/40 rounded-full" />
                                            <div className="w-12 h-20 rounded-xl bg-primary/20 border border-primary/20" />
                                            <div className="w-14 h-3 bg-primary/20 rounded-full" />
                                        </div>
                                        <div className="flex flex-col items-center space-y-3">
                                            <div className="w-16 h-1.5 bg-zinc-500/20 rounded-full" />
                                            <div className="w-12 h-10 rounded-xl bg-white/5 border border-white/10" />
                                            <div className="w-14 h-3 bg-white/5 rounded-full" />
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>
                </DialogContent>
            </Dialog>

            <div className="grid gap-8 md:grid-cols-2 mt-16">
                <Card className="glass border-white/5 rounded-[2.5rem] group hover:border-primary/30 transition-all duration-500 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
                        <ShieldCheck className="h-24 w-24 text-primary" />
                    </div>
                    <CardHeader className="p-10">
                        <CardTitle className="flex items-center gap-4 text-primary uppercase italic font-black text-2xl tracking-tight">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <ShieldCheck className="h-6 w-6" />
                            </div>
                            {t('competitions.judge_mgt')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-10 pb-10 space-y-8">
                        <p className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-[0.1em] leading-relaxed line-clamp-2">{t('competitions.judge_desc')}</p>
                        <Button
                            className="w-full gap-3 h-14 rounded-2xl bg-white/5 border border-white/10 hover:bg-primary hover:text-primary-foreground hover:border-primary uppercase font-black text-xs tracking-[0.2em] transition-all shadow-lg active:scale-[0.98]"
                            onClick={() => {
                                if (competitions.length > 0) handleManageCompetition(competitions[0], 'judges');
                            }}
                        >
                            <UserPlus className="h-5 w-5" /> {t('competitions.manage_judges')}
                        </Button>
                    </CardContent>
                </Card>

                <Card className="glass border-white/5 rounded-[2.5rem] group hover:border-yellow-500/30 transition-all duration-500 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
                        <Medal className="h-24 w-24 text-yellow-500" />
                    </div>
                    <CardHeader className="p-10">
                        <CardTitle className="flex items-center gap-4 text-yellow-500 uppercase italic font-black text-2xl tracking-tight">
                            <div className="h-10 w-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                                <Medal className="h-6 w-6" />
                            </div>
                            {t('competitions.scoring_system')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-10 pb-10 space-y-8">
                        <p className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-[0.1em] leading-relaxed line-clamp-2">{t('competitions.scoring_desc')}</p>
                        <Button className="w-full gap-3 h-14 rounded-2xl bg-white/5 border border-white/10 hover:bg-yellow-500 hover:text-white hover:border-yellow-500 uppercase font-black text-xs tracking-[0.2em] transition-all shadow-lg active:scale-[0.98]">
                            <Settings className="h-5 w-5" /> {t('competitions.config_rules')}
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
