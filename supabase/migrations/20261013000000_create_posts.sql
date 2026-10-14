-- 20261013000000_create_posts.sql
-- SPEC DB 01 — Tablas de publicaciones (posts) y bucket de fotos

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
