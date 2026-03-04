# TASK-017: Add admin tabs (Operaciones + Mi Box) to Dashboard

**Feature**: Panel Administrativo de Box
**Spec**: `sdd/specs/panel-administrativo.spec.md`
**Status**: pending
**Priority**: high
**Estimated effort**: L (4-8h)
**Depends-on**: TASK-014, TASK-015, TASK-016
**Assigned-to**: unassigned

---

## Context

Este task transforma el Dashboard existente para que el admin tenga una vista ejecutiva completa.
El contenido actual del dashboard se envuelve en un tab "Resumen" (visible para todos). Se agregan
dos tabs nuevos: "Operaciones" (KPIs + alertas + quick actions) y "Mi Box" (estado del box +
links a configuración) — visibles únicamente cuando `isAdmin === true`.

Implementa el **Module 7** de la spec (sección 3).

---

## Scope

- Leer y entender `src/pages/Dashboard.tsx` completo antes de modificar.
- Envolver el contenido existente del Dashboard en un `Tab` con valor `"resumen"`.
- Agregar, condicionalmente si `isAdmin`, dos tabs más: `"operaciones"` y `"mi-box"`.
- **Tab "Operaciones"**: cargar en paralelo con `Promise.all` las 4 métricas de KPI al montar.
  Renderizar `KpiCard × 4`, `AlertsPanel`, `QuickActionsBar`.
- **Tab "Mi Box"**: mostrar `BoxStatusCard` (componente simple inline, no crear archivo separado)
  con: nombre del box, slug, status badge, `trial_ends_at`, y links directos a tabs de `/settings`.
- Lógica de generación de alertas dentro del tab "Operaciones":
  - Pagos vencidos: `SELECT COUNT(*) FROM invoices WHERE box_id=? AND status='pending' AND due_date < now()`.
  - Miembros inactivos: `SELECT COUNT(*) FROM profiles WHERE box_id=? AND last_class_at < now() - INTERVAL '30 days'`.
  - Clases con alta ocupación: si alguna clase hoy tiene bookings > 90% de su capacidad.

**NOT in scope**: Crear los sub-componentes `KpiCard`, `AlertsPanel`, `QuickActionsBar` (están en TASK-014, TASK-015, TASK-016).

---

## Files to Create / Modify

| File | Action | Description |
|---|---|---|
| `src/pages/Dashboard.tsx` | MODIFY | Agregar Tabs, lógica de KPIs y alertas |

---

## Implementation Notes

### Leer Dashboard antes de modificar

`Dashboard.tsx` puede tener contenido complejo. Leerlo completo antes de modificar para
entender su estructura y evitar romper el comportamiento existente.

### Envolver contenido existente en Tabs

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { KpiCard, AlertsPanel, QuickActionsBar, AdminAlert } from '@/components/admin';
import { useAuth } from '@/contexts/AuthContext';

// En el componente Dashboard:
const { isAdmin, currentBox } = useAuth();

// JSX:
<Tabs defaultValue="resumen" className="w-full">
  <TabsList className="...">  {/* mismo estilo que en Settings.tsx */}
    <TabsTrigger value="resumen">Resumen</TabsTrigger>
    {isAdmin && <TabsTrigger value="operaciones">Operaciones</TabsTrigger>}
    {isAdmin && <TabsTrigger value="mi-box">Mi Box</TabsTrigger>}
  </TabsList>

  <TabsContent value="resumen">
    {/* CONTENIDO EXISTENTE DEL DASHBOARD, sin modificar */}
  </TabsContent>

  {isAdmin && (
    <TabsContent value="operaciones">
      {/* KPIs + Alertas + Quick Actions */}
    </TabsContent>
  )}

  {isAdmin && (
    <TabsContent value="mi-box">
      {/* BoxStatusCard */}
    </TabsContent>
  )}
</Tabs>
```

### Fetch de métricas en paralelo

```tsx
// Estados para cada métrica
const [revenue, setRevenue] = useState<{ value: number; delta?: number; loading: boolean; error: boolean }>
  ({ value: 0, loading: true, error: false });
// ... repetir para members, sessions, occupancy

useEffect(() => {
  if (!isAdmin || !currentBox?.id) return;

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const today = new Date().toISOString().split('T')[0];

  const loadMetrics = async () => {
    const [revenueResult, membersResult, sessionsResult] = await Promise.allSettled([
      supabase.from('invoices')
        .select('amount')
        .eq('box_id', currentBox.id)
        .gte('created_at', startOfMonth.toISOString()),
      supabase.from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('box_id', currentBox.id)
        .gte('created_at', startOfMonth.toISOString()),
      supabase.from('sessions')
        .select('id', { count: 'exact', head: true })
        .eq('box_id', currentBox.id)
        .gte('start_time', `${today}T00:00:00`)
        .lte('start_time', `${today}T23:59:59`),
    ]);

    // Procesar cada resultado independientemente
    if (revenueResult.status === 'fulfilled' && !revenueResult.value.error) {
      const total = revenueResult.value.data?.reduce((sum, r) => sum + (r.amount ?? 0), 0) ?? 0;
      setRevenue({ value: total, loading: false, error: false });
    } else {
      setRevenue(prev => ({ ...prev, loading: false, error: true }));
    }
    // ... similar para members y sessions
  };

  loadMetrics();
}, [isAdmin, currentBox?.id]);
```

### Generación de alertas

```tsx
const [alerts, setAlerts] = useState<AdminAlert[]>([]);
const [alertsLoading, setAlertsLoading] = useState(true);

