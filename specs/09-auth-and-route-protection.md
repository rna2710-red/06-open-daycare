# SPEC 09 — Autenticación login + protección de rutas

> **Estado:** Borrador
> **Depende de:** SPEC 08 (tabla `users` + trigger)
> **Fecha:** 2026-09-23
> **Objetivo:** Implementar login real con email/password contra Supabase, protección de rutas con middleware y provider global de usuario.

## Por qué existe este spec

Las pantallas de login y activate ya existen como UI (SPEC 03) pero son inertes. La tabla `users` y el trigger de sync con `auth.users` ya están en Supabase (SPEC 08). Falta el puente: que el login real funcione, que las rutas privadas estén protegidas, y que el usuario autenticado esté disponible en toda la app.

## Alcance

**In:**

- Login real con `signInWithPassword` (email + password) conectado al formulario existente de `/login`.
- Proxy en raíz (`proxy.ts`, antes `middleware.ts` en Next.js 16) que refresca la sesión de Supabase en cada request y protege rutas: solo `/login` y `/activate` son públicas, todo lo demás requiere autenticación.
- Redirect a `/` después de login exitoso.
- Redirect automático a `/` si un usuario autenticado visita `/login`.
- User Provider global (`UserProvider`) que expone el usuario autenticado y su profile de la tabla `users` en un React Context.
- Función server action `signOut` para cerrar sesión.
- Manejo de errores de login (credenciales inválidas) con mensaje visual en el formulario.

**Fuera de alcance (specs futuros):**

- Signup de usuarios (creación de cuenta).
- Recuperación de contraseña (`resetPasswordForEmail`).
- Conexión de `/activate` a Supabase `signUp`.
- Sidebar o UI de navegación con botón de logout.
- Protección de rutas por rol (`staff`, `parent`, `admin`).
- Pantalla de "no autorizado" (403).
- Redirección post-login basada en rol.

## Modelo de datos

No introduce nuevas tablas ni migraciones. Reutiliza la tabla `users` del SPEC 08.

El User Provider expone este shape en el Context:

```ts
interface UserContextValue {
  user: User | null;          // Supabase Auth user (auth.users)
  profile: UserProfile | null; // Fila de la tabla users
  loading: boolean;
  signOut: () => Promise<void>;
}

interface UserProfile {
  id: string;
  daycare_id: string | null;
  role: 'staff' | 'parent' | 'admin';
  status: 'pending' | 'active';
  full_name: string;
  avatar_url: string | null;
  notify_on_post: boolean;
  daily_summary_enabled: boolean;
  created_at: string;
  updated_at: string;
}
```

## Plan de implementación

1. **Reescribir `utils/supabase/middleware.ts`.** Actualizar el helper para seguir el patrón actual de Supabase SSR: importar `parseCookieHeader` y `serializeCookieHeader` de `@supabase/ssr`, usar `getAll` con `parseCookieHeader(request.cookies.toString())`, usar `setAll` con `serializeCookieHeader` para setear cookies en request y response, llamar `await supabase.auth.getClaims()` para refresh. Retornar `{ supabase, response }`. Verificar: `npm run build` compila.

2. **Crear `proxy.ts` en raíz** (Next.js 16 renombró `middleware.ts` → `proxy.ts`, export `middleware` → `proxy`). Usar el helper reescrito. Lógica: definir `PUBLIC_ROUTES = ['/login', '/activate']`. Si la ruta es pública y hay sesión → redirect a `/`. Si la ruta no es pública y no hay sesión → redirect a `/login`. Matcher: `'/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'`. Exportar `config` con el matcher. Verificar: visitar `/` sin sesión redirige a `/login`.

3. **Crear `app/providers.tsx`.** Client component `"use client"` que envuelve `{children}` en `UserProvider`. El provider hace fetch del profile de `users` al montar (usando el client helper de Supabase) y lo expone en Context. Loading state mientras se resuelve. Verificar: build compila.

4. **Envolver layout raíz con providers.** En `app/layout.tsx`, importar `Providers` y envolver `{children}`. Verificar: build compila, la app carga sin errores.

