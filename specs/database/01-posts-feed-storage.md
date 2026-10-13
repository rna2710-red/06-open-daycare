# SPEC DB 01 — Tablas de publicaciones (posts) y bucket de fotos

> **Estado:** Borrador
> **Depende de:** SPEC 08 (users + enums), SPEC 10 (rooms + children)
> **Fecha:** 2026-10-13
> **Objetivo:** Crear las tablas `posts`, `post_children` y `post_photos` con RLS, y el bucket privado `post-photos` en Supabase Storage, para soportar publicaciones del feed con fotos opcionales.

## Por qué existe este spec

El feed de la app usa datos mock (`lib/mock/feed.ts`) y no hay modelo persistente para publicaciones. Este spec define el modelo de datos mínimo para que el staff publique en el feed (SPEC app 13): una publicación con autor, tipo, texto, audiencia (niños, sala o toda la guardería) y hasta 10 fotos en Storage. Las tablas `reactions` y `comments` del esquema de referencia quedan para futuros specs.

## Alcance

**In:**

- Enum `post_type` con los 6 valores del esquema de referencia: `meal`, `nap`, `activity`, `achievement`, `photo`, `announcement`.
- Tabla `posts`: `id`, `author_id`, `room_id` (nullable), `type`, `title` (nullable), `body`, `published_at`, `created_at`, `updated_at`.
- Tabla `post_children`: PK compuesta (`post_id`, `child_id`) — niños etiquetados en la publicación.
- Tabla `post_photos`: `id`, `post_id`, `url` (ruta en Storage), `width`, `height`, `position`, `created_at`.
- Índices en claves foráneas y `published_at` DESC.
- RLS en las tres tablas (ver Modelo de datos).
- Bucket privado `post-photos` en Supabase Storage, creado por migración SQL.
- Policies de Storage: solo `staff` sube (path `{daycare_id}/…`); `staff`/`admin` del mismo daycare leen.
- Migración: `supabase/migrations/20261013000000_create_posts.sql`.

**Fuera de alcance (specs futuros):**

- Tablas `reactions` (likes) y `comments` del esquema de referencia.
- Tabla `daily_summaries`.
- Campos de auditoría de borradores/versiones.
- Notificaciones (`notify_on_post` ya existe en `users` pero no se dispara nada).
- Edición o eliminación de publicaciones (sin policies de UPDATE/DELETE).

## Modelo de datos

