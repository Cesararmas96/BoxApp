import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage, useNotification } from '@/hooks';
import {
    UserPlus,
    Search,
    Plus,
    Trash2,
    Users
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Competition, CompetitionParticipant } from '@/types/competitions';

interface ParticipantsTabProps {
    competition: Competition;
}

export const ParticipantsTab: React.FC<ParticipantsTabProps> = ({ competition }) => {
    const { t } = useLanguage();
    const { currentBox } = useAuth();
    const { showNotification, showConfirm } = useNotification();

    const [participants, setParticipants] = useState<CompetitionParticipant[]>([]);
    const [athletes, setAthletes] = useState<any[]>([]);
    const [searchAthlete, setSearchAthlete] = useState('');
    const [participantDivision, setParticipantDivision] = useState('RX');


    useEffect(() => {
        if (currentBox && competition) {
            fetchParticipants();
            fetchAthletes();
        }
    }, [currentBox, competition]);

    const fetchAthletes = async () => {
        if (!currentBox) return;
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('box_id', currentBox.id)
            .eq('role_id', 'athlete');
        if (data) setAthletes(data);
    };

    const fetchParticipants = async () => {
        const { data, error } = await supabase
            .from('competition_participants')
            .select(`
                *,
                athlete:profiles!user_id(*)
            `)
            .eq('competition_id', competition.id);

        if (error) {
            console.error('Error fetching participants:', error);
            showNotification('error', 'ERROR FETCHING PARTICIPANTS');
        } else if (data) {
            setParticipants(data as unknown as CompetitionParticipant[]);
        }
    };

    const handleAddParticipant = async (athleteId: string) => {
        if (!competition) return;

        const { error } = await supabase
            .from('competition_participants')
            .insert([{
                competition_id: competition.id,
                box_id: currentBox?.id,
                user_id: athleteId,
                division: participantDivision, // This will be deprecated or mapped to division_id later
                status: 'active'
            }]);

        if (error) {
            showNotification('error', 'ERROR ADDING ATHLETE: ' + (error.message || 'UNKNOWN ERROR').toUpperCase());
        } else {
            showNotification('success', 'ATHLETE ADDED TO COMPETITION');
            setSearchAthlete('');
            fetchParticipants();
        }
    };

    const handleRemoveParticipant = async (participantId: string) => {
        showConfirm({
            title: t('common.confirm_delete', { defaultValue: 'CONFIRMAR ELIMINACIÓN' }),
            description: t('competitions.remove_athlete_warning', { defaultValue: '¿ESTÁS SEGURO DE QUE DESEAS ELIMINAR ESTE ATLETA? ESTA ACCIÓN NO SE PUEDE DESHACER.' }),
            onConfirm: async () => {
                const { error } = await supabase
                    .from('competition_participants')
                    .delete()
                    .eq('id', participantId);

                if (error) {
                    showNotification('error', 'ERROR REMOVING ATHLETE: ' + error.message.toUpperCase());
                } else {
                    showNotification('success', 'ATHLETE REMOVED FROM COMPETITION');
                    fetchParticipants();
                }
            },
            variant: 'destructive',
            icon: 'destructive'
        });
    };

    return (
        <div className="grid md:grid-cols-2 gap-10">
            <div className="space-y-6">
                <div className="space-y-2">
                    <h3 className="text-xl font-black italic uppercase tracking-tight flex items-center gap-3">
                        <UserPlus className="h-5 w-5 text-primary" />
                        {t('competitions.reg_athletes')}
                    </h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{t('competitions.search_placeholder')}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder={t('common.search')}
                            value={searchAthlete}
                            onChange={(e) => setSearchAthlete(e.target.value)}
                            className="pl-12 h-14 rounded-2xl border-white/10 bg-white/5 focus:ring-primary/20 transition-all text-sm font-medium"
                        />
                    </div>
                    <Select value={participantDivision} onValueChange={setParticipantDivision}>
                        <SelectTrigger className="h-14 rounded-2xl border-white/10 bg-white/5 focus:ring-primary/20 transition-all text-sm font-medium">
                            <SelectValue placeholder={t('competitions.division_placeholder')} />
                        </SelectTrigger>
                        <SelectContent className="glass border-white/10 rounded-2xl">
                            <SelectItem value="RX">{t('competitions.divisions.rx')}</SelectItem>
                            <SelectItem value="Scaled">{t('competitions.divisions.scaled')}</SelectItem>
                            <SelectItem value="Beginners">{t('competitions.divisions.beginners')}</SelectItem>
                            <SelectItem value="Masters">{t('competitions.divisions.masters')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {athletes
                        .filter(a =>
                            !participants.some(p => p.user_id === a.id) &&
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
                        {t('competitions.participants_list')}
                        <Badge variant="outline" className="ml-auto font-black italic">{participants.length}</Badge>
                    </h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{t('competitions.manage_participants')}</p>
                </div>

                <div className="bg-white/5 rounded-[2rem] border border-white/5 overflow-hidden min-h-[400px]">
                    <div className="p-4 grid grid-cols-12 gap-4 border-b border-white/5 bg-white/5 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                        <div className="col-span-5 pl-2">{t('common.athlete')}</div>
                        <div className="col-span-3 text-center">{t('competitions.division')}</div>
                        <div className="col-span-3 text-center">{t('common.status')}</div>
                        <div className="col-span-1"></div>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto p-2 space-y-1">
                        {participants.map((participant) => (
                            <div key={participant.id} className="grid grid-cols-12 gap-4 items-center p-3 rounded-xl hover:bg-white/5 transition-colors group">
                                <div className="col-span-5 flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-zinc-800 flex items-center justify-center text-[9px] font-black text-white">
                                        {participant.athlete?.avatar_url ? (
                                            <img src={participant.athlete.avatar_url} alt="" className="h-full w-full object-cover rounded-lg" />
                                        ) : (
                                            <span>{participant.athlete?.first_name?.[0]}{participant.athlete?.last_name?.[0]}</span>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold uppercase truncate">{participant.athlete?.first_name} {participant.athlete?.last_name}</p>
                                        <p className="text-[9px] text-muted-foreground truncate">{participant.athlete?.email}</p>
                                    </div>
                                </div>
                                <div className="col-span-3 text-center">
                                    <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-wider bg-white/5 text-foreground/80 hover:bg-white/10 border-white/10">
                                        {participant.division}
                                    </Badge>
                                </div>
                                <div className="col-span-3 text-center">
                                    <Badge variant="outline" className="text-[9px] font-black uppercase tracking-wider border-primary/20 text-primary bg-primary/5">
                                        {participant.status}
                                    </Badge>
                                </div>
                                <div className="col-span-1 flex justify-end">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                                        onClick={() => handleRemoveParticipant(participant.id)}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                        {participants.length === 0 && (
                            <div className="py-20 text-center text-muted-foreground space-y-2">
                                <Users className="h-10 w-10 mx-auto opacity-20" />
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-50">{t('competitions.no_participants')}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
