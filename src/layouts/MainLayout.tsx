import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { LayoutDashboard, Users, Trophy, BarChart3, Settings as SettingsIcon, Calendar as CalendarIcon, Receipt, LogOut, Inbox, Menu, X, Monitor, Medal, Shield, History, Dumbbell, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { ModeToggle } from '@/components/mode-toggle';
import { useLanguage } from '@/hooks';
import { Languages } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from '@/contexts/AuthContext';

interface LayoutProps {
    userProfile?: any;
}

const getNavItems = (t: any): any[] => [
    { id: 'dashboard', path: '/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { id: 'schedule', path: '/schedule', label: t('nav.schedule'), icon: CalendarIcon },
    { id: 'members', path: '/members', label: t('nav.members'), icon: Users, roles: ['admin', 'receptionist', 'coach'] },
    { id: 'roles', path: '/roles', label: t('nav.roles'), icon: Shield, roles: ['admin'] },
    { id: 'audit-logs', path: '/audit-logs', label: t('nav.audit_logs'), icon: History, roles: ['admin'] },
    { id: 'leads', path: '/leads', label: t('nav.leads'), icon: Inbox, roles: ['admin', 'receptionist'] },
    { id: 'billing', path: '/billing', label: t('nav.billing'), icon: Receipt, roles: ['admin', 'receptionist'] },
    { id: 'wods', path: '/wods', label: t('nav.programming'), icon: Trophy },
    { id: 'movements', path: '/movements', label: t('nav.movements', { defaultValue: 'MOVEMENTS' }), icon: Dumbbell, roles: ['admin', 'coach'] },
    { id: 'benchmarks', path: '/benchmarks', label: t('nav.benchmarks'), icon: Trophy },
    { id: 'competitions', path: '/competitions', label: t('nav.competitions'), icon: Medal, roles: ['admin', 'coach'] },
    { id: 'box-display', path: '/box-display', label: t('nav.tv_view'), icon: Monitor, roles: ['admin', 'receptionist', 'coach'] },
    { id: 'analytics', path: '/analytics', label: t('nav.analytics'), icon: BarChart3, roles: ['admin'] },
];

export const MainLayout: React.FC<LayoutProps> = ({ userProfile }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { t, i18n } = useLanguage();
    const { currentBox, signOut } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = getNavItems(t);

    useEffect(() => {
        // Update Favicon based on current box
        const box = currentBox as any;
        if (box?.favicon_url) {
            let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
            if (!link) {
                link = document.createElement('link');
                link.rel = 'icon';
                document.getElementsByTagName('head')[0].appendChild(link);
            }
            link.href = box.favicon_url;
        }

        // Update Page Title based on current box and active item
        if (currentBox?.name) {
            // Find nav item by checking if path starts with item path (for nested routes) or is exact
            const matchingItem = navItems.find(item =>
                location.pathname === item.path ||
                (item.path !== '/' && location.pathname.startsWith(`${item.path}/`))
            );

            const pageName = matchingItem ? matchingItem.label : '';
            document.title = pageName
                ? `${currentBox.name} | ${pageName}`.toUpperCase()
                : `${currentBox.name} | BOX MANAGER`.toUpperCase();
        } else {
            document.title = "BOX MANAGER";
        }
    }, [currentBox, location.pathname, t, navItems]);

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
    };

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    const customNavConfig = (currentBox as Box)?.theme_config?.navigation;

    const filteredNavItems = navItems
        .filter(item => {
            // Role access check (existing logic)
            const hasRoleAccess = !item.roles || (userProfile?.role_id && item.roles.includes(userProfile.role_id));
            if (!hasRoleAccess) return false;

            // Custom visibility check
            if (customNavConfig && Array.isArray(customNavConfig)) {
                const config = customNavConfig.find(c => c.id === item.id);
                if (config && config.visible === false) return false;
            }
            return true;
        })
        .sort((a, b) => {
            // Custom order check
            if (customNavConfig && Array.isArray(customNavConfig)) {
                const configA = customNavConfig.find(c => c.id === a.id);
                const configB = customNavConfig.find(c => c.id === b.id);
                if (configA && configB && typeof configA.order === 'number' && typeof configB.order === 'number') {
                    return configA.order - configB.order;
                }
            }
            return 0;
        });

    const navigateTo = (path: string) => {
        navigate(path);
        setIsSidebarOpen(false);
    };

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const isActive = (path: string) => location.pathname === path;

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
                "fixed inset-y-6 left-6 z-[110] w-64 flex flex-col bg-card/40 backdrop-blur-3xl border border-white/10 rounded-[2rem] shadow-premium transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] lg:translate-x-0 lg:z-40",
                isSidebarOpen ? "translate-x-0" : "-translate-x-[calc(100%+32px)]"
            )}>
                <div className="flex h-20 items-center justify-between px-6 shrink-0 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    <div className="flex items-center gap-3" onClick={() => navigateTo('/dashboard')} style={{ cursor: 'pointer' }}>
                        {currentBox?.logo_url ? (
                            <img src={currentBox.logo_url} alt="Logo" className="h-10 w-10 object-contain rounded-lg shadow-lg shadow-primary/10" />
                        ) : (
                            <div className="h-10 w-10 bg-primary/20 rounded-lg flex items-center justify-center">
                                <span className="text-primary font-black italic">B</span>
                            </div>
                        )}
                        <div className="flex flex-col">
                            <span className="text-xl font-black tracking-tighter text-primary uppercase italic text-glow leading-none truncate max-w-[120px]">
                                {currentBox?.name || 'Box Manager'}
                            </span>
                            <span className="text-[8px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 mt-1">Sport-Tech Engine</span>
                        </div>
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
                                variant={isActive(item.path) ? "default" : "ghost"}
                                className={cn(
                                    "w-full justify-start gap-3 h-12 px-5 font-bold uppercase text-[10px] tracking-widest transition-all duration-500 rounded-2xl relative group overflow-hidden border-none",
                                    isActive(item.path)
                                        ? "bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]"
                                        : "text-muted-foreground/80 hover:bg-primary/10 hover:text-primary hover:scale-[1.02]"
                                )}
                                onClick={() => navigateTo(item.path)}
                            >
                                {isActive(item.path) && (
                                    <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-white rounded-r-full animate-in fade-in slide-in-from-left-2 duration-300" />
                                )}
                                <item.icon className={cn("h-4 w-4 transition-transform duration-300", isActive(item.path) ? "text-white scale-110" : "text-primary/70 group-hover:scale-125")} />
                                {item.label}
                                {!isActive(item.path) && (
                                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                )}
                            </Button>
                        ))}
                    </nav>
                </div>

                <div className="p-4 space-y-2 mt-auto bg-white/5 backdrop-blur-md rounded-b-[2rem] border-t border-white/5">
                    <Button
                        variant={isActive('/settings') ? "default" : "ghost"}
                        className={cn(
                            "w-full justify-start gap-3 h-11 px-4 font-bold uppercase text-[10px] tracking-widest rounded-xl transition-all border-none",
                            isActive('/settings') ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-muted-foreground/80 hover:bg-primary/10 hover:text-primary"
                        )}
                        onClick={() => navigateTo('/settings')}
                    >
                        <SettingsIcon className="h-4 w-4 transition-transform group-hover:rotate-45" />
                        {t('nav.settings')}
                    </Button>
                    <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 h-11 px-4 text-muted-foreground/80 font-bold uppercase text-[10px] tracking-widest rounded-xl hover:text-destructive hover:bg-destructive/10 transition-all border-none"
                        onClick={handleLogout}
                    >
                        <LogOut className="h-4 w-4 text-destructive/70" />
                        {t('nav.logout')}
                    </Button>
                </div>
            </aside>

            {/* Content Wrapper */}
            <div className="flex-1 flex flex-col min-w-0 transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]">
                {/* Header */}
                <header className="flex h-16 items-center justify-between px-6 md:px-10 glass sticky top-6 mx-6 rounded-3xl z-30 shadow-premium border-white/10 font-inter transition-all duration-700 lg:ml-[288px]">
                    <div className="flex items-center gap-3 lg:hidden">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-primary hover:bg-primary/10 rounded-full"
                            onClick={toggleSidebar}
                        >
                            <Menu className="h-6 w-6" />
                        </Button>
                        <div className="flex items-center gap-2">
                            {currentBox?.logo_url && <img src={currentBox.logo_url} className="h-6 w-6 object-contain" alt="Logo" />}
                            <span className="text-lg font-black italic tracking-tighter text-primary uppercase text-glow">{currentBox?.name || 'Box Manager'}</span>
                        </div>
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
                                <Button variant="ghost" size="icon" className="hover:bg-primary/10 text-primary rounded-full transition-all hover:rotate-12 active:scale-90">
                                    <Languages className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-card/80 backdrop-blur-2xl border-white/10 w-44 rounded-2xl p-2 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                                <DropdownMenuItem onClick={() => changeLanguage('es')} className="cursor-pointer font-black uppercase text-[9px] tracking-[0.15em] rounded-xl focus:bg-primary/10 focus:text-primary transition-colors">
                                    Español
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => changeLanguage('en')} className="cursor-pointer font-black uppercase text-[9px] tracking-[0.15em] rounded-xl focus:bg-primary/10 focus:text-primary transition-colors">
                                    English
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <ModeToggle />
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-10 w-10 p-0 rounded-full border border-primary/20 overflow-hidden hover:scale-105 transition-transform">
                                    {userProfile?.avatar_url && (userProfile.avatar_url.startsWith('http') || userProfile.avatar_url.startsWith('/')) ? (
                                        <img src={userProfile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="h-5 w-5 text-primary" />
                                    )}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-card/80 backdrop-blur-2xl border-white/10 w-56 rounded-2xl p-2 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                                <div className="px-3 py-2 border-b border-primary/10 mb-2">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-primary truncate">{userProfile?.first_name} {userProfile?.last_name}</p>
                                    <p className="text-[8px] font-medium text-muted-foreground truncate italic">{userProfile?.role_id}</p>
                                </div>
                                <DropdownMenuItem onClick={() => navigateTo('/profile')} className="cursor-pointer font-black uppercase text-[9px] tracking-[0.15em] rounded-xl focus:bg-primary/10 focus:text-primary transition-colors gap-2">
                                    <User className="h-3 w-3" /> {t('profile.title')}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => navigateTo('/settings')} className="cursor-pointer font-black uppercase text-[9px] tracking-[0.15em] rounded-xl focus:bg-primary/10 focus:text-primary transition-colors gap-2">
                                    <SettingsIcon className="h-3 w-3" /> {t('nav.settings')}
                                </DropdownMenuItem>
                                <Separator className="my-2 bg-primary/10" />
                                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer font-black uppercase text-[9px] tracking-[0.15em] rounded-xl focus:bg-destructive/10 focus:text-destructive transition-colors gap-2">
                                    <LogOut className="h-3 w-3" /> {t('nav.logout')}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className={cn(
                    "flex-1 transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]",
                    "lg:ml-[288px]"
                )}>
                    <div className="container mx-auto p-6 md:p-10 max-w-7xl animate-premium-in">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};
