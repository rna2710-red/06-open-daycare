# SPEC 11 — Invitación de padre + email con Resend

> **Estado:** Aprobado
> **Depende de:** SPEC 08 (users), SPEC 09 (auth/proxy), SPEC 10 (children/rooms)
> **Fecha:** 2026-09-30
> **Objetivo:** Persistir la invitación de un padre/tutor para un niño y enviarle un correo con el código de activación usando Resend desde un server action de Next.js.

## Por qué existe este spec

El SPEC 05 dejó la pantalla "Vincular padre" como UI mock: el código se genera en el cliente y "Enviar invitación" solo navega al perfil. No hay persistencia ni envío real de correo. Este spec conecta ese flujo a Supabase (tabla `invitations` del esquema de referencia) y al paquete `resend` para que el staff pueda invitar a un familiar y el familiar reciba el código por email. La activación de cuenta y el vínculo en `parent_children` van en el SPEC 12.

## Alcance

**In:**

- Enum `relationship_type` (`father`, `mother`, `guardian`).
- Enum `invitation_status` (`pending`, `accepted`, `expired`, `cancelled`).
- Tabla `invitations` con campos del esquema de referencia: `id`, `child_id`, `invited_by`, `full_name`, `email`, `relationship`, `code` (UNIQUE), `status`, `expires_at`, `accepted_at`, `created_at`.
- RLS en `invitations`: staff autenticado puede INSERT/SELECT en invitaciones de niños de su daycare; `service_role` tiene acceso total.
- GRANTs: `authenticated` SELECT/INSERT; `service_role` ALL.
- Paquete npm `resend`.
- Variables de entorno: `RESEND_API_KEY`, `RESEND_FROM`, `APP_BASE_URL` (agregar en `.env.template`).
- Helper `lib/email/invitation-email.ts`: construye el HTML del correo en español con marca OpenDayCare (código + botón CTA a `{APP_BASE_URL}/activate?code=…`).
- Server action `createInvitation` en `app/actions/invitations.ts`:
  - Valida sesión autenticada y que el usuario sea staff del mismo daycare que el niño.
  - Genera código de 5 caracteres alfanuméricos mayúsculos en el servidor.
  - Inserta la fila en `invitations` con `status = 'pending'` y `expires_at = now() + 7 días`.
  - Envía el correo con Resend.
  - Si el envío falla: la invitación queda `pending`; el action retorna error con el código para que el staff pueda informarlo al padre.
- Conectar `app/kids/[slug]/page.tsx` y `app/kids/[slug]/vincular-padre/page.tsx` a Supabase (dejar de usar `lib/mock/kids.ts` en estas rutas).
- Perfil del niño: sección "Padres vinculados" muestra invitaciones `pending` del niño con badge PENDIENTE (nombre, parentesco, "invitación enviada").
- El código en la pantalla de vincular se muestra solo después de crear la invitación (no se genera en el cliente al cargar).

**Fuera de alcance (specs futuros):**

- Tabla `parent_children` y activación de cuenta (SPEC 12).
- Login del padre / redirección post-activación.
- Badge ACTIVA en "Padres vinculados".
- Reenviar o cancelar una invitación.
- Invitar a un email que ya tiene cuenta en Supabase Auth.
- Validación de campos del formulario más allá de lo mínimo del action.
- Plantillas de email con React Email o editor visual.
- Feed del padre / vistas de familia.

## Modelo de datos

```sql
-- Enums
CREATE TYPE relationship_type AS ENUM ('father', 'mother', 'guardian');
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'expired', 'cancelled');

-- Tabla invitations
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  relationship relationship_type NOT NULL,
  code TEXT NOT NULL UNIQUE,
  status invitation_status NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Staff puede leer invitaciones de niños de su daycare
CREATE POLICY "Staff can read invitations in their daycare"
  ON invitations FOR SELECT
  TO authenticated
  USING (child_id IN (
    SELECT c.id FROM children c
    JOIN rooms r ON r.id = c.room_id
    WHERE r.daycare_id = (
      SELECT daycare_id FROM users WHERE id = auth.uid()
    )
  ));

-- Staff puede crear invitaciones para niños de su daycare
CREATE POLICY "Staff can insert invitations in their daycare"
  ON invitations FOR INSERT
  TO authenticated
  WITH CHECK (
    invited_by = auth.uid()
    AND child_id IN (
      SELECT c.id FROM children c
      JOIN rooms r ON r.id = c.room_id
      WHERE r.daycare_id = (
        SELECT daycare_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- service_role tiene acceso total
CREATE POLICY "Service role can manage invitations"
  ON invitations FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Data API
GRANT SELECT, INSERT ON invitations TO authenticated;
GRANT ALL ON invitations TO service_role;
```

