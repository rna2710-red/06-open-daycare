"use client";

import { useEffect, useRef, useState } from "react";

interface ToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
}

export default function Toast({ message, isVisible, onClose }: ToastProps) {
  const [opacity, setOpacity] = useState(0);
  const [isDismissed, setIsDismissed] = useState(true);
  const wasVisible = useRef(false);

  useEffect(() => {
    if (isVisible) {
      wasVisible.current = true;
      const showTimer = setTimeout(() => {
        setIsDismissed(false);
        requestAnimationFrame(() => setOpacity(1));
      }, 0);
      const autoCloseTimer = setTimeout(onClose, 3000);
      return () => {
        clearTimeout(showTimer);
        clearTimeout(autoCloseTimer);
      };
    }

    if (wasVisible.current) {
      wasVisible.current = false;
      const fadeTimer = setTimeout(() => setOpacity(0), 0);
      const hideTimer = setTimeout(() => setIsDismissed(true), 300);
      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [isVisible, onClose]);

  if (isDismissed && !isVisible) return null;

  return (
    <div
      role="status"
      onClick={onClose}
      className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 cursor-pointer transition-opacity duration-300"
      style={{
        backgroundColor: "#3F362E",
        color: "#fff",
        borderRadius: 12,
        padding: "12px 20px",
        fontSize: 15,
        fontWeight: 500,
        opacity,
      }}
    >
      {message}
    </div>
  );
}
