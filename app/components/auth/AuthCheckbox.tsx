"use client";

import { useState } from "react";

interface AuthCheckboxProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
}

export function AuthCheckbox({ checked = false, onChange }: AuthCheckboxProps) {
  const [isChecked, setIsChecked] = useState(checked);

  const handleChange = () => {
    const next = !isChecked;
    setIsChecked(next);
    onChange?.(next);
  };

  return (
    <label
      className="flex cursor-pointer items-start gap-3 rounded-[14px] bg-[#FBF1D6] px-4 py-3.5"
      htmlFor="auth-checkbox"
    >
      <span
        className={`relative mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-[8px] border-2 border-[#D1C5A0] transition-colors ${
          isChecked ? "border-[#5FB97E] bg-[#5FB97E]" : "bg-white"
        }`}
      >
        {isChecked && (
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M2.5 7.5L5.5 10.5L11.5 3.5"
              stroke="white"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      <span className="text-sm leading-snug text-[#8A7234]">
        Autorizo a la guardería a tomar y compartir fotos de mi hijo dentro de
        la app.
      </span>
      <input
        id="auth-checkbox"
        type="checkbox"
        className="sr-only"
        checked={isChecked}
        onChange={handleChange}
      />
    </label>
  );
}
