import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Trophy,
    Calendar,
    Dumbbell,
    Zap,
    Timer,
    Target,
    Activity,
    Flame,
    ChevronDown,
    ChevronUp,
    ExternalLink,
    Coffee
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/hooks';
import { resolveMovementImage } from '@/lib/movementImages';
import { cn } from '@/lib/utils';
import type { SessionBlock } from '@/components/WODDesigner';
import { Link } from 'react-router-dom';

interface TodayWodData {
    id: string;
    title: string;
    date: string;
    track: 'CrossFit' | 'Novice' | 'Bodybuilding' | 'Engine';
    metcon: string;
    stimulus: string;
    scaling_options: string;
    scaling_beginner: string;
    scaling_intermediate: string;
    scaling_advanced: string;
    scaling_injured: string;
    modalities: string[];
    structure: SessionBlock[];
}

interface BoxMovement {
    id: string;
    name: string;
    category: string;
    image_url: string | null;
    demo_url: string | null;
}

const BLOCK_ICONS: Record<string, React.ReactNode> = {
    warmup: <Flame className="h-3.5 w-3.5" />,
    strength: <Dumbbell className="h-3.5 w-3.5" />,
    conditioning: <Zap className="h-3.5 w-3.5" />,
    wod: <Timer className="h-3.5 w-3.5" />,
    accessory: <Target className="h-3.5 w-3.5" />,
    cooldown: <Activity className="h-3.5 w-3.5" />,
};

const BLOCK_COLORS: Record<string, string> = {
    warmup: 'text-orange-500',
    strength: 'text-blue-500',
    conditioning: 'text-purple-500',
    wod: 'text-red-500',
    accessory: 'text-green-500',
    cooldown: 'text-slate-500',
};

