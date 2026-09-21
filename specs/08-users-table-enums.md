# SPEC 08 — Tabla `users` + enums + trigger

> **Estado:** Aprobado
> **Depende de:** SPEC 07 (tabla `daycares`)
> **Fecha:** 2026-09-21
> **Objetivo:** Crear la tabla `users` en Supabase con enums `user_role` y `user_status`, RLS, trigger de Supabase Auth y seed de usuario staff de prueba.

## Por qué existe este spec

La tabla `users` es la entidad central del dominio — pads y staff comparten tabla, diferenciados por `role`. Sin ella no hay autenticación funcionando, no hay posts, no hay vinculación padre-niño. Este spec establece la tabla, los enums que la modelan, el trigger que sincroniza con `auth.users`, y un usuario staff para poder probar el resto del sistema.

## Alcance

**In:**

- Enums `user_role` (`staff`, `parent`, `admin`) y `user_status` (`pending`, `active`).
- Tabla `users` con todos los campos del esquema de BD: `id`, `daycare_id`, `role`, `status`, `full_name`, `avatar_url`, `notify_on_post`, `daily_summary_enabled`, `created_at`, `updated_at`.
- FK `id` → `auth.users(id)` ON DELETE CASCADE.
- FK `daycare_id` → `daycares(id)`.
- RLS habilitado: cada usuario lee su propia fila; `service_role` tiene acceso total.
- Trigger `AFTER INSERT` en `auth.users` que crea la fila en `users` vía `raw_user_meta_data`.
- Seed: usuario staff `jose@staff.com` / `Nintento.2026`.
- Seed: asignar `daycare_id` a "Sala Soles" para el usuario staff.

**Fuera de alcance (specs futuros):**

- RLS policies que filtren por `daycare_id` (ej. staff ve a todos los usuarios de su guardería).
- Vinculación padre ↔ niño (`parent_children`).
- Creación de usuarios desde la UI (invitaciones, signup de padres).
- Generación de tipos TypeScript.
- Tablas `rooms`, `children`, `posts`, etc.

## Modelo de datos

```sql
-- Enums
CREATE TYPE user_role AS ENUM ('staff', 'parent', 'admin');
CREATE TYPE user_status AS ENUM ('pending', 'active');

-- Tabla users
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  daycare_id UUID REFERENCES daycares(id),
  role user_role NOT NULL,
  status user_status NOT NULL DEFAULT 'active',
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  notify_on_post BOOLEAN NOT NULL DEFAULT true,
  daily_summary_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Cada usuario lee su propia fila
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- service_role tiene acceso total
CREATE POLICY "Service role can manage users"
  ON users FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Data API access
GRANT SELECT ON users TO anon;
GRANT SELECT ON users TO authenticated;
GRANT ALL ON users TO service_role;

-- Trigger: crear fila en users al registrar en auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, full_name, role, daycare_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'staff'),
    (NEW.raw_user_meta_data->>'daycare_id')::UUID
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Seed: usuario staff
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_user_meta_data, created_at, updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'jose@staff.com',
  crypt('Nintento.2026', gen_salt('bf')),
  now(),
  '{"full_name": "José Staff", "role": "staff", "daycare_id": "<SALA_SOLES_UUID>"}'::jsonb,
  now(),
  now()
);
```

**Nota sobre el seed:** El `<SALA_SOLES_UUID>` se obtiene del SELECT en el paso 2 del plan. El trigger crea automáticamente la fila en `users`.

## Plan de implementación

