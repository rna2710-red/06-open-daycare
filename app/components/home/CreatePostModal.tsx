"use client";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreatePostModal({ isOpen, onClose }: CreatePostModalProps) {
  if (!isOpen) return null;

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
          {/* Sections will be added in subsequent steps */}
        </div>
      </div>
    </div>
  );
}
