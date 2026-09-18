"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { children, generateInvitationCode } from "@/lib/mock/kids";

const closeIcon = (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

const infoIcon = (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#4E72C8"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4M12 8h.01" />
  </svg>
);

const sendIcon = (
  <svg
    width="19"
    height="19"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#fff"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m22 2-7 20-4-9-9-4z" />
    <path d="M22 2 11 13" />
  </svg>
);

const roles = ["Mamá", "Papá", "Tutor/a"] as const;

export default function LinkParentPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const child = children.find((c) => c.id === slug);

  const [parentName, setParentName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("Mamá");
  const [code] = useState(() => generateInvitationCode());

  if (!child) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-fondo">
        <p className="text-tinta-suave">Niño no encontrado</p>
      </div>
    );
  }

  const handleClose = () => {
    router.push(`/kids/${slug}`);
  };

  const handleSend = () => {
    router.push(`/kids/${slug}`);
  };

  return (
    <div className="flex min-h-dvh items-start justify-center bg-fondo px-6 py-10">
      <div className="w-full max-w-[480px] overflow-hidden rounded-[24px] border border-[#ECE0D0] bg-[#FBF4EC] shadow-[0_20px_50px_-24px_rgba(63,54,46,.35)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#ECE0D0] px-[26px] py-5">
          <div>
            <div className="font-display text-[18px] font-semibold text-tinta">
              Vincular padre
            </div>
            <div className="text-[13px] text-[#A89A8B]">
              a {child.name}
            </div>
          </div>
          <button
            onClick={handleClose}
            className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-[#F0E6D8] text-[#94887B]"
          >
            {closeIcon}
          </button>
        </div>

        {/* Body */}
        <div className="px-[26px] pt-[22px] pb-[22px]">
          {/* Info box */}
          <div className="mb-[18px] flex gap-[11px] rounded-[14px] bg-[#E3ECFB] p-[13px_16px]">
            {infoIcon}
            <span className="text-[13.5px] leading-[1.45] text-[#3F5694]">
              Le enviaremos un correo con un código para que active su cuenta.
              Solo verá el feed de {child.name.split(" ")[0]}.
            </span>
          </div>

          {/* Nombre */}
          <div className="mb-2 text-[12px] font-extrabold tracking-[.7px] text-[#94887B]">
            NOMBRE DEL PADRE/MADRE
          </div>
          <input
            type="text"
            placeholder="Ej. Diego Fernández"
            value={parentName}
            onChange={(e) => setParentName(e.target.value)}
            className="mb-[18px] w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-[13px] text-[15px] text-tinta placeholder:text-[#B6A99B]"
          />

          {/* Email */}
          <div className="mb-2 text-[12px] font-extrabold tracking-[.7px] text-[#94887B]">
            EMAIL
          </div>
          <input
            type="email"
            placeholder="correo@ejemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mb-[18px] w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-[13px] text-[15px] text-tinta placeholder:text-[#B6A99B]"
          />

          {/* Parentesco */}
          <div className="mb-2.5 text-[12px] font-extrabold tracking-[.7px] text-[#94887B]">
            PARENTESCO
          </div>
          <div className="mb-5 flex gap-[9px]">
            {roles.map((role) => {
              const isSelected = selectedRole === role;
              return (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className="flex-1 rounded-full border-[1.5px] px-3 py-[11px] text-[14px] font-extrabold"
                  style={{
                    borderColor: isSelected ? "#9FB8EC" : "#ECE0D0",
                    backgroundColor: isSelected ? "#CCD8F4" : "#FFFDF9",
                    color: isSelected ? "#4E72C8" : "#6E6359",
                  }}
                >
                  {role}
                </button>
              );
            })}
          </div>

          {/* Código de invitación */}
          <div className="mb-5 rounded-[16px] border-[1.5px] border-dashed border-[#E6D08A] bg-[#FBF1D6] p-[18px] text-center">
            <div className="mb-2 text-[12px] font-extrabold tracking-[.7px] text-[#A88526]">
              CÓDIGO DE INVITACIÓN
            </div>
            <div className="font-display text-[34px] font-semibold tracking-[7px] text-[#8A7234]">
              {code}
            </div>
            <div className="mt-1.5 text-[13px] text-[#A88526]">
              Vence en 7 días
            </div>
          </div>

          {/* Enviar */}
          <button
            onClick={handleSend}
            className="flex w-full items-center justify-center gap-[9px] rounded-[14px] bg-gradient-to-b from-[#F4977E] to-[#EE8164] px-4 py-[14px] text-[15.5px] font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,.7)]"
          >
            {sendIcon}Enviar invitación
          </button>
        </div>
      </div>
    </div>
  );
}
