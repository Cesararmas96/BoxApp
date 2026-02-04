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

    useEffect(() => {
        fetchCompetitions();
    }, []);

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
            alert('Error creating competition: ' + error.message);
        } else {
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
                                    <CardFooter className="bg-muted/30 border-t flex justify-between gap-2 p-3">
                                        <Button variant="ghost" size="sm" className="h-8 text-[10px] uppercase font-black tracking-widest">
                                            {t('competitions.manage_participants')}
                                        </Button>
                                        <Button size="sm" className="h-8 text-[10px] uppercase font-black tracking-widest gap-1">
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
        </div>
    );
};
