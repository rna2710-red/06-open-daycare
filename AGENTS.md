<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Commands

- `npm run lint` — ESLint 9 flat config (`eslint.config.mjs`)
- `npm run build` — production build; also the only typecheck gate (no separate typecheck script)
- No test framework is configured — don't invent test commands. Verify changes with `npm run lint` + `npm run build`.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript strict. App dir is `app/` at repo root (no `src/`).
- Tailwind v4, CSS-first config: theme tokens live in `app/globals.css` (`@import "tailwindcss"` + `@theme`). There is no `tailwind.config.js` — don't create one.
- **Supabase** — Backend as a Service: base de datos Postgres, autenticación, Edge Functions, Storage, Realtime. Paquetes: `@supabase/supabase-js` + `@supabase/ssr`.

## Supabase Client Setup

Helpers en `utils/supabase/` para interactuar con Supabase desde Next.js:

- `server.ts` — Client helper para Server Components y Route Handlers. Recibe `cookies()` como parámetro.
- `client.ts` — Client helper para Client Components (browser). Se usa con `"use client"`.
- `middleware.ts` — Helper para middleware que mantiene las sesiones refresh.

**Uso:**
- Server Components: `import { createClient } from '@/utils/supabase/server'` → `createClient(cookieStore)`
- Client Components: `import { createClient } from '@/utils/supabase/client'` → `createClient()`
- Middleware: `import { createClient } from '@/utils/supabase/middleware'` → `createClient(request)`

## Login — Fix conocido (2026-09-29)

El login no redirigía al home aunque las credenciales fueran correctas. Causa raíz doble:

1. **Bug en `utils/supabase/middleware.ts`**: `getAll()` usaba `request.cookies.toString()` en vez de `request.headers.get("Cookie")`. El patrón correcto según Supabase SSR es leer el header raw `Cookie`:
   ```ts
   // ❌ Incorrecto
   getAll() { return parseCookieHeader(request.cookies.toString()); }
   // ✅ Correcto
   getAll() { return parseCookieHeader(request.headers.get("Cookie") ?? ""); }
   ```
2. **Credenciales inválidas**: La contraseña en `auth.users` no coincidía con la esperada. Supabase rechazaba con HTTP 400 (`invalid_credentials`), por lo que el redirect nunca se ejecutaba.

**Regla**: Al debuggear login, siempre verificar primero los logs de Supabase (`source: auth_logs`) para descartar credenciales incorrectas antes de revisar el código.

## UI source of truth: `references/`

- `app/page.tsx` is still create-next-app boilerplate; the product design exists only in `references/`.
- `references/pantallas/*.dc.html` — self-contained HTML mockups of every screen (login, feed, niños, perfil-niño, resumen-día, vincular-padre, avisos, …). Read the matching mockup before building any screen; they define layout, colors, and copy.
- `references/screenshots/*.png` — screenshots of the same screens.
- Mockups use Fredoka (headings) + Nunito (body).

## Spec-driven workflow

- Features are designed with the `spec` skill (specs are saved under `specs/`) and implemented with `spec-impl`, which creates a branch named after the spec. Both live in `.agents/skills/`.
- **Specs de base de datos**: cualquier spec que tenga que ver con la base de datos (migraciones, tablas, columnas, RLS, funciones, indexes, etc.) debe guardarse en `specs/database/`.
- /spec Usaremos esta habilidad para crear las especificaciones.
- /spec-impl Usaremos esta skill para hacer las implementaciones.

## Command
- /verify-spec Usaremos el agente `spec-verifier` para validar y corregir los criterios de aceptación de un spec. Revisa lint, build, Next.js best practices vía Context7, compara screenshots con mockups vía Playwright, y corrige tanto el spec como el código cuando hay desviaciones.
- /db-migrator Usaremos el agente `db-migrator` para asegurar que existan las migraciones de Supabase en `supabase/migrations/` y aplicarlas al proyecto remoto vía MCP. Deriva el SQL de specs de DB y del esquema de referencia. Uso: `/db-migrator` (auditoría completa) o `/db-migrator <spec>`.
- /db-security-auditor Usaremos el agente `db-security-auditor` para auditar seguridad de BD y app (RLS, roles, GRANTs, SECURITY DEFINER, service_role, fugas padre↔niño/staff). Solo reporta hallazgos; no crea migraciones ni corrige código. Uso: `/db-security-auditor` o `/db-security-auditor <tabla|spec|archivo>`.
- /a11y Usaremos el agente `accessibility-checker` para auditar y corregir accesibilidad WCAG 2.2 AA en archivos React/TSX o HTML/CSS. Incluye verificación de contraste del design system (`app/globals.css`) y checks de runtime con Playwright. Uso: `/a11y <archivo>`.