Mapping UI → DB:

| UI (mockup) | `relationship_type` |
| --- | --- |
| Mamá | `mother` |
| Papá | `father` |
| Tutor/a | `guardian` |

## Plan de implementación

1. **Crear migración de invitations.** Crear `supabase/migrations/20260930_create_invitations.sql` con enums, tabla, RLS, policies y GRANTs del SQL de este spec. Verificar: `npm run build` compila.

2. **Aplicar migración a Supabase.** Usar `supabase_apply_migration` con el contenido del archivo. Nombre: `create_invitations`. Verificar: `supabase_list_tables` retorna `invitations`.

3. **Verificar enums.** Ejecutar `SELECT enum_range(null::relationship_type)` y `SELECT enum_range(null::invitation_status)`. Verificar: valores correctos del esquema.

4. **Verificar RLS.** Ejecutar `supabase_get_advisors` tipo `security`. Verificar: sin advisories para `invitations`.

5. **Instalar Resend y documentar env.** `npm install resend`. Agregar a `.env.template`:
   ```
   RESEND_API_KEY=re_xxxxxxxxx
   RESEND_FROM=OpenDayCare <onboarding@resend.dev>
   APP_BASE_URL=http://localhost:3000
   ```
   En producción, `RESEND_FROM` debe usar un dominio verificado en Resend. Verificar: build compila.

6. **Helper de email.** Crear `lib/email/invitation-email.ts`: función que recibe `{ parentName, childName, code }` y retorna `{ subject, html }`. Subject en español tipo "Te invitaron a OpenDayCare". HTML simple con colores del producto (fondo `#FBF4EC`, acento coral `#F4977E`), saludo, nombre del niño, código en Fredoka-like monoespaciada, botón "Activar mi cuenta" hacia `${process.env.APP_BASE_URL}/activate?code=${code}`, y nota de vencimiento en 7 días. Verificar: build compila.

7. **Server action `createInvitation`.** En `app/actions/invitations.ts`, función que recibe `{ childId, fullName, email, relationship }`:
   - `createClient(cookieStore)` de `utils/supabase/server`.
   - Obtener usuario y profile de `users`; rechazar si no es `staff` o no tiene `daycare_id`.
   - Cargar el niño y su `rooms.daycare_id`; rechazar si el niño no pertenece al daycare del staff.
   - Validar nombre no vacío, email con formato básico, relationship en `mother|father|guardian`.
   - Generar código de 5 chars (`A-Z0-9`) en el servidor; reintentar si UNIQUE conflict.
   - Insertar en `invitations` con `invited_by = auth.uid()`, `status = 'pending'`, `expires_at` +7 días.
   - Enviar email con `new Resend(process.env.RESEND_API_KEY).emails.send({ from: RESEND_FROM, to: [email], subject, html })`.
   - Si Resend falla: retornar `{ success: false, code, error: "..." }` sin borrar la fila (queda pending).
   - Si todo ok: `{ success: true, invitation }`.
   Verificar: `npm run build` compila.

8. **Conectar `/vincular-padre` a datos reales.** En `app/kids/[slug]/vincular-padre/page.tsx`:
   - Cargar el niño por UUID desde Supabase (no mock).
   - Quitar la generación client-side del código.
   - Al submit: llamar `createInvitation` con nombre, email, parentesco mapeado.
   - Éxito: toast/mensaje de éxito + navegar a `/kids/[slug]`.
   - Error con código: mostrar el código en la caja y mensaje "El correo no se pudo enviar. Pasale este código al padre."
   - Error de validación/RLS: mensaje en español sin exponer detalles internos.
   Verificar: con un niño real, el action inserta en `invitations`.

9. **Perfil del niño con datos reales.** En `app/kids/[slug]/page.tsx`:
   - Cargar niño desde Supabase por UUID.
   - Cargar invitaciones `pending` del niño vía el client de Supabase (RLS de staff).
   - Renderizar "Padres vinculados" con: invitaciones pending (badge PENDIENTE) + fila "Vincular otro padre" hacia la ruta.
   - Dejar fuera del alcance de este spec la lista de `parent_children` (SPEC 12).
   Verificar: tras crear una invitación, el perfil muestra PENDIENTE con el nombre y parentesco.

10. **Verificación integral.** `npm run lint` y `npm run build` pasan. Flujo manual: staff logueado → vincular padre → fila en `invitations` → correo recibido (o fallback con código en UI) → perfil con badge PENDIENTE. `supabase_get_advisors` sin issues de seguridad.

