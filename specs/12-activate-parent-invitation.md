# SPEC 12 — Activación de cuenta de padre + vínculo

> **Estado:** Aprobado
> **Depende de:** SPEC 08 (users + trigger), SPEC 09 (auth/proxy), SPEC 10 (children/rooms), SPEC 11 (invitations + email)
> **Fecha:** 2026-09-30
> **Objetivo:** Activar la cuenta de un padre con el código de invitación, crear el usuario en Supabase Auth, vincularlo al niño en `parent_children` y dejarlo logueado en la app.

## Por qué existe este spec

El SPEC 11 crea la invitación y envía el correo con el código, pero `/activate` sigue siendo UI mock y no hay vínculo padre ↔ niño. Este spec cierra el flujo: el padre abre el link del correo, crea su contraseña, se registra en Supabase Auth como `parent`, se vincula al niño, se registra el consentimiento de fotos y queda autenticado redirigido al home.

## Alcance

**In:**

- Migración de tabla `parent_children` con campos del esquema de referencia: `id`, `parent_id`, `child_id`, `relationship`, `created_at`, UNIQUE (`parent_id`, `child_id`).
- RLS en `parent_children`: staff puede leer vínculos de niños de su daycare; `service_role` tiene acceso total.
- Variable de entorno `SUPABASE_SERVICE_ROLE_KEY` (documentar en `.env.template`; el usuario la configura).
- Helper `utils/supabase/admin.ts`: cliente `supabase-js` con service role para operaciones privilegiadas (sin cookies de SSR).
- Server action `getInvitationPreview(code)` en `app/actions/invitations.ts`: dado un código, retorna `{ childFullName, roomName, email }` si la invitación está `pending` y no vencida; si no, `null`. No expone RLS anónima de la tabla completa.
- Server action `activateInvitation` en `app/actions/invitations.ts` (o `app/actions/activate.ts`): recibe `{ code, email, password, photoAuth }`:
  1. Valida que la invitación exista, esté `pending` y no esté vencida (`expires_at > now()`).
  2. Valida que `email` coincida (case-insensitive) con el de la invitación.
  3. Valida longitud mínima de contraseña (8+).
  4. `admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name, role: 'parent', daycare_id } })` donde `daycare_id` sale del niño (`children.room_id → rooms.daycare_id`).
   - El trigger `handle_new_user` crea la fila en `users` con esos metadatos.
   5. Insert en `parent_children` con `parent_id` = usuario creado, `child_id`, `relationship` de la invitación.
   6. Update `invitations`: `status = 'accepted'`, `accepted_at = now()`.
   7. Si `photoAuth` es true: update `children.photo_consent = true`; si es false, `photo_consent = false`.
   8. `signInWithPassword({ email, password })` con el client de cookies de `utils/supabase/server`.
   9. `redirect('/')` (home; el proxy deja al usuario autenticado acceder a rutas privadas).
- Si el email ya existe en Auth: retornar error en español "Ya existe una cuenta con ese email. Iniciá sesión." y link a `/login`. No se reutiliza la invitación ni se crea el vínculo.
- Conectar `app/(aut)/activate/page.tsx`:
  - Leer `code` de `searchParams` y prefill del input.
  - Al montar (o al escribir 5 caracteres), llamar `getInvitationPreview` y mostrar la tarjeta del niño real (nombre · sala) o un estado vacío.
  - Submit: llamar `activateInvitation`; en éxito, redirigir a `/` (el sign-in ya quedó en cookies).
  - Errores: mensajes en español debajo del formulario (código inválido, expirado, email no coincide, contraseña corta, email ya registrado, error interno).
  - Quitar el mock `lib/mock/auth.ts` de esta página.
  - El checkbox de fotos sigue siendo funcional y envía `photoAuth` al action.
- `/activate` permanece en `PUBLIC_ROUTES` de `proxy.ts` (ya está).
- Perfil del niño (`app/kids/[slug]/page.tsx`): "Padres vinculados" combina:
  - Filas de `parent_children` → badge ACTIVA (nombre, parentesco, "activa").
  - Invitaciones `pending` del SPEC 11 → badge PENDIENTE.
  - Mantener "Vincular otro padre".

**Fuera de alcance (specs futuros):**

- Recuperación de contraseña.
- UI de familia (`familia-feed`, `familia-cuenta`) — el padre entra al home actual.
- Sidebar o menú con logout para padres (la función `signOut` ya existe en el SPEC 09).
- Editar o desvincular un padre.
- Reenviar invitación.
- Protección de rutas por rol (`parent` vs `staff`) más allá del proxy de sesión.
- Feed filtrado por hijos del padre.
- Notificaciones push / `devices`.
- Actualizar `users.role` si un usuario staff recibe una invitación de padre.

## Modelo de datos

