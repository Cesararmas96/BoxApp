import React, { useState, useEffect, useRef } from 'react';
import {
    User as UserIcon,
    Save,
    Camera,
    Shield,
    Key,
    UserCircle,
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
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';

export const Profile: React.FC = () => {
    const { userProfile, user, updateUser } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [profile, setProfile] = useState({
        first_name: userProfile?.first_name || '',
        last_name: userProfile?.last_name || '',
        avatar_url: userProfile?.avatar_url || ''
    });

    const [passwords, setPasswords] = useState({ new: '', confirm: '' });
    const [isUpdating, setIsUpdating] = useState(false);
    const [isChangingPass, setIsChangingPass] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        if (userProfile) {
            setProfile({
                first_name: userProfile.first_name || '',
                last_name: userProfile.last_name || '',
                avatar_url: userProfile.avatar_url || ''
            });
        }
    }, [userProfile]);

    const handleProfileUpdate = async () => {
        setError(null);
        setSuccess(null);
        setIsUpdating(true);

        try {
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    first_name: profile.first_name,
                    last_name: profile.last_name,
                    avatar_url: profile.avatar_url
                })
                .eq('id', user?.id);

            if (profileError) throw profileError;

            setSuccess("Profile updated successfully!");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleAvatarFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !user) return;

        // Validations
        if (!file.type.startsWith('image/')) {
            setError('Please upload an image file.');
            return;
        }

        if (file.size > 2 * 1024 * 1024) { // 2MB
            setError('Image must be less than 2MB.');
            return;
        }

        setIsUploadingAvatar(true);
        setError(null);

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}/${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            setProfile(prev => ({ ...prev, avatar_url: publicUrl }));

            // Auto-update profile in database
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', user.id);

            if (updateError) throw updateError;

            setSuccess('Avatar updated successfully!');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    const handlePasswordChange = async () => {
        setError(null);
        setSuccess(null);

        if (passwords.new.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }

        if (passwords.new !== passwords.confirm) {
            setError("Passwords do not match.");
            return;
        }

        setIsChangingPass(true);
        const { error: passErr } = await updateUser({
            password: passwords.new
        });

        if (passErr) {
            setError(passErr.message);
        } else {
            setSuccess("Password updated successfully!");
            setPasswords({ new: '', confirm: '' });
        }
        setIsChangingPass(false);
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-2xl">
                    <UserIcon className="h-8 w-8 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
                    <p className="text-muted-foreground text-sm">Manage your personal information and security.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Profile Overview */}
                <Card className="md:col-span-1 border-none shadow-premium bg-card/50 backdrop-blur-xl h-fit">
                    <CardHeader className="text-center">
                        <div className="mx-auto relative group w-32 h-32 mb-4">
                            {isUploadingAvatar ? (
                                <div className="w-full h-full rounded-3xl bg-primary/5 flex items-center justify-center border-4 border-primary/20">
                                    <Loader2 className="h-10 w-10 text-primary animate-spin" />
                                </div>
                            ) : profile.avatar_url ? (
                                <img
                                    src={profile.avatar_url}
                                    alt="Avatar"
                                    className="w-full h-full rounded-3xl object-cover border-4 border-primary/20"
                                />
                            ) : (
                                <div className="w-full h-full rounded-3xl bg-primary/5 flex items-center justify-center border-4 border-primary/20">
                                    <UserCircle className="h-16 w-16 text-primary/40" />
                                </div>
                            )}
                            <button
                                onClick={handleAvatarClick}
                                disabled={isUploadingAvatar}
                                className="absolute bottom-2 right-2 p-2 bg-primary text-white rounded-xl shadow-lg hover:scale-110 transition-transform active:scale-95 disabled:opacity-50"
                            >
                                <Camera className="h-4 w-4" />
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleAvatarFileChange}
                            />
                        </div>
                        <CardTitle className="text-xl uppercase italic font-black text-primary">
                            {profile.first_name || 'My'} {profile.last_name || 'Profile'}
                        </CardTitle>
                        <CardDescription className="uppercase tracking-widest text-[10px] font-bold">
                            {userProfile?.role_id || 'Member'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="p-3 rounded-xl bg-muted/30 text-center">
                            <span className="text-[10px] font-bold uppercase text-muted-foreground block">Email</span>
                            <span className="text-xs font-mono">{user?.email}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Main Settings */}
                <div className="md:col-span-2 space-y-6">
                    <Card className="border-none shadow-premium bg-card/50 backdrop-blur-xl">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <UserIcon className="h-5 w-5 text-primary" />
                                <CardTitle>Personal Information</CardTitle>
                            </div>
                            <CardDescription>Update your name and profile details.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="first_name">First Name</Label>
                                    <Input
                                        id="first_name"
                                        placeholder="John"
                                        value={profile.first_name}
                                        onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                                        className="rounded-xl h-11"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="last_name">Last Name</Label>
                                    <Input
                                        id="last_name"
                                        placeholder="Doe"
                                        value={profile.last_name}
                                        onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                                        className="rounded-xl h-11"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="avatar_url">Avatar URL</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="avatar_url"
                                        placeholder="https://example.com/photo.jpg"
                                        value={profile.avatar_url}
                                        onChange={(e) => setProfile({ ...profile, avatar_url: e.target.value })}
                                        className="rounded-xl h-11 flex-1"
                                    />
                                    <Button
                                        variant="outline"
                                        className="rounded-xl h-11 flex-shrink-0"
                                        onClick={handleAvatarClick}
                                    >
                                        <Camera className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="border-t border-primary/5 bg-primary/5 p-4">
                            <Button
                                className="ml-auto gap-2 rounded-xl"
                                onClick={handleProfileUpdate}
                                disabled={isUpdating}
                            >
                                <Save className="h-4 w-4" /> {isUpdating ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </CardFooter>
                    </Card>

                    <Card className="border-none shadow-premium bg-card/50 backdrop-blur-xl">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Key className="h-5 w-5 text-primary" />
                                <CardTitle>Security & Password</CardTitle>
                            </div>
                            <CardDescription>Secure your account with a strong password.</CardDescription>
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
                                    className="rounded-xl h-11"
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
                                    className="rounded-xl h-11"
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="border-t border-primary/5 bg-primary/5 p-4 flex flex-col items-stretch gap-4">
                            {(error || success) && (
                                <div className={`p-3 border rounded-xl text-xs text-center ${error ? 'bg-destructive/10 border-destructive/20 text-destructive' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                                    }`}>
                                    {error || success}
                                </div>
                            )}
                            <Button
                                className="ml-auto gap-2 rounded-xl"
                                disabled={isChangingPass}
                                onClick={handlePasswordChange}
                            >
                                <Key className="h-4 w-4" /> {isChangingPass ? "Updating..." : "Update Password"}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
};
