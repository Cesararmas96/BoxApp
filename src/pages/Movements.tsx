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
import { useNotification } from '@/hooks/useNotification';
import { Toast } from '@/components/ui/toast-custom';

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
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [idToDelete, setIdToDelete] = useState<string | null>(null);
    const { notification, showNotification, hideNotification } = useNotification();

    useEffect(() => {
        fetchMovements();
    }, []);

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

        const movementData = {
            name: formData.name,
            category: formData.category,
            demo_url: formData.demo_url || null
        };

        let result;
        if (editingMovement) {
            result = await supabase
                .from('movements')
                .update(movementData)
                .eq('id', editingMovement.id);
        } else {
            result = await supabase
                .from('movements')
                .insert([movementData]);
        }

        if (result.error) {
            if (result.error.code === '23505') {
                showNotification('error', 'THAT MOVEMENT ALREADY EXISTS IN THE LIBRARY');
            } else {
                showNotification('error', `ERROR: ${result.error.message.toUpperCase()}`);
            }
        } else {
            showNotification('success', editingMovement ? 'MOVEMENT UPDATED SUCCESSFULY' : 'NEW MOVEMENT CREATED');
            setShowEditor(false);
            setEditingMovement(null);
            setFormData({ name: '', category: 'Weightlifting', demo_url: '' });
            fetchMovements();
        }
        setLoading(false);
    };

    const handleDelete = async () => {
        if (!idToDelete) return;
        setLoading(true);
        const { error } = await supabase.from('movements').delete().eq('id', idToDelete);

        if (error) {
            showNotification('error', `ERROR ELIMINANDO: ${error.message.toUpperCase()}`);
        } else {
            showNotification('success', 'MOVIMIENTO ELIMINADO CORRECTAMENTE');
            fetchMovements();
        }
        setDeleteConfirmOpen(false);
        setIdToDelete(null);
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
                    <DialogContent shadow-none className="border bg-background/95 backdrop-blur-md">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-2">
                                <Zap className="h-6 w-6 text-primary" />
                                {editingMovement ? 'EDIT MOVEMENT' : 'CREATE MOVEMENT'}
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSave} className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label className="uppercase text-[10px] font-black tracking-widest opacity-70">NAME</Label>
                                <Input
                                    required
                                    placeholder="e.g. Back Squat"
                                    className="uppercase italic font-bold h-12 bg-muted/20 border-muted-foreground/10 focus-visible:ring-primary"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="uppercase text-[10px] font-black tracking-widest opacity-70">CATEGORY</Label>
                                <Select value={formData.category} onValueChange={(v: any) => setFormData({ ...formData, category: v })}>
                                    <SelectTrigger className="font-bold italic uppercase h-12 bg-muted/20 border-muted-foreground/10 focus-visible:ring-primary">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent shadow-none>
                                        {CATEGORIES.map(c => (
                                            <SelectItem key={c} value={c} className="font-bold uppercase italic">{c}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="uppercase text-[10px] font-black tracking-widest opacity-70">DEMO URL (OPTIONAL)</Label>
                                <Input
                                    placeholder="https://..."
                                    className="italic font-bold h-12 bg-muted/20 border-muted-foreground/10 focus-visible:ring-primary"
                                    value={formData.demo_url}
                                    onChange={e => setFormData({ ...formData, demo_url: e.target.value })}
                                />
                            </div>
                            <Button type="submit" className="w-full font-black uppercase italic h-12 text-lg shadow-xl shadow-primary/20" disabled={loading}>
                                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'SAVE MOVEMENT'}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </header>

            <div className="relative w-full max-w-sm group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                    placeholder="Search movement..."
                    className="pl-10 h-11 text-xs font-bold uppercase italic bg-muted/20 border-muted-foreground/10 focus-visible:ring-primary"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {loading && movements.length === 0 ? (
                    <div className="col-span-full py-20 flex flex-col items-center gap-4 opacity-50">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] italic">Accessing Library...</p>
                    </div>
                ) : (
                    filteredMovements.map(m => (
                        <Card key={m.id} className="group hover:border-primary/40 transition-all shadow-md bg-background/50 backdrop-blur-sm overflow-hidden">
                            <CardContent className="p-4 flex items-center justify-between relative">
                                <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
                                        {CATEGORY_ICONS[m.category] || <Activity className="h-6 w-6" />}
                                    </div>
                                    <div>
                                        <p className="font-black uppercase italic text-sm tracking-tight leading-none mb-1">{m.name}</p>
                                        <div className="flex items-center gap-1.5 opacity-50">
                                            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                            <p className="text-[9px] font-black uppercase tracking-widest">{m.category}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 text-blue-500 hover:bg-blue-500/10 border border-transparent hover:border-blue-500/20"
                                        onClick={() => {
                                            setEditingMovement(m);
                                            setFormData({ name: m.name, category: m.category, demo_url: m.demo_url || '' });
                                            setShowEditor(true);
                                        }}
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/20"
                                        onClick={() => {
                                            setIdToDelete(m.id);
                                            setDeleteConfirmOpen(true);
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="absolute right-0 top-0 h-full w-1 bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                            </CardContent>
                        </Card>
                    ))
                )}
                {!loading && filteredMovements.length === 0 && (
                    <div className="col-span-full py-20 text-center border-2 border-dashed rounded-2xl bg-muted/5 group">
                        <Search className="h-10 w-10 mx-auto mb-4 text-muted-foreground opacity-20 group-hover:scale-110 transition-transform" />
                        <p className="font-black uppercase italic tracking-widest text-xs opacity-40">No movements found matching "{searchQuery}"</p>
                    </div>
                )}
            </div>

            {/* Premium Toast Notification System */}
            {notification && (
                <Toast
                    type={notification.type}
                    message={notification.message}
                    onClose={hideNotification}
                />
            )}

            {/* Premium Confirmation Dialog */}
            <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <DialogContent shadow-none className="sm:max-w-[400px] border-destructive/20 bg-background/95 backdrop-blur-xl">
                    <DialogHeader className="space-y-4">
                        <div className="mx-auto h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center border-2 border-destructive/20 shadow-[0_0_30px_rgba(239,68,68,0.1)]">
                            <Trash2 className="h-10 w-10 text-destructive animate-pulse" />
                        </div>
                        <div className="space-y-2 text-center">
                            <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter text-destructive">
                                {t('common.confirm_delete', { defaultValue: 'CONFIRMAR ELIMINACIÓN' })}
                            </DialogTitle>
                            <p className="text-sm font-bold uppercase italic tracking-tight text-muted-foreground opacity-70 px-4 leading-relaxed">
                                {t('movements.delete_warning', { defaultValue: '¿ESTÁS SEGURO DE QUE DESEAS ELIMINAR ESTE MOVIMIENTO? ESTA ACCIÓN NO SE PUEDE DESHACER.' })}
                            </p>
                        </div>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-3 mt-6">
                        <Button
                            variant="outline"
                            className="font-black uppercase italic h-14 border-muted-foreground/20 hover:bg-muted/50 text-base"
                            onClick={() => {
                                setDeleteConfirmOpen(false);
                                setIdToDelete(null);
                            }}
                        >
                            {t('common.cancel', { defaultValue: 'CANCELAR' })}
                        </Button>
                        <Button
                            variant="destructive"
                            className="font-black uppercase italic h-14 shadow-xl shadow-destructive/20 text-base"
                            onClick={handleDelete}
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : t('common.delete', { defaultValue: 'ELIMINAR' })}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};
