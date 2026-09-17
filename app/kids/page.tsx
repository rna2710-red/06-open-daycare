"use client";

import { useState } from "react";
import { Sidebar } from "@/app/components/shared/Sidebar";
import { KidCard } from "@/app/components/kids/KidCard";
import AddChildModal from "@/app/components/kids/AddChildModal";
import { children } from "@/lib/mock/kids";

const searchIcon = (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#B0A290"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

const plusIcon = (
  <svg
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#fff"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export default function KidsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="flex h-dvh flex-col bg-fondo md:flex-row">
      <Sidebar itemActivo="ninos" />
      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[880px] px-5 pb-20 pt-[34px] md:px-10">
          <div className="mb-[22px] flex items-end justify-between gap-4">
            <div>
              <p className="mb-1 text-[12.5px] font-extrabold tracking-[.8px] text-acento">
                GESTIÓN
              </p>
              <h1 className="font-display text-[30px] font-semibold text-tinta">
                Niños
              </h1>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex cursor-pointer items-center gap-2 rounded-[14px] bg-linear-to-b from-coral to-coral-fuerte px-[18px] py-[11px] text-[14.5px] font-extrabold text-white shadow-[0_8px_18px_-8px_rgba(238,129,100,.7)]"
            >
              {plusIcon}Agregar niño
            </button>
          </div>

          <div className="mb-[22px] flex items-center gap-[11px] rounded-[14px] border border-borde bg-superficie px-4 py-3">
            {searchIcon}
            <input
              placeholder="Buscar niño…"
              className="flex-1 border-none bg-transparent text-[15px] text-tinta placeholder:text-[#B6A99B] focus:outline-none"
            />
          </div>

          <div className="mb-3.5 flex items-center gap-3">
            <span className="text-[12.5px] font-extrabold tracking-[.8px] text-tinta">
              SALA SOLES
            </span>
            <span className="text-[13px] text-tinta-mute">
              {children.length} niños
            </span>
            <span className="h-px flex-1 bg-[#E7DAC8]" />
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            {children.map((child) => (
              <KidCard key={child.id} child={child} />
            ))}
          </div>
        </div>
      </main>
      <AddChildModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
