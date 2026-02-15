import React, { useState, useEffect, useRef } from 'react';
import {
    Image as ImageIcon,
    Save,
    Sun,
    Moon,
    Monitor,
    RefreshCcw,
    Zap,
    Feather,
    Square,
    Settings as SettingsIcon,
    Upload,
    Loader2,
    Menu,
    ArrowUp,
    ArrowDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/components/theme-provider';
import { supabase } from '@/lib/supabaseClient';
import { useTranslation } from 'react-i18next';

export const Settings: React.FC = () => {
    const {
        theme, setTheme,
        primaryColor, setPrimaryColor,
        radius, setRadius,
        designStyle, setDesignStyle,
        resetTheme
    } = useTheme();

    const { t } = useTranslation();
    const { currentBox, setCurrentBox } = useAuth();

    const logoInputRef = useRef<HTMLInputElement>(null);
    const faviconInputRef = useRef<HTMLInputElement>(null);
    const loginBgInputRef = useRef<HTMLInputElement>(null);

    const [boxSettings, setBoxSettings] = useState({
        name: '',
        logo_url: '',
        favicon_url: '',
        login_background_url: ''
    });
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState<'logo' | 'favicon' | 'login_bg' | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const [navigationConfig, setNavigationConfig] = useState<any[]>([]);

    const defaultNavItems = [
        { id: 'dashboard', visible: true, order: 0 },
        { id: 'schedule', visible: true, order: 1 },
        { id: 'members', visible: true, order: 2 },
        { id: 'roles', visible: true, order: 3 },
        { id: 'audit-logs', visible: true, order: 4 },
        { id: 'leads', visible: true, order: 5 },
        { id: 'billing', visible: true, order: 6 },
        { id: 'wods', visible: true, order: 7 },
        { id: 'movements', visible: true, order: 8 },
        { id: 'benchmarks', visible: true, order: 9 },
        { id: 'competitions', visible: true, order: 10 },
        { id: 'box-display', visible: true, order: 11 },
        { id: 'analytics', visible: true, order: 12 },
    ];

    useEffect(() => {
        if (currentBox) {
            setBoxSettings({
                name: currentBox.name || '',
                logo_url: currentBox.logo_url || '',
                favicon_url: currentBox.favicon_url || '',
                login_background_url: currentBox.login_background_url || ''
            });

            // Initialize navigation config
            const themeConfig = currentBox.theme_config as any;
            if (themeConfig?.navigation && Array.isArray(themeConfig.navigation)) {
                setNavigationConfig(themeConfig.navigation);
            } else {
                setNavigationConfig(defaultNavItems);
            }
        }
    }, [currentBox]);

    const getFileNameFromUrl = (url: string) => {
        if (!url) return '';
        if (url.includes('brand/')) {
            const parts = url.split('_');
            if (parts.length > 1) {
                // Return original name (skip type and timestamp)
                return parts.slice(2).join('_');
            }
            const pathParts = url.split('/');
            return pathParts[pathParts.length - 1];
        }
        return url;
    };

    const compressImage = (file: File, maxWidth = 800, maxHeight = 800, quality = 0.8): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > maxWidth) {
                            height *= maxWidth / width;
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width *= maxHeight / height;
                            height = maxHeight;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);

                    canvas.toBlob(
                        (blob) => {
                            if (blob) resolve(blob);
                            else reject(new Error('Canvas to Blob failed'));
                        },
                        'image/jpeg',
                        quality
                    );
                };
                img.onerror = (err) => reject(err);
            };
            reader.onerror = (err) => reject(err);
        });
    };

    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'favicon' | 'login_bg') => {
        const file = event.target.files?.[0];
        if (!file || !currentBox?.id) return;

        setIsUploading(type);
        setMessage(null);

        try {
            const maxDim = type === 'favicon' ? 128 : type === 'login_bg' ? 1920 : 800;
            const compressedBlob = await compressImage(file, maxDim, maxDim, type === 'login_bg' ? 0.85 : 0.8);

            const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
            const fileName = `${type}_${Date.now()}_${cleanFileName}`;
            const filePath = `brand/${currentBox.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('branding')
                .upload(filePath, compressedBlob, {
                    contentType: 'image/jpeg',
                    upsert: true
                });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('branding')
                .getPublicUrl(filePath);

            const fieldKey = type === 'logo' ? 'logo_url' : type === 'favicon' ? 'favicon_url' : 'login_background_url';
            setBoxSettings(prev => ({
                ...prev,
                [fieldKey]: publicUrl
            }));

            setMessage({
                type: 'success',
                text: t(`settings.branding.${type}_uploaded`)
            });
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setIsUploading(null);
        }
    };

    const handleSaveBranding = async () => {
        if (!currentBox?.id) return;
        setIsSaving(true);
        setMessage(null);

        if (!boxSettings.name.trim()) {
            setMessage({ type: 'error', text: t('settings.branding.name_required') });
            setIsSaving(false);
            return;
        }

        try {
            const { error } = await supabase
                .from('boxes')
                .update({
                    name: boxSettings.name,
                    logo_url: boxSettings.logo_url,
                    favicon_url: boxSettings.favicon_url,
                    login_background_url: boxSettings.login_background_url,
                    updated_at: new Date().toISOString()
                })
                .eq('id', currentBox.id);

            if (error) throw error;

            // Update context immediately
            if (currentBox) {
                setCurrentBox({
                    ...currentBox,
                    name: boxSettings.name,
                    logo_url: boxSettings.logo_url,
                    favicon_url: boxSettings.favicon_url,
                    login_background_url: boxSettings.login_background_url
                });
            }

            setMessage({ type: 'success', text: t('settings.branding.success') });
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveAppearance = async () => {
        if (!currentBox?.id) return;
        setIsSaving(true);
        setMessage(null);
        try {
            const currentThemeConfig = (currentBox.theme_config as any) || {};
            const themeConfig = {
                ...currentThemeConfig,
                primaryColor,
                radius,
                designStyle
            };

            const { error } = await supabase
                .from('boxes')
                .update({
                    theme_config: themeConfig as any,
                    updated_at: new Date().toISOString()
                })
                .eq('id', currentBox.id);

            if (error) throw error;

            // Update context immediately
            if (currentBox) {
                setCurrentBox({
                    ...currentBox,
                    theme_config: themeConfig
                });
            }

            setMessage({ type: 'success', text: t('settings.appearance.success') });
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveNavigation = async () => {
        if (!currentBox?.id) return;

        setIsSaving(true);
        setMessage(null);

        try {
            const currentThemeConfig = (currentBox.theme_config as any) || {};
            const newThemeConfig = {
                ...currentThemeConfig,
                navigation: navigationConfig
            };

            const { error } = await supabase
                .from('boxes')
                .update({
                    theme_config: newThemeConfig,
                    updated_at: new Date().toISOString()
                })
                .eq('id', currentBox.id);

            if (error) throw error;

            // Update context immediately
            if (currentBox) {
                setCurrentBox({
                    ...currentBox,
                    theme_config: newThemeConfig
                });
            }

            setMessage({ type: 'success', text: t('settings.navigation.save_success') });
        } catch (error: any) {
            console.error('Error saving navigation:', error);
            setMessage({ type: 'error', text: error.message });
        } finally {
            setIsSaving(false);
        }
    };

    const toggleNavItem = (id: string) => {
        setNavigationConfig(prev => prev.map(item =>
            item.id === id ? { ...item, visible: !item.visible } : item
        ));
    };

    const moveItem = (id: string, direction: 'up' | 'down') => {
        const index = navigationConfig.findIndex(item => item.id === id);
        if (index === -1) return;
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === navigationConfig.length - 1) return;

        const newConfig = [...navigationConfig];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        [newConfig[index], newConfig[targetIndex]] = [newConfig[targetIndex], newConfig[index]];

        // Update orders
        const finalConfig = newConfig.map((item, idx) => ({ ...item, order: idx }));
        setNavigationConfig(finalConfig);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-2xl">
                    <SettingsIcon className="h-8 w-8 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('settings.title')}</h1>
                    <p className="text-muted-foreground text-sm">{t('settings.subtitle')}</p>
                </div>
            </div>

            <Tabs defaultValue="branding" className="w-full">
                <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent space-x-6 overflow-x-auto overflow-y-hidden scrollbar-none">
                    <TabsTrigger value="branding" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2 shrink-0">{t('settings.tabs.branding')}</TabsTrigger>
                    <TabsTrigger value="appearance" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2 shrink-0">{t('settings.tabs.appearance')}</TabsTrigger>
                    <TabsTrigger value="navigation" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2 shrink-0">{t('settings.tabs.navigation')}</TabsTrigger>
                    <TabsTrigger value="localization" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2 shrink-0">{t('settings.tabs.localization')}</TabsTrigger>
                    <TabsTrigger value="notifications" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2 shrink-0">{t('settings.tabs.notifications')}</TabsTrigger>
                </TabsList>

                <TabsContent value="branding" className="py-6">
                    <div className="grid gap-6">
                        <Card className="border-none shadow-premium bg-card/50 backdrop-blur-xl overflow-hidden">
                            <CardHeader className="pb-4">
                                <div className="flex items-center gap-2">
                                    <ImageIcon className="h-5 w-5 text-primary" />
                                    <CardTitle>{t('settings.branding.title')}</CardTitle>
                                </div>
                                <CardDescription>{t('settings.branding.desc')}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-1">
                                                <Label htmlFor="box-name">{t('settings.branding.box_name')}</Label>
                                                <div className="w-1 h-1 rounded-full bg-destructive" />
                                            </div>
                                            <Input
                                                id="box-name"
                                                value={boxSettings.name}
                                                onChange={(e) => setBoxSettings({ ...boxSettings, name: e.target.value })}
                                                className="rounded-xl h-11"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="logo-url">{t('settings.branding.logo_url')}</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    id="logo-url"
                                                    placeholder="https://example.com/logo.png"
                                                    value={getFileNameFromUrl(boxSettings.logo_url)}
                                                    onChange={(e) => setBoxSettings({ ...boxSettings, logo_url: e.target.value })}
                                                    className="rounded-xl h-11 flex-1"
                                                />
                                                <Button
                                                    variant="outline"
                                                    className="rounded-xl h-11 flex-shrink-0 gap-2 px-4"
                                                    onClick={() => logoInputRef.current?.click()}
                                                    disabled={isUploading === 'logo'}
                                                >
                                                    {isUploading === 'logo' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                                                    <span className="text-xs font-bold uppercase tracking-widest">{t('settings.branding.upload')}</span>
                                                </Button>
                                            </div>
                                            <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={(e) => handleUpload(e, 'logo')} />
                                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{t('settings.branding.logo_hint')}</p>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="favicon-url">{t('settings.branding.favicon_url')}</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    id="favicon-url"
                                                    placeholder="https://example.com/favicon.ico"
                                                    value={getFileNameFromUrl(boxSettings.favicon_url)}
                                                    onChange={(e) => setBoxSettings({ ...boxSettings, favicon_url: e.target.value })}
                                                    className="rounded-xl h-11 flex-1"
                                                />
                                                <Button
                                                    variant="outline"
                                                    className="rounded-xl h-11 flex-shrink-0 gap-2 px-4"
                                                    onClick={() => faviconInputRef.current?.click()}
                                                    disabled={isUploading === 'favicon'}
                                                >
                                                    {isUploading === 'favicon' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                                                    <span className="text-xs font-bold uppercase tracking-widest">{t('settings.branding.upload')}</span>
                                                </Button>
                                            </div>
                                            <input type="file" ref={faviconInputRef} className="hidden" accept="image/*" onChange={(e) => handleUpload(e, 'favicon')} />
                                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{t('settings.branding.favicon_hint')}</p>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="login-bg-url">{t('settings.branding.login_bg_url')}</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    id="login-bg-url"
                                                    placeholder="https://example.com/background.jpg"
                                                    value={getFileNameFromUrl(boxSettings.login_background_url)}
                                                    onChange={(e) => setBoxSettings({ ...boxSettings, login_background_url: e.target.value })}
                                                    className="rounded-xl h-11 flex-1"
                                                />
                                                <Button
                                                    variant="outline"
                                                    className="rounded-xl h-11 flex-shrink-0 gap-2 px-4"
                                                    onClick={() => loginBgInputRef.current?.click()}
                                                    disabled={isUploading === 'login_bg'}
                                                >
                                                    {isUploading === 'login_bg' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                                                    <span className="text-xs font-bold uppercase tracking-widest">{t('settings.branding.upload')}</span>
                                                </Button>
                                            </div>
                                            <input type="file" ref={loginBgInputRef} className="hidden" accept="image/*" onChange={(e) => handleUpload(e, 'login_bg')} />
                                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{t('settings.branding.login_bg_hint')}</p>
                                            {boxSettings.login_background_url && (
                                                <div className="mt-2 rounded-xl overflow-hidden border border-border h-24">
                                                    <img src={boxSettings.login_background_url} alt="Login BG Preview" className="w-full h-full object-cover" />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-primary/10 rounded-3xl bg-primary/5">
                                        <div className="mb-4 text-center">
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 mb-2 block">{t('settings.branding.live_preview')}</span>
                                            <div className="bg-card w-48 h-12 rounded-2xl shadow-xl flex items-center px-4 gap-3 border border-border overflow-hidden">
                                                {boxSettings.logo_url ? (
                                                    <img src={boxSettings.logo_url} alt="Preview" className="h-6 w-6 object-contain" />
                                                ) : (
                                                    <div className="h-6 w-6 bg-primary/20 rounded-lg flex items-center justify-center">
                                                        <span className="text-[10px] text-primary font-black italic">B</span>
                                                    </div>
                                                )}
                                                <span className="font-black italic uppercase text-primary text-xs truncate">{boxSettings.name || t('settings.branding.box_name')}</span>
                                            </div>
                                        </div>
                                        <div className="mt-4 flex gap-2">
                                            {boxSettings.favicon_url && (
                                                <div className="p-2 bg-card rounded-lg border border-border flex items-center gap-2">
                                                    <img src={boxSettings.favicon_url} alt="Favicon" className="h-4 w-4" />
                                                    <span className="text-[8px] font-bold uppercase text-muted-foreground">{t('settings.branding.favicon_label')}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="border-t border-primary/5 bg-primary/5 p-4 flex flex-col items-stretch gap-4">
                                {message && (
                                    <div className={`p-3 rounded-xl text-xs font-bold text-center border ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-destructive/10 border-destructive/20 text-destructive'
                                        }`}>
                                        {message.text}
                                    </div>
                                )}
                                <Button
                                    className="ml-auto gap-2 rounded-xl"
                                    onClick={handleSaveBranding}
                                    disabled={isSaving}
                                >
                                    {isSaving ? (
                                        <RefreshCcw className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Save className="h-4 w-4" />
                                    )}
                                    {isSaving ? t('settings.saving') : t('settings.branding.save')}
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="appearance" className="py-6">
                    <div className="grid gap-6">
                        <Card className="overflow-hidden border-none shadow-premium bg-card/50 backdrop-blur-xl">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-2xl">{t('settings.appearance.title')}</CardTitle>
                                <CardDescription>{t('settings.appearance.desc')}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {[
                                        { id: 'cyber', icon: <Zap className="h-6 w-6" /> },
                                        { id: 'minimal', icon: <Feather className="h-6 w-6" /> },
                                        { id: 'brutalist', icon: <Square className="h-6 w-6" /> },
                                    ].map((style) => (
                                        <button
                                            key={style.id}
                                            onClick={() => setDesignStyle(style.id as any)}
                                            className={`flex flex-col items-start p-6 rounded-2xl border-2 transition-all duration-500 text-left gap-4 group ${designStyle === style.id
                                                ? 'border-primary bg-primary/5 shadow-premium scale-[1.02]'
                                                : 'border-border hover:border-border/80 hover:bg-muted'
                                                }`}
                                        >
                                            <div className={`p-3 rounded-xl transition-all duration-500 ${designStyle === style.id ? 'bg-primary text-foreground shadow-lg shadow-primary/30' : 'bg-muted text-muted-foreground group-hover:bg-muted-foreground/10'}`}>
                                                {style.icon}
                                            </div>
                                            <div>
                                                <h4 className={`text-sm font-bold uppercase tracking-widest ${designStyle === style.id ? 'text-primary' : 'text-foreground'}`}>
                                                    {t(`settings.appearance.styles.${style.id}`)}
                                                </h4>
                                                <p className="text-xs text-muted-foreground mt-1 font-medium leading-relaxed">
                                                    {t(`settings.appearance.styles.${style.id}_desc`)}
                                                </p>
                                            </div>
                                            {designStyle === style.id && (
                                                <div className="w-full h-1 bg-primary mt-2 rounded-full animate-in fade-in zoom-in duration-500" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="overflow-hidden border-none shadow-premium bg-card/50 backdrop-blur-xl">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-2xl">{t('settings.appearance.mode_title')}</CardTitle>
                                <CardDescription>{t('settings.appearance.mode_desc')}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-3 gap-4">
                                    {[
                                        { id: 'light', icon: <Sun className="h-5 w-5" /> },
                                        { id: 'dark', icon: <Moon className="h-5 w-5" /> },
                                        { id: 'system', icon: <Monitor className="h-5 w-5" /> },
                                    ].map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => setTheme(item.id as any)}
                                            className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-300 gap-2 ${theme === item.id
                                                ? 'border-primary bg-primary/10 shadow-[0_0_20px_rgba(var(--primary),0.2)]'
                                                : 'border-border hover:border-border/80 hover:bg-muted'
                                                }`}
                                        >
                                            <div className={`${theme === item.id ? 'text-primary' : 'text-muted-foreground'}`}>
                                                {item.icon}
                                            </div>
                                            <span className={`text-xs font-bold uppercase tracking-wider ${theme === item.id ? 'text-primary' : 'text-muted-foreground'}`}>
                                                {t(`settings.appearance.modes.${item.id}`)}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="overflow-hidden border-none shadow-premium bg-card/50 backdrop-blur-xl">
                            <CardHeader>
                                <CardTitle className="text-2xl">{t('settings.appearance.brand_title')}</CardTitle>
                                <CardDescription>{t('settings.appearance.brand_desc')}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    <Label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">{t('settings.appearance.presets')}</Label>
                                    <div className="flex flex-wrap gap-3">
                                        {[
                                            { id: 'scarlet', hex: '#FF3B30' },
                                            { id: 'azure', hex: '#007AFF' },
                                            { id: 'emerald', hex: '#34C759' },
                                            { id: 'gold', hex: '#FFD700' },
                                            { id: 'purple', hex: '#AF52DE' },
                                            { id: 'orange', hex: '#FF9500' },
                                            { id: 'pink', hex: '#FF2D55' },
                                            { id: 'teal', hex: '#5AC8FA' },
                                        ].map((color) => (
                                            <button
                                                key={color.hex}
                                                onClick={() => setPrimaryColor(color.hex)}
                                                className={`w-10 h-10 rounded-full border-4 transition-all duration-300 transform hover:scale-110 ${primaryColor.toLowerCase() === color.hex.toLowerCase()
                                                    ? 'border-foreground ring-2 ring-primary shadow-lg scale-110'
                                                    : 'border-transparent shadow-sm'
                                                    }`}
                                                style={{ backgroundColor: color.hex }}
                                                title={t(`settings.appearance.colors.${color.id}`)}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-primary/5">
                                    <Label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">{t('settings.appearance.custom_color')}</Label>
                                    <div className="flex gap-4 items-center">
                                        <div className="relative group">
                                            <div
                                                className="w-14 h-14 rounded-2xl border-4 border-background shadow-2xl transition-transform group-hover:scale-105"
                                                style={{ backgroundColor: primaryColor }}
                                            />
                                            <input
                                                type="color"
                                                value={primaryColor}
                                                onChange={(e) => setPrimaryColor(e.target.value)}
                                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                            />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <Input
                                                type="text"
                                                value={primaryColor.toUpperCase()}
                                                onChange={(e) => setPrimaryColor(e.target.value)}
                                                className="font-mono text-sm tracking-wider h-12 rounded-xl"
                                                placeholder="#HEXCODE"
                                            />
                                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">{t('settings.appearance.color_hint')}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="overflow-hidden border-none shadow-premium bg-card/50 backdrop-blur-xl">
                            <CardHeader>
                                <CardTitle className="text-2xl">{t('settings.appearance.interface_title')}</CardTitle>
                                <CardDescription>{t('settings.appearance.interface_desc')}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <Label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">{t('settings.appearance.border_radius')}</Label>
                                        <span className="text-xs font-mono bg-primary/20 text-primary px-2 py-1 rounded-md">{radius}rem</span>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <span className="text-[10px] font-black uppercase text-muted-foreground italic tracking-tighter">{t('settings.appearance.sharp')}</span>
                                        <input
                                            type="range"
                                            min="0"
                                            max="1.5"
                                            step="0.05"
                                            value={radius}
                                            onChange={(e) => setRadius(parseFloat(e.target.value))}
                                            className="flex-1 accent-primary h-1.5 bg-muted rounded-full appearance-none cursor-pointer"
                                        />
                                        <span className="text-[10px] font-black uppercase text-muted-foreground italic tracking-tighter">{t('settings.appearance.rounded')}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 pt-2">
                                        <div className="p-3 bg-muted/50 rounded-[var(--radius)] border border-border flex items-center justify-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                                            {t('settings.appearance.preview_card')}
                                        </div>
                                        <Button size="sm" className="pointer-events-none rounded-[var(--radius)]">
                                            {t('settings.appearance.preview_button')}
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="bg-primary/5 pt-6 pb-6 border-t border-primary/10 flex flex-col gap-4">
                                {message && message.type === 'success' && (
                                    <div className="p-3 rounded-xl text-xs font-bold text-center border bg-emerald-500/10 border-emerald-500/20 text-emerald-500">
                                        {message.text}
                                    </div>
                                )}
                                {message && message.type === 'error' && (
                                    <div className="p-3 rounded-xl text-xs font-bold text-center border bg-destructive/10 border-destructive/20 text-destructive">
                                        {message.text}
                                    </div>
                                )}
                                <div className="flex gap-4 w-full">
                                    <Button
                                        variant="ghost"
                                        className="flex-1 gap-2 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-300 rounded-xl"
                                        onClick={resetTheme}
                                    >
                                        <RefreshCcw className="h-4 w-4" /> {t('settings.appearance.reset')}
                                    </Button>
                                    <Button
                                        className="flex-[2] gap-2 rounded-xl"
                                        onClick={handleSaveAppearance}
                                        disabled={isSaving}
                                    >
                                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                        {t('settings.appearance.save')}
                                    </Button>
                                </div>
                            </CardFooter>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="navigation" className="py-6">
                    <div className="grid gap-6">
                        <Card className="border-none shadow-premium bg-card/50 backdrop-blur-xl overflow-hidden">
                            <CardHeader className="pb-4">
                                <div className="flex items-center gap-2">
                                    <Menu className="h-5 w-5 text-primary" />
                                    <CardTitle>{t('settings.navigation.title')}</CardTitle>
                                </div>
                                <CardDescription>{t('settings.navigation.desc')}</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-primary/5">
                                    {navigationConfig.map((item, index) => (
                                        <div key={item.id} className="flex items-center justify-between p-4 hover:bg-primary/5 transition-colors group">
                                            <div className="flex items-center gap-4">
                                                <div className="flex flex-col gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 hover:bg-primary/20 disabled:opacity-30"
                                                        onClick={() => moveItem(item.id, 'up')}
                                                        disabled={index === 0}
                                                    >
                                                        <ArrowUp className="h-3 w-3" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 hover:bg-primary/20 disabled:opacity-30"
                                                        onClick={() => moveItem(item.id, 'down')}
                                                        disabled={index === navigationConfig.length - 1}
                                                    >
                                                        <ArrowDown className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium uppercase tracking-tight">
                                                        {t(`nav.${item.id.replace('-', '_')}`)}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground font-light uppercase tracking-widest">
                                                        {t('settings.navigation.item_name')}: {item.id}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-6">
                                                <div className="flex items-center gap-2">
                                                    <Label htmlFor={`visible-${item.id}`} className="text-xs text-muted-foreground cursor-pointer">
                                                        {t('settings.navigation.visible')}
                                                    </Label>
                                                    <Switch
                                                        id={`visible-${item.id}`}
                                                        checked={item.visible !== false}
                                                        onCheckedChange={() => toggleNavItem(item.id)}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                            <CardFooter className="border-t border-primary/5 bg-primary/5 p-4 flex flex-col items-stretch gap-4">
                                {message && message.type === 'success' && (
                                    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm text-center animate-in fade-in slide-in-from-top-2">
                                        {message.text}
                                    </div>
                                )}
                                {message && message.type === 'error' && (
                                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center animate-in fade-in slide-in-from-top-2">
                                        {message.text}
                                    </div>
                                )}
                                <Button
                                    className="w-full gap-2 rounded-xl"
                                    onClick={handleSaveNavigation}
                                    disabled={isSaving}
                                >
                                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    {t('settings.navigation.save')}
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="localization" className="py-6">
                    <Card className="border-none shadow-premium bg-card/50 backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle>{t('settings.localization.title')}</CardTitle>
                            <CardDescription>{t('settings.localization.desc')}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base">{t('settings.localization.metric')}</Label>
                                    <p className="text-sm text-muted-foreground font-light">{t('settings.localization.metric_desc')}</p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                            <Separator className="bg-primary/5" />
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base">{t('settings.localization.public')}</Label>
                                    <p className="text-sm text-muted-foreground font-light">{t('settings.localization.public_desc')}</p>
                                </div>
                                <Switch />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="notifications" className="py-6">
                    <Card className="border-none shadow-premium bg-card/50 backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle>{t('settings.notifications.title')}</CardTitle>
                            <CardDescription>{t('settings.notifications.desc')}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground">{t('settings.notifications.coming_soon')}</p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div >
    );
};
