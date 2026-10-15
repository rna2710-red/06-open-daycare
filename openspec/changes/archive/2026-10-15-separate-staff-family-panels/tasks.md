# Tasks

## 1. Componentes de navegación

- [x] 1.1 Crear `app/components/shared/StaffSidebar.tsx` basado en el `Sidebar.tsx` actual (botón "Nueva publicación" + items Feed `/staff`, Niños `/staff/kids`, Avisos `/staff/avisos`, Mi cuenta `/staff/cuenta` + bloque de usuario) — verificación: el archivo compila (`npm run build`) y los `href` apuntan a rutas `/staff/*`.
- [x] 1.2 Crear `app/components/shared/FamilySidebar.tsx` sin botón de publicación, con items Feed `/family`, Resumen del día `/family/resumen`, Mi cuenta `/family/cuenta` + bloque de usuario — verificación: `npm run build` y no existe ningún control de composición de posts en el componente.

## 2. Helper de perfil por rol

- [x] 2.1 Crear `utils/supabase/profile.ts` con `getPanelProfile()`: server client (`cookies()`), `auth.getUser()`, select de `public.users` (`id, role, daycare_id, full_name`) por `auth.uid()`, devolviendo `null` si no hay sesión ni fila — verificación: `npm run build` y el helper es importable desde server components.

## 3. Área staff bajo `/staff`

- [x] 3.1 Mover `app/kids/` a `app/staff/kids/` con `git mv` (page.tsx y [slug]/page.tsx); dentro de ambas páginas quitar la composición del Sidebar viejo (el layout del área lo renderizará) y actualizar el link `href="/kids"` del perfil de niño a `/staff/kids` — verificación: `npm run build` y no quedan imports de `shared/Sidebar` ni referencias a `/kids` bajo `app/staff/`.
- [x] 3.2 Crear `app/staff/page.tsx` moviendo el contenido del feed staff actual (hoy `app/page.tsx`), sin composición de Sidebar (deja el contenido principal únicamente) — verificación: `npm run build` y el feed se renderiza bajo la ruta `/staff`.
- [x] 3.3 Crear `app/staff/layout.tsx`: consulta `getPanelProfile()`; sin perfil → `redirect("/login")`; rol `parent` → `redirect("/family")`; si no, renderiza `StaffSidebar` + contenido — verificación: `npm run build`, y manualmente un parent autenticado que visite `/staff` es redirigido a `/family`.
- [x] 3.4 Dejar `app/page.tsx` temporalmente intacto hasta el grupo 5 (el dispatcher lo reemplaza) — verificación: el proyecto sigue compilando con ambas rutas (`/` y `/staff`) presentes.

## 4. Área familia bajo `/family`

- [x] 4.1 Crear `app/family/layout.tsx`: consulta `getPanelProfile()`; sin perfil → `redirect("/login")`; rol `staff` o `admin` → `redirect("/staff")`; si no, renderiza `FamilySidebar` + contenido — verificación: `npm run build`, y manualmente un staff que visite `/family` es redirigido a `/staff`.
- [x] 4.2 Crear `app/family/page.tsx` con un shell de bienvenida (saludo y contexto de la guardería/familia en estado vacío, sin publicaciones) — verificación: `npm run build` y un parent autenticado ve el shell con su sidebar en `/family`.

## 5. Dispatcher y limpieza

- [x] 5.1 Reescribir `app/page.tsx` como dispatcher server component: con `getPanelProfile()`; sin fila en `public.users` → `signOut` + `redirect("/login")`; `staff`/`admin` → `redirect("/staff")`; `parent` → `redirect("/family")` — verificación: manualmente staff → `/staff`, parent → `/family`, y la sesión sin fila cae a `/login` sin loop.
- [x] 5.2 Eliminar `app/components/shared/Sidebar.tsx` y verificar que no queden imports del componente viejo en el repo — verificación: búsqueda sin resultados para `shared/Sidebar` (salvo los nuevos StaffSidebar/FamilySidebar) y `npm run build` limpio.
- [x] 5.3 Verificar que el login (`app/(aut)/login/page.tsx`) y la acción de activación (`app/actions/invitations.ts`, `redirect("/")`) navegan a `/` — ambos ya lo hacen; solo confirmar que no se agregó lógica de rol en el cliente — verificación: inspección del código y smoke de login staff y de activación de padre, ambos aterrizando en su panel vía dispatcher.

## 6. Verificación final

- [x] 6.1 Correr `npm run lint` y corregir cualquier hallazgo nuevo introducido por este cambio — verificación: lint sin errores.
- [x] 6.2 Correr `npm run build` (único gate de typecheck del proyecto) — verificación: build exitoso.
- [x] 6.3 Smoke manual con un usuario staff y un usuario parent: login de cada uno aterriza en su panel; un parent tipeando `/staff/kids` es mandado a `/family`; un staff tipeando `/family` es mandado a `/staff`; el sidebar de cada panel muestra solo sus items — verificación: comportamiento observable en el navegador.
- [x] 6.4 Buscar referencias colgadas a `/` como feed o a `/kids` en el código de la app (links, botones, redirecciones) y actualizarlas a `/staff` donde corresponda — verificación: búsqueda sin resultados de referencias viejas fuera del dispatcher y de las pantallas públicas.
