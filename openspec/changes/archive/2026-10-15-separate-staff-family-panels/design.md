# Design — Separación de paneles staff y familia

## Context

La app es Next.js 16 (App Router) + Supabase. Hoy no hay separación por rol en el routing:

- `proxy.ts` solo valida sesión (sin rol). Los roles existen en `public.users.role` (`staff | parent | admin`) pero solo dos server actions los chequean.
- `app/page.tsx` es el feed staff en `/`; `app/kids/**` el roster y perfil. Un padre autenticado cae en `/` y ve pantallas vacías (RLS no le da datos).
- Un único `Sidebar.tsx` (client component) con items staff, usado por cada página que lo compone. Logout es un `href="#"` sin wirrar.
- El login (`app/(aut)/login/page.tsx`) siempre hace `router.push("/")`. `/activate` también redirige a `/`.
- `getSessionProfile()` en `app/actions/posts.ts` ya consulta `public.users` por `auth.uid()` con el server client — patrón a reutilizar.
- Spec 09 dejó explícitamente fuera de alcance: protección por rol, 403 y redirect post-login por rol. Este cambio los implementa (sin pantalla 403: se usa redirect).

Ver proposal.md para motivación y specs/ por los requerimientos.

## Goals / Non-Goals

**Goals:**

- Rutas explícitas `/staff/*` y `/family/*` con layouts propios y guards por rol.
- Dispatcher en `/` que deriva al panel según la BD.
- Dos sidebars independientes (`StaffSidebar`, `FamilySidebar`).
- Autorización de rutas basada solo en `public.users` (nunca `user_metadata`).
- Mover el feed staff y el roster de niños a `/staff` sin cambiar su comportamiento interno.

**Non-Goals:**

- Feed familiar con contenido real (posts filtrados por `parent_children`) — spec futura; requiere RLS de lectura para parents.
- Pantallas `/staff/avisos`, `/staff/cuenta`, `/family/resumen`, `/family/cuenta` (solo enlaces declarados).
- Pantalla 403 (se usa redirect al panel propio).
- Cambios de RLS, esquema o `proxy.ts`.
- Wirrar el botón de logout (queda pendiente; el guard/ dispatcher no dependen de él).

## Decisions

### D1 — Prefijos de URL explícitos (`/staff`, `/family`), carpetas planas

```
app/
├── page.tsx              # / → dispatcher (rol desde BD)
├── (aut)/login, activate # públicas, empujan "/"
├── staff/
│   ├── layout.tsx        # guard parent → /family; <StaffSidebar/>
│   ├── page.tsx          # /staff (feed, movido desde app/page.tsx)
│   ├── kids/page.tsx     # /staff/kids (movido desde app/kids)
│   └── kids/[slug]/…     # /staff/kids/<slug>
└── family/
    ├── layout.tsx        # guard staff|admin → /staff; <FamilySidebar/>
    └── page.tsx          # /family (shell de bienvenida)
```

**Alternativa descartada:** route groups `(staff)`/`(family)` con staff en `/` y familia en `/familia` — asimétrica; el usuario pidió rutas explícitas simétricas. Con prefijos a propósito, los route groups no aportan nada (sirven para organizar sin tocar la URL).

**BREAKING**: `/` ya no es el feed staff (es dispatcher) y `/kids` deja de existir. Aceptado: la base de usuarios es mínima y los specs previos reservaron este cambio.

### D2 — Guards en layouts server component, no en el middleware

Cada layout de panel consulta el rol y redirige si no corresponde. El `proxy.ts` no se toca (sigue solo con sesión).

```ts
// app/staff/layout.tsx (patrón)
const profile = await getPanelProfile(); // public.users por auth.uid()
if (!profile) redirect("/login");        // sesión sin fila → login
if (profile.role === "parent") redirect("/family");
return <StaffSidebar />…{children}
```

**Por qué layouts y no middleware:** el middleware correría en cada request con una query extra a la BD; los layouts server component son el mecanismo idiomático de App Router para guardas de sección, y la query por request se amortiza (React cachea por request los datos del server component tree). Además el proxy hoy es ciego al rol por diseño (spec 09).

**Por qué no una server action de guard:** los layouts ya son server components; usar `redirect()` directo evita roundtrips innecesarios.

**Helper compartido:** extraer `getPanelProfile()` (select `id, role, daycare_id` de `public.users` por `auth.uid()`, con `cookies()` del server client) en un módulo utilitario (p. ej. `utils/supabase/profile.ts`), reutilizado por dispatcher y ambos layouts. Esencialmente el mismo query que `getSessionProfile()` de `app/actions/posts.ts:60` — no migrar ese action en este cambio (fuera de alcance), pero el helper puede refactorizarse hacia él después.

