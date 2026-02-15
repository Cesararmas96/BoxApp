import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import {
    Trophy,
    Plus,
    Calendar,
    ChevronRight,
    ShieldCheck,
    Medal,
    Settings,
    UserPlus,
    Users,
    BarChart,
    ListChecks,
    ChevronLeft
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    ResponsiveDialog as Dialog,
    ResponsiveDialogContent as DialogContent,
    ResponsiveDialogDescription as DialogDescription,
    ResponsiveDialogFooter as DialogFooter,
    ResponsiveDialogHeader as DialogHeader,
    ResponsiveDialogTitle as DialogTitle,
    ResponsiveDialogTrigger as DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage, useNotification } from '@/hooks';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { CompetitionManager } from '@/components/competitions/CompetitionManager';

import { Competition } from '@/types/competitions';



export const Competitions: React.FC = () => {
    const { t } = useLanguage();
    const { currentBox } = useAuth();
    const [competitions, setCompetitions] = useState<Competition[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newComp, setNewComp] = useState({
        name: '',
        description: '',
        start_date: '',
        end_date: ''
    });
    const { showNotification, confirmState, hideConfirm } = useNotification();

    const [selectedComp, setSelectedComp] = useState<Competition | null>(null);
    const [isManageOpen, setIsManageOpen] = useState(false);
    const [managementTab, setManagementTab] = useState('participants');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    const handleManageCompetition = (comp: Competition, tab: string = 'participants') => {
        setSelectedComp(comp);
        setManagementTab(tab);
        setIsManageOpen(true);
    };

    const filteredCompetitions = (status: string) => {
        return competitions.filter(c => {
            const s = c.status?.toLowerCase() || 'upcoming';
            if (status === 'active') return s === 'active' || s === 'upcoming' || s === 'scheduled';
            if (status === 'finished') return s === 'finished' || s === 'completed';
            return s === status;
        });
    };

    const getPaginatedCompetitions = (status: string) => {
        const filtered = filteredCompetitions(status);
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filtered.slice(startIndex, startIndex + itemsPerPage);
    };

    const getTotalPages = (status: string) =>
        Math.ceil(filteredCompetitions(status).length / itemsPerPage);

    const fetchCompetitions = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('competitions')
            .select(`
                *,
                participants:competition_participants(count),
                events:competition_events(count)
            `)
            .eq('box_id', currentBox?.id || '')
            .order('start_date', { ascending: false });

        if (!error && data) setCompetitions(data as unknown as Competition[]);
        setLoading(false);
    };

    useEffect(() => {
        if (currentBox) {
            fetchCompetitions();
        }
    }, [currentBox]);

    const handleCreateCompetition = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase
            .from('competitions')
            .insert([{
                ...newComp,
                box_id: currentBox?.id,
                status: 'upcoming'
            }]);

        if (error) {
            showNotification('error', 'ERROR CREATING COMPETITION: ' + error.message.toUpperCase());
        } else {
            showNotification('success', 'COMPETITION CREATED SUCCESSFULLY');
            setIsCreateOpen(false);
            setNewComp({ name: '', description: '', start_date: '', end_date: '' });
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
                    <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden border-border glass rounded-[2.5rem]">
                        <div className="bg-primary/10 p-10 border-b border-border relative overflow-hidden">
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
                                    placeholder={t('competitions.placeholders.comp_name')}
                                    required
                                    value={newComp.name}
                                    onChange={(e) => setNewComp({ ...newComp, name: e.target.value })}
                                    className="h-14 bg-muted/50 border-border text-lg font-bold rounded-2xl focus:ring-primary/20 px-6"
                                />
                            </div>
                            <div className="space-y-3">
                                <Label className="px-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">{t('competitions.form_desc')}</Label>
                                <Input
                                    placeholder={t('competitions.placeholders.comp_desc')}
                                    value={newComp.description}
                                    onChange={(e) => setNewComp({ ...newComp, description: e.target.value })}
                                    className="h-14 bg-muted/50 border-border text-lg font-bold rounded-2xl focus:ring-primary/20 px-6"
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
                                        className="h-14 bg-muted/50 border-border font-bold rounded-2xl focus:ring-primary/20 px-6"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <Label className="px-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">{t('competitions.end_date')}</Label>
                                    <Input
                                        type="date"
                                        required
                                        value={newComp.end_date}
                                        onChange={(e) => setNewComp({ ...newComp, end_date: e.target.value })}
                                        className="h-14 bg-muted/50 border-border font-bold rounded-2xl focus:ring-primary/20 px-6"
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

            <Tabs defaultValue="active" className="w-full" onValueChange={() => setCurrentPage(1)}>
                <TabsList className="bg-transparent border-b rounded-none h-12 p-0 gap-8">
                    <TabsTrigger value="active" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none h-full px-0 font-black uppercase text-[10px] tracking-widest">{t('competitions.active_tab')}</TabsTrigger>
                    <TabsTrigger value="finished" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none h-full px-0 font-black uppercase text-[10px] tracking-widest">{t('competitions.past_tab')}</TabsTrigger>
                </TabsList>

                {['active', 'finished'].map((status) => (
                    <TabsContent key={status} value={status} className="mt-10">
                        {loading && competitions.length === 0 ? (
                            <div className="py-20 text-center text-muted-foreground animate-pulse font-black uppercase tracking-widest text-xs">{t('common.loading')}</div>
                        ) : filteredCompetitions(status).length === 0 ? (
                            <Card className="border-dashed border-2 bg-primary/5 rounded-[2.5rem]">
                                <CardContent className="py-24 text-center">
                                    <Trophy className="h-20 w-20 mx-auto text-primary/20 mb-6" />
                                    <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-2">{t('competitions.no_' + status, { defaultValue: 'No ' + status + ' competitions' })}</h3>
                                    <p className="text-muted-foreground text-sm mb-8 max-w-xs mx-auto">{t('competitions.start_first')}</p>
                                    <Button onClick={() => setIsCreateOpen(true)} className="rounded-xl px-8 h-12 font-black uppercase tracking-widest text-xs">{t('competitions.create_first')}</Button>
                                </CardContent>
                            </Card>
                        ) : (
                            <>
                                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                                    {getPaginatedCompetitions(status).map((comp) => (
                                        <Card key={comp.id} className="overflow-hidden group hover:border-primary/30 transition-all duration-500 shadow-xl hover:shadow-primary/5 border-border glass rounded-[2rem] flex flex-col">
                                            <CardHeader className="pb-4 pt-8 px-8">
                                                <div className="flex justify-between items-start mb-4">
                                                    <Badge variant="glow" className="uppercase text-[10px] font-black px-3 py-1 rounded-full border-primary/20">
                                                        {comp.status}
                                                    </Badge>
                                                </div>
                                                <CardTitle className="text-3xl font-black italic uppercase tracking-tighter mb-2 group-hover:text-primary transition-colors">{comp.name}</CardTitle>
                                                <CardDescription className="line-clamp-2 text-xs font-medium text-muted-foreground/70 leading-relaxed uppercase tracking-wide">
                                                    {comp.description}
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="px-8 pb-8 flex-1">
                                                <div className="space-y-6">
                                                    <div className="flex items-center gap-2.5 text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">
                                                        <Calendar className="h-4 w-4 text-primary/40" />
                                                        {new Date(comp.start_date || '').toLocaleDateString()} - {new Date(comp.end_date || '').toLocaleDateString()}
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 text-center transition-transform group-hover:scale-[1.02]">
                                                            <p className="text-[10px] font-black text-primary/60 uppercase leading-none mb-2 tracking-widest">{t('competitions.athletes')}</p>
                                                            <p className="font-black italic text-2xl tracking-tighter">
                                                                {comp.participants?.[0]?.count || 0}
                                                            </p>
                                                        </div>
                                                        <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 text-center transition-transform group-hover:scale-[1.02]">
                                                            <p className="text-[10px] font-black text-primary/60 uppercase leading-none mb-2 tracking-widest">{t('competitions.events')}</p>
                                                            <p className="font-black italic text-2xl tracking-tighter">
                                                                {comp.events?.[0]?.count || 0}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                            <CardFooter className="bg-muted/50 border-t border-border grid grid-cols-2 lg:grid-cols-4 gap-2 p-4 mt-auto">
                                                <Button variant="ghost" size="sm" className="h-10 text-[9px] uppercase font-black tracking-widest gap-1.5 bg-muted/50 hover:bg-muted rounded-xl px-2" onClick={() => handleManageCompetition(comp)}>
                                                    <Users className="h-3.5 w-3.5 text-primary" /> {t('competitions.athletes')}
                                                </Button>
                                                <Button variant="ghost" size="sm" className="h-10 text-[9px] uppercase font-black tracking-widest gap-1.5 bg-muted/50 hover:bg-muted rounded-xl px-2" onClick={() => handleManageCompetition(comp)}>
                                                    <ListChecks className="h-3.5 w-3.5 text-primary" /> {t('competitions.events')}
                                                </Button>
                                                <Button variant="ghost" size="sm" className="h-10 text-[9px] uppercase font-black tracking-widest gap-1.5 bg-muted/50 hover:bg-muted rounded-xl px-2" onClick={() => handleManageCompetition(comp)}>
                                                    <ShieldCheck className="h-3.5 w-3.5 text-primary" /> {t('competitions.manage_judges_short')}
                                                </Button>
                                                <Button variant="ghost" size="sm" className="h-10 text-[9px] uppercase font-black tracking-widest gap-1.5 bg-muted/50 hover:bg-muted rounded-xl px-2" onClick={() => handleManageCompetition(comp)}>
                                                    <Medal className="h-3.5 w-3.5 text-primary" /> {t('competitions.manage_scoring_short')}
                                                </Button>
                                                <Button className="col-span-full h-12 text-[10px] uppercase font-black tracking-widest gap-2 rounded-xl shadow-lg shadow-primary/10 group/btn mt-1" onClick={() => handleManageCompetition(comp)}>
                                                    <BarChart className="h-4 w-4" /> {t('competitions.detail_btn')}
                                                    <ChevronRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                                                </Button>
                                            </CardFooter>
                                        </Card>
                                    ))}
                                </div>
                                {getTotalPages(status) > 1 && (
                                    <div className="flex items-center justify-center gap-2 mt-12">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className="h-10 px-4 rounded-xl font-bold uppercase tracking-widest text-[10px]"
                                        >
                                            <ChevronLeft className="h-4 w-4 mr-2" />
                                            {t('common.previous')}
                                        </Button>
                                        <span className="text-xs font-black italic px-4 py-2 bg-muted/50 rounded-lg border border-border">
                                            {currentPage} / {getTotalPages(status)}
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(p => Math.min(getTotalPages(status), p + 1))}
                                            disabled={currentPage === getTotalPages(status)}
                                            className="h-10 px-4 rounded-xl font-bold uppercase tracking-widest text-[10px]"
                                        >
                                            {t('common.next')}
                                            <ChevronRight className="h-4 w-4 ml-2" />
                                        </Button>
                                    </div>
                                )}
                            </>
                        )}
                    </TabsContent>
                ))}
            </Tabs>

            {/* Consolidated Management Dialog */}
            <Dialog open={isManageOpen} onOpenChange={setIsManageOpen}>
                <CompetitionManager
                    competition={selectedComp}
                    initialTab={managementTab}
                    onClose={() => setIsManageOpen(false)}
                />
            </Dialog>

            <div className="grid gap-8 md:grid-cols-2 mt-16">
                <Card className="glass border-border rounded-[2.5rem] group hover:border-primary/30 transition-all duration-500 shadow-xl relative overflow-hidden">
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
                            className="w-full gap-3 h-14 rounded-2xl bg-muted/50 border border-border hover:bg-primary hover:text-primary-foreground hover:border-primary uppercase font-black text-xs tracking-[0.2em] transition-all shadow-lg active:scale-[0.98]"
                            onClick={() => {
                                const activeComp = filteredCompetitions('active')[0];
                                if (activeComp) handleManageCompetition(activeComp, 'judges');
                                else showNotification('error', t('competitions.no_active_comp'));
                            }}
                        >
                            <UserPlus className="h-5 w-5" /> {t('competitions.manage_judges')}
                        </Button>
                    </CardContent>
                </Card>

                <Card className="glass border-border rounded-[2.5rem] group hover:border-yellow-500/30 transition-all duration-500 shadow-xl relative overflow-hidden">
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
                        <Button
                            className="w-full gap-3 h-14 rounded-2xl bg-muted/50 border border-border hover:bg-yellow-500 hover:text-white hover:border-yellow-500 uppercase font-black text-xs tracking-[0.2em] transition-all shadow-lg active:scale-[0.98]"
                            onClick={() => {
                                const activeComp = filteredCompetitions('active')[0];
                                if (activeComp) handleManageCompetition(activeComp, 'scoring');
                                else showNotification('error', t('competitions.no_active_comp'));
                            }}
                        >
                            <Settings className="h-5 w-5" /> {t('competitions.config_rules')}
                        </Button>
                    </CardContent>
                </Card>
            </div>


            {/* Premium Confirmation Dialog */}
            <ConfirmationDialog
                isOpen={confirmState.isOpen}
                onClose={hideConfirm}
                onConfirm={confirmState.onConfirm}
                title={confirmState.title}
                description={confirmState.description}
                variant={confirmState.variant}
                icon={confirmState.icon}
            />
        </div>
    );
};

export default Competitions;
