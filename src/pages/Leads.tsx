import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    UserPlus,
    Inbox,
    CheckCircle,
    Clock,
    Search
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
            showNotification('error', 'ERROR ADDING LEAD: ' + error.message.toUpperCase());
        } else {
            showNotification('success', 'NEW LEAD ADDED SUCCESSFULLY');
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
                showNotification('error', 'ERROR UPDATING STATUS: ' + error.message.toUpperCase());
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
                    showNotification('success', 'LEAD CONVERTED TO MEMBER!');
                } else {
                    showNotification('success', 'STATUS UPDATED');
                }
                fetchLeads();
            }
            setLoading(false);
        };

        if (newStatus === 'converted') {
            showConfirm({
                title: t('leads.confirm_conversion_title', { defaultValue: 'CONVERTIR PROSPECTO' }),
                description: t('leads.confirm_conversion_desc', { defaultValue: '¿ESTÁS SEGURO DE QUE DESEAS CONVERTIR ESTE PROSPECTO EN MIEMBRO? ESTA ACCIÓN CREARÁ UN PERFIL DE ATLETA Y NO SE PUEDE DESHACER.' }),
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



    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between px-6 md:px-0">
                <div className="space-y-1">
                    <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase text-glow">
                        Growth <span className="text-primary italic-none not-italic">Pipeline</span>
                    </h1>
                    <p className="text-muted-foreground/80 text-sm font-medium tracking-wide max-w-lg">
                        Accelerate your box growth. Track every prospect through a high-fidelity conversion funnel.
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
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1 italic">First Name</label>
                                    <Input
                                        placeholder="Jane"
                                        value={newLead.firstName}
                                        onChange={(e) => setNewLead({ ...newLead, firstName: e.target.value })}
                                        required
                                        className="h-14 rounded-2xl bg-zinc-950/40 border-white/10"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1 italic">Last Name</label>
                                    <Input
                                        placeholder="Smith"
                                        value={newLead.lastName}
                                        onChange={(e) => setNewLead({ ...newLead, lastName: e.target.value })}
                                        required
                                        className="h-14 rounded-2xl bg-zinc-950/40 border-white/10"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1 italic">Electronic Mail</label>
                                <Input
                                    type="email"
                                    placeholder="jane@example.com"
                                    value={newLead.email}
                                    onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                                    required
                                    className="h-14 rounded-2xl bg-zinc-950/40 border-white/10"
                                />
                            </div>
                            <DialogFooter className="pt-4">
                                <Button type="submit" disabled={loading} size="lg" className="w-full text-base py-7 rounded-2xl">
                                    {loading ? "Syncing..." : "Launch Prospect"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="glass overflow-hidden border-white/10 shadow-premium">
                <CardHeader className="border-b border-white/5 bg-zinc-950/20 px-8 py-8">
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
                                <CardDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">Live feed of box prospects</CardDescription>
                            </div>
                        </div>
                        <div className="relative w-full md:w-80 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                            <Input placeholder="Search prospects..." className="pl-12 bg-zinc-950/40 border-white/5 focus:border-primary/50 h-11" />
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
                                leads.map((lead) => (
                                    <TableRow key={lead.id} className="group border-white/5 hover:bg-primary/5 transition-all duration-300">
                                        <TableCell className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center font-black italic text-primary group-hover:scale-110 transition-transform">
                                                    {lead.first_name[0]}{lead.last_name[0]}
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
                                                {getStatusIcon(lead.status)}
                                                <span className="capitalize text-[10px] font-black tracking-widest italic">{lead.status}</span>
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className="text-xs font-black italic uppercase tracking-tighter text-muted-foreground/40">
                                                {new Date(lead.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right px-8">
                                            <Select
                                                defaultValue={lead.status}
                                                onValueChange={(val) => updateStatus(lead, val)}
                                            >
                                                <SelectTrigger className="w-[130px] h-9 bg-zinc-950/60 border-white/5 hover:border-primary/50 text-[10px] font-black uppercase tracking-widest ml-auto transition-all">
                                                    <SelectValue placeholder="STATUS" />
                                                </SelectTrigger>
                                                <SelectContent className="glass border-white/10">
                                                    <SelectItem value="new" className="text-[10px] font-black uppercase tracking-widest italic">New Entry</SelectItem>
                                                    <SelectItem value="contacted" className="text-[10px] font-black uppercase tracking-widest italic">In Contact</SelectItem>
                                                    <SelectItem value="converted" className="text-[10px] font-black uppercase tracking-widest italic">Converted</SelectItem>
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
