# Análisis de puntos de mejora de BoxApp

Este documento resume los principales puntos de mejora detectados en el estado actual del proyecto para facilitar una hoja de ruta técnica.

## 1) Calidad de código y mantenibilidad (prioridad alta)

- **Estado actual:** El lint falla con un volumen alto de incidencias (principalmente `any`, dependencias faltantes en hooks y algunas reglas de estilo).
- **Impacto:** Menor seguridad de tipos, más riesgo de bugs en runtime y deuda técnica creciente.
- **Recomendaciones:**
  1. Crear un plan por lotes para eliminar `any` en módulos críticos (`pages`, `competitions`, `utils`).
  2. Corregir dependencias de `useEffect`/`useMemo` para evitar estados inconsistentes.
  3. Activar una política de CI que bloquee merges cuando `npm run lint` falle.

## 2) Performance de frontend (prioridad alta)

- **Estado actual:** El build genera al menos un chunk principal muy grande (más de 2 MB minificado) y Vite alerta por chunks >500 kB.
- **Impacto:** Carga inicial lenta, peor experiencia en móviles y peores métricas Core Web Vitals.
- **Recomendaciones:**
  1. Aplicar **code splitting** por rutas con `React.lazy`/`Suspense`.
  2. Definir `manualChunks` en Vite/Rollup para aislar librerías pesadas (charts, PDFs, DnD).
  3. Revisar páginas con alta complejidad (`Wods`, módulos de competiciones) y extraer funcionalidades diferidas.

## 3) Arquitectura de componentes (prioridad media-alta)

- **Estado actual:** Existen pantallas/componentes con alta responsabilidad y múltiples flujos en un mismo archivo.
- **Impacto:** Dificulta pruebas, onboarding y evolución funcional.
- **Recomendaciones:**
  1. Dividir componentes grandes en submódulos por dominio (hooks, servicios, UI pura).
  2. Centralizar acceso a datos de Supabase en capas reutilizables.
  3. Reducir duplicación de lógica de formularios y tablas con componentes compartidos.

## 4) Tipado de dominio y contratos (prioridad media-alta)

- **Estado actual:** Los modelos de dominio de competiciones aún usan tipado flexible en varios puntos.
- **Impacto:** Inconsistencias entre UI, lógica de negocio y datos persistidos.
- **Recomendaciones:**
  1. Fortalecer `src/types/*` con tipos discriminados y utilidades comunes.
  2. Añadir validación de payloads en bordes (formularios y respuestas de backend).
  3. Definir contratos claros para score, heats, jueces, eventos y leaderboard.

## 5) Automatización de calidad (prioridad media)

- **Estado actual:** No hay evidencia de pipeline formal de tests en los scripts principales del proyecto.
- **Impacto:** Regresiones más probables y dependencia de validación manual.
- **Recomendaciones:**
  1. Incorporar pruebas unitarias para utilidades (`heatGenerator`, lógica de scoring).
  2. Añadir pruebas de integración para flujos críticos (auth, gestión de competiciones, creación de WOD).
  3. Ejecutar lint + tests + build en CI en cada PR.

## 6) Higiene de repositorio y configuración (prioridad media)

- **Estado actual:** Se observa un archivo de respaldo (`src/main.tsx.bak`) y señales de configuración pendiente de depuración.
- **Impacto:** Ruido en el repositorio, riesgo de confusión y potencial deuda de configuración.
- **Recomendaciones:**
  1. Eliminar archivos temporales/respaldo que no aporten al build.
  2. Revisar dependencias y tipos legacy para reducir peso y complejidad.
  3. Documentar decisiones técnicas clave en `README` (arquitectura, convenciones, testing).

## Roadmap sugerido (4 semanas)

- **Semana 1:** saneamiento de lint en módulos críticos + limpieza de repositorio.
- **Semana 2:** code splitting por rutas y chunking manual.
- **Semana 3:** refactor de componentes grandes (WOD/competitions) y hardening de tipos.
- **Semana 4:** base de testing automatizado y CI con reglas de calidad.

## KPIs para seguimiento

- Errores de lint: de baseline actual a 0 en fases.
- Tamaño de bundle principal: reducir al menos 30–50%.
- Tiempo de carga inicial (LCP/TTI): mejora medible en entorno real.
- Cobertura mínima en utilidades críticas y flujos principales.