### D3 — Dispatcher en `/` como única puerta de entrada

`app/page.tsx` se reescribe como server component:

- Sin sesión → el proxy ya lo manda a `/login` (comportamiento actual, no cambia).
- Con sesión → query de rol; `staff`/`admin` → `redirect("/staff")`, `parent` → `redirect("/family")`.
- Sesión sin fila en `public.users` → `signOut` + `redirect("/login")`. Evita loops: `/login` con sesión activa el proxy lo manda a `/`, y sin fila el dispatcher vuelve a salir — por eso el `signOut` antes del redirect.

Login y `/activate` quedan sin lógica de rol: ambos hacen `router.push("/")` (el login ya lo hace; `activate` cambia su destino de `/` a `/`, que ahora es el dispatcher). Un solo punto de decisión.

**Alternativa descartada:** que el login lea el rol del cliente (`user_metadata` o query post-signin) y empuje directo al panel — violaría la regla de no derivar autorización de datos del cliente y duplicaría la lógica de rol en el cliente.

### D4 — Dos componentes de sidebar

`app/components/shared/Sidebar.tsx` se reemplaza por:

- `StaffSidebar.tsx` — botón "Nueva publicación" (PostComposerProvider) + Feed (`/staff`), Niños (`/staff/kids`), Avisos (`/staff/avisos`), Mi cuenta (`/staff/cuenta`) + bloque de usuario.
- `FamilySidebar.tsx` — Feed (`/family`), Resumen del día (`/family/resumen`), Mi cuenta (`/family/cuenta`) + bloque de usuario. Sin compose.

**Por qué dos y no uno con `variant`:** decisión explícita del usuario. Cada sidebar queda simple y autónomo; el bloque de usuario es común pero pequeño (se puede extraer un `SidebarUserBlock` compartido si se repite, sin convertirlo en un sistema de variantes).

Detalles heredados del Sidebar actual que se mantienen (out of scope de este cambio): `classroom.name` de `lib/mock/feed`, logout con `href="#"`, `href` crudos en vez de `next/link`. El nuevo código puede usar `Link` donde agregue valor, sin refactor global.

### D5 — Estado del rol vs. estado de la cuenta

`public.users.status` (`pending|active`) no participa en el routing de este cambio. Los padres creados por invitación nacen `active`; si en el futuro hay cuentas `pending` que deban caer a un flujo de espera, será un requisito nuevo (los guards solo distinguen rol).

### D6 — Seguridad: RLS sigue siendo la frontera real

Los guards son control de UX/arquitectura, no de seguridad: un parent con `curl` a `/staff/kids` no obtiene datos porque RLS (`children`, `posts`) ya restringe por rol/daycare. Este cambio no toca RLS; la separación de rutas no debilita el modelo existente. La auditoría `/db-security-auditor` queda recomendada post-implementación por el AGENTS.md, aunque no haya migraciones nuevas.

## Risks / Trade-offs

- **[URLs rotas]** `/` y `/kids` cambian de significado → aceptado (usuarios mínimos); sin redirects de compatibilidad por ahora. Si se necesita después, un redirect en el proxy o en los layouts viejos es trivial.
- **[Doble query de rol por request]** dispatcher + layout hacen dos queries a `public.users` en la cadena de entrada → costo trivial (PK lookup) y se puede cachear con `React.cache()` dentro del request si molesta.
- **[Flash de redirect]** el guard del layout redirige después de que el layout empieza a renderizar → en la práctica imperceptible; alternativa (chequeo en un `loading.tsx`/prefetch) complica más de lo que aporta.
- **[Shell familiar vacío]** el padre entra a `/family` y no ve contenido real → intencional (spec futura); el shell de bienvenida y la navegación hacen útil la estructura desde el día uno.
- **[Olvido de actualizar links]** cualquier link interno a `/` o `/kids` fuera del sidebar quedará colgado → la búsqueda de referencias en el repo es parte de las tareas (providers, botones de perfil, etc.).

## Migration Plan

1. Agregar helpers, layouts y dispatcher, y mover páginas a `/staff` (git mv para preservar historia).
2. Actualizar links internos (`/` → `/staff`, `/kids` → `/staff/kids`) y reemplazar el Sidebar.
3. Verificar con `npm run lint` + `npm run build` (typecheck), y smoke test manual con un usuario staff y un usuario parent.
4. Rollback: revert del commit; no hay migraciones de BD ni cambios de esquema.

## Open Questions

- Ninguna que afecte specs, enfoque o desglose de tareas. (Contenido del feed familiar y RLS de parents: explícitamente fuera de alcance en la propuesta.)
