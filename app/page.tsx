import { cookies } from "next/headers";
import { Sidebar } from "@/app/components/shared/Sidebar";
import { PostCard } from "@/app/components/home/PostCard";
import { ShareMomentButton } from "@/app/components/home/ShareMomentButton";
import { getFeedPosts } from "@/app/actions/posts";
import { createClient } from "@/utils/supabase/server";

export default async function HomePage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { count: childrenCount }] = await Promise.all([
    supabase
      .from("users")
      .select("full_name, daycare_id, daycares(name)")
      .eq("id", user?.id ?? "")
      .maybeSingle(),
    supabase
      .from("children")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
  ]);

  const daycare = Array.isArray(profile?.daycares)
    ? profile?.daycares[0]
    : profile?.daycares;

  const fullName = profile?.full_name ?? "";
  const firstName = fullName.split(" ")[0];
  const daycareName = daycare?.name ?? "";
  const today = new Date().toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });

  const feedPosts = await getFeedPosts();

  return (
    <div className="flex h-dvh flex-col bg-fondo md:flex-row">
      <Sidebar itemActivo="feed" />
      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[760px] px-5 pb-20 pt-[34px] md:px-10">
          <section className="mb-6">
            <p className="mb-1 text-[12.5px] font-extrabold tracking-[.8px] text-acento">
              GUARDERÍA · {daycareName.toUpperCase()}
            </p>
            <h1 className="font-display text-[30px] font-semibold text-tinta">
              Buenas, {firstName}
            </h1>
            <p className="mt-[5px] text-[14.5px] text-tinta-suave">
              {childrenCount ?? 0} niños · {today}
            </p>
          </section>

          <ShareMomentButton />

          {feedPosts.length > 0 ? (
            <>
              <div className="mb-3.5 flex items-center gap-3.5">
                <span className="text-[12.5px] font-extrabold tracking-[.8px] text-[#8A7C6D]">
                  PUBLICADO HOY
                </span>
                <span className="h-px flex-1 bg-[#E7DAC8]" />
              </div>

              <div className="flex flex-col gap-4">
                {feedPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            </>
          ) : (
            <p className="rounded-[18px] border border-borde bg-superficie px-[18px] py-10 text-center text-[15px] text-tinta-mute">
              Todavía no hay publicaciones
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
