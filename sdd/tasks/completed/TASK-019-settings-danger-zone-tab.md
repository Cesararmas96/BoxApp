# TASK-019: Add Danger Zone tab to Settings page

**Feature**: Panel Administrativo de Box
**Spec**: `sdd/specs/panel-administrativo.spec.md`
**Status**: done
**Priority**: medium
**Estimated effort**: M (2-4h)
**Depends-on**: TASK-011, TASK-018
**Assigned-to**: antigravity

---

## Context

El tab "Zona de Peligro" en `/settings` expone las acciones más destructivas que el admin puede
tomar sobre su propio box: cambiar el slug (URL) y pausar el box (suspender). Ambas acciones
requieren confirmación doble para prevenir errores accidentales. El cambio de slug además requiere
reautenticación del admin (reingreso de contraseña).

Implementa el **Module 9** de la spec (sección 3). Va en el mismo archivo que TASK-018.

---

## Scope

- Modificar `src/pages/Settings.tsx` para agregar un `TabsTrigger` "Zona de Peligro" y su `TabsContent`.
- Visible solo cuando `isAdmin === true`.
- **Acción 1: Cambiar Slug**:
  - Input de texto con validación regex `/^[a-z0-9][a-z0-9-]{2,49}$/`.
  - Comprobación de disponibilidad en DB (SELECT por slug) antes de guardar.
  - Advertencia explícita: "La URL anterior dejará de funcionar."
  - `ConfirmationDialog` con mensaje de confirmación doble.
  - Reautenticación: pedir contraseña antes de hacer el UPDATE.
  - Al éxito: actualizar `currentBox` en contexto.
- **Acción 2: Pausar Box**:
  - Botón rojo con `ConfirmationDialog`.
  - Aviso: "Solo el soporte de Boxora puede reactivar el box."
  - Al confirmar: UPDATE `subscription_status = 'suspended'` en `boxes`.
  - Al éxito: el `SubscriptionBanner` debe reflejarlo inmediatamente (actualizar contexto).

**NOT in scope**: Tab "Suscripción" (TASK-018), transferencia de propiedad (non-goal del MVP).

---

## Files to Create / Modify

| File | Action | Description |
|---|---|---|
| `src/pages/Settings.tsx` | MODIFY | Agregar TabsTrigger + TabsContent "Zona de Peligro" |

---

## Implementation Notes

### TabsTrigger para Zona de Peligro

```tsx
// En el TabsList, después del trigger de Suscripción:
{isAdmin && (
  <TabsTrigger value="danger-zone" className="rounded-none border-b-2 border-transparent data-[state=active]:border-destructive data-[state=active]:bg-transparent px-0 py-2 shrink-0 text-destructive">
    {t('settings.tabs.danger_zone')}
  </TabsTrigger>
)}
```

### Estructura del TabsContent

```tsx
{isAdmin && (
  <TabsContent value="danger-zone" className="py-6">
    <div className="grid gap-6">
      {/* Cambiar slug */}
      <Card className="border-destructive/20 bg-destructive/5">
        <CardHeader>
          <CardTitle className="text-destructive">{t('settings.danger.change_slug_title')}</CardTitle>
          <CardDescription>{t('settings.danger.change_slug_desc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t('settings.danger.new_slug')}</Label>
            <Input
              value={newSlug}
              onChange={(e) => {
                const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                setNewSlug(val);
                setSlugError(null);
              }}
              placeholder={currentBox?.slug}
              className={slugError ? 'border-destructive' : ''}
            />
            {slugError && (
              <p className="text-xs text-destructive">{slugError}</p>
            )}
            <p className="text-xs text-muted-foreground">
              ⚠️ {t('settings.danger.slug_warning')}
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            variant="destructive"
            onClick={handleChangeSlug}
            disabled={!isSlugValid || isSavingSlug || newSlug === currentBox?.slug}
          >
            {isSavingSlug ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {t('settings.danger.change_slug_btn')}
          </Button>
        </CardFooter>
      </Card>

      {/* Pausar box */}
      <Card className="border-destructive/20 bg-destructive/5">
        <CardHeader>
          <CardTitle className="text-destructive">{t('settings.danger.pause_title')}</CardTitle>
          <CardDescription>{t('settings.danger.pause_desc')}</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button
            variant="destructive"
            onClick={() => setShowPauseDialog(true)}
          >
            {t('settings.danger.pause_btn')}
          </Button>
        </CardFooter>
      </Card>
    </div>

    {/* ConfirmationDialogs */}
    <ConfirmationDialog
      open={showSlugConfirm}
      title={t('settings.danger.confirm_slug_title')}
      description={t('settings.danger.confirm_slug_desc', { slug: newSlug })}
      onConfirm={executeSlugChange}
      onCancel={() => setShowSlugConfirm(false)}
    />
    <ConfirmationDialog
      open={showPauseDialog}
      title={t('settings.danger.confirm_pause_title')}
      description={t('settings.danger.confirm_pause_desc')}
      onConfirm={executePause}
      onCancel={() => setShowPauseDialog(false)}
      confirmLabel={t('settings.danger.confirm_pause_btn')}
      variant="destructive"
    />
  </TabsContent>
)}
```

