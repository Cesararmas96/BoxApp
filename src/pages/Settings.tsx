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
    Loader2
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

export const Settings: React.FC = () => {
    const {
        theme, setTheme,
        primaryColor, setPrimaryColor,
        radius, setRadius,
        designStyle, setDesignStyle,
        resetTheme
    } = useTheme();

    const { currentBox } = useAuth();

    const logoInputRef = useRef<HTMLInputElement>(null);
    const faviconInputRef = useRef<HTMLInputElement>(null);

    const [boxSettings, setBoxSettings] = useState({
        name: '',
        logo_url: '',
        favicon_url: ''
    });
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState<'logo' | 'favicon' | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        if (currentBox) {
            setBoxSettings({
                name: currentBox.name || '',
                logo_url: currentBox.logo_url || '',
                favicon_url: currentBox.favicon_url || ''
            });
        }
    }, [currentBox]);

    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'favicon') => {
        const file = event.target.files?.[0];
        if (!file || !currentBox?.id) return;

        setIsUploading(type);
        setMessage(null);

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${type}_${Date.now()}.${fileExt}`;
            const filePath = `brand/${currentBox.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('branding')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('branding')
                .getPublicUrl(filePath);

            setBoxSettings(prev => ({
                ...prev,
                [type === 'logo' ? 'logo_url' : 'favicon_url']: publicUrl
            }));

            setMessage({ type: 'success', text: `${type === 'logo' ? 'Logo' : 'Favicon'} uploaded! Don't forget to save changes.` });
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
        try {
            const { error } = await supabase
                .from('boxes')
                .update({
                    name: boxSettings.name,
                    logo_url: boxSettings.logo_url,
                    favicon_url: boxSettings.favicon_url,
                    updated_at: new Date().toISOString()
                })
                .eq('id', currentBox.id);

            if (error) throw error;
            setMessage({ type: 'success', text: 'Branding settings saved successfully!' });
            // Reload page or refresh context to apply changes
            setTimeout(() => window.location.reload(), 1500);
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
            const themeConfig = {
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
            setMessage({ type: 'success', text: 'Appearance settings saved successfully!' });
            // Reload page to refresh context
            setTimeout(() => window.location.reload(), 1500);
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-2xl">
                    <SettingsIcon className="h-8 w-8 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
                    <p className="text-muted-foreground text-sm">Manage box branding, appearance and global configuration.</p>
                </div>
            </div>

            <Tabs defaultValue="branding" className="w-full">
                <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent space-x-6">
                    <TabsTrigger value="branding" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2">Branding</TabsTrigger>
                    <TabsTrigger value="appearance" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2">Appearance</TabsTrigger>
                    <TabsTrigger value="localization" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2">Localization</TabsTrigger>
                    <TabsTrigger value="notifications" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2">Notifications</TabsTrigger>
                </TabsList>

                <TabsContent value="branding" className="py-6">
                    <div className="grid gap-6">
                        <Card className="border-none shadow-premium bg-card/50 backdrop-blur-xl overflow-hidden">
                            <CardHeader className="pb-4">
                                <div className="flex items-center gap-2">
                                    <ImageIcon className="h-5 w-5 text-primary" />
                                    <CardTitle>Global Branding</CardTitle>
                                </div>
                                <CardDescription>Customize how your Box appears to members and the public.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="box-name">Box Name</Label>
                                            <Input
                                                id="box-name"
                                                value={boxSettings.name}
                                                onChange={(e) => setBoxSettings({ ...boxSettings, name: e.target.value })}
                                                className="rounded-xl h-11"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="logo-url">Logo URL</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    id="logo-url"
                                                    placeholder="https://example.com/logo.png"
                                                    value={boxSettings.logo_url}
                                                    onChange={(e) => setBoxSettings({ ...boxSettings, logo_url: e.target.value })}
                                                    className="rounded-xl h-11 flex-1"
                                                />
                                                <Button
                                                    variant="outline"
                                                    className="rounded-xl h-11 flex-shrink-0"
                                                    onClick={() => logoInputRef.current?.click()}
                                                    disabled={isUploading === 'logo'}
                                                >
                                                    {isUploading === 'logo' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                                                </Button>
                                            </div>
                                            <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={(e) => handleUpload(e, 'logo')} />
                                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Recommended: 512x512px Transparent PNG</p>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="favicon-url">Favicon URL</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    id="favicon-url"
                                                    placeholder="https://example.com/favicon.ico"
                                                    value={boxSettings.favicon_url}
                                                    onChange={(e) => setBoxSettings({ ...boxSettings, favicon_url: e.target.value })}
                                                    className="rounded-xl h-11 flex-1"
                                                />
                                                <Button
                                                    variant="outline"
                                                    className="rounded-xl h-11 flex-shrink-0"
                                                    onClick={() => faviconInputRef.current?.click()}
                                                    disabled={isUploading === 'favicon'}
                                                >
                                                    {isUploading === 'favicon' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                                                </Button>
                                            </div>
                                            <input type="file" ref={faviconInputRef} className="hidden" accept="image/*" onChange={(e) => handleUpload(e, 'favicon')} />
                                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Format: .ico or .png (32x32px)</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-primary/10 rounded-3xl bg-primary/5">
                                        <div className="mb-4 text-center">
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 mb-2 block">Live Preview</span>
                                            <div className="bg-card w-48 h-12 rounded-2xl shadow-xl flex items-center px-4 gap-3 border border-white/5 overflow-hidden">
                                                {boxSettings.logo_url ? (
                                                    <img src={boxSettings.logo_url} alt="Preview" className="h-6 w-6 object-contain" />
                                                ) : (
                                                    <div className="h-6 w-6 bg-primary/20 rounded-lg flex items-center justify-center">
                                                        <span className="text-[10px] text-primary font-black italic">B</span>
                                                    </div>
                                                )}
                                                <span className="font-black italic uppercase text-primary text-xs truncate">{boxSettings.name || 'Box Name'}</span>
                                            </div>
                                        </div>
                                        <div className="mt-4 flex gap-2">
                                            {boxSettings.favicon_url && (
                                                <div className="p-2 bg-card rounded-lg border border-white/5 flex items-center gap-2">
                                                    <img src={boxSettings.favicon_url} alt="Favicon" className="h-4 w-4" />
                                                    <span className="text-[8px] font-bold uppercase text-muted-foreground">Favicon.ico</span>
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
                                    {isSaving ? 'Saving Changes...' : 'Sync Branding'}
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="appearance" className="py-6">
                    <div className="grid gap-6">
                        <Card className="overflow-hidden border-none shadow-premium bg-card/50 backdrop-blur-xl">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-2xl">Design Philosophy</CardTitle>
                                <CardDescription>Switch between distinct visual languages for the platform.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {[
                                        {
                                            id: 'cyber',
                                            label: 'Cyber Tech',
                                            description: 'Glows, glassmorphism, and high-tech aesthetics.',
                                            icon: <Zap className="h-6 w-6" />
                                        },
                                        {
                                            id: 'minimal',
                                            label: 'Minimalist',
                                            description: 'Clean, flat, and focused on pure functionality.',
                                            icon: <Feather className="h-6 w-6" />
                                        },
                                        {
                                            id: 'brutalist',
                                            label: 'Brutalist',
                                            description: 'Sharp, industrial, and high-impact design.',
                                            icon: <Square className="h-6 w-6" />
                                        },
                                    ].map((style) => (
                                        <button
                                            key={style.id}
                                            onClick={() => setDesignStyle(style.id as any)}
                                            className={`flex flex-col items-start p-6 rounded-2xl border-2 transition-all duration-500 text-left gap-4 group ${designStyle === style.id
                                                ? 'border-primary bg-primary/5 shadow-premium scale-[1.02]'
                                                : 'border-border hover:border-border/80 hover:bg-muted/50'
                                                }`}
                                        >
                                            <div className={`p-3 rounded-xl transition-all duration-500 ${designStyle === style.id ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-muted text-muted-foreground group-hover:bg-muted-foreground/10'}`}>
                                                {style.icon}
                                            </div>
                                            <div>
                                                <h4 className={`text-sm font-bold uppercase tracking-widest ${designStyle === style.id ? 'text-primary' : 'text-foreground'}`}>
                                                    {style.label}
                                                </h4>
                                                <p className="text-xs text-muted-foreground mt-1 font-medium leading-relaxed">
                                                    {style.description}
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
                                <CardTitle className="text-2xl">Theme Mode</CardTitle>
                                <CardDescription>Select your preferred interface style.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-3 gap-4">
                                    {[
                                        { id: 'light', label: 'Light', icon: <Sun className="h-5 w-5" /> },
                                        { id: 'dark', label: 'Dark', icon: <Moon className="h-5 w-5" /> },
                                        { id: 'system', label: 'System', icon: <Monitor className="h-5 w-5" /> },
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
                                                {item.label}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="overflow-hidden border-none shadow-premium bg-card/50 backdrop-blur-xl">
                            <CardHeader>
                                <CardTitle className="text-2xl">Brand Identity</CardTitle>
                                <CardDescription>Customize the primary color of your Box's ecosystem.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    <Label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Preset Colors</Label>
                                    <div className="flex flex-wrap gap-3">
                                        {[
                                            { name: 'Scarlet', hex: '#FF3B30' },
                                            { name: 'Azure', hex: '#007AFF' },
                                            { name: 'Emerald', hex: '#34C759' },
                                            { name: 'Gold', hex: '#FFD700' },
                                            { name: 'Purple', hex: '#AF52DE' },
                                            { name: 'Orange', hex: '#FF9500' },
                                            { name: 'Pink', hex: '#FF2D55' },
                                            { name: 'Teal', hex: '#5AC8FA' },
                                        ].map((color) => (
                                            <button
                                                key={color.hex}
                                                onClick={() => setPrimaryColor(color.hex)}
                                                className={`w-10 h-10 rounded-full border-4 transition-all duration-300 transform hover:scale-110 ${primaryColor.toLowerCase() === color.hex.toLowerCase()
                                                    ? 'border-white ring-2 ring-primary shadow-lg scale-110'
                                                    : 'border-transparent shadow-sm'
                                                    }`}
                                                style={{ backgroundColor: color.hex }}
                                                title={color.name}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-primary/5">
                                    <Label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Custom Color</Label>
                                    <div className="flex gap-4 items-center">
                                        <div className="relative group">
                                            <div
                                                className="w-14 h-14 rounded-2xl border-4 border-white dark:border-zinc-800 shadow-2xl transition-transform group-hover:scale-105"
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
                                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">This color affects buttons, links, and system accents.</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="overflow-hidden border-none shadow-premium bg-card/50 backdrop-blur-xl">
                            <CardHeader>
                                <CardTitle className="text-2xl">Interface Style</CardTitle>
                                <CardDescription>Fine-tune the geometry and feel of the UI.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <Label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Border Radius</Label>
                                        <span className="text-xs font-mono bg-primary/20 text-primary px-2 py-1 rounded-md">{radius}rem</span>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <span className="text-[10px] font-black uppercase text-muted-foreground italic tracking-tighter">Sharp</span>
                                        <input
                                            type="range"
                                            min="0"
                                            max="1.5"
                                            step="0.05"
                                            value={radius}
                                            onChange={(e) => setRadius(parseFloat(e.target.value))}
                                            className="flex-1 accent-primary h-1.5 bg-muted rounded-full appearance-none cursor-pointer"
                                        />
                                        <span className="text-[10px] font-black uppercase text-muted-foreground italic tracking-tighter">Rounded</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 pt-2">
                                        <div className="p-3 bg-muted/50 rounded-[var(--radius)] border border-border flex items-center justify-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                                            Preview Card
                                        </div>
                                        <Button size="sm" className="pointer-events-none rounded-[var(--radius)]">
                                            Preview Button
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="bg-primary/5 pt-6 pb-6 border-t border-primary/10 flex flex-col gap-4">
                                {message && (
                                    <div className={`p-3 rounded-xl text-xs font-bold text-center border ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-destructive/10 border-destructive/20 text-destructive'
                                        }`}>
                                        {message.text}
                                    </div>
                                )}
                                <div className="flex gap-4">
                                    <Button
                                        variant="ghost"
                                        className="flex-1 gap-2 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-300 rounded-xl"
                                        onClick={resetTheme}
                                    >
                                        <RefreshCcw className="h-4 w-4" /> Reset
                                    </Button>
                                    <Button
                                        className="flex-2 gap-2 rounded-xl"
                                        onClick={handleSaveAppearance}
                                        disabled={isSaving}
                                    >
                                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                        Save Appearance
                                    </Button>
                                </div>
                            </CardFooter>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="localization" className="py-6">
                    <Card className="border-none shadow-premium bg-card/50 backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle>Regional & Localization</CardTitle>
                            <CardDescription>Configure timezones and units of measurement.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Metric System</Label>
                                    <p className="text-sm text-muted-foreground font-light">Use kilograms and centimeters instead of imperial.</p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                            <Separator className="bg-primary/5" />
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Public Profile</Label>
                                    <p className="text-sm text-muted-foreground font-light">Allow non-members to see basic box info.</p>
                                </div>
                                <Switch />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="notifications" className="py-6">
                    <Card className="border-none shadow-premium bg-card/50 backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle>Global Notifications</CardTitle>
                            <CardDescription>Configure system-wide notifications and alerts.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground">Notification settings coming soon...</p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};
