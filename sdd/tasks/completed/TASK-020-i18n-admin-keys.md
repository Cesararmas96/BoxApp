# TASK-020: Add i18n translation keys for admin panel

**Feature**: Panel Administrativo de Box
**Spec**: `sdd/specs/panel-administrativo.spec.md`
**Status**: pending
**Priority**: low
**Estimated effort**: S (< 2h)
**Depends-on**: none
**Assigned-to**: unassigned

---

## Context

Todos los textos del panel administrativo deben estar en el sistema de internacionalización
(`react-i18next`) para mantener consistencia con el resto de la app. Este task puede ejecutarse
en paralelo con los demás tasks ya que solo agrega claves al archivo de traducciones, sin
modificar lógica de componentes.

Las claves deben estar disponibles antes de que los componentes se integren, aunque los
componentes pueden funcionar con strings hardcodeados temporalmente durante desarrollo y
migrar a `t()` al hacer el PR.

Implementa el **Module 10** de la spec (sección 3).

---

## Scope

- Identificar el archivo de traducciones en español del proyecto.
- Agregar todas las claves necesarias bajo los namespaces `admin.*` y `settings.*` (extensiones).
- NO agregar traducciones en otros idiomas (si los hay) — ese es un task futuro.
- NO modificar claves existentes.

**NOT in scope**: Usar las claves en los componentes (eso lo hacen TASK-012 a TASK-019).

---

## Files to Create / Modify

| File | Action | Description |
|---|---|---|
| Archivo de traducciones ES (buscar en `src/i18n/` o `src/locales/`) | MODIFY | Agregar claves admin.* y settings.subscription.* y settings.danger.* |

---

## Implementation Notes

### Encontrar el archivo de traducciones

Buscar en:
- `src/i18n/locales/es/translation.json`
- `src/i18n/es.json`
- `src/locales/es.json`
- `public/locales/es/translation.json`

Ejecutar: `find src public -name "*.json" | xargs grep -l "dashboard\|settings"` para localizarlo.

### Claves a agregar

```json
{
  "admin": {
    "kpi": {
      "revenue": "Ingresos del mes",
      "members": "Nuevos miembros",
      "sessions_today": "Clases hoy",
      "occupancy": "Ocupación promedio"
    },
    "alerts": {
      "title": "Alertas operativas",
      "empty": "Todo en orden",
      "empty_desc": "No hay alertas operativas pendientes.",
      "overdue_payments": "{{count}} pago vencido",
      "overdue_payments_plural": "{{count}} pagos vencidos",
      "inactive_members": "{{count}} miembro sin actividad en 30 días",
      "inactive_members_plural": "{{count}} miembros sin actividad en 30 días",
      "high_occupancy": "{{count}} clase con ocupación alta",
      "view_payments": "Ver pagos",
      "view_members": "Ver miembros"
    },
    "quick_actions": {
      "title": "Acciones rápidas",
      "new_class": "Nueva Clase",
      "register_payment": "Registrar Pago",
      "invite_member": "Invitar Miembro",
      "new_class_dialog_title": "Nueva Clase",
      "new_class_name": "Nombre de la clase",
      "new_class_date": "Fecha y hora",
      "new_class_capacity": "Capacidad máxima",
      "payment_dialog_title": "Registrar Pago",
      "payment_amount": "Monto",
      "payment_description": "Descripción",
      "member_dialog_title": "Invitar Miembro",
      "member_email": "Email del miembro",
      "member_name": "Nombre completo",
      "save": "Guardar",
      "cancel": "Cancelar",
      "success_class": "Clase creada exitosamente",
      "success_payment": "Pago registrado exitosamente",
      "success_member": "Miembro invitado exitosamente"
    },
    "my_box": {
      "title": "Mi Box",
      "name": "Nombre",
      "slug": "Slug (URL)",
      "status": "Estado",
      "configure": "Configurar Box →"
    }
  },
  "settings": {
    "tabs": {
      "subscription": "Suscripción",
      "danger_zone": "Zona de Peligro"
    },
    "subscription": {
      "title": "Plan de Suscripción",
      "desc": "Estado actual de tu suscripción a Boxora.",
      "current_plan": "Plan actual",
      "plan_desc": "Tu box en la plataforma Boxora",
      "trial_ends": "Tiempo restante de prueba",
      "days_left": "días restantes",
      "trial_ends_on": "Vence el",
      "upgrade_cta": "Contactar para upgrade",
      "upgrade_help": "Escríbenos a soporte@boxora.com para conocer los planes disponibles."
    },
    "danger": {
      "change_slug_title": "Cambiar URL del Box",
      "change_slug_desc": "Cambia el slug que identifica tu box en la URL. La URL anterior dejará de funcionar inmediatamente.",
      "new_slug": "Nuevo slug",
      "slug_invalid": "El slug solo puede contener letras minúsculas, números y guiones, y debe tener entre 3 y 50 caracteres.",
      "slug_taken": "Este slug ya está en uso por otro box.",
      "slug_warning": "La URL anterior dejará de funcionar tras el cambio.",
      "change_slug_btn": "Cambiar slug",
      "confirm_slug_title": "¿Cambiar el slug del box?",
      "confirm_slug_desc": "El slug cambiará a '{{slug}}'. La URL anterior dejará de funcionar.",
      "slug_success": "Slug actualizado correctamente. Recuerda compartir la nueva URL.",
      "pause_title": "Pausar Box",
      "pause_desc": "Suspende temporalmente tu box. Solo el soporte de Boxora puede reactivarlo.",
      "pause_btn": "Pausar Box",
      "confirm_pause_title": "¿Pausar el box?",
      "confirm_pause_desc": "Tu box quedará suspendido y no estará accesible para los miembros. Solo el soporte de Boxora puede reactivarlo. ¿Continuar?",
      "confirm_pause_btn": "Sí, pausar",
      "pause_success": "Box pausado. Contacta a soporte@boxora.com para reactivarlo."
    }
  },
  "subscription": {
    "banner": {
      "trial": "Trial · {{days}} días restantes",
      "trial_urgent": "⚠️ Trial vence en {{days}} días",
      "suspended": "Tu box está suspendido.",
      "cancelled": "Tu suscripción fue cancelada.",
      "upgrade_btn": "Actualizar plan",
      "contact_support": "Contactar soporte →"
    }
  }
}
```