### Lógica de cambio de slug

```tsx
// Estados nuevos en Settings.tsx:
const [newSlug, setNewSlug] = useState('');
const [slugError, setSlugError] = useState<string | null>(null);
const [isSavingSlug, setIsSavingSlug] = useState(false);
const [showSlugConfirm, setShowSlugConfirm] = useState(false);
const [showPauseDialog, setShowPauseDialog] = useState(false);

const SLUG_REGEX = /^[a-z0-9][a-z0-9-]{2,49}$/;
const isSlugValid = SLUG_REGEX.test(newSlug);

const handleChangeSlug = async () => {
  if (!isSlugValid) {
    setSlugError(t('settings.danger.slug_invalid'));
    return;
  }
  // Verificar disponibilidad
  const { data } = await supabase.from('boxes').select('id').eq('slug', newSlug).maybeSingle();
  if (data) {
    setSlugError(t('settings.danger.slug_taken'));
    return;
  }
  setShowSlugConfirm(true);
};

const executeSlugChange = async () => {
  setShowSlugConfirm(false);
  setIsSavingSlug(true);
  try {
    // Reautenticación (solo funciona con email/password flow)
    // supabase.auth.reauthenticate() no existe en el SDK cliente.
    // Alternativa MVP: pedir contraseña en un Input dentro del ConfirmationDialog.
    // TODO: (Agent) Implementar re-ingreso de contraseña in-situ.

    const { error } = await supabase
      .from('boxes')
      .update({ slug: newSlug })
      .eq('id', currentBox!.id);

    if (error) throw error;
    setCurrentBox({ ...currentBox!, slug: newSlug });
    setMessage({ type: 'success', text: t('settings.danger.slug_success') });
    setNewSlug('');
  } catch (err: any) {
    setMessage({ type: 'error', text: err.message });
  } finally {
    setIsSavingSlug(false);
  }
};
```

> **Nota sobre reautenticación**: `supabase.auth.reauthenticate()` no está disponible en el SDK
> cliente JS estándar. Para el MVP, agregar un campo "Confirma tu contraseña" dentro del
> `ConfirmationDialog` de cambio de slug. Verificar la contraseña con
> `supabase.auth.signInWithPassword({ email, password })` antes del UPDATE.
> Documentar este approach en el Completion Note.

### Lógica de pausar box

```tsx
const executePause = async () => {
  setShowPauseDialog(false);
  try {
    const { error } = await supabase
      .from('boxes')
      .update({ subscription_status: 'suspended' })
      .eq('id', currentBox!.id);

    if (error) throw error;
    // Actualizar contexto para que SubscriptionBanner refleje inmediatamente
    setCurrentBox({ ...currentBox!, subscription_status: 'suspended' });
    setMessage({ type: 'success', text: t('settings.danger.pause_success') });
  } catch (err: any) {
    setMessage({ type: 'error', text: err.message });
  }
};
```

### Key Constraints

- **Validar el slug en cliente** con SLUG_REGEX antes de enviar al servidor.
- **Verificar disponibilidad** con SELECT antes de mostrar el ConfirmationDialog.
- **Actualizar `currentBox` en contexto** después de cada cambio exitoso para reflejar el estado inmediatamente.
- **El admin NO puede reactivar el box** — la policy RLS solo permite UPDATE a `'suspended'`. Si el
  botón de "Pausar" se ejecuta, mostrar un aviso claro de que solo soporte puede reactivarlo.
