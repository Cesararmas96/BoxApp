import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Dumbbell, Loader2, Mail, Lock, Info } from 'lucide-react';
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
import { Alert, AlertDescription } from "@/components/ui/alert";

export const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = isSignUp
            ? await supabase.auth.signUp({ email, password })
            : await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            setError(error.message);
        } else if (isSignUp) {
            alert('Verification email sent!');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-zinc-950 p-4 sm:p-8">
            {/* Background pattern */}
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #333 1px, transparent 0)', backgroundSize: '24px 24px' }} />

            <div className="relative z-10 w-full max-w-[400px]">
                <div className="flex flex-col items-center mb-8 gap-2">
                    <div className="p-3 bg-primary rounded-2xl shadow-2xl shadow-primary/20">
                        <Dumbbell className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-black italic tracking-tighter text-white uppercase">
                        Antigravity <span className="text-primary italic">Box</span>
                    </h1>
                </div>

                <Card className="border-zinc-800 bg-zinc-900 text-zinc-100 shadow-2xl overflow-hidden">
                    <CardHeader className="space-y-1 pb-6 text-center">
                        <CardTitle className="text-2xl font-bold tracking-tight">
                            {isSignUp ? "Create athlete account" : "Welcome back, athlete"}
                        </CardTitle>
                        <CardDescription className="text-zinc-400">
                            {isSignUp ? "Join the community today" : "Enter your credentials to enter the box"}
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={handleAuth} className="space-y-4">
                            {error && (
                                <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 py-2">
                                    <Info className="h-4 w-4" />
                                    <AlertDescription className="text-xs">{error}</AlertDescription>
                                </Alert>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-zinc-300">Email Address</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="coach@example.com"
                                        className="bg-zinc-800 border-zinc-700 pl-10 focus-visible:ring-primary h-10"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <Label htmlFor="pass" className="text-zinc-300">Password</Label>
                                    {!isSignUp && <Button variant="link" className="text-[10px] h-auto p-0 text-zinc-500 font-light">Forgot?</Button>}
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                                    <Input
                                        id="pass"
                                        type="password"
                                        className="bg-zinc-800 border-zinc-700 pl-10 focus-visible:ring-primary h-10"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full font-bold uppercase tracking-widest italic h-12 mt-4"
                                disabled={loading}
                            >
                                {loading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    isSignUp ? "Start Training" : "Enter Box"
                                )}
                            </Button>
                        </form>
                    </CardContent>

                    <CardFooter className="flex flex-col gap-4 border-t border-zinc-800 bg-zinc-900/50 py-4">
                        <div className="flex items-center justify-center gap-2 text-sm text-zinc-400">
                            <span>{isSignUp ? "Already a member?" : "New athlete?"}</span>
                            <Button
                                variant="link"
                                className="text-primary font-bold h-auto p-0"
                                onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
                            >
                                {isSignUp ? "Log In" : "Register Now"}
                            </Button>
                        </div>
                    </CardFooter>
                </Card>

                <p className="mt-8 text-center text-[10px] text-zinc-600 uppercase tracking-[0.2em]">
                    Powered by BoxManager OS 2026
                </p>
            </div>
        </div>
    );
};
