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
