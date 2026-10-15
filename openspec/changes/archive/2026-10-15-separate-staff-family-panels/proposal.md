# Proposal — Separación de paneles staff y familia

## Why

Hoy toda la app vive en un solo espacio de rutas con un único sidebar con forma de staff: un padre que inicia sesión cae en el feed staff (`/`) y ve pantallas vacías, porque no hay separación por rol. Los mockups ya diseñan dos paneles distintos (GUARDERÍA · STAFF y FAMILIA · PADRE) y los specs 09/12/13 dejaron explícitamente reservada esta separación para specs futuras. Es el momento de construir la arquitectura de rutas y acceso por rol que habilita el panel familiar.

## What Changes

- **Rutas explícitas por panel**: el área staff se muda a `/staff/*` y el área familia nace en `/family/*`. **BREAKING**: `/` deja de ser el feed staff (ahora es un dispatcher) y `/kids` pasa a ser `/staff/kids`.
- **Dispatcher en `/`**: page server component que consulta el rol en la BD y redirige a `/staff` (staff y admin) o `/family` (parent).
- **Guards por rol en layouts**: cada panel tiene un layout server component que valida el rol contra `public.users` y redirige al panel correcto si el rol no corresponde (defensa en profundidad; un padre tipeando `/staff/kids` a mano es redirigido).
- **Dos sidebars separados**: `StaffSidebar` (Feed · Niños · Avisos · Mi cuenta · Nueva publicación) y `FamilySidebar` (Feed · Resumen del día · Mi cuenta), cada uno servido por el layout de su panel.
- **Rol siempre desde la BD**: la validación de rol consulta `public.users` por `auth.uid()`; nunca se deriva de `raw_user_meta_data`/`user_metadata` del cliente.
- **Login y activate sin lógica de rol**: ambos empujan `/` y el dispatcher resuelve el destino según la BD.
- **Shell del panel familia**: `/family` existe como página mínima con estado vacío/bienvenida (el feed familiar con contenido real está fuera de alcance).
- **Mover páginas staff existentes**: feed (`/` → `/staff`), niños (`/kids` → `/staff/kids`, incluido `[slug]`).

## Capabilities

### New Capabilities

- `role-based-access`: enrutamiento por rol — dispatcher en `/`, guards de layout por panel, y destinos post-login/activate según el rol almacenado en la BD.
- `staff-panel`: área del staff — layout con `StaffSidebar`, feed de publicaciones y gestión de niños bajo `/staff/*`.
- `family-panel`: área de la familia — layout con `FamilySidebar` y home shell en `/family` con navegación a Resumen del día y Mi cuenta.

### Modified Capabilities

<!-- Sin capacidades existentes en OpenSpec: el proyecto no tiene specs registradas todavía. Los specs legacy (09, 12, 13) reservaron este trabajo explícitamente. -->

## Impact

- **Routing (app/)**: `app/page.tsx` reescrito como dispatcher; feed staff se mueve a `app/staff/page.tsx`; `app/kids/**` → `app/staff/kids/**`; nuevos `app/staff/layout.tsx`, `app/family/{layout,page}.tsx`.
- **Componentes**: `app/components/shared/Sidebar.tsx` se reemplaza por `StaffSidebar.tsx` y `FamilySidebar.tsx`.
- **Server actions / utils**: layouts y dispatcher usan el server client de Supabase (`utils/supabase/server`) para consultar `public.users`.
- **Auth**: `app/(aut)/login/page.tsx` y `app/(aut)/activate/page.tsx` — solo cambia el destino de redirección si aplica; la lógica de rol no vive ahí.
- **Sin cambios**: `proxy.ts` (sigue solo con chequeo de sesión), esquema de BD, RLS.
- **Fuera de alcance** (specs futuras): feed familiar con contenido real (lectura de `posts`/`post_children` por padres, RLS), pantallas `/staff/avisos`, `/family/resumen`, `/family/cuenta`, reacciones y comentarios.