```sql
-- Tabla parent_children
CREATE TABLE parent_children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  relationship relationship_type NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (parent_id, child_id)
);

-- RLS
ALTER TABLE parent_children ENABLE ROW LEVEL SECURITY;

-- Staff puede leer vínculos de niños de su daycare
CREATE POLICY "Staff can read parent links in their daycare"
  ON parent_children FOR SELECT
  TO authenticated
  USING (child_id IN (
    SELECT c.id FROM children c
    JOIN rooms r ON r.id = c.room_id
    WHERE r.daycare_id = (
      SELECT daycare_id FROM users WHERE id = auth.uid()
    )
  ));

-- Padre puede leer sus propios vínculos
CREATE POLICY "Parents can read own links"
  ON parent_children FOR SELECT
  TO authenticated
  USING (parent_id = auth.uid());

-- service_role tiene acceso total (la creación la hace el server action)
CREATE POLICY "Service role can manage parent links"
  ON parent_children FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Data API
GRANT SELECT ON parent_children TO authenticated;
GRANT ALL ON parent_children TO service_role;
```

Cliente admin (ilustración, no se copia literal en el spec como código de producto):

```ts
// utils/supabase/admin.ts
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const adminClient = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
```

**Nota de seguridad:** el cliente admin solo se usa en server actions / código de servidor. Nunca se importa en componentes de cliente. No se expone `SUPABASE_SERVICE_ROLE_KEY` con prefijo `NEXT_PUBLIC_`.

## Plan de implementación

1. **Crear migración de parent_children.** Crear `supabase/migrations/20260930_create_parent_children.sql` con la tabla, UNIQUE, RLS, policies y GRANTs. Asumir que el enum `relationship_type` ya existe (SPEC 11). Verificar: `npm run build` compila.

2. **Aplicar migración a Supabase.** `supabase_apply_migration` nombre `create_parent_children`. Verificar: `supabase_list_tables` retorna `parent_children`.

3. **Verificar RLS.** `supabase_get_advisors` tipo `security`. Verificar: sin advisories para `parent_children`.

4. **Documentar service role.** Agregar `SUPABASE_SERVICE_ROLE_KEY=` a `.env.template`. El usuario la configura en `.env`. Verificar: el helper lee la env y el build compila (puede fallar en runtime si falta; documentar).

5. **Helper admin.** Crear `utils/supabase/admin.ts` con `adminClient` (sin cookies). Verificar: build compila.

6. **`getInvitationPreview`.** En `app/actions/invitations.ts`: por código, buscar invitación `pending` no vencida; join a `children` y `rooms` para `childFullName` y `roomName`; retornar `null` si no existe. Verificar: build compila.

7. **`activateInvitation`.** Implementar el flujo completo del Alcance (validaciones → `admin.createUser` → `parent_children` → update invitación → `photo_consent` → `signInWithPassword` → `redirect('/')`). Manejar errores de:
   - código inexistente / no pending / vencido
   - email no coincide
   - contraseña < 8
   - email ya registrado (`authApiError` o mensaje de duplicate)
   - fallo al insertar vínculo
   Verificar: build compila.

8. **Conectar `/activate`.** Reescribir `app/(aut)/activate/page.tsx`:
   - `searchParams.code` → input controlado o defaultValue.
   - Preview del niño real.
   - Submit al action; errores en español; éxito redirige a `/`.
   - Quitar import de `lib/mock/auth.ts`.
   Verificar: con una invitación pending, el form muestra el niño y al activar redirige a `/` logueado.

9. **Perfil: ACTIVA + PENDIENTE.** En `app/kids/[slug]/page.tsx`, además de las invitaciones pending (SPEC 11), cargar `parent_children` del niño y renderizar filas ACTIVA (nombre desde `users.full_name`, parentesco traducido a UI). Verificar: tras activar, el badge cambia a ACTIVA.

10. **Verificación integral.** `npm run lint` y `npm run build` pasan. Flujo E2E:
    - Staff invita (SPEC 11) → correo.
    - Padre abre `/activate?code=…`, ve el niño, crea contraseña, activa.
    - Queda en `/` autenticado.
    - Perfil del niño muestra ACTIVA.
    - Intentar activar el mismo código de nuevo falla.
    - Email ya usado muestra error y link a login.
    - `supabase_get_advisors` sin issues.

## Criterios de aceptación

