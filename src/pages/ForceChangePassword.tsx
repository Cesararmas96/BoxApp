import React, { useState } from 'react';
import { Key, Lock, ShieldCheck, Loader2 } from 'lucide-react';
import { useLanguage, useNotification } from '@/hooks';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabaseClient';

export const ForceChangePassword: React.FC = () => {
    const { t } = useLanguage();
    const { user, updateUser, signOut } = useAuth();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { showNotification } = useNotification();

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password.length < 6) {
            setError(t('auth.password_too_short'));
            return;
        }

        if (password !== confirmPassword) {
            setError(t('auth.password_mismatch'));
            return;
        }

        setLoading(true);

        try {
            // 1. Update Auth password
            const { error: authError } = await updateUser({ password });
            if (authError) throw authError;

            // 2. Update Profile to disable force_password_change
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ force_password_change: false })
                .eq('id', user?.id || '');

            if (profileError) throw profileError;

            showNotification('success', t('auth.password_success_redirect'));

            // Reload page after a short delay to reflect changes in App.tsx
            setTimeout(() => {
                window.location.reload();
            }, 2000);

        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#050508] p-4 relative overflow-hidden font-inter">
            {/* Animated background elements */}
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />

            <div className="relative z-10 w-full max-w-[500px] glass rounded-[2.5rem] overflow-hidden shadow-2xl border-white/5 p-8 lg:p-12 animate-premium-in">
                <div className="text-center mb-10">
                    <div className="inline-flex p-4 bg-primary/10 rounded-2xl mb-6">
                        <Key className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="text-3xl font-black italic tracking-tighter text-white uppercase leading-tight mb-2">
                        {t('auth.security_policy')}
                    </h2>
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em]">
                        {t('auth.force_change_subtitle')}
                    </p>
                </div>

                <form onSubmit={handleUpdatePassword} className="space-y-6">
                    {error && (
                        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl animate-shake">
                            <p className="text-destructive text-[10px] font-black uppercase tracking-widest text-center">
                                {error}
                            </p>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">
                            {t('auth.new_password_force')}
                        </Label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 transition-colors group-focus-within:text-primary" />
                            <Input
                                type="password"
                                placeholder="••••••••"
                                className="bg-zinc-950/50 border-white/5 pl-12 h-14 rounded-xl focus:border-primary/50 focus:ring-primary/20 transition-all text-white font-mono italic"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">
                            {t('auth.confirm_password_force')}
                        </Label>
                        <div className="relative group">
                            <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 transition-colors group-focus-within:text-primary" />
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

                    <Button
                        type="submit"
                        variant="premium"
                        className="w-full h-14 uppercase italic font-black tracking-widest"
                        disabled={loading}
                    >
                        {loading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            t('auth.update_credentials')
                        )}
                    </Button>

                    <Button
                        type="button"
                        variant="ghost"
                        className="w-full text-zinc-600 hover:text-white text-[10px] font-black uppercase tracking-[0.2em] mt-2 h-10"
                        onClick={() => signOut()}
                    >
                        {t('auth.logout_cancel')}
                    </Button>
                </form>
            </div>

        </div>
    );
};
