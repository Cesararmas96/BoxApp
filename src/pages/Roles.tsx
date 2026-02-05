import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    Shield,
    Search,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Key,
    Lock,
    Check,
    X as CloseIcon,
    Terminal
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "../lib/utils";
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';

interface Profile {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    role_id: string;
    created_at: string;
}

const PERMISSIONS_MATRIX = [
    { page: 'Dashboard', roles: ['admin', 'coach', 'athlete', 'receptionist'] },
    { page: 'Schedule', roles: ['admin', 'coach', 'athlete', 'receptionist'] },
    { page: 'Members', roles: ['admin', 'coach', 'receptionist'] },
    { page: 'Internal Roles', roles: ['admin'] },
    { page: 'Audit Logs', roles: ['admin'] },
    { page: 'Leads / CRM', roles: ['admin', 'receptionist'] },
    { page: 'Billing & Finance', roles: ['admin', 'receptionist'] },
    { page: 'WOD Programming', roles: ['admin', 'coach', 'athlete', 'receptionist'] },
    { page: 'Benchmarks', roles: ['admin', 'coach', 'athlete', 'receptionist'] },
    { page: 'Competitions', roles: ['admin', 'coach'] },
    { page: 'TV Display', roles: ['admin', 'coach', 'receptionist'] },
    { page: 'Analytics', roles: ['admin'] },
];

const TEST_USERS = [
    { email: 'root@test.com', label: 'Root (Superuser)', role: 'admin' },
    { email: 'admin@test.com', label: 'Admin (Full)', role: 'admin' },
    { email: 'coach@test.com', label: 'Coach (Training)', role: 'coach' },
    { email: 'reception@test.com', label: 'Reception (Sales)', role: 'receptionist' },
    { email: 'athlete@test.com', label: 'Athlete (Basic)', role: 'athlete' },
];

