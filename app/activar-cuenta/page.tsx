"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthCheckbox } from "@/app/components/auth/AuthCheckbox";
import { invitedChild, invitationCode } from "@/lib/mock/auth";

export default function ActivarCuentaPage() {
  const [photoAuth, setPhotoAuth] = useState(true);

  return (
    <div
      className="flex min-h-screen items-center justify-center px-5 py-10"
      style={{ background: "#FBF4EC" }}
    >
      <div className="flex w-full max-w-[440px] flex-col items-center">
        {/* Logo decorativo */}
        <div
          className="mb-6 flex h-[58px] w-[58px] items-center justify-center rounded-[18px] shadow-[0_6px_18px_-4px_rgba(242,147,122,.45)]"
          style={{
            background: "linear-gradient(135deg, #F8C3A8, #F2937A)",
          }}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="20" cy="20" r="18" fill="white" fillOpacity="0.3" />
            <circle cx="20" cy="20" r="12" fill="white" fillOpacity="0.5" />
            <circle cx="20" cy="20" r="6" fill="white" />
            <line
              x1="20"
              y1="0"
              x2="20"
              y2="6"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <line
              x1="20"
              y1="34"
              x2="20"
              y2="40"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <line
              x1="0"
              y1="20"
              x2="6"
              y2="20"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <line
              x1="34"
              y1="20"
              x2="40"
              y2="20"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Título */}
        <h1 className="mb-2 text-center font-display text-[32px] font-semibold text-tinta">
          Bienvenida a OpenDayCare
        </h1>
        <p className="mb-7 text-center text-[15.5px] text-tinta-suave">
          Completá los datos para activar tu cuenta y empezar a seguir a tu
          hijo.
        </p>

        {/* Tarjeta niño invitado */}
        <div className="mb-6 flex w-full items-center gap-3.5 rounded-[16px] border border-[#EADFD0] bg-white p-3.5">
          <span
            className="flex h-[44px] w-[44px] flex-none items-center justify-center rounded-full font-display text-[19px] font-semibold"
            style={{
              background: invitedChild.avatarColor,
              color: invitedChild.avatarTextColor,
            }}
          >
            {invitedChild.initial}
          </span>
          <div className="min-w-0">
            <p className="text-[13px] text-tinta-suave">Te invitaron a seguir a</p>
            <p className="font-display text-[17px] font-semibold text-tinta">
              {invitedChild.name} · {invitedChild.room}
            </p>
          </div>
        </div>

        {/* Formulario */}
        <form
          onSubmit={(e) => e.preventDefault()}
          className="flex w-full flex-col gap-5"
        >
          {/* Código de invitación */}
          <div>
            <label
              htmlFor="invitation-code"
              className="mb-1.5 block text-[13px] font-semibold text-tinta-media"
            >
              Código de invitación
            </label>
            <input
              id="invitation-code"
              type="text"
              defaultValue={invitationCode}
              className="w-full rounded-[14px] border border-[#EADFD0] bg-white px-4 py-3.5 text-[15px] font-bold text-tinta outline-none transition-colors placeholder:text-tinta-mute focus:border-coral"
              style={{ letterSpacing: "3px", fontFamily: "var(--font-fredoka)" }}
            />
          </div>

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

          {/* Crear contraseña */}
          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-[13px] font-semibold text-tinta-media"
            >
              Crear contraseña
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              className="w-full rounded-[14px] border border-[#F2A78E] bg-white px-4 py-3.5 text-[15px] text-tinta outline-none transition-colors placeholder:text-tinta-mute focus:border-coral"
            />
          </div>

          {/* Checkbox autorización fotos */}
          <AuthCheckbox checked={photoAuth} onChange={setPhotoAuth} />

          {/* Botón Activar mi cuenta */}
          <button
            type="submit"
            className="w-full rounded-[15px] py-[15px] text-[16px] font-extrabold text-white shadow-[0_6px_20px_-6px_rgba(238,129,100,.55)] transition-opacity hover:opacity-90"
            style={{
              background: "linear-gradient(135deg, #F4977E, #EE8164)",
            }}
          >
            Activar mi cuenta
          </button>
        </form>

        {/* Link a login */}
        <p className="mt-6 text-center text-[14.5px] text-tinta-media">
          ¿Ya tenés cuenta?{" "}
          <Link
            href="/login"
            className="font-extrabold text-acento-oscuro hover:underline"
          >
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