```sql
-- 20261013000000_create_posts.sql

-- Enum de tipos de publicación
CREATE TYPE post_type AS ENUM (
  'meal', 'nap', 'activity', 'achievement', 'photo', 'announcement'
);

-- Publicaciones
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  type post_type NOT NULL,
  title TEXT,
  body TEXT NOT NULL,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Niños etiquetados en la publicación
CREATE TABLE post_children (
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, child_id)
);

-- Fotos de la publicación (url = ruta en el bucket post-photos)
CREATE TABLE post_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  width INT,
  height INT,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_posts_room_id ON posts(room_id);
CREATE INDEX idx_posts_published_at ON posts(published_at DESC);
CREATE INDEX idx_post_children_child_id ON post_children(child_id);
CREATE INDEX idx_post_photos_post_id ON post_photos(post_id);

-- updated_at automático
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER posts_set_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_children ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_photos ENABLE ROW LEVEL SECURITY;

-- posts: staff y admin del mismo daycare leen; solo staff crea (autor = sí mismo)
CREATE POLICY "Staff and admin can read posts in their daycare"
  ON posts FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) IN ('staff', 'admin')
    AND author_id IN (
      SELECT id FROM users
      WHERE daycare_id = (SELECT daycare_id FROM users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Staff can create posts"
  ON posts FOR INSERT
  TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND (SELECT role FROM users WHERE id = auth.uid()) = 'staff'
  );

-- post_children: lectura por daycare del autor; inserción solo en posts propios
CREATE POLICY "Staff and admin can read post children in their daycare"
  ON post_children FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) IN ('staff', 'admin')
    AND post_id IN (
      SELECT p.id FROM posts p
      JOIN users u ON u.id = p.author_id
      WHERE u.daycare_id = (SELECT daycare_id FROM users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Staff can tag children on own posts"
  ON post_children FOR INSERT
  TO authenticated
  WITH CHECK (
    post_id IN (SELECT id FROM posts WHERE author_id = auth.uid())
  );

-- post_photos: mismas reglas que post_children
CREATE POLICY "Staff and admin can read post photos in their daycare"
  ON post_photos FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) IN ('staff', 'admin')
    AND post_id IN (
      SELECT p.id FROM posts p
      JOIN users u ON u.id = p.author_id
      WHERE u.daycare_id = (SELECT daycare_id FROM users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Staff can add photos to own posts"
  ON post_photos FOR INSERT
  TO authenticated
  WITH CHECK (
    post_id IN (SELECT id FROM posts WHERE author_id = auth.uid())
  );

-- Data API
GRANT SELECT, INSERT ON posts TO authenticated;
GRANT SELECT, INSERT ON post_children TO authenticated;
GRANT SELECT, INSERT ON post_photos TO authenticated;

-- Bucket privado de fotos de publicaciones
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-photos', 'post-photos', false)
ON CONFLICT (id) DO NOTHING;

-- Solo staff sube; la primera carpeta del path debe ser su daycare_id
CREATE POLICY "Staff can upload post photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'post-photos'
    AND (SELECT role FROM public.users WHERE id = auth.uid()) = 'staff'
    AND (storage.foldername(name))[1] = (
      SELECT daycare_id FROM public.users WHERE id = auth.uid()
    )::text
  );

-- staff y admin del mismo daycare leen (primera carpeta = su daycare_id)
CREATE POLICY "Same daycare staff and admin can read post photos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'post-photos'
    AND (SELECT role FROM public.users WHERE id = auth.uid()) IN ('staff', 'admin')
    AND (storage.foldername(name))[1] = (
      SELECT daycare_id FROM public.users WHERE id = auth.uid()
    )::text
  );
```

Convenciones:

- `post_photos.url` guarda la **ruta** dentro del bucket (ej. `{daycare_id}/{uuid}.jpg`), no una URL firmada. Las URLs firmadas se generan al leer el feed.
- Path de subida: `{daycare_id}/{crypto.randomUUID()}.{ext}` — la primera carpeta es el daycare para que el policy de Storage filtre por tenant.
- `room_id` en `posts` se usa cuando la audiencia es "toda la sala" (anuncio o actividad de sala). Para publicaciones etiquetadas a niños específicos, `room_id` queda `NULL` y la audiencia vive en `post_children`.
- Audiencia "toda la guardería": `type = 'announcement'`, `room_id NULL`, sin filas en `post_children`.

## Plan de implementación

1. **Crear la migración.** Escribir `supabase/migrations/20261013000000_create_posts.sql` con el SQL completo del Modelo de datos. Verificar: `npm run build` compila (la migración no afecta tipos de la app todavía).
2. **Aplicar la migración.** Usar `supabase_apply_migration` (o `/db-migrator`) con nombre `create_posts`. Verificar: `supabase_list_tables` retorna `posts`, `post_children`, `post_photos`.
3. **Verificar bucket.** `supabase_list_storage_buckets` incluye `post-photos` con `public: false`.
4. **Verificar RLS.** `supabase_get_advisors` tipo `security` sin advisories nuevos para estas tablas. Si hay, corregir la migración con una nueva migración (no editar la aplicada).
5. **Prueba manual de policies.** Con un usuario `staff` autenticado: INSERT en `posts` con `author_id` propio retorna fila; con `author_id` ajeno falla. Con un usuario `parent`: SELECT en `posts` retorna vacío (o falla por lack of policy).

## Criterios de aceptación

