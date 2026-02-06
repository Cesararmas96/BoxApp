import React, { useState } from 'react';
import { Dumbbell, Loader2, Mail, Lock, UserPlus, ArrowLeft, Zap, Info, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLanguage, useNotification } from '@/hooks';
import { Toast } from '@/components/ui/toast-custom';
import { useAuth } from '@/contexts/AuthContext';

interface SignUpProps {
    onBackToLogin: () => void;
}

export const SignUp: React.FC<SignUpProps> = ({ onBackToLogin }) => {
    const { t } = useLanguage();
    const { signUp } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const { notification, showNotification, hideNotification } = useNotification();

    const validateForm = () => {
        if (!email.includes('@')) {
            setError(t('auth.email_invalid'));
            return false;
        }
        if (password.length < 6) {
            setError(t('auth.password_too_short'));
            return false;
        }
        if (!firstName || !lastName) {
            setError(t('auth.error_generic'));
            return false;
        }
        return true;
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!validateForm()) return;

        setLoading(true);
        try {
            const { data, error: authError } = await signUp({
                email,
                password,
                options: {
                    data: {
                        first_name: firstName,
                        last_name: lastName,
                    }
                }
            });

            if (authError) {
                setError(authError.message);
            } else if (data?.user) {
                setSuccess(true);
                showNotification('success', t('auth.verification_sent'));
            }
        } catch (err: any) {
            setError(err.message || t('auth.error_generic'));
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-[#050508] p-4 relative overflow-hidden font-inter">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-50" />
                <div className="relative z-10 glass p-10 rounded-[2rem] max-w-md w-full text-center border-white/5 animate-premium-in">
                    <div className="inline-flex p-4 bg-emerald-500/10 rounded-full mb-6">
                        <UserPlus className="h-8 w-8 text-emerald-500" />
                    </div>
                    <h2 className="text-3xl font-black italic tracking-tighter text-white uppercase mb-4">{t('auth.verification_sent')}</h2>
                    <p className="text-zinc-400 font-medium leading-relaxed mb-8">
                        {t('auth.initialize_data')}
                    </p>
                    <Button variant="premium" className="w-full h-12" onClick={onBackToLogin}>
                        {t('auth.back_to_id')}
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#050508] p-4 lg:p-0 relative overflow-hidden font-inter">
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full animate-pulse" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-indigo-500/10 blur-[100px] rounded-full animate-bounce duration-[10s]" />

            <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
                style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

            <div className="relative z-10 w-full max-w-[1100px] grid lg:grid-cols-2 gap-0 glass rounded-[2rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] border-white/5 animate-premium-in">
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
                                {t('auth.new_recruitment')} <br />
                                <span className="text-primary">{t('auth.establish_connection')}</span>
                            </h2>
                            <p className="text-zinc-400 text-lg max-w-sm font-medium leading-relaxed">
                                {t('auth.identify_profile')}
                            </p>
                        </div>
                    </div>

                    <div className="relative z-20">
                        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-500">Security: Tier 4 Active</span>
                            </div>
                            <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest leading-relaxed">
                                Encrypted data transmission protocols enabled for all new athlete recruitment sequences.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-8 lg:p-16 flex flex-col justify-center bg-card/10 backdrop-blur-xl">
                    <div className="flex items-center justify-between mb-8">
                        <button onClick={onBackToLogin} className="group flex items-center gap-2 text-zinc-500 hover:text-white transition-colors">
                            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                            <span className="text-[10px] font-black uppercase tracking-widest">{t('auth.back_to_id')}</span>
                        </button>
                        <div className="lg:hidden p-2 bg-primary rounded-lg text-white">
                            <Dumbbell className="h-5 w-5" />
                        </div>
                    </div>

                    <div className="space-y-2 mb-10">
                        <h3 className="text-3xl font-black italic tracking-tighter text-white uppercase">{t('auth.register')}</h3>
                        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">Deployment Sequence: Athlete Recruitment</p>
                    </div>

                    <form onSubmit={handleSignUp} className="space-y-5">
                        {error && (
                            <Alert variant="destructive" className="glass border-destructive/20 py-3 animate-in fade-in zoom-in duration-300">
                                <Info className="h-4 w-4" />
                                <AlertDescription className="text-xs font-bold uppercase tracking-wider">{error}</AlertDescription>
                            </Alert>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">{t('auth.first_name')}</Label>
                                <Input
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    placeholder="John"
                                    className="bg-zinc-950/50 border-white/5 h-12 rounded-xl focus:border-primary/50 text-white font-medium italic"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">{t('auth.last_name')}</Label>
                                <Input
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    placeholder="Doe"
                                    className="bg-zinc-950/50 border-white/5 h-12 rounded-xl focus:border-primary/50 text-white font-medium italic"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">{t('auth.email')}</Label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 group-focus-within:text-primary transition-colors" />
                                <Input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="athlete@system.com"
                                    className="bg-zinc-950/50 border-white/5 pl-12 h-14 rounded-xl focus:border-primary/50 text-white font-medium italic"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">{t('auth.password')}</Label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 group-focus-within:text-primary transition-colors" />
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="bg-zinc-950/50 border-white/5 pl-12 pr-12 h-14 rounded-xl focus:border-primary/50 text-white font-mono italic"
                                    required
                                    minLength={6}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            variant="premium"
                            className="w-full h-14 group mt-4"
                            disabled={loading}
                        >
                            {loading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <>
                                    <span>{t('auth.establish_connection')}</span>
                                    <Zap className="ml-2 h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary" />
                                </>
                            )}
                        </Button>
                    </form>

                    <p className="mt-8 text-center text-[10px] text-zinc-600 font-black uppercase tracking-widest">
                        By deploying you agree to the <span className="text-zinc-400 cursor-pointer">Protocol Terms</span>
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


