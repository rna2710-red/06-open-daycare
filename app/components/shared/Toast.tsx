"use client";

import { useEffect } from "react";

interface ToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
}

export default function Toast({ message, isVisible, onClose }: ToastProps) {
  useEffect(() => {
    if (!isVisible) return;
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-opacity duration-300"
      style={{
        backgroundColor: "#3F362E",
        color: "#fff",
        borderRadius: 12,
        padding: "12px 20px",
        fontSize: 15,
        fontWeight: 500,
        opacity: isVisible ? 1 : 0,
      }}
    >
      {message}
    </div>
  );
}
