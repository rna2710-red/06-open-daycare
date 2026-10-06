"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import LinkParentModal from "@/app/components/kids/LinkParentModal";

interface LinkParentTriggerProps {
  childId: string;
  childName: string;
}

const plusIcon = (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#B0A290"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export default function LinkParentTrigger({
  childId,
  childName,
}: LinkParentTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-3 pt-2"
      >
        <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full border-[1.5px] border-dashed border-[#D8CBBA] text-[#B0A290]">
          {plusIcon}
        </span>
        <span className="text-[14.5px] font-extrabold text-acento-oscuro">
          Vincular otro padre
        </span>
      </button>

      <LinkParentModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        childId={childId}
        childName={childName}
        onCreated={() => router.refresh()}
      />
    </>
  );
}
