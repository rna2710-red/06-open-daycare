import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js 16 bloquea por defecto los recursos de dev (incluido el WebSocket
  // de HMR en /_next/hmr) cuando el origen no es `localhost`. Sin ese
  // WebSocket la hidratación de React nunca arranca, el submit del login
  // hace un GET nativo a `/login?` y no se crea sesión.
  allowedDevOrigins: ["127.0.0.1", "192.168.15.193"],
};

export default nextConfig;
