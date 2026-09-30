"use server";

import { cookies } from "next/headers";
import { Resend } from "resend";
import { buildInvitationEmail } from "@/lib/email/invitation-email";
import { createClient } from "@/utils/supabase/server";

export type RelationshipType = "father" | "mother" | "guardian";

export type CreateInvitationInput = {
  childId: string;
  fullName: string;
  email: string;
  relationship: RelationshipType;
};

export type InvitationRecord = {
  id: string;
  child_id: string;
  invited_by: string;
  full_name: string;
  email: string;
  relationship: RelationshipType;
  code: string;
  status: "pending" | "accepted" | "expired" | "cancelled";
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
};

export type CreateInvitationResult =
  | { success: true; invitation: InvitationRecord }
  | { success: false; code?: string; error: string };

const CODE_CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const CODE_LENGTH = 5;
const CODE_MAX_ATTEMPTS = 5;
const INVITATION_TTL_DAYS = 7;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RELATIONSHIPS: RelationshipType[] = ["father", "mother", "guardian"];

function generateInviteCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i += 1) {
    code += CODE_CHARSET[Math.floor(Math.random() * CODE_CHARSET.length)];
  }
  return code;
}

function isUniqueViolation(error: { code?: string } | null): boolean {
  return error?.code === "23505";
}

export async function createInvitation(
  input: CreateInvitationInput
): Promise<CreateInvitationResult> {
  const fullName = input.fullName.trim();
  const email = input.email.trim().toLowerCase();

  if (!fullName) {
    return { success: false, error: "Ingresá el nombre del padre o tutor." };
  }

  if (!EMAIL_REGEX.test(email)) {
    return { success: false, error: "Ingresá un email válido." };
  }

  if (!RELATIONSHIPS.includes(input.relationship)) {
    return { success: false, error: "Parentesco no válido." };
  }

  const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!UUID_REGEX.test(input.childId)) {
    return { success: false, error: "Niño no válido." };
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Tu sesión expiró. Volvé a iniciar sesión." };
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("id, role, daycare_id")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return { success: false, error: "No se pudo verificar tu perfil." };
  }

  if (profile.role !== "staff" || !profile.daycare_id) {
    return {
      success: false,
      error: "Solo el personal del daycare puede crear invitaciones.",
    };
  }

  const { data: child, error: childError } = await supabase
    .from("children")
    .select("id, full_name, rooms(daycare_id)")
    .eq("id", input.childId)
    .single();

  if (childError || !child) {
    return { success: false, error: "No se pudo cargar el niño." };
  }

  const childDaycareId = Array.isArray(child.rooms)
    ? child.rooms[0]?.daycare_id
    : (child.rooms as { daycare_id: string } | null)?.daycare_id;

  if (!childDaycareId || childDaycareId !== profile.daycare_id) {
    return {
      success: false,
      error: "Ese niño no pertenece a tu daycare.",
    };
  }

  const expiresAt = new Date(
    Date.now() + INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  let invitation: InvitationRecord | null = null;
  let lastInsertError: { code?: string; message?: string } | null = null;

  for (let attempt = 0; attempt < CODE_MAX_ATTEMPTS; attempt += 1) {
    const code = generateInviteCode();

    const { data, error } = await supabase
      .from("invitations")
      .insert({
        child_id: input.childId,
        invited_by: user.id,
        full_name: fullName,
        email,
        relationship: input.relationship,
        code,
        status: "pending",
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (!error && data) {
      invitation = data as InvitationRecord;
      break;
    }

    lastInsertError = error;

    if (!isUniqueViolation(error)) {
      return {
        success: false,
        error: "No se pudo crear la invitación.",
      };
    }
  }

  if (!invitation) {
    if (isUniqueViolation(lastInsertError)) {
      return {
        success: false,
        error: "No se pudo generar un código único. Probá de nuevo.",
      };
    }

    return {
      success: false,
      error: "No se pudo crear la invitación.",
    };
  }

  const { subject, html } = buildInvitationEmail({
    parentName: fullName,
    childName: child.full_name,
    code: invitation.code,
  });

  const resendApiKey = process.env.RESEND_API_KEY;
  const resendFrom = process.env.RESEND_FROM;

  if (!resendApiKey || !resendFrom) {
    return {
      success: false,
      code: invitation.code,
      error:
        "El correo no se pudo enviar. Pasale este código al padre o tutor.",
    };
  }

  const resend = new Resend(resendApiKey);
  const { error: sendError } = await resend.emails.send({
    from: resendFrom,
    to: [email],
    subject,
    html,
  });

  if (sendError) {
    return {
      success: false,
      code: invitation.code,
      error:
        "El correo no se pudo enviar. Pasale este código al padre o tutor.",
    };
  }

  return { success: true, invitation };
}