1. **Obtener UUID de Sala Soles.** Ejecutar `SELECT id FROM daycares WHERE name = 'Sala Soles'` para obtener el UUID que necesita el seed. Verificar: retorna un UUID válido.
2. **Crear archivo de migración.** Crear `supabase/migrations/20260921_create_users_enums_trigger.sql` con el SQL completo: enums, tabla, RLS, policies, grants, trigger, seed. Usar el UUID del paso 1 en el INSERT. Verificar: el archivo existe y el SQL es válido.
3. **Aplicar migración a Supabase.** Usar `supabase_apply_migration` para ejecutar el SQL en el proyecto remoto. Nombre de la migración: `create_users_enums_trigger`. Verificar: `supabase_list_tables` retorna `users`.
4. **Verificar enums.** Ejecutar `SELECT enum_range(null::user_role)` y `SELECT enum_range(null::user_status)`. Verificar: `user_role` contiene `{staff,parent,admin}` y `user_status` contiene `{pending,active}`.
5. **Verificar usuario seed.** Ejecutar `SELECT id, email, role, full_name FROM users WHERE email = 'jose@staff.com'`. Verificar: existe una fila con `role = 'staff'` y `full_name = 'José Staff'`.
6. **Verificar RLS.** Ejecutar `supabase_get_advisors` tipo `security`. Verificar: sin advisories para `users`.

## Criterios de aceptación

- [ ] Los enums `user_role` y `user_status` existen con los valores correctos.
- [ ] La tabla `users` existe con todos los campos del esquema de BD.
- [ ] FK `id` → `auth.users(id)` ON DELETE CASCADE está definida.
- [ ] FK `daycare_id` → `daycares(id)` está definida.
- [ ] RLS está habilitado en `users`.
- [ ] Policy de SELECT para `authenticated` filtra por `auth.uid() = id`.
- [ ] Policy de ALL para `service_role` existe.
- [ ] GRANT de SELECT para `anon` y `authenticated` existe.
- [ ] Trigger `on_auth_user_created` existe y ejecuta `handle_new_user()`.
- [ ] El trigger crea la fila en `users` al insertar en `auth.users`.
- [ ] Usuario staff `jose@staff.com` existe en `users` con `role = 'staff'`.
- [ ] El usuario staff tiene `daycare_id` apuntando a "Sala Soles".
- [ ] `supabase_get_advisors` tipo `security` no reporta issues para `users`.

## Decisiones

- **Sí:** trigger `AFTER INSERT` en `auth.users` con `SECURITY DEFINER` — es el patrón recomendado por Supabase para sincronizar `auth.users` → tabla de dominio. Permite pasar `role`, `full_name` y `daycare_id` vía `raw_user_meta_data` en el signup.
- **Sí:** RLS solo para leer propia fila — el usuario indicó que las policies detalladas se definen más adelante. Con una policy de SELECT por `auth.uid() = id` es suficiente para que la app funcione sin exponer datos de otros usuarios.
- **Sí:** seed directo en `auth.users` (no vía Supabase Auth API) — permite control total del password y metadata sin necesidad de Edge Functions. El trigger se encarga de crear la fila en `users`.
- **Sí:** `COALESCE` en el trigger para `full_name` y `role` — si no se pasa metadata, usa valores por defecto seguros (`''` y `'staff'`).
- **Sí:** migración imperativa — consistente con el patrón establecido en SPEC 07.
- **No:** generación de tipos TypeScript — se hará cuando haya más tablas.
- **No:** RLS por `daycare_id` — depende de decisiones de UX que aún no se han tomado.
- **No:** creación de usuarios desde la UI — va en otro spec (invitaciones, signup).

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Seed en `auth.users` puede fallar si el email ya existe | Verificar antes de ejecutar que no exista un usuario con ese email |
| Trigger `SECURITY DEFINER` puede tener permisos insuficientes | Verificar con `supabase_get_advisors` después de la migración |
| `raw_user_meta_data` puede estar vacío en algunos flujos de signup | `COALESCE` en el trigger maneja valores nulos con defaults seguros |

## Lo que **no** está en este spec

- RLS policies por `daycare_id`.
- Vinculación padre ↔ niño.
- Creación de usuarios desde la UI.
- Generación de tipos TypeScript.
- Cualquier otra tabla del esquema.

Cada una de esas, si llega, va en su propio spec.
