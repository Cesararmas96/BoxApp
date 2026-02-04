import { useState } from 'react';
import { LayoutDashboard, Users, Trophy, BarChart3, Settings as SettingsIcon, Calendar as CalendarIcon, Receipt, LogOut, Inbox, Menu, X, Monitor, Medal, Shield, History } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { ModeToggle } from '@/components/mode-toggle';

interface LayoutProps {
    children: React.ReactNode;
    activePage: string;
    onNavigate: (page: string) => void;
    userProfile?: any;
}

const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'schedule', label: 'Schedule', icon: CalendarIcon },
    { id: 'members', label: 'Members', icon: Users, roles: ['admin', 'receptionist', 'coach'] },
    { id: 'roles', label: 'Roles', icon: Shield, roles: ['admin'] },
    { id: 'audit-logs', label: 'Audit Logs', icon: History, roles: ['admin'] },
    { id: 'leads', label: 'Leads', icon: Inbox, roles: ['admin', 'receptionist'] },
    { id: 'billing', label: 'Facturación', icon: Receipt, roles: ['admin', 'receptionist'] },
    { id: 'wods', label: 'WODs', icon: Trophy },
    { id: 'benchmarks', label: 'Benchmarks', icon: Trophy },
    { id: 'competitions', label: 'Competitions', icon: Medal, roles: ['admin', 'coach'] },
    { id: 'box-display', label: 'TV View', icon: Monitor, roles: ['admin', 'receptionist', 'coach'] },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, roles: ['admin'] },
];

export const MainLayout: React.FC<LayoutProps> = ({ children, activePage, onNavigate, userProfile }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
                        Settings
                    </Button>
                    <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 h-11 px-4 text-muted-foreground font-bold uppercase text-xs tracking-wider hover:text-destructive hover:bg-destructive/10 transition-colors"
                        onClick={handleLogout}
                    >
                        <LogOut className="h-4 w-4 text-destructive/70" />
                        Logout
                    </Button>
                </div>
            </aside>

            {/* Content Wrapper */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Mobile Header */}
                <header className="lg:hidden flex h-16 items-center justify-between px-4 border-b bg-card sticky top-0 z-50">
                    <div className="flex items-center gap-3">
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
                    <ModeToggle />
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
