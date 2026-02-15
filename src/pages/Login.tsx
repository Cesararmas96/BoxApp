import React, { useState, useEffect } from 'react';
import { Loader2, Mail, Lock, Info, Eye, EyeOff, ChevronRight } from 'lucide-react';
import { useLanguage, useNotification } from '@/hooks';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Toast } from '@/components/ui/toast-custom';
import { supabase } from '@/lib/supabaseClient';

// Default CrossFit box hero image (Unsplash — royalty-free)
const DEFAULT_BG =
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1920&q=80';

interface BoxBranding {
    name: string;
    logo_url: string | null;
    login_background_url: string | null;
    theme_config: any;
}

export const Login: React.FC = () => {
    const { t } = useLanguage();
    const { signIn, signUp, resetPassword } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [isForcedReset, setIsForcedReset] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const { notification, showNotification, hideNotification } = useNotification();

    // Box branding from admin settings
    const [branding, setBranding] = useState<BoxBranding | null>(null);
    const [bgLoaded, setBgLoaded] = useState(false);

    // Fetch first box branding (pre-auth, public query)
    useEffect(() => {
        const fetchBranding = async () => {
            try {
                const { data } = await supabase
                    .from('boxes')
                    .select('name, logo_url, login_background_url, theme_config')
                    .limit(1)
                    .single();
                if (data) setBranding(data as BoxBranding);
            } catch {
                // Silently ignore — use defaults
            }
        };
        fetchBranding();
    }, []);

    // Pre-load background image for smooth transition
    useEffect(() => {
        const src = branding?.login_background_url || DEFAULT_BG;
        const img = new Image();
        img.onload = () => setBgLoaded(true);
        img.src = src;
    }, [branding]);

    const backgroundUrl = branding?.login_background_url || DEFAULT_BG;
    const boxName = branding?.name || 'BoxApp';
    const logoUrl = branding?.logo_url;

    const validateForm = () => {
        if (!email.includes('@')) {
            setError(t('auth.email_invalid'));
            return false;
        }
        if (!isResetting && !isForcedReset && password.length < 6) {
            setError(t('auth.password_too_short'));
            return false;
        }
        if (isForcedReset) {
            if (newPassword.length < 6) {
                setError(t('auth.password_too_short'));
                return false;
            }
            if (newPassword !== confirmPassword) {
                setError(t('auth.password_mismatch'));
                return false;
            }
        }
        return true;
    };

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!validateForm()) return;

        setLoading(true);

        if (isResetting) {
            const { error } = await resetPassword(email);
            if (error) setError(error.message);
            else showNotification('success', t('auth.reset_sent'));
            setIsResetting(false);
        } else if (isForcedReset) {
            const { error: updateError } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (updateError) {
                setError(updateError.message);
            } else {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    await supabase
                        .from('profiles')
                        .update({ force_password_change: false })
                        .eq('id', user.id);
                }

                showNotification('success', t('auth.password_updated_success'));
                setIsForcedReset(false);
                window.location.href = '/dashboard';
            }
        } else {
            const { data, error } = isSignUp
                ? await signUp({ email, password })
                : await signIn({ email, password });

            if (error) {
                setError(error.message);
            } else if (isSignUp) {
                showNotification('success', t('auth.verification_sent'));
            } else if (data?.user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('force_password_change')
                    .eq('id', data.user.id)
                    .single();

                if (profile?.force_password_change) {
                    showNotification('success', t('auth.force_change_msg'));
                    setIsForcedReset(true);
                }
            }
        }
        setLoading(false);
    };

    const getTitle = () => {
        if (isForcedReset) return t('auth.security_policy');
        if (isResetting) return t('auth.recovery_mode');
        if (isSignUp) return t('auth.new_recruitment');
        return t('auth.login_welcome');
    };

    const getSubtitle = () => {
        if (isForcedReset) return t('auth.force_change_subtitle');
        if (isResetting) return t('auth.identify_profile');
        if (isSignUp) return t('auth.initialize_data');
        return t('auth.login_subtitle');
    };

    const getSubmitLabel = () => {
        if (isForcedReset) return t('auth.update_credentials');
        if (isResetting) return t('auth.initiate_recovery');
        if (isSignUp) return t('auth.confirm_deployment');
        return t('auth.login');
    };

    return (
        <div className="min-h-[100dvh] w-full flex flex-col relative overflow-hidden bg-black">
            {/* ── Full-screen background image ── */}
            <div
                className={`absolute inset-0 transition-opacity duration-1000 ${bgLoaded ? 'opacity-100' : 'opacity-0'}`}
            >
                <img
                    src={backgroundUrl}
                    alt=""
                    className="w-full h-full object-cover"
                    aria-hidden="true"
                />
                {/* Gradient overlays for readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/20" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />
            </div>

            {/* ── Content container — centered vertically ── */}
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center safe-area-inset px-4 py-8 sm:px-6">

                {/* ── Centered branding: logo + name + tagline ── */}
                <div className="flex flex-col items-center mb-8 animate-premium-in">
                    {logoUrl ? (
                        <img
                            src={logoUrl}
                            alt={boxName}
                            className="h-20 w-20 sm:h-24 sm:w-24 rounded-[1.75rem] object-contain shadow-[0_8px_40px_rgba(0,0,0,0.4)] ring-1 ring-white/10"
                        />
                    ) : (
                        <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-[1.75rem] bg-white/10 backdrop-blur-2xl flex items-center justify-center shadow-[0_8px_40px_rgba(0,0,0,0.4)] ring-1 ring-white/10">
                            <span className="text-3xl sm:text-4xl font-black text-white">{boxName.charAt(0)}</span>
                        </div>
                    )}
                    <h1 className="mt-5 text-2xl sm:text-3xl font-bold text-white tracking-tight text-center drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">{boxName}</h1>
                    <p className="text-white/70 text-sm mt-1.5 font-medium tracking-wide text-center drop-shadow-[0_1px_6px_rgba(0,0,0,0.5)]">{t('auth.login_tagline')}</p>
                </div>

                {/* ── Form card — glass card, always centered ── */}
                <div className="w-full max-w-[400px] mx-auto">
                    <div className="rounded-3xl bg-white/[0.07] backdrop-blur-2xl border border-white/[0.10] shadow-[0_8px_60px_rgba(0,0,0,0.5)] overflow-hidden animate-premium-in" style={{ animationDelay: '120ms' }}>

                        <div className="px-6 pt-7 pb-1 sm:px-8 sm:pt-8 text-center">
                            <h3 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">
                                {getTitle()}
                            </h3>
                            <p className="text-white/40 text-[13px] mt-1 font-medium">
                                {getSubtitle()}
                            </p>
                        </div>

                        <form onSubmit={handleAuth} className="px-6 pb-6 pt-4 sm:px-8 sm:pb-8 space-y-4">
                            {error && (
                                <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 py-3 animate-in fade-in zoom-in duration-300 rounded-2xl">
                                    <Info className="h-4 w-4 text-red-400" />
                                    <AlertDescription className="text-xs font-semibold text-red-300">{error}</AlertDescription>
                                </Alert>
                            )}

                            {/* Email field */}
                            {!isForcedReset && (
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-[11px] font-semibold uppercase tracking-wider text-white/40 ml-1">{t('auth.email')}</Label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-white/30 transition-colors group-focus-within:text-white/70" />
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder={t('auth.email_placeholder')}
                                            className="bg-white/[0.06] border-white/[0.08] pl-12 h-13 rounded-2xl text-white placeholder:text-white/25 focus:border-white/20 focus:ring-1 focus:ring-white/10 transition-all text-[15px] font-medium"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            autoComplete="email"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Force-reset password fields */}
                            {isForcedReset && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-[11px] font-semibold uppercase tracking-wider text-white/40 ml-1">{t('auth.new_password_force')}</Label>
                                        <div className="relative group">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-white/30 transition-colors group-focus-within:text-white/70" />
                                            <Input
                                                type="password"
                                                placeholder="••••••••"
                                                className="bg-white/[0.06] border-white/[0.08] pl-12 h-13 rounded-2xl text-white placeholder:text-white/25 focus:border-white/20 focus:ring-1 focus:ring-white/10 transition-all font-mono text-[15px]"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[11px] font-semibold uppercase tracking-wider text-white/40 ml-1">{t('auth.confirm_password_force')}</Label>
                                        <div className="relative group">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-white/30 transition-colors group-focus-within:text-white/70" />
                                            <Input
                                                type="password"
                                                placeholder="••••••••"
                                                className="bg-white/[0.06] border-white/[0.08] pl-12 h-13 rounded-2xl text-white placeholder:text-white/25 focus:border-white/20 focus:ring-1 focus:ring-white/10 transition-all font-mono text-[15px]"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Password field */}
                            {!isResetting && !isForcedReset && (
                                <div className="space-y-2">
                                    <div className="flex justify-between items-end ml-1">
                                        <Label htmlFor="pass" className="text-[11px] font-semibold uppercase tracking-wider text-white/40">{t('auth.password')}</Label>
                                        {!isSignUp && (
                                            <button
                                                type="button"
                                                className="text-[11px] font-semibold text-white/40 hover:text-white/70 transition-colors"
                                                onClick={() => setIsResetting(true)}
                                            >
                                                {t('auth.forgot_password')}
                                            </button>
                                        )}
                                    </div>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-white/30 transition-colors group-focus-within:text-white/70" />
                                        <Input
                                            id="pass"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            className="bg-white/[0.06] border-white/[0.08] pl-12 pr-12 h-13 rounded-2xl text-white placeholder:text-white/25 focus:border-white/20 focus:ring-1 focus:ring-white/10 transition-all font-mono text-[15px]"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            autoComplete="current-password"
                                        />
                                        <button
                                            type="button"
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors p-1"
                                            onClick={() => setShowPassword(!showPassword)}
                                            aria-label={showPassword ? t('auth.hide_password') : t('auth.show_password')}
                                        >
                                            {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Submit button */}
                            <Button
                                type="submit"
                                className="w-full h-13 rounded-2xl bg-white text-black font-semibold text-[15px] shadow-lg hover:bg-white/90 active:scale-[0.98] transition-all duration-200 group mt-2"
                                disabled={loading}
                            >
                                {loading ? (
                                    <Loader2 className="h-5 w-5 animate-spin text-black/60" />
                                ) : (
                                    <span className="flex items-center gap-2">
                                        {getSubmitLabel()}
                                        <ChevronRight className="h-4 w-4 opacity-60 group-hover:translate-x-0.5 transition-transform" />
                                    </span>
                                )}
                            </Button>
                        </form>

                        {/* Bottom toggle */}
                        <div className="px-6 pb-6 sm:px-8 sm:pb-8 -mt-1">
                            <div className="flex items-center justify-center gap-1.5">
                                <p className="text-white/30 text-[13px] font-medium">
                                    {isForcedReset
                                        ? t('auth.logout_cancel')
                                        : (isResetting ? t('auth.back_to_id') : (isSignUp ? t('auth.existing_operative') : t('auth.new_operative')))}
                                </p>
                                <button
                                    type="button"
                                    className="text-white text-[13px] font-semibold hover:underline underline-offset-2 transition-colors"
                                    onClick={async () => {
                                        if (isForcedReset) {
                                            await supabase.auth.signOut();
                                            setIsForcedReset(false);
                                        } else if (isResetting) {
                                            setIsResetting(false);
                                        } else {
                                            setIsSignUp(!isSignUp);
                                        }
                                        setError(null);
                                    }}
                                >
                                    {isForcedReset
                                        ? t('auth.logout')
                                        : (isResetting ? t('auth.login') : (isSignUp ? t('auth.login') : t('auth.register')))}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <p className="text-center text-[11px] text-white/15 font-medium mt-5">
                        {t('auth.powered_by')}
                    </p>
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
