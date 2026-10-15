"use client";

import { usePostComposer } from "./PostComposerProvider";
import { useUser } from "@/app/providers";

const cameraIcon = (
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
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

export function ShareMomentButton() {
  const { openComposer } = usePostComposer();
  const { profile } = useUser();
  const initial =
    profile?.full_name?.trim()?.charAt(0).toUpperCase() ?? "?";

  return (
    <button
      type="button"
      onClick={openComposer}
      className="mb-6 flex w-full items-center gap-3.5 rounded-[18px] border border-borde bg-superficie px-[18px] py-3.5 text-left shadow-[0_4px_14px_-10px_rgba(120,90,60,.4)]"
    >
      <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-coral-medio font-display text-base font-semibold text-white">
        {initial}
      </span>
      <span className="flex-1 text-[15px] text-tinta-mute">
        Compartí un momento…
      </span>
      <span className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-[12px] bg-acento-suave text-acento-medio">
        {cameraIcon}
      </span>
    </button>
  );
}
