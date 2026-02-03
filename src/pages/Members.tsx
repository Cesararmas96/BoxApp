import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
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
    const [members, setMembers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [newMember, setNewMember] = useState({
        firstName: '',
        lastName: '',
        email: '',
        roleId: 'athlete',
        status: 'active',
        medicalHistory: '',
        emergencyName: '',
        emergencyPhone: ''
    });
    const [selectedMember, setSelectedMember] = useState<Profile | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);

    useEffect(() => {
        fetchMembers();
    }, []);

    const fetchMembers = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && data) setMembers(data);
        setLoading(false);
    };

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { error } = await supabase
            .from('profiles')
            .insert([
                {
                    first_name: newMember.firstName,
                    last_name: newMember.lastName,
                    email: newMember.email,
                    role_id: newMember.roleId,
                    status: newMember.status,
                    medical_history: newMember.medicalHistory,
                    emergency_contact_name: newMember.emergencyName,
                    emergency_contact_phone: newMember.emergencyPhone
                }
            ]);

        if (error) {
            alert('Error adding member: ' + error.message);
        } else {
            setOpen(false);
            setNewMember({
                firstName: '',
                lastName: '',
                email: '',
                roleId: 'athlete',
                status: 'active',
                medicalHistory: '',
                emergencyName: '',
                emergencyPhone: ''
            });
            fetchMembers();
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
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Members</h1>
                    <p className="text-muted-foreground text-sm">Manage your box community and roles.</p>
                </div>

                {userProfile?.role_id === 'admin' && (
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <UserPlus className="h-4 w-4" /> Add Member
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Add New Member</DialogTitle>
                                <DialogDescription>
                                    Create a new athlete profile. You can link their account later.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleAddMember} className="space-y-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">First Name</label>
                                        <Input
                                            placeholder="John"
                                            value={newMember.firstName}
                                            onChange={(e) => setNewMember({ ...newMember, firstName: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Last Name</label>
                                        <Input
                                            placeholder="Doe"
                                            value={newMember.lastName}
                                            onChange={(e) => setNewMember({ ...newMember, lastName: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Email Address</label>
                                    <Input
                                        type="email"
                                        placeholder="john@example.com"
                                        value={newMember.email}
                                        onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Role</label>
                                    <select
                                        className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                        value={newMember.roleId}
                                        onChange={(e) => setNewMember({ ...newMember, roleId: e.target.value })}
                                    >
                                        <option value="athlete">Athlete</option>
                                        <option value="coach">Coach</option>
                                        <option value="receptionist">Receptionist</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium italic text-muted-foreground flex items-center gap-2">
                                        <Stethoscope className="h-3 w-3" /> Medical History (Optional)
                                    </label>
                                    <Input
                                        placeholder="Injuries, conditions..."
                                        value={newMember.medicalHistory}
                                        onChange={(e) => setNewMember({ ...newMember, medicalHistory: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium flex items-center gap-2">
                                            <Phone className="h-3 w-3" /> Emergency Contact
                                        </label>
                                        <Input
                                            placeholder="Name"
                                            value={newMember.emergencyName}
                                            onChange={(e) => setNewMember({ ...newMember, emergencyName: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Phone</label>
                                        <Input
                                            placeholder="+123..."
                                            value={newMember.emergencyPhone}
                                            onChange={(e) => setNewMember({ ...newMember, emergencyPhone: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="submit" disabled={loading}>
                                        {loading ? "Adding..." : "Confirm Member"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Community List</CardTitle>
                        <div className="flex items-center gap-2">
                            <div className="relative w-full max-w-sm">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Search members..."
                                    className="pl-8 w-[250px]"
                                />
                            </div>
                            <Button variant="outline" size="icon">
                                <Filter className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[300px]">Member</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Waiver</TableHead>
                                <TableHead>Joined</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        Loading community data...
                                    </TableCell>
                                </TableRow>
                            ) : members.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        No members found. Time to grow your box!
                                    </TableCell>
                                </TableRow>
                            ) : (
                                members.map((member) => (
                                    <TableRow key={member.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9 border">
                                                    <AvatarFallback className="bg-primary/10 text-primary text-xs uppercase font-bold">
                                                        {member.first_name?.[0]}{member.last_name?.[0]}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-sm">{member.first_name} {member.last_name}</span>
                                                    <span className="text-xs text-muted-foreground">{member.email || "No email"}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="capitalize text-[10px] py-0">
                                                {member.role_id}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusVariant(member.status)} className="capitalize text-[10px] py-0">
                                                {member.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {member.waiver_signed ? (
                                                <div className="flex items-center text-green-500 gap-1 text-[10px] font-bold">
                                                    <ShieldCheck className="h-3 w-3" /> Signed
                                                </div>
                                            ) : (
                                                <div className="flex items-center text-destructive gap-1 text-[10px] font-bold">
                                                    <ShieldAlert className="h-3 w-3" /> Pending
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {new Date(member.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedMember(member);
                                                    setDetailsOpen(true);
                                                }}
                                            >
                                                Details
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
                    </DialogHeader>

                    <div className="grid gap-6 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground uppercase">Role</p>
                                <p className="text-sm font-semibold capitalize">{selectedMember?.role_id}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground uppercase">Status</p>
                                <Badge variant={getStatusVariant(selectedMember?.status || 'active')} className="capitalize">
                                    {selectedMember?.status}
                                </Badge>
                            </div>
                        </div>

                        <div className="space-y-2 border-t pt-4">
                            <h3 className="text-sm font-bold flex items-center gap-2">
                                <Stethoscope className="h-4 w-4 text-primary" /> Medical Background
                            </h3>
                            <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md min-h-[60px]">
                                {selectedMember?.medical_history || "No medical history recorded."}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 border-t pt-4">
                            <div className="space-y-1">
                                <h3 className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                                    <Phone className="h-3 w-3" /> Emergency
                                </h3>
                                <p className="text-sm font-semibold">{selectedMember?.emergency_contact_name || "N/A"}</p>
                                <p className="text-xs text-muted-foreground">{selectedMember?.emergency_contact_phone || "No phone"}</p>
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                                    <ShieldCheck className="h-3 w-3" /> Waiver Status
                                </h3>
                                {selectedMember?.waiver_signed ? (
                                    <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/10 border-green-200">Legal Waiver Signed</Badge>
                                ) : (
                                    <Badge variant="destructive">Pending Signature</Badge>
                                )}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDetailsOpen(false)}>Close</Button>
                        <Button variant="default">Edit Profile</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
