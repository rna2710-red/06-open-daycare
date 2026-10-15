import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getPanelProfile } from "@/utils/supabase/profile";

export default async function HomePage() {
  const profile = await getPanelProfile();

  if (!profile) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    await supabase.auth.signOut();
    redirect("/login");
  }

  if (profile.role === "staff" || profile.role === "admin") {
    redirect("/staff");
  }

  redirect("/family");
}
