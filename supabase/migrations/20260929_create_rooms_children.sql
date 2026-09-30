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