- [ ] Existe la migración `supabase/migrations/20261013000000_create_posts.sql`.
- [ ] Enum `post_type` existe con exactamente los valores `meal`, `nap`, `activity`, `achievement`, `photo`, `announcement`.
- [ ] Tabla `posts` existe con todas las columnas del modelo y RLS habilitado.
- [ ] Tabla `post_children` existe con PK compuesta (`post_id`, `child_id`) y RLS habilitado.
- [ ] Tabla `post_photos` existe con columnas `url`, `width`, `height`, `position` y RLS habilitado.
- [ ] Policy de SELECT en `posts` permite a `staff`/`admin` del mismo daycare y excluye otros daycares y `parent`.
- [ ] Policy de INSERT en `posts` permite solo a `staff` y exige `author_id = auth.uid()`.
- [ ] Policies de `post_children` y `post_photos` permiten INSERT solo sobre posts propios del autor.
- [ ] Bucket `post-photos` existe y es privado.
- [ ] Policy de INSERT en `storage.objects` permite subir solo a `staff` y solo dentro de la carpeta de su daycare.
- [ ] Policy de SELECT en `storage.objects` permite leer solo a `staff`/`admin` del mismo daycare.
- [ ] `supabase_get_advisors` (security) sin advisories para las tablas y policies nuevas.
- [ ] `npm run lint` y `npm run build` pasan.

## Decisiones

- **Sí:** 6 tipos alineados al esquema de referencia (`post_type` enum) — decisión del usuario (Q10); se quitó "ánimo" del modal.
- **Sí:** bucket privado `post-photos` con path `{daycare_id}/…` — aísla fotos por tenant a nivel de Storage; lectura vía RLS + URLs firmadas.
- **Sí:** subida del lado del cliente directa a Storage (no en el server action) — 10 fotos × 4 MB exceden el body de un server action; el SPEC app 13 orquesta subida + acción.
- **Sí:** `post_photos.url` guarda ruta, no URL pública — el bucket es privado; la app firma URLs al leer.
- **Sí:** solo `staff` crea publicaciones; `admin` solo lee — decisión del usuario (Q8: solo staff publica; Q15: RLS staff/admin del mismo daycare).
- **Sí:** sin policies de UPDATE/DELETE — edición y eliminación fuera de alcance; RLS deniega por defecto.
- **Sí:** no validar `photo_consent` al subir fotos — decisión explícita del usuario (Q12: NO).
- **Sí:** `room_id` solo para audiencia "toda la sala"; niños específicos usan `post_children` — alinea con el esquema de referencia.
- **Sí:** migración en un solo archivo con bucket incluido — todo el cambio de datos+storage es atómico y auditable en un paso.
- **No:** `reactions` y `comments` — fuera de alcance (Q15); van en specs futuros.
- **No:** notificaciones al publicar — fuera de alcance (Q22); `notify_on_post` queda intacto sin consumidores.
- **No:** trigger de notificación o fan-out — sin spec de notificaciones no se implementa nada.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Subida de fotos falla a mitad y quedan archivos huérfanos en Storage | El SPEC app 13 sube fotos antes de crear el post; si el action falla, las rutas quedan huérfanas. Limpieza futura con lifecycle rule o cron (fuera de alcance). |
| URL firmada expira y la foto no carga en el feed | Expiración generosa (1 hora) y firma al render; refresh de página regenera. |
| RLS de Storage no filtra por daycare correctamente | Path `{daycare_id}/…` + policy sobre `storage.foldername`; prueba manual con dos daycares en plan de implementación. |
| Migración aplicada y luego editada | Inmutable: correcciones van en migraciones nuevas (regla del proyecto). |

## Lo que **no** está en este spec

- `reactions` (likes) y `comments`.
- Edición o eliminación de publicaciones.
- Notificaciones push o email al publicar.
- Vista del feed para familias.
- Resúmenes diarios (`daily_summaries`).

Cada una de esas, si llega, va en su propio spec.
