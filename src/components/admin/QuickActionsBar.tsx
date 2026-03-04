import React, { useState } from 'react';
import {
    Calendar,
    DollarSign,
    UserPlus,
    Loader2,
    AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    ResponsiveDialog as Dialog,
    ResponsiveDialogContent as DialogContent,
    ResponsiveDialogHeader as DialogHeader,
    ResponsiveDialogTitle as DialogTitle,
    ResponsiveDialogFooter as DialogFooter,
    ResponsiveDialogDescription as DialogDescription
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/hooks';
import { supabase } from '@/lib/supabaseClient';
import { cn } from '@/lib/utils';

export const QuickActionsBar: React.FC = () => {
    const { currentBox } = useAuth();
    const { t } = useLanguage();
    const [openDialog, setOpenDialog] = useState<'class' | 'payment' | 'member' | null>(null);

    const closeDialog = () => {
        setOpenDialog(null);
    };

    return (
        <div className="flex flex-wrap gap-3">
            <Button
                onClick={() => setOpenDialog('class')}
                variant="outline"
                className="gap-2 bg-card hover:bg-primary/5 border-border/50 shadow-sm"
            >
                <Calendar className="h-4 w-4 text-primary" />
                {t('admin.quick_actions.new_class', { defaultValue: 'Nueva Clase' })}
            </Button>

            <Button
                onClick={() => setOpenDialog('payment')}
                variant="outline"
                className="gap-2 bg-card hover:bg-primary/5 border-border/50 shadow-sm"
            >
                <DollarSign className="h-4 w-4 text-primary" />
                {t('admin.quick_actions.register_payment', { defaultValue: 'Registrar Pago' })}
            </Button>

            <Button
                onClick={() => setOpenDialog('member')}
                variant="outline"
                className="gap-2 bg-card hover:bg-primary/5 border-border/50 shadow-sm"
            >
                <UserPlus className="h-4 w-4 text-primary" />
                {t('admin.quick_actions.invite_member', { defaultValue: 'Invitar Miembro' })}
            </Button>

            {/* Dialogs */}
            <NewClassDialog
                open={openDialog === 'class'}
                onClose={closeDialog}
                boxId={currentBox?.id || ''}
            />

            <RegisterPaymentDialog
                open={openDialog === 'payment'}
                onClose={closeDialog}
                boxId={currentBox?.id || ''}
            />

            <InviteMemberDialog
                open={openDialog === 'member'}
                onClose={closeDialog}
                boxId={currentBox?.id || ''}
            />
        </div>
    );
};

/* ─────────────────────────────────────────────
   DIALOG: NUEVA CLASE
   ───────────────────────────────────────────── */
interface DialogProps {
    open: boolean;
    onClose: () => void;
    boxId: string;
}

const NewClassDialog: React.FC<DialogProps> = ({ open, onClose, boxId }) => {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        capacity: '20',
        startTime: '08:00',
        endTime: '09:00'
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!boxId) return;

        setLoading(true);
        setError(null);

        try {
            const { error: insertError } = await supabase
                .from('classes')
                .insert({
                    box_id: boxId,
                    name: formData.name,
                    capacity: parseInt(formData.capacity, 10),
                    start_time: formData.startTime,
                    end_time: formData.endTime,
                    duration_minutes: 60 // Default duration
                });

            if (insertError) throw insertError;

            onClose();
            // In a real app we'd reload the schedule here
        } catch (err: any) {
            setError(err.message || 'Error al crear la clase');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        {t('admin.quick_actions.new_class_title', { defaultValue: 'Nueva Clase' })}
                    </DialogTitle>
                    <DialogDescription>
                        {t('admin.quick_actions.new_class_desc', { defaultValue: 'Configura una sesión rápida para tu Box.' })}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="className">{t('admin.quick_actions.fields.name', { defaultValue: 'Nombre de la clase' })}</Label>
                        <Input
                            id="className"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Ej: WOD Mañana, Open Box..."
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="startTime">{t('admin.quick_actions.fields.start_time', { defaultValue: 'Hora Inicio' })}</Label>
                            <Input
                                id="startTime"
                                type="time"
                                value={formData.startTime}
                                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="endTime">{t('admin.quick_actions.fields.end_time', { defaultValue: 'Hora Fin' })}</Label>
                            <Input
                                id="endTime"
                                type="time"
                                value={formData.endTime}
                                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="capacity">{t('admin.quick_actions.fields.capacity', { defaultValue: 'Capacidad Máxima' })}</Label>
                        <Input
                            id="capacity"
                            type="number"
                            min="1"
                            value={formData.capacity}
                            onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                            required
                        />
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20 animate-in fade-in slide-in-from-top-1">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            {error}
                        </div>
                    )}

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
                            {t('common.cancel', { defaultValue: 'Cancelar' })}
                        </Button>
                        <Button type="submit" disabled={loading || !formData.name}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {t('common.save', { defaultValue: 'Crear Clase' })}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

