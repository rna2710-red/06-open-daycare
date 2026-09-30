"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AuthCheckbox } from "@/app/components/auth/AuthCheckbox";
import {
  activateInvitation,
  getInvitationPreview,
  type InvitationPreview,
} from "@/app/actions/invitations";

const AVATAR_COLORS = [
  { bg: "#A9D9E8", text: "#1F7A93" },
  { bg: "#F4B8CC", text: "#C44A7A" },
  { bg: "#B9DEC4", text: "#3E8B62" },
  { bg: "#F4DC8E", text: "#9A7B1E" },
  { bg: "#C9B6E8", text: "#7B5FC0" },
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

const PREVIEW_CODE_LENGTH = 5;

function ActivateForm() {
  const searchParams = useSearchParams();
  const codeFromUrl = searchParams.get("code") ?? "";

  const [code, setCode] = useState(codeFromUrl);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [photoAuth, setPhotoAuth] = useState(true);
  const [preview, setPreview] = useState<InvitationPreview | null>(null);
  const [previewCode, setPreviewCode] = useState<string | null>(null);
  const [lastCode, setLastCode] = useState(codeFromUrl);
  const [error, setError] = useState<string | null>(null);
  const [showLoginLink, setShowLoginLink] = useState(false);
  const [loading, setLoading] = useState(false);

  const trimmedCode = code.trim();
  const canPreview = trimmedCode.length >= PREVIEW_CODE_LENGTH;
  const previewLoading = canPreview && previewCode !== trimmedCode;

  if (code !== lastCode) {
    setLastCode(code);
    if (trimmedCode.length < PREVIEW_CODE_LENGTH) {
      setPreview(null);
      setPreviewCode(null);
    }
  }

  useEffect(() => {
    if (trimmedCode.length < PREVIEW_CODE_LENGTH) {
      return;
    }

    let cancelled = false;

    getInvitationPreview(trimmedCode).then((data) => {
      if (!cancelled) {
        setPreview(data);
        setPreviewCode(trimmedCode);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [trimmedCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setShowLoginLink(false);
    setLoading(true);

    try {
      const result = await activateInvitation({
        code,
        email,
        password,
        photoAuth,
      });

      if (!result.success) {
        setError(result.error);
        setShowLoginLink(Boolean(result.showLoginLink));
        setLoading(false);
        return;
      }

      setLoading(false);
    } catch (err) {
      console.error("[Activate] Unexpected error:", err);
      setError("Error inesperado. Intentá de nuevo.");
      setLoading(false);
    }
  };

  const avatar = preview ? getAvatarColor(preview.childFullName) : null;

  return (
    <div
      className="flex min-h-screen items-center justify-center px-5 py-10"
      style={{ background: "#FBF4EC" }}
    >
      <div className="flex w-full max-w-[440px] flex-col items-center">
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

        <h1 className="mb-2 text-center font-display text-[32px] font-semibold text-tinta">
          Bienvenida a OpenDayCare
        </h1>
        <p className="mb-7 text-center text-[15.5px] text-tinta-suave">
          Completá los datos para activar tu cuenta y empezar a seguir a tu
          hijo.
        </p>

        <div className="mb-6 flex w-full items-center gap-3.5 rounded-[16px] border border-[#EADFD0] bg-white p-3.5">
          {preview && avatar ? (
            <>
              <span
                className="flex h-[44px] w-[44px] flex-none items-center justify-center rounded-full font-display text-[19px] font-semibold"
                style={{
                  background: avatar.bg,
                  color: avatar.text,
                }}
              >
                {preview.childFullName.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="text-[13px] text-tinta-suave">
                  Te invitaron a seguir a
                </p>
                <p className="font-display text-[17px] font-semibold text-tinta">
                  {preview.childFullName}
                  {preview.roomName ? ` · ${preview.roomName}` : ""}
                </p>
              </div>
            </>
          ) : (
            <>
              <span
                className="flex h-[44px] w-[44px] flex-none items-center justify-center rounded-full font-display text-[19px] font-semibold"
                style={{
                  background: "#EADFD0",
                  color: "#B0A290",
                }}
              >
                ?
              </span>
              <div className="min-w-0">
                <p className="text-[13px] text-tinta-suave">
                  Te invitaron a seguir a
                </p>
                <p className="font-display text-[17px] font-semibold text-tinta-suave">
                  {previewLoading
                    ? "Buscando al niño…"
                    : "Ingresá un código válido para ver al niño"}
                </p>
              </div>
            </>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-5">
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
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full rounded-[14px] border border-[#EADFD0] bg-white px-4 py-3.5 text-[15px] font-bold text-tinta outline-none transition-colors placeholder:text-tinta-mute focus:border-coral"
              style={{ letterSpacing: "3px", fontFamily: "var(--font-fredoka)" }}
            />
          </div>

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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-[14px] border border-[#EADFD0] bg-white px-4 py-3.5 text-[15px] text-tinta outline-none transition-colors placeholder:text-tinta-mute focus:border-coral"
            />
          </div>

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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-[14px] border border-[#F2A78E] bg-white px-4 py-3.5 text-[15px] text-tinta outline-none transition-colors placeholder:text-tinta-mute focus:border-coral"
            />
          </div>

          <AuthCheckbox checked={photoAuth} onChange={setPhotoAuth} />

          {error && (
            <div className="text-center">
              <p className="text-[14px] font-semibold text-red-500">{error}</p>
              {showLoginLink && (
                <Link
                  href="/login"
                  className="mt-1 inline-block text-[14px] font-extrabold text-acento-oscuro hover:underline"
                >
                  Iniciar sesión
                </Link>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-[15px] py-[15px] text-[16px] font-extrabold text-white shadow-[0_6px_20px_-6px_rgba(238,129,100,.55)] transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{
              background: "linear-gradient(135deg, #F4977E, #EE8164)",
            }}
          >
            {loading ? "Activando…" : "Activar mi cuenta"}
          </button>
        </form>

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

export default function ActivatePage() {
  return (
    <Suspense
      fallback={
        <div
          className="flex min-h-screen items-center justify-center"
          style={{ background: "#FBF4EC" }}
        >
          <p className="text-[15px] text-tinta-suave">Cargando…</p>
        </div>
      }
    >
      <ActivateForm />
    </Suspense>
  );
}
