import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage, useNotification } from '@/hooks';
import {
    CheckCircle2,
    XCircle,
    Search,
    FileSignature,
    UserCheck,
    Filter
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Competition, CompetitionParticipant } from '@/types/competitions';
import { cn } from '@/lib/utils';

interface CheckInTabProps {
    competition: Competition;
}

export const CheckInTab: React.FC<CheckInTabProps> = ({ competition }) => {
    const { t } = useLanguage();
    const { currentBox } = useAuth();
    const { showNotification } = useNotification();

    const [participants, setParticipants] = useState<CompetitionParticipant[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        checkedIn: 0,
        waiverSigned: 0
    });

    useEffect(() => {
        if (currentBox && competition) {
            fetchParticipants();
        }
    }, [currentBox, competition]);

    const fetchParticipants = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('competition_participants')
            .select(`
                *,
                athlete:profiles!user_id(*)
            `)
            .eq('competition_id', competition.id);

        if (error) {
            console.error('Error fetching participants:', error);
            showNotification('error', t('competitions.errors.fetch_participants', { defaultValue: 'ERROR FETCHING PARTICIPANTS' }));
        } else if (data) {
            const pData = data as unknown as CompetitionParticipant[];
            setParticipants(pData);

            // Calculate stats
            setStats({
                total: pData.length,
                checkedIn: pData.filter(p => p.checked_in).length,
                waiverSigned: pData.filter(p => p.waiver_signed).length
            });
        }
        setLoading(false);
    };

    const handleToggleCheckIn = async (participantId: string, currentStatus: boolean) => {
        const { error } = await supabase
            .from('competition_participants')
            .update({ checked_in: !currentStatus })
            .eq('id', participantId);

        if (error) {
            showNotification('error', t('common.error', { defaultValue: 'ERROR' }));
        } else {
            setParticipants(prev => prev.map(p =>
                p.id === participantId ? { ...p, checked_in: !currentStatus } : p
            ));

            setStats(prev => ({
                ...prev,
                checkedIn: prev.checked_in + (currentStatus ? -1 : 1)
            }));

            showNotification('success', t('common.updated', { defaultValue: 'UPDATED' }));
        }
    };

    const handleToggleWaiver = async (participantId: string, currentStatus: boolean) => {
        const { error } = await supabase
            .from('competition_participants')
            .update({ waiver_signed: !currentStatus })
            .eq('id', participantId);

        if (error) {
            showNotification('error', t('common.error', { defaultValue: 'ERROR' }));
        } else {
            setParticipants(prev => prev.map(p =>
                p.id === participantId ? { ...p, waiver_signed: !currentStatus } : p
            ));

            setStats(prev => ({
                ...prev,
                waiverSigned: prev.waiverSigned + (currentStatus ? -1 : 1)
            }));

            showNotification('success', t('common.updated', { defaultValue: 'UPDATED' }));
        }
    };

    const filteredParticipants = participants.filter(p => {
        const fullName = `${p.athlete?.first_name || ''} ${p.athlete?.last_name || ''}`.toLowerCase();
        return fullName.includes(searchQuery.toLowerCase()) ||
            p.athlete?.email?.toLowerCase().includes(searchQuery.toLowerCase());
    });

    return (
        <div className="space-y-6">
            {/* Header & Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2 space-y-2">
                    <h3 className="text-2xl font-black italic uppercase tracking-tight flex items-center gap-3">
                        <UserCheck className="h-6 w-6 text-primary" />
                        {t('competitions.checkin.title')}
                    </h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                        {t('competitions.checkin.subtitle')}
                    </p>
                </div>

                <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex flex-col justify-center">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">
                        {t('competitions.checkin.checked_in')}
                    </p>
                    <div className="flex items-end gap-2">
                        <span className="text-2xl font-black italic text-primary">{stats.checkedIn}</u>
                        <span className="text-xs font-bold text-muted-foreground mb-1">/ {stats.total}</span>
                    </div>
                </div>

                <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex flex-col justify-center">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">
                        {t('competitions.checkin.waiver')}
                    </p>
                    <div className="flex items-end gap-2">
                        <span className="text-2xl font-black italic text-blue-400">{stats.waiverSigned}</span>
                        <span className="text-xs font-bold text-muted-foreground mb-1">/ {stats.total}</span>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:row items-center gap-4">
                <div className="relative flex-1 w-full group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                        placeholder={t('competitions.checkin.search_athletes')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-12 h-14 rounded-2xl border-white/10 bg-white/5 focus:ring-primary/20 transition-all text-sm font-medium"
                    />
                </div>
                <Button variant="outline" className="h-14 px-6 rounded-2xl border-white/10 bg-white/5 shrink-0">
                    <Filter className="h-4 w-4 mr-2" />
                    {t('common.filter', { defaultValue: 'FILTER' })}
                </Button>
            </div>

            {/* List */}
            <div className="bg-white/5 rounded-[2.5rem] border border-white/5 overflow-hidden">
                <div className="p-6 grid grid-cols-12 gap-4 border-b border-white/5 bg-white/5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    <div className="col-span-5 pl-2">{t('competitions.checkin.athlete')}</div>
                    <div className="col-span-2 text-center">{t('competitions.checkin.division')}</div>
                    <div className="col-span-2 text-center">{t('competitions.checkin.waiver')}</div>
                    <div className="col-span-2 text-center">{t('competitions.checkin.status')}</div>
                    <div className="col-span-1"></div>
                </div>

                <div className="max-h-[600px] overflow-y-auto p-4 space-y-2 custom-scrollbar">
                    {loading ? (
                        <div className="py-20 text-center uppercase font-black italic tracking-widest text-muted-foreground/40 text-xs animate-pulse">
                            {t('common.loading')}
                        </div>
                    ) : filteredParticipants.length > 0 ? (
                        filteredParticipants.map((participant) => (
                            <div
                                key={participant.id}
                                className={cn(
                                    "grid grid-cols-12 gap-4 items-center p-4 rounded-3xl border transition-all group",
                                    participant.checked_in
                                        ? "bg-primary/5 border-primary/20"
                                        : "bg-white/5 border-white/5 hover:border-white/10"
                                )}
                            >
                                <div className="col-span-5 flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-zinc-800 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                                        {participant.athlete?.avatar_url ? (
                                            <img src={participant.athlete.avatar_url} alt="" className="h-full w-full object-cover" />
                                        ) : (
                                            <span className="text-xs font-black uppercase text-white/40">
                                                {participant.athlete?.first_name?.[0]}{participant.athlete?.last_name?.[0]}
                                            </span>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-black uppercase tracking-tight truncate">
                                            {participant.athlete?.first_name} {participant.athlete?.last_name}
                                        </p>
                                        <p className="text-[10px] font-bold text-muted-foreground/60 truncate uppercase tracking-widest">
                                            {participant.athlete?.email}
                                        </p>
                                    </div>
                                </div>

                                <div className="col-span-2 text-center">
                                    <Badge variant="outline" className="bg-white/5 border-white/10 font-black italic px-3 py-1">
                                        {participant.division || 'RX'}
                                    </Badge>
                                </div>

                                <div className="col-span-2 flex justify-center">
                                    <button
                                        onClick={() => handleToggleWaiver(participant.id, !!participant.waiver_signed)}
                                        className={cn(
                                            "flex items-center gap-2 px-3 py-2 rounded-xl border transition-all font-black text-[9px] tracking-widest",
                                            participant.waiver_signed
                                                ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
                                                : "bg-white/5 border-white/10 text-muted-foreground hover:border-blue-500/30"
                                        )}
                                    >
                                        <FileSignature className="h-3 w-3" />
                                        {participant.waiver_signed ? t('competitions.checkin.signed') : t('competitions.checkin.pending')}
                                    </button>
                                </div>

                                <div className="col-span-2 flex justify-center">
                                    <button
                                        onClick={() => handleToggleCheckIn(participant.id, !!participant.checked_in)}
                                        className={cn(
                                            "flex items-center gap-2 px-4 py-2 rounded-xl border transition-all font-black text-[9px] tracking-widest",
                                            participant.checked_in
                                                ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20"
                                                : "bg-white/5 border-white/10 text-muted-foreground hover:border-primary/50"
                                        )}
                                    >
                                        {participant.checked_in ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                                        {participant.checked_in ? t('competitions.checkin.checked_in') : t('competitions.checkin.not_checked_in')}
                                    </button>
                                </div>

                                <div className="col-span-1 flex justify-end">
                                    {/* Additional info or quick actions */}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-20 text-center text-muted-foreground space-y-4">
                            <div className="h-20 w-20 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/5">
                                <Search className="h-8 w-8 opacity-20" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-black uppercase tracking-tight opacity-50">
                                    {t('common.no_data')}
                                </p>
                                <p className="text-[10px] font-bold uppercase tracking-widest opacity-30">
                                    {t('competitions.checkin.search_athletes_hint', { defaultValue: 'TRY ADJUSTING YOUR SEARCH' })}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
