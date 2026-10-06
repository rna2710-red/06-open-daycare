"use client";

import { useState } from "react";
import { createInvitation } from "@/app/actions/invitations";

interface LinkParentModalProps {
  isOpen: boolean;
  onClose: () => void;
  childId: string;
  childName: string;
  onCreated: () => void;
}

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
    style={{ flex: "none", marginTop: 1 }}
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

const roles = [
  { id: "mother", label: "Mamá" },
  { id: "father", label: "Papá" },
  { id: "guardian", label: "Tutor/a" },
] as const;

const labelStyle = {
  fontSize: "12px",
  fontWeight: 800,
  letterSpacing: ".7px",
  color: "#94887B",
  marginBottom: "8px",
};

const inputStyle = {
  width: "100%",
  padding: "13px 16px",
  borderRadius: "14px",
  border: "1.5px solid #EADFD0",
  backgroundColor: "#fff",
  fontSize: "15px",
  color: "#3F362E",
};

export default function LinkParentModal({
  isOpen,
  onClose,
  childId,
  childName,
  onCreated,
}: LinkParentModalProps) {
  const [parentName, setParentName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("mother");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [created, setCreated] = useState(false);

  const resetForm = () => {
    setParentName("");
    setEmail("");
    setSelectedRole("mother");
    setIsSubmitting(false);
    setSubmitError(null);
    setCreatedCode(null);
    setEmailSent(false);
    setCreated(false);
  };

  if (!isOpen) return null;

  const childFirstName = childName.trim().split(/\s+/)[0] || childName;

  const handleClose = () => {
    if (created) {
      onCreated();
    }
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const result = await createInvitation({
        childId,
        fullName: parentName,
        email,
        relationship: selectedRole as "mother" | "father" | "guardian",
      });

      if (!result.success) {
        setSubmitError(result.error);
        return;
      }

      setCreated(true);
      setCreatedCode(result.code);
      setEmailSent(result.emailSent);
      onCreated();

      if (result.emailSent || !result.error) {
        onClose();
        return;
      }

      setSubmitError(result.error);
    } catch {
      setSubmitError("Ocurrió un error inesperado. Probá de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-6 pt-10"
      style={{ backgroundColor: "rgba(0,0,0,.4)" }}
      onClick={handleClose}
    >
      <div
        className="w-full max-w-[480px] overflow-hidden"
        style={{
          backgroundColor: "#FBF4EC",
          border: "1px solid #ECE0D0",
          borderRadius: "24px",
          boxShadow: "0 20px 50px -24px rgba(63,54,46,.35)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between"
          style={{
            padding: "20px 26px",
            borderBottom: "1px solid #ECE0D0",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "'Fredoka', sans-serif",
                fontWeight: 600,
                fontSize: 18,
                color: "#3F362E",
              }}
            >
              Vincular padre
            </div>
            <div style={{ fontSize: 13, color: "#A89A8B" }}>a {childName}</div>
          </div>
          <button
            onClick={handleClose}
            aria-label="Cerrar"
            className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-[#F0E6D8] text-[#94887B]"
          >
            {closeIcon}
          </button>
        </div>

        <div style={{ padding: "22px 26px" }}>
          {submitError && (
            <div
              style={{
                color: "#D9583C",
                fontSize: "13px",
                fontWeight: 600,
                marginBottom: "14px",
                padding: "10px 14px",
                borderRadius: "10px",
                backgroundColor: "#FBE3D8",
              }}
            >
              {submitError}
            </div>
          )}

          <div
            className="mb-[18px] flex gap-[11px] rounded-[14px] bg-[#E3ECFB] p-[13px_16px]"
          >
            {infoIcon}
            <span className="text-[13.5px] leading-[1.45] text-[#3F5694]">
              Le enviaremos un correo con un código para que active su cuenta.
              Solo verá el feed de {childFirstName}.
            </span>
          </div>

          <div style={labelStyle}>NOMBRE DEL PADRE/MADRE</div>
          <input
            type="text"
            placeholder="Ej. Diego Fernández"
            value={parentName}
            onChange={(e) => setParentName(e.target.value)}
            style={{ ...inputStyle, marginBottom: 18 }}
          />

          <div style={labelStyle}>EMAIL</div>
          <input
            type="email"
            placeholder="correo@ejemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ ...inputStyle, marginBottom: 18 }}
          />

          <div style={{ ...labelStyle, marginBottom: 10 }}>PARENTESCO</div>
          <div className="mb-5 flex gap-[9px]">
            {roles.map((role) => {
              const isSelected = selectedRole === role.id;
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setSelectedRole(role.id)}
                  className="flex-1 rounded-full border-[1.5px] px-3 py-[11px] text-[14px] font-extrabold"
                  style={{
                    borderColor: isSelected ? "#9FB8EC" : "#ECE0D0",
                    backgroundColor: isSelected ? "#CCD8F4" : "#FFFDF9",
                    color: isSelected ? "#4E72C8" : "#6E6359",
                  }}
                >
                  {role.label}
                </button>
              );
            })}
          </div>

          {createdCode && (
            <div className="mb-5 rounded-[16px] border-[1.5px] border-dashed border-[#E6D08A] bg-[#FBF1D6] p-[18px] text-center">
              <div className="mb-2 text-[12px] font-extrabold tracking-[.7px] text-[#A88526]">
                CÓDIGO DE INVITACIÓN
              </div>
              <div
                suppressHydrationWarning
                className="font-display text-[34px] font-semibold tracking-[7px] text-[#8A7234]"
              >
                {createdCode}
              </div>
              <div className="mt-1.5 text-[13px] text-[#A88526]">
                {emailSent
                  ? "También se envió por correo · Vence en 7 días"
                  : "Vence en 7 días"}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || created}
            className="flex w-full items-center justify-center gap-[9px] rounded-[14px] bg-gradient-to-b from-[#F4977E] to-[#EE8164] px-4 py-[14px] text-[15.5px] font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,.7)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {sendIcon}
            {isSubmitting
              ? "Enviando…"
              : created
                ? "Invitación creada"
                : "Enviar invitación"}
          </button>
        </div>
      </div>
    </div>
  );
}
