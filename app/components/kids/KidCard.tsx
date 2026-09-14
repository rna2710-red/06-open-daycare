import Link from "next/link";
import type { Child } from "@/lib/mock/kids";

interface KidCardProps {
  child: Child;
}

const chevronIcon = (
  <svg
    className="flex-none"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#CBB89F"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m9 18 6-6-6-6" />
  </svg>
);

export function KidCard({ child }: KidCardProps) {
  return (
    <Link
      href={`/kids/${child.id}`}
      className="kid flex min-w-0 items-center gap-3.5 rounded-[18px] border border-borde bg-superficie p-4 shadow-[0_4px_14px_-12px_rgba(120,90,60,.5)]"
    >
      <span
        className="flex h-12 w-12 flex-none items-center justify-center rounded-full font-display text-lg font-semibold"
        style={{ background: child.avatarColor, color: child.avatarTextColor }}
      >
        {child.initial}
      </span>
      <div className="min-w-0 flex-1">
        <div className="font-display text-base font-semibold text-tinta">
          {child.name}
        </div>
        <div className="text-[13px] text-tinta-mute">
          {child.age} ·{" "}
          {child.parents.length === 0
            ? "sin padres vinculados"
            : `${child.parents.length} ${child.parents.length === 1 ? "padre vinculado" : "padres vinculados"}`}
        </div>
      </div>
      {child.allergyBadge ? (
        <span className="flex-none rounded-full bg-[#FBD8CC] px-2.5 py-[5px] text-[11px] font-extrabold text-[#D9684A]">
          {child.allergyBadge}
        </span>
      ) : (
        chevronIcon
      )}
    </Link>
  );
}
