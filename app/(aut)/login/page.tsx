"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  "Invalid login credentials": "Credenciales inválidas. Intentá de nuevo.",
  "Email not confirmed": "Tu email aún no está confirmado.",
  "User already registered": "Ese email ya está registrado.",
  "Password should be at least 6 characters":
    "La contraseña debe tener al menos 6 caracteres.",
};

function getAuthErrorMessage(message: string | undefined): string {
  if (!message) return "Credenciales inválidas. Intentá de nuevo.";
  return (
    AUTH_ERROR_MESSAGES[message] ?? "No pudimos iniciar sesión. Intentá de nuevo."
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      console.log("[Login] Attempting signInWithPassword for:", email);

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log("[Login] signInWithPassword result:", {
        hasUser: !!data?.user,
        hasSession: !!data?.session,
        error: authError?.message,
      });

      setLoading(false);

      if (authError) {
        console.error("[Login] Auth error:", authError.message);
        setError(getAuthErrorMessage(authError.message));
        return;
      }

      console.log("[Login] Navigating to / ...");
      router.push("/");
    } catch (err) {
      console.error("[Login] Unexpected error:", err);
      setLoading(false);
      setError("Error inesperado. Intentá de nuevo.");
    }
  };

  const inputClassName =
    "w-full rounded-[14px] border border-[#EADFD0] bg-white px-4 py-3.5 text-[15px] text-tinta transition-colors placeholder:text-tinta-media focus:border-acento-oscuro focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento-oscuro";

  return (
    <div
      className="flex min-h-screen flex-col md:grid md:grid-cols-[1.05fr_1fr]"
      style={{ background: "#FBF4EC" }}
    >
      {/* ── Panel izquierdo ── */}
      <div className="relative hidden overflow-hidden md:flex md:flex-col md:justify-between md:px-10 md:py-10">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(155deg, #C5503A 0%, #B04532 45%, #A84232 100%)",
          }}
        />

        {/* Círculos decorativos */}
        <div className="absolute -left-20 -top-20 h-[260px] w-[260px] rounded-full bg-white/10" />
        <div className="absolute -bottom-16 -right-16 h-[220px] w-[220px] rounded-full bg-white/10" />
        <div className="absolute left-1/2 top-1/3 h-[140px] w-[140px] -translate-x-1/2 rounded-full bg-white/[0.07]" />

        <div className="relative z-10">
          {/* Logo */}
          <div className="mb-10 flex items-center gap-2.5">
            <svg
              width="34"
              height="34"
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              focusable="false"
            >
              <circle cx="20" cy="20" r="18" fill="#FDDC81" />
              <circle cx="20" cy="20" r="12" fill="#F7C948" />
              <circle cx="20" cy="20" r="6" fill="#FDDC81" />
              <line
                x1="20"
                y1="0"
                x2="20"
                y2="6"
                stroke="#F7C948"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <line
                x1="20"
                y1="34"
                x2="20"
                y2="40"
                stroke="#F7C948"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <line
                x1="0"
                y1="20"
                x2="6"
                y2="20"
                stroke="#F7C948"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <line
                x1="34"
                y1="20"
                x2="40"
                y2="20"
                stroke="#F7C948"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <line
                x1="5.86"
                y1="5.86"
                x2="10.1"
                y2="10.1"
                stroke="#F7C948"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <line
                x1="29.9"
                y1="29.9"
                x2="34.14"
                y2="34.14"
                stroke="#F7C948"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <line
                x1="34.14"
                y1="5.86"
                x2="29.9"
                y2="10.1"
                stroke="#F7C948"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <line
                x1="10.1"
                y1="29.9"
                x2="5.86"
                y2="34.14"
                stroke="#F7C948"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
            <span className="font-display text-[21px] font-semibold text-white">
              OpenDayCare
            </span>
          </div>

          {/* Título de marca (decorativo respecto al h1 del formulario) */}
          <p className="mb-4 max-w-[420px] font-display text-[42px] font-semibold leading-[1.15] text-white">
            El día de cada niño, compartido con su familia.
          </p>
          <p className="max-w-[380px] text-[17px] text-white">
            Seguí el día a día de tu hijo en tiempo real: comidas, siestas,
            actividades y fotos.
          </p>
        </div>

        {/* Footer */}
        <p className="relative z-10 text-[14px] text-white">
          🌿 Guardería Sala Soles
        </p>
      </div>

      {/* ── Panel derecho ── */}
      <main className="flex flex-1 items-center justify-center px-6 py-12 md:px-0">
        <div className="w-full max-w-[392px]">
          {/* Logo móvil */}
          <div className="mb-8 flex items-center gap-2 md:hidden">
            <svg
              width="28"
              height="28"
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              focusable="false"
            >
              <circle cx="20" cy="20" r="18" fill="#FDDC81" />
              <circle cx="20" cy="20" r="12" fill="#F7C948" />
              <circle cx="20" cy="20" r="6" fill="#FDDC81" />
            </svg>
            <span className="font-display text-[18px] font-semibold text-tinta">
              OpenDayCare
            </span>
          </div>

          <h1 className="mb-2 font-display text-[30px] font-semibold text-tinta">
            Iniciar sesión
          </h1>
          <p className="mb-8 text-[15px] text-tinta-media">
            Ingresá para ver el día de hoy.
          </p>

          <form
            onSubmit={handleSubmit}
            aria-busy={loading}
            className="flex flex-col gap-5"
          >
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-[13px] font-semibold text-tinta-media"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="tu@email.com"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? "login-error" : undefined}
                className={inputClassName}
              />
            </div>

            {/* Contraseña */}
            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-[13px] font-semibold text-tinta-media"
              >
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? "login-error" : undefined}
                className={inputClassName}
              />
            </div>

            {/* Olvidaste tu contraseña — recuperación fuera de alcance (SPEC 09) */}
            <div className="text-right">
              <span className="text-[13.5px] font-bold text-[#A84232]">
                ¿Olvidaste tu contraseña?
              </span>
            </div>

            {/* Error */}
            {error && (
              <p
                id="login-error"
                role="alert"
                className="text-center text-[14px] font-semibold text-red-700"
              >
                {error}
              </p>
            )}

            {/* Botón Iniciar sesión */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-[15px] py-[15px] text-[16px] font-extrabold text-white shadow-[0_6px_20px_-6px_rgba(180,69,50,.55)] transition-[filter] hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-white disabled:opacity-60"
              style={{
                background: "linear-gradient(135deg, #B04532, #A84232)",
              }}
            >
              {loading ? "Ingresando..." : "Iniciar sesión"}
            </button>
          </form>

          {/* Activá tu cuenta */}
          <p className="mt-6 text-center text-[14.5px] text-tinta-media">
            ¿Te invitó la guardería?{" "}
            <Link
              href="/activate"
              className="font-extrabold text-[#A84232] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A84232]"
            >
              Activá tu cuenta
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
