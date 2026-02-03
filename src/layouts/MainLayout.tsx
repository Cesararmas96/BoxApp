import { useState } from 'react';
import { LayoutDashboard, Users, Trophy, BarChart3, Settings as SettingsIcon, Calendar as CalendarIcon, Receipt, LogOut, Inbox, Menu, X, Monitor, Medal } from 'lucide-react';
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

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            {/* Mobile Backdrop */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "fixed left-0 top-0 z-50 h-full w-64 flex-col border-r bg-card transition-transform duration-300 ease-in-out lg:translate-x-0",
                isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex h-16 items-center justify-between px-6">
                    <span className="text-xl font-bold tracking-tight text-primary">BOX MANAGER</span>
                    <div className="flex items-center gap-2">
                        <ModeToggle />
                        <Button
                            variant="ghost"
                            size="icon"
                            className="lg:hidden"
                            onClick={() => setIsSidebarOpen(false)}
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                <Separator />

                <div className="flex-1 px-4 py-4">
                    <nav className="space-y-1">
                        {filteredNavItems.map((item) => (
                            <Button
                                key={item.id}
                                variant={activePage === item.id ? "default" : "ghost"}
                                className={cn(
                                    "w-full justify-start gap-3",
                                    activePage === item.id ? "bg-primary text-white" : "text-muted-foreground"
                                )}
                                onClick={() => navigateTo(item.id)}
                            >
                                <item.icon className="h-5 w-5" />
                                {item.label}
                            </Button>
                        ))}
                    </nav>
                </div>

                <div className="mt-auto p-4 space-y-1">
                    <Separator className="mb-4" />
                    <Button
                        variant={activePage === 'settings' ? "default" : "ghost"}
                        className={cn(
                            "w-full justify-start gap-3",
                            activePage === 'settings' ? "bg-primary text-white" : "text-muted-foreground"
                        )}
                        onClick={() => navigateTo('settings')}
                    >
                        <SettingsIcon className="h-5 w-5" />
                        Settings
                    </Button>
                    <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={handleLogout}
                    >
                        <LogOut className="h-5 w-5" />
                        Logout
                    </Button>
                </div>
            </aside>

            {/* Mobile Header (Hidden on Desktop) */}
            <div className="lg:hidden flex fixed top-0 w-full h-16 items-center justify-between px-4 border-b bg-card z-30">
                <div className="flex items-center">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="mr-2"
                        onClick={() => setIsSidebarOpen(true)}
                    >
                        <Menu className="h-6 w-6" />
                    </Button>
                    <span className="text-lg font-bold text-primary">BOX MANAGER</span>
                </div>
                <ModeToggle />
            </div>

            {/* Main Content */}
            <main className="flex-1 lg:ml-64 pt-16 lg:pt-0">
                <div className="container mx-auto p-4 md:p-8 max-w-7xl">
                    {children}
                </div>
            </main>
        </div>
    );
};
