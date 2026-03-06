# TASK-018: Add Subscription tab to Settings page

**Feature**: Panel Administrativo de Box
**Spec**: `sdd/specs/panel-administrativo.spec.md`
**Status**: done
**Priority**: medium
**Estimated effort**: S (< 2h)
**Depends-on**: TASK-011
**Assigned-to**: antigravity

---

## Context

El tab "Suscripción" en `/settings` permite al admin ver el estado actual de su suscripción,
cuántos días le quedan de trial (calculado desde `trial_ends_at`), y un CTA para contactar
a soporte para upgrade. Es la vista informativa sobre el plan del box.

Implementa el **Module 8** de la spec (sección 3).

---

## Scope

- Modificar `src/pages/Settings.tsx` para agregar un `TabsTrigger` "Suscripción" y su `TabsContent`.
- Visible solo cuando `isAdmin === true` (verificar con `useAuth()`).
- Contenido del tab:
  - Badge visual del status actual (`trial` / `active` / `suspended` / `cancelled`).
  - Fecha de fin de trial formateada (desde `currentBox.trial_ends_at`).
  - Días restantes calculados en cliente.
  - CTA "Contactar para upgrade" → `mailto:soporte@boxora.com`.
  - Texto informativo sobre qué incluye cada plan (placeholder, sin datos reales de planes).

**NOT in scope**: Tab "Zona de Peligro" (TASK-019), lógica de pagos reales.

---

## Files to Create / Modify

| File | Action | Description |
|---|---|---|
| `src/pages/Settings.tsx` | MODIFY | Agregar TabsTrigger + TabsContent de Suscripción |

---

## Implementation Notes

### Leer Settings.tsx antes de modificar

Leer el archivo completo. Los tabs están en las líneas 356-362 (`TabsList`) y se extienden
hasta la línea ~840. Agregar el nuevo `TabsTrigger` al final del `TabsList` y el `TabsContent`
antes del cierre del `</Tabs>`.

### Código del nuevo TabsTrigger

```tsx
// En el TabsList, después de "notifications":
{isAdmin && (
  <TabsTrigger value="subscription" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2 shrink-0">
    {t('settings.tabs.subscription')}
  </TabsTrigger>
)}
```

### Código del nuevo TabsContent

```tsx
{isAdmin && (
  <TabsContent value="subscription" className="py-6">
    <div className="grid gap-6">
      <Card className="border-none shadow-premium bg-card/50 backdrop-blur-xl">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            <CardTitle>{t('settings.subscription.title')}</CardTitle>
          </div>
          <CardDescription>{t('settings.subscription.desc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status actual */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{t('settings.subscription.current_plan')}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t('settings.subscription.plan_desc')}
              </p>
            </div>
            <StatusBadge status={currentBox?.subscription_status ?? 'trial'} />
          </div>

          <Separator className="bg-primary/5" />

          {/* Trial ends at */}
          {currentBox?.subscription_status === 'trial' && (
            <div className="space-y-1">
              <p className="text-sm font-medium">{t('settings.subscription.trial_ends')}</p>
              <p className="text-2xl font-bold">
                {daysRemaining} {t('settings.subscription.days_left')}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('settings.subscription.trial_ends_on')}: {formattedTrialEnd}
              </p>
            </div>
          )}

          {/* CTA upgrade */}
          <Button asChild className="w-full gap-2">
            <a href="mailto:soporte@boxora.com">
              <ArrowUpCircle className="h-4 w-4" />
              {t('settings.subscription.upgrade_cta')}
            </a>
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            {t('settings.subscription.upgrade_help')}
          </p>
        </CardContent>
      </Card>
    </div>
  </TabsContent>
)}
```

### Cálculo de días restantes