export const Roles: React.FC = () => {
    const { t } = useTranslation();
    const { userProfile, signIn } = useAuth();
    const [users, setUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [testLoginLoading, setTestLoginLoading] = useState<string | null>(null);
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
            setTimeout(() => setMessage(null), 3000);
        }
        setUpdatingId(null);
    };

    const handleTestLogin = async (email: string) => {
        setTestLoginLoading(email);
        const { error } = await signIn({
            email,
            password: 'password123',
        });

        if (error) {
            setMessage({ type: 'error', text: 'Failed to login: ' + error.message });
        } else {
            window.location.href = '/';
        }
        setTestLoginLoading(null);
    };

    const filteredUsers = users.filter(user =>
        `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'admin': return <Badge variant="default" className="bg-primary/20 text-primary border-primary/30 uppercase text-[10px]">{t('roles.role_admin')}</Badge>;
            case 'coach': return <Badge variant="secondary" className="bg-indigo-500/20 text-indigo-400 border-indigo-500/30 uppercase text-[10px]">{t('roles.role_coach')}</Badge>;
            case 'receptionist': return <Badge variant="secondary" className="bg-amber-500/20 text-amber-500 border-amber-500/30 uppercase text-[10px]">{t('roles.role_receptionist')}</Badge>;
            case 'athlete': return <Badge variant="outline" className="text-muted-foreground uppercase text-[10px]">{t('roles.role_athlete')}</Badge>;
            default: return <Badge variant="outline" className="uppercase text-[10px]">{role}</Badge>;
        }
    };

    const isAdmin = userProfile?.role_id === 'admin';

    return (
        <div className="space-y-6 text-left">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-black italic tracking-tighter uppercase text-primary flex items-center gap-3">
                    <Shield className="h-8 w-8 text-primary" /> {t('roles.title')}
                </h1>
                <p className="text-muted-foreground">{t('roles.subtitle')}</p>
            </div>

            {message && (
                <Alert className={message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-destructive/10 border-destructive/20 text-destructive'}>
                    {message.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    <AlertTitle className="text-xs uppercase font-black">{message.type === 'success' ? 'Success' : 'Security Alert'}</AlertTitle>
                    <AlertDescription className="text-xs font-medium">{message.text}</AlertDescription>
                </Alert>
            )}

            <Tabs defaultValue="users" className="w-full">
                <TabsList className={cn("grid w-full mb-6", isAdmin ? "grid-cols-3" : "grid-cols-2")}>
                    <TabsTrigger value="users" className="font-bold uppercase text-[10px]">{t('roles.user_list')}</TabsTrigger>
                    <TabsTrigger value="matrix" className="font-bold uppercase text-[10px]">{t('roles.access_matrix')}</TabsTrigger>
                    {isAdmin && <TabsTrigger value="testing" className="font-bold uppercase text-[10px] text-primary">{t('roles.testing_lab')}</TabsTrigger>}
                </TabsList>

                <TabsContent value="users">
                    <Card className="border shadow-xl overflow-hidden">
                        <CardHeader className="pb-3 border-b bg-muted/20">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <CardTitle className="text-lg font-bold uppercase tracking-tight italic">{t('roles.access_matrix')}</CardTitle>
                                    <CardDescription>{t('roles.subtitle')}</CardDescription>
                                </div>
                                <div className="relative w-full max-w-sm">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="search"
                                        placeholder={t('common.search')}
                                        className="pl-8 focus-visible:ring-primary h-9 text-xs"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50 border-none hover:bg-muted/50">
                                            <TableHead className="w-[300px] font-black uppercase text-[10px] tracking-widest pl-6">{t('roles.identity')}</TableHead>
                                            <TableHead className="font-black uppercase text-[10px] tracking-widest text-center">{t('roles.security_status')}</TableHead>
                                            <TableHead className="font-black uppercase text-[10px] tracking-widest">{t('roles.active_role')}</TableHead>
                                            <TableHead className="text-right font-black uppercase text-[10px] tracking-widest pr-6">{t('roles.management')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center py-20">
                                                    <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
                                                    <p className="text-sm font-black uppercase italic tracking-widest text-muted-foreground">{t('common.loading')}</p>
                                                </TableCell>
                                            </TableRow>
                                        ) : filteredUsers.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center py-20 text-muted-foreground italic">
                                                    {t('common.no_data')}
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredUsers.map((user) => (
                                                <TableRow key={user.id} className="hover:bg-muted/30 transition-colors border-muted/20">
                                                    <TableCell className="pl-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="h-9 w-9 border-2 border-primary/20">
                                                                <AvatarFallback className="bg-primary/10 text-primary text-xs font-black italic">
                                                                    {user.first_name?.[0]}{user.last_name?.[0]}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div className="flex flex-col">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-bold text-sm tracking-tight">{user.first_name} {user.last_name}</span>
                                                                    {user.email === 'root@test.com' && <Terminal className="h-3 w-3 text-primary animate-pulse" />}
                                                                </div>
                                                                <span className="text-[10px] text-muted-foreground font-mono">{user.email}</span>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                                            <span className="text-[10px] font-black uppercase tracking-widest italic">{t('roles.encrypted')}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {getRoleBadge(user.role_id)}
                                                    </TableCell>
                                                    <TableCell className="text-right pr-6">
                                                        <div className="flex justify-end items-center gap-2">
                                                            {updatingId === user.id && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                                                            <Select
                                                                disabled={updatingId === user.id || user.email === 'root@test.com'}
                                                                value={user.role_id}
                                                                onValueChange={(value) => handleRoleChange(user.id, value)}
                                                            >
                                                                <SelectTrigger className="w-[140px] h-8 text-[10px] font-black uppercase tracking-wider">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="athlete" className="text-[10px] font-black uppercase tracking-wider">{t('roles.role_athlete')}</SelectItem>
                                                                    <SelectItem value="coach" className="text-[10px] font-black uppercase tracking-wider">{t('roles.role_coach')}</SelectItem>
                                                                    <SelectItem value="receptionist" className="text-[10px] font-black uppercase tracking-wider">{t('roles.role_receptionist')}</SelectItem>
                                                                    <SelectItem value="admin" className="text-[10px] font-black uppercase tracking-wider">{t('roles.role_admin')}</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="matrix">
                    <Card className="border shadow-xl">
                        <CardHeader className="bg-muted/20 border-b">
                            <CardTitle className="text-lg font-bold uppercase tracking-tight italic">{t('roles.access_matrix')}</CardTitle>
                            <CardDescription>{t('roles.subtitle')}</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50 border-none hover:bg-muted/50">
                                            <TableHead className="font-black uppercase text-[10px] tracking-widest pl-6">{t('roles.identity')}</TableHead>
                                            <TableHead className="text-center font-black uppercase text-[10px] tracking-widest">{t('roles.role_admin')}</TableHead>
                                            <TableHead className="text-center font-black uppercase text-[10px] tracking-widest">{t('roles.role_coach')}</TableHead>
                                            <TableHead className="text-center font-black uppercase text-[10px] tracking-widest">{t('roles.role_receptionist')}</TableHead>
                                            <TableHead className="text-center font-black uppercase text-[10px] tracking-widest">{t('roles.role_athlete')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {PERMISSIONS_MATRIX.map((item, idx) => (
                                            <TableRow key={idx} className="hover:bg-muted/10 border-muted/10">
                                                <TableCell className="font-bold py-3 pl-6 text-sm italic">{item.page}</TableCell>
                                                <TableCell className="text-center">
                                                    {item.roles.includes('admin') ? <Check className="h-4 w-4 text-emerald-500 mx-auto" /> : <CloseIcon className="h-4 w-4 text-muted-foreground/30 mx-auto" />}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {item.roles.includes('coach') ? <Check className="h-4 w-4 text-emerald-500 mx-auto" /> : <CloseIcon className="h-4 w-4 text-muted-foreground/30 mx-auto" />}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {item.roles.includes('receptionist') ? <Check className="h-4 w-4 text-emerald-500 mx-auto" /> : <CloseIcon className="h-4 w-4 text-muted-foreground/30 mx-auto" />}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {item.roles.includes('athlete') ? <Check className="h-4 w-4 text-emerald-500 mx-auto" /> : <CloseIcon className="h-4 w-4 text-muted-foreground/30 mx-auto" />}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {isAdmin && (
                    <TabsContent value="testing">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {TEST_USERS.map((user) => (
                                <Card key={user.email} className={cn(
                                    "border-2 hover:border-primary/40 transition-all group overflow-hidden",
                                    user.email === 'root@test.com' ? "border-primary/40 bg-primary/5 shadow-lg shadow-primary/10" : "border-primary/10"
                                )}>
                                    <CardHeader className="text-center space-y-0 pb-2">
                                        <div className={cn(
                                            "mx-auto p-3 rounded-full mb-3 group-hover:scale-110 transition-transform",
                                            user.email === 'root@test.com' ? "bg-primary text-white shadow-[0_0_15px_rgba(var(--primary),0.5)]" : "bg-primary/5 text-primary"
                                        )}>
                                            {user.email === 'root@test.com' ? <Terminal className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                                        </div>
                                        <CardTitle className="text-sm font-black uppercase italic tracking-tighter text-primary">
                                            {user.label}
                                        </CardTitle>
                                        <CardDescription className="text-[10px] font-mono select-all">
                                            {user.email}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="text-center pb-4">
                                        <Badge variant="outline" className="text-[9px] uppercase font-black px-2 mb-4 border-primary/20 bg-primary/5 text-primary">
                                            Pass: password123
                                        </Badge>
                                        <Button
                                            className={cn(
                                                "w-full font-black uppercase text-[10px] italic h-9 shadow-lg active:scale-95 transition-all",
                                                user.email === 'root@test.com' ? "bg-primary hover:bg-primary/90" : "bg-muted hover:bg-muted/80 text-foreground"
                                            )}
                                            disabled={testLoginLoading === user.email}
                                            onClick={() => handleTestLogin(user.email)}
                                        >
                                            {testLoginLoading === user.email ? (
                                                <Loader2 className="h-3 w-3 animate-spin mr-2" />
                                            ) : (
                                                <Key className="h-3 w-3 mr-2" />
                                            )}
                                            {t('roles.switch_account')}
                                        </Button>
                                    </CardContent>
                                    <div className="h-1 bg-primary/40 w-0 group-hover:w-full transition-all duration-500" />
                                </Card>
                            ))}
                        </div>

                        <Alert className="mt-8 border-primary/30 bg-primary/5">
                            <Lock className="h-4 w-4 text-primary" />
                            <AlertTitle className="text-xs uppercase font-black text-primary italic">Developer Security Note</AlertTitle>
                            <AlertDescription className="text-[10px] text-muted-foreground uppercase leading-relaxed font-bold">
                                This testing lab uses the hardcoded demo password <b className="text-primary italic">password123</b>.
                                This tool is intended for rapid permission auditing and UI verification.
                                Access to this tab is restricted to <b className="text-primary italic">Administrators</b> only.
                            </AlertDescription>
                        </Alert>
                    </TabsContent>
                )}
            </Tabs>
        </div>
    );
};
