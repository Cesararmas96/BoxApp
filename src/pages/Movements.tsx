import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    Plus,
    Trash2,
    Search,
    Dumbbell,
    Activity,
    RotateCcw,
    Zap,
    Trophy,
    Pencil,
    Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Card,
    CardContent,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useTranslation } from 'react-i18next';
import { cn } from "@/lib/utils";

interface Movement {
    id: string;
    name: string;
    category: 'Weightlifting' | 'Gymnastics' | 'Monostructural' | 'Accessory' | 'Other';
    demo_url?: string;
    created_at: string;
}

const CATEGORIES = ['Weightlifting', 'Gymnastics', 'Monostructural', 'Accessory', 'Other'];

const CATEGORY_ICONS: Record<string, any> = {
    Weightlifting: <Dumbbell className="h-4 w-4" />,
    Gymnastics: <Activity className="h-4 w-4" />,
    Monostructural: <Zap className="h-4 w-4" />,
    Accessory: <RotateCcw className="h-4 w-4" />,
    Other: <Trophy className="h-4 w-4" />
};

export const Movements: React.FC = () => {
    const { t } = useTranslation();
    const [movements, setMovements] = useState<Movement[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showEditor, setShowEditor] = useState(false);
    const [editingMovement, setEditingMovement] = useState<Movement | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        category: 'Weightlifting' as Movement['category'],
        demo_url: ''
    });
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    useEffect(() => {
        fetchMovements();
    }, []);

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    const fetchMovements = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('movements')
            .select('*')
            .order('name', { ascending: true });

        if (!error && data) {
            setMovements(data);
        }
        setLoading(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const dataToSave = {
            name: formData.name,
            category: formData.category,
            demo_url: formData.demo_url || null
        };

        let result;
        if (editingMovement) {
            result = await supabase
                .from('movements')
                .update(dataToSave)
                .eq('id', editingMovement.id);
        } else {
            result = await supabase
                .from('movements')
                .insert([dataToSave]);
        }

        const { error } = result;

        if (!error) {
            setNotification({
                type: 'success',
                message: editingMovement
                    ? t('movements.updated_success', { defaultValue: 'MOVIMIENTO ACTUALIZADO CON ÉXITO' })
                    : t('movements.created_success', { defaultValue: 'NUEVO MOVIMIENTO CREADO' })
            });
            setShowEditor(false);
            setEditingMovement(null);
            setFormData({ name: '', category: 'Weightlifting', demo_url: '' });
            fetchMovements();
        } else {
            console.error('Error saving movement:', error);
            setNotification({
                type: 'error',
                message: 'ERROR: ' + error.message
            });
        }
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this movement?')) return;
        setLoading(true);
        const { error } = await supabase.from('movements').delete().eq('id', id);
        if (!error) {
            setNotification({
                type: 'success',
                message: t('movements.deleted_success', { defaultValue: 'MOVIMIENTO ELIMINADO CORRECTAMENTE' })
            });
            fetchMovements();
        } else {
            setNotification({
                type: 'error',
                message: 'ERROR AL ELIMINAR: ' + error.message
            });
        }
        setLoading(false);
    };

    const filteredMovements = useMemo(() => {
        return movements.filter(m =>
            m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.category.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [movements, searchQuery]);

    return (
        <div className="space-y-6 text-left">
            <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold italic tracking-tighter uppercase text-primary flex items-center gap-2">
                        <Dumbbell className="h-8 w-8 text-primary" /> {t('movements.title', { defaultValue: 'MOVEMENTS LIBRARY' })}
                    </h1>
                    <p className="text-muted-foreground text-sm font-bold uppercase italic opacity-70">
                        {t('movements.subtitle', { defaultValue: 'Manage all exercises and movements' })}
                    </p>
                </div>

                <Dialog open={showEditor} onOpenChange={(open) => {
                    setShowEditor(open);
                    if (!open) {
                        setEditingMovement(null);
                        setFormData({ name: '', category: 'Weightlifting', demo_url: '' });
                    }
                }}>
                    <DialogTrigger asChild>
                        <Button className="gap-2 font-black uppercase italic shadow-lg shadow-primary/20">
                            <Plus className="h-4 w-4" /> {t('movements.new', { defaultValue: 'NEW MOVEMENT' })}
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">
                                {editingMovement ? 'EDIT MOVEMENT' : 'CREATE MOVEMENT'}
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSave} className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label className="uppercase text-[10px] font-black">NAME</Label>
                                <Input
                                    required
                                    placeholder="e.g. Back Squat"
                                    className="uppercase italic font-bold"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="uppercase text-[10px] font-black">CATEGORY</Label>
                                <Select value={formData.category} onValueChange={(v: any) => setFormData({ ...formData, category: v })}>
                                    <SelectTrigger className="font-bold italic uppercase">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CATEGORIES.map(c => (
                                            <SelectItem key={c} value={c} className="font-bold uppercase italic">{c}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="uppercase text-[10px] font-black">DEMO URL (OPTIONAL)</Label>
                                <Input
                                    placeholder="https://..."
                                    className="italic font-bold"
                                    value={formData.demo_url}
                                    onChange={e => setFormData({ ...formData, demo_url: e.target.value })}
                                />
                            </div>
                            <Button type="submit" className="w-full font-black uppercase italic" disabled={loading}>
                                {loading ? <Loader2 className="animate-spin h-4 w-4" /> : 'SAVE MOVEMENT'}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </header>

            <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search movement..."
                    className="pl-8 h-10 text-xs font-bold uppercase italic"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {loading && movements.length === 0 ? (
                    <div className="col-span-full py-20 flex justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    filteredMovements.map(m => (
                        <Card key={m.id} className="group hover:border-primary/40 transition-all shadow-md">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                        {CATEGORY_ICONS[m.category] || <Activity className="h-5 w-5" />}
                                    </div>
                                    <div>
                                        <p className="font-black uppercase italic text-sm tracking-tight">{m.name}</p>
                                        <p className="text-[10px] font-bold uppercase text-muted-foreground opacity-70 tracking-widest">{m.category}</p>
                                    </div>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-blue-500 hover:bg-blue-500/10"
                                        onClick={() => {
                                            setEditingMovement(m);
                                            setFormData({ name: m.name, category: m.category, demo_url: m.demo_url || '' });
                                            setShowEditor(true);
                                        }}
                                    >
                                        <Pencil className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                        onClick={() => handleDelete(m.id)}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
                {!loading && filteredMovements.length === 0 && (
                    <div className="col-span-full py-20 text-center border-2 border-dashed rounded-xl opacity-30">
                        <p className="font-black uppercase italic tracking-widest text-sm">No movements found</p>
                    </div>
                )}
            </div>

            {/* Premium Toast Notification */}
            {notification && (
                <div className="fixed bottom-6 right-6 z-[200] animate-in fade-in slide-in-from-bottom-5 duration-300 pointer-events-none sm:w-auto w-[calc(100%-3rem)]">
                    <div className={cn(
                        "flex items-center gap-3 p-4 rounded-xl shadow-2xl border backdrop-blur-md",
                        notification.type === 'success'
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500 shadow-emerald-500/10"
                            : "bg-destructive/10 border-destructive/20 text-destructive shadow-destructive/10"
                    )}>
                        <div className={cn(
                            "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                            notification.type === 'success' ? "bg-emerald-500/20" : "bg-destructive/20"
                        )}>
                            {notification.type === 'success' ? <Trophy className="h-5 w-5" /> : <Zap className="h-5 w-5" />}
                        </div>
                        <div className="flex flex-col">
                            <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1 opacity-70">
                                {notification.type === 'success' ? 'MISSION SUCCESS' : 'SYSTEM ALERT'}
                            </p>
                            <p className="text-xs font-bold uppercase italic tracking-tight leading-none">
                                {notification.message}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
