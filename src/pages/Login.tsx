import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    login_background_url: string | null;
    theme_config: any;
}

export const Login: React.FC = () => {
    const { t } = useLanguage();
    const { boxSlug } = useParams<{ boxSlug?: string }>();
    const { signIn, signInWithGoogle, signUp, resetPassword } = useAuth();
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
    const [googleLoading, setGoogleLoading] = useState(false);
    const { notification, showNotification, hideNotification } = useNotification();

    // Box branding from admin settings
    const [branding, setBranding] = useState<BoxBranding | null>(null);
    const [bgLoaded, setBgLoaded] = useState(false);
    const [boxNotFound, setBoxNotFound] = useState(false);

    // Fetch box branding — by slug if present, otherwise first box (backward compat)
    useEffect(() => {
        const fetchBranding = async () => {
            try {
                let query = supabase
                    .from('boxes')
                    .select('id, name, slug, logo_url, login_background_url, theme_config');

                if (boxSlug) {
                    query = query.eq('slug', boxSlug);
                } else {
                    query = query.limit(1);
                }

                const { data, error: fetchErr } = await query.single();

                if (fetchErr || !data) {
                    if (boxSlug) setBoxNotFound(true);
                    return;
                }

                setBranding(data as BoxBranding);
            } catch {
                // Silently ignore — use defaults
            }
        };
        fetchBranding();
    }, [boxSlug]);

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
                ? await signUp({
                    email,
                    password,
                    options: {
                        data: {
                            box_id: branding?.id,
                            box_slug: branding?.slug,
                        }
                    }
                })
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

    const handleGoogleSignIn = async () => {
        setError(null);
        setGoogleLoading(true);
        const { error } = await signInWithGoogle();
        if (error) {
            setError(error.message);
            setGoogleLoading(false);
        }
        // If no error, page will redirect — no need to reset loading
    };

    const showSocialLogin = !isResetting && !isForcedReset;

    const getSubmitLabel = () => {
        if (isForcedReset) return t('auth.update_credentials');
        if (isResetting) return t('auth.initiate_recovery');
        if (isSignUp) return t('auth.confirm_deployment');
        return t('auth.login');
    };

    // Show "Box not found" if slug was provided but doesn't match any box
    if (boxNotFound) {
        return (
            <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center bg-[#050508] px-4">
                <div className="text-center max-w-sm">
                    <div className="h-20 w-20 rounded-[1.75rem] bg-white/10 backdrop-blur-2xl flex items-center justify-center mx-auto mb-6 ring-1 ring-white/10">
                        <span className="text-3xl">🏋️</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">{t('auth.box_not_found')}</h1>
                    <p className="text-white/50 text-sm mb-6">{t('auth.box_not_found_desc')}</p>
                    <a
                        href="/login"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white text-black font-semibold text-sm hover:bg-white/90 transition-all"
                    >
                        {t('auth.go_to_login')}
                        <ChevronRight className="h-4 w-4" />
                    </a>
                </div>
            </div>
        );
    }

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

                        {/* Title section */}
                        <div className="px-7 pt-8 pb-2 sm:px-9 sm:pt-10 text-center">
                            <h3 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">
                                {getTitle()}
                            </h3>
                            <p className="text-white/40 text-[13px] mt-1.5 font-medium">
                                {getSubtitle()}
                            </p>
                        </div>

                        {/* Google OAuth button + divider (only on login/signup) */}
                        {showSocialLogin && (
                            <div className="px-7 pt-5 sm:px-9 space-y-5">
                                <button
                                    type="button"
                                    onClick={handleGoogleSignIn}
                                    disabled={googleLoading || loading}
                                    className="w-full h-[52px] rounded-2xl bg-white/[0.06] border border-white/[0.10] text-white font-medium text-[15px] flex items-center justify-center gap-3 hover:bg-white/[0.12] active:scale-[0.98] transition-all duration-200 disabled:opacity-50"
                                >
                                    {googleLoading ? (
                                        <Loader2 className="h-5 w-5 animate-spin text-white/60" />
                                    ) : (
                                        <>
                                            <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                            </svg>
                                            {t('auth.continue_with_google')}
                                        </>
                                    )}
                                </button>

                                {/* "or" divider */}
                                <div className="flex items-center gap-4">
                                    <div className="flex-1 h-px bg-white/[0.08]" />
                                    <span className="text-white/25 text-[11px] font-medium uppercase tracking-widest">{t('auth.or_divider')}</span>
                                    <div className="flex-1 h-px bg-white/[0.08]" />
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleAuth} className="px-7 pb-7 pt-3 sm:px-9 sm:pb-9 space-y-5">
                            {error && (
                                <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 py-3 animate-in fade-in zoom-in duration-300 rounded-2xl">
                                    <Info className="h-4 w-4 text-red-400" />
                                    <AlertDescription className="text-xs font-semibold text-red-300">{error}</AlertDescription>
                                </Alert>
                            )}

                            {/* Email field */}
                            {!isForcedReset && (
                                <div className="space-y-2.5">
                                    <Label htmlFor="email" className="text-[11px] font-semibold uppercase tracking-wider text-white/40 ml-1">{t('auth.email')}</Label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-white/30 transition-colors group-focus-within:text-white/70" />
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder={t('auth.email_placeholder')}
                                            className="bg-white/[0.06] border-white/[0.08] pl-12 h-[52px] rounded-2xl text-white placeholder:text-white/25 focus:border-white/20 focus:ring-1 focus:ring-white/10 transition-all text-[15px] font-medium"
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
                                <div className="space-y-5">
                                    <div className="space-y-2.5">
                                        <Label className="text-[11px] font-semibold uppercase tracking-wider text-white/40 ml-1">{t('auth.new_password_force')}</Label>
                                        <div className="relative group">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-white/30 transition-colors group-focus-within:text-white/70" />
                                            <Input
                                                type="password"
                                                placeholder="••••••••"
                                                className="bg-white/[0.06] border-white/[0.08] pl-12 h-[52px] rounded-2xl text-white placeholder:text-white/25 focus:border-white/20 focus:ring-1 focus:ring-white/10 transition-all font-mono text-[15px]"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2.5">
                                        <Label className="text-[11px] font-semibold uppercase tracking-wider text-white/40 ml-1">{t('auth.confirm_password_force')}</Label>
                                        <div className="relative group">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-white/30 transition-colors group-focus-within:text-white/70" />
                                            <Input
                                                type="password"
                                                placeholder="••••••••"
                                                className="bg-white/[0.06] border-white/[0.08] pl-12 h-[52px] rounded-2xl text-white placeholder:text-white/25 focus:border-white/20 focus:ring-1 focus:ring-white/10 transition-all font-mono text-[15px]"
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
                                <div className="space-y-2.5">
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
                                            className="bg-white/[0.06] border-white/[0.08] pl-12 pr-12 h-[52px] rounded-2xl text-white placeholder:text-white/25 focus:border-white/20 focus:ring-1 focus:ring-white/10 transition-all font-mono text-[15px]"
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
                                className="w-full h-[52px] rounded-2xl bg-white text-black font-semibold text-[15px] shadow-lg hover:bg-white/90 active:scale-[0.98] transition-all duration-200 group mt-1"
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
                        <div className="px-7 pb-7 sm:px-9 sm:pb-9 -mt-2">
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
