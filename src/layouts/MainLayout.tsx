import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { LayoutDashboard, Users, Trophy, BarChart3, Settings as SettingsIcon, Calendar as CalendarIcon, Receipt, LogOut, Inbox, Menu, X, Monitor, Medal, Shield, History, Dumbbell, User, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { ModeToggle } from '@/components/mode-toggle';
import { useLanguage } from '@/hooks';
import { Database } from '@/types/supabase';
type Box = Database['public']['Tables']['boxes']['Row'] & { theme_config?: any };
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from '@/contexts/AuthContext';
import { SubscriptionBanner } from '@/components/admin';

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
    const { currentBox, signOut, isAdmin } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = getNavItems(t);

    useEffect(() => {
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

        if (currentBox?.name) {
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
            const hasRoleAccess = !item.roles || (userProfile?.role_id && item.roles.includes(userProfile.role_id));
            if (!hasRoleAccess) return false;

            if (customNavConfig && Array.isArray(customNavConfig)) {
                const config = customNavConfig.find((c: any) => c.id === item.id);
                if (config && config.visible === false) return false;
            }
            return true;
        })
        .sort((a: any, b: any) => {
            if (customNavConfig && Array.isArray(customNavConfig)) {
                const configA = customNavConfig.find((c: any) => c.id === a.id);
                const configB = customNavConfig.find((c: any) => c.id === b.id);
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
                    "fixed inset-0 z-[100] bg-black/30 backdrop-blur-sm lg:hidden transition-all duration-300",
                    isSidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                )}
                onClick={() => setIsSidebarOpen(false)}
            />

            {/* Sidebar — Apple-style navigation */}
            <aside className={cn(
                "fixed inset-y-0 left-0 z-[110] w-[272px] flex flex-col bg-card/80 backdrop-blur-xl border-r border-border/50 transition-transform duration-300 ease-out lg:translate-x-0",
                isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                {/* Logo section */}
                <div className="flex h-16 items-center justify-between px-5 shrink-0">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigateTo('/dashboard')}>
                        {currentBox?.logo_url ? (
                            <img src={currentBox.logo_url} alt="Logo" className="h-8 w-8 object-contain rounded-lg" />
                        ) : (
                            <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center">
                                <span className="text-primary font-bold text-sm">B</span>
                            </div>
                        )}
                        <span className="text-base font-semibold text-foreground truncate max-w-[150px]">
                            {currentBox?.name || 'Box Manager'}
                        </span>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden h-8 w-8 rounded-full"
                        onClick={() => setIsSidebarOpen(false)}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                <Separator className="bg-border/50" />

                {/* Navigation items */}
                <div className="flex-1 px-3 py-4 overflow-y-auto">
                    <nav className="space-y-0.5">
                        {filteredNavItems.map((item) => (
                            <button
                                key={item.id}
                                className={cn(
                                    "w-full flex items-center gap-3 h-10 px-3 rounded-lg text-sm font-medium transition-colors",
                                    isActive(item.path)
                                        ? "bg-primary text-primary-foreground"
                                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                                )}
                                onClick={() => navigateTo(item.path)}
                            >
                                <item.icon className="h-4 w-4 shrink-0" />
                                <span className="truncate">{item.label}</span>
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Bottom section */}
                <div className="p-3 space-y-0.5 border-t border-border/50">
                    <button
                        className={cn(
                            "w-full flex items-center gap-3 h-10 px-3 rounded-lg text-sm font-medium transition-colors",
                            isActive('/settings')
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:bg-accent hover:text-foreground"
                        )}
                        onClick={() => navigateTo('/settings')}
                    >
                        <SettingsIcon className="h-4 w-4" />
                        {t('nav.settings')}
                    </button>
                    <button
                        className="w-full flex items-center gap-3 h-10 px-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                        onClick={handleLogout}
                    >
                        <LogOut className="h-4 w-4" />
                        {t('nav.logout')}
                    </button>
                </div>
            </aside>

            {/* Content Wrapper */}
            <div className="flex-1 flex flex-col min-w-0 lg:pl-[272px]">
                {/* Header — Apple-style navigation bar */}
                <header className="sticky top-0 z-30 flex h-14 items-center justify-between px-4 md:px-6 bg-background/80 backdrop-blur-xl border-b border-border/50">
                    {/* Left: hamburger + logo on mobile */}
                    <div className="flex items-center gap-3 lg:hidden">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-full"
                            onClick={toggleSidebar}
                        >
                            <Menu className="h-5 w-5" />
                        </Button>
                        <div className="flex items-center gap-2">
                            {currentBox?.logo_url && <img src={currentBox.logo_url} className="h-6 w-6 object-contain rounded-md" alt="Logo" />}
                            <span className="text-base font-semibold text-foreground">{currentBox?.name || 'Box Manager'}</span>
                        </div>
                    </div>

                    {/* Left: status on desktop */}
                    <div className="hidden lg:flex items-center gap-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <div className="h-2 w-2 rounded-full bg-emerald-500" />
                            <span className="text-xs font-medium">{t('nav.system_online')}</span>
                        </div>
                    </div>

                    {/* Right: actions */}
                    <div className="flex items-center gap-1">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                                    <Languages className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuItem onClick={() => changeLanguage('es')} className="cursor-pointer text-sm">
                                    Español
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => changeLanguage('en')} className="cursor-pointer text-sm">
                                    English
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <ModeToggle />
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-9 w-9 p-0 rounded-full overflow-hidden">
                                    {userProfile?.avatar_url && (userProfile.avatar_url.startsWith('http') || userProfile.avatar_url.startsWith('/')) ? (
                                        <img src={userProfile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="h-4 w-4 text-muted-foreground" />
                                    )}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <div className="px-3 py-2.5 border-b border-border mb-1">
                                    <p className="text-sm font-medium text-foreground truncate">{userProfile?.first_name} {userProfile?.last_name}</p>
                                    <p className="text-xs text-muted-foreground truncate">{userProfile?.role_id}</p>
                                </div>
                                <DropdownMenuItem onClick={() => navigateTo('/profile')} className="cursor-pointer gap-2">
                                    <User className="h-4 w-4" /> {t('profile.title')}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => navigateTo('/settings')} className="cursor-pointer gap-2">
                                    <SettingsIcon className="h-4 w-4" /> {t('nav.settings')}
                                </DropdownMenuItem>
                                <Separator className="my-1" />
                                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer gap-2 text-destructive focus:text-destructive">
                                    <LogOut className="h-4 w-4" /> {t('nav.logout')}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                {/* Subscription Banner — only for admin, shows trial/suspended/cancelled states */}
                {isAdmin && currentBox && currentBox.subscription_status !== 'active' && (
                    <div className="sticky top-14 z-20 px-4 md:px-6 py-1.5 bg-background/80 backdrop-blur-xl border-b border-border/30">
                        <SubscriptionBanner
                            status={currentBox.subscription_status}
                            trialEndsAt={currentBox.trial_ends_at}
                        />
                    </div>
                )}

                {/* Main Content Area */}
                <main className="flex-1">
                    <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-7xl animate-premium-in">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};