export const TodayWod: React.FC = () => {
    const { currentBox } = useAuth();
    const { t } = useLanguage();
    const [wods, setWods] = useState<TodayWodData[]>([]);
    const [movements, setMovements] = useState<BoxMovement[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTrack, setSelectedTrack] = useState<string>('');
    const [showScaling, setShowScaling] = useState(false);

    useEffect(() => {
        if (currentBox?.id) fetchTodayData();
    }, [currentBox]);

    const fetchTodayData = async () => {
        setLoading(true);
        const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD local timezone

        const [wodsResult, movementsResult] = await Promise.all([
            supabase.from('wods').select('*')
                .eq('box_id', currentBox!.id)
                .eq('date', today),
            supabase.from('movements').select('id, name, category, image_url, demo_url')
                .eq('box_id', currentBox!.id)
        ]);

        const fetchedWods = (wodsResult.data || []).map((w: any) => ({
            ...w,
            modalities: w.modalities || [],
            structure: w.structure || [],
            metcon: w.metcon || '',
            stimulus: w.stimulus || '',
            scaling_options: w.scaling_options || '',
            scaling_beginner: w.scaling_beginner || '',
            scaling_intermediate: w.scaling_intermediate || '',
            scaling_advanced: w.scaling_advanced || '',
            scaling_injured: w.scaling_injured || '',
            track: w.track || 'CrossFit',
        })) as TodayWodData[];

        setWods(fetchedWods);
        setMovements((movementsResult.data || []) as BoxMovement[]);

        if (fetchedWods.length > 0) {
            setSelectedTrack(fetchedWods[0].track);
        }
        setLoading(false);
    };

    const resolveMovement = (movementName: string): BoxMovement | undefined => {
        return movements.find(m =>
            m.name.toLowerCase() === movementName.toLowerCase()
        );
    };

    const activeWod = wods.find(w => w.track === selectedTrack);
    const availableTracks = [...new Set(wods.map(w => w.track))];
    const hasScaling = activeWod && (
        activeWod.scaling_beginner || activeWod.scaling_intermediate ||
        activeWod.scaling_advanced || activeWod.scaling_injured
    );

    // Loading state
    if (loading) {
        return (
            <Card className="col-span-full glass border-border animate-pulse">
                <CardContent className="p-8">
                    <div className="h-6 bg-muted rounded w-1/3 mb-4" />
                    <div className="h-4 bg-muted rounded w-2/3 mb-2" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                </CardContent>
            </Card>
        );
    }

    // Empty state — rest day
    if (wods.length === 0) {
        return (
            <Card className="col-span-full bg-muted/30 border-border overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-50" />
                <CardContent className="relative z-10 p-8 flex flex-col items-center text-center gap-4">
                    <div className="h-16 w-16 rounded-2xl glass flex items-center justify-center border-border">
                        <Coffee className="h-8 w-8 text-muted-foreground/60" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black uppercase italic tracking-tight text-foreground mb-2">
                            {t('athlete.rest_day')}
                        </h3>
                        <p className="text-xs font-bold text-muted-foreground/80 uppercase tracking-widest leading-relaxed max-w-md">
                            {t('athlete.rest_day_message')}
                        </p>
                    </div>
                    <Link to="/schedule">
                        <Button variant="outline" size="sm" className="gap-2 text-[10px] font-black uppercase tracking-widest">
                            <Calendar className="h-3 w-3" />
                            {t('athlete.view_schedule')}
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="col-span-full glass border-border overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-30" />

            {/* Header */}
            <CardHeader className="relative z-10 pt-6 px-6 pb-0">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    <CardTitle className="flex items-center gap-3 text-xl font-black italic uppercase tracking-tighter">
                        <div className="h-10 w-10 rounded-xl glass flex items-center justify-center border-primary/30">
                            <Trophy className="h-5 w-5 text-primary" />
                        </div>
                        {t('athlete.today_wod')}
                    </CardTitle>

                    {/* Modalities */}
                    {activeWod?.modalities && activeWod.modalities.length > 0 && (
                        <div className="flex gap-1.5 flex-wrap">
                            {activeWod.modalities.map(m => (
                                <Badge key={m} variant="secondary" className="bg-muted/50 text-[8px] font-black uppercase tracking-widest border border-border px-2 py-0.5 h-auto">
                                    {m}
                                </Badge>
                            ))}
                        </div>
                    )}
                </div>

                {/* Track Selector — only if >1 track */}
                {availableTracks.length > 1 && (
                    <div className="flex gap-2 mt-4">
                        {availableTracks.map(track => (
                            <button
                                key={track}
                                onClick={() => { setSelectedTrack(track); setShowScaling(false); }}
                                className={cn(
                                    "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-200",
                                    selectedTrack === track
                                        ? "bg-primary text-foreground shadow-md"
                                        : "bg-muted/50 text-muted-foreground hover:bg-muted border border-border"
                                )}
                            >
                                {track}
                            </button>
                        ))}
                    </div>
                )}

                {/* WOD Title */}
                {activeWod && (
                    <h2 className="text-2xl font-black uppercase italic tracking-tight text-foreground mt-4">
                        {activeWod.title}
                    </h2>
                )}
            </CardHeader>

            <CardContent className="relative z-10 px-6 pb-6 pt-4">
                {activeWod && (
                    <div className="space-y-5">
                        {/* Structure Blocks */}
                        {activeWod.structure && activeWod.structure.length > 0 ? (
                            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                                {activeWod.structure.map((block) => (
                                    <div key={block.id} className="p-4 rounded-2xl bg-muted/50 border border-border">
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className={cn("flex items-center gap-1.5", BLOCK_COLORS[block.type] || 'text-primary')}>
                                                {BLOCK_ICONS[block.type] || <Zap className="h-3.5 w-3.5" />}
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] italic">
                                                    {block.title}
                                                </span>
                                            </span>
                                            {block.sets && (
                                                <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest border-border ml-auto">
                                                    {block.sets} sets
                                                </Badge>
                                            )}
                                            {block.format && (
                                                <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest border-primary/30 text-primary">
                                                    {block.format}{block.timeCap ? ` — ${block.timeCap}` : ''}
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="space-y-2.5">
                                            {block.items.map((item) => {
                                                const mov = resolveMovement(item.movementName);
                                                const imgUrl = resolveMovementImage(
                                                    item.movementName,
                                                    mov?.image_url || null,
                                                    mov?.category || 'Other'
                                                );

                                                return (
                                                    <div key={item.id} className="flex items-center gap-3">
                                                        {/* Movement Image */}
                                                        <div className="h-10 w-10 rounded-lg overflow-hidden flex-shrink-0 bg-muted border border-border">
                                                            <img
                                                                src={imgUrl}
                                                                alt={item.movementName}
                                                                loading="lazy"
                                                                className="h-full w-full object-cover"
                                                            />
                                                        </div>

                                                        {/* Movement Name + Notes */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-xs font-black uppercase italic leading-none text-foreground truncate">
                                                                    {item.movementName}
                                                                </p>
                                                                {mov?.demo_url && (
                                                                    <a
                                                                        href={mov.demo_url}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="text-primary/50 hover:text-primary transition-colors flex-shrink-0"
                                                                        title={t('athlete.watch_demo')}
                                                                    >
                                                                        <ExternalLink className="h-3 w-3" />
                                                                    </a>
                                                                )}
                                                            </div>
                                                            {item.notes && (
                                                                <p className="text-[9px] text-muted-foreground uppercase font-bold mt-1 opacity-60 leading-tight truncate">
                                                                    {item.notes}
                                                                </p>
                                                            )}
                                                        </div>

                                                        {/* Reps / Weight */}
                                                        {(item.reps || item.weight) && (
                                                            <div className="text-right flex-shrink-0">
                                                                <div className="px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20">
                                                                    <p className="text-[10px] font-black italic text-primary whitespace-nowrap">
                                                                        {item.reps}{item.weight && ` @ ${item.weight}`}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : activeWod.metcon ? (
                            /* Fallback: plain metcon text */
                            <div className="p-5 rounded-2xl bg-muted border border-border font-mono text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap italic">
                                {activeWod.metcon}
                            </div>
                        ) : null}

                        {/* Stimulus */}
                        {activeWod.stimulus && (
                            <div className="space-y-1.5">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-primary italic">
                                    {t('athlete.target_stimulus')}
                                </h4>
                                <p className="text-xs text-muted-foreground uppercase font-bold leading-relaxed">
                                    {activeWod.stimulus}
                                </p>
                            </div>
                        )}

                        {/* Scaling Toggle + Section */}
                        {hasScaling && (
                            <div className="space-y-3">
                                <button
                                    onClick={() => setShowScaling(!showScaling)}
                                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
                                >
                                    {showScaling ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                    {showScaling ? t('athlete.hide_scaling') : t('athlete.show_scaling')}
                                </button>

                                {showScaling && (
                                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                        {/* General scaling */}
                                        {activeWod.scaling_options && (
                                            <div className="space-y-1.5">
                                                <h4 className="text-[10px] font-black uppercase tracking-widest text-primary italic">
                                                    {t('athlete.scaling_levels')}
                                                </h4>
                                                <p className="text-xs text-muted-foreground uppercase font-bold leading-relaxed">
                                                    {activeWod.scaling_options}
                                                </p>
                                            </div>
                                        )}

                                        {/* Tier cards */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {activeWod.scaling_beginner && (
                                                <div className="p-3 rounded-xl bg-green-500/5 border border-green-500/10">
                                                    <p className="text-[9px] font-black text-green-500 uppercase mb-1">{t('athlete.beginner')}</p>
                                                    <p className="text-[10px] font-bold text-foreground/70 italic">{activeWod.scaling_beginner}</p>
                                                </div>
                                            )}
                                            {activeWod.scaling_intermediate && (
                                                <div className="p-3 rounded-xl bg-orange-500/5 border border-orange-500/10">
                                                    <p className="text-[9px] font-black text-orange-500 uppercase mb-1">{t('athlete.intermediate')}</p>
                                                    <p className="text-[10px] font-bold text-foreground/70 italic">{activeWod.scaling_intermediate}</p>
                                                </div>
                                            )}
                                            {activeWod.scaling_advanced && (
                                                <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
                                                    <p className="text-[9px] font-black text-blue-500 uppercase mb-1">{t('athlete.advanced')}</p>
                                                    <p className="text-[10px] font-bold text-foreground/70 italic">{activeWod.scaling_advanced}</p>
                                                </div>
                                            )}
                                            {activeWod.scaling_injured && (
                                                <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/10">
                                                    <p className="text-[9px] font-black text-red-500 uppercase mb-1">{t('athlete.injured')}</p>
                                                    <p className="text-[10px] font-bold text-foreground/70 italic">{activeWod.scaling_injured}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
