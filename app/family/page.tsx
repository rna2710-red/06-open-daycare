import { getPanelProfile } from "@/utils/supabase/profile";

export default async function FamilyHomePage() {
  const profile = await getPanelProfile();
  const firstName = profile?.full_name.split(" ")[0] ?? "";

  return (
    <main className="min-h-0 min-w-0 flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-[760px] px-5 pb-20 pt-[34px] md:px-10">
        <section className="mb-6">
          <p className="mb-1 text-[12.5px] font-extrabold tracking-[.8px] text-acento">
            FAMILIA
          </p>
          <h1 className="font-display text-[30px] font-semibold text-tinta">
            Buenas, {firstName}
          </h1>
          <p className="mt-[5px] text-[14.5px] text-tinta-suave">
            Acá vas a ver el resumen del día de tu hijo.
          </p>
        </section>

        <p className="rounded-[18px] border border-borde bg-superficie px-[18px] py-10 text-center text-[15px] text-tinta-mute">
          Todavía no hay publicaciones para tu familia.
        </p>
      </div>
    </main>
  );
}
