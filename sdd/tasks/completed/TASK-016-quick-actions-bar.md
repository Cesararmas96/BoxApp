# TASK-016: Implement QuickActionsBar with inline dialogs

**Feature**: Panel Administrativo de Box
**Spec**: `sdd/specs/panel-administrativo.spec.md`
**Status**: pending
**Priority**: high
**Estimated effort**: L (4-8h)
**Depends-on**: TASK-011
**Assigned-to**: unassigned

---

## Context

`QuickActionsBar` es la sección de acciones rápidas del tab "Operaciones" en el Dashboard admin.
Permite al admin ejecutar las 3 tareas operativas más comunes sin navegar fuera del dashboard:
crear una clase, registrar un pago, e invitar a un miembro. Cada acción abre un `Dialog` in-situ
con un formulario mínimo que persiste directamente en Supabase.

Implementa el **Module 6** de la spec (sección 3).

---

## Scope

- Crear `src/components/admin/QuickActionsBar.tsx`.
- Tres botones con sus respectivos `Dialog` in-situ:
  1. **Nueva Clase**: campos mínimos (nombre, fecha, hora, capacidad máxima).
  2. **Registrar Pago**: campos mínimos (miembro, monto, descripción).
  3. **Invitar Miembro**: campo email → INSERT en `profiles` o trigger de invitación.
- Cada Dialog tiene:
  - Estado de carga mientras persiste.
  - Toast de éxito al completar (`useToast` o similar).
  - Mensaje de error inline si falla.
  - Botón "Cancelar" que cierra el dialog y limpia el formulario.
- Los INSERTs usan `supabase` directamente con el `box_id` del `currentBox`.
- Exportar desde `src/components/admin/index.ts`.

**NOT in scope**: Integración en el Dashboard (TASK-017), formularios avanzados de `/schedule` o `/billing`.

---

## Files to Create / Modify

| File | Action | Description |
|---|---|---|
| `src/components/admin/QuickActionsBar.tsx` | CREATE | Barra con 3 acciones + dialogs |
| `src/components/admin/index.ts` | MODIFY | Agregar export |

---

## Implementation Notes

### Estructura general del componente

```tsx
export const QuickActionsBar: React.FC = () => {
  const { currentBox } = useAuth();
  const [openDialog, setOpenDialog] = useState<'class' | 'payment' | 'member' | null>(null);

  return (
    <div className="flex flex-wrap gap-3">
      <Button onClick={() => setOpenDialog('class')} variant="outline" className="gap-2">
        <Calendar className="h-4 w-4" /> Nueva Clase
      </Button>
      <Button onClick={() => setOpenDialog('payment')} variant="outline" className="gap-2">
        <DollarSign className="h-4 w-4" /> Registrar Pago
      </Button>
      <Button onClick={() => setOpenDialog('member')} variant="outline" className="gap-2">
        <UserPlus className="h-4 w-4" /> Invitar Miembro
      </Button>

      {/* Dialogs */}
      <NewClassDialog
        open={openDialog === 'class'}
        onClose={() => setOpenDialog(null)}
        boxId={currentBox?.id ?? ''}
      />
      {/* ... otros dialogs */}
    </div>
  );
};
```

### Dialog: Nueva Clase

Campos mínimos del INSERT a la tabla `sessions`:
```typescript
{
  box_id: string,        // currentBox.id
  title: string,         // nombre de la clase, required
  start_time: string,    // datetime ISO, required
  max_capacity: number,  // entero positivo, required, default 20
  coach_id?: string,     // opcional para MVP
}
```

### Dialog: Registrar Pago

Campos mínimos del INSERT a la tabla `invoices` o `expenses`:
```typescript
{
  box_id: string,
  amount: number,       // monto en la moneda del box, required
  description: string,  // descripción breve, required
  member_id?: string,   // seleccionar de lista de profiles (opcional)
  status: 'paid',       // siempre 'paid' desde Quick Action
}
```

> **Nota**: Verificar el schema de `invoices` antes de implementar. Si no tiene todos estos campos,
> usar los que existan. No crear columnas nuevas en este task.

### Dialog: Invitar Miembro

Insertar un nuevo profile vinculado al box:
```typescript
// Opción A: Si Supabase Auth admin invite está disponible
await supabase.auth.admin.inviteUserByEmail(email); // requiere service key (NO disponible en cliente)

// Opción B (para MVP): INSERT en profiles con un email placeholder
// El admin luego asigna credenciales manualmente
await supabase.from('profiles').insert({
  box_id: currentBox.id,
  email: emailInput,     // campo email en profiles si existe
  role_id: 'athlete',    // rol por defecto
  full_name: nameInput,
});
```

