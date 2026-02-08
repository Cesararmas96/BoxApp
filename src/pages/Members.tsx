import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import {
    UserPlus,
    Search,
    Filter,
    Stethoscope,
    Phone,
    ShieldCheck,
    ShieldAlert,
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNotification, useLanguage } from '@/hooks';
import { Toast } from '@/components/ui/toast-custom';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

interface Profile {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    role_id: string;
    status: string;
    created_at: string;
    medical_history?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    waiver_signed: boolean;
    location_id?: string;
}

interface MembersProps {
    userProfile?: any;
}

export const Members: React.FC<MembersProps> = ({ userProfile }) => {
    const { t } = useLanguage();
    const { currentBox } = useAuth();
    const [members, setMembers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [newMember, setNewMember] = useState({
        firstName: '',
        lastName: '',
        email: '',
        roleId: 'athlete',
        status: 'active',
        medicalHistory: '',
        emergencyName: '',
        emergencyPhone: '',
        createAccount: true
    });
    const [selectedMember, setSelectedMember] = useState<Profile | null>(null);
    const [editOpen, setEditOpen] = useState(false);
    const [editForm, setEditForm] = useState({
        id: '',
        first_name: '',
        last_name: '',
        medical_history: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        role_id: '',
        status: ''
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;
    const { notification, showNotification, hideNotification, confirmState, hideConfirm } = useNotification();

    const filteredMembers = members.filter(member =>
        member.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentMembers = filteredMembers.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
    const handlePageChange = (page: number) => setCurrentPage(page);

    useEffect(() => {
        fetchMembers();
    }, []);

    const fetchMembers = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('*, memberships(*)')
            .eq('box_id', currentBox?.id || '')
            .order('created_at', { ascending: false });

        if (!error && data) setMembers(data as any[]);
        setLoading(false);
    };

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (!newMember.email) {
            showNotification('error', 'EMAIL IS REQUIRED');
            setLoading(false);
            return;
        }

        // Call the Edge Function to create member and auth account securely
        const { data, error } = await supabase.functions.invoke('create-member', {
            body: {
                email: newMember.email,
                password: 'BoxApp2026!',
                first_name: newMember.firstName,
                last_name: newMember.lastName,
                role_id: newMember.roleId,
                box_id: currentBox?.id
            }
        });

        if (error) {
            console.error('Edge Function error:', error);
            let errorMessage = 'Error en el servidor al crear el miembro';

            try {
                // In Supabase v2, if it's a FunctionsHttpError, context is a Response object
                if (error.name === 'FunctionsHttpError' && (error as any).context) {
                    const errorData = await (error as any).context.json();
                    if (errorData && errorData.error) {
                        errorMessage = errorData.error;
                    }
                } else if (data && (data as any).error) {
                    errorMessage = (data as any).error;
                } else {
                    errorMessage = error.message || errorMessage;
                }
            } catch (e) {
                errorMessage = error.message || errorMessage;
            }

            showNotification('error', 'ERROR ADDING MEMBER: ' + errorMessage.toUpperCase());
        } else if (data && (data as any).error) {
            showNotification('error', 'ERROR ADDING MEMBER: ' + (data as any).error.toUpperCase());
        } else {
            showNotification('success', 'MEMBER ADDED SUCCESSFULLY');
            setOpen(false);
            setNewMember({
                firstName: '',
                lastName: '',
                email: '',
                roleId: 'athlete',
                status: 'active',
                medicalHistory: '',
                emergencyName: '',
                emergencyPhone: '',
                createAccount: true
            });
            fetchMembers();
        }
        setLoading(false);
    };

    const handleUpdateMember = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { error } = await supabase
            .from('profiles')
            .update({
                first_name: editForm.first_name,
                last_name: editForm.last_name,
                medical_history: editForm.medical_history,
                emergency_contact_name: editForm.emergency_contact_name,
                emergency_contact_phone: editForm.emergency_contact_phone,
                role_id: editForm.role_id,
                status: editForm.status
            })
            .eq('id', editForm.id);

        if (error) {
            console.error('Update error:', error);
            showNotification('error', 'ERROR UPDATING MEMBER: ' + error.message.toUpperCase());
        } else {
            showNotification('success', 'MEMBER UPDATED SUCCESSFULLY');
            setEditOpen(false);
            fetchMembers();
            // Update selectedMember for the details view if it's the same one
            if (selectedMember?.id === editForm.id) {
                const refreshedMember = { ...selectedMember, ...editForm };
                setSelectedMember(refreshedMember as Profile);
            }
        }
        setLoading(false);
    };



    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'active': return 'default';
            case 'inactive': return 'destructive';
            case 'on_hold': return 'secondary';
            default: return 'outline';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between mb-10">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black italic tracking-tighter uppercase text-glow">{t('members.title')}</h1>
                    <p className="text-muted-foreground/60 text-xs font-bold uppercase tracking-[0.3em]">{t('members.subtitle')}</p>
                </div>

                {userProfile?.role_id === 'admin' && (
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button className="h-14 px-8 rounded-2xl shadow-xl shadow-primary/20 group">
                                <UserPlus className="h-5 w-5 group-hover:scale-110 transition-transform" />
                                <span className="ml-2 font-black italic uppercase tracking-wider">{t('members.add_btn')}</span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>{t('members.new_title')}</DialogTitle>
                                <DialogDescription>
                                    {t('members.new_desc')}
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleAddMember} className="space-y-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">{t('members.first_name')}</label>
                                        <Input
                                            placeholder="John"
                                            value={newMember.firstName}
                                            onChange={(e) => setNewMember({ ...newMember, firstName: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">{t('members.last_name')}</label>
                                        <Input
                                            placeholder="Doe"
                                            value={newMember.lastName}
                                            onChange={(e) => setNewMember({ ...newMember, lastName: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">{t('members.email')}</label>
                                    <Input
                                        type="email"
                                        placeholder="john@example.com"
                                        value={newMember.email}
                                        onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">{t('members.role')}</label>
                                    <select
                                        className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                        value={newMember.roleId}
                                        onChange={(e) => setNewMember({ ...newMember, roleId: e.target.value })}
                                    >
                                        <option value="athlete">{t('roles.role_athlete')}</option>
                                        <option value="coach">{t('roles.role_coach')}</option>
                                        <option value="receptionist">{t('roles.role_receptionist')}</option>
                                        {userProfile?.email === 'root@test.com' && (
                                            <option value="admin">{t('roles.role_admin')}</option>
                                        )}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium italic text-muted-foreground flex items-center gap-2">
                                        <Stethoscope className="h-3 w-3" /> {t('members.medical_history')}
                                    </label>
                                    <Input
                                        placeholder={t('members.medical_placeholder')}
                                        value={newMember.medicalHistory}
                                        onChange={(e) => setNewMember({ ...newMember, medicalHistory: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium flex items-center gap-2">
                                            <Phone className="h-3 w-3" /> {t('members.emergency_contact')}
                                        </label>
                                        <Input
                                            placeholder="Name"
                                            value={newMember.emergencyName}
                                            onChange={(e) => setNewMember({ ...newMember, emergencyName: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">{t('members.phone')}</label>
                                        <Input
                                            placeholder="+123..."
                                            value={newMember.emergencyPhone}
                                            onChange={(e) => setNewMember({ ...newMember, emergencyPhone: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2 border-t pt-4">
                                    <input
                                        type="checkbox"
                                        id="createAccount"
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                        checked={newMember.createAccount}
                                        onChange={(e) => setNewMember({ ...newMember, createAccount: e.target.checked })}
                                    />
                                    <label htmlFor="createAccount" className="text-sm font-bold uppercase italic tracking-tighter text-primary">
                                        {t('members.enable_account_label')}
                                    </label>
                                </div>
                                <p className="text-[10px] text-muted-foreground italic px-1">
                                    {t('members.enable_account_hint')}
                                </p>
                                <DialogFooter>
                                    <Button type="submit" disabled={loading}>
                                        {loading ? t('common.loading') : t('members.confirm_btn')}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            <Card className="glass overflow-hidden border-white/10 shadow-premium">
                <CardHeader className="p-8 pb-4 border-b border-white/5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <CardTitle className="text-xl font-black italic uppercase tracking-tight flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                            {t('members.list_title')}
                        </CardTitle>
                        <div className="flex items-center gap-3">
                            <div className="relative group flex-1 sm:flex-none">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                                <Input
                                    type="search"
                                    placeholder={t('members.search_placeholder')}
                                    className="pl-12 w-full sm:w-[320px] bg-zinc-950/20 border-white/5 h-12 rounded-2xl"
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setCurrentPage(1); // Reset to first page on search
                                    }}
                                />
                            </div>
                            <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl border-white/10 bg-zinc-950/20 hover:bg-primary/10">
                                <Filter className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[300px]">{t('members.table_member')}</TableHead>
                                <TableHead>{t('members.table_role')}</TableHead>
                                <TableHead>{t('members.table_status')}</TableHead>
                                <TableHead>{t('members.table_waiver')}</TableHead>
                                <TableHead>{t('members.table_joined')}</TableHead>
                                <TableHead className="text-right">{t('common.actions')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        {t('common.loading')}
                                    </TableCell>
                                </TableRow>
                            ) : currentMembers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-40 text-center text-muted-foreground italic uppercase tracking-widest text-[10px]">
                                        {t('common.no_data')}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                currentMembers.map((member) => (
                                    <TableRow key={member.id} className="group hover:bg-primary/[0.02] transition-colors">
                                        <TableCell className="py-4">
                                            <div className="flex items-center gap-4">
                                                <Avatar className="h-12 w-12 rounded-2xl glass border-white/10 shadow-lg">
                                                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary text-xs uppercase font-black italic">
                                                        {member.first_name?.[0]}{member.last_name?.[0]}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="font-black italic uppercase tracking-tight text-sm group-hover:text-primary transition-colors">{member.first_name} {member.last_name}</span>
                                                    <span className="text-[10px] text-muted-foreground/60 font-medium uppercase tracking-widest">{member.email || t('members.no_email')}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="capitalize text-[9px] font-black italic tracking-widest border-primary/20 bg-primary/5 text-primary py-0.5 rounded-lg px-2">
                                                {t(`roles.role_${member.role_id}`)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusVariant(member.status)} className="capitalize text-[9px] font-black italic tracking-widest py-0.5 rounded-lg px-2">
                                                {t(`members.status_${member.status}`)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {member.waiver_signed ? (
                                                <div className="flex items-center text-emerald-500 gap-1.5 text-[9px] font-black uppercase tracking-widest italic opacity-80">
                                                    <ShieldCheck className="h-3.5 w-3.5" /> {t('members.waiver_signed')}
                                                </div>
                                            ) : (
                                                <div className="flex items-center text-destructive gap-1.5 text-[9px] font-black uppercase tracking-widest italic opacity-80">
                                                    <ShieldAlert className="h-3.5 w-3.5" /> {t('members.waiver_pending')}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                                            {new Date(member.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-10 px-4 rounded-xl border border-transparent hover:border-primary/20 hover:bg-primary/5 text-[10px] font-black uppercase italic tracking-widest"
                                                onClick={() => {
                                                    setSelectedMember(member);
                                                    setDetailsOpen(true);
                                                }}
                                            >
                                                {t('members.details_btn')}
                                            </Button>
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
                            {t('common.showing', { defaultValue: 'SHOWING' })} <span className="text-primary">{Math.min(filteredMembers.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filteredMembers.length, currentPage * itemsPerPage)}</span> {t('common.of', { defaultValue: 'OF' })} {filteredMembers.length} {t('members.title', { defaultValue: 'MEMBERS' })}
                        </p>
                    </div>
                </div>
            )}

            {/* Member Details Dialog */}
            <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
                <DialogContent className="sm:max-w-[500px] border-none glass-morphism p-0 overflow-hidden shadow-2xl">
                    <div className="relative">
                        {/* Header Background Gradient */}
                        <div className="absolute inset-0 h-32 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent pointer-events-none" />

                        <DialogHeader className="p-8 pb-4 relative z-10">
                            <div className="flex items-end gap-6">
                                <Avatar className="h-20 w-20 rounded-2xl border-2 border-white/10 shadow-2xl bg-background p-1">
                                    <AvatarFallback className="rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 text-primary text-xl font-black italic">
                                        {selectedMember?.first_name?.[0]}{selectedMember?.last_name?.[0]}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 pb-2">
                                    <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter leading-none mb-1">
                                        {selectedMember?.first_name} {selectedMember?.last_name}
                                    </DialogTitle>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-[9px] font-black italic uppercase tracking-widest border-primary/20 bg-primary/5 text-primary py-0 px-2">
                                            {selectedMember?.role_id ? t(`roles.role_${selectedMember.role_id}`) : '...'}
                                        </Badge>
                                        <Badge variant={getStatusVariant(selectedMember?.status || 'active')} className="text-[9px] font-black italic uppercase tracking-widest py-0 px-2 shadow-sm">
                                            {selectedMember?.status ? t(`members.status_${selectedMember.status}`) : '...'}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                            <DialogDescription className="sr-only">
                                {t('members.member_details_desc') || `Information for ${selectedMember?.first_name} {selectedMember?.last_name}`}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="px-8 pb-8 space-y-6 relative z-10">
                            {/* Contact & Bio Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1 p-4 rounded-2xl bg-white/[0.03] border border-white/5 shadow-inner">
                                    <p className="text-[10px] font-black italic text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <Search className="h-3 w-3 text-primary/50" /> INFO
                                    </p>
                                    <p className="text-xs font-bold truncate opacity-80">{selectedMember?.email || t('members.no_email')}</p>
                                    <p className="text-[10px] font-medium text-muted-foreground italic">
                                        Joined: {selectedMember?.created_at ? new Date(selectedMember.created_at).toLocaleDateString() : '...'}
                                    </p>
                                </div>
                                <div className="space-y-1 p-4 rounded-2xl bg-white/[0.03] border border-white/5 shadow-inner">
                                    <p className="text-[10px] font-black italic text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <ShieldCheck className="h-3 w-3 text-primary/50" /> {t('members.waiver_status')}
                                    </p>
                                    <div className={`text-xs font-black italic uppercase flex items-center gap-2 ${selectedMember?.waiver_signed ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {selectedMember?.waiver_signed ? (
                                            <><ShieldCheck className="h-4 w-4" /> {t('members.waiver_signed')}</>
                                        ) : (
                                            <><ShieldAlert className="h-4 w-4" /> {t('members.waiver_pending')}</>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Medical Background */}
                            <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-500/[0.05] to-transparent border border-rose-500/10 shadow-sm">
                                <h3 className="text-[10px] font-black italic uppercase tracking-widest text-rose-500/80 mb-3 flex items-center gap-2">
                                    <Stethoscope className="h-3.5 w-3.5" /> {t('members.medical_background')}
                                </h3>
                                <p className="text-sm font-medium leading-relaxed opacity-70 italic">
                                    {selectedMember?.medical_history || t('members.no_medical')}
                                </p>
                            </div>

                            {/* Membership Status Section */}
                            <div className="p-5 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent border border-primary/10 shadow-sm">
                                <h3 className="text-[10px] font-black italic uppercase tracking-widest text-primary mb-3 flex items-center gap-2">
                                    <ShieldCheck className="h-3.5 w-3.5" /> MEMBRESÍA
                                </h3>
                                {selectedMember?.memberships && selectedMember.memberships.length > 0 ? (
                                    <div className="space-y-3">
                                        {selectedMember.memberships.map((m: any) => (
                                            <div key={m.id} className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/5">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-black uppercase italic tracking-tighter">Status: {m.status.toUpperCase()}</span>
                                                    <span className="text-[10px] text-muted-foreground font-mono">
                                                        {m.start_date ? new Date(m.start_date).toLocaleDateString() : 'SIN FECHA'} {'->'} {m.end_date ? new Date(m.end_date).toLocaleDateString() : 'SIN FECHA'}
                                                    </span>
                                                </div>
                                                <Badge className={cn(
                                                    "text-[8px] font-black italic uppercase",
                                                    m.status === 'active' ? "bg-green-500" : "bg-amber-500"
                                                )}>
                                                    {m.status.toUpperCase()}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-4 text-center">
                                        <p className="text-xs font-bold text-muted-foreground italic mb-3 opacity-60">
                                            ESTE ATLETA NO TIENE NINGUNA MEMBRESÍA ACTIVA
                                        </p>
                                        <Button
                                            size="sm"
                                            className="h-9 px-6 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 text-[10px] font-black uppercase italic tracking-tighter"
                                            onClick={() => {
                                                setDetailsOpen(false);
                                                window.location.href = '/billing?tab=athletes';
                                            }}
                                        >
                                            ASIGNAR PLAN EN FINANZAS
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Emergency Contact */}
                            <div className="p-5 rounded-2xl bg-gradient-to-br from-primary/[0.05] to-transparent border border-primary/10 shadow-sm">
                                <h3 className="text-[10px] font-black italic uppercase tracking-widest text-primary/80 mb-3 flex items-center gap-2">
                                    <Phone className="h-3.5 w-3.5" /> {t('members.emergency')}
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[9px] font-black italic uppercase text-muted-foreground/50 tracking-widest leading-none mb-1">Contact Name</p>
                                        <p className="text-xs font-bold italic uppercase">{selectedMember?.emergency_contact_name || '---'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black italic uppercase text-muted-foreground/50 tracking-widest leading-none mb-1">Phone Number</p>
                                        <p className="text-xs font-bold italic tracking-wider">{selectedMember?.emergency_contact_phone || '---'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="bg-muted/30 p-6 flex flex-row items-center justify-between border-t border-white/5">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDetailsOpen(false)}
                                className="text-[10px] font-black italic uppercase tracking-widest opacity-60 hover:opacity-100"
                            >
                                {t('common.cancel')}
                            </Button>
                            <Button
                                variant="default"
                                size="sm"
                                className="h-10 px-6 rounded-xl shadow-xl shadow-primary/20 text-[10px] font-black italic uppercase tracking-widest"
                                onClick={() => {
                                    if (selectedMember) {
                                        setEditForm({
                                            id: selectedMember.id,
                                            first_name: selectedMember.first_name,
                                            last_name: selectedMember.last_name,
                                            medical_history: selectedMember.medical_history || '',
                                            emergency_contact_name: selectedMember.emergency_contact_name || '',
                                            emergency_contact_phone: selectedMember.emergency_contact_phone || '',
                                            role_id: selectedMember.role_id,
                                            status: selectedMember.status
                                        });
                                        setDetailsOpen(false);
                                        setEditOpen(true);
                                    }
                                }}
                            >
                                {t('members.edit_profile')}
                            </Button>
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

            {/* Edit Member Dialog */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{t('members.edit_title') || 'EDIT MEMBER'}</DialogTitle>
                        <DialogDescription>
                            {t('members.edit_desc') || 'Update member profile information.'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdateMember} className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{t('members.first_name')}</label>
                                <Input
                                    value={editForm.first_name}
                                    onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{t('members.last_name')}</label>
                                <Input
                                    value={editForm.last_name}
                                    onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t('members.status_label') || 'STATUS'}</label>
                            <select
                                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                value={editForm.status}
                                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                            >
                                <option value="active">{t('members.status_active')}</option>
                                <option value="inactive">{t('members.status_inactive')}</option>
                                <option value="on_hold">{t('members.status_on_hold')}</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium italic text-muted-foreground flex items-center gap-2">
                                <Stethoscope className="h-3 w-3" /> {t('members.medical_history')}
                            </label>
                            <Input
                                value={editForm.medical_history}
                                onChange={(e) => setEditForm({ ...editForm, medical_history: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    <Phone className="h-3 w-3" /> {t('members.emergency_contact')}
                                </label>
                                <Input
                                    value={editForm.emergency_contact_name}
                                    onChange={(e) => setEditForm({ ...editForm, emergency_contact_name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{t('members.phone')}</label>
                                <Input
                                    value={editForm.emergency_contact_phone}
                                    onChange={(e) => setEditForm({ ...editForm, emergency_contact_phone: e.target.value })}
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                                {t('common.cancel')}
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? t('common.loading') : t('common.save') || 'SAVE CHANGES'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};
