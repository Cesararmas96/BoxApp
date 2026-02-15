import React, { useState, useEffect } from 'react';
import {
    ResponsiveDialogContent as DialogContent,
    ResponsiveDialogHeader as DialogHeader,
    ResponsiveDialogTitle as DialogTitle,
    ResponsiveDialogDescription as DialogDescription
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
    Trophy,
    Users,
    ListChecks,
    Medal,
    ShieldCheck,
    BarChart,
    Settings,
    Timer,
    Dumbbell,
    LayoutDashboard
} from 'lucide-react';
import { useLanguage } from '@/hooks';
import { Competition } from '@/types/competitions';
import { ParticipantsTab } from './Tabs/ParticipantsTab';
import { EventsTab } from './Tabs/EventsTab';
import { DivisionsTab } from './Tabs/DivisionsTab';
import { TeamsTab } from './Tabs/TeamsTab';
import { SettingsTab } from './Tabs/SettingsTab';
import { JudgesTab } from './Tabs/JudgesTab';
import { LogisticsTab } from './Tabs/LogisticsTab';
import { LeaderboardTab } from './Tabs/LeaderboardTab';
import { ScoringTab } from './Tabs/ScoringTab';
import { OverviewTab } from './Tabs/OverviewTab';
import { CheckInTab } from './Tabs/CheckInTab';
import { UserCheck } from 'lucide-react';


interface CompetitionManagerProps {
    competition: Competition | null;
    onClose?: () => void;
    initialTab?: string;
}

