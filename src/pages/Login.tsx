import React, { useState } from 'react';
import { Dumbbell, Loader2, Mail, Lock, Info, Zap, Eye, EyeOff } from 'lucide-react';
import { useLanguage, useNotification } from '@/hooks';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Toast } from '@/components/ui/toast-custom';
import { supabase } from '@/lib/supabaseClient';

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
                // Update profile flag
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    await supabase
                        .from('profiles')
                        .update({ force_password_change: false })
                        .eq('id', user.id);
                }

                showNotification('success', t('auth.password_updated_success'));
                setIsForcedReset(false);
                // The Session change should automatically trigger redirect if handled by router
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
                // Check if force_password_change is true
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

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#050508] p-4 lg:p-0 relative overflow-hidden font-inter">
            {/* Animated background elements */}
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full animate-pulse" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-indigo-500/10 blur-[100px] rounded-full animate-bounce duration-[10s]" />

            {/* Grid background */}
            <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
                style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

            <div className="relative z-10 w-full max-w-[1100px] grid lg:grid-cols-2 gap-0 glass rounded-[2rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] border-white/5 animate-premium-in">

                {/* Left Side: Visual/Branding */}
                <div className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden bg-zinc-950">
                    <div className="absolute inset-0 opacity-20 grayscale pointer-events-none">
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent z-10" />
                    </div>

                    <div className="relative z-20">
                        <div className="flex items-center gap-3 mb-12">
                            <div className="p-2.5 bg-primary rounded-xl shadow-[0_0_20px_rgba(255,50,50,0.4)]">
                                <Dumbbell className="h-6 w-6 text-white" />
                            </div>
                            <span className="text-xl font-black italic tracking-tighter text-white uppercase">Box Manager <span className="text-primary italic">OS</span></span>
                        </div>

                        <div className="space-y-6">
                            <h2 className="text-5xl font-black italic tracking-tighter text-white uppercase leading-[0.9]">
                                Push your <br />
                                <span className="text-primary">Limits</span> today.
                            </h2>
                            <p className="text-zinc-400 text-lg max-w-sm font-medium leading-relaxed">
                                Manage your athletes, tracking benchmarks, and scaling your programming with precision.
                            </p>
                        </div>
                    </div>

                    <div className="relative z-20 flex gap-8">
                        <div>
                            <p className="text-2xl font-black text-white italic tracking-tighter">+500</p>
                            <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Active Athletes</p>
                        </div>
                        <div>
                            <p className="text-2xl font-black text-white italic tracking-tighter">99.9%</p>
                            <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Uptime Performance</p>
                        </div>
                    </div>
                </div>

                {/* Right Side: Form */}
                <div className="p-8 lg:p-16 flex flex-col justify-center bg-card/10 backdrop-blur-xl">
                    <div className="lg:hidden flex items-center justify-center gap-3 mb-10">
                        <div className="p-2 bg-primary rounded-lg">
                            <Dumbbell className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-lg font-black italic tracking-tighter text-white uppercase">Box Manager</span>
                    </div>

                    <div className="space-y-2 mb-10">
                        <h3 className="text-3xl font-black italic tracking-tighter text-white uppercase">
                            {isForcedReset ? t('auth.security_policy') : (isResetting ? t('auth.recovery_mode') : (isSignUp ? t('auth.new_recruitment') : t('auth.system_access')))}
                        </h3>
                        <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">
                            {isForcedReset ? t('auth.force_change_subtitle') : (isResetting ? t('auth.identify_profile') : (isSignUp ? t('auth.initialize_data') : t('auth.enter_credentials')))}
                        </p>
                    </div>

                    <form onSubmit={handleAuth} className="space-y-6">
                        {error && (
                            <Alert variant="destructive" className="glass border-destructive/20 py-3 animate-in fade-in zoom-in duration-300">
                                <Info className="h-4 w-4" />
                                <AlertDescription className="text-xs font-bold uppercase tracking-wider">{error}</AlertDescription>
                            </Alert>
                        )}

                        {!isForcedReset && (
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">{t('auth.email')}</Label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 transition-colors group-focus-within:text-primary" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="operator@system.com"
                                        className="bg-zinc-950/50 border-white/5 pl-12 h-14 rounded-xl focus:border-primary/50 focus:ring-primary/20 transition-all text-white font-medium italic"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        {isForcedReset && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">{t('auth.new_password_force')}</Label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 transition-colors group-focus-within:text-primary" />
                                        <Input
                                            type="password"
                                            placeholder="••••••••"
                                            className="bg-zinc-950/50 border-white/5 pl-12 h-14 rounded-xl focus:border-primary/50 focus:ring-primary/20 transition-all text-white font-mono italic"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">{t('auth.confirm_password_force')}</Label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 transition-colors group-focus-within:text-primary" />
                                        <Input
                                            type="password"
                                            placeholder="••••••••"
                                            className="bg-zinc-950/50 border-white/5 pl-12 h-14 rounded-xl focus:border-primary/50 focus:ring-primary/20 transition-all text-white font-mono italic"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {!isResetting && !isForcedReset && (
                            <div className="space-y-2">
                                <div className="flex justify-between items-end ml-1">
                                    <Label htmlFor="pass" className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">{t('auth.password')}</Label>
                                    {!isSignUp && (
                                        <Button
                                            variant="link"
                                            type="button"
                                            className="text-[9px] h-auto p-0 text-zinc-600 font-black uppercase tracking-widest hover:text-primary transition-colors"
                                            onClick={() => setIsResetting(true)}
                                        >
                                            {t('auth.forgot_password')}
                                        </Button>
                                    )}
                                </div>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 transition-colors group-focus-within:text-primary" />
                                    <Input
                                        id="pass"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        className="bg-zinc-950/50 border-white/5 pl-12 pr-12 h-14 rounded-xl focus:border-primary/50 focus:ring-primary/20 transition-all text-white font-mono italic"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-primary transition-colors"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                        )}

                        <Button
                            type="submit"
                            variant="premium"
                            className="w-full h-14 group"
                            disabled={loading}
                        >
                            {loading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <>
                                    <span>
                                        {isForcedReset
                                            ? t('auth.update_credentials')
                                            : (isResetting ? t('auth.initiate_recovery') : (isSignUp ? t('auth.confirm_deployment') : t('auth.establish_connection')))}
                                    </span>
                                    <Zap className="ml-2 h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary" />
                                </>
                            )}
                        </Button>
                    </form>

                    <div className="mt-12 pt-8 border-t border-white/5 flex items-center justify-center gap-2">
                        <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest">
                            {isForcedReset
                                ? t('auth.logout_cancel')
                                : (isResetting ? t('auth.back_to_id') : (isSignUp ? t('auth.existing_operative') : t('auth.new_operative')))}
                        </p>
                        <Button
                            variant="link"
                            className="text-primary font-black uppercase text-[10px] tracking-widest h-auto p-0 hover:scale-105 transition-transform"
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
                                ? t('auth.logout') // Using t('auth.logout') or similar
                                : (isResetting ? t('auth.login') : (isSignUp ? t('auth.login') : t('auth.register')))}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
                <p className="text-[10px] text-zinc-700 font-black uppercase tracking-[0.4em]">
                    Core Engine BoxManager 2.0.26 // All systems nominal
                </p>
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

