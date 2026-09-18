"use client";

import { useState } from "react";
import { children } from "@/lib/mock/kids";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreatePostModal({ isOpen, onClose }: CreatePostModalProps) {
  const [selectedChildren, setSelectedChildren] = useState<string[]>([]);

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
        </div>
      </div>
    </div>
  );
}
