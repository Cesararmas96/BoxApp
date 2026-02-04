import { useState } from 'react';
import { LayoutDashboard, Users, Trophy, BarChart3, Settings as SettingsIcon, Calendar as CalendarIcon, Receipt, LogOut, Inbox, Menu, X, Monitor, Medal, Shield, History, Dumbbell } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
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

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
    };

    const navItems = getNavItems(t);

    const handleLogout = async () => {
        await supabase.auth.signOut();
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
                "fixed inset-y-0 left-0 z-[110] w-64 flex flex-col border-r bg-card transition-all duration-300 ease-in-out lg:translate-x-0 lg:z-40",
                isSidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
            )}>
                <div className="flex h-16 items-center justify-between px-6 shrink-0">
                    <span className="text-xl font-bold tracking-tight text-primary uppercase italic">Box Manager</span>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden hover:bg-destructive/10 hover:text-destructive transition-colors"
                        onClick={() => setIsSidebarOpen(false)}
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                <Separator />

                <div className="flex-1 px-4 py-6 overflow-y-auto">
                    <nav className="space-y-1.5">
                        {filteredNavItems.map((item) => (
                            <Button
                                key={item.id}
                                variant={activePage === item.id ? "default" : "ghost"}
                                className={cn(
                                    "w-full justify-start gap-3 h-11 px-4 font-bold uppercase text-xs tracking-wider transition-all",
                                    activePage === item.id
                                        ? "bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]"
                                        : "text-muted-foreground hover:bg-muted/50"
                                )}
                                onClick={() => navigateTo(item.id)}
                            >
                                <item.icon className={cn("h-4 w-4", activePage === item.id ? "text-white" : "text-primary/70")} />
                                {item.label}
                            </Button>
                        ))}
                    </nav>
                </div>

                <div className="p-4 space-y-2 mt-auto border-t bg-muted/10">
                    <Button
                        variant={activePage === 'settings' ? "default" : "ghost"}
                        className={cn(
                            "w-full justify-start gap-3 h-11 px-4 font-bold uppercase text-xs tracking-wider",
                            activePage === 'settings' ? "bg-primary text-white" : "text-muted-foreground"
                        )}
                        onClick={() => navigateTo('settings')}
                    >
                        <SettingsIcon className="h-4 w-4" />
                        {t('nav.settings')}
                    </Button>
                    <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 h-11 px-4 text-muted-foreground font-bold uppercase text-xs tracking-wider hover:text-destructive hover:bg-destructive/10 transition-colors"
                        onClick={handleLogout}
                    >
                        <LogOut className="h-4 w-4 text-destructive/70" />
                        {t('nav.logout')}
                    </Button>
                </div>
            </aside>

            {/* Content Wrapper */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <header className="flex h-16 items-center justify-between px-4 md:px-8 border-b bg-card sticky top-0 z-30">
                    <div className="flex items-center gap-3 lg:hidden">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-primary hover:bg-primary/10"
                            onClick={toggleSidebar}
                        >
                            <Menu className="h-6 w-6" />
                        </Button>
                        <span className="text-lg font-black italic tracking-tighter text-primary uppercase">Box Manager</span>
                    </div>
                    <div className="hidden lg:block">
                        {/* Desktop breadcrumbs or page title could go here */}
                    </div>
                    <div className="flex items-center gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="hover:bg-primary/10 text-primary">
                                    <Languages className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuItem onClick={() => changeLanguage('es')} className="cursor-pointer font-bold uppercase text-[10px] tracking-widest">
                                    Español
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => changeLanguage('en')} className="cursor-pointer font-bold uppercase text-[10px] tracking-widest">
                                    English
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <ModeToggle />
                    </div>
                </header>

                {/* Main Content Area */}
                <main className={cn(
                    "flex-1 transition-all duration-300",
                    "lg:ml-64"
                )}>
                    <div className="container mx-auto p-4 md:p-8 max-w-7xl">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};