## Criterios de aceptación

- [ ] `npm run lint` pasa sin errores.
- [ ] `npm run build` compila sin errores de tipos.
- [ ] Enums `relationship_type` e `invitation_status` existen con los valores del esquema.
- [ ] Tabla `invitations` existe con todos los campos del modelo de datos.
- [ ] `code` tiene restricción UNIQUE.
- [ ] RLS habilitado en `invitations`.
- [ ] Policy de SELECT filtra por daycare del usuario autenticado.
- [ ] Policy de INSERT exige `invited_by = auth.uid()` y niño del mismo daycare.
- [ ] Paquete `resend` está en `package.json`.
- [ ] `.env.template` incluye `RESEND_API_KEY`, `RESEND_FROM` y `APP_BASE_URL`.
- [ ] `lib/email/invitation-email.ts` genera HTML en español con código y CTA a `/activate?code=…`.
- [ ] Server action `createInvitation` inserta una fila `pending` con `expires_at` a 7 días.
- [ ] El action genera el código en el servidor (no en el cliente).
- [ ] Mapping Mamá/Papá/Tutor/a → `mother`/`father`/`guardian` al persistir.
- [ ] `/vincular-padre` con niño real crea la invitación en Supabase.
- [ ] Si Resend falla, la invitación queda `pending` y la UI muestra el código + error.
- [ ] `/kids/[slug]` muestra al padre invitado con badge PENDIENTE.
- [ ] `/kids/[slug]` no usa `lib/mock/kids.ts` para el perfil ni para vincular-padre.
- [ ] `supabase_get_advisors` tipo `security` no reporta issues para `invitations`.
- [ ] No hay errores en consola al crear invitación desde la UI.

## Decisiones

- **Sí:** dos specs (este + SPEC 12 de activación) — el usuario eligió partir el flujo; este cubre persistencia + email, el otro activación + `parent_children`.
- **Sí:** Resend con paquete Node en server action — el usuario pidió resend.com + paquete de node; no hace falta Edge Function.
- **Sí:** generar el código en el servidor al crear la invitación — el mock generaba en el cliente al cargar; con persistencia el código debe ser único y estable.
- **Sí:** `expires_at = now() + 7 días` — coherente con el mockup "Vence en 7 días".
- **Sí:** si el email falla, la invitación queda `pending` y se muestra el código — el staff puede informarlo al padre; cancelar/reenviar va en otro spec.
- **Sí:** RLS por daycare vía `children → rooms → daycare_id` — consistente con SPEC 10.
- **Sí:** preview/lectura de invitaciones en el perfil solo para staff autenticado — no se expone `invitations` a `anon`.
- **Sí:** en dev usar `onboarding@resend.dev` como `RESEND_FROM` — no exige dominio verificado; prod documenta dominio propio.
- **Sí:** conectar también el perfil del niño a datos reales — sin eso no se puede verificar el badge PENDIENTE ni navegar con UUID real.
- **Sí:** nombres/variables de código en inglés (convención del repo); copy de UI y email en español.
- **No:** Edge Function para el correo — el usuario eligió el paquete Node.
- **No:** reenviar/cancelar invitación — va en otro spec.
- **No:** invitar un email que ya tiene cuenta — el SPEC 12 mostrará error de cuenta existente.
- **No:** React Email u otras plantillas — HTML simple alcanza para el flujo.
- **No:** marcar `status = 'expired'` con un cron — el check de vencimiento se hace al validar (SPEC 12) y al listar si hiciera falta.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| `RESEND_FROM` sin dominio verificado falla en env | Dev usa `onboarding@resend.dev`; documentar dominio prod en el spec/env |
| Colisión de códigos de 5 caracteres | UNIQUE + reintento en el action; 36^5 combinaciones |
| RLS bloquea INSERT si `daycare_id` del staff es null | El action valida staff + daycare antes de insertar |
| Correo filtrado como spam | Asunto claro en español; CTA visible; resend con dominio verificado en prod |
| Perfil sigue en mock si solo se toca vincular-padre | Paso 9 del plan conecta también `/kids/[slug]` |

## Lo que **no** está en este spec

- Tabla `parent_children`.
- Activación de cuenta con código.
- Creación de usuario padre en Supabase Auth.
- Login automático del padre.
- Badge ACTIVA en el perfil del niño.
- Reenvío o cancelación de invitaciones.
- Invitación a emails ya registrados.
- Feed o vistas de familia.

Cada una de esas, si llega, va en su propio spec (la activación y el vínculo ya están en el SPEC 12).
