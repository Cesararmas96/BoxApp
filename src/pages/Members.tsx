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
    ShieldAlert
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
    const { notification, showNotification, hideNotification, confirmState, showConfirm, hideConfirm } = useNotification();

    useEffect(() => {
        fetchMembers();
    }, []);

    const fetchMembers = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('box_id', currentBox?.id || '')
            .order('created_at', { ascending: false });

        if (!error && data) setMembers(data as unknown as Profile[]);
        setLoading(false);
    };

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Call the Edge Function to create member and auth account securely
        const { data, error } = await supabase.functions.invoke('create-member', {
            body: {
                email: newMember.email,
                password: 'BoxApp2026!',
                first_name: newMember.firstName,
                last_name: newMember.lastName,
                role_id: newMember.roleId,
                box_id: currentBox?.id
            },
            headers: {
                Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
                apikey: import.meta.env.VITE_SUPABASE_ANON_KEY
            }
        });

        if (error) {
            showNotification('error', 'ERROR ADDING MEMBER: ' + error.message.toUpperCase());
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

    const toggleMemberStatus = async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';

        showConfirm({
            title: t('common.confirm_action', { defaultValue: 'CONFIRMAR ACCIÓN' }),
            description: t('members.toggle_status_confirm', {
                defaultValue: `¿ESTÁS SEGURO DE QUE DESEAS ${newStatus === 'inactive' ? 'DESACTIVAR' : 'ACTIVAR'} A ESTE MIEMBRO?`
            }),
            onConfirm: async () => {
                const { error } = await supabase
                    .from('profiles')
                    .update({ status: newStatus })
                    .eq('id', id);

                if (error) {
                    showNotification('error', 'ERROR UPDATING STATUS: ' + error.message.toUpperCase());
                } else {
                    showNotification('success', 'MEMBER STATUS UPDATED');
                    fetchMembers();
                    setDetailsOpen(false);
                }
            },
            variant: newStatus === 'inactive' ? 'destructive' : 'default',
            icon: newStatus === 'inactive' ? 'destructive' : 'default'
        });
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
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        {t('common.loading')}
                                    </TableCell>
                                </TableRow>
                            ) : members.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        {t('common.no_data')}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                members.map((member) => (
                                    <TableRow key={member.id} className="group hover:bg-primary/5 border-white/5 transition-colors">
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

            {/* Member Details Dialog */}
            <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-primary/20 text-primary">
                                    {selectedMember?.first_name?.[0]}{selectedMember?.last_name?.[0]}
                                </AvatarFallback>
                            </Avatar>
                            <span>{selectedMember?.first_name} {selectedMember?.last_name}</span>
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                            {t('members.member_details_desc') || `Information for ${selectedMember?.first_name} ${selectedMember?.last_name}`}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-6 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground uppercase">{t('members.table_role')}</p>
                                <p className="text-sm font-semibold capitalize">{selectedMember?.role_id ? t(`roles.role_${selectedMember.role_id}`) : '...'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground uppercase">{t('members.table_status')}</p>
                                <Badge variant={getStatusVariant(selectedMember?.status || 'active')} className="capitalize">
                                    {selectedMember?.status ? t(`members.status_${selectedMember.status}`) : '...'}
                                </Badge>
                            </div>
                        </div>

                        <div className="space-y-2 border-t pt-4">
                            <h3 className="text-sm font-bold flex items-center gap-2">
                                <Stethoscope className="h-4 w-4 text-primary" /> {t('members.medical_background')}
                            </h3>
                            <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md min-h-[60px]">
                                {selectedMember?.medical_history || t('members.no_medical')}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 border-t pt-4">
                            <div className="space-y-1">
                                <h3 className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                                    <Phone className="h-3 w-3" /> {t('members.emergency')}
                                </h3>
                                <p className="text-sm font-semibold">{selectedMember?.emergency_contact_name || "N/A"}</p>
                                <p className="text-xs text-muted-foreground">{selectedMember?.emergency_contact_phone || t('members.no_email')}</p>
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                                    <ShieldCheck className="h-3 w-3" /> {t('members.waiver_status')}
                                </h3>
                                {selectedMember?.waiver_signed ? (
                                    <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/10 border-green-200">{t('members.waiver_legal')}</Badge>
                                ) : (
                                    <Badge variant="destructive">{t('members.waiver_pending')}</Badge>
                                )}
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="flex flex-col sm:flex-row gap-2">
                        <Button
                            variant={selectedMember?.status === 'active' ? "destructive" : "default"}
                            className="w-full sm:w-auto font-bold uppercase"
                            onClick={() => selectedMember && toggleMemberStatus(selectedMember.id, selectedMember.status)}
                        >
                            {selectedMember?.status === 'active' ? t('members.deactivate_btn') : t('members.activate_btn')}
                        </Button>
                        <div className="flex-1" />
                        <Button variant="outline" onClick={() => setDetailsOpen(false)}>{t('common.cancel')}</Button>
                        <Button variant="default">{t('members.edit_profile')}</Button>
                    </DialogFooter>
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
