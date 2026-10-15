import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { FamilySidebar } from "@/app/components/shared/FamilySidebar";
import { getPanelProfile } from "@/utils/supabase/profile";

export default async function FamilyLayout({
  children,
}: {
  children: ReactNode;
}) {
  const profile = await getPanelProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role === "staff" || profile.role === "admin") {
    redirect("/staff");
  }

  return (
    <div className="flex h-dvh flex-col bg-fondo md:flex-row">
      <FamilySidebar />
      {children}
    </div>
  );
}