### Key Constraints

- Mantener la estructura JSON existente del archivo. Las claves nuevas se agregan como
  nuevas entradas al nivel raíz correspondiente (no reemplazar objetos existentes).
- Si el archivo usa una estructura plana (sin anidamiento), adaptar las claves a ese formato:
  `"admin_kpi_revenue"` en lugar de `"admin": { "kpi": { "revenue": ... } }`.
- Las claves con `{{count}}` y `{{days}}` siguen el patrón de interpolación de i18next.

### References in Codebase

- `src/pages/Settings.tsx` — ver cómo se usan claves `t('settings.tabs.branding')` para inferir estructura
- `src/pages/Dashboard.tsx` — ver el patrón de uso de `t()` en el dashboard existente

---

## Acceptance Criteria

- [ ] El archivo de traducciones ES existe y fue localizado correctamente.
- [ ] Todas las claves `admin.*` listadas arriba están presentes en el archivo.
- [ ] Todas las claves `settings.subscription.*` y `settings.danger.*` están presentes.
- [ ] Las claves `subscription.banner.*` están presentes.
- [ ] El JSON es válido (sin errores de sintaxis). Verificar con `node -e "JSON.parse(require('fs').readFileSync('<path>'))"`.
- [ ] No se eliminaron ni modificaron claves existentes.

---

## Test Specification

```bash
# Verificar que el JSON es válido (reemplazar con la ruta real del archivo):
node -e "JSON.parse(require('fs').readFileSync('src/i18n/locales/es/translation.json', 'utf8')); console.log('JSON válido')"

# Verificar que las claves clave están presentes:
node -e "
  const t = JSON.parse(require('fs').readFileSync('src/i18n/locales/es/translation.json', 'utf8'));
  const required = ['admin', 'settings.subscription', 'settings.danger', 'subscription.banner'];
  required.forEach(key => {
    const parts = key.split('.');
    let obj = t;
    for (const part of parts) {
      obj = obj?.[part];
    }
    console.log(key + ': ' + (obj ? '✓' : '✗ MISSING'));
  });
"
```

---

## Agent Instructions

When you pick up this task:

1. **Localizar** el archivo de traducciones en español (buscar en `src/i18n/` y `public/locales/`).
2. **No hay dependencias** — este task puede ejecutarse en paralelo con cualquier otro.
3. **Update status** en el index → `"in-progress"`.
4. **Leer el archivo existente** para entender la estructura (plana vs anidada).
5. **Agregar las claves** respetando la estructura existente.
6. **Verificar** que el JSON resultante es válido.
7. **Mover** a completed y actualizar el index.

---

## Completion Note

*(Agent fills this in when done)*

**Completed by**: unassigned
**Date**: —
**Notes**: Ruta del archivo de traducciones encontrado: ___
**Deviations from spec**: none
