import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
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
    Loader2,
    ChevronLeft,
    ChevronRight,
    Image as ImageIcon,
    X,
    ExternalLink,
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
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useNotification, useLanguage } from '@/hooks';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Toast } from '@/components/ui/toast-custom';

interface Movement {
    id: string;
    name: string;
    category: 'Weightlifting' | 'Gymnastics' | 'Monostructural' | 'Accessory' | 'Other' | string | null;
    demo_url?: string | null;
    image_url?: string | null;
    box_id?: string | null;
    created_at: string | null;
}

const CATEGORIES = ['Weightlifting', 'Gymnastics', 'Monostructural', 'Accessory', 'Other'];

const CATEGORY_ICONS: Record<string, any> = {
    Weightlifting: <Dumbbell className="h-4 w-4" />,
    Gymnastics: <Activity className="h-4 w-4" />,
    Monostructural: <Zap className="h-4 w-4" />,
    Accessory: <RotateCcw className="h-4 w-4" />,
    Other: <Trophy className="h-4 w-4" />
};

const CATEGORY_COLORS: Record<string, string> = {
    Weightlifting: 'from-red-500/80 to-orange-500/80',
    Gymnastics: 'from-violet-500/80 to-fuchsia-500/80',
    Monostructural: 'from-sky-500/80 to-cyan-500/80',
    Accessory: 'from-emerald-500/80 to-teal-500/80',
    Other: 'from-amber-500/80 to-yellow-500/80'
};

const CATEGORY_DOT_COLORS: Record<string, string> = {
    Weightlifting: 'bg-red-400',
    Gymnastics: 'bg-violet-400',
    Monostructural: 'bg-sky-400',
    Accessory: 'bg-emerald-400',
    Other: 'bg-amber-400'
};

