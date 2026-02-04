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
import { useNotification } from '@/hooks/useNotification';
import { Toast } from '@/components/ui/toast-custom';

interface Lead {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    status: string;
    created_at: string;
}

export const Leads: React.FC = () => {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [newLead, setNewLead] = useState({ firstName: '', lastName: '', email: '' });
    const { notification, showNotification, hideNotification } = useNotification();

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

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'new': return <Inbox className="h-3 w-3 mr-1" />;
            case 'contacted': return <Clock className="h-3 w-3 mr-1" />;
            case 'converted': return <CheckCircle className="h-3 w-3 mr-1" />;
            default: return null;
        }
    };

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'new': return 'default';
            case 'contacted': return 'secondary';
            case 'converted': return 'outline';
            default: return 'outline';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Leads & Growth</h1>
                    <p className="text-muted-foreground text-sm">Track prospects from first contact to membership.</p>
                </div>

                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <UserPlus className="h-4 w-4" /> New Lead
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Add New Lead</DialogTitle>
                            <DialogDescription>
                                Enter potential athlete details to start tracking.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAddLead} className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">First Name</label>
                                    <Input
                                        placeholder="Jane"
                                        value={newLead.firstName}
                                        onChange={(e) => setNewLead({ ...newLead, firstName: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Last Name</label>
                                    <Input
                                        placeholder="Smith"
                                        value={newLead.lastName}
                                        onChange={(e) => setNewLead({ ...newLead, lastName: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Email</label>
                                <Input
                                    type="email"
                                    placeholder="jane@example.com"
                                    value={newLead.email}
                                    onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                                    required
                                />
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={loading}>
                                    {loading ? "Saving..." : "Create Lead"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="overflow-hidden">
                <CardHeader className="bg-muted/30">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg">Prospect Pipeline</CardTitle>
                            <CardDescription>Visual list of all current prospects.</CardDescription>
                        </div>
                        <div className="relative w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search prospects..." className="pl-8" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="px-6 py-4">Name</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead className="text-right px-6">Manage</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && leads.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                                        Fetching prospects...
                                    </TableCell>
                                </TableRow>
                            ) : leads.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                                        No leads yet. Ready to grow?
                                    </TableCell>
                                </TableRow>
                            ) : (
                                leads.map((lead) => (
                                    <TableRow key={lead.id}>
                                        <TableCell className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-sm">{lead.first_name} {lead.last_name}</span>
                                                <span className="text-xs text-muted-foreground">{lead.email}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusVariant(lead.status)} className="flex items-center w-fit px-2 py-0 h-6">
                                                {getStatusIcon(lead.status)}
                                                <span className="capitalize text-[11px]">{lead.status}</span>
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {new Date(lead.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right px-6">
                                            <Select
                                                defaultValue={lead.status}
                                                onValueChange={(val) => updateStatus(lead, val)}
                                            >
                                                <SelectTrigger className="w-[110px] h-8 text-[11px] ml-auto">
                                                    <SelectValue placeholder="Status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="new text-[11px]">New</SelectItem>
                                                    <SelectItem value="contacted text-[11px]">Contacted</SelectItem>
                                                    <SelectItem value="converted text-[11px]">Converted</SelectItem>
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
        </div>
    );
};
