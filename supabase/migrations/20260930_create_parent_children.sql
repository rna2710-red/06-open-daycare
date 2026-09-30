-- Tabla parent_children (vínculo padre ↔ niño)
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
