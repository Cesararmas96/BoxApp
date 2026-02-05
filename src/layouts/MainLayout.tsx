import { useState } from 'react';
import { LayoutDashboard, Users, Trophy, BarChart3, Settings as SettingsIcon, Calendar as CalendarIcon, Receipt, LogOut, Inbox, Menu, X, Monitor, Medal, Shield, History, Dumbbell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { ModeToggle } from '@/components/mode-toggle';
import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from '@/contexts/AuthContext';

interface LayoutProps {
    children: React.ReactNode;
    activePage: string;
    onNavigate: (page: string) => void;
    userProfile?: any;
}

const getNavItems = (t: any) => [
    { id: 'dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { id: 'schedule', label: t('nav.schedule'), icon: CalendarIcon },
    { id: 'members', label: t('nav.members'), icon: Users, roles: ['admin', 'receptionist', 'coach'] },
    { id: 'roles', label: t('nav.roles'), icon: Shield, roles: ['admin'] },
    { id: 'audit-logs', label: t('nav.audit_logs'), icon: History, roles: ['admin'] },
    { id: 'leads', label: t('nav.leads'), icon: Inbox, roles: ['admin', 'receptionist'] },
    { id: 'billing', label: t('nav.billing'), icon: Receipt, roles: ['admin', 'receptionist'] },
    { id: 'wods', label: t('nav.programming'), icon: Trophy },
    { id: 'movements', label: t('nav.movements', { defaultValue: 'MOVEMENTS' }), icon: Dumbbell, roles: ['admin', 'coach'] },
    { id: 'benchmarks', label: t('nav.benchmarks'), icon: Trophy },
    { id: 'competitions', label: t('nav.competitions'), icon: Medal, roles: ['admin', 'coach'] },
    { id: 'box-display', label: t('nav.tv_view'), icon: Monitor, roles: ['admin', 'receptionist', 'coach'] },
    { id: 'analytics', label: t('nav.analytics'), icon: BarChart3, roles: ['admin'] },
];

export const MainLayout: React.FC<LayoutProps> = ({ children, activePage, onNavigate, userProfile }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { t, i18n } = useTranslation();
    const { signOut } = useAuth();

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
    };

    const navItems = getNavItems(t);

    const handleLogout = async () => {
        await signOut();
    };

    const filteredNavItems = navItems.filter(item =>
        !item.roles || (userProfile?.role_id && item.roles.includes(userProfile.role_id))
    );

    const navigateTo = (page: string) => {
        onNavigate(page);
        setIsSidebarOpen(false);
    };

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    return (
        <div className="flex min-h-screen bg-background text-foreground overflow-x-hidden">
            {/* Mobile Backdrop */}
            <div
                className={cn(
                    "fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm lg:hidden transition-all duration-300",
                    isSidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                )}
                onClick={() => setIsSidebarOpen(false)}
            />

            {/* Sidebar */}
            <aside className={cn(
                "fixed inset-y-4 left-4 z-[110] w-64 flex flex-col glass rounded-2xl shadow-2xl transition-all duration-500 ease-in-out lg:translate-x-0 lg:z-40",
                isSidebarOpen ? "translate-x-0" : "-translate-x-[calc(100%+16px)]"
            )}>
                <div className="flex h-20 items-center justify-between px-6 shrink-0 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    <div className="flex flex-col">
                        <span className="text-xl font-black tracking-tighter text-primary uppercase italic text-glow leading-none">Box Manager</span>
                        <span className="text-[8px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 mt-1">Sport-Tech Engine</span>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden hover:bg-destructive/10 hover:text-destructive transition-colors rounded-full z-10"
                        onClick={() => setIsSidebarOpen(false)}
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                <div className="px-4">
                    <Separator className="bg-primary/10" />
                </div>

                <div className="flex-1 px-3 py-6 overflow-y-auto">
                    <nav className="space-y-1">
                        {filteredNavItems.map((item) => (
                            <Button
                                key={item.id}
                                variant={activePage === item.id ? "default" : "ghost"}
                                className={cn(
                                    "w-full justify-start gap-3 h-11 px-4 font-bold uppercase text-[10px] tracking-widest transition-all duration-300 rounded-xl relative group overflow-hidden",
                                    activePage === item.id
                                        ? "bg-primary text-white shadow-lg shadow-primary/30 scale-[1.02] hover:bg-primary/90"
                                        : "text-muted-foreground hover:bg-primary/5 hover:text-primary"
                                )}
                                onClick={() => navigateTo(item.id)}
                            >
                                {activePage === item.id && (
                                    <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-white rounded-r-full animate-in fade-in slide-in-from-left-2 duration-300" />
                                )}
                                <item.icon className={cn("h-4 w-4 transition-transform duration-300", activePage === item.id ? "text-white scale-110" : "text-primary/70 group-hover:scale-125")} />
                                {item.label}
                                {activePage !== item.id && (
                                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                )}
                            </Button>
                        ))}
                    </nav>
                </div>

                <div className="p-3 space-y-1 mt-auto bg-primary/5 rounded-b-2xl border-t border-primary/10">
                    <Button
                        variant={activePage === 'settings' ? "default" : "ghost"}
                        className={cn(
                            "w-full justify-start gap-3 h-11 px-4 font-bold uppercase text-[10px] tracking-widest rounded-xl transition-all",
                            activePage === 'settings' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-muted-foreground hover:bg-primary/5"
                        )}
                        onClick={() => navigateTo('settings')}
                    >
                        <SettingsIcon className="h-4 w-4" />
                        {t('nav.settings')}
                    </Button>
                    <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 h-11 px-4 text-muted-foreground font-bold uppercase text-[10px] tracking-widest rounded-xl hover:text-destructive hover:bg-destructive/10 transition-colors"
                        onClick={handleLogout}
                    >
                        <LogOut className="h-4 w-4 text-destructive/70" />
                        {t('nav.logout')}
                    </Button>
                </div>
            </aside>

            {/* Content Wrapper */}
            <div className="flex-1 flex flex-col min-w-0 lg:pl-4 transition-all duration-500">
                {/* Header */}
                <header className="flex h-16 items-center justify-between px-6 md:px-10 glass sticky top-4 mx-4 mt-4 rounded-2xl z-30 shadow-lg border-primary/5 font-inter">
                    <div className="flex items-center gap-3 lg:hidden">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-primary hover:bg-primary/10 rounded-full"
                            onClick={toggleSidebar}
                        >
                            <Menu className="h-6 w-6" />
                        </Button>
                        <span className="text-lg font-black italic tracking-tighter text-primary uppercase text-glow">Box Manager</span>
                    </div>
                    <div className="hidden lg:flex items-center gap-4 bg-zinc-950/20 px-4 py-1.5 rounded-full border border-primary/10">
                        <div className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                            <span className="text-[9px] font-black uppercase tracking-[0.1em] text-emerald-500/80">LNX-Node: 01-Active</span>
                        </div>
                        <div className="w-px h-3 bg-primary/10" />
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground/60">{t('nav.system_online')}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="hover:bg-primary/10 text-primary rounded-full transition-transform hover:rotate-12">
                                    <Languages className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="glass border-primary/10 w-44 rounded-xl p-2">
                                <DropdownMenuItem onClick={() => changeLanguage('es')} className="cursor-pointer font-black uppercase text-[9px] tracking-[0.15em] rounded-lg">
                                    Español
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => changeLanguage('en')} className="cursor-pointer font-black uppercase text-[9px] tracking-[0.15em] rounded-lg">
                                    English
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <ModeToggle />
                    </div>
                </header>

                {/* Main Content Area */}
                <main className={cn(
                    "flex-1 transition-all duration-500",
                    "lg:ml-[272px]"
                )}>
                    <div className="container mx-auto p-6 md:p-10 max-w-7xl animate-premium-in">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};
