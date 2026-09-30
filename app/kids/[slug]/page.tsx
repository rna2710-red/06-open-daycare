import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { Sidebar } from "@/app/components/shared/Sidebar";
import { createClient } from "@/utils/supabase/server";

const backIcon = (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m15 18-6-6 6-6" />
  </svg>
);

const warningIcon = (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#fff"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
    <path d="M12 9v4M12 17h.01" />
  </svg>
);

const sunIcon = (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#fff"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);

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

const AVATAR_COLORS = [
  { bg: "#A9D9E8", text: "#1F7A93" },
  { bg: "#F4B8CC", text: "#C44A7A" },
  { bg: "#B9DEC4", text: "#3E8B62" },
  { bg: "#F4DC8E", text: "#9A7B1E" },
  { bg: "#C9B6E8", text: "#7B5FC0" },
];

const RELATIONSHIP_LABELS: Record<string, string> = {
  mother: "Mamá",
  father: "Papá",
  guardian: "Tutor/a",
};

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function computeAge(birthDate: string): string {
  const birth = new Date(birthDate);
  const today = new Date();
  let years = today.getFullYear() - birth.getFullYear();
  const months = today.getMonth() - birth.getMonth();
  if (months < 0 || (months === 0 && today.getDate() < birth.getDate())) {
    years -= 1;
  }
  if (years === 0) {
    const totalMonths =
      (today.getFullYear() - birth.getFullYear()) * 12 +
      (today.getMonth() - birth.getMonth());
    return `${totalMonths} ${totalMonths === 1 ? "mes" : "meses"}`;
  }
  return `${years} ${years === 1 ? "año" : "años"}`;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatMonthYear(value: string): string {
  return new Date(value).toLocaleDateString("es-AR", {
    month: "short",
    year: "numeric",
  });
}

type DbChild = {
  id: string;
  full_name: string;
  birth_date: string;
  enrolled_at: string;
  medical_notes: string | null;
  allergy_tags: string[] | null;
  rooms: { name: string } | null;
};

type DbInvitation = {
  id: string;
  full_name: string;
  relationship: string;
  status: string;
  created_at: string;
};

export default async function ChildProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: child } = await supabase
    .from("children")
    .select(
      "id, full_name, birth_date, enrolled_at, medical_notes, allergy_tags, rooms(name)"
    )
    .eq("id", slug)
    .single<DbChild>();

  if (!child) {
    notFound();
  }

  const { data: invitations } = await supabase
    .from("invitations")
    .select("id, full_name, relationship, status, created_at")
    .eq("child_id", slug)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const pendingInvitations = (invitations ?? []) as DbInvitation[];

  const avatar = getAvatarColor(child.full_name);
  const age = computeAge(child.birth_date);
  const roomName = child.rooms?.name ?? "";
  const allergyNotes = child.medical_notes;
  const allergyBadge =
    child.allergy_tags && child.allergy_tags.length > 0
      ? child.allergy_tags[0].toUpperCase()
      : null;

  return (
    <div className="flex h-dvh flex-col bg-fondo md:flex-row">
      <Sidebar itemActivo="ninos" />
      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[820px] px-5 pb-20 pt-[34px] md:px-10">
          <Link
            href="/kids"
            className="mb-5 flex items-center gap-[7px] text-[14px] font-bold text-tinta-suave"
          >
            {backIcon}Volver a Niños
          </Link>

          <div className="flex flex-wrap items-start gap-[26px]">
            <div className="flex min-w-[300px] flex-1 flex-col gap-[18px]">
              <div className="flex items-center gap-[18px]">
                <span
                  className="flex h-[84px] w-[84px] flex-none items-center justify-center rounded-full font-display text-[34px] font-semibold"
                  style={{
                    background: avatar.bg,
                    color: avatar.text,
                  }}
                >
                  {child.full_name.charAt(0).toUpperCase()}
                </span>
                <div className="flex-1">
                  <h1 className="font-display text-[28px] font-semibold text-tinta">
                    {child.full_name}
                  </h1>
                  <p className="mt-[3px] text-[15px] text-tinta-suave">
                    {age}
                    {roomName ? ` · Sala ${roomName}` : ""}
                  </p>
                </div>
                <span className="rounded-xl border-[1.5px] border-borde bg-superficie px-4 py-[9px] text-[14px] font-bold text-tinta-media">
                  Editar
                </span>
              </div>

              {allergyNotes && (
                <div className="flex gap-3.5 rounded-2xl bg-[#FBDAD6] p-[18px]">
                  <span className="flex h-10 w-10 flex-none items-center justify-center rounded-[11px] bg-[#F4A8A0]">
                    {warningIcon}
                  </span>
                  <div>
                    <div className="mb-0.5 text-[15px] font-extrabold text-[#C5413A]">
                      Alergias y notas
                    </div>
                    <div className="text-[14.5px] leading-[1.5] text-[#B25249]">
                      {allergyNotes}
                    </div>
                  </div>
                </div>
              )}

              {allergyBadge && (
                <div className="flex items-center gap-2 self-start rounded-full bg-[#FBDAD6] px-3 py-1 text-[11px] font-extrabold tracking-[.6px] text-[#C5413A]">
                  {allergyBadge}
                </div>
              )}

              <div className="overflow-hidden rounded-2xl border border-borde bg-superficie">
                <div className="flex justify-between border-b border-borde-suave px-[18px] py-[15px]">
                  <span className="text-[14.5px] text-tinta-suave">
                    Fecha de nacimiento
                  </span>
                  <span className="text-[14.5px] font-extrabold text-tinta">
                    {formatDate(child.birth_date)}
                  </span>
                </div>
                <div className="flex justify-between border-b border-borde-suave px-[18px] py-[15px]">
                  <span className="text-[14.5px] text-tinta-suave">Sala</span>
                  <span className="text-[14.5px] font-extrabold text-tinta">
                    {roomName || "—"}
                  </span>
                </div>
                <div className="flex justify-between px-[18px] py-[15px]">
                  <span className="text-[14.5px] text-tinta-suave">
                    Ingreso
                  </span>
                  <span className="text-[14.5px] font-extrabold text-tinta">
                    {formatMonthYear(child.enrolled_at)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex w-[300px] flex-none flex-col gap-3.5">
              <span className="flex items-center justify-center gap-[9px] rounded-[14px] bg-tinta py-[13px] text-[15px] font-extrabold text-white">
                {sunIcon}Resumen del día
              </span>

              <div className="rounded-2xl border border-borde bg-superficie p-[18px]">
                <div className="mb-[14px] text-[12.5px] font-extrabold tracking-[.8px] text-[#8A7C6D]">
                  PADRES VINCULADOS
                </div>
                <div className="flex flex-col gap-[14px]">
                  {pendingInvitations.length === 0 && (
                    <p className="text-[13.5px] text-tinta-mute">
                      Todavía no hay padres vinculados.
                    </p>
                  )}

                  {pendingInvitations.map((invitation) => {
                    const parentAvatar = getAvatarColor(invitation.full_name);
                    const relationshipLabel =
                      RELATIONSHIP_LABELS[invitation.relationship] ??
                      invitation.relationship;

                    return (
                      <div
                        key={invitation.id}
                        className="flex items-center gap-3"
                      >
                        <span
                          className="flex h-10 w-10 flex-none items-center justify-center rounded-full font-display text-base font-semibold"
                          style={{
                            background: parentAvatar.bg,
                            color: parentAvatar.text,
                          }}
                        >
                          {invitation.full_name.charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="text-[14.5px] font-extrabold text-tinta">
                            {invitation.full_name}
                          </div>
                          <div className="text-[12.5px] text-tinta-mute">
                            {relationshipLabel} · invitación enviada
                          </div>
                        </div>
                        <span className="flex-none rounded-full bg-[#F7E7A6] px-[9px] py-1 text-[10.5px] font-extrabold text-[#9A7B1E]">
                          PENDIENTE
                        </span>
                      </div>
                    );
                  })}

                  <Link
                    href={`/kids/${slug}/vincular-padre`}
                    className="flex items-center gap-3 pt-2"
                  >
                    <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full border-[1.5px] border-dashed border-[#D8CBBA] text-[#B0A290]">
                      {plusIcon}
                    </span>
                    <span className="text-[14.5px] font-extrabold text-acento-oscuro">
                      Vincular otro padre
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
