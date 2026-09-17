"use client";

import Link from "next/link";

export default function LoginPage() {
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
              "linear-gradient(155deg, #F6A98E 0%, #F2937A 45%, #EC7E62 100%)",
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

          {/* Título */}
          <h1 className="mb-4 max-w-[420px] font-display text-[42px] font-semibold leading-[1.15] text-white">
            El día de cada niño, compartido con su familia.
          </h1>
          <p className="max-w-[380px] text-[17px] text-white/92">
            Seguí el día a día de tu hijo en tiempo real: comidas, siestas,
            actividades y fotos.
          </p>
        </div>

        {/* Footer */}
        <p className="relative z-10 text-[14px] text-white/80">
          🌿 Guardería Sala Soles
        </p>
      </div>

      {/* ── Panel derecho ── */}
      <div className="flex flex-1 items-center justify-center px-6 py-12 md:px-0">
        <div className="w-full max-w-[392px]">
          {/* Logo móvil */}
          <div className="mb-8 flex items-center gap-2 md:hidden">
            <svg
              width="28"
              height="28"
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="20" cy="20" r="18" fill="#FDDC81" />
              <circle cx="20" cy="20" r="12" fill="#F7C948" />
              <circle cx="20" cy="20" r="6" fill="#FDDC81" />
            </svg>
            <span className="font-display text-[18px] font-semibold text-tinta">
              OpenDayCare
            </span>
          </div>

          <h2 className="mb-2 font-display text-[30px] font-semibold text-tinta">
            Iniciar sesión
          </h2>
          <p className="mb-8 text-[15px] text-tinta-suave">
            Ingresá para ver el día de hoy.
          </p>

          <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-5">
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
                type="email"
                placeholder="tu@email.com"
                className="w-full rounded-[14px] border border-[#EADFD0] bg-white px-4 py-3.5 text-[15px] text-tinta outline-none transition-colors placeholder:text-tinta-mute focus:border-coral"
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
                type="password"
                placeholder="••••••••"
                className="w-full rounded-[14px] border border-[#EADFD0] bg-white px-4 py-3.5 text-[15px] text-tinta outline-none transition-colors placeholder:text-tinta-mute focus:border-coral"
              />
            </div>

            {/* Olvidaste tu contraseña */}
            <div className="text-right">
              <a
                href="#"
                className="text-[13.5px] font-bold text-acento-oscuro hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            {/* Botón Iniciar sesión */}
            <button
              type="submit"
              className="w-full rounded-[15px] py-[15px] text-[16px] font-extrabold text-white shadow-[0_6px_20px_-6px_rgba(238,129,100,.55)] transition-opacity hover:opacity-90"
              style={{
                background: "linear-gradient(135deg, #F4977E, #EE8164)",
              }}
            >
              Iniciar sesión
            </button>
          </form>

          {/* Activá tu cuenta */}
          <p className="mt-6 text-center text-[14.5px] text-tinta-media">
            ¿Te invitó la guardería?{" "}
            <Link
              href="/activar-cuenta"
              className="font-extrabold text-acento-oscuro hover:underline"
            >
              Activá tu cuenta
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
