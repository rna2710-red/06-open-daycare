# SPEC 10 — Tablas rooms/children, agregar niño funcional, búsqueda y selector de sala

> **Estado:** Aprobado
> **Depende de:** SPEC 08 (tabla `users` + enums)
> **Fecha:** 2026-09-29
> **Objetivo:** Crear tablas `rooms` y `children`, conectar el modal de agregar niño a Supabase, e implementar búsqueda y selector de sala en `/kids`.

## Por qué existe este spec

Las pantallas de `/kids` y el modal de agregar niño existen como UI estática (SPEC 02, SPEC 04) pero usan datos mock. La tabla `users` y el trigger de sync con `auth.users` ya están en Supabase (SPEC 08). Falta: crear las tablas de dominio `rooms` y `children`, que el modal de agregar niño guarde en la BD, y que la vista `/kids` muestre datos reales con búsqueda y filtrado por sala.

## Alcance

**In:**

- Enum `child_status` (`active`, `archived`).
- Tabla `rooms` con campos: `id`, `daycare_id`, `name`, `created_at`.
- Tabla `children` con campos: `id`, `room_id`, `full_name`, `birth_date`, `enrolled_at`, `medical_notes`, `allergy_tags`, `photo_consent`, `status`, `created_at`, `updated_at`.
- RLS en ambas tables: staff ve todos los niños de su daycare; padres solo ven hijos vinculados.
- Seed de 3 salas: "Soles", "Lunas", "Estrellas" para el daycare del usuario staff.
- Server action `addChild` para crear niño en Supabase.
- Conectar modal de agregar niño (SPEC 04) al server action.
- Reemplazar datos mock en `/kids` por consulta real a Supabase.
- Selector de sala en `/kids` con opción "Todas las salas" (por defecto) y filtrado por sala seleccionada.
- Búsqueda case-insensitive por nombre de niño o nombre de sala.
- Búsqueda funciona junto con el filtro de sala (se combinan).

**Fuera de alcance (specs futuros):**

- Vinculación padre ↔ niño (`parent_children`).
- Creación de usuario padre/tutor al agregar niño.
- Edición de niño existente.
- Archivado de niños (`child_status = 'archived'`).
- Fotos de niños.
- Resumen diario.
- Invitaciones.

## Modelo de datos

```sql
-- Enums
CREATE TYPE child_status AS ENUM ('active', 'archived');

-- Tabla rooms
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daycare_id UUID NOT NULL REFERENCES daycares(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla children
CREATE TABLE children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
  full_name TEXT NOT NULL,
  birth_date DATE NOT NULL,
  enrolled_at DATE NOT NULL DEFAULT CURRENT_DATE,
  medical_notes TEXT,
  allergy_tags TEXT[] DEFAULT '{}',
  photo_consent BOOLEAN NOT NULL DEFAULT true,
  status child_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS rooms
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can read rooms in their daycare"
  ON rooms FOR SELECT
  TO authenticated
  USING (daycare_id = (
    SELECT daycare_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Service role can manage rooms"
  ON rooms FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS children
ALTER TABLE children ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can read children in their daycare"
  ON children FOR SELECT
  TO authenticated
  USING (room_id IN (
    SELECT id FROM rooms WHERE daycare_id = (
      SELECT daycare_id FROM users WHERE id = auth.uid()
    )
  ));

CREATE POLICY "Staff can insert children in their daycare"
  ON children FOR INSERT
  TO authenticated
  WITH CHECK (room_id IN (
    SELECT id FROM rooms WHERE daycare_id = (
      SELECT daycare_id FROM users WHERE id = auth.uid()
    )
  ));

CREATE POLICY "Service role can manage children"
  ON children FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- GRANTs
GRANT SELECT ON rooms TO authenticated;
GRANT ALL ON rooms TO service_role;
GRANT SELECT, INSERT ON children TO authenticated;
GRANT ALL ON children TO service_role;

-- Seed: salas para el daycare del usuario staff
INSERT INTO rooms (daycare_id, name)
SELECT id, 'Soles' FROM daycares WHERE name = 'Sala Soles'
ON CONFLICT DO NOTHING;

INSERT INTO rooms (daycare_id, name)
SELECT id, 'Lunas' FROM daycares WHERE name = 'Sala Soles'
ON CONFLICT DO NOTHING;

INSERT INTO rooms (daycare_id, name)
SELECT id, 'Estrellas' FROM daycares WHERE name = 'Sala Soles'
ON CONFLICT DO NOTHING;
```

## Plan de implementación

1. **Crear migración de `rooms` y `children`.** Crear archivo `supabase/migrations/20260929_create_rooms_children.sql` con el SQL completo: enums, tablas, RLS, policies, GRANTs, seed de salas. Verificar: `npm run build` compila.

2. **Aplicar migración a Supabase.** Usar `supabase_apply_migration` con el contenido del archivo. Nombre: `create_rooms_children`. Verificar: `supabase_list_tables` retorna `rooms` y `children`.

3. **Verificar seed de salas.** Ejecutar `SELECT id, name FROM rooms WHERE daycare_id = (SELECT id FROM daycares WHERE name = 'Sala Soles')`. Verificar: 3 filas (Soles, Lunas, Estrellas).