## Supabase Skills

- `supabase` — Skill principal para cualquier tarea relacionada con Supabase: Database, Auth, Edge Functions, Realtime, Storage, RLS, migraciones, debugging. Siempre verificar contra la documentación actualizada antes de implementar.
- `supabase-postgres-best-practices` — Best practices de Postgres mantenido por Supabase. Cargar ANTES de escribir o cambiar cualquier cosa en la base de datos: tablas, columnas, migraciones, RLS policies, indexes, triggers, funciones, rendimiento de queries.

## Supabase Database — Reglas de migración

**Siempre usar migraciones** para cualquier cambio en la base de datos. Nunca ejecutar DDL directo en producción.

- Cada cambio de esquema (tablas, columnas, RLS, policies, GRANTs, functions, triggers) va en un archivo `.sql` dentro de `supabase/migrations/`.
- Formato de nombre: `YYYYMMDDHHMMSS_descriptive_name.sql` (ej. `20260921_create_daycares.sql`).
- Para aplicar: usar `supabase_apply_migration` (MCP) con el contenido del archivo SQL.
- El archivo de migración es la **fuente de verdad** del esquema. Si hay diff entre el archivo y la BD, el archivo gana.
- Las migraciones son **inmutables** una vez aplicadas. Para corregir, crear una nueva migración.
- El spec debe incluir el SQL completo de la migración en la sección "Modelo de datos".
- `service_role` bypassa RLS por defecto; policies explícitas a `service_role` solo documentan intención.
- Tras crear tablas/policies/functions: correr `/db-security-auditor` (o al menos `supabase_get_advisors` security).

## Supabase DB Security — Modelo de aislamiento y auditoría

### Qué es `db-security-auditor`

Agente de seguridad de la base de datos y del código que la usa. Su meta es **prevenir fugas de datos entre niños, padres y staff** (RLS mal configurado, roles, GRANTs, SECURITY DEFINER, `service_role`, aislamiento daycare y padre↔niño). Fuente de verdad del diseño: `.opencode/agents/db-security-auditor.md`.

### Cómo usarlo

| Invocación | Cuándo |
|------------|--------|
| `/db-security-auditor` | Auditoría completa (BD + app) |
| `/db-security-auditor children` | Enfocarse en una tabla |
| `/db-security-auditor 12-activate-parent-invitation` | Enfocarse en un spec de DB |
| `/db-security-auditor app/actions/invitations.ts` | Enfocarse en un archivo de la app |

**Flujo típico:**
1. Invocar `/db-security-auditor` (o con alcance).
2. El agente reporta hallazgos (Crítico/Alto/Medio/Bajo) con evidencia y recomendaciones — **no crea archivos ni corrige código**.
3. Revisar el reporte.
4. Crear fix migrations (con `/db-migrator` o manualmente) y aplicarlas con `/db-migrator`.
5. Aplicar fixes de app recomendados manualmente.

**Reglas del agente:**
- **Hace:** audita BD remota + migraciones + `utils/supabase/**` y `app/actions/**`; reporta hallazgos con severidad y recomendaciones.
- **No hace:** crear fix migrations, editar código, auto-aplicar migraciones, editar migraciones ya aplicadas, inventar modelo de autorización sin spec/práctica clara.
- **Correrlo:** después de specs de BD, al tocar RLS/GRANTs/SECURITY DEFINER/service_role, o antes de merges que toquen datos de niños/padres.

Este resumen es para quien escriba RLS, migraciones o server actions sin invocar el agente.

### Roles de dominio

- `users.role`: `staff` | `parent` | `admin`.
- Multi-tenant: `users.daycare_id` → `daycares`.
- Vínculo padre↔niño: tabla `parent_children` (`parent_id`, `child_id`).
- Datos sensibles que **nunca** deben cruzar tenants/familias: `children.medical_notes`, `children.allergy_tags`, `children.photo_consent`, `invitations.code`, `invitations.email`, perfiles de otras familias, rosters de otras guarderías.

