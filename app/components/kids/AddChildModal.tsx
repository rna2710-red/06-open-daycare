"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { addChild } from "@/app/actions/children";

interface Room {
  id: string;
  name: string;
}

interface AddChildModalProps {
  isOpen: boolean;
  onClose: () => void;
  rooms: Room[];
  onSave: () => void;
}

const labelClassName =
  "mb-2 block text-xs font-extrabold tracking-[.7px] text-tinta-suave";

const inputClassName =
  "w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-[13px] text-[15px] text-tinta outline-none placeholder:text-tinta-mute focus:border-coral";

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

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

export default function AddChildModal({ isOpen, onClose, rooms, onSave }: AddChildModalProps) {
  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [selectedRoom, setSelectedRoom] = useState(rooms[0]?.id ?? "");
  const [allergies, setAllergies] = useState("");
  const [medicalNotes, setMedicalNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const titleId = useId();
  const fullNameId = useId();
  const birthDateId = useId();
  const birthDateErrorId = useId();
  const roomId = useId();
  const allergiesId = useId();
  const medicalNotesId = useId();

  const panelRef = useRef<HTMLFormElement>(null);
  const fullNameInputRef = useRef<HTMLInputElement>(null);

  const resetForm = useCallback(() => {
    setFullName("");
    setBirthDate("");
    setSelectedRoom(rooms[0]?.id ?? "");
    setAllergies("");
    setMedicalNotes("");
    setSaveError(null);
  }, [rooms]);

  const requestClose = useCallback(() => {
    if (isSaving) return;
    resetForm();
    onClose();
  }, [isSaving, onClose, resetForm]);

  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    fullNameInputRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") requestClose();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousBodyOverflow;
      previouslyFocused?.focus();
    };
  }, [isOpen, requestClose]);

  const effectiveRoomId = rooms.some((room) => room.id === selectedRoom)
    ? selectedRoom
    : (rooms[0]?.id ?? "");

  const { error: dateError } = formatAndValidateDate(birthDate);
  const birthDateDigits = birthDate.replace(/\D/g, "");
  const isBirthDateComplete = birthDateDigits.length === 8;

  const canSave =
    fullName.trim().length > 0 &&
    !!effectiveRoomId &&
    isBirthDateComplete &&
    !dateError &&
    !isSaving;

  const handleDateChange = (value: string) => {
    const { formatted } = formatAndValidateDate(value);
    setBirthDate(formatted);
  };

  const handlePanelKeyDown = (event: ReactKeyboardEvent<HTMLFormElement>) => {
    if (event.key !== "Tab") return;
    const panel = panelRef.current;
    if (!panel) return;

    const focusable = Array.from(
      panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
    );
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSaving) return;

    const trimmedName = fullName.trim();
    if (!trimmedName) {
      setSaveError("Ingresa el nombre completo");
      return;
    }
    if (!effectiveRoomId) {
      setSaveError("Selecciona una sala");
      return;
    }
    if (!isBirthDateComplete || dateError) {
      setSaveError(dateError ?? "Fecha inválida");
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    try {
      const parts = birthDate.split("/");
      const isoDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
      const allergyList = allergies
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean);
      await addChild({
        fullName: trimmedName,
        birthDate: isoDate,
        roomId: effectiveRoomId,
        medicalNotes: medicalNotes.trim() || undefined,
        allergyTags: allergyList.length > 0 ? allergyList : undefined,
      });
      resetForm();
      onSave();
      onClose();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-10"
      onClick={requestClose}
    >
      <form
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onSubmit={handleSubmit}
        onKeyDown={handlePanelKeyDown}
        className="w-full max-w-[520px] overflow-hidden rounded-[24px] border border-borde bg-[#FBF4EC] shadow-[0_20px_50px_-24px_rgba(63,54,46,.35)] outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-borde px-[26px] py-5">
          <button
            type="button"
            onClick={requestClose}
            className="text-[15px] font-bold text-tinta-suave"
          >
            Cancelar
          </button>
          <span
            id={titleId}
            className="font-display text-[18px] font-semibold text-tinta"
          >
            Agregar niño
          </span>
          <button
            type="submit"
            disabled={!canSave}
            className="cursor-pointer text-[15px] font-extrabold text-acento disabled:cursor-not-allowed disabled:text-[#B0A290]"
          >
            {isSaving ? "Guardando…" : "Guardar"}
          </button>
        </div>

        {/* Body */}
        <div className="px-[26px] py-6">
          {saveError && (
            <div
              role="alert"
              className="mb-3.5 rounded-[10px] bg-acento-suave px-3.5 py-2.5 text-[13px] font-semibold text-acento"
            >
              {saveError}
            </div>
          )}
          {/* Nombre Completo */}
          <div className="mb-[18px]">
            <label htmlFor={fullNameId} className={labelClassName}>
              NOMBRE COMPLETO
            </label>
            <input
              id={fullNameId}
              ref={fullNameInputRef}
              type="text"
              placeholder="Ej. Martina López"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={inputClassName}
            />
          </div>

          {/* Fecha de Nacimiento + Sala */}
          <div className="mb-[18px] flex gap-3.5">
            <div className="flex-1">
              <label htmlFor={birthDateId} className={labelClassName}>
                FECHA DE NACIMIENTO
              </label>
              <input
                id={birthDateId}
                type="text"
                inputMode="numeric"
                placeholder="dd/mm/aaaa"
                value={birthDate}
                onChange={(e) => handleDateChange(e.target.value)}
                aria-invalid={!!dateError}
                aria-describedby={dateError ? birthDateErrorId : undefined}
                className={`${inputClassName} ${
                  dateError ? "border-acento" : ""
                }`}
              />
              {dateError && (
                <div
                  id={birthDateErrorId}
                  className="mt-1.5 text-xs font-semibold text-acento"
                >
                  {dateError}
                </div>
              )}
            </div>
            <div className="flex-1">
              <label htmlFor={roomId} className={labelClassName}>
                SALA
              </label>
              <div className="relative">
                <select
                  id={roomId}
                  value={effectiveRoomId}
                  onChange={(e) => setSelectedRoom(e.target.value)}
                  className={`${inputClassName} appearance-none pr-10`}
                >
                  {rooms.length === 0 && (
                    <option value="" disabled>
                      No hay salas disponibles
                    </option>
                  )}
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name}
                    </option>
                  ))}
                </select>
                <svg
                  aria-hidden="true"
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
          <div className="mb-[18px]">
            <label htmlFor={allergiesId} className={labelClassName}>
              ALERGIAS (ETIQUETAS)
            </label>
            <input
              id={allergiesId}
              type="text"
              placeholder="Ej. Maní, Lactosa"
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              className={inputClassName}
            />
          </div>

          {/* Notas Médicas */}
          <div>
            <label htmlFor={medicalNotesId} className={labelClassName}>
              NOTAS MÉDICAS
            </label>
            <textarea
              id={medicalNotesId}
              placeholder="Indicaciones, medicación, contactos…"
              value={medicalNotes}
              onChange={(e) => setMedicalNotes(e.target.value)}
              className={`${inputClassName} min-h-[90px] resize-y leading-normal`}
            />
          </div>
        </div>
      </form>
    </div>
  );
}
