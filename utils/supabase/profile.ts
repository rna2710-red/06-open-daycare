import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export interface PanelProfile {
  id: string;
  role: "staff" | "parent" | "admin";
  daycare_id: string | null;
  full_name: string;
}

export async function getPanelProfile(): Promise<PanelProfile | null> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("users")
    .select("id, role, daycare_id, full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    return null;
  }

  return {
    id: profile.id,
    role: profile.role as PanelProfile["role"],
    daycare_id: profile.daycare_id,
    full_name: profile.full_name,
  };
}