- [ ] `npm run lint` pasa sin errores.
- [ ] `npm run build` compila sin errores de tipos.
- [ ] Tabla `parent_children` existe con UNIQUE (`parent_id`, `child_id`).
- [ ] RLS habilitado en `parent_children`.
- [ ] Policy de SELECT para staff filtra por daycare del niño.
- [ ] Policy de SELECT permite al padre ver sus propios vínculos.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` está documentada en `.env.template` (sin prefijo `NEXT_PUBLIC_`).
- [ ] `utils/supabase/admin.ts` usa `createClient` de `supabase-js` con service role y `persistSession: false`.
- [ ] El helper admin no se importa en componentes de cliente.
- [ ] `getInvitationPreview` retorna datos del niño solo para código pending no vencido.
- [ ] `/activate` prefill el código desde `?code=`.
- [ ] `/activate` muestra el nombre del niño y la sala reales al escribir un código válido.
- [ ] `activateInvitation` crea el usuario con `email_confirm: true` y metadata `role: 'parent'`.
- [ ] El trigger crea la fila en `users` con `full_name` y `daycare_id` correctos.
- [ ] Se inserta `parent_children` con el `relationship` de la invitación.
- [ ] La invitación pasa a `accepted` con `accepted_at`.
- [ ] El checkbox de fotos actualiza `children.photo_consent`.
- [ ] Tras activar, el usuario queda logueado y es redirigido a `/`.
- [ ] Código ya usado → error en español.
- [ ] Email no coincide → error en español.
- [ ] Contraseña < 8 caracteres → error en español.
- [ ] Email ya existente → error + link a `/login`, sin crear vínculo.
- [ ] Código vencido → error en español.
- [ ] Perfil del niño muestra badge ACTIVA para el padre vinculado y PENDIENTE para invitaciones nuevas.
- [ ] `/activate` no usa `lib/mock/auth.ts`.
- [ ] `npm run build` no expone la service role en el bundle del cliente.
- [ ] No hay errores en consola durante el flujo de activación.

## Decisiones

- **Sí:** `admin.createUser` con service role — el usuario eligió esta vía; evita confirmar email y race conditions del `signUp` en cliente.
- **Sí:** `email_confirm: true` — el padre ya demostró interés con el código; no se pide confirmar email extra.
- **Sí:** metadata `role: 'parent'`, `full_name` y `daycare_id` — el trigger `handle_new_user` del SPEC 08 los consume; sin metadata quedaría `role='staff'` por el COALESCE.
- **Sí:** contraseña mínima 8 caracteres — suficiente para demo sin complejizar UX; se puede endurecer después.
- **Sí:** sign-in automático + `redirect('/')` — decisión del usuario (opción recomendada); el proxy del SPEC 09 ya deja `/` accesible con sesión.
- **Sí:** si el email ya existe, error + link a login — no se reutiliza la invitación; gestionar vínculos de cuentas existentes es otro spec.
- **Sí:** `getInvitationPreview` por código en server action — evita policy anónima que liste invitaciones pendientes.
- **Sí:** foto consent en `children.photo_consent` — decisión del usuario; es el campo del esquema para el checkbox de activación.
- **Sí:** el padre también puede SELECT sus propios `parent_children` — prepara el feed de familia sin exponer RLS abierta.
- **Sí:** nombres de código en inglés; copy de UI en español.
- **No:** `signUp` en cliente — rechazado por el usuario a favor de admin.createUser.
- **No:** redirigir a `/login` post-activación — rechazado; es auto sign-in.
- **No:** ignorar el checkbox de fotos — rechazado; se persiste.
- **No:** UI de familia en este spec — el padre entra al home actual; vistas familia van en otro spec.
- **No:** cron de expiración — el vencimiento se valida al activar (`expires_at > now()`).
- **No:** Edge Function para createUser — el user action de Next.js + admin client alcanza; service role solo en servidor.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Service role filtrada al cliente | Env sin `NEXT_PUBLIC_`; helper solo en server; criterio de aceptación de build |
| Trigger crea `users` con role staff si falta metadata | Action siempre envía `role: 'parent'` y `daycare_id` del niño |
| Usuario staff recibe invitación como padre | Fuera de alcance; en el futuro se puede impedir o migrar rol |
| Email duplicado en createUser | Catch y mensaje + link a login; no insertar `parent_children` |
| `signInWithPassword` falla tras createUser | Retornar error al usuario; la cuenta existe pero no está vinculada — retry manual; mitigación futura con transacción o paso de re-login |
| RLS SELECT de staff no ve `parent_children` si la subquery falla | Mismo patrón que children/invitations; advisors + prueba manual |
| `/activate` público permite adivinar códigos | Código único + vencimiento 7 días + rate limiting futuro (fuera de alcance) |

## Lo que **no** está en este spec

- Recuperación de contraseña.
- UI de familia (`familia-feed`, `familia-cuenta`).
- Sidebar / logout específico para padres.
- Editar o desvincular padres.
- Reenviar o cancelar invitaciones.
- Protección por rol más allá de sesión activa.
- Feed del padre filtrado por hijos.
- Notificaciones push.
- Cambio de rol de usuarios staff existentes.
- Rate limiting en `/activate`.

Cada una de esas, si llega, va en su propio spec.
