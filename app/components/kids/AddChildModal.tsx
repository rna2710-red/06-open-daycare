"use client";

import { useState } from "react";
import { rooms } from "@/lib/mock/kids";

interface AddChildModalProps {
  isOpen: boolean;
  onClose: () => void;
}

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

function formatAndValidateDate(value: string): {
  formatted: string;
  error: string | null;
} {
  const digits = value.replace(/\D/g, "").slice(0, 8);

  const formatted =
    digits.length <= 2
      ? digits
      : digits.length <= 4
        ? `${digits.slice(0, 2)}/${digits.slice(2)}`
        : `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;

  if (digits.length < 8) return { formatted, error: null };

  const day = parseInt(digits.slice(0, 2), 10);
  const month = parseInt(digits.slice(2, 4), 10);
  const year = parseInt(digits.slice(4, 8), 10);

  if (month < 1 || month > 12) return { formatted, error: "Mes inválido" };

  const date = new Date(year, month - 1, day);
  if (date.getDate() !== day || date.getMonth() !== month - 1) {
    return { formatted, error: "Fecha inválida" };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (date > today) return { formatted, error: "Fecha futura" };

  const maxAgeDate = new Date(today);
  maxAgeDate.setFullYear(maxAgeDate.getFullYear() - 4);

  if (date < maxAgeDate) {
    return { formatted, error: "El niño debe tener 4 años o menos" };
  }

  return { formatted, error: null };
}

export default function AddChildModal({ isOpen, onClose }: AddChildModalProps) {
  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [selectedRoom, setSelectedRoom] = useState(rooms[0].id);
  const [allergies, setAllergies] = useState("");
  const [medicalNotes, setMedicalNotes] = useState("");
  const [dateError, setDateError] = useState<string | null>(null);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-10"
      style={{ backgroundColor: "rgba(0,0,0,.4)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[520px] overflow-hidden"
        style={{
          backgroundColor: "#FBF4EC",
          border: "1px solid #ECE0D0",
          borderRadius: "24px",
          boxShadow: "0 20px 50px -24px rgba(63,54,46,.35)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between"
          style={{
            padding: "20px 26px",
            borderBottom: "1px solid #ECE0D0",
          }}
        >
          <button
            onClick={onClose}
            style={{
              color: "#94887B",
              fontWeight: 700,
              fontSize: "15px",
            }}
          >
            Cancelar
          </button>
          <span
            style={{
              fontFamily: "'Fredoka', sans-serif",
              fontWeight: 600,
              fontSize: "18px",
              color: "#3F362E",
            }}
          >
            Agregar niño
          </span>
          <button
            onClick={onClose}
            disabled={!!dateError}
            style={{
              color: dateError ? "#B0A290" : "#D9583C",
              fontWeight: 800,
              fontSize: "15px",
              cursor: dateError ? "not-allowed" : "pointer",
            }}
          >
            Guardar
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "24px 26px" }}>
          {/* Nombre Completo */}
          <div style={{ marginBottom: "18px" }}>
            <div style={labelStyle}>NOMBRE COMPLETO</div>
            <input
              type="text"
              placeholder="Ej. Martina López"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Fecha de Nacimiento + Sala */}
          <div className="flex gap-3.5" style={{ marginBottom: "18px" }}>
            <div className="flex-1">
              <div style={labelStyle}>FECHA DE NACIMIENTO</div>
              <input
                type="text"
                placeholder="dd/mm/aaaa"
                value={birthDate}
                onChange={(e) => {
                  const { formatted, error } = formatAndValidateDate(
                    e.target.value,
                  );
                  setBirthDate(formatted);
                  setDateError(error);
                }}
                style={{
                  ...inputStyle,
                  borderColor: dateError ? "#D9583C" : "#EADFD0",
                }}
              />
              {dateError && (
                <div
                  style={{
                    color: "#D9583C",
                    fontSize: "12px",
                    marginTop: "6px",
                    fontWeight: 600,
                  }}
                >
                  {dateError}
                </div>
              )}
            </div>
            <div className="flex-1">
              <div style={labelStyle}>SALA</div>
              <div className="relative">
                <select
                  value={selectedRoom}
                  onChange={(e) => setSelectedRoom(e.target.value)}
                  style={{
                    ...inputStyle,
                    appearance: "none",
                    paddingRight: "40px",
                  }}
                >
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name}
                    </option>
                  ))}
                </select>
                <svg
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#B0A290"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
            </div>
          </div>

          {/* Alergias */}
          <div style={{ marginBottom: "18px" }}>
            <div style={labelStyle}>ALERGIAS (ETIQUETAS)</div>
            <input
              type="text"
              placeholder="Ej. Maní, Lactosa"
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Notas Médicas */}
          <div>
            <div style={labelStyle}>NOTAS MÉDICAS</div>
            <textarea
              placeholder="Indicaciones, medicación, contactos…"
              value={medicalNotes}
              onChange={(e) => setMedicalNotes(e.target.value)}
              style={{
                ...inputStyle,
                minHeight: "90px",
                resize: "vertical",
                lineHeight: 1.5,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
