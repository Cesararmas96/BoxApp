import React, { useState } from 'react';
import {
    Image as ImageIcon,
    Save,
    Bell,
    Smartphone
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
import { supabase } from '@/lib/supabaseClient';

export const Settings: React.FC = () => {
    const [boxName, setBoxName] = useState('Box Manager');
    const [primaryColor, setPrimaryColor] = useState('#FF3B30');
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
        const { error } = await supabase.auth.updateUser({
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
                    <Card>
                        <CardHeader>
                            <CardTitle>Branding & Theme</CardTitle>
                            <CardDescription>Customize the look and feel of the athlete dashboard.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label>Primary Brand Color</Label>
                                <div className="flex gap-4 items-center">
                                    <div
                                        className="w-12 h-12 rounded-lg border-4 border-white shadow-xl"
                                        style={{ backgroundColor: primaryColor }}
                                    ></div>
                                    <Input
                                        type="text"
                                        value={primaryColor}
                                        onChange={(e) => setPrimaryColor(e.target.value)}
                                        className="w-40"
                                    />
                                </div>
                            </div>
                            <Separator />
                            <div className="space-y-2">
                                <Label>Box Logo</Label>
                                <div className="flex items-center gap-6">
                                    <div className="h-24 w-24 rounded-xl bg-muted flex items-center justify-center border-2 border-dashed border-muted-foreground/30">
                                        <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                                    </div>
                                    <Button variant="outline">Upload New Logo</Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
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
