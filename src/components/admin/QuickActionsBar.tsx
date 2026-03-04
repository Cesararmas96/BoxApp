import React, { useState } from 'react';
import { Calendar, DollarSign, UserPlus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Toast } from '@/components/ui/toast-custom';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

// ─── Types ────────────────────────────────────────────────────────────────────

type DialogType = 'class' | 'payment' | 'member' | null;

interface ToastState {
    type: 'success' | 'error' | 'loading';
    message: string;
}

// ─── Dialog: Nueva Clase ───────────────────────────────────────────────────────

interface NewClassDialogProps {
    open: boolean;
    onClose: (success: boolean) => void;
    boxId: string;
}

const NewClassDialog: React.FC<NewClassDialogProps> = ({ open, onClose, boxId }) => {
    const [title, setTitle] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [capacity, setCapacity] = useState('20');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isValid = title.trim() !== '' && startTime !== '' && endTime !== '' && Number(capacity) > 0;

    const reset = () => {
        setTitle('');
        setStartTime('');
        setEndTime('');
        setCapacity('20');
        setError(null);
    };

    const handleSave = async () => {
        if (!isValid || !boxId) return;
        setSaving(true);
        setError(null);
        try {
            const { error: err } = await supabase
                .from('sessions' as any)
                .insert({
                    box_id: boxId,
                    title: title.trim(),
                    start_time: new Date(startTime).toISOString(),
                    end_time: new Date(endTime).toISOString(),
                    capacity: Number(capacity),
                    // type_id and location_id are required FKs — using 'crossfit' as default type_id.
                    // TODO: (Agent) Allow admin to select session type once session_types are seeded.
                    type_id: 'crossfit',
                    location_id: null,
                } as any);
            if (err) throw err;
            reset();
            onClose(true);
        } catch (e: any) {
            setError(e.message ?? 'Error al crear la clase.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) { reset(); onClose(false); } }}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Nueva Clase</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="space-y-1.5">
                        <Label htmlFor="class-title">Nombre de la clase</Label>
                        <Input
                            id="class-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="ej. CrossFit WOD"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="class-start">Inicio</Label>
                            <Input
                                id="class-start"
                                type="datetime-local"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="class-end">Fin</Label>
                            <Input
                                id="class-end"
                                type="datetime-local"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="class-capacity">Capacidad máxima</Label>
                        <Input
                            id="class-capacity"
                            type="number"
                            min={1}
                            value={capacity}
                            onChange={(e) => setCapacity(e.target.value)}
                        />
                    </div>
                    {error && <p className="text-xs text-destructive">{error}</p>}
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => { reset(); onClose(false); }} disabled={saving}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSave} disabled={!isValid || saving}>
                        {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Guardar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

// ─── Dialog: Registrar Pago ────────────────────────────────────────────────────

interface PaymentDialogProps {
    open: boolean;
    onClose: (success: boolean) => void;
    boxId: string;
}

const PaymentDialog: React.FC<PaymentDialogProps> = ({ open, onClose, boxId }) => {
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isValid = amount !== '' && Number(amount) > 0 && description.trim() !== '';

    const reset = () => {
        setAmount('');
        setDescription('');
        setError(null);
    };

    const handleSave = async () => {
        if (!isValid || !boxId) return;
        setSaving(true);
        setError(null);
        try {
            const { error: err } = await supabase
                .from('expenses' as any)
                .insert({
                    box_id: boxId,
                    amount: Number(amount),
                    description: description.trim(),
                    category: 'Pago',
                    date: new Date().toISOString().split('T')[0],
                } as any);
            if (err) throw err;
            reset();
            onClose(true);
        } catch (e: any) {
            setError(e.message ?? 'Error al registrar el pago.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) { reset(); onClose(false); } }}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Registrar Pago</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="space-y-1.5">
                        <Label htmlFor="pay-amount">Monto</Label>
                        <Input
                            id="pay-amount"
                            type="number"
                            min={0.01}
                            step={0.01}
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="ej. 5000"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="pay-desc">Descripción</Label>
                        <Input
                            id="pay-desc"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="ej. Mensualidad Mayo"
                        />
                    </div>
                    {error && <p className="text-xs text-destructive">{error}</p>}
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => { reset(); onClose(false); }} disabled={saving}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSave} disabled={!isValid || saving}>
                        {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Guardar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

// ─── Dialog: Invitar Miembro ───────────────────────────────────────────────────

interface MemberDialogProps {
    open: boolean;
    onClose: (success: boolean) => void;
    boxId: string;
}

const MemberDialog: React.FC<MemberDialogProps> = ({ open, onClose, boxId }) => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isValid = firstName.trim() !== '' && email.trim() !== '';

    const reset = () => {
        setFirstName('');
        setLastName('');
        setEmail('');
        setError(null);
    };

    const handleSave = async () => {
        if (!isValid || !boxId) return;
        setSaving(true);
        setError(null);
        try {
            // MVP: INSERT a profile record without auth user.
            // TODO: (Agent) Replace with server-side invite-by-email flow when available.
            const { error: err } = await supabase
                .from('profiles' as any)
                .insert({
                    box_id: boxId,
                    first_name: firstName.trim(),
                    last_name: lastName.trim() || null,
                    email: email.trim(),
                    role_id: 'athlete',
                    status: 'active',
                } as any);
            if (err) throw err;
            reset();
            onClose(true);
        } catch (e: any) {
            setError(e.message ?? 'Error al agregar el miembro.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) { reset(); onClose(false); } }}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Invitar Miembro</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="mem-first">Nombre</Label>
                            <Input
                                id="mem-first"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                placeholder="Juan"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="mem-last">Apellido</Label>
                            <Input
                                id="mem-last"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                placeholder="Pérez"
                            />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="mem-email">Email del miembro</Label>
                        <Input
                            id="mem-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="juan@ejemplo.com"
                        />
                    </div>
                    {error && <p className="text-xs text-destructive">{error}</p>}
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => { reset(); onClose(false); }} disabled={saving}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSave} disabled={!isValid || saving}>
                        {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Guardar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

// ─── QuickActionsBar ──────────────────────────────────────────────────────────

export const QuickActionsBar: React.FC = () => {
    const { currentBox } = useAuth();
    const [openDialog, setOpenDialog] = useState<DialogType>(null);
    const [toast, setToast] = useState<ToastState | null>(null);

    const boxId = currentBox?.id ?? '';

    const SUCCESS_MESSAGES: Record<NonNullable<DialogType>, string> = {
        class: 'Clase creada exitosamente.',
        payment: 'Pago registrado exitosamente.',
        member: 'Miembro agregado exitosamente.',
    };

    const makeCloseHandler = (action: NonNullable<DialogType>) => (success: boolean) => {
        setOpenDialog(null);
        if (success) setToast({ type: 'success', message: SUCCESS_MESSAGES[action] });
    };

    return (
        <>
            <div className="flex flex-wrap gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => setOpenDialog('class')}
                    disabled={!boxId}
                >
                    <Calendar className="h-4 w-4" />
                    Nueva Clase
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => setOpenDialog('payment')}
                    disabled={!boxId}
                >
                    <DollarSign className="h-4 w-4" />
                    Registrar Pago
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => setOpenDialog('member')}
                    disabled={!boxId}
                >
                    <UserPlus className="h-4 w-4" />
                    Invitar Miembro
                </Button>
            </div>

            <NewClassDialog
                open={openDialog === 'class'}
                onClose={makeCloseHandler('class')}
                boxId={boxId}
            />
            <PaymentDialog
                open={openDialog === 'payment'}
                onClose={makeCloseHandler('payment')}
                boxId={boxId}
            />
            <MemberDialog
                open={openDialog === 'member'}
                onClose={makeCloseHandler('member')}
                boxId={boxId}
            />

            {toast && (
                <Toast
                    type={toast.type}
                    message={toast.message}
                    onClose={() => setToast(null)}
                />
            )}
        </>
    );
};
