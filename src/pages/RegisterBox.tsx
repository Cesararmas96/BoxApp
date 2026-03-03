import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { buildTenantUrl } from '@/utils/tenant';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Check,
    Loader2,
    Building2,
    ChevronRight,
    ArrowLeft,
    Mail,
    Lock,
    Info,
    Globe,
    CheckCircle2
} from 'lucide-react';

type Step = 1 | 2;

const COUNTRIES = [
    "Venezuela", "Colombia", "España", "Estados Unidos", "México",
    "Argentina", "Chile", "Perú", "Ecuador", "Panamá"
];

const Step1: React.FC<{
    boxName: string;
    onBoxNameChange: (val: string) => void;
    slug: string;
    onSlugChange: (val: string) => void;
    slugError: string | null;
    slugChecking: boolean;
    slugAvailable: boolean | null;
    country: string;
    onCountryChange: (val: string) => void;
    onNext: () => void;
}> = ({
    boxName, onBoxNameChange,
    slug, onSlugChange,
    slugError, slugChecking, slugAvailable,
    country, onCountryChange,
    onNext
}) => (
        <div className="space-y-6 animate-premium-in">
            <div className="space-y-2.5">
                <Label htmlFor="boxName" className="text-[11px] font-semibold uppercase tracking-wider text-white/40 ml-1">Nombre de tu Box</Label>
                <div className="relative group">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-white/30 group-focus-within:text-white/70 transition-colors" />
                    <Input
                        id="boxName"
                        placeholder="Ej: CrossFit Arena"
                        className="bg-white/[0.06] border-white/[0.08] pl-12 h-[52px] rounded-2xl text-white placeholder:text-white/25 focus:border-white/20 focus:ring-1 focus:ring-white/10 transition-all text-[15px] font-medium"
                        value={boxName}
                        onChange={(e) => onBoxNameChange(e.target.value)}
                        required
                    />
                </div>
            </div>

            <div className="space-y-2.5">
                <Label htmlFor="slug" className="text-[11px] font-semibold uppercase tracking-wider text-white/40 ml-1">URL de tu Plataforma</Label>
                <div className="relative group">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-white/30 group-focus-within:text-white/70 transition-colors" />
                    <Input
                        id="slug"
                        placeholder="nombre-de-tu-box"
                        className={`bg-white/[0.06] border-white/[0.08] pl-12 pr-12 h-[52px] rounded-2xl text-white focus:border-white/20 focus:ring-1 focus:ring-white/10 transition-all text-[15px] font-mono ${slugError ? 'border-red-500/30' : ''}`}
                        value={slug}
                        onChange={(e) => onSlugChange(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                        required
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        {slugChecking ? (
                            <Loader2 className="h-4 w-4 animate-spin text-white/30" />
                        ) : slugAvailable === true ? (
                            <Check className="h-4 w-4 text-emerald-500" />
                        ) : slugAvailable === false || slugError ? (
                            <Info className="h-4 w-4 text-red-500" />
                        ) : null}
                    </div>
                </div>
                {slugError && <p className="text-[11px] text-red-400/80 ml-1">{slugError}</p>}
                {slugAvailable === false && !slugError && <p className="text-[11px] text-red-400/80 ml-1">Esta URL ya está en uso</p>}
                <p className="text-[11px] text-white/20 ml-1 font-mono uppercase tracking-tight">Tu box se verá en: {slug || '...'}.boxora.website</p>
            </div>

            <div className="space-y-2.5">
                <Label htmlFor="country" className="text-[11px] font-semibold uppercase tracking-wider text-white/40 ml-1">País</Label>
                <select
                    id="country"
                    value={country}
                    onChange={(e) => onCountryChange(e.target.value)}
                    className="w-full bg-white/[0.06] border-white/[0.08] px-4 h-[52px] rounded-2xl text-white focus:border-white/20 outline-none flex items-center transition-all appearance-none cursor-pointer text-[15px] font-medium"
                    required
                >
                    <option value="" disabled className="bg-[#050508]">Seleccionar país</option>
                    {COUNTRIES.map(c => <option key={c} value={c} className="bg-[#050508]">{c}</option>)}
                </select>
            </div>

            <Button
                onClick={onNext}
                disabled={!boxName || !slug || !country || !slugAvailable || !!slugError}
                className="w-full h-[54px] rounded-2xl bg-white text-black font-bold text-[15px] shadow-lg hover:bg-white/90 active:scale-[0.98] transition-all duration-200 group mt-2"
            >
                <span>Continuar</span>
                <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
            </Button>
        </div>
    );

const Step2: React.FC<{
    email: string;
    onEmailChange: (val: string) => void;
    password: string;
    onPasswordChange: (val: string) => void;
    error: string | null;
    isSubmitting: boolean;
    onBack: () => void;
    onSubmit: () => void;
}> = ({
    email, onEmailChange,
    password, onPasswordChange,
    error,
    isSubmitting,
    onBack,
    onSubmit
}) => (
        <div className="space-y-6 animate-premium-in">
            <div className="space-y-2.5">
                <Label htmlFor="email" className="text-[11px] font-semibold uppercase tracking-wider text-white/40 ml-1">Email de Administrador</Label>
                <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-white/30 group-focus-within:text-white/70 transition-colors" />
                    <Input
                        id="email"
                        type="email"
                        placeholder="admin@tu-box.com"
                        className="bg-white/[0.06] border-white/[0.08] pl-12 h-[52px] rounded-2xl text-white placeholder:text-white/25 focus:border-white/20 focus:ring-1 focus:ring-white/10 transition-all text-[15px] font-medium"
                        value={email}
                        onChange={(e) => onEmailChange(e.target.value)}
                        required
                    />
                </div>
            </div>

            <div className="space-y-2.5">
                <Label htmlFor="password" className="text-[11px] font-semibold uppercase tracking-wider text-white/40 ml-1">Contraseña</Label>
                <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-white/30 group-focus-within:text-white/70 transition-colors" />
                    <Input
                        id="password"
                        type="password"
                        placeholder="Mínimo 8 caracteres"
                        className="bg-white/[0.06] border-white/[0.08] pl-12 h-[52px] rounded-2xl text-white placeholder:text-white/25 focus:border-white/20 focus:ring-1 focus:ring-white/10 transition-all text-[15px] font-medium"
                        value={password}
                        onChange={(e) => onPasswordChange(e.target.value)}
                        required
                    />
                </div>
            </div>

            {error && (
                <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 py-3 rounded-2xl">
                    <Info className="h-4 w-4 text-red-400" />
                    <AlertDescription className="text-xs font-semibold text-red-300">{error}</AlertDescription>
                </Alert>
            )}

            <div className="flex gap-3">
                <Button
                    variant="ghost"
                    onClick={onBack}
                    disabled={isSubmitting}
                    className="h-[54px] w-14 rounded-2xl bg-white/[0.06] border border-white/[0.08] hover:bg-white/[0.12] transition-colors flex items-center justify-center p-0"
                >
                    <ArrowLeft className="h-5 w-5 text-white/60" />
                </Button>
                <Button
                    onClick={onSubmit}
                    disabled={isSubmitting || !email || password.length < 8}
                    className="flex-1 h-[54px] rounded-2xl bg-white text-black font-bold text-[15px] shadow-lg hover:bg-white/90 active:scale-[0.98] transition-all duration-200"
                >
                    {isSubmitting ? (
                        <Loader2 className="h-5 w-5 animate-spin mx-auto text-black/60" />
                    ) : (
                        "Crear mi Box"
                    )}
                </Button>
            </div>
        </div>
    );

const SuccessScreen: React.FC<{ slug: string; boxName: string }> = ({ slug, boxName }) => {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    return (
        <div className="text-center animate-premium-in space-y-6">
            <div className="h-20 w-20 rounded-[2rem] bg-emerald-500/20 flex items-center justify-center mx-auto ring-1 ring-emerald-500/20 shadow-[0_0_40px_rgba(16,185,129,0.15)]">
                <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            </div>

            <div>
                <h2 className="text-2xl font-bold tracking-tight">¡{boxName} está listo!</h2>
                <p className="text-white/40 text-sm mt-3 px-8 leading-relaxed">
                    Hemos preparado tu entorno de gestión. Redirigiendo automáticamente en unos segundos...
                </p>
            </div>

            <div className="pt-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.06] border border-white/[0.08] text-[13px] font-mono text-white/50">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>{isLocal ? `?box=${slug}` : `${slug}.boxora.website`}</span>
                </div>
            </div>

            <p className="text-[11px] text-white/10 uppercase tracking-[0.2em] font-bold pt-8">Redirigiendo ahora</p>
        </div>
    );
};

export const RegisterBox: React.FC = () => {
    const [step, setStep] = useState<Step>(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    // Step 1: Box Data
    const [boxName, setBoxName] = useState('');
    const [slug, setSlug] = useState('');
    const [country, setCountry] = useState('');
    const [slugError, setSlugError] = useState<string | null>(null);
    const [slugChecking, setSlugChecking] = useState(false);
    const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);

    // Step 2: Admin Data
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    const autoSlug = (name: string) =>
        name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const handleBoxNameChange = (name: string) => {
        setBoxName(name);
        setSlug(autoSlug(name));
        setSlugAvailable(null);
    };

    const debounceRef = useRef<ReturnType<typeof setTimeout>>();
    useEffect(() => {
        if (!slug) {
            setSlugError(null);
            setSlugAvailable(null);
            return;
        }

        if (!/^[a-z0-9-]{3,50}$/.test(slug)) {
            setSlugError('Solo minúsculas, números y guiones (3-50 car.)');
            setSlugAvailable(false);
            return;
        }

        setSlugError(null);
        setSlugChecking(true);

        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            try {
                const { data, error: fetchError } = await supabase
                    .from('boxes')
                    .select('id')
                    .eq('slug', slug)
                    .maybeSingle();

                if (fetchError) throw fetchError;
                setSlugAvailable(!data);
            } catch (err) {
                console.error('[RegisterBox] Error checking slug:', err);
                setSlugAvailable(false);
            } finally {
                setSlugChecking(false);
            }
        }, 500);

        return () => clearTimeout(debounceRef.current);
    }, [slug]);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setError(null);

        let newBoxId: string | null = null;

        try {
            // 1. Create the box
            const { data: newBox, error: boxError } = await supabase
                .from('boxes')
                .insert({
                    name: boxName,
                    slug,
                    country,
                    subscription_status: 'trial'
                } as any)
                .select()
                .single();

            if (boxError || !newBox) throw boxError || new Error('Error creando el registro del Box');
            newBoxId = newBox.id;

            // 2. Create admin account
            // We inject box_id in metadata. AuthContext should handle it if our 
            // trigger handle_new_user is ready, or use the fallback reconciliation.
            const { error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        box_id: newBoxId,
                        role_id: 'admin',
                        full_name: `${boxName} Admin`
                    },
                    emailRedirectTo: `${window.location.origin}/auth/callback`
                },
            });

            if (signUpError) {
                // Rollback: delete the box if user creation fails
                if (newBoxId) await supabase.from('boxes').delete().eq('id', newBoxId);
                throw signUpError;
            }

            setSuccess(true);

            // 3. Redirect to the new box subdomain/path
            setTimeout(() => {
                window.location.href = buildTenantUrl(slug);
            }, 3000);

        } catch (err: any) {
            setError(err.message || 'Ocurrió un error inesperado. Por favor, intenta de nuevo.');
            console.error('[RegisterBox] Signup failure:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center bg-[#050508] relative overflow-hidden px-4 py-8">
            {/* Background elements */}
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-rose-500/5 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-orange-500/5 blur-[120px] pointer-events-none" />

            <div className="relative z-10 w-full max-w-[420px] mx-auto space-y-8">
                {/* Branding / Header */}
                {!success && (
                    <div className="text-center animate-premium-in">
                        <div className="h-20 w-20 rounded-[1.75rem] bg-white/10 backdrop-blur-2xl flex items-center justify-center mx-auto mb-6 ring-1 ring-white/10 shadow-[0_8px_40px_rgba(0,0,0,0.4)]">
                            <Building2 className="h-10 w-10 text-white" />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Boxora</h1>
                        <p className="text-white/40 text-[13px] mt-2 font-medium tracking-wide">
                            Registra tu centro y empieza a gestionar hoy mismo
                        </p>
                    </div>
                )}

                {/* Main Card */}
                <div className="rounded-[2rem] bg-white/[0.04] backdrop-blur-2xl border border-white/[0.10] shadow-[0_8px_60px_rgba(0,0,0,0.5)] overflow-hidden p-8 sm:p-10">
                    {success ? (
                        <SuccessScreen slug={slug} boxName={boxName} />
                    ) : (
                        <>
                            <div className="flex justify-between items-center mb-10">
                                <div>
                                    <h3 className="text-xl font-semibold text-white">
                                        {step === 1 ? "Datos de tu Box" : "Configura tu cuenta"}
                                    </h3>
                                    <p className="text-white/30 text-xs mt-1 font-semibold uppercase tracking-widest">Paso {step} de 2</p>
                                </div>
                                <div className="flex gap-1.5">
                                    <div className={`h-1.5 w-6 rounded-full transition-all duration-300 ${step === 1 ? 'bg-white' : 'bg-white/10'}`} />
                                    <div className={`h-1.5 w-6 rounded-full transition-all duration-300 ${step === 2 ? 'bg-white' : 'bg-white/10'}`} />
                                </div>

                            </div>

                            {step === 1 ? (
                                <Step1
                                    boxName={boxName} onBoxNameChange={handleBoxNameChange}
                                    slug={slug} onSlugChange={setSlug}
                                    slugError={slugError} slugChecking={slugChecking} slugAvailable={slugAvailable}
                                    country={country} onCountryChange={setCountry}
                                    onNext={() => setStep(2)}
                                />
                            ) : (
                                <Step2
                                    email={email} onEmailChange={setEmail}
                                    password={password} onPasswordChange={setPassword}
                                    error={error}
                                    isSubmitting={isSubmitting}
                                    onBack={() => setStep(1)}
                                    onSubmit={handleSubmit}
                                />
                            )}
                        </>
                    )}
                </div>

                {/* Footer links */}
                {!success && (
                    <p className="text-center text-[13px] text-white/20 font-medium">
                        ¿Ya tienes un Box?{' '}
                        <button
                            onClick={() => window.location.href = '/login'}
                            className="text-white/60 hover:text-white hover:underline transition-all"
                        >
                            Inicia sesión
                        </button>
                    </p>
                )}
            </div>
        </div>
    );
};