> **Importante**: Revisar el schema de `profiles` antes de implementar. Usar solo los campos
> que ya existen. Si no hay un mecanismo de invitación, crear el profile mínimo viable y
> documentar en el Completion Note que la invitación por email es una mejora futura.

### Toast de éxito

Revisar cómo se usa toast en el codebase. Buscar `toast` o `useToast` en `src/`. Si existe
`src/components/ui/toast-custom.tsx`, seguir ese patrón. Si no, usar un estado local de
`message: { type, text } | null` similar al patrón en `Settings.tsx`.

### Key Constraints

- **Nunca usar `currentBox.id` sin verificar que es truthy** antes de hacer INSERT.
- **Validar campos requeridos** en cliente antes de enviar. Deshabilitar el botón "Guardar"
  si hay campos vacíos.
- **Limpiar el formulario** cuando se cierra el dialog (estado reset).
- **No reutilizar lógica de `/schedule` o `/billing`** — usar INSERTs directos simples
  para evitar acoplamiento. La simplicidad del formulario es intencional.

### References in Codebase

- `src/components/ui/dialog.tsx` — Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
- `src/components/ui/input.tsx` — Input component
- `src/components/ui/button.tsx` — Button variants
- `src/components/ui/label.tsx` — Label para formularios
- `src/pages/Settings.tsx` — patrón de message state con `{ type: 'success' | 'error', text }` (líneas 61-62)
- `src/lib/supabaseClient.ts` — cliente Supabase

---

## Acceptance Criteria

- [ ] Los 3 botones de acción rápida son visibles en el tab "Operaciones" (cuando TASK-017 esté integrado).
- [ ] Click en "Nueva Clase" abre un Dialog con formulario. Guardar inserta en `sessions`.
- [ ] Click en "Registrar Pago" abre un Dialog. Guardar inserta en la tabla de pagos correcta.
- [ ] Click en "Invitar Miembro" abre un Dialog. Guardar crea un profile/usuario en el box.
- [ ] Cada Dialog muestra loading mientras persiste y cierra al éxito.
- [ ] Si el INSERT falla, muestra error inline (no crashea).
- [ ] Al cerrar el dialog (Cancelar o éxito), el formulario se resetea.
- [ ] Los botones "Guardar" están deshabilitados si campos requeridos están vacíos.
- [ ] Todos los INSERTs incluyen el `box_id` correcto.
- [ ] `npx tsc --noEmit` pasa sin errores.

---

## Test Specification

```
Pasos de verificación manual:

1. Abrir el tab "Operaciones" como admin.
2. Click "Nueva Clase" → llenar nombre "Test Clase", fecha de hoy, capacidad 15 → Guardar.
   → Verificar en /schedule o Supabase que la clase aparece.

3. Click "Registrar Pago" → llenar monto "100", descripción "Test" → Guardar.
   → Verificar en Supabase tabla invoices/expenses.

4. Click "Invitar Miembro" → llenar email "test@test.com", nombre "Test User" → Guardar.
   → Verificar en Supabase tabla profiles.

5. Probar cancelar cada dialog → formulario debe quedar limpio al reabrir.

6. Forzar error (ej: enviar sin box_id o con datos inválidos via devtools).
   → Error inline visible, dialog permanece abierto.
```

---

## Agent Instructions

When you pick up this task:

1. **Leer la spec** — Module 6, sección 3; y sección 6 (Implementation Notes / Constraints).
2. **Check dependencies** — TASK-011 debe estar en completed (necesitas el schema actualizado).
3. **Revisar** el schema de `sessions`, `invoices`/`expenses`, y `profiles` en Supabase antes de implementar.
4. **Update status** en el index → `"in-progress"`.
5. **Implementar** los 3 dialogs con sus respectivos formularios mínimos.
6. **Verificar** manualmente cada acción rápida.
7. **Documentar** en Completion Note si alguna acción (especialmente Invitar Miembro) requiere
   un enfoque alternativo al especificado.
8. **Mover** a completed y actualizar el index.

---

## Completion Note

*(Agent fills this in when done)*

**Completed by**: unassigned
**Date**: —
**Notes**: —
**Deviations from spec**: none
