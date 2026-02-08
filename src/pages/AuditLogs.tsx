import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    History,
    Search,
    ChevronDown,
    ChevronUp,
    User,
    Database,
    AlertCircle,
    Loader2,
    RefreshCcw
} from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from '@/hooks';

const formatDate = (dateString: string | null | undefined, i18n: any) => {
    if (!dateString) return '-';
    return new Intl.DateTimeFormat(i18n.language === 'es' ? 'es-ES' : 'en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    }).format(new Date(dateString));
};

interface AuditLog {
    id: string;
    table_name: string;
    record_id: string;
    action: string;
    old_data: any;
    new_data: any;
    changed_by: string | null;
    created_at: string | null;
    profiles?: {
        first_name: string;
        last_name: string;
        email: string;
    };
}

export const AuditLogs: React.FC = () => {
    const { t, i18n } = useLanguage();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        setLoading(true);
        // Joining with profiles to get the name of the person who made the change
        const { data, error } = await supabase
            .from('audit_logs')
            .select('*, profiles!changed_by(first_name, last_name, email)')
            .order('created_at', { ascending: false })
            .limit(100);

        if (!error && data) {
            setLogs(data as unknown as AuditLog[]);
        }
        setLoading(false);
    };

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const getActionBadge = (action: string) => {
        switch (action) {
            case 'INSERT': return <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/30 uppercase text-[10px]">{t('audit.action_create')}</Badge>;
            case 'UPDATE': return <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/30 uppercase text-[10px]">{t('audit.action_update')}</Badge>;
            case 'DELETE': return <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/30 uppercase text-[10px]">{t('audit.action_delete')}</Badge>;
            default: return <Badge variant="outline" className="uppercase text-[10px]">{action}</Badge>;
        }
    };

    const filteredLogs = logs.filter(log =>
        log.table_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.profiles?.first_name + ' ' + log.profiles?.last_name).toLowerCase().includes(searchQuery.toLowerCase())
    );

    const paginatedLogs = filteredLogs.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-black italic tracking-tighter uppercase text-primary flex items-center gap-3">
                    <History className="h-8 w-8 text-primary" /> {t('audit.title')}
                </h1>
                <p className="text-muted-foreground">{t('audit.subtitle')}</p>
            </div>

            <Card className="border shadow-xl">
                <CardHeader className="pb-3 border-b bg-muted/20">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="space-y-1 w-full">
                            <CardTitle className="text-lg font-bold uppercase tracking-tight italic">{t('audit.pipeline')}</CardTitle>
                            <CardDescription>{t('audit.realtime')}</CardDescription>
                        </div>
                        <div className="flex items-center gap-2 w-full md:max-w-md">
                            <div className="relative flex-1">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder={t('audit.filter_placeholder')}
                                    className="pl-8 focus-visible:ring-primary"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <Button variant="outline" size="icon" onClick={fetchLogs} disabled={loading}>
                                <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead className="w-[50px]"></TableHead>
                                <TableHead className="font-black uppercase text-[10px] tracking-widest pl-6">{t('audit.timestamp')}</TableHead>
                                <TableHead className="font-black uppercase text-[10px] tracking-widest">{t('audit.operator')}</TableHead>
                                <TableHead className="font-black uppercase text-[10px] tracking-widest">{t('audit.entity')}</TableHead>
                                <TableHead className="font-black uppercase text-[10px] tracking-widest text-center">{t('audit.operation')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-20">
                                        <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
                                        <p className="text-sm font-black uppercase italic tracking-widest text-muted-foreground">{t('audit.decrypting')}</p>
                                    </TableCell>
                                </TableRow>
                            ) : filteredLogs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-20 text-muted-foreground italic">
                                        {t('audit.no_events')}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedLogs.map((log) => (
                                    <React.Fragment key={log.id}>
                                        <TableRow
                                            className="hover:bg-muted/30 transition-colors cursor-pointer"
                                            onClick={() => toggleExpand(log.id)}
                                        >
                                            <TableCell className="text-center">
                                                {expandedId === log.id ? <ChevronUp className="h-4 w-4 mx-auto" /> : <ChevronDown className="h-4 w-4 mx-auto" />}
                                            </TableCell>
                                            <TableCell className="pl-6 font-mono text-xs text-muted-foreground">
                                                {formatDate(log.created_at, i18n)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                                                        <User className="h-3 w-3 text-primary" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold uppercase tracking-tight italic">
                                                            {log.profiles ? `${log.profiles.first_name} ${log.profiles.last_name}` : t('audit.system')}
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground">{log.profiles?.email || 'pgrst_request'}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Database className="h-3.3 w-3.5 text-muted-foreground" />
                                                    <span className="text-xs font-black uppercase tracking-widest text-primary/80">{log.table_name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center text-xs">
                                                {getActionBadge(log.action)}
                                            </TableCell>
                                        </TableRow>
                                        {expandedId === log.id && (
                                            <TableRow className="bg-muted/10">
                                                <TableCell colSpan={5} className="p-4">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-2">{t('audit.state_previous')}</h4>
                                                            <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 border-dashed">
                                                                <pre className="text-[10px] text-emerald-500/80 font-mono overflow-auto max-h-[200px]">
                                                                    {log.old_data ? JSON.stringify(log.old_data, null, 2) : t('audit.no_previous')}
                                                                </pre>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-2">{t('audit.state_result')}</h4>
                                                            <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                                                                <pre className="text-[10px] text-primary/90 font-mono overflow-auto max-h-[200px]">
                                                                    {log.new_data ? JSON.stringify(log.new_data, null, 2) : t('audit.terminal_destruction')}
                                                                </pre>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="mt-4 flex items-center gap-2 px-2 text-[9px] text-muted-foreground italic uppercase">
                                                        <AlertCircle className="h-3 w-3" />
                                                        Trace ID: {log.id} • Record ID: {log.record_id}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </React.Fragment>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
                {totalPages > 1 && (
                    <div className="flex items-center justify-between gap-4 p-4 border-t bg-muted/10">
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="h-9 px-3 font-bold uppercase text-[10px] tracking-widest gap-2"
                            >
                                <ChevronDown className="h-4 w-4 rotate-90" />
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
                                                onClick={() => setCurrentPage(pageNumber)}
                                                className="h-9 w-9 font-bold text-[10px]"
                                            >
                                                {pageNumber}
                                            </Button>
                                        );
                                    } else if (
                                        pageNumber === currentPage - 2 ||
                                        pageNumber === currentPage + 2
                                    ) {
                                        return <span key={pageNumber} className="text-muted-foreground">...</span>;
                                    }
                                    return null;
                                })}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="h-9 px-3 font-bold uppercase text-[10px] tracking-widest gap-2"
                            >
                                {t('common.next', { defaultValue: 'NEXT' })}
                                <ChevronDown className="h-4 w-4 -rotate-90" />
                            </Button>
                        </div>
                        <div className="hidden sm:block text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                            {t('common.showing', { defaultValue: 'SHOWING' })} <span className="text-primary">{Math.min(filteredLogs.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filteredLogs.length, currentPage * itemsPerPage)}</span> {t('common.of', { defaultValue: 'OF' })} {filteredLogs.length} {t('audit.events', { defaultValue: 'EVENTS' })}
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
};
