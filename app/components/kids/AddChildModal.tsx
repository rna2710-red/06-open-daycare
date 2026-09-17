"use client";

interface AddChildModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddChildModal({ isOpen, onClose }: AddChildModalProps) {
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
            style={{
              color: "#D9583C",
              fontWeight: 800,
              fontSize: "15px",
            }}
          >
            Guardar
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "24px 26px" }}>
          <p>Formulario aquí...</p>
        </div>
      </div>
    </div>
  );
}
