# SPEC 07 — Migración tabla `daycares` + seed

> **Estado:** Aprobado
> **Depende de:** Ninguno (tabla raíz)
> **Fecha:** 2026-09-21
> **Objetivo:** Crear la tabla `daycares` en Supabase con RLS y seed de 4 guarderías (Sala Soles como principal).

## Por qué existe este spec

El esquema de BD define `daycares` como la tabla raíz de todo el modelo. Todas las demás tablas (`users`, `rooms`, `children`, etc.) dependen de ella mediante foreign keys. Este spec establece la primera migración real del proyecto, el patrón de migraciones a seguir, y semilla la base de datos con datos de prueba.

## Alcance

**In:**

- Migración SQL en `supabase/migrations/` con la tabla `daycares`:
  - `id` uuid PK (default `gen_random_uuid()`)
  - `name` text NOT NULL
  - `address` text (dirección de la guardería)
  - `created_at` timestamptz (default `now()`)
- Habilitar RLS en `daycares`.
- Policy inicial: `authenticated` puede SELECT (lectura); solo `service_role` puede INSERT/UPDATE/DELETE.
- GRANT explícito a `anon` y `authenticated` para acceso vía Data API (REST).
- Seed con 4 guarderías: "Sala Soles" (la principal), "Sala Estrellitas", "Sala Luna", "Sala Montaña".

**Fuera de alcance (specs futuros):**

- Tabla `users` y vinculación `daycare_id` → `auth.uid()`.
- Refinamiento de RLS policies (filtrar por `daycare_id` del usuario).
- Generación de tipos TypeScript.
- Tablas `rooms`, `children`, `posts`, etc.

## Modelo de datos

```sql
CREATE TABLE daycares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE daycares ENABLE ROW LEVEL SECURITY;

-- Policy: authenticated puede leer todas las guarderías
CREATE POLICY "Authenticated users can read daycares"
  ON daycares FOR SELECT
  TO authenticated
  USING (true);

-- Policy: solo service_role puede escribir
CREATE POLICY "Service role can manage daycares"
  ON daycares FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Data API access
GRANT SELECT ON daycares TO anon;
GRANT SELECT ON daycares TO authenticated;
GRANT ALL ON daycares TO service_role;

-- Seed
INSERT INTO daycares (name, address) VALUES
  ('Sala Soles', 'Av. Corrientes 1234, CABA'),
  ('Sala Estrellitas', 'Calle Falsa 456, Palermo'),
  ('Sala Luna', 'Av. Santa Fe 789, Recoleta'),
  ('Sala Montaña', 'Mitre 321, Belgrano');
```

**Notas sobre RLS:**

- La policy de SELECT para `authenticated` es `(true)` porque aún no existe la tabla `users` para vincular `auth.uid()` → `daycare_id`. Cuando se cree `users`, se reemplazará por una policy filtrada.
- `service_role` bypassa RLS por defecto en Supabase, pero la policy explícita documenta la intención.
- `anon` tiene SELECT para posibles funcionalidades públicas (ej. landing page).

## Plan de implementación

1. **Crear archivo de migración.** Crear `supabase/migrations/20260921_create_daycares.sql` con el SQL completo (tabla, RLS, policies, grants, seed). Verificar: el archivo existe y el SQL es válido.
2. **Aplicar migración a Supabase.** Usar `supabase_apply_migration` (MCP) para ejecutar el SQL en el proyecto remoto. Nombre de la migración: `create_daycares`. Verificar: `supabase_list_tables` retorna `daycares`.
3. **Verificar datos.** Ejecutar `SELECT * FROM daycares` para confirmar que las 4 guarderías se insertaron correctamente. Verificar: 4 filas, "Sala Soles" presente, campo `address` poblado.
4. **Verificar RLS.** Ejecutar `supabase_get_advisors` tipo `security` para confirmar que no hay advisories sobre la tabla. Verificar: sin advisories de seguridad para `daycares`.

## Criterios de aceptación

- [x] La tabla `daycares` existe en Supabase con los campos `id`, `name`, `address`, `created_at`.
- [x] RLS está habilitado en `daycares`.
- [x] Policy de SELECT existe para `authenticated`.
- [x] Policy de ALL existe para `service_role`.
- [x] GRANT de SELECT existe para `anon` y `authenticated`.
- [x] Seed inserta 4 guarderías correctamente.
- [x] "Sala Soles" es una de las guarderías insertadas.
- [x] `supabase_get_advisors` tipo `security` no reporta issues para `daycares`.

## Decisiones

- **Sí:** migración imperativa (no declarativa) — el proyecto no tiene `supabase/schemas/` ni `config.toml`, así que el patrón imperativo es el correcto.
- **Sí:** RLS habilitado desde el inicio — la tabla está en schema `public` (expuesto al Data API), RLS es obligatorio según las best practices de Supabase.
- **Sí:** policy de SELECT permisiva (`true`) para `authenticated` — sin la tabla `users` no hay forma de filtrar por `daycare_id`; se refinará después.
- **Sí:** GRANT explícito a `anon` y `authenticated` — sin estos permisos la tabla no es accesible vía REST API (configuración por defecto de Supabase).
- **Sí:** seed con 4 guarderías — "Sala Soles" como principal, las demás como datos de prueba para futuros specs.
- **Sí:** formato de migración `YYYYMMDDHHMMSS_descriptive_name` — consistente con las migraciones de prueba existentes.
- **No:** generación de tipos TypeScript — innecesario con una sola tabla; se hará cuando haya más tablas.
- **No:** refinamiento de RLS — depende de la tabla `users` que va en otro spec.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Policy de SELECT permisiva permite leer todas las guarderías | Aceptable para una app interna de guardería; se refinará cuando exista `users` |
| `gen_random_uuid()` produce UUIDv4 (random, no time-ordered) | Aceptable para una tabla pequeña (< 1M filas); el esquema lo define así |
| Data API no expone la tabla sin GRANT explícito | GRANT incluido en la migración; verificado con `supabase_list_tables` |

## Lo que **no** está en este spec

- Tabla `users` y vinculación `daycare_id` → `auth.uid()`.
- Refinamiento de RLS policies.
- Generación de tipos TypeScript.
- Cualquier otra tabla del esquema (`rooms`, `children`, `posts`, etc.).

Cada una de esas, si llega, va en su propio spec.
