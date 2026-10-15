import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { StaffSidebar } from "@/app/components/shared/StaffSidebar";
import { getPanelProfile } from "@/utils/supabase/profile";

export default async function StaffLayout({
  children,
}: {
  children: ReactNode;
}) {
  const profile = await getPanelProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role === "parent") {
    redirect("/family");
  }

  return (
    <div className="flex h-dvh flex-col bg-fondo md:flex-row">
      <StaffSidebar />
      {children}
    </div>
  );
}
