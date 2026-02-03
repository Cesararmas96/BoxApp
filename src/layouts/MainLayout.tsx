import React from 'react';
import { LayoutDashboard, Users, Trophy, BarChart3, Settings as SettingsIcon, LogOut, Inbox, Menu } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { ModeToggle } from '@/components/mode-toggle';

interface LayoutProps {
    children: React.ReactNode;
    activePage: string;
    onNavigate: (page: string) => void;
}

const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'leads', label: 'Leads', icon: Inbox },
    { id: 'wods', label: 'WODs', icon: Trophy },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
];

export const MainLayout: React.FC<LayoutProps> = ({ children, activePage, onNavigate }) => {
    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            {/* Sidebar */}
            <aside className="fixed left-0 top-0 hidden h-full w-64 flex-col border-r bg-card lg:flex">
                <div className="flex h-16 items-center justify-between px-6">
                    <span className="text-xl font-bold tracking-tight text-primary">BOX MANAGER</span>
                    <ModeToggle />
                </div>

                <Separator />

                <div className="flex-1 px-4 py-4">
                    <nav className="space-y-1">
                        {navItems.map((item) => (
                            <Button
                                key={item.id}
                                variant={activePage === item.id ? "default" : "ghost"}
                                className={cn(
                                    "w-full justify-start gap-3",
                                    activePage === item.id ? "bg-primary text-white" : "text-muted-foreground"
                                )}
                                onClick={() => onNavigate(item.id)}
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
                        onClick={() => onNavigate('settings')}
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
            <div className="lg:hidden flex fixed top-0 w-full h-16 items-center justify-between px-4 border-b bg-card z-50">
                <div className="flex items-center">
                    <Button variant="ghost" size="icon" className="mr-4">
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
