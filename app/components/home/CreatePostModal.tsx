"use client";

import { useState } from "react";
import { children } from "@/lib/mock/kids";
import { postTypes } from "@/lib/mock/feed";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreatePostModal({ isOpen, onClose }: CreatePostModalProps) {
  const [selectedChildren, setSelectedChildren] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  if (!isOpen) return null;

  const toggleChild = (childId: string) => {
    setSelectedChildren((prev) =>
      prev.includes(childId)
        ? prev.filter((id) => id !== childId)
        : [...prev, childId]
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-10 px-6"
      style={{ backgroundColor: "rgba(0,0,0,.4)" }}
      onClick={onClose}
    >
      <div
        className="w-full overflow-hidden"
        style={{
          maxWidth: 580,
          backgroundColor: "#FBF4EC",
          border: "1px solid #ECE0D0",
          borderRadius: 24,
          boxShadow: "0 20px 50px -24px rgba(63,54,46,.35)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between"
          style={{ padding: "20px 26px", borderBottom: "1px solid #ECE0D0" }}
        >
          <button
            onClick={onClose}
            style={{ color: "#94887B", fontWeight: 700, fontSize: 15 }}
          >
            Cancelar
          </button>
          <span
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
            style={{ color: "#D9583C", fontWeight: 800, fontSize: 15 }}
          >
            Publicar
          </button>
        </div>
        <div style={{ padding: "24px 26px" }}>
          <div
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
          <div className="flex flex-wrap" style={{ gap: 9, marginBottom: 22 }}>
            {children.map((child) => {
              const isSelected = selectedChildren.includes(child.id);
              return (
                <button
                  key={child.id}
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
              style={{
                padding: "6px 16px",
                borderRadius: 999,
                border: "1.5px solid #ECE0D0",
                backgroundColor: "#FFFDF9",
                color: "#6E6359",
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Toda la sala
            </button>
          </div>
          <div
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
          <div className="flex flex-wrap" style={{ gap: 9, marginBottom: 22 }}>
            {postTypes.map((type) => {
              const isSelected = selectedType === type.id;
              return (
                <button
                  key={type.id}
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
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: 0.7,
              color: "#94887B",
              marginBottom: 10,
            }}
          >
            DESCRIPCIÓN
          </div>
          <textarea
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
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-3.6-3.6a2 2 0 0 0-2.8 0L6 21" />
              </svg>
            </div>
            <div
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
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              <span style={{ fontSize: 12 }}>Agregar</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