export const CompetitionManager: React.FC<CompetitionManagerProps> = ({ competition, initialTab = 'overview' }) => {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState(initialTab);

    useEffect(() => {
        if (initialTab) setActiveTab(initialTab);
    }, [initialTab]);

    if (!competition) return null;

    return (
        <DialogContent className="w-[95vw] md:max-w-[950px] max-h-[90vh] overflow-hidden p-0 gap-0 border-white/10 glass rounded-[3rem] shadow-2xl">
            <div className="bg-primary/10 p-10 border-b border-white/5 relative overflow-hidden flex-shrink-0">
                <Trophy className="absolute -right-10 -bottom-10 h-48 w-48 text-primary/5 -rotate-12" />
                <DialogHeader>
                    <DialogTitle className="uppercase italic font-black text-3xl md:text-5xl tracking-tighter flex items-center gap-4 truncate">
                        <div className="h-10 w-10 md:h-14 md:w-14 rounded-2xl bg-primary flex-shrink-0 flex items-center justify-center shadow-lg shadow-primary/20">
                            <Trophy className="h-6 w-6 md:h-8 md:w-8 text-primary-foreground" />
                        </div>
                        <span className="truncate">{competition.name}</span>
                    </DialogTitle>
                    <DialogDescription className="uppercase text-[10px] font-bold tracking-[0.3em] text-primary/60 mt-4 px-1 flex items-center gap-2">
                        <span className="h-1 w-1 rounded-full bg-primary flex-shrink-0" />
                        <span className="truncate">{t('competitions.manage_desc')}</span>
                    </DialogDescription>
                </DialogHeader>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col h-[calc(90vh-160px)] overflow-hidden">
                <div className="px-6 md:px-10 border-b bg-white/5 flex-shrink-0 overflow-x-auto">
                    <TabsList className="h-16 bg-transparent gap-8 p-0 flex-nowrap justify-start">
                        <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none h-full px-0 gap-2.5 uppercase text-[10px] font-black tracking-[0.15em] transition-all hover:text-primary/70">
                            <LayoutDashboard className="h-4 w-4" /> {t('common.overview', { defaultValue: 'OVERVIEW' })}
                        </TabsTrigger>
                        <TabsTrigger value="participants" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none h-full px-0 gap-2.5 uppercase text-[10px] font-black tracking-[0.15em] transition-all hover:text-primary/70">
                            <Users className="h-4 w-4" /> {t('competitions.athletes')}
                        </TabsTrigger>
                        <TabsTrigger value="checkin" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none h-full px-0 gap-2.5 uppercase text-[10px] font-black tracking-[0.15em] transition-all hover:text-primary/70">
                            <UserCheck className="h-4 w-4" /> {t('competitions.checkin_tab', { defaultValue: 'CHECK-IN' })}
                        </TabsTrigger>

                        <TabsTrigger value="events" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none h-full px-0 gap-2.5 uppercase text-[10px] font-black tracking-[0.15em] transition-all hover:text-primary/70">
                            <ListChecks className="h-4 w-4" /> {t('competitions.events')}
                        </TabsTrigger>
                        <TabsTrigger value="teams" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none h-full px-0 gap-2.5 uppercase text-[10px] font-black tracking-[0.15em] transition-all hover:text-primary/70">
                            <Users className="h-4 w-4" /> {t('competitions.teams', { defaultValue: 'TEAMS' })}
                        </TabsTrigger>
                        <TabsTrigger value="divisions" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none h-full px-0 gap-2.5 uppercase text-[10px] font-black tracking-[0.15em] transition-all hover:text-primary/70">
                            <Dumbbell className="h-4 w-4" /> {t('competitions.divisions_tab', { defaultValue: 'DIVISIONS' })}
                        </TabsTrigger>
                        <TabsTrigger value="logistics" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none h-full px-0 gap-2.5 uppercase text-[10px] font-black tracking-[0.15em] transition-all hover:text-primary/70">
                            <Timer className="h-4 w-4" /> {t('competitions.logistics_tab', { defaultValue: 'LOGISTICS' })}
                        </TabsTrigger>
                        <TabsTrigger value="scoring" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none h-full px-0 gap-2.5 uppercase text-[10px] font-black tracking-[0.15em] transition-all hover:text-primary/70">
                            <Medal className="h-4 w-4" /> {t('competitions.scoring_system')}
                        </TabsTrigger>
                        <TabsTrigger value="judges" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none h-full px-0 gap-2.5 uppercase text-[10px] font-black tracking-[0.15em] transition-all hover:text-primary/70">
                            <ShieldCheck className="h-4 w-4" /> {t('competitions.judges')}
                        </TabsTrigger>
                        <TabsTrigger value="leaderboard" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none h-full px-0 gap-2.5 uppercase text-[10px] font-black tracking-[0.15em] transition-all hover:text-primary/70">
                            <BarChart className="h-4 w-4" /> {t('competitions.leaderboard')}
                        </TabsTrigger>
                        <TabsTrigger value="settings" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none h-full px-0 gap-2.5 uppercase text-[10px] font-black tracking-[0.15em] transition-all hover:text-primary/70">
                            <Settings className="h-4 w-4" /> {t('competitions.settings')}
                        </TabsTrigger>
                    </TabsList>
                </div>

                <div className="flex-1 overflow-y-auto p-10 min-h-0 bg-white/5 scroll-smooth">
                    {/* Content will be loaded dynamically here */}
                    <TabsContent value="overview" className="mt-0 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <OverviewTab competition={competition} onTabChange={setActiveTab} />
                    </TabsContent>

                    <TabsContent value="participants" className="mt-0 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <ParticipantsTab competition={competition} />
                    </TabsContent>

                    <TabsContent value="checkin" className="mt-0 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <CheckInTab competition={competition} />
                    </TabsContent>


                    <TabsContent value="events" className="mt-0 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <EventsTab competition={competition} />
                    </TabsContent>

                    <TabsContent value="teams" className="mt-0 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <TeamsTab competition={competition} />
                    </TabsContent>

                    <TabsContent value="divisions" className="mt-0 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <DivisionsTab competition={competition} />
                    </TabsContent>

                    <TabsContent value="logistics" className="mt-0 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <LogisticsTab competition={competition} />
                    </TabsContent>


                    <TabsContent value="scoring" className="flex-1 mt-0 p-6 md:p-10 overflow-y-auto min-h-0">
                        <div className="flex items-center gap-4 mb-8">
                            <Medal className="h-5 w-5 text-primary" />
                            <h3 className="uppercase italic font-black text-xl tracking-tighter">{t('competitions.scoring_tab')}</h3>
                        </div>
                        <ScoringTab competition={competition} />
                    </TabsContent>

                    <TabsContent value="judges" className="flex-1 mt-0 p-6 md:p-10 overflow-y-auto min-h-0">
                        <div className="flex items-center gap-4 mb-8">
                            <ShieldCheck className="h-5 w-5 text-primary" />
                            <h3 className="uppercase italic font-black text-xl tracking-tighter">{t('competitions.appointed_judges')}</h3>
                        </div>
                        <JudgesTab competition={competition} />
                    </TabsContent>

                    <TabsContent value="leaderboard" className="flex-1 mt-0 p-6 md:p-10 overflow-y-auto min-h-0">
                        <div className="flex items-center gap-4 mb-8">
                            <BarChart className="h-5 w-5 text-primary" />
                            <h3 className="uppercase italic font-black text-xl tracking-tighter">{t('competitions.leaderboard_live')}</h3>
                        </div>
                        <LeaderboardTab competition={competition} />
                    </TabsContent>

                    <TabsContent value="settings" className="flex-1 mt-0 p-6 md:p-10 overflow-y-auto min-h-0">
                        <div className="flex items-center gap-4 mb-8">
                            <Settings className="h-5 w-5 text-primary" />
                            <h3 className="uppercase italic font-black text-xl tracking-tighter">{t('competitions.settings_tab')}</h3>
                        </div>
                        <SettingsTab competition={competition} />
                    </TabsContent>
                </div>
            </Tabs>
        </DialogContent>
    );
};