useEffect(() => {
  if (!isAdmin || !currentBox?.id) return;

  const loadAlerts = async () => {
    const generated: AdminAlert[] = [];

    // 1. Pagos vencidos
    const { count: overdueCount } = await supabase
      .from('invoices')
      .select('id', { count: 'exact', head: true })
      .eq('box_id', currentBox.id)
      .eq('status', 'pending')
      .lt('due_date', new Date().toISOString());

    if (overdueCount && overdueCount > 0) {
      generated.push({
        id: 'overdue-payments',
        type: 'error',
        message: `${overdueCount} pago${overdueCount > 1 ? 's' : ''} vencido${overdueCount > 1 ? 's' : ''}`,
        actionLabel: 'Ver pagos',
        actionHref: '/billing',
      });
    }

    // 2. Miembros inactivos (30 días sin clase)
    // Nota: solo si profiles tiene campo 'last_class_at'. Verificar schema.
    // Si no existe, omitir esta alerta en MVP y documentar en Completion Note.

    setAlerts(generated.slice(0, 5)); // máximo 5 alertas
    setAlertsLoading(false);
  };

  loadAlerts();
}, [isAdmin, currentBox?.id]);
```

### BoxStatusCard (inline en el tab "Mi Box")

```tsx
// No crear componente separado, implementar inline en TabsContent "mi-box"
<TabsContent value="mi-box">
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    <Card>
      <CardHeader>
        <CardTitle>Estado del Box</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div><span className="text-muted-foreground text-sm">Nombre</span>
            <p className="font-medium">{currentBox?.name}</p></div>
          <div><span className="text-muted-foreground text-sm">Slug</span>
            <p className="font-mono text-sm">{currentBox?.slug}</p></div>
          <div><span className="text-muted-foreground text-sm">Estado</span>
            <StatusBadge status={currentBox?.subscription_status} /></div>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" asChild>
          <Link to="/settings">Configurar Box →</Link>
        </Button>
      </CardFooter>
    </Card>
    {/* Links rápidos a tabs de settings */}
  </div>
</TabsContent>
```

### Key Constraints

- **Verificar el schema de `invoices` y `sessions`** antes de escribir las queries. Los nombres
  de columnas pueden diferir del spec (e.g., `start_time` vs `date`, `amount` vs `total`).
  Ajustar queries según el schema real.
- **Usar `Promise.allSettled`** (no `Promise.all`) para que un fallo en una query no cancele las demás.
- **Respetar el estilo de tabs** de `Settings.tsx` (líneas 356-362) para consistencia visual.
- **No modificar** el tab "Resumen" (contenido existente del dashboard).

### References in Codebase

- `src/pages/Settings.tsx` — patrón exacto de Tabs/TabsList/TabsTrigger/TabsContent (líneas 356-362)
- `src/pages/Analytics.tsx` — queries de métricas existentes que pueden adaptarse
- `src/components/admin/` — KpiCard, AlertsPanel, QuickActionsBar ya implementados

---

## Acceptance Criteria

- [ ] Admin ve 3 tabs en el dashboard: "Resumen", "Operaciones", "Mi Box".
- [ ] Usuarios no-admin ven solo el tab "Resumen" (sin tabs adicionales visibles).
- [ ] Tab "Resumen": contenido existente del dashboard sin cambios.
- [ ] Tab "Operaciones": 4 KpiCards con datos reales del mes (o `—` si error).
- [ ] Tab "Operaciones": AlertsPanel con alertas o estado vacío positivo.
- [ ] Tab "Operaciones": QuickActionsBar con los 3 botones de acción.
- [ ] Tab "Mi Box": nombre, slug, status del box, link a `/settings`.
- [ ] Las métricas se cargan en paralelo (no secuencialmente).
- [ ] Un fallo en una query de KPI no bloquea las demás.
- [ ] El dashboard existente (tab Resumen) sigue funcionando igual para todos los roles.
- [ ] `npx tsc --noEmit` pasa sin errores.

---

## Test Specification

```
Pasos de verificación manual:

1. Login como admin → ir a /dashboard.
   ✓ Tres tabs visibles: Resumen, Operaciones, Mi Box.

2. Click en "Operaciones".
   ✓ 4 KPI cards se muestran (pueden estar en loading brevemente).
   ✓ AlertsPanel carga (vacío o con alertas reales).
   ✓ QuickActionsBar con 3 botones visibles.

3. Click en "Mi Box".
   ✓ Nombre y slug del box visibles.
   ✓ Badge de status correcto.
   ✓ Link a /settings funciona.

4. Login como coach → ir a /dashboard.
   ✓ Solo tab "Resumen" visible.
   ✓ Ningún elemento de admin visible.

5. Forzar fallo de red en DevTools → ir a tab Operaciones.
   ✓ KPI cards con error muestran "—".
   ✓ Otros cards no afectados (si la red se recupera parcialmente).
```

---

## Agent Instructions

When you pick up this task:

1. **Leer `src/pages/Dashboard.tsx` completo** antes de modificar.
2. **Check dependencies** — TASK-014, TASK-015, TASK-016 en `completed/`.
3. **Revisar el schema real** de `invoices` y `sessions` en Supabase antes de escribir queries.
4. **Update status** en el index → `"in-progress"`.
5. **Implementar** con cuidado de no romper el contenido existente del dashboard.
6. **Ajustar queries** según el schema real; documentar diferencias en Completion Note.
7. **Verificar** manualmente con roles admin y no-admin.
8. **Mover** a completed y actualizar el index.

---

## Completion Note

*(Agent fills this in when done)*

**Completed by**: unassigned
**Date**: —
**Notes**: —
**Deviations from spec**: none
