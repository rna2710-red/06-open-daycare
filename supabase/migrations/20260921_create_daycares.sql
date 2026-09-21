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
