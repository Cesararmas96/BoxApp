import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage, useNotification } from '@/hooks';
import {
    Users,
    Plus,
    Trash2,
    Shield,
    UserPlus,
    Crown
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Competition, CompetitionTeam as Team } from '@/types/competitions';

interface TeamsTabProps {
    competition: Competition;
}

export const TeamsTab: React.FC<TeamsTabProps> = ({ competition }) => {
    const { t } = useLanguage();
    const { } = useAuth();
    const { showNotification, showConfirm } = useNotification();

    const [teams, setTeams] = useState<Team[]>([]);
    const [participants, setParticipants] = useState<any[]>([]); // To select captain
    // Form State
    const [newTeam, setNewTeam] = useState({
        name: '',
        captain_user_id: 'none',
        join_code: ''
    });

    useEffect(() => {
        if (competition) {
            fetchTeams();
            fetchParticipants();
        }
    }, [competition]);

    const fetchParticipants = async () => {
        const { data } = await supabase
            .from('competition_participants')
            .select('user_id, profile:profiles!user_id(first_name, last_name, email)')
            .eq('competition_id', competition.id);

        if (data) setParticipants(data);
    };

    const fetchTeams = async () => {
        const { data, error } = await supabase
            .from('competition_teams')
            .select(`
                *,
                captain:profiles!captain_user_id(first_name, last_name, email),
                members:competition_participants(count)
            `)
            .eq('competition_id', competition.id)
            .order('name', { ascending: true });

        if (error) {
            console.error('Error fetching teams:', error);
        } else if (data) {
            setTeams(data as unknown as Team[]);
        }
    };

    const handleAddTeam = async () => {
        if (!competition || !newTeam.name) return;

        const payload = {
            competition_id: competition.id,
            name: newTeam.name,
            captain_user_id: newTeam.captain_user_id === 'none' ? null : newTeam.captain_user_id,
            join_code: newTeam.join_code || Math.random().toString(36).substring(2, 8).toUpperCase()
        };

        const { error } = await supabase
            .from('competition_teams')
            .insert([payload]);

        if (error) {
            showNotification('error', t('competitions.error_adding_team', { defaultValue: 'ERROR ADDING TEAM' }) + ': ' + error.message.toUpperCase());
        } else {
            showNotification('success', t('competitions.team_added_success', { defaultValue: 'TEAM ADDED SUCCESSFULLY' }));
            setNewTeam({
                name: '',
                captain_user_id: 'none',
                join_code: ''
            });
            fetchTeams();
        }
    };

    const handleRemoveTeam = async (teamId: string) => {
        showConfirm({
            title: t('common.confirm_delete', { defaultValue: 'CONFIRMAR ELIMINACIÓN' }),
            description: t('competitions.remove_team_warning', { defaultValue: '¿ESTÁS SEGURO DE QUE DESEAS ELIMINAR ESTE EQUIPO? ESTA ACCIÓN NO SE PUEDE DESHACER.' }),
            onConfirm: async () => {
                const { error } = await supabase
                    .from('competition_teams')
                    .delete()
                    .eq('id', teamId);

                if (error) {
                    showNotification('error', t('competitions.error_removing_team', { defaultValue: 'ERROR REMOVING TEAM' }) + ': ' + error.message.toUpperCase());
                } else {
                    showNotification('success', t('competitions.team_removed_success', { defaultValue: 'TEAM REMOVED FROM COMPETITION' }));
                    fetchTeams();
                }
            },
            variant: 'destructive',
            icon: 'destructive'
        });
    };

    return (
        <div className="grid md:grid-cols-12 gap-10">
            {/* Left Column: Form */}
            <div className="md:col-span-4 space-y-6">
                <div className="space-y-2">
                    <h3 className="text-xl font-black italic uppercase tracking-tight flex items-center gap-3">
                        <UserPlus className="h-5 w-5 text-primary" />
                        {t('competitions.add_team', { defaultValue: 'ADD TEAM' })}
                    </h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{t('competitions.team_details', { defaultValue: 'TEAM DETAILS' })}</p>
                </div>

                <div className="space-y-4 bg-muted/50 p-6 rounded-[2rem] border border-border">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('common.name')}</Label>
                        <Input
                            value={newTeam.name}
                            onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                            placeholder="ex. Fittest on Earth"
                            className="bg-muted border-border"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('competitions.captain_optional', { defaultValue: 'CAPTAIN (OPTIONAL)' })}</Label>
                        <Select
                            value={newTeam.captain_user_id}
                            onValueChange={(val) => setNewTeam({ ...newTeam, captain_user_id: val })}
                        >
                            <SelectTrigger className="bg-muted border-border">
                                <SelectValue placeholder="Select Captain" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">{t('competitions.no_captain', { defaultValue: 'No Captain' })}</SelectItem>
                                {participants.map((p: any) => (
                                    <SelectItem key={p.user_id} value={p.user_id}>
                                        {p.profile?.first_name} {p.profile?.last_name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('competitions.join_code', { defaultValue: 'JOIN CODE' })}</Label>
                        <Input
                            value={newTeam.join_code}
                            onChange={(e) => setNewTeam({ ...newTeam, join_code: e.target.value })}
                            placeholder={t('competitions.auto_generated_hint', { defaultValue: 'Auto-generated if empty' })}
                            className="bg-muted border-border"
                        />
                    </div>

                    <div className="space-y-2 pt-4">
                        <Button onClick={handleAddTeam} className="w-full font-black uppercase tracking-widest h-12 rounded-xl">
                            <Plus className="h-4 w-4 mr-2" />
                            {t('competitions.add_team_btn', { defaultValue: 'CREATE TEAM' })}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Right Column: List */}
            <div className="md:col-span-8 space-y-6">
                <div className="space-y-2">
                    <h3 className="text-xl font-black italic uppercase tracking-tight flex items-center gap-3">
                        <Users className="h-5 w-5 text-primary" />
                        {t('competitions.teams_list', { defaultValue: 'TEAMS LIST' })}
                        <Badge variant="outline" className="ml-auto font-black italic">{teams.length}</Badge>
                    </h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{t('competitions.manage_teams', { defaultValue: 'MANAGE TEAMS' })}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto scrollbar-none pr-2">
                    {teams.map((team) => (
                        <div key={team.id} className="p-5 rounded-[2rem] bg-muted/50 border border-border hover:border-primary/30 transition-all group relative overflow-hidden flex flex-col justify-between h-full">
                            <div className="space-y-3">
                                <div className="flex justify-between items-start">
                                    <h4 className="font-black italic uppercase text-lg tracking-tight truncate pr-8" title={team.name}>{team.name}</h4>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all absolute top-4 right-4"
                                        onClick={() => handleRemoveTeam(team.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>

                                <div className="space-y-2">
                                    {team.captain && (
                                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                            <Crown className="h-3 w-3 text-yellow-500" />
                                            <span className="truncate">{team.captain.first_name} {team.captain.last_name}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-muted/50 p-2 rounded-lg w-fit">
                                        <Shield className="h-3 w-3" />
                                        <span className="font-mono tracking-widest">{team.join_code}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-border flex justify-between items-end">
                                <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">{t('competitions.members_count')}</div>
                                <div className="text-2xl font-black italic">{team.members?.[0]?.count || 0}</div>
                            </div>
                        </div>
                    ))}
                    {teams.length === 0 && (
                        <div className="col-span-full py-20 text-center text-muted-foreground space-y-2 bg-muted/50 rounded-[2rem] border-dashed border-2 border-border">
                            <Users className="h-10 w-10 mx-auto opacity-20" />
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-50">{t('competitions.no_teams', { defaultValue: 'NO TEAMS FOUND' })}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
