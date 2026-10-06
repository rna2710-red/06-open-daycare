"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { children } from "@/lib/mock/kids";
import { postTypes } from "@/lib/mock/feed";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPublish: () => void;
}

export default function CreatePostModal({ isOpen, onClose, onPublish }: CreatePostModalProps) {
  const [selectedChildren, setSelectedChildren] = useState<string[] | "all">([]);
  const [selectedType, setSelectedType] = useState("");
  const [description, setDescription] = useState("");
  const titleId = useId();
  const audienceLabelId = useId();
  const typeLabelId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  const resetForm = useCallback(() => {
    setSelectedChildren([]);
    setSelectedType("");
    setDescription("");
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  const handlePublish = useCallback(() => {
    onPublish();
    handleClose();
  }, [onPublish, handleClose]);

  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleClose();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus();
    };
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  const isAllSelected = selectedChildren === "all";

  const toggleChild = (childId: string) => {
    setSelectedChildren((prev) =>
      prev === "all"
        ? [childId]
        : prev.includes(childId)
          ? prev.filter((id) => id !== childId)
          : [...prev, childId]
    );
  };

  const toggleAll = () => {
    setSelectedChildren((prev) => (prev === "all" ? [] : "all"));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-10 px-6 overflow-y-auto"
      style={{ backgroundColor: "rgba(0,0,0,.4)" }}
      onClick={handleClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="w-full my-10"
        style={{
          maxWidth: 580,
          backgroundColor: "#FBF4EC",
          border: "1px solid #ECE0D0",
          borderRadius: 24,
          boxShadow: "0 20px 50px -24px rgba(63,54,46,.35)",
          outline: "none",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between"
          style={{ padding: "20px 26px", borderBottom: "1px solid #ECE0D0" }}
        >
          <button
            type="button"
            onClick={handleClose}
            style={{ color: "#94887B", fontWeight: 700, fontSize: 15 }}
          >
            Cancelar
          </button>
          <span
            id={titleId}
            style={{
              fontFamily: "'Fredoka', sans-serif",
              fontWeight: 600,
              fontSize: 18,
              color: "#3F362E",
            }}
          >
            Nueva publicación
          </span>
          <button
            type="button"
            onClick={handlePublish}
            style={{ color: "#D9583C", fontWeight: 800, fontSize: 15 }}
          >
            Publicar
          </button>
        </div>
        <div style={{ padding: "24px 26px" }}>
          <div
            id={audienceLabelId}
            style={{
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: 0.7,
              color: "#94887B",
              marginBottom: 10,
            }}
          >
            PARA
          </div>
          <div
            role="group"
            aria-labelledby={audienceLabelId}
            className="flex flex-wrap"
            style={{ gap: 9, marginBottom: 22 }}
          >
            {children.map((child) => {
              const isSelected = selectedChildren !== "all" && selectedChildren.includes(child.id);
              return (
                <button
                  key={child.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => toggleChild(child.id)}
                  className="flex items-center"
                  style={{
                    gap: 8,
                    padding: "6px 14px 6px 6px",
                    borderRadius: 999,
                    border: `1.5px solid ${isSelected ? "#3F362E" : "#ECE0D0"}`,
                    backgroundColor: isSelected ? "#3F362E" : "#FFFDF9",
                    color: isSelected ? "#fff" : "#6E6359",
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: "pointer",
                  }}
                >
                  <span
                    className="flex items-center justify-center"
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: "50%",
                      backgroundColor: child.avatarColor,
                      color: child.avatarTextColor,
                      fontFamily: "'Fredoka', sans-serif",
                      fontWeight: 600,
                      fontSize: 13,
                    }}
                  >
                    {child.initial}
                  </span>
                  {child.name}
                </button>
              );
            })}
            <button
              type="button"
              aria-pressed={isAllSelected}
              onClick={toggleAll}
              style={{
                padding: "6px 16px",
                borderRadius: 999,
                border: `1.5px solid ${isAllSelected ? "#3F362E" : "#ECE0D0"}`,
                backgroundColor: isAllSelected ? "#3F362E" : "#FFFDF9",
                color: isAllSelected ? "#fff" : "#6E6359",
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Toda la sala
            </button>
          </div>
          <div
            id={typeLabelId}
            style={{
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: 0.7,
              color: "#94887B",
              marginBottom: 10,
            }}
          >
            TIPO
          </div>
          <div
            role="group"
            aria-labelledby={typeLabelId}
            className="flex flex-wrap"
            style={{ gap: 9, marginBottom: 22 }}
          >
            {postTypes.map((type) => {
              const isSelected = selectedType === type.id;
              return (
                <button
                  key={type.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSelectedType(isSelected ? "" : type.id)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 999,
                    border: "none",
                    backgroundColor: isSelected ? type.bgColor : `${type.bgColor}33`,
                    color: type.textColor,
                    fontWeight: 800,
                    fontSize: 13.5,
                    cursor: "pointer",
                  }}
                >
                  {type.label}
                </button>
              );
            })}
          </div>
          <label
            htmlFor={descriptionId}
            className="block"
            style={{
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: 0.7,
              color: "#94887B",
              marginBottom: 10,
            }}
          >
            DESCRIPCIÓN
          </label>
          <textarea
            id={descriptionId}
            placeholder="Contá cómo le fue hoy…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full resize-y"
            style={{
              minHeight: 120,
              padding: "14px 16px",
              borderRadius: 14,
              border: "1.5px solid #EADFD0",
              backgroundColor: "#fff",
              fontSize: 15,
              color: "#3F362E",
              lineHeight: 1.5,
              marginBottom: 22,
            }}
          />
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: 0.7,
              color: "#94887B",
              marginBottom: 10,
            }}
          >
            FOTOS
          </div>
          <div className="flex" style={{ gap: 12 }}>
            <div
              className="flex items-center justify-center"
              style={{
                width: 96,
                height: 96,
                borderRadius: 14,
                backgroundColor: "#F4ECE1",
                border: "1px solid #ECE0D0",
                color: "#CBB89F",
              }}
            >
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-3.6-3.6a2 2 0 0 0-2.8 0L6 21" />
              </svg>
            </div>
            <button
              type="button"
              aria-label="Agregar foto"
              className="flex flex-col items-center justify-center"
              style={{
                width: 96,
                height: 96,
                borderRadius: 14,
                border: "1.5px dashed #DBCDBA",
                backgroundColor: "#F4ECE1",
                color: "#B0A290",
                cursor: "pointer",
                gap: 6,
              }}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#C5503A"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              <span style={{ fontSize: 12 }}>Agregar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
