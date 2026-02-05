import React, { useState } from 'react';
import {
    Image as ImageIcon,
    Save,
    Sun,
    Moon,
    Monitor,
    RefreshCcw,
    Zap,
    Feather,
    Square
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

export const Settings: React.FC = () => {
    const { updateUser } = useAuth();
    const {
        theme, setTheme,
        primaryColor, setPrimaryColor,
        radius, setRadius,
        designStyle, setDesignStyle,
        resetTheme
    } = useTheme();

    const [boxName, setBoxName] = useState('Box Manager');
    const [passwords, setPasswords] = useState({ new: '', confirm: '' });
    const [isChangingPass, setIsChangingPass] = useState(false);
    const [passError, setPassError] = useState<string | null>(null);
    const [passSuccess, setPassSuccess] = useState(false);

    const handlePasswordChange = async () => {
        setPassError(null);
        setPassSuccess(false);

        if (passwords.new.length < 6) {
            setPassError("Password must be at least 6 characters.");
            return;
        }

        if (passwords.new !== passwords.confirm) {
            setPassError("Passwords do not match.");
            return;
        }

        setIsChangingPass(true);
        const { error } = await updateUser({
            password: passwords.new
        });

        if (error) {
            setPassError(error.message);
        } else {
            setPassSuccess(true);
            setPasswords({ new: '', confirm: '' });
        }
        setIsChangingPass(false);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground text-sm">Manage your box identity, appearance and security.</p>
            </div>

            <Tabs defaultValue="general" className="w-full">
                <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent space-x-6">
                    <TabsTrigger value="general" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2">General</TabsTrigger>
                    <TabsTrigger value="appearance" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2">Appearance</TabsTrigger>
                    <TabsTrigger value="notifications" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2">Notifications</TabsTrigger>
                    <TabsTrigger value="security" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2">Security</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="py-6">
                    <div className="grid gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Box Identity</CardTitle>
                                <CardDescription>This information will be visible to all members.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="box-name">Box Name</Label>
                                    <Input
                                        id="box-name"
                                        value={boxName}
                                        onChange={(e) => setBoxName(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="box-email">Official Email</Label>
                                    <Input id="box-email" placeholder="contact@crossfitbox.com" />
                                </div>
                            </CardContent>
                            <CardFooter className="border-t bg-muted/20 py-4">
                                <Button className="ml-auto gap-2">
                                    <Save className="h-4 w-4" /> Save Changes
                                </Button>
                            </CardFooter>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Localization</CardTitle>
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
                                <Separator />
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Public Profile</Label>
                                        <p className="text-sm text-muted-foreground font-light">Allow non-members to see basic box info.</p>
                                    </div>
                                    <Switch />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="appearance" className="py-6">
                    <div className="grid gap-6">
                        <Card className="overflow-hidden border-none shadow-2xl bg-gradient-to-br from-card to-muted/30">
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

                        <Card className="overflow-hidden border-none shadow-2xl bg-gradient-to-br from-card to-muted/30">
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

                        <Card className="overflow-hidden border-none shadow-2xl bg-gradient-to-br from-card to-muted/30">
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

                                <div className="space-y-4 pt-4 border-t">
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

                        <Card className="overflow-hidden border-none shadow-2xl bg-gradient-to-br from-card to-muted/30">
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
                                        <Button size="sm" className="pointer-events-none">
                                            Preview Button
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="bg-primary/5 pt-6 pb-6 border-t border-primary/10">
                                <Button
                                    variant="ghost"
                                    className="w-full gap-2 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-300"
                                    onClick={resetTheme}
                                >
                                    <RefreshCcw className="h-4 w-4" /> Reset to Factory Defaults
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="security" className="py-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Account Security</CardTitle>
                            <CardDescription>Update your password and manage security settings.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="new-password">New Password</Label>
                                <Input
                                    id="new-password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={passwords.new}
                                    onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirm-password">Confirm New Password</Label>
                                <Input
                                    id="confirm-password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={passwords.confirm}
                                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="border-t bg-muted/20 py-4 flex flex-col items-stretch gap-4">
                            {passError && (
                                <p className="text-xs font-medium text-destructive">{passError}</p>
                            )}
                            {passSuccess && (
                                <p className="text-xs font-medium text-emerald-500">Password updated successfully!</p>
                            )}
                            <Button
                                className="ml-auto gap-2"
                                disabled={isChangingPass}
                                onClick={handlePasswordChange}
                            >
                                {isChangingPass ? "Updating..." : (
                                    <>
                                        <Save className="h-4 w-4" /> Change Password
                                    </>
                                )}
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};
