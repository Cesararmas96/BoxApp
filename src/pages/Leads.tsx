import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import {
    UserPlus,
    Inbox,
    CheckCircle,
    Clock,
    Search,
    ChevronLeft,
    ChevronRight,
    Phone,
    Loader2,
    CalendarDays
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
    const { currentBox } = useAuth();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [newLead, setNewLead] = useState({ firstName: '', lastName: '', email: '', phone: '', source: '' });
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [conversionSuccessOpen, setConversionSuccessOpen] = useState(false);
    const [convertedLeadName, setConvertedLeadName] = useState('');
    const [convertedMemberId, setConvertedMemberId] = useState<string | null>(null);
    const [plans, setPlans] = useState<any[]>([]);
    const [selectedPlanId, setSelectedPlanId] = useState('');
    const [assigningPlan, setAssigningPlan] = useState(false);
    const [planAssigned, setPlanAssigned] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;
    const { notification, showNotification, hideNotification, confirmState, showConfirm, hideConfirm } = useNotification();

    useEffect(() => {
        if (currentBox?.id) {
            fetchLeads();
            fetchPlans();
        }
    }, [currentBox?.id]);

    const fetchPlans = async () => {
        const { data } = await supabase.from('plans').select('*').eq('box_id', currentBox?.id || '').order('price');
        setPlans(data || []);
    };

    const fetchLeads = async () => {
        setLoading(true);
        const boxId = currentBox?.id || '';
        if (!boxId) {
            setLeads([]);
            setLoading(false);
            return;
        }
        const { data, error } = await supabase
            .from('leads')
            .select('*')
            .eq('box_id', boxId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[Leads] fetchLeads error:', error.message);
        }
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
                phone: newLead.phone || null,
                source: newLead.source || null,
                status: 'new',
                box_id: currentBox?.id
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
            setNewLead({ firstName: '', lastName: '', email: '', phone: '', source: '' });
            fetchLeads();
        }
        setLoading(false);
    };

    const updateStatus = async (lead: Lead, newStatus: string) => {
        const executeUpdate = async () => {
            setLoading(true);

            if (newStatus === 'converted') {
                // Use the create-member Edge Function (same as Members page)
                const { data, error: fnError } = await supabase.functions.invoke('create-member', {
                    body: {
                        email: lead.email,
                        password: 'BoxApp2026!',
                        first_name: lead.first_name,
                        last_name: lead.last_name,
                        role_id: 'athlete',
                        box_id: currentBox?.id
                    }
                });

                if (fnError) {
                    console.error('Edge Function error:', fnError);
                    let errorMessage = t('leads.error_generic');
                    try {
                        if (fnError.name === 'FunctionsHttpError' && (fnError as any).context) {
                            const errorData = await (fnError as any).context.json();
                            if (errorData?.error) errorMessage = errorData.error;
                        } else if (data && (data as any).error) {
                            errorMessage = (data as any).error;
                        } else {
                            errorMessage = fnError.message || errorMessage;
                        }
                    } catch {
                        errorMessage = fnError.message || errorMessage;
                    }
                    showNotification('error', errorMessage.toUpperCase());
                    setLoading(false);
                    return;
                }

                if (data && (data as any).error) {
                    showNotification('error', ((data as any).error as string).toUpperCase());
                    setLoading(false);
                    return;
                }

                // Mark lead as converted only after Edge Function succeeds
                const { error: statusError } = await supabase
                    .from('leads')
                    .update({ status: 'converted' })
                    .eq('id', lead.id);

                if (statusError) {
                    showNotification('error', t('leads.error_generic').toUpperCase());
                } else {
                    const fullName = `${lead.first_name || ''} ${lead.last_name || ''}`.trim();
                    const newMemberId = (data as any)?.user?.id || null;
                    setConvertedLeadName(fullName);
                    setConvertedMemberId(newMemberId);
                    setSelectedPlanId('');
                    setPlanAssigned(false);
                    setConversionSuccessOpen(true);
                    fetchLeads();
                }
            } else {
                // Normal status update (new -> contacted, etc.)
                const { error } = await supabase
                    .from('leads')
                    .update({ status: newStatus })
                    .eq('id', lead.id);

                if (error) {
                    showNotification('error', t('leads.error_generic').toUpperCase());
                } else {
                    showNotification('success', t('common.success_update', { defaultValue: 'STATUS UPDATED' }).toUpperCase());
                    fetchLeads();
                }
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

    const handleQuickAssignPlan = async () => {
        if (!convertedMemberId || !selectedPlanId || !currentBox?.id) return;
        setAssigningPlan(true);
        try {
            const plan = plans.find((p: any) => p.id === selectedPlanId);
            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + (plan?.duration_days || 30));

            const { error } = await supabase.from('memberships').insert([{
                athlete_id: convertedMemberId,
                user_id: convertedMemberId,
                plan_id: selectedPlanId,
                box_id: currentBox.id,
                status: 'active',
                start_date: startDate.toISOString(),
                end_date: endDate.toISOString()
            }]);

            if (error) throw error;
            setPlanAssigned(true);
        } catch (error: any) {
            console.error('Error assigning plan:', error);
            showNotification('error', (error.message || t('leads.error_generic')).toUpperCase());
        } finally {
            setAssigningPlan(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'new': return <Inbox className="h-3 w-3" />;
            case 'contacted': return <Clock className="h-3 w-3" />;
            case 'converted': return <CheckCircle className="h-3 w-3" />;
            default: return null;
        }
    };

    const getStatusBadgeClasses = (status: string | null) => {
        switch (status) {
            case 'new': return "bg-blue-500/10 text-blue-400 border-blue-500/20";
            case 'contacted': return "bg-amber-500/10 text-amber-400 border-amber-500/20";
            case 'converted': return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-lg shadow-emerald-500/10";
            default: return "bg-blue-500/10 text-blue-400 border-blue-500/20";
        }
    };

    const getStatusLabel = (status: string | null) => {
        switch (status) {
            case 'new': return t('leads.status_new');
            case 'contacted': return t('leads.status_contacted');
            case 'converted': return t('leads.status_converted');
            default: return status || 'new';
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
        <div className="space-y-6 md:space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col gap-4 md:gap-6 md:flex-row md:items-end md:justify-between">
                <div className="space-y-1">
                    <h1 className="text-3xl md:text-5xl font-black italic tracking-tighter uppercase text-glow">
                        Growth <span className="text-primary not-italic">Pipeline</span>
                    </h1>
                    <p className="text-muted-foreground/80 text-xs md:text-sm font-medium tracking-wide max-w-lg">
                        {t('leads.subtitle')}
                    </p>
                </div>

                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button size="lg" className="shadow-2xl shadow-primary/20 gap-3 group px-8 w-full md:w-auto">
                            <div className="p-1 bg-white/20 rounded-lg group-hover:scale-110 transition-transform">
                                <UserPlus className="h-5 w-5" />
                            </div>
                            <span className="font-black italic uppercase tracking-widest text-xs">{t('leads.acquire_lead')}</span>
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto p-0 overflow-hidden border-white/10 glass rounded-[2rem] md:rounded-[2.5rem]">
                        <div className="bg-primary/10 p-6 md:p-8 border-b border-white/5">
                            <DialogHeader>
                                <DialogTitle className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter text-primary">{t('leads.add_prospect')}</DialogTitle>
                                <DialogDescription className="text-muted-foreground/70 font-medium text-sm">
                                    {t('leads.add_prospect_description')}
                                </DialogDescription>
                            </DialogHeader>
                        </div>
                        <form onSubmit={handleAddLead} className="p-6 md:p-8 space-y-5">
                            <div className="grid grid-cols-2 gap-4 md:gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1 italic">{t('leads.first_name')}</label>
                                    <Input
                                        placeholder="Jane"
                                        value={newLead.firstName}
                                        onChange={(e) => setNewLead({ ...newLead, firstName: e.target.value })}
                                        required
                                        className="h-12 md:h-14 rounded-2xl bg-muted/20 border-border/20 focus:border-primary/50 transition-colors"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1 italic">{t('leads.last_name')}</label>
                                    <Input
                                        placeholder="Smith"
                                        value={newLead.lastName}
                                        onChange={(e) => setNewLead({ ...newLead, lastName: e.target.value })}
                                        required
                                        className="h-12 md:h-14 rounded-2xl bg-muted/20 border-border/20 focus:border-primary/50 transition-colors"
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
                                    className="h-12 md:h-14 rounded-2xl bg-muted/20 border-border/20 focus:border-primary/50 transition-colors"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4 md:gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1 italic flex items-center gap-1">
                                        <Phone className="h-3 w-3" /> {t('leads.phone')}
                                        <span className="text-muted-foreground/30 normal-case not-italic tracking-normal">({t('common.optional', { defaultValue: 'optional' })})</span>
                                    </label>
                                    <Input
                                        type="tel"
                                        placeholder="+1 555..."
                                        value={newLead.phone}
                                        onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                                        className="h-12 md:h-14 rounded-2xl bg-muted/20 border-border/20 focus:border-primary/50 transition-colors"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1 italic">
                                        {t('leads.source', { defaultValue: 'Source' })}
                                        <span className="text-muted-foreground/30 normal-case not-italic tracking-normal ml-1">({t('common.optional', { defaultValue: 'optional' })})</span>
                                    </label>
                                    <select
                                        className="w-full h-12 md:h-14 rounded-2xl bg-muted/20 border border-border/20 px-4 text-sm focus:border-primary/50 transition-colors appearance-none"
                                        value={newLead.source}
                                        onChange={(e) => setNewLead({ ...newLead, source: e.target.value })}
                                    >
                                        <option value="">{t('leads.source_none', { defaultValue: '-- Select --' })}</option>
                                        <option value="referral">{t('leads.source_referral', { defaultValue: 'Referral' })}</option>
                                        <option value="instagram">{t('leads.source_instagram', { defaultValue: 'Instagram' })}</option>
                                        <option value="walk_in">{t('leads.source_walkin', { defaultValue: 'Walk-in' })}</option>
                                        <option value="website">{t('leads.source_website', { defaultValue: 'Website' })}</option>
                                        <option value="other">{t('leads.source_other', { defaultValue: 'Other' })}</option>
                                    </select>
                                </div>
                            </div>
                            <DialogFooter className="pt-4 flex gap-3">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setOpen(false)}
                                    className="flex-1 text-[10px] font-black italic uppercase tracking-widest opacity-60 hover:opacity-100"
                                >
                                    {t('common.close').toUpperCase()}
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={loading || !newLead.firstName || !newLead.lastName || !newLead.email.includes('@')}
                                    size="lg"
                                    className="flex-[2] text-base py-6 md:py-7 rounded-2xl shadow-xl shadow-primary/20"
                                >
                                    {loading ? t('common.saving') : t('leads.add_prospect')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Search Bar (sticky on mobile) */}
            <div className="sticky top-0 z-20 md:hidden bg-background/80 backdrop-blur-xl pb-3 -mx-2 px-2">
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                    <Input
                        placeholder={t('common.search', { defaultValue: 'Search prospects...' })}
                        className="pl-12 bg-muted/20 border-border/10 focus:border-primary/50 h-12 rounded-2xl"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                    />
                </div>
            </div>

            {/* Mobile Card List */}
            <div className="md:hidden space-y-3">
                {loading && leads.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 py-20">
                        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">{t('leads.syncing')}</span>
                    </div>
                ) : currentLeads.length === 0 ? (
                    <div className="flex flex-col items-center gap-4 py-20 opacity-30">
                        <Inbox className="h-16 w-16" />
                        <p className="text-sm font-black italic uppercase tracking-widest">{t('leads.empty_pipeline')}</p>
                    </div>
                ) : (
                    currentLeads.map((lead) => (
                        <div
                            key={lead.id}
                            className="glass rounded-2xl border border-white/5 p-4 active:scale-[0.98] transition-all duration-200 cursor-pointer"
                            onClick={() => {
                                setSelectedLead(lead);
                                setDetailsOpen(true);
                            }}
                        >
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 shrink-0 rounded-2xl bg-muted border border-border/40 flex items-center justify-center font-black italic text-primary text-sm">
                                    {lead.first_name?.[0] || ''}{lead.last_name?.[0] || ''}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="font-black italic uppercase tracking-tight text-sm truncate">
                                            {lead.first_name} {lead.last_name}
                                        </span>
                                        <Badge variant="glow" className={cn(
                                            "px-2 py-0.5 gap-1 rounded-lg border shrink-0",
                                            getStatusBadgeClasses(lead.status)
                                        )}>
                                            {getStatusIcon(lead.status || 'new')}
                                            <span className="text-[9px] font-black tracking-widest italic">{getStatusLabel(lead.status)}</span>
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between mt-1">
                                        <span className="text-[11px] text-muted-foreground/60 truncate">{lead.email}</span>
                                        <span className="text-[10px] text-muted-foreground/40 shrink-0 ml-2">
                                            {lead.created_at ? new Date(lead.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''}
                                        </span>
                                    </div>
                                    {lead.phone && (
                                        <div className="flex items-center gap-1 mt-1">
                                            <Phone className="h-3 w-3 text-muted-foreground/30" />
                                            <span className="text-[10px] text-muted-foreground/50">{lead.phone}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {lead.status !== 'converted' && (
                                <div className="mt-3 pt-3 border-t border-white/5 flex gap-2">
                                    <Select
                                        defaultValue={lead.status || 'new'}
                                        onValueChange={(val) => updateStatus(lead, val)}
                                    >
                                        <SelectTrigger
                                            className="flex-1 h-9 bg-muted/30 border-border/10 text-[10px] font-black uppercase tracking-widest"
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
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-9 px-3 text-[9px] font-black uppercase italic tracking-widest border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/10"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            updateStatus(lead, 'converted');
                                        }}
                                    >
                                        {t('leads.convert_to_member')}
                                    </Button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Desktop Table */}
            <Card className="glass overflow-hidden border-border/40 shadow-premium hidden md:block">
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
                                <CardTitle className="text-xl font-black italic uppercase tracking-tighter">{t('leads.pipeline_title')} <span className="text-primary">{t('leads.pipeline_highlight')}</span></CardTitle>
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
                                <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-primary/80 italic">{t('leads.header_identity')}</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/80 italic">{t('leads.header_status')}</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/80 italic text-center">{t('leads.header_date')}</TableHead>
                                <TableHead className="text-right px-8 text-[10px] font-black uppercase tracking-[0.2em] text-primary/80 italic">{t('leads.header_nav')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && leads.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-20">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">{t('leads.syncing')}</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : leads.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-24 opacity-20">
                                        <div className="flex flex-col items-center gap-4">
                                            <Inbox className="h-16 w-16" />
                                            <p className="text-sm font-black italic uppercase tracking-widest">{t('leads.empty_pipeline')}</p>
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
                                                getStatusBadgeClasses(lead.status)
                                            )}>
                                                {getStatusIcon(lead.status || 'new')}
                                                <span className="capitalize text-[10px] font-black tracking-widest italic">{getStatusLabel(lead.status)}</span>
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
                <div className="flex items-center justify-between gap-4 bg-muted/20 p-3 md:p-4 rounded-2xl border border-muted-foreground/10">
                    <div className="flex items-center gap-1 md:gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="h-9 px-2 md:px-3 font-bold uppercase text-[10px] tracking-widest gap-1 italic"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            <span className="hidden sm:inline">{t('common.previous', { defaultValue: 'PREVIOUS' })}</span>
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
                            className="h-9 px-2 md:px-3 font-bold uppercase text-[10px] tracking-widest gap-1 italic"
                        >
                            <span className="hidden sm:inline">{t('common.next', { defaultValue: 'NEXT' })}</span>
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
                <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto border-none glass-morphism p-0 overflow-hidden shadow-2xl">
                    <div className="relative">
                        <div className="absolute inset-0 h-32 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent pointer-events-none" />

                        <DialogHeader className="p-6 md:p-8 pb-4 relative z-10">
                            <div className="flex items-end gap-4 md:gap-6">
                                <div className="h-16 w-16 md:h-20 md:w-20 shrink-0 rounded-2xl border-2 border-border/20 shadow-2xl bg-muted p-1 flex items-center justify-center font-black italic text-primary text-xl md:text-2xl uppercase">
                                    {selectedLead?.first_name?.[0]}{selectedLead?.last_name?.[0]}
                                </div>
                                <div className="flex-1 pb-1 md:pb-2 min-w-0">
                                    <DialogTitle className="text-xl md:text-2xl font-black italic uppercase tracking-tighter leading-none mb-1 truncate">
                                        {selectedLead?.first_name} {selectedLead?.last_name}
                                    </DialogTitle>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="glow" className={cn(
                                            "text-[9px] font-black italic uppercase tracking-widest py-0 px-2 shadow-sm",
                                            getStatusBadgeClasses(selectedLead?.status || null)
                                        )}>
                                            {getStatusLabel(selectedLead?.status || null)}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                            <DialogDescription className="sr-only">
                                {t('leads.detail_desc', { defaultValue: `Details for ${selectedLead?.first_name}` })}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="px-6 md:px-8 pb-6 md:pb-8 space-y-4 md:space-y-6 relative z-10">
                            <div className="grid grid-cols-2 gap-3 md:gap-4">
                                <div className="space-y-1 p-3 md:p-4 rounded-2xl bg-muted/20 border border-border/10 shadow-inner">
                                    <p className="text-[10px] font-black italic text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <Inbox className="h-3 w-3 text-primary/50" /> {t('leads.email').toUpperCase()}
                                    </p>
                                    <p className="text-xs font-bold truncate opacity-80">{selectedLead?.email || 'N/A'}</p>
                                    {selectedLead?.phone && (
                                        <p className="text-[10px] font-medium text-muted-foreground italic flex items-center gap-1">
                                            <Phone className="h-3 w-3" /> {selectedLead.phone}
                                        </p>
                                    )}
                                    {!selectedLead?.phone && (
                                        <p className="text-[10px] font-medium text-muted-foreground italic">
                                            {t('leads.phone_none', { defaultValue: 'No phone provided' })}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-1 p-3 md:p-4 rounded-2xl bg-muted/20 border border-border/10 shadow-inner">
                                    <p className="text-[10px] font-black italic text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <CalendarDays className="h-3 w-3 text-primary/50" /> {t('leads.origin', { defaultValue: 'ORIGIN' }).toUpperCase()}
                                    </p>
                                    <p className="text-xs font-bold truncate opacity-80 capitalize">{selectedLead?.source || 'Organic'}</p>
                                    <p className="text-[10px] font-medium text-muted-foreground italic">
                                        {selectedLead?.created_at ? new Date(selectedLead.created_at).toLocaleDateString() : '...'}
                                    </p>
                                </div>
                            </div>

                            <div className="p-4 md:p-5 rounded-2xl bg-gradient-to-br from-primary/[0.05] to-transparent border border-primary/10 shadow-sm">
                                <h3 className="text-[10px] font-black italic uppercase tracking-widest text-primary/80 mb-3 flex items-center gap-2">
                                    <Inbox className="h-3.5 w-3.5" /> {t('leads.notes').toUpperCase()}
                                </h3>
                                <p className="text-sm font-medium leading-relaxed opacity-70 italic whitespace-pre-wrap">
                                    {selectedLead?.notes || t('leads.no_notes', { defaultValue: 'No notes yet. Ready for outreach.' })}
                                </p>
                            </div>
                        </div>

                        <DialogFooter className="bg-muted/50 p-4 md:p-6 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-border/10">
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
                                    disabled={loading}
                                    className="h-10 px-6 rounded-xl shadow-xl shadow-primary/20 text-[10px] font-black italic uppercase tracking-widest"
                                    onClick={() => {
                                        if (selectedLead) {
                                            updateStatus(selectedLead, 'converted');
                                            setDetailsOpen(false);
                                        }
                                    }}
                                >
                                    {loading ? t('common.loading') : t('leads.convert_to_member')}
                                </Button>
                            )}
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Conversion Success + Inline Plan Assignment Dialog */}
            <Dialog open={conversionSuccessOpen} onOpenChange={(open) => {
                setConversionSuccessOpen(open);
                if (!open) { setSelectedPlanId(''); setPlanAssigned(false); }
            }}>
                <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden border-none glass rounded-[2rem] max-h-[90vh] overflow-y-auto">
                    {!planAssigned ? (
                        <div className="p-6 md:p-8 space-y-5">
                            {/* Success header */}
                            <div className="text-center space-y-2">
                                <div className="mx-auto h-16 w-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/20 flex items-center justify-center">
                                    <CheckCircle className="h-8 w-8 text-emerald-500" />
                                </div>
                                <DialogTitle className="text-lg font-black italic uppercase tracking-tighter">
                                    {t('leads.conversion_success_title')}
                                </DialogTitle>
                                <DialogDescription className="text-sm text-muted-foreground">
                                    {t('leads.conversion_success_desc', { name: convertedLeadName })}
                                </DialogDescription>
                            </div>

                            {/* Plan cards - tap to select */}
                            {plans.length > 0 && (
                                <div className="space-y-2 max-h-[35vh] overflow-y-auto pr-1">
                                    {plans.map((plan: any) => (
                                        <div
                                            key={plan.id}
                                            className={cn(
                                                "p-4 rounded-2xl border cursor-pointer transition-all duration-200 active:scale-[0.98]",
                                                selectedPlanId === plan.id
                                                    ? "border-primary bg-primary/10 shadow-lg shadow-primary/10"
                                                    : "border-white/10 bg-white/[0.02] hover:border-white/20"
                                            )}
                                            onClick={() => setSelectedPlanId(plan.id)}
                                        >
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="text-sm font-black italic uppercase tracking-tight">{plan.name}</p>
                                                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                                                        {plan.duration_days} {t('leads.days', { defaultValue: 'days' })}
                                                    </p>
                                                </div>
                                                <p className="text-xl font-black italic text-primary">${plan.price}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex flex-col gap-2 pt-1">
                                <Button
                                    disabled={!selectedPlanId || assigningPlan}
                                    onClick={handleQuickAssignPlan}
                                    className="w-full h-12 rounded-2xl shadow-xl shadow-primary/20 font-black italic uppercase tracking-widest text-xs"
                                >
                                    {assigningPlan ? <Loader2 className="h-5 w-5 animate-spin" /> : t('leads.assign_plan_now')}
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="w-full h-10 font-black italic uppercase tracking-widest text-[10px] opacity-60 hover:opacity-100"
                                    onClick={() => { setConversionSuccessOpen(false); setSelectedPlanId(''); }}
                                >
                                    {t('leads.assign_plan_later')}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="p-8 text-center space-y-5">
                            <div className="mx-auto h-20 w-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/20 flex items-center justify-center">
                                <CheckCircle className="h-10 w-10 text-emerald-500" />
                            </div>
                            <div className="space-y-1">
                                <DialogTitle className="text-lg font-black italic uppercase tracking-tighter">
                                    {t('leads.all_set', { defaultValue: 'All Set!' })}
                                </DialogTitle>
                                <DialogDescription className="text-sm text-muted-foreground">
                                    {t('leads.plan_assigned_success', { defaultValue: 'Membership assigned successfully.' })}
                                </DialogDescription>
                            </div>
                            <Button
                                className="w-full h-12 rounded-2xl font-black italic uppercase tracking-widest text-xs"
                                onClick={() => { setConversionSuccessOpen(false); setPlanAssigned(false); setSelectedPlanId(''); }}
                            >
                                {t('common.close')}
                            </Button>
                        </div>
                    )}
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