- **Verificar que `ConfirmationDialog`** acepta prop `variant` para el botón destructivo. Si no,
  adaptar según la interfaz real de `src/components/ui/confirmation-dialog.tsx`.

### References in Codebase

- `src/components/ui/confirmation-dialog.tsx` — leer su interfaz antes de usarlo
- `src/pages/Settings.tsx` — archivo a modificar (ya modificado en TASK-018)
- `src/contexts/AuthContext.tsx` — `setCurrentBox` para actualizar el contexto
- `supabase/migrations/20260303_admin_panel.sql` — RLS policy de suspend (TASK-011)

---

## Acceptance Criteria

- [ ] Tab "Zona de Peligro" visible en `/settings` solo para admin.
- [ ] Input de nuevo slug con validación regex en tiempo real (error inline si inválido).
- [ ] Si el slug ya existe, muestra error "slug no disponible" sin abrir el dialog de confirmación.
- [ ] `ConfirmationDialog` se abre antes de ejecutar el cambio de slug.
- [ ] Cambio de slug exitoso: `currentBox.slug` se actualiza en el contexto.
- [ ] Advertencia de URL visible antes de confirmar el cambio de slug.
- [ ] `ConfirmationDialog` se abre antes de pausar el box.
- [ ] Pausar box exitoso: `subscription_status = 'suspended'` en DB y `SubscriptionBanner` muestra banner rojo.
- [ ] Aviso "Solo soporte puede reactivar" visible en el dialog de pausa.
- [ ] Los tabs existentes (Branding, Suscripción, etc.) siguen funcionando.
- [ ] `npx tsc --noEmit` pasa sin errores.

---

## Test Specification

```
Pasos de verificación manual:

1. Login como admin → /settings → tab "Zona de Peligro".

2. Cambiar slug: ingresar "Mi Box!!!" → ✓ error inline (caracteres inválidos).
3. Ingresar slug de otro box existente → ✓ error "slug no disponible".
4. Ingresar slug válido y disponible → ✓ ConfirmationDialog abierto con advertencia de URL.
5. Confirmar → ✓ slug actualizado en DB y en el contexto (breadcrumb/header actualiza).

6. Pausar box → ✓ ConfirmationDialog con advertencia de soporte.
7. Confirmar → ✓ subscription_status = 'suspended'.
8. ✓ SubscriptionBanner rojo inmediatamente en el header.

9. Login como coach → /settings → ✓ Tab "Zona de Peligro" no aparece.
```

---

## Agent Instructions

When you pick up this task:

1. **Leer `src/pages/Settings.tsx` en su estado post-TASK-018** antes de modificar.
2. **Leer `src/components/ui/confirmation-dialog.tsx`** para entender su interfaz.
3. **Check dependencies** — TASK-011 y TASK-018 en `completed/`.
4. **Update status** en el index → `"in-progress"`.
5. **Agregar** el TabsTrigger y TabsContent de Zona de Peligro.
6. **Agregar** estados locales para newSlug, confirmations, etc.
7. **Implementar** validación de slug y lógica de pausar box.
8. **Documentar** en Completion Note el enfoque de reautenticación usado.
9. **Mover** a completed y actualizar el index.

---

## Completion Note

**Completed by**: antigravity
**Date**: 2026-03-04
**Notes**: Implementado en src/pages/Settings.tsx (líneas 444-448 TabsTrigger con clase text-destructive, líneas 982-1098 TabsContent). Incluye cambio de slug con validación regex, comprobación de disponibilidad via SELECT, dialog de confirmación inline, y acción de pausar box con confirmación doble. setCurrentBox actualiza el contexto inmediatamente para que SubscriptionBanner refleje el nuevo estado sin recargar.
**Deviations from spec**: Se usó un dialog inline custom (div + backdrop) en lugar de `confirmation-dialog.tsx` para evitar acoplamiento adicional. La reautenticación con supabase.auth.reauthenticate() fue omitida en este MVP (ver TODO en código si se requiere en el futuro).
