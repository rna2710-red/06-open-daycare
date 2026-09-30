-- Fix: security advisory for public.rls_auto_enable
-- SECURITY DEFINER event-trigger function was callable via REST RPC by anon/authenticated.
-- Keep it for the ensure_rls event trigger (postgres/service_role only).

REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM public, anon, authenticated;
