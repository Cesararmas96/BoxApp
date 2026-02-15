import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage, useNotification } from '@/hooks';
import {
    ShieldCheck,
    Plus,
    Trash2,
    Search,
    UserPlus,
    User
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Competition } from '@/types/competitions';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

interface TooltipProps {
    content: string;
    children: React.ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({ content, children }) => (
    <div className="group relative">
        {children}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block whitespace-nowrap bg-black/90 text-foreground text-xs py-1 px-2 rounded">
            {content}
        </div>
    </div>
);

interface JudgesTabProps {
    competition: Competition;
}

interface Judge {
    id: string;
    competition_id: string;
    user_id: string;
    profile: {
        id: string;
        first_name: string;
        last_name: string;
        email: string;
        avatar_url: string | null;
    };
    created_at: string;
}

export const JudgesTab: React.FC<JudgesTabProps> = ({ competition }) => {
    const { t } = useLanguage();
    const { currentBox } = useAuth();
    const { showNotification } = useNotification();

    const [judges, setJudges] = useState<Judge[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [judgeToDelete, setJudgeToDelete] = useState<string | null>(null);

    const fetchJudges = async () => {
        if (!competition?.id) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('competition_judges')
            .select(`
                *,
                profile:profiles!user_id (
                    id,
                    first_name,
                    last_name,
                    email,
                    avatar_url
                )
            `)
            .eq('competition_id', competition.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching judges:', error);
            showNotification('error', 'ERROR FETCHING JUDGES');
        } else {
            // @ts-ignore
            setJudges(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchJudges();
    }, [competition?.id]);

    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        if (!currentBox?.id) return;

        setSearching(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, email, avatar_url')
            .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`)
            .eq('box_id', currentBox.id)
            .limit(5);

        if (!error && data) {
            // Filter out existing judges
            const existingIds = new Set(judges.map(j => j.profile.id));
            setSearchResults(data.filter(u => !existingIds.has(u.id)));
        }
        setSearching(false);
    };

    const handleAddJudge = async (userId: string) => {
        const { error } = await supabase
            .from('competition_judges')
            .insert([{
                competition_id: competition.id,
                user_id: userId,
                box_id: currentBox?.id
            }]);

        if (error) {
            showNotification('error', 'ERROR ADDING JUDGE');
        } else {
            showNotification('success', 'JUDGE ADDED SUCCESSFULLY');
            setSearchQuery('');
            setSearchResults([]);
            fetchJudges();
        }
    };

    const handleRemoveJudge = async () => {
        if (!judgeToDelete) return;

        const { error } = await supabase
            .from('competition_judges')
            .delete()
            .eq('id', judgeToDelete);

        if (error) {
            showNotification('error', 'ERROR REMOVING JUDGE');
        } else {
            showNotification('success', 'JUDGE REMOVED SUCCESSFULLY');
            fetchJudges();
        }
        setDeleteConfirmOpen(false);
        setJudgeToDelete(null);
    };

    return (
        <div className="grid md:grid-cols-12 gap-10 h-full">
            {/* Left Column: Add Judge */}
            <div className="md:col-span-4 flex flex-col gap-6">
                <div className="space-y-4 flex-shrink-0">
                    <div className="space-y-2">
                        <h3 className="text-xl font-black italic uppercase tracking-tight flex items-center gap-3">
                            <UserPlus className="h-5 w-5 text-primary" />
                            {t('competitions.add_judge', { defaultValue: 'ADD JUDGE' })}
                        </h3>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                            {t('competitions.search_judge_desc', { defaultValue: 'SEARCH AND INVITE JUDGES' })}
                        </p>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={t('common.search_by_name', { defaultValue: 'Search by name or email...' })}
                            className="bg-muted/50 border-border pl-11 h-12 rounded-xl"
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto min-h-[200px] space-y-3 pr-2 custom-scrollbar">
                    {searchQuery.length > 0 && searchResults.length === 0 && !searching && (
                        <div className="text-center p-8 text-muted-foreground text-xs uppercase tracking-widest font-bold">
                            {t('common.no_results', { defaultValue: 'No users found' })}
                        </div>
                    )}

                    {searchResults.map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-4 bg-muted/50 border border-border rounded-2xl hover:bg-muted transition-colors animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-10 w-10 border border-border">
                                    <AvatarImage src={user.avatar_url} />
                                    <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-bold text-sm leading-none text-foreground">{user.first_name} {user.last_name}</p>
                                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-1">{user.email}</p>
                                </div>
                            </div>
                            <Button
                                size="sm"
                                className="bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground border border-primary/20 rounded-xl h-9 w-9 p-0 shadow-lg"
                                onClick={() => handleAddJudge(user.id)}
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Column: Judges List */}
            <div className="md:col-span-8 flex flex-col gap-6 h-full min-h-0">
                <div className="flex items-center justify-between flex-shrink-0">
                    <div className="space-y-1">
                        <h3 className="text-xl font-black italic uppercase tracking-tight flex items-center gap-3">
                            <ShieldCheck className="h-5 w-5 text-primary" />
                            {t('competitions.judges_list', { defaultValue: 'REGISTERED JUDGES' })}
                        </h3>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                            {judges.length} {t('competitions.judges_count', { defaultValue: 'JUDGES' })}
                        </p>
                    </div>
                </div>

                <div className="bg-muted/50 border border-border rounded-[2rem] flex-1 overflow-hidden flex flex-col shadow-2xl">
                    <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                        {loading ? (
                            <div className="flex items-center justify-center h-full">
                                <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground animate-pulse">{t('common.loading')}</p>
                            </div>
                        ) : judges.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center p-10 space-y-4 opacity-50">
                                <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center">
                                    <ShieldCheck className="h-10 w-10 text-muted-foreground" />
                                </div>
                                <div className="space-y-2">
                                    <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">{t('competitions.no_judges')}</p>
                                    <p className="text-xs text-muted-foreground/60 max-w-[200px] mx-auto">{t('competitions.no_judges_desc', { defaultValue: 'Add judges from the left panel to allow them to score entries.' })}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 p-4">
                                {judges.map((judge) => (
                                    <div key={judge.id} className="group relative bg-muted/50 hover:bg-primary/5 border border-border hover:border-primary/20 p-5 rounded-2xl transition-all duration-300 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                <Avatar className="h-12 w-12 border-2 border-border group-hover:border-primary transition-colors">
                                                    <AvatarImage src={judge.profile.avatar_url || undefined} />
                                                    <AvatarFallback className="bg-muted text-muted-foreground font-black"><User className="h-5 w-5" /></AvatarFallback>
                                                </Avatar>
                                                <div className="absolute -bottom-1 -right-1 bg-primary text-[8px] font-black px-1.5 py-0.5 rounded text-primary-foreground uppercase tracking-wider shadow-sm">
                                                    {t('competitions.official_judge')}
                                                </div>
                                            </div>

                                            <div>
                                                <p className="font-black text-sm uppercase tracking-tight text-foreground group-hover:text-primary transition-colors">
                                                    {judge.profile.first_name} {judge.profile.last_name}
                                                </p>
                                                <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider mt-0.5 truncate max-w-[150px]">
                                                    {judge.profile.email}
                                                </p>
                                            </div>
                                        </div>

                                        <Tooltip content={t('common.remove', { defaultValue: 'Remove Judge' })}>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 rounded-lg text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                                                onClick={() => {
                                                    setJudgeToDelete(judge.id);
                                                    setDeleteConfirmOpen(true);
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </Tooltip>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <ConfirmationDialog
                isOpen={deleteConfirmOpen}
                onClose={() => setDeleteConfirmOpen(false)}
                title={t('common.confirm_delete', { defaultValue: 'CONFIRM REMOVAL' })}
                description={t('competitions.confirm_remove_judge', { defaultValue: 'Are you sure you want to remove this judge? They will no longer be able to score events.' })}
                confirmText={t('common.delete', { defaultValue: 'REMOVE JUDGE' })}
                cancelText={t('common.cancel', { defaultValue: 'CANCEL' })}
                onConfirm={handleRemoveJudge}
                variant="destructive"
                icon="destructive"
            />
        </div>
    );
};
