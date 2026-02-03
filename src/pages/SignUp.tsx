import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

interface SignUpProps {
    onBackToLogin: () => void;
}

export const SignUp: React.FC<SignUpProps> = ({ onBackToLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // 1. Sign up the user
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
        });

        if (authError) {
            setError(authError.message);
            setLoading(false);
            return;
        }

        if (authData.user) {
            // 2. Create the profile in the profiles table
            const { error: profileError } = await supabase
                .from('profiles')
                .insert([
                    {
                        id: authData.user.id,
                        first_name: firstName,
                        last_name: lastName,
                        role: 'athlete',
                        status: 'active'
                    }
                ]);

            if (profileError) {
                console.error('Error creating profile:', profileError);
                // We don't block for profile error here, but in a real app you'd handle it
            }

            setSuccess(true);
        }

        setLoading(false);
    };

    if (success) {
        return (
            <div className="login-container" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                backgroundColor: 'var(--secondary)',
                backgroundImage: 'url(/crossfit_hero_background_1770124478080.png)',
                backgroundSize: 'cover',
                backgroundBlendMode: 'overlay'
            }}>
                <div className="login-card" style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    padding: 'var(--spacing-xl)',
                    borderRadius: '8px',
                    width: '100%',
                    maxWidth: '400px',
                    textAlign: 'center'
                }}>
                    <h2 style={{ color: 'var(--primary)', marginBottom: 'var(--spacing-md)' }}>¡Registro Exitoso!</h2>
                    <p style={{ marginBottom: 'var(--spacing-lg)' }}>Por favor, verifica tu correo electrónico para confirmar tu cuenta.</p>
                    <button className="btn btn-primary" onClick={onBackToLogin}>
                        Volver al Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="login-container" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            backgroundColor: 'var(--secondary)',
            backgroundImage: 'url(/crossfit_hero_background_1770124478080.png)',
            backgroundSize: 'cover',
            backgroundBlendMode: 'overlay'
        }}>
            <div className="login-card" style={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                padding: 'var(--spacing-xl)',
                borderRadius: '8px',
                width: '100%',
                maxWidth: '400px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
            }}>
                <h2 style={{ color: 'var(--primary)', marginBottom: 'var(--spacing-md)', textAlign: 'center' }}>Crear Cuenta</h2>
                <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-sm)' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontSize: '0.875rem' }}>Nombre</label>
                            <input
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                className="form-input"
                                required
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontSize: '0.875rem' }}>Apellido</label>
                            <input
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                className="form-input"
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontSize: '0.875rem' }}>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="form-input"
                            required
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontSize: '0.875rem' }}>Contraseña</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="form-input"
                            required
                            minLength={6}
                        />
                    </div>
                    {error && <p style={{ color: 'red', fontSize: '0.875rem' }}>{error}</p>}
                    <button className="btn btn-primary" disabled={loading}>
                        {loading ? 'Registrando...' : 'Registrarse'}
                    </button>
                </form>

                <p style={{ marginTop: 'var(--spacing-lg)', textAlign: 'center', fontSize: '0.875rem' }}>
                    ¿Ya tienes cuenta?{' '}
                    <span
                        onClick={onBackToLogin}
                        style={{ color: 'var(--primary)', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                        Inicia sesión
                    </span>
                </p>
            </div>
            <style>{`
        .form-input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid var(--border);
          border-radius: 4px;
          outline: none;
        }
        .form-input:focus {
          border-color: var(--primary);
        }
      `}</style>
        </div>
    );
};
