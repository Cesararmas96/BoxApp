import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    ExternalLink,
    Users,
    Loader2,
    Search,
    Building2,
    LogOut,
    Trash2,
    Pencil,
    X,
    Check,
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { buildTenantUrl } from '@/utils/tenant';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface BoxRow {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    login_background_url: string | null;
    created_at: string | null;
    member_count?: number;
}

export const SuperAdmin: React.FC = () => {
    const { signOut } = useAuth();
    const navigate = useNavigate();
    const [boxes, setBoxes] = useState<BoxRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [creating, setCreating] = useState(false);

    // Create form
    const [newName, setNewName] = useState('');
    const [newSlug, setNewSlug] = useState('');

    // Edit state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editSlug, setEditSlug] = useState('');

    const fetchBoxes = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('boxes')
                .select('id, name, slug, logo_url, login_background_url, created_at')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Get member counts per box
            const boxesWithCounts = await Promise.all(
                (data || []).map(async (box) => {
                    const { count } = await supabase
                        .from('profiles')
                        .select('id', { count: 'exact', head: true })
                        .eq('box_id', box.id);
                    return { ...box, member_count: count || 0 };
                })
            );

            setBoxes(boxesWithCounts);
        } catch (err) {
            console.error('Error fetching boxes:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBoxes();
    }, []);

    const autoSlug = (name: string) =>
        name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');

    const handleCreate = async () => {
        if (!newName.trim() || !newSlug.trim()) return;
        setCreating(true);
        try {
            const { error } = await supabase.from('boxes').insert({
                name: newName.trim(),
                slug: newSlug.trim(),
            } as any);
            if (error) throw error;
            setNewName('');
            setNewSlug('');
            setShowCreate(false);
            await fetchBoxes();
        } catch (err: any) {
            alert(err.message || 'Error creating box');
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`¿Eliminar "${name}"? Esta acción no se puede deshacer.`)) return;
        try {
            const { error } = await supabase.from('boxes').delete().eq('id', id);
            if (error) throw error;
            setBoxes((prev) => prev.filter((b) => b.id !== id));
        } catch (err: any) {
            alert(err.message || 'Error eliminando box');
        }
    };

    const startEdit = (box: BoxRow) => {
        setEditingId(box.id);
        setEditName(box.name);
        setEditSlug(box.slug);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditName('');
        setEditSlug('');
    };

    const saveEdit = async (id: string) => {
        if (!editName.trim() || !editSlug.trim()) return;
        try {
            const { error } = await supabase
                .from('boxes')
                .update({ name: editName.trim(), slug: editSlug.trim() } as any)
                .eq('id', id);
            if (error) throw error;
            setEditingId(null);
            await fetchBoxes();
        } catch (err: any) {
            alert(err.message || 'Error actualizando box');
        }
    };

    const filteredBoxes = boxes.filter(
        (b) =>
            b.name.toLowerCase().includes(search.toLowerCase()) ||
            b.slug.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#050508] text-white">
            {/* ── Header ── */}
            <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#050508]/80 backdrop-blur-xl">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center shadow-lg shadow-rose-500/20">
                            <Building2 className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-base font-bold tracking-tight">Boxora</h1>
                            <p className="text-[10px] text-white/30 font-medium uppercase tracking-widest">
                                Super Admin
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => signOut()}
                        className="text-white/40 hover:text-white hover:bg-white/5"
                    >
                        <LogOut className="h-4 w-4 mr-2" />
                        Salir
                    </Button>
                </div>
            </header>

            {/* ── Main content ── */}
            <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
                {/* Title + Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Boxes registrados</h2>
                        <p className="text-sm text-white/40 mt-1">
                            {boxes.length} box{boxes.length !== 1 ? 'es' : ''} en la plataforma
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                            <Input
                                placeholder="Buscar box..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 w-60 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25 h-10 rounded-xl"
                            />
                        </div>
                        <Button
                            onClick={() => setShowCreate(true)}
                            className="bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white font-semibold rounded-xl h-10 px-4 shadow-lg shadow-rose-500/20"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Nuevo Box
                        </Button>
                    </div>
                </div>

                {/* ── Create form (inline) ── */}
                {showCreate && (
                    <div className="mb-8 rounded-2xl bg-white/[0.04] border border-white/[0.08] p-6 animate-in fade-in slide-in-from-top-2 duration-300">
                        <h3 className="text-lg font-semibold mb-4">Crear nuevo Box</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs text-white/50 uppercase tracking-wider">
                                    Nombre del Box
                                </Label>
                                <Input
                                    placeholder="Ej: CrossFit Arena"
                                    value={newName}
                                    onChange={(e) => {
                                        setNewName(e.target.value);
                                        if (!editingId) setNewSlug(autoSlug(e.target.value));
                                    }}
                                    className="bg-white/[0.06] border-white/[0.08] text-white placeholder:text-white/25 rounded-xl"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs text-white/50 uppercase tracking-wider">
                                    Slug (URL)
                                </Label>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-white/30 shrink-0">/box/</span>
                                    <Input
                                        placeholder="crossfit-arena"
                                        value={newSlug}
                                        onChange={(e) => setNewSlug(autoSlug(e.target.value))}
                                        className="bg-white/[0.06] border-white/[0.08] text-white placeholder:text-white/25 rounded-xl"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-5">
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    setShowCreate(false);
                                    setNewName('');
                                    setNewSlug('');
                                }}
                                className="text-white/50 hover:text-white"
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleCreate}
                                disabled={!newName.trim() || !newSlug.trim() || creating}
                                className="bg-white text-black font-semibold rounded-xl hover:bg-white/90"
                            >
                                {creating ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    'Crear Box'
                                )}
                            </Button>
                        </div>
                    </div>
                )}

                {/* ── Loading state ── */}
                {loading && (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <Loader2 className="h-8 w-8 animate-spin text-white/40 mx-auto mb-3" />
                            <p className="text-sm text-white/30">Cargando boxes...</p>
                        </div>
                    </div>
                )}

                {/* ── Empty state ── */}
                {!loading && filteredBoxes.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="h-20 w-20 rounded-3xl bg-white/[0.04] flex items-center justify-center mb-4">
                            <Building2 className="h-10 w-10 text-white/20" />
                        </div>
                        <h3 className="text-lg font-semibold text-white/60 mb-1">
                            {search ? 'Sin resultados' : 'No hay boxes aún'}
                        </h3>
                        <p className="text-sm text-white/30">
                            {search
                                ? 'Intenta con otro término de búsqueda'
                                : 'Crea tu primer box para empezar'}
                        </p>
                    </div>
                )}

                {/* ── Box cards grid ── */}
                {!loading && filteredBoxes.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filteredBoxes.map((box) => (
                            <div
                                key={box.id}
                                className="group relative rounded-2xl overflow-hidden bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] transition-all duration-300 hover:shadow-lg hover:shadow-white/[0.02]"
                            >
                                {/* Background image / gradient */}
                                <div className="relative h-36 overflow-hidden">
                                    {box.login_background_url ? (
                                        <img
                                            src={box.login_background_url}
                                            alt=""
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-rose-500/20 via-purple-500/10 to-orange-500/20" />
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#050508] via-[#050508]/60 to-transparent" />

                                    {/* Actions overlay */}
                                    <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                        <button
                                            onClick={() => startEdit(box)}
                                            className="h-8 w-8 rounded-lg bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-colors"
                                            title="Editar"
                                        >
                                            <Pencil className="h-3.5 w-3.5 text-white/80" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(box.id, box.name)}
                                            className="h-8 w-8 rounded-lg bg-red-500/20 backdrop-blur-md flex items-center justify-center hover:bg-red-500/40 transition-colors"
                                            title="Eliminar"
                                        >
                                            <Trash2 className="h-3.5 w-3.5 text-red-400" />
                                        </button>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-5 -mt-8 relative">
                                    {/* Logo */}
                                    <div className="mb-3">
                                        {box.logo_url ? (
                                            <img
                                                src={box.logo_url}
                                                alt={box.name}
                                                className="h-14 w-14 rounded-2xl object-contain bg-white/10 backdrop-blur-md ring-2 ring-white/10 shadow-xl"
                                            />
                                        ) : (
                                            <div className="h-14 w-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center ring-2 ring-white/10 shadow-xl">
                                                <span className="text-xl font-black text-white">
                                                    {box.name.charAt(0)}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Edit mode */}
                                    {editingId === box.id ? (
                                        <div className="space-y-3">
                                            <Input
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                className="bg-white/[0.06] border-white/[0.08] text-white text-sm rounded-xl h-9"
                                                placeholder="Nombre"
                                            />
                                            <Input
                                                value={editSlug}
                                                onChange={(e) => setEditSlug(autoSlug(e.target.value))}
                                                className="bg-white/[0.06] border-white/[0.08] text-white text-sm rounded-xl h-9"
                                                placeholder="slug"
                                            />
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    onClick={() => saveEdit(box.id)}
                                                    className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl h-8 text-xs"
                                                >
                                                    <Check className="h-3 w-3 mr-1" />
                                                    Guardar
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={cancelEdit}
                                                    className="text-white/50 hover:text-white h-8 text-xs"
                                                >
                                                    <X className="h-3 w-3 mr-1" />
                                                    Cancelar
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <h3 className="text-base font-bold truncate">
                                                {box.name}
                                            </h3>
                                            <p className="text-xs text-white/30 font-mono mt-0.5 truncate">
                                                /box/{box.slug}
                                            </p>

                                            {/* Stats */}
                                            <div className="flex items-center gap-4 mt-4">
                                                <div className="flex items-center gap-1.5">
                                                    <Users className="h-3.5 w-3.5 text-white/30" />
                                                    <span className="text-xs text-white/50">
                                                        {box.member_count ?? 0} miembros
                                                    </span>
                                                </div>
                                                <span className="text-[10px] text-white/20">
                                                    {box.created_at
                                                        ? new Date(box.created_at).toLocaleDateString('es', {
                                                            month: 'short',
                                                            year: 'numeric',
                                                        })
                                                        : ''}
                                                </span>
                                            </div>

                                            {/* Visit button */}
                                            <Button
                                                onClick={() => {
                                                    const url = buildTenantUrl(box.slug);
                                                    if (url.startsWith('http')) {
                                                        window.location.href = url;
                                                    } else {
                                                        navigate(url);
                                                    }
                                                }}
                                                className="w-full mt-4 bg-white/[0.06] hover:bg-white/[0.10] text-white border border-white/[0.08] rounded-xl h-10 text-sm font-medium group/btn"
                                                variant="ghost"
                                            >
                                                <ExternalLink className="h-3.5 w-3.5 mr-2 text-white/40 group-hover/btn:text-white/70 transition-colors" />
                                                Visitar Box
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};
