-- Fix: security advisories for handle_new_user
-- 1. Fix search_path mutable
ALTER FUNCTION public.handle_new_user() SET search_path = public;

-- 2. Revoke EXECUTE from roles that shouldn't call it directly
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM public, anon, authenticated;