5. **Crear server action `signOut`.** En `app/actions/auth.ts`, función `signOut` que llama `supabase.auth.signOut()` y redirige a `/login` usando `redirect()`. Verificar: build compila.

6. **Conectar formulario de login.** En `app/(aut)/login/page.tsx`: manejar estado de email y password con `useState`, llamar `supabase.auth.signInWithPassword()` en el submit, redirigir a `/` en éxito, mostrar mensaje de error en credenciales inválidas. Usar el client helper de Supabase. Verificar: login con `jose@staff.com` / `Nintento.2026` redirige a `/`.

7. **Verificación integral.** `npm run lint` y `npm run build` pasan. Login funcional contra Supabase. Rutas protegidas redirigen a `/login`. Usuario autenticado en `/login` se redirige a `/`.

## Criterios de aceptación

- [ ] `npm run lint` pasa sin errores.
- [ ] `npm run build` compila sin errores de tipos.
- [ ] El formulario de login en `/login` acepta email y password, y ejecuta `signInWithPassword` contra Supabase.
- [ ] Login exitoso redirige a `/`.
- [ ] Credenciales inválidas muestran un mensaje de error en el formulario (sin redirigir).
- [ ] El proxy redirige a `/login` cuando un usuario no autenticado intenta acceder a una ruta privada.
- [ ] El proxy redirige a `/` cuando un usuario autenticado visita `/login`.
- [ ] `/activate` es accesible sin autenticación.
- [ ] El User Provider está en el layout raíz y expone `user`, `profile`, `loading` y `signOut`.
- [ ] El profile se obtiene de la tabla `users` (no solo de `auth.users`).
- [ ] La función `signOut` está disponible en el Context del User Provider.
- [ ] No hay errores en consola durante el flujo de login → home → logout.

## Decisiones

- **Sí:** `proxy.ts` en raíz (no `middleware.ts`) — Next.js 16 renombró `middleware.ts` a `proxy.ts` y el export `middleware` a `proxy`. El archivo `middleware.ts` está deprecado. `proxy.ts` usa Node.js runtime (no edge), compatible con Supabase SSR.
- **Sí:** helper reescrito con `parseCookieHeader`/`serializeCookieHeader` — el helper existente en `utils/supabase/middleware.ts` no seguía el patrón actual de Supabase SSR. Se reescribe para consistencia con la documentación.
- **Sí:** `getClaims()` para refresh de sesión — más completo que `getSession()` porque valida el token contra el auth server y refresca si es necesario.
- **Sí:** User Provider global — el usuario pidió exponer el profile en Context. Permite que las páginas accedan al usuario sin hacer fetch individual.
- **Sí:** server action para `signOut` — Next.js 16 recomienda server actions para mutaciones. La función usa `redirect()` que solo funciona en server context.
- **Sí:** `/activate` permanece inerte — el usuario indicó que solo se conecta login en este spec.
- **Sí:** redirect siempre a `/` — sin diferenciación por rol. La protección por rol va en otro spec.
- **Sí:** errores de login con mensaje visual — no se muestra alert ni toast; se muestra un texto debajo del formulario, fiel al estilo existente.
- **No:** signup — se hará en otro spec.
- **No:** recuperación de contraseña — se hará en otro spec.
- **No:** sidebar ni UI de logout — solo la función `signOut` en el Context; la UI va en otro spec.
- **No:** protección por rol — solo se verifica sesión activa, no el campo `role`.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Helper de proxy reescrito puede romper imports existentes | El helper solo se importa en el nuevo `proxy.ts`; no hay otros consumidores |
| `getClaims()` puede fallar si el refresh token expiró | El proxy redirige a `/login` cuando no hay sesión válida |
| Profile de `users` puede no existir si el trigger falló | User Provider maneja `profile: null` y la UI debe tolerar ese estado |

## Lo que **no** está en este spec

- Signup de usuarios.
- Recuperación de contraseña.
- Conexión de `/activate` a Supabase.
- Sidebar o UI de navegación.
- Protección por rol.
- Pantalla de 403 / no autorizado.
- Redirección post-login basada en rol.

Cada una de esas, si llega, va en su propio spec.
