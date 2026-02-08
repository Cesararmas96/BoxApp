import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    UserPlus,
    Inbox,
    CheckCircle,
    Clock,
    Search,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Toast } from '@/components/ui/toast-custom';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { useNotification, useLanguage } from '@/hooks';
import { cn } from '@/lib/utils';

interface Lead {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
    source: string | null;
    notes: string | null;
    status: string | null;
    box_id: string | null;
    created_at: string | null;
}

export const Leads: React.FC = () => {
    const { t } = useLanguage();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [newLead, setNewLead] = useState({ firstName: '', lastName: '', email: '' });
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;
    const { notification, showNotification, hideNotification, confirmState, showConfirm, hideConfirm } = useNotification();

    useEffect(() => {
        fetchLeads();
    }, []);

    const fetchLeads = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('leads')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && data) setLeads(data);
        setLoading(false);
    };

    const handleAddLead = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase
            .from('leads')
            .insert([{
                first_name: newLead.firstName,
                last_name: newLead.lastName,
                email: newLead.email,
                status: 'new'
            }]);

        if (error) {
            let errorMessage = t('leads.error_generic');
            if (error.code === '23505') {
                errorMessage = t('leads.error_duplicate_email');
            }
            showNotification('error', errorMessage.toUpperCase());
        } else {
            showNotification('success', t('leads.success_add').toUpperCase());
            setOpen(false);
            setNewLead({ firstName: '', lastName: '', email: '' });
            fetchLeads();
        }
        setLoading(false);
    };

    const updateStatus = async (lead: Lead, newStatus: string) => {
        const executeUpdate = async () => {
            setLoading(true);
            const { error } = await supabase
                .from('leads')
                .update({ status: newStatus })
                .eq('id', lead.id);

            if (error) {
                showNotification('error', t('leads.error_generic').toUpperCase());
            } else {
                if (newStatus === 'converted') {
                    await supabase
                        .from('profiles')
                        .insert([{
                            first_name: lead.first_name,
                            last_name: lead.last_name,
                            email: lead.email,
                            role: 'athlete',
                            status: 'active'
                        }]);
                    showNotification('success', t('leads.success_convert').toUpperCase());
                } else {
                    showNotification('success', t('common.success_update', { defaultValue: 'STATUS UPDATED' }).toUpperCase());
                }
                fetchLeads();
            }
            setLoading(false);
        };

        if (newStatus === 'converted') {
            showConfirm({
                title: t('leads.confirm_conversion_title'),
                description: t('leads.confirm_conversion_description'),
                onConfirm: executeUpdate,
                variant: 'default',
                icon: 'warning'
            });
        } else {
            executeUpdate();
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'new': return <Inbox className="h-3 w-3 mr-1" />;
            case 'contacted': return <Clock className="h-3 w-3 mr-1" />;
            case 'converted': return <CheckCircle className="h-3 w-3 mr-1" />;
            default: return null;
        }
    };

    const filteredLeads = leads.filter(lead =>
        `${lead.first_name} ${lead.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentLeads = filteredLeads.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);

    const handlePageChange = (pageNumber: number) => {
        setCurrentPage(pageNumber);
    };



    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between px-6 md:px-0">
                <div className="space-y-1">
                    <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase text-glow">
                        Growth <span className="text-primary not-italic">Pipeline</span>
                    </h1>
                    <p className="text-muted-foreground/80 text-sm font-medium tracking-wide max-w-lg">
                        {t('leads.subtitle')}
                    </p>
                </div>

                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button size="lg" className="shadow-2xl shadow-primary/20 gap-3 group px-8">
                            <div className="p-1 bg-white/20 rounded-lg group-hover:scale-110 transition-transform">
                                <UserPlus className="h-5 w-5" />
                            </div>
                            <span className="font-black italic uppercase tracking-widest text-xs">Acquire Lead</span>
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-white/10 glass rounded-[2.5rem]">
                        <div className="bg-primary/10 p-8 border-b border-white/5">
                            <DialogHeader>
                                <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter text-primary">Add Prospect</DialogTitle>
                                <DialogDescription className="text-muted-foreground/70 font-medium">
                                    Initiate a new journey in your box. Enter the athlete's coordinates below.
                                </DialogDescription>
                            </DialogHeader>
                        </div>
                        <form onSubmit={handleAddLead} className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1 italic">{t('leads.first_name')}</label>
                                    <Input
                                        placeholder="Jane"
                                        value={newLead.firstName}
                                        onChange={(e) => setNewLead({ ...newLead, firstName: e.target.value })}
                                        required
                                        className="h-14 rounded-2xl bg-muted/20 border-border/20 focus:border-primary/50 transition-colors"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1 italic">{t('leads.last_name')}</label>
                                    <Input
                                        placeholder="Smith"
                                        value={newLead.lastName}
                                        onChange={(e) => setNewLead({ ...newLead, lastName: e.target.value })}
                                        required
                                        className="h-14 rounded-2xl bg-muted/20 border-border/20 focus:border-primary/50 transition-colors"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1 italic">{t('leads.email')}</label>
                                <Input
                                    type="email"
                                    placeholder="jane@example.com"
                                    value={newLead.email}
                                    onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                                    required
                                    className="h-14 rounded-2xl bg-muted/20 border-border/20 focus:border-primary/50 transition-colors"
                                />
                            </div>
                            <DialogFooter className="pt-4">
                                <Button
                                    type="submit"
                                    disabled={loading || !newLead.firstName || !newLead.lastName || !newLead.email.includes('@')}
                                    size="lg"
                                    className="w-full text-base py-7 rounded-2xl shadow-xl shadow-primary/20"
                                >
                                    {loading ? t('common.saving') : t('leads.add_prospect')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="glass overflow-hidden border-border/40 shadow-premium">
                <CardHeader className="border-b border-border/10 bg-muted/5 px-8 py-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
                                <div className="relative h-12 w-12 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/30">
                                    <Inbox className="h-6 w-6 text-primary" />
                                </div>
                            </div>
                            <div>
                                <CardTitle className="text-xl font-black italic uppercase tracking-tighter">Acquisition <span className="text-primary">Pipeline</span></CardTitle>
                                <CardDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">{t('leads.subtitle')}</CardDescription>
                            </div>
                        </div>
                        <div className="relative w-full md:w-80 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder={t('common.search', { defaultValue: 'Search prospects...' })}
                                className="pl-12 bg-muted/20 border-border/10 focus:border-primary/50 h-11"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-primary/5">
                            <TableRow className="hover:bg-transparent border-white/5">
                                <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-primary/80 italic">Prospect Identity</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/80 italic">Lifecycle Status</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/80 italic text-center">Inception Date</TableHead>
                                <TableHead className="text-right px-8 text-[10px] font-black uppercase tracking-[0.2em] text-primary/80 italic">Navigation</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && leads.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-20">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Synchronizing Pipeline...</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : leads.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-24 opacity-20">
                                        <div className="flex flex-col items-center gap-4">
                                            <Inbox className="h-16 w-16" />
                                            <p className="text-sm font-black italic uppercase tracking-widest">Pipeline Empty. Ready for Growth?</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                currentLeads.map((lead) => (
                                    <TableRow
                                        key={lead.id}
                                        className="group border-white/5 hover:bg-primary/5 transition-all duration-300 cursor-pointer"
                                        onClick={() => {
                                            setSelectedLead(lead);
                                            setDetailsOpen(true);
                                        }}
                                    >
                                        <TableCell className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-xl bg-muted border border-border/40 flex items-center justify-center font-black italic text-primary group-hover:scale-110 transition-transform">
                                                    {lead.first_name?.[0] || ''}{lead.last_name?.[0] || ''}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-black italic uppercase tracking-tight text-base group-hover:text-primary transition-colors">
                                                        {lead.first_name} {lead.last_name}
                                                    </span>
                                                    <span className="text-[11px] font-bold text-muted-foreground/60 tracking-wider">
                                                        {lead.email}
                                                    </span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="glow" className={cn(
                                                "px-3 py-1 gap-1.5 h-7 rounded-lg border-2",
                                                lead.status === 'new' && "bg-blue-500/10 text-blue-400 border-blue-500/20",
                                                lead.status === 'contacted' && "bg-amber-500/10 text-amber-400 border-amber-500/20",
                                                lead.status === 'converted' && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-lg shadow-emerald-500/10"
                                            )}>
                                                {getStatusIcon(lead.status || 'new')}
                                                <span className="capitalize text-[10px] font-black tracking-widest italic">{lead.status || 'new'}</span>
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className="text-xs font-black italic uppercase tracking-tighter text-muted-foreground/40">
                                                {lead.created_at ? new Date(lead.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : '---'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right px-8">
                                            <Select
                                                defaultValue={lead.status || 'new'}
                                                onValueChange={(val) => updateStatus(lead, val)}
                                            >
                                                <SelectTrigger
                                                    className="w-[130px] h-9 bg-muted/40 border-border/10 hover:border-primary/50 text-[10px] font-black uppercase tracking-widest ml-auto transition-all"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <SelectValue placeholder="STATUS" />
                                                </SelectTrigger>
                                                <SelectContent className="glass border-border/40">
                                                    <SelectItem value="new" className="text-[10px] font-black uppercase tracking-widest italic">{t('leads.status_new')}</SelectItem>
                                                    <SelectItem value="contacted" className="text-[10px] font-black uppercase tracking-widest italic">{t('leads.status_contacted')}</SelectItem>
                                                    <SelectItem value="converted" className="text-[10px] font-black uppercase tracking-widest italic">{t('leads.status_converted')}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between gap-4 mt-8 bg-muted/20 p-4 rounded-2xl border border-muted-foreground/10 mx-6 mb-6">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage - 1)}
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
                                            onClick={() => handlePageChange(pageNumber)}
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
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="h-9 px-3 font-bold uppercase text-[10px] tracking-widest gap-2 italic"
                        >
                            {t('common.next', { defaultValue: 'NEXT' })}
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="hidden sm:block">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 italic">
                            {t('common.showing', { defaultValue: 'SHOWING' })} <span className="text-primary">{Math.min(filteredLeads.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filteredLeads.length, currentPage * itemsPerPage)}</span> {t('common.of', { defaultValue: 'OF' })} {filteredLeads.length} {t('leads.title')}
                        </p>
                    </div>
                </div>
            )}

            {/* Lead Details Modal */}
            <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
                <DialogContent className="sm:max-w-[500px] border-none glass-morphism p-0 overflow-hidden shadow-2xl">
                    <div className="relative">
                        <div className="absolute inset-0 h-32 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent pointer-events-none" />

                        <DialogHeader className="p-8 pb-4 relative z-10">
                            <div className="flex items-end gap-6">
                                <div className="h-20 w-20 rounded-2xl border-2 border-border/20 shadow-2xl bg-muted p-1 flex items-center justify-center font-black italic text-primary text-2xl uppercase">
                                    {selectedLead?.first_name?.[0]}{selectedLead?.last_name?.[0]}
                                </div>
                                <div className="flex-1 pb-2">
                                    <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter leading-none mb-1">
                                        {selectedLead?.first_name} {selectedLead?.last_name}
                                    </DialogTitle>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="glow" className={cn(
                                            "text-[9px] font-black italic uppercase tracking-widest py-0 px-2 shadow-sm",
                                            selectedLead?.status === 'new' && "bg-blue-500/10 text-blue-400 border-blue-500/20",
                                            selectedLead?.status === 'contacted' && "bg-amber-500/10 text-amber-400 border-amber-500/20",
                                            selectedLead?.status === 'converted' && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                        )}>
                                            {selectedLead?.status === 'new' ? t('leads.status_new') :
                                                selectedLead?.status === 'contacted' ? t('leads.status_contacted') :
                                                    selectedLead?.status === 'converted' ? t('leads.status_converted') : selectedLead?.status}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </DialogHeader>

                        <div className="px-8 pb-8 space-y-6 relative z-10">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1 p-4 rounded-2xl bg-muted/20 border border-border/10 shadow-inner">
                                    <p className="text-[10px] font-black italic text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <Inbox className="h-3 w-3 text-primary/50" /> {t('leads.email').toUpperCase()}
                                    </p>
                                    <p className="text-xs font-bold truncate opacity-80">{selectedLead?.email || 'N/A'}</p>
                                    <p className="text-[10px] font-medium text-muted-foreground italic">
                                        {selectedLead?.phone || t('leads.phone_none', { defaultValue: 'No phone provided' })}
                                    </p>
                                </div>
                                <div className="space-y-1 p-4 rounded-2xl bg-muted/20 border border-border/10 shadow-inner">
                                    <p className="text-[10px] font-black italic text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <Clock className="h-3 w-3 text-primary/50" /> {t('leads.origin', { defaultValue: 'ORIGIN' }).toUpperCase()}
                                    </p>
                                    <p className="text-xs font-bold truncate opacity-80 capitalize">{selectedLead?.source || 'Organic'}</p>
                                    <p className="text-[10px] font-medium text-muted-foreground italic">
                                        {t('leads.last_update', { defaultValue: 'Observed' })}: {selectedLead?.created_at ? new Date(selectedLead.created_at).toLocaleDateString() : '...'}
                                    </p>
                                </div>
                            </div>

                            <div className="p-5 rounded-2xl bg-gradient-to-br from-primary/[0.05] to-transparent border border-primary/10 shadow-sm">
                                <h3 className="text-[10px] font-black italic uppercase tracking-widest text-primary/80 mb-3 flex items-center gap-2">
                                    <Inbox className="h-3.5 w-3.5" /> {t('leads.notes').toUpperCase()}
                                </h3>
                                <p className="text-sm font-medium leading-relaxed opacity-70 italic whitespace-pre-wrap">
                                    {selectedLead?.notes || t('leads.no_notes', { defaultValue: 'No notes yet. Ready for outreach.' })}
                                </p>
                            </div>
                        </div>

                        <DialogFooter className="bg-muted/50 p-6 flex flex-row items-center justify-between border-t border-border/10">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDetailsOpen(false)}
                                className="text-[10px] font-black italic uppercase tracking-widest opacity-60 hover:opacity-100"
                            >
                                {t('common.close').toUpperCase()}
                            </Button>
                            {selectedLead?.status !== 'converted' && (
                                <Button
                                    variant="default"
                                    size="sm"
                                    className="h-10 px-6 rounded-xl shadow-xl shadow-primary/20 text-[10px] font-black italic uppercase tracking-widest"
                                    onClick={() => {
                                        if (selectedLead) {
                                            updateStatus(selectedLead, 'converted');
                                            setDetailsOpen(false);
                                        }
                                    }}
                                >
                                    {t('leads.convert_to_member')}
                                </Button>
                            )}
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

            {notification && (
                <Toast
                    type={notification.type}
                    message={notification.message}
                    onClose={hideNotification}
                />
            )}

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
