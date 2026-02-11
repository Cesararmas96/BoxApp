import React, { useState, useEffect, useRef } from 'react';
import {
    User as UserIcon,
    Save,
    Camera,
    Shield,
    Key,
    UserCircle,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Zap
} from 'lucide-react';
import { useLanguage, useNotification } from '@/hooks';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Toast } from '@/components/ui/toast-custom';

export const Profile: React.FC = () => {
    const { t } = useLanguage();
    const { userProfile, user, updateUser, refreshProfile } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { notification, showNotification, hideNotification } = useNotification();

    const [profile, setProfile] = useState({
        first_name: userProfile?.first_name || '',
        last_name: userProfile?.last_name || '',
        avatar_url: userProfile?.avatar_url || ''
    });

    const [passwords, setPasswords] = useState({ new: '', confirm: '' });
    const [isUpdating, setIsUpdating] = useState(false);
    const [isChangingPass, setIsChangingPass] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

    // Local UI states
    const [profileError, setProfileError] = useState<string | null>(null);
    const [profileSuccess, setProfileSuccess] = useState(false);
    const [passError, setPassError] = useState<string | null>(null);
    const [passSuccess, setPassSuccess] = useState(false);

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
        setProfileError(null);
        setProfileSuccess(false);
        setIsUpdating(true);

        if (!profile.first_name.trim() || !profile.last_name.trim()) {
            const errorMsg = t('profile.error_required_fields');
            setProfileError(errorMsg);
            showNotification('error', errorMsg);
            setIsUpdating(false);
            return;
        }

        try {
            const { error: errorResult } = await supabase
                .from('profiles')
                .update({
                    first_name: profile.first_name,
                    last_name: profile.last_name,
                    avatar_url: profile.avatar_url
                })
                .eq('id', user?.id || '');

            if (errorResult) throw errorResult;

            setProfileSuccess(true);
            showNotification('success', t('profile.success_profile'));
            setTimeout(() => setProfileSuccess(false), 3000);
        } catch (err: any) {
            setProfileError(err.message);
            showNotification('error', err.message);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const getFileNameFromUrl = (url: string) => {
        if (!url) return '';
        if (url.includes('avatars/')) {
            const parts = url.split('_');
            if (parts.length > 1) {
                return parts.slice(1).join('_');
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

    const handleAvatarFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !user) return;

        // Validations
        if (!file.type.startsWith('image/')) {
            showNotification('error', t('profile.upload_image_error'));
            return;
        }

        setIsUploadingAvatar(true);
        setProfileError(null);

        try {
            // Compress image if it's an image
            const compressedBlob = await compressImage(file);
            const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
            const storageFileName = `${user.id}/${Date.now()}_${cleanFileName}`;
            const filePath = `${storageFileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, compressedBlob, {
                    contentType: 'image/jpeg',
                    upsert: true
                });

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

            // Clean up old avatar if it exists
            const oldAvatarUrl = userProfile?.avatar_url;
            if (oldAvatarUrl && oldAvatarUrl.includes('avatars/')) {
                try {
                    const oldPath = oldAvatarUrl.split('avatars/').pop();
                    if (oldPath) {
                        await supabase.storage.from('avatars').remove([oldPath]);
                    }
                } catch (cleanupErr) {
                    console.warn('Failed to clean up old avatar:', cleanupErr);
                }
            }

            await refreshProfile();
            showNotification('success', t('profile.success_profile'));
        } catch (err: any) {
            setProfileError(err.message);
            showNotification('error', err.message);
        } finally {
            setIsUploadingAvatar(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handlePasswordChange = async () => {
        setPassError(null);
        setPassSuccess(false);

        if (passwords.new.length < 6) {
            setPassError(t('auth.password_too_short'));
            return;
        }

        if (passwords.new !== passwords.confirm) {
            setPassError(t('auth.password_mismatch'));
            return;
        }

        setIsChangingPass(true);
        try {
            const { error: errorResult } = await updateUser({
                password: passwords.new
            });

            if (errorResult) throw errorResult;

            setPassSuccess(true);
            showNotification('success', t('profile.success_password'));
            setPasswords({ new: '', confirm: '' });
            setTimeout(() => setPassSuccess(false), 3000);
        } catch (err: any) {
            setPassError(err.message);
            showNotification('error', err.message);
        } finally {
            setIsChangingPass(false);
        }
    };

    return (
        <div className="space-y-8 max-w-5xl mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20">
                        <UserIcon className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black italic tracking-tighter text-foreground uppercase">{t('profile.title')}</h1>
                        <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest">{t('profile.subtitle')}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Profile Card */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="border-none shadow-2xl bg-card/50 backdrop-blur-xl overflow-hidden ring-1 ring-border">
                        <div className="h-24 bg-gradient-to-r from-primary/20 to-primary/5" />
                        <CardHeader className="text-center -mt-12 relative pb-8">
                            <div className="mx-auto relative group w-32 h-32 mb-4">
                                {isUploadingAvatar ? (
                                    <div className="w-full h-full rounded-full bg-muted flex items-center justify-center border-4 border-card ring-2 ring-primary/20 animate-pulse">
                                        <Loader2 className="h-10 w-10 text-primary animate-spin" />
                                    </div>
                                ) : profile.avatar_url && (profile.avatar_url.startsWith('http') || profile.avatar_url.startsWith('/')) ? (
                                    <img
                                        src={profile.avatar_url}
                                        alt={t('profile.avatar')}
                                        className="w-full h-full rounded-full object-cover border-4 border-card ring-2 ring-primary/20 group-hover:ring-primary/50 transition-all duration-300"
                                    />
                                ) : (
                                    <div className="w-full h-full rounded-full bg-muted flex items-center justify-center border-4 border-card ring-2 ring-primary/10 group-hover:ring-primary/30 transition-all duration-300">
                                        <UserCircle className="h-16 w-16 text-muted-foreground/30" />
                                    </div>
                                )}
                                <button
                                    onClick={handleAvatarClick}
                                    disabled={isUploadingAvatar}
                                    className="absolute bottom-1 right-1 p-2.5 bg-primary text-white rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all disabled:opacity-50 ring-4 border-4 border-card"
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
                            <CardTitle className="text-2xl font-black italic tracking-tighter text-foreground uppercase">
                                {profile.first_name} {profile.last_name}
                            </CardTitle>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mt-2">
                                <Shield className="h-3 w-3 text-primary" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                                    {userProfile?.role_id ? t(`roles.role_${userProfile.role_id.toLowerCase()}`) : t('roles.role_athlete')}
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent className="px-6 pb-8">
                            <div className="p-4 rounded-xl bg-muted/50 border border-border/50 text-center">
                                <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest block mb-1">{t('auth.email')}</span>
                                <span className="text-sm font-medium text-foreground italic">{user?.email}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Form Sections */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Personal Information */}
                    <Card className="border-none shadow-2xl bg-card/50 backdrop-blur-xl ring-1 ring-border overflow-hidden">
                        <CardHeader className="border-b border-border/50 bg-muted/20">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <UserIcon className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-black italic tracking-tight text-foreground uppercase leading-none">{t('profile.personal_info')}</CardTitle>
                                    <CardDescription className="text-muted-foreground text-xs font-bold uppercase tracking-wider mt-1">{t('profile.personal_info_desc')}</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-1 ml-1">
                                        <Label htmlFor="first_name" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{t('profile.first_name')}</Label>
                                        <div className="w-1 h-1 rounded-full bg-destructive" />
                                    </div>
                                    <Input
                                        id="first_name"
                                        placeholder={t('profile.first_name_placeholder')}
                                        value={profile.first_name}
                                        onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                                        className="bg-muted/50 border-border/50 h-12 rounded-xl focus:border-primary/50 focus:ring-primary/20 transition-all text-foreground font-medium italic"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-1 ml-1">
                                        <Label htmlFor="last_name" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{t('profile.last_name')}</Label>
                                        <div className="w-1 h-1 rounded-full bg-destructive" />
                                    </div>
                                    <Input
                                        id="last_name"
                                        placeholder={t('profile.last_name_placeholder')}
                                        value={profile.last_name}
                                        onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                                        className="bg-muted/50 border-border/50 h-12 rounded-xl focus:border-primary/50 focus:ring-primary/20 transition-all text-foreground font-medium italic"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="avatar_url" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">{t('profile.avatar_url')}</Label>
                                <div className="flex gap-3">
                                    <Input
                                        id="avatar_url"
                                        placeholder={t('profile.avatar_url_placeholder')}
                                        value={getFileNameFromUrl(profile.avatar_url)}
                                        onChange={(e) => setProfile({ ...profile, avatar_url: e.target.value })}
                                        className="bg-muted/50 border-border/50 h-12 rounded-xl focus:border-primary/50 focus:ring-primary/20 transition-all text-foreground font-medium italic flex-1"
                                    />
                                    <Button
                                        variant="outline"
                                        className="h-12 px-4 rounded-xl border-border/50 bg-muted/50 hover:bg-muted gap-2"
                                        onClick={handleAvatarClick}
                                    >
                                        <Camera className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-xs font-bold uppercase tracking-widest">{t('profile.upload_photo')}</span>
                                    </Button>
                                </div>
                            </div>

                            {profileError && (
                                <Alert variant="destructive" className="glass border-destructive/20 py-3">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription className="text-xs font-bold uppercase tracking-wider">{profileError}</AlertDescription>
                                </Alert>
                            )}
                        </CardContent>
                        <CardFooter className="border-t border-border/50 bg-muted/10 p-6 flex justify-end">
                            <Button
                                className="h-12 px-8 rounded-xl group gap-2"
                                variant="premium"
                                onClick={handleProfileUpdate}
                                disabled={isUpdating}
                            >
                                {isUpdating ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : profileSuccess ? (
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                ) : (
                                    <Save className="h-4 w-4" />
                                )}
                                <span className="font-bold uppercase tracking-widest text-xs">
                                    {isUpdating ? t('profile.saving') : t('profile.save_changes')}
                                </span>
                            </Button>
                        </CardFooter>
                    </Card>

                    {/* Security & Password */}
                    <Card className="border-none shadow-2xl bg-card/50 backdrop-blur-xl ring-1 ring-border overflow-hidden">
                        <CardHeader className="border-b border-border/50 bg-muted/20">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <Key className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-black italic tracking-tight text-foreground uppercase leading-none">{t('profile.security')}</CardTitle>
                                    <CardDescription className="text-muted-foreground text-xs font-bold uppercase tracking-wider mt-1">{t('profile.security_desc')}</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="new-password" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">{t('profile.new_password')}</Label>
                                    <Input
                                        id="new-password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={passwords.new}
                                        onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                                        className="bg-muted/50 border-border/50 h-12 rounded-xl focus:border-primary/50 focus:ring-primary/20 transition-all text-foreground font-mono italic"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirm-password" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">{t('profile.confirm_password')}</Label>
                                    <Input
                                        id="confirm-password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={passwords.confirm}
                                        onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                                        className="bg-muted/50 border-border/50 h-12 rounded-xl focus:border-primary/50 focus:ring-primary/20 transition-all text-foreground font-mono italic"
                                    />
                                </div>
                            </div>

                            {passError && (
                                <Alert variant="destructive" className="glass border-destructive/20 py-3">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription className="text-xs font-bold uppercase tracking-wider">{passError}</AlertDescription>
                                </Alert>
                            )}
                        </CardContent>
                        <CardFooter className="border-t border-border/50 bg-muted/10 p-6 flex justify-end">
                            <Button
                                className="h-12 px-8 rounded-xl group gap-2"
                                variant="premium"
                                disabled={isChangingPass}
                                onClick={handlePasswordChange}
                            >
                                {isChangingPass ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : passSuccess ? (
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                ) : (
                                    <Zap className="h-4 w-4" />
                                )}
                                <span className="font-bold uppercase tracking-widest text-xs">
                                    {isChangingPass ? t('profile.updating') : t('profile.update_password')}
                                </span>
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>

            {notification && (
                <Toast
                    type={notification.type}
                    message={notification.message}
                    onClose={hideNotification}
                />
            )}
        </div>
    );
};