```tsx
// Al inicio del componente Settings, junto a los demás states:
const trialEndsAt = (currentBox as any)?.trial_ends_at as string | null;
const daysRemaining = trialEndsAt
  ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86400000))
  : 0;
const formattedTrialEnd = trialEndsAt
  ? new Date(trialEndsAt).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })
  : '—';
```

### StatusBadge reutilizable

`Settings.tsx` no tiene un `StatusBadge`. Importar desde `SuperAdmin.tsx` si se extrae a un
componente compartido, o re-implementar localmente de forma simple:

```tsx
const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  active:    { label: 'Activo',     className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  trial:     { label: 'Trial',      className: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  suspended: { label: 'Suspendido', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
  cancelled: { label: 'Cancelado',  className: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30' },
};
```

### Key Constraints

- Usar el mismo patrón de clase en `TabsTrigger` que los tabs existentes (copy-paste exacto del estilo).
- No modificar el `defaultValue` del `Tabs` ("branding") — el admin puede navegar manualmente al tab.
- `isAdmin` ya está disponible en el AuthContext; verificar si `Settings.tsx` ya lo importa.

### References in Codebase

- `src/pages/Settings.tsx` — archivo a modificar (leer completo primero)
- `src/pages/SuperAdmin.tsx` — patrón de `StatusBadge` y colores por status (líneas 36-50)
- `src/contexts/AuthContext.tsx` — `isAdmin` y `currentBox`

---

## Acceptance Criteria

- [ ] Tab "Suscripción" aparece en `/settings` cuando el usuario es admin.
- [ ] Tab "Suscripción" NO aparece cuando el usuario es coach, receptionist, o athlete.
- [ ] El badge de status muestra el valor correcto según `currentBox.subscription_status`.
- [ ] Si `subscription_status === 'trial'`, muestra días restantes calculados desde `trial_ends_at`.
- [ ] El CTA "Contactar para upgrade" es un link `mailto:soporte@boxora.com`.
- [ ] Los tabs existentes (Branding, Apariencia, etc.) siguen funcionando igual.
- [ ] `npx tsc --noEmit` pasa sin errores en `Settings.tsx`.

---

## Test Specification

```
Pasos de verificación manual:

1. Login como admin → ir a /settings.
   ✓ Tab "Suscripción" visible al final del TabsList.

2. Click en tab "Suscripción".
   ✓ Badge de status correcto.
   ✓ Días restantes calculados (con trial_ends_at del box).
   ✓ Botón "Contactar para upgrade" visible.

3. Login como coach → ir a /settings.
   ✓ Tab "Suscripción" no aparece.
   ✓ Tabs existentes siguen funcionando.

4. Cambiar subscription_status a 'active' en Supabase → recargar settings.
   ✓ Badge muestra "Activo".
   ✓ Sección "días restantes" no aparece (es solo para trial).
```

---

## Agent Instructions

When you pick up this task:

1. **Leer `src/pages/Settings.tsx` completo** antes de modificar.
2. **Check dependencies** — TASK-011 en `completed/` (necesitas `trial_ends_at` en DB y tipo TypeScript).
3. **Update status** en el index → `"in-progress"`.
4. **Identificar** el punto de inserción en TabsList y Tabs.
5. **Implementar** el TabsTrigger y TabsContent.
6. **Agregar** las claves i18n necesarias al archivo de traducción (namespace `settings.subscription.*`).
7. **Verificar** visualmente con admin y no-admin.
8. **Mover** a completed y actualizar el index.

---

## Completion Note

*(Agent fills this in when done)*

**Completed by**: antigravity
**Date**: 2026-03-04
**Notes**: Implementado en src/pages/Settings.tsx (líneas 439-443 TabsTrigger, líneas 928-980 TabsContent). Incluye badge de status con STATUS_LABELS, cálculo de daysRemaining y formattedTrialEnd, y CTA mailto. Compila sin errores en archivos admin.
**Deviations from spec**: Tab "Zona de Peligro" fue implementado en el mismo archivo simultáneamente (TASK-019).
