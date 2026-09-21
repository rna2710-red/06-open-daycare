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

-- Security: fijar search_path y revocar EXECUTE innecesario
ALTER FUNCTION public.handle_new_user() SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM public, anon, authenticated;

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
  '{"full_name": "José Staff", "role": "staff", "daycare_id": "284bd541-e31f-438e-82c6-b3c8187fafb6"}'::jsonb,
  now(),
  now()
);
