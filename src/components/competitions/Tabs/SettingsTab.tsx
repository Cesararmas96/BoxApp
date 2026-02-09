import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage, useNotification } from '@/hooks';
import {
    Settings,
    Save,
    Calendar,
    Trophy,
    Users
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Competition } from '@/types/supabase';
import { Switch } from '@/components/ui/switch';

interface SettingsTabProps {
    competition: Competition;
    onUpdate?: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ competition, onUpdate }) => {
    const { t } = useLanguage();
    const { currentBox } = useAuth();
    const { showNotification } = useNotification();

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        start_date: '',
        end_date: '',
        status: 'upcoming',
        scoring_system: 'table_point',
        is_team_event: false,
        team_size: 1
    });

    useEffect(() => {
        if (competition) {
            setFormData({
                name: competition.name || '',
                description: competition.description || '',
                start_date: competition.start_date || '',
                end_date: competition.end_date || '',
                status: competition.status || 'upcoming',
                scoring_system: competition.scoring_system || 'table_point',
                is_team_event: competition.is_team_event || false,
                team_size: competition.team_size || 1
            });
        }
    }, [competition]);

    const handleSave = async () => {
        setLoading(true);
        const { error } = await supabase
            .from('competitions')
            .update({
                name: formData.name,
                description: formData.description,
                start_date: formData.start_date,
                end_date: formData.end_date,
                status: formData.status,
                scoring_system: formData.scoring_system,
                is_team_event: formData.is_team_event,
                team_size: formData.is_team_event ? formData.team_size : 1
            })
            .eq('id', competition.id);

        if (error) {
            showNotification('error', 'ERROR UPDATING COMPETITION: ' + error.message.toUpperCase());
        } else {
            showNotification('success', 'COMPETITION UPDATED SUCCESSFULLY');
            if (onUpdate) onUpdate();
        }
        setLoading(false);
    };

    return (
        <div className="grid md:grid-cols-12 gap-10">
            <div className="md:col-span-8 space-y-6">
                <div className="space-y-2">
                    <h3 className="text-xl font-black italic uppercase tracking-tight flex items-center gap-3">
                        <Settings className="h-5 w-5 text-primary" />
                        {t('competitions.general_settings', { defaultValue: 'GENERAL SETTINGS' })}
                    </h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{t('competitions.configure_comp', { defaultValue: 'CONFIGURE COMPETITION DETAILS' })}</p>
                </div>

                <div className="space-y-6 bg-white/5 p-8 rounded-[2rem] border border-white/5">

                    {/* Basic Info */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('common.name')}</Label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="bg-zinc-900/50 border-white/10 text-lg font-bold"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('common.description')}</Label>
                            <Textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="bg-zinc-900/50 border-white/10 min-h-[100px]"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('competitions.start_date')}</Label>
                            <Input
                                type="date"
                                value={formData.start_date}
                                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                className="bg-zinc-900/50 border-white/10"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('competitions.end_date')}</Label>
                            <Input
                                type="date"
                                value={formData.end_date}
                                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                className="bg-zinc-900/50 border-white/10"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('common.status')}</Label>
                            <Select
                                value={formData.status}
                                onValueChange={(val) => setFormData({ ...formData, status: val })}
                            >
                                <SelectTrigger className="bg-zinc-900/50 border-white/10">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="upcoming">{t('competitions.status_upcoming', { defaultValue: 'UPCOMING' })}</SelectItem>
                                    <SelectItem value="active">{t('competitions.status_active', { defaultValue: 'ACTIVE' })}</SelectItem>
                                    <SelectItem value="finished">{t('competitions.status_finished', { defaultValue: 'FINISHED' })}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('competitions.scoring_system', { defaultValue: 'SCORING SYSTEM' })}</Label>
                            <Select
                                value={formData.scoring_system}
                                onValueChange={(val) => setFormData({ ...formData, scoring_system: val })}
                            >
                                <SelectTrigger className="bg-zinc-900/50 border-white/10">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="table_point">Table Points (100pt)</SelectItem>
                                    <SelectItem value="low_point">Low Point (1st = 1pt)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-white/5 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-sm font-bold uppercase tracking-wide">{t('competitions.is_team_event', { defaultValue: 'TEAM COMPETITION' })}</Label>
                                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{t('competitions.is_team_desc', { defaultValue: 'ENABLE IF ATHLETES COMPETE IN TEAMS' })}</p>
                            </div>
                            <Switch
                                checked={formData.is_team_event}
                                onCheckedChange={(checked) => setFormData({ ...formData, is_team_event: checked })}
                            />
                        </div>

                        {formData.is_team_event && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('competitions.team_size', { defaultValue: 'TEAM SIZE' })}</Label>
                                <Input
                                    type="number"
                                    value={formData.team_size}
                                    onChange={(e) => setFormData({ ...formData, team_size: parseInt(e.target.value) || 2 })}
                                    className="bg-zinc-900/50 border-white/10"
                                />
                            </div>
                        )}
                    </div>

                    <div className="pt-6">
                        <Button onClick={handleSave} className="w-full font-black uppercase tracking-widest h-14 rounded-xl shadow-lg shadow-primary/20" disabled={loading}>
                            <Save className="h-4 w-4 mr-2" />
                            {loading ? t('common.saving') : t('common.save_changes')}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="md:col-span-4 space-y-6">
                <div className="bg-primary/5 p-6 rounded-[2rem] border border-primary/10 text-center space-y-4">
                    <Trophy className="h-12 w-12 mx-auto text-primary/40" />
                    <div className="space-y-1">
                        <h4 className="font-black italic uppercase text-lg tracking-tight">{t('competitions.configuration', { defaultValue: 'CONFIGURATION' })}</h4>
                        <p className="text-xs text-muted-foreground">{t('competitions.config_help', { defaultValue: 'Use these settings to control how the competition runs. Changing scoring systems mid-competition may affect the leaderboard.' })}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