4. **Verificar RLS.** Ejecutar `supabase_get_advisors` tipo `security`. Verificar: sin advisories para `rooms` o `children`.

5. **Crear server action `addChild`.** En `app/actions/children.ts`, función `addChild` que recibe `{ fullName, birthDate, roomId, medicalNotes, allergyTags, photoConsent }`, valida datos, inserta en `children`, y retorna el niño creado. Usar el client helper de Supabase server. Verificar: `npm run build` compila.

6. **Conectar modal de agregar niño.** En `app/components/kids/AddChildModal.tsx`: reemplazar `useState` por formulario controlado, llamar `addChild` en submit, manejar éxito (cerrar modal, refrescar lista) y error (mostrar mensaje). Verificar: agregar un niño desde la UI lo crea en Supabase.

7. **Reemplazar mock data en `/kids`.** En `app/kids/page.tsx`: eliminar import de `lib/mock/kids.ts`, hacer fetch de children desde Supabase (usando server component o client-side con useEffect), mostrar datos reales. Verificar: la página muestra niños de la BD.

8. **Agregar selector de sala.** En `app/kids/page.tsx`: agregar dropdown con "Todas las salas" + salas del daycare, estado local `selectedRoom`, filtrar niños por sala seleccionada. Verificar: seleccionar "Soles" muestra solo niños de Soles.

9. **Implementar búsqueda.** En `app/kids/page.tsx`: conectar input de búsqueda a estado local `searchQuery`, filtrar niños por `full_name` (case-insensitive) o `rooms.name` (case-insensitive). Verificar: buscar "mateo" muestra niños con nombre "Mateo".

10. **Combinar filtros.** Verificar: selector de sala + búsqueda funcionan juntos (ej. buscar "mateo" en sala "Soles").

11. **Verificación integral.** `npm run lint` y `npm run build` pasan. Modal de agregar niño crea niño en BD. `/kids` muestra datos reales. Selector de sala filtra. Búsqueda funciona.

## Criterios de aceptación

- [ ] `npm run lint` pasa sin errores.
- [ ] `npm run build` compila sin errores de tipos.
- [ ] Enum `child_status` existe con valores `active` y `archived`.
- [ ] Tabla `rooms` existe con campos `id`, `daycare_id`, `name`, `created_at`.
- [ ] Tabla `children` existe con todos los campos del esquema.
- [ ] RLS habilitado en `rooms` y `children`.
- [ ] Policy de SELECT para `authenticated` filtra por `daycare_id` del usuario.
- [ ] Policy de INSERT para `authenticated` permite crear niños en salas de su daycare.
- [ ] 3 salas seed creadas: Soles, Lunas, Estrellas.
- [ ] Server action `addChild` inserta niño en Supabase.
- [ ] Modal de agregar niño llama al server action y crea el niño.
- [ ] `/kids` muestra niños reales de la BD (no mock data).
- [ ] Selector de sala muestra "Todas las salas" + salas del daycare.
- [ ] Selector de sala filtra niños por sala seleccionada.
- [ ] Búsqueda case-insensitive por nombre de niño funciona.
- [ ] Búsqueda también filtra por nombre de sala.
- [ ] Selector de sala y búsqueda se combinan correctamente.
- [ ] No hay errores en consola al agregar niño o navegar `/kids`.

## Decisiones

- **Sí:** enum `child_status` — consistente con el esquema de referencia y otros enums del proyecto.
- **Sí:** RLS por `daycare_id` via subquery — staff solo ve niños de su daycare. Padre solo verá sus hijos (cuando se implemente `parent_children`).
- **Sí:** Policy de INSERT para `authenticated` — permite a staff crear niños. Se validará en server action que el usuario sea staff.
- **Sí:** `ON DELETE RESTRICT` en `children.room_id` — no se puede borrar una sala que tenga niños.
- **Sí:** seed de salas en la migración — facilita pruebas inmediatas.
- **Sí:** server action en `app/actions/children.ts` — patrón existente (ver `app/actions/auth.ts`).
- **Sí:** búsqueda case-insensitive — UX más natural.
- **Sí:** "Todas las salas" como opción por defecto — permite ver todo sin filtrar.
- **Sí:** búsqueda combina con filtro de sala — flexibilidad máxima.
- **No:** vinculación padre ↔ niño — va en otro spec.
- **No:** edición de niño — va en otro spec.
- **No:** archivado de niños — va en otro spec.
- **No:** creación de usuario padre/tutor — va en otro spec.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| RLS puede bloquear inserts si la subquery no retorna el daycare_id correcto | Verificar con `supabase_get_advisors` después de la migración |
| Búsqueda case-insensitive puede ser lenta con muchos niños | Usar `ILIKE` que es suficiente para volumes iniciales; optimizar con índice si es necesario |
| Selector de sala puede no mostrar salas si el usuario no tiene daycare_id | Validar en server side que el usuario autenticado tiene daycare_id |

## Lo que **no** está en este spec

- Vinculación padre ↔ niño.
- Edición de niño.
- Archivado de niños.
- Creación de usuario padre/tutor.
- Fotos de niños.
- Resumen diario.
- Invitaciones.

Cada una de esas, si llega, va en su propio spec.
