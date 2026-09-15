"use client";

import { useState, type ReactNode } from "react";
import { classroom, user } from "@/lib/mock/feed";

export type NavItem = "feed" | "ninos" | "avisos" | "cuenta";

interface SidebarProps {
  itemActivo: NavItem;
}

const sunIcon = (
  <svg
    width="21"
    height="21"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#fff"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
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

const feedIcon = (
  <svg
    width="19"
    height="19"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
  </svg>
);

const kidsIcon = (
  <svg
    width="19"
    height="19"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="9" cy="7" r="3" />
    <circle cx="17" cy="9" r="2.4" />
    <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 20a5 5 0 0 1 5.5-4.9" />
  </svg>
);

const bellIcon = (
  <svg
    width="19"
    height="19"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" />
  </svg>
);

const accountIcon = (
  <svg
    width="19"
    height="19"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const logoutIcon = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
  </svg>
);

const menuIcon = (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const closeIcon = (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

const navItems: { id: NavItem; label: string; icon: ReactNode; href: string }[] = [
  { id: "feed", label: "Feed", icon: feedIcon, href: "/" },
  { id: "ninos", label: "Niños", icon: kidsIcon, href: "/kids" },
  { id: "avisos", label: "Avisos", icon: bellIcon, href: "/avisos" },
  { id: "cuenta", label: "Mi cuenta", icon: accountIcon, href: "/cuenta" },
];

export function Sidebar({ itemActivo }: SidebarProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <header className="flex items-center justify-between border-b border-borde bg-superficie px-4 py-3 md:hidden">
        <a href="#" className="flex items-center gap-[11px]">
          <span className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-[12px] bg-[linear-gradient(155deg,var(--color-coral-suave),var(--color-coral-medio))]">
            {sunIcon}
          </span>
          <span className="font-display text-[17px] leading-none font-semibold text-tinta">
            OpenDayCare
          </span>
        </a>
        <button
          type="button"
          aria-label={drawerOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={drawerOpen}
          onClick={() => setDrawerOpen((open) => !open)}
          className="relative z-50 flex h-[38px] w-[38px] items-center justify-center rounded-[12px] bg-acento-suave text-acento"
        >
          {drawerOpen ? closeIcon : menuIcon}
        </button>
      </header>

      {drawerOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-tinta/45"
          />
          <aside className="absolute inset-y-0 left-0 flex w-[248px] flex-col border-r border-borde bg-superficie px-4 py-6">
            <SidebarContent itemActivo={itemActivo} />
          </aside>
        </div>
      )}

      <aside className="sticky top-0 hidden h-dvh w-[248px] flex-none flex-col border-r border-borde bg-superficie px-4 py-6 md:flex">
        <SidebarContent itemActivo={itemActivo} />
      </aside>
    </>
  );
}

function SidebarContent({ itemActivo }: SidebarProps) {
  return (
    <>
      <a href="#" className="flex items-center gap-[11px] px-2 pb-[22px] pt-1">
        <span className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-[12px] bg-[linear-gradient(155deg,var(--color-coral-suave),var(--color-coral-medio))]">
          {sunIcon}
        </span>
        <span>
          <span className="block font-display text-[17px] leading-none font-semibold text-tinta">
            OpenDayCare
          </span>
          <span className="mt-[2px] block text-[11.5px] text-tinta-mute">
            {classroom.name}
          </span>
        </span>
      </a>

      <a
        href="#"
        className="mb-[18px] flex w-full items-center justify-center gap-2 rounded-[14px] bg-linear-to-b from-coral to-coral-fuerte px-3 py-3 text-[14.5px] font-extrabold text-white shadow-[0_8px_18px_-8px_rgba(238,129,100,.75)]"
      >
        {plusIcon}Nueva publicación
      </a>

      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map((item) => (
          <a
            key={item.id}
            href={item.href}
            className={`flex items-center gap-3 rounded-xl px-3 py-[11px] text-[14.5px] ${
              item.id === itemActivo
                ? "bg-acento-suave font-extrabold text-acento"
                : "font-semibold text-tinta-media"
            }`}
          >
            {item.icon}
            {item.label}
          </a>
        ))}
      </nav>

      <div className="mt-[10px] border-t border-borde pt-[14px]">
        <div className="flex items-center gap-[11px] px-2 py-1.5">
          <span className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-full bg-coral-medio font-display text-base font-semibold text-white">
            {user.initial}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-extrabold text-tinta">
              {user.name}
            </span>
            <span className="block text-xs text-tinta-mute">{user.role}</span>
          </span>
          <a
            href="#"
            title="Cerrar sesión"
            className="flex h-8 w-8 flex-none items-center justify-center rounded-[10px] bg-fondo text-tinta-suave"
          >
            {logoutIcon}
          </a>
        </div>
      </div>
    </>
  );
}