### Matriz de aislamiento (RLS esperada)

| Tabla | Staff (su daycare) | Padre (hijos vinculados) | Otro padre | Staff otra daycare | `anon` |
|-------|--------------------|--------------------------|------------|--------------------|--------|
| `children` | SELECT/INSERT propio daycare | SELECT solo vinculados* | — | — | — |
| `parent_children` | SELECT propio daycare | SELECT solo `parent_id = auth.uid()` | — | — | — |
| `invitations` | SELECT/INSERT propio daycare | — | — | — | — |
| `users` | SELECT propio daycare* | SELECT propia fila | — | — | — |
| `daycares` | SELECT propia | SELECT propia* | — | — | — |
| `rooms` | SELECT propio daycare | — | — | — | — |

\* Decisiones de producto aún abiertas en algunos specs (lectura de `children`/`daycares` por el padre vía RLS vs solo server action con `service_role`). Si un spec aprobado define el modelo, se exige; si no, se reporta — no se inventa la policy.

### Checklist al escribir policies / GRANTs / SECURITY DEFINER

1. RLS habilitado en toda tabla `public` expuesta al Data API.
2. Policies de `authenticated` **siempre** con predicado de aislamiento (`daycare_id`, `parent_id`, `auth.uid()`); jamás `USING (true)` sin ownership.
3. No usar `auth.role()` (deprecado); usar `TO authenticated` + predicate.
4. `UPDATE` requiere `USING` **y** `WITH CHECK`; y policy de `SELECT` asociada.
5. `SECURITY DEFINER`: solo si es necesario; `SET search_path`; `REVOKE EXECUTE` de `public`/`anon`/`authenticated` salvo RPC documentado.
6. `GRANT` least-privilege; **no** `SELECT` de `anon` sobre `users`, `children`, `invitations`, `parent_children`, `daycares`.
7. No derivar autorización (rol/daycare) de `raw_user_meta_data` / `user_metadata` del cliente en la lógica de acceso.
8. Server actions privilegiadas: re-validar sesión, rol, `daycare_id` y vínculo `parent_children` antes de escribir.

## Agents

Agentes definidos en `.opencode/agents/`:

- `spec-verifier` — Valida y corrige los criterios de aceptación de un spec. Revisa lint, build, verifica Next.js best practices vía Context7, compara screenshots con mockups vía Playwright, y corrige tanto el spec como el código cuando hay desviaciones. Invocable con `/verify-spec`.
- `react-best-practices` — Aplica mejores prácticas de React a archivos indicados, verificando contra la documentación actualizada vía Context7. Revisa hooks, estado, effects, estructura de componentes y TypeScript strict. Verifica con `npm run lint` + `npm run build`.
- `db-migrator` — Asegura que existan las migraciones de Supabase en `supabase/migrations/` y las aplica al proyecto remoto. Deriva el SQL de specs de DB y del esquema de referencia. Auto-aplica pendientes; reporta drift sin editar migraciones ya aplicadas. Invocable con `/db-migrator`.
- `db-security-auditor` — Audita seguridad Supabase y app para prevenir fugas entre niños, padres y staff (RLS, roles, GRANTs, SECURITY DEFINER, service_role, aislamiento daycare y padre↔niño). Solo reporta hallazgos y recomendaciones; no crea fix migrations ni corrige código. Reporte en español. Invocable con `/db-security-auditor`.
- `accessibility-checker` — Audita y corrige accesibilidad WCAG 2.2 AA en archivos React/TSX o HTML/CSS. Incluye verificación de contraste del design system (`app/globals.css`) y checks de runtime con Playwright. Reporte en español. Invocable con `/a11y <archivo>`.

## Language

- The product is Spanish: UI copy, mockups, and specs are written in Spanish. Keep user-facing strings in Spanish.

## MCPs

- **Playwright** — Screenshots y cualquier cosa relacionada a Playwright tienen que estar en la carpeta `.playwright-mcp`.
- **Context7** — Usaremos este MCP para traer la documentación actualizada del framework.
- **Supabase** — MCP remoto para interactuar con el proyecto de Supabase: Database, Auth, Edge Functions, Storage, Branching, Debugging. URL: `mcp.supabase.com`.


## reglas de codigo

- Usar codigo limpio nombres, variables, funciones etc. en inglés 