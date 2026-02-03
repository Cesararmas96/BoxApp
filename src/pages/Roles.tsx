import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    Shield,
    Search,
    UserCheck,
    UserCog,
    UserPlus,
    Loader2,
    CheckCircle2,
    AlertCircle
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Profile {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    role_id: string;
    created_at: string;
}

export const Roles: React.FC = () => {
    const [users, setUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && data) {
            setUsers(data);
        }
        setLoading(false);
    };

    const handleRoleChange = async (userId: string, newRole: string) => {
        setUpdatingId(userId);
        setMessage(null);

        const { error } = await supabase
            .from('profiles')
            .update({ role_id: newRole })
            .eq('id', userId);

        if (error) {
            setMessage({ type: 'error', text: 'Error updating role: ' + error.message });
        } else {
            setMessage({ type: 'success', text: 'Role updated successfully!' });
            setUsers(users.map(u => u.id === userId ? { ...u, role_id: newRole } : u));

            // Auto-hide success message
            setTimeout(() => setMessage(null), 3000);
        }
        setUpdatingId(null);
    };

    const filteredUsers = users.filter(user =>
        `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'admin': return <Badge variant="default" className="bg-primary/20 text-primary border-primary/30 uppercase text-[10px]">Administrator</Badge>;
            case 'coach': return <Badge variant="secondary" className="bg-indigo-500/20 text-indigo-400 border-indigo-500/30 uppercase text-[10px]">Coach</Badge>;
            case 'athlete': return <Badge variant="outline" className="text-muted-foreground uppercase text-[10px]">Athlete</Badge>;
            default: return <Badge variant="outline" className="uppercase text-[10px]">{role}</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-black italic tracking-tighter uppercase text-primary flex items-center gap-3">
                    <Shield className="h-8 w-8 text-primary" /> Authority Control
                </h1>
                <p className="text-muted-foreground">Manage system permissions and user access levels.</p>
            </div>

            {message && (
                <Alert className={message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-destructive/10 border-destructive/20 text-destructive'}>
                    {message.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    <AlertTitle className="text-xs uppercase font-black">{message.type === 'success' ? 'Success' : 'Security Alert'}</AlertTitle>
                    <AlertDescription className="text-xs font-medium">{message.text}</AlertDescription>
                </Alert>
            )}

            <Card className="border shadow-xl">
                <CardHeader className="pb-3 border-b bg-muted/20">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle className="text-lg font-bold uppercase tracking-tight italic">User Privilege Matrix</CardTitle>
                            <CardDescription>Assign roles to control feature availability.</CardDescription>
                        </div>
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search by name or email..."
                                className="pl-8 focus-visible:ring-primary"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead className="w-[300px] font-black uppercase text-[10px] tracking-widest pl-6">Identity</TableHead>
                                <TableHead className="font-black uppercase text-[10px] tracking-widest">Active Status</TableHead>
                                <TableHead className="font-black uppercase text-[10px] tracking-widest">Current Role</TableHead>
                                <TableHead className="text-right font-black uppercase text-[10px] tracking-widest pr-6">Modify Access</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-20">
                                        <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
                                        <p className="text-sm font-black uppercase italic tracking-widest text-muted-foreground">Accessing Database...</p>
                                    </TableCell>
                                </TableRow>
                            ) : filteredUsers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-20 text-muted-foreground italic">
                                        No users found matching the security parameters.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredUsers.map((user) => (
                                    <TableRow key={user.id} className="hover:bg-muted/30 transition-colors">
                                        <TableCell className="pl-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9 border-2 border-primary/20">
                                                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-black italic">
                                                        {user.first_name?.[0]}{user.last_name?.[0]}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-sm tracking-tight">{user.first_name} {user.last_name}</span>
                                                    <span className="text-xs text-muted-foreground font-mono">{user.email}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                                <span className="text-[10px] font-black uppercase tracking-widest italic">Encrypted</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {getRoleBadge(user.role_id)}
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <div className="flex justify-end items-center gap-2">
                                                {updatingId === user.id && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                                                <Select
                                                    disabled={updatingId === user.id}
                                                    value={user.role_id}
                                                    onValueChange={(value) => handleRoleChange(user.id, value)}
                                                >
                                                    <SelectTrigger className="w-[140px] h-9 text-xs font-bold uppercase tracking-wider">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="athlete" className="text-xs font-bold uppercase tracking-wider">Athlete</SelectItem>
                                                        <SelectItem value="coach" className="text-xs font-bold uppercase tracking-wider">Coach</SelectItem>
                                                        <SelectItem value="admin" className="text-xs font-bold uppercase tracking-wider">Admin</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};