/* ─────────────────────────────────────────────
   DIALOG: REGISTRAR PAGO
   ───────────────────────────────────────────── */
const RegisterPaymentDialog: React.FC<DialogProps> = ({ open, onClose, boxId }) => {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        amount: '',
        membership: '',
        memberId: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!boxId) return;

        setLoading(true);
        setError(null);

        try {
            // Note: Invoices table schema doesn't have description, only amount, status, paid_at
            const { error: insertError } = await supabase
                .from('invoices')
                .insert({
                    box_id: boxId,
                    amount: parseFloat(formData.amount),
                    status: 'paid',
                    paid_at: new Date().toISOString(),
                    user_id: formData.memberId || null,
                    membership_id: formData.membership || null
                });

            if (insertError) throw insertError;

            onClose();
        } catch (err: any) {
            setError(err.message || 'Error al registrar el pago');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-primary" />
                        {t('admin.quick_actions.payment_title', { defaultValue: 'Registrar Pago' })}
                    </DialogTitle>
                    <DialogDescription>
                        {t('admin.quick_actions.payment_desc', { defaultValue: 'Registra un ingreso directo al Box.' })}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="amount">{t('admin.quick_actions.fields.amount', { defaultValue: 'Monto' })}</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                className="pl-7"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                placeholder="0.00"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="memberId">{t('admin.quick_actions.fields.member_email', { defaultValue: 'Email del Miembro (Opcional)' })}</Label>
                        <Input
                            id="memberId"
                            placeholder="miembro@correo.com"
                            value={formData.memberId}
                            onChange={(e) => setFormData({ ...formData, memberId: e.target.value })}
                        />
                        <p className="text-[10px] text-muted-foreground italic">
                            {t('admin.quick_actions.fields.member_hint', { defaultValue: 'Asocia este pago a un perfil si lo deseas.' })}
                        </p>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20 animate-in fade-in slide-in-from-top-1">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            {error}
                        </div>
                    )}

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
                            {t('common.cancel', { defaultValue: 'Cancelar' })}
                        </Button>
                        <Button type="submit" disabled={loading || !formData.amount}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {t('common.save_payment', { defaultValue: 'Registrar Pago' })}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

/* ─────────────────────────────────────────────
   DIALOG: INVITAR MIEMBRO
   ───────────────────────────────────────────── */
const InviteMemberDialog: React.FC<DialogProps> = ({ open, onClose, boxId }) => {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        email: '',
        firstName: '',
        lastName: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!boxId) return;

        setLoading(true);
        setError(null);

        try {
            // Option B for MVP: Insert into profiles with a generated id
            // Profiles pk is id (uuid). Since we can't easily create an auth user,
            // we create a placeholder profile record.
            const { error: insertError } = await supabase
                .from('profiles')
                .insert({
                    id: crypto.randomUUID(),
                    box_id: boxId,
                    email: formData.email,
                    first_name: formData.firstName,
                    last_name: formData.lastName,
                    role_id: 'athlete'
                });

            if (insertError) throw insertError;

            onClose();
        } catch (err: any) {
            setError(err.message || 'Error al invitar al miembro');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5 text-primary" />
                        {t('admin.quick_actions.member_title', { defaultValue: 'Invitar Miembro' })}
                    </DialogTitle>
                    <DialogDescription>
                        {t('admin.quick_actions.member_desc', { defaultValue: 'Agrega un nuevo atleta a la base de datos de tu Box.' })}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">{t('admin.quick_actions.fields.email', { defaultValue: 'Correo Electrónico' })}</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="ejemplo@correo.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="firstName">{t('admin.quick_actions.fields.first_name', { defaultValue: 'Nombre' })}</Label>
                            <Input
                                id="firstName"
                                value={formData.firstName}
                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName">{t('admin.quick_actions.fields.last_name', { defaultValue: 'Apellido' })}</Label>
                            <Input
                                id="lastName"
                                value={formData.lastName}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20 animate-in fade-in slide-in-from-top-1">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            {error}
                        </div>
                    )}

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
                            {t('common.cancel', { defaultValue: 'Cancelar' })}
                        </Button>
                        <Button type="submit" disabled={loading || !formData.email}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {t('common.invite', { defaultValue: 'Invitar Atleta' })}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