export const Movements: React.FC = () => {
    const { t } = useLanguage();
    const { currentBox } = useAuth();
    const [movements, setMovements] = useState<Movement[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showEditor, setShowEditor] = useState(false);
    const [editingMovement, setEditingMovement] = useState<Movement | null>(null);
    const [selectedMovement, setSelectedMovement] = useState<Movement | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12;
    const [formData, setFormData] = useState({
        name: '',
        category: 'Weightlifting' as string,
        demo_url: '',
        image_url: ''
    });
    const { notification, showNotification, hideNotification, confirmState, showConfirm, hideConfirm } = useNotification();

    useEffect(() => {
        if (currentBox?.id) {
            fetchMovements();
        }
    }, [currentBox?.id]);

    const fetchMovements = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('movements')
            .select('*')
            .eq('box_id', currentBox?.id || '')
            .order('name', { ascending: true });

        if (!error && data) {
            setMovements(data as unknown as Movement[]);
        }
        setLoading(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const movementData = {
            name: formData.name,
            category: formData.category,
            demo_url: formData.demo_url || null,
            image_url: formData.image_url || null,
            box_id: currentBox?.id
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
            setFormData({ name: '', category: 'Weightlifting', demo_url: '', image_url: '' });
            fetchMovements();
        }
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        setLoading(true);
        const { error } = await supabase.from('movements').delete().eq('id', id);

        if (error) {
            showNotification('error', `ERROR ELIMINANDO: ${error.message.toUpperCase()}`);
        } else {
            showNotification('success', 'MOVIMIENTO ELIMINADO CORRECTAMENTE');
            fetchMovements();
        }
        setLoading(false);
    };

    const filteredMovements = useMemo(() => {
        return movements.filter(m =>
            m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (m.category || '').toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [movements, searchQuery]);

    const paginatedMovements = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredMovements.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredMovements, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredMovements.length / itemsPerPage);

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
                        setFormData({ name: '', category: 'Weightlifting', demo_url: '', image_url: '' });
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
                            <DialogDescription className="sr-only">
                                {editingMovement ? `Editing ${editingMovement.name}` : 'Create a new movement in the library'}
                            </DialogDescription>
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
                                <Label className="uppercase text-[10px] font-black tracking-widest opacity-70">REFERENCE IMAGE (OPTIONAL)</Label>
                                <div className="relative w-full h-44 rounded-2xl overflow-hidden border-2 border-dashed border-muted-foreground/20 bg-muted/5 hover:border-primary/40 transition-colors group/img">
                                    {formData.image_url ? (
                                        <>
                                            <img
                                                src={formData.image_url}
                                                alt="Movement preview"
                                                className="w-full h-full object-contain p-3"
                                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                            />
                                            <button
                                                type="button"
                                                className="absolute top-2 right-2 h-7 w-7 rounded-full bg-destructive/90 text-white flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-all hover:scale-110"
                                                onClick={() => setFormData({ ...formData, image_url: '' })}
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full gap-2 opacity-40 group-hover/img:opacity-60 transition-opacity">
                                            <ImageIcon className="h-8 w-8" />
                                            <span className="text-[9px] font-black uppercase tracking-[0.2em]">No image set</span>
                                        </div>
                                    )}
                                </div>
                                <Input
                                    placeholder="/movements/back-squat.png"
                                    className="italic font-bold h-10 text-xs bg-muted/20 border-muted-foreground/10 focus-visible:ring-primary"
                                    value={formData.image_url}
                                    onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                                />
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

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {loading && movements.length === 0 ? (
                    <div className="col-span-full py-20 flex flex-col items-center gap-4 opacity-50">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] italic">Accessing Library...</p>
                    </div>
                ) : (
                    paginatedMovements.map(m => (
                        <Card
                            key={m.id}
                            className="group relative overflow-hidden cursor-pointer border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-background/60 backdrop-blur-sm"
                            onClick={() => setSelectedMovement(m)}
                        >
                            {/* Image area */}
                            <div className="relative h-40 w-full bg-gradient-to-br from-muted/20 to-muted/5 overflow-hidden">
                                {m.image_url ? (
                                    <img
                                        src={m.image_url}
                                        alt={m.name}
                                        className="w-full h-full object-contain p-3 transition-transform duration-500 group-hover:scale-110"
                                        onError={(e) => {
                                            const parent = (e.target as HTMLImageElement).parentElement;
                                            if (parent) {
                                                parent.innerHTML = '<div class="flex items-center justify-center h-full opacity-20"><svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6.5 6.5 11 11"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/><path d="M3 16.5V5a2 2 0 0 1 2-2h11"/><circle cx="9" cy="9" r="2"/><path d="M21 11V5a2 2 0 0 0-2-2H16"/><path d="M21 21H8"/><path d="M3 21v-5"/></svg></div>';
                                            }
                                        }}
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full">
                                        <div className="text-muted-foreground/15">
                                            {CATEGORY_ICONS[m.category || 'Other'] ? (
                                                React.cloneElement(CATEGORY_ICONS[m.category || 'Other'], { className: 'h-12 w-12' })
                                            ) : (
                                                <Activity className="h-12 w-12" />
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Category badge */}
                                <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full bg-gradient-to-r ${CATEGORY_COLORS[m.category || 'Other'] || 'from-gray-500/80 to-gray-400/80'} backdrop-blur-md`}>
                                    <span className="text-[8px] font-black uppercase tracking-widest text-white drop-shadow-sm">{m.category}</span>
                                </div>

                                {/* Hover overlay with action buttons */}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 bg-white/20 backdrop-blur-md text-white hover:bg-white/40 border border-white/20 rounded-xl transition-all scale-75 group-hover:scale-100"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingMovement(m);
                                            setFormData({ name: m.name, category: m.category || 'Other', demo_url: m.demo_url || '', image_url: m.image_url || '' });
                                            setShowEditor(true);
                                        }}
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 bg-red-500/30 backdrop-blur-md text-white hover:bg-red-500/60 border border-red-400/20 rounded-xl transition-all scale-75 group-hover:scale-100"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            showConfirm({
                                                title: t('common.confirm_delete', { defaultValue: 'CONFIRMAR ELIMINACIÓN' }),
                                                description: t('movements.delete_warning', { defaultValue: '¿ESTÁS SEGURO DE QUE DESEAS ELIMINAR ESTE MOVIMIENTO? ESTA ACCIÓN NO SE PUEDE DESHACER.' }),
                                                onConfirm: () => handleDelete(m.id),
                                                variant: 'destructive',
                                                icon: 'destructive'
                                            });
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Card footer */}
                            <CardContent className="p-3">
                                <p className="font-black uppercase italic text-xs tracking-tight leading-tight truncate" title={m.name}>{m.name}</p>
                                <div className="flex items-center gap-1 mt-1 opacity-50">
                                    <div className={`h-1.5 w-1.5 rounded-full ${CATEGORY_DOT_COLORS[m.category || 'Other'] || 'bg-primary'}`} />
                                    <p className="text-[8px] font-bold uppercase tracking-widest truncate">{m.category}</p>
                                </div>
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

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between gap-4 mt-8 bg-muted/20 p-4 rounded-2xl border border-muted-foreground/10">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="h-9 px-3 font-bold uppercase text-[10px] tracking-widest gap-2 italic"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            {t('common.previous', { defaultValue: 'PREVIOUS' })}
                        </Button>
                        <div className="flex items-center gap-1">
                            {[...Array(totalPages)].map((_, i) => {
                                const pageNumber = i + 1;
                                if (
                                    pageNumber === 1 ||
                                    pageNumber === totalPages ||
                                    Math.abs(pageNumber - currentPage) <= 1
                                ) {
                                    return (
                                        <Button
                                            key={pageNumber}
                                            variant={currentPage === pageNumber ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setCurrentPage(pageNumber)}
                                            className="h-9 w-9 font-bold text-[10px] italic shadow-lg shadow-primary/10"
                                        >
                                            {pageNumber}
                                        </Button>
                                    );
                                } else if (
                                    pageNumber === currentPage - 2 ||
                                    pageNumber === currentPage + 2
                                ) {
                                    return <span key={pageNumber} className="text-muted-foreground text-xs">...</span>;
                                }
                                return null;
                            })}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="h-9 px-3 font-bold uppercase text-[10px] tracking-widest gap-2 italic"
                        >
                            {t('common.next', { defaultValue: 'NEXT' })}
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="hidden sm:block">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 italic">
                            {t('common.showing', { defaultValue: 'SHOWING' })} <span className="text-primary">{Math.min(filteredMovements.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filteredMovements.length, currentPage * itemsPerPage)}</span> {t('common.of', { defaultValue: 'OF' })} {filteredMovements.length} {t('movements.title', { defaultValue: 'MOVEMENTS' })}
                        </p>
                    </div>
                </div>
            )}

            {/* Movement Detail Modal */}
            <Dialog open={!!selectedMovement} onOpenChange={(open) => { if (!open) setSelectedMovement(null); }}>
                <DialogContent className="sm:max-w-lg border-0 bg-background/95 backdrop-blur-xl shadow-2xl p-0 overflow-hidden">
                    <DialogHeader className="sr-only">
                        <DialogTitle>{selectedMovement?.name || 'Movement Detail'}</DialogTitle>
                        <DialogDescription>Detailed view of the {selectedMovement?.name} movement</DialogDescription>
                    </DialogHeader>

                    {selectedMovement && (
                        <div>
                            {/* Image section */}
                            <div className="relative h-64 w-full bg-gradient-to-br from-muted/20 to-muted/5">
                                {selectedMovement.image_url ? (
                                    <img
                                        src={selectedMovement.image_url}
                                        alt={selectedMovement.name}
                                        className="w-full h-full object-contain p-6"
                                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full">
                                        <div className="text-muted-foreground/15">
                                            {CATEGORY_ICONS[selectedMovement.category || 'Other'] ? (
                                                React.cloneElement(CATEGORY_ICONS[selectedMovement.category || 'Other'], { className: 'h-20 w-20' })
                                            ) : (
                                                <Activity className="h-20 w-20" />
                                            )}
                                        </div>
                                    </div>
                                )}
                                <div className={`absolute top-4 left-4 px-3 py-1 rounded-full bg-gradient-to-r ${CATEGORY_COLORS[selectedMovement.category || 'Other'] || 'from-gray-500/80 to-gray-400/80'} backdrop-blur-md`}>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white drop-shadow-sm flex items-center gap-1.5">
                                        {CATEGORY_ICONS[selectedMovement.category || 'Other']}
                                        {selectedMovement.category}
                                    </span>
                                </div>
                            </div>

                            {/* Info section */}
                            <div className="p-6 space-y-4">
                                <h2 className="text-2xl font-black uppercase italic tracking-tighter">{selectedMovement.name}</h2>

                                {selectedMovement.demo_url && (
                                    <a
                                        href={selectedMovement.demo_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-xs font-black uppercase tracking-widest"
                                    >
                                        <ExternalLink className="h-3.5 w-3.5" />
                                        VIEW DEMO
                                    </a>
                                )}

                                <div className="flex gap-2 pt-2">
                                    <Button
                                        variant="outline"
                                        className="flex-1 gap-2 font-bold uppercase italic text-xs h-10"
                                        onClick={() => {
                                            setEditingMovement(selectedMovement);
                                            setFormData({ name: selectedMovement.name, category: selectedMovement.category || 'Other', demo_url: selectedMovement.demo_url || '', image_url: selectedMovement.image_url || '' });
                                            setSelectedMovement(null);
                                            setShowEditor(true);
                                        }}
                                    >
                                        <Pencil className="h-3.5 w-3.5" /> EDIT
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="gap-2 font-bold uppercase italic text-xs h-10 text-destructive hover:bg-destructive/10 border-destructive/20"
                                        onClick={() => {
                                            setSelectedMovement(null);
                                            showConfirm({
                                                title: t('common.confirm_delete', { defaultValue: 'CONFIRMAR ELIMINACIÓN' }),
                                                description: t('movements.delete_warning', { defaultValue: '¿ESTÁS SEGURO DE QUE DESEAS ELIMINAR ESTE MOVIMIENTO? ESTA ACCIÓN NO SE PUEDE DESHACER.' }),
                                                onConfirm: () => handleDelete(selectedMovement.id),
                                                variant: 'destructive',
                                                icon: 'destructive'
                                            });
                                        }}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" /> DELETE
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Premium Toast Notification System */}
            {notification && (
                <Toast
                    type={notification.type}
                    message={notification.message}
                    onClose={hideNotification}
                />
            )}

            {/* Premium Confirmation Dialog */}
            <ConfirmationDialog
                isOpen={confirmState.isOpen}
                onClose={hideConfirm}
                onConfirm={confirmState.onConfirm}
                title={confirmState.title}
                description={confirmState.description}
                variant={confirmState.variant}
                icon={confirmState.icon}
            />
        </div>
    );
};
