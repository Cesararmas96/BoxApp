import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useLanguage, useNotification } from '@/hooks';
import {
    Dumbbell,
    Plus,
    Trash2,
    Users
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
import { Competition, CompetitionDivision as Division } from '@/types/competitions';

interface DivisionsTabProps {
    competition: Competition;
}

export const DivisionsTab: React.FC<DivisionsTabProps> = ({ competition }) => {
    const { t } = useLanguage();
    const { showNotification, showConfirm } = useNotification();

    const [divisions, setDivisions] = useState<Division[]>([]);

    // Form State
    const [newDivision, setNewDivision] = useState({
        name: '',
        gender: 'male' as 'male' | 'female' | 'mixed' | 'any',
        description: ''
    });

    useEffect(() => {
        if (competition) {
            fetchDivisions();
        }
    }, [competition]);

    const fetchDivisions = async () => {
        const { data, error } = await supabase
            .from('competition_divisions')
            .select('*')
            .eq('competition_id', competition.id)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching divisions:', error);
        } else if (data) {
            setDivisions(data as Division[]);
        }
    };

    const handleAddDivision = async () => {
        if (!competition || !newDivision.name) return;

        const payload = {
            competition_id: competition.id,
            name: newDivision.name,
            gender: newDivision.gender,
            description: newDivision.description
        };

        const { error } = await supabase
            .from('competition_divisions')
            .insert([payload]);

        if (error) {
            showNotification('error', t('competitions.error_adding_division', { defaultValue: 'ERROR ADDING DIVISION' }) + ': ' + error.message.toUpperCase());
        } else {
            showNotification('success', t('competitions.division_added_success', { defaultValue: 'DIVISION ADDED SUCCESSFULLY' }));
            // Reset form
            setNewDivision({
                name: '',
                gender: 'male',
                description: ''
            });
            fetchDivisions();
        }
    };

    const handleRemoveDivision = async (divisionId: string) => {
        showConfirm({
            title: t('common.confirm_delete', { defaultValue: 'CONFIRMAR ELIMINACIÓN' }),
            description: t('competitions.remove_division_warning', { defaultValue: '¿ESTÁS SEGURO DE QUE DESEAS ELIMINAR ESTA DIVISIÓN? ESTA ACCIÓN NO SE PUEDE DESHACER.' }),
            onConfirm: async () => {
                const { error } = await supabase
                    .from('competition_divisions')
                    .delete()
                    .eq('id', divisionId);

                if (error) {
                    showNotification('error', t('competitions.error_removing_division', { defaultValue: 'ERROR REMOVING DIVISION' }) + ': ' + error.message.toUpperCase());
                } else {
                    showNotification('success', t('competitions.division_removed_success', { defaultValue: 'DIVISION REMOVED FROM COMPETITION' }));
                    fetchDivisions();
                }
            },
            variant: 'destructive',
            icon: 'destructive'
        });
    };

    return (
        <div className="grid md:grid-cols-12 gap-10">
            {/* Left Column: Form */}
            <div className="md:col-span-5 space-y-6">
                <div className="space-y-2">
                    <h3 className="text-xl font-black italic uppercase tracking-tight flex items-center gap-3">
                        <Plus className="h-5 w-5 text-primary" />
                        {t('competitions.add_division', { defaultValue: 'ADD DIVISION' })}
                    </h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{t('competitions.division_details', { defaultValue: 'DIVISION DETAILS' })}</p>
                </div>

                <div className="space-y-4 bg-white/5 p-6 rounded-[2rem] border border-white/5">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('common.name')}</Label>
                        <Input
                            value={newDivision.name}
                            onChange={(e) => setNewDivision({ ...newDivision, name: e.target.value })}
                            placeholder="ex. RX Male"
                            className="bg-zinc-900/50 border-white/10"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('common.gender_label')}</Label>
                        <Select
                            value={newDivision.gender}
                            onValueChange={(val: any) => setNewDivision({ ...newDivision, gender: val })}
                        >
                            <SelectTrigger className="bg-zinc-900/50 border-white/10">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="male">{t('common.gender.male')}</SelectItem>
                                <SelectItem value="female">{t('common.gender.female')}</SelectItem>
                                <SelectItem value="mixed">{t('common.gender.mixed', { defaultValue: 'Mixed' })}</SelectItem>
                                <SelectItem value="any">{t('common.gender.any', { defaultValue: 'Any' })}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('common.description')}</Label>
                        <Input
                            value={newDivision.description}
                            onChange={(e) => setNewDivision({ ...newDivision, description: e.target.value })}
                            placeholder={t('common.description_optional', { defaultValue: 'Optional description' })}
                            className="bg-zinc-900/50 border-white/10"
                        />
                    </div>

                    <div className="space-y-2 pt-4">
                        <Button onClick={handleAddDivision} className="w-full font-black uppercase tracking-widest h-12 rounded-xl">
                            <Plus className="h-4 w-4 mr-2" />
                            {t('competitions.add_division_btn', { defaultValue: 'ADD DIVISION' })}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Right Column: List */}
            <div className="md:col-span-7 space-y-6">
                <div className="space-y-2">
                    <h3 className="text-xl font-black italic uppercase tracking-tight flex items-center gap-3">
                        <Dumbbell className="h-5 w-5 text-primary" />
                        {t('competitions.divisions_list', { defaultValue: 'DIVISIONS LIST' })}
                        <Badge variant="outline" className="ml-auto font-black italic">{divisions.length}</Badge>
                    </h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{t('competitions.manage_divisions', { defaultValue: 'MANAGE DIVISIONS' })}</p>
                </div>

                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                    {divisions.map((division) => (
                        <div key={division.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/30 transition-all group relative overflow-hidden flex justify-between items-center">
                            <div className="space-y-1">
                                <h4 className="font-black italic uppercase text-lg tracking-tight">{division.name}</h4>
                                <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                                    <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {division.gender}</span>
                                </div>
                                {division.description && (
                                    <p className="text-xs text-muted-foreground mt-1">{division.description}</p>
                                )}
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                                onClick={() => handleRemoveDivision(division.id)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                    {divisions.length === 0 && (
                        <div className="py-20 text-center text-muted-foreground space-y-2 bg-white/5 rounded-[2rem] border-dashed border-2 border-white/10">
                            <Dumbbell className="h-10 w-10 mx-auto opacity-20" />
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-50">{t('competitions.no_divisions', { defaultValue: 'NO DIVISIONS FOUND' })}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
