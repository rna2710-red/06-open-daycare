"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Resend } from "resend";
import { adminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import { buildInvitationEmail } from "@/lib/email/invitation-email";

export type InvitationPreview = {
  childFullName: string;
  roomName: string;
  email: string;
};

export type ActivateInvitationInput = {
  code: string;
  email: string;
  password: string;
  photoAuth: boolean;
};

export type ActivateInvitationResult =
  | { success: true }
  | { success: false; error: string; showLoginLink?: boolean };

export type RelationshipType = "father" | "mother" | "guardian";

export type CreateInvitationInput = {
  childId: string;
  fullName: string;
  email: string;
  relationship: RelationshipType;
};

export type CreateInvitationResult =
  | { success: true; code: string; emailSent: boolean; error?: string }
  | { success: false; error: string };

const MIN_PASSWORD_LENGTH = 8;
const INVITATION_TTL_DAYS = 7;
const CODE_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const CODE_LENGTH = 5;
const CODE_MAX_ATTEMPTS = 5;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RELATIONSHIPS: RelationshipType[] = ["father", "mother", "guardian"];
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function generateInvitationCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i += 1) {
    code += CODE_ALPHABET.charAt(
      Math.floor(Math.random() * CODE_ALPHABET.length)
    );
  }
  return code;
}

function isUniqueCodeConflict(error: {
  code?: string;
  message?: string;
} | null): boolean {
  if (!error) return false;
  return (
    error.code === "23505" ||
    (error.message ?? "").toLowerCase().includes("duplicate key")
  );
}

function isDuplicateEmailError(error: {
  code?: string;
  message?: string;
} | null): boolean {
  if (!error) {
    return false;
  }

  const code = error.code ?? "";
  const message = (error.message ?? "").toLowerCase();

  return (
    code === "email_exists" ||
    code === "user_already_exists" ||
    message.includes("already registered") ||
    message.includes("already been registered") ||
    message.includes("already exists")
  );
}

export async function getInvitationPreview(
  code: string
): Promise<InvitationPreview | null> {
  const trimmed = code.trim();

  if (!trimmed) {
    return null;
  }

  const nowIso = new Date().toISOString();

  const { data, error } = await adminClient
    .from("invitations")
    .select("email, children(full_name, rooms(name))")
    .eq("code", trimmed)
    .eq("status", "pending")
    .gt("expires_at", nowIso)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const child = Array.isArray(data.children)
    ? data.children[0]
    : data.children;

  const room = Array.isArray(child?.rooms) ? child.rooms[0] : child?.rooms;

  if (!child?.full_name) {
    return null;
  }

  return {
    childFullName: child.full_name,
    roomName: room?.name ?? "",
    email: data.email,
  };
}

export async function createInvitation(
  input: CreateInvitationInput
): Promise<CreateInvitationResult> {
  const fullName = input.fullName.trim();
  const email = input.email.trim().toLowerCase();
  const relationship = input.relationship;

  if (!fullName) {
    return { success: false, error: "Ingresá el nombre del padre/madre." };
  }

  if (!EMAIL_REGEX.test(email)) {
    return { success: false, error: "Ingresá un email válido." };
  }

  if (!RELATIONSHIPS.includes(relationship)) {
    return { success: false, error: "Seleccioná un parentesco válido." };
  }

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

  const { data: profile } = await supabase
    .from("users")
    .select("role, daycare_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "staff" || !profile.daycare_id) {
    return {
      success: false,
      error: "Solo el staff de la guardería puede crear invitaciones.",
    };
  }

  const { data: child } = await supabase
    .from("children")
    .select("id, full_name, rooms(daycare_id)")
    .eq("id", input.childId)
    .maybeSingle();

  const room = Array.isArray(child?.rooms) ? child.rooms[0] : child?.rooms;

  if (!child?.id || !room?.daycare_id) {
    return { success: false, error: "No se pudo cargar el niño." };
  }

  if (room.daycare_id !== profile.daycare_id) {
    return {
      success: false,
      error: "No tenés permiso para invitar padres de este niño.",
    };
  }

  const expiresAt = new Date(
    Date.now() + INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  let code = generateInvitationCode();
  let invitation: { id: string; code: string } | null = null;

  for (let attempt = 0; attempt < CODE_MAX_ATTEMPTS; attempt += 1) {
    const { data, error } = await supabase
      .from("invitations")
      .insert({
        child_id: child.id,
        invited_by: user.id,
        full_name: fullName,
        email,
        relationship,
        code,
        status: "pending",
        expires_at: expiresAt,
      })
      .select("id, code")
      .single();

    if (!error && data) {
      invitation = data;
      break;
    }

    if (isUniqueCodeConflict(error)) {
      code = generateInvitationCode();
      continue;
    }

    return {
      success: false,
      error: "No se pudo crear la invitación. Probá de nuevo.",
    };
  }

  if (!invitation) {
    return {
      success: false,
      error: "No se pudo crear la invitación. Probá de nuevo.",
    };
  }

  const { subject, html } = buildInvitationEmail({
    parentName: fullName,
    childName: child.full_name,
    code: invitation.code,
  });

  const resendApiKey = process.env.RESEND_API_KEY;
  const resendFrom =
    process.env.RESEND_FROM ?? "OpenDayCare <onboarding@resend.dev>";

  if (!resendApiKey) {
    return {
      success: true,
      code: invitation.code,
      emailSent: false,
      error:
        "La invitación se creó, pero no hay configuración de email. Pasale este código al padre.",
    };
  }

  try {
    const resend = new Resend(resendApiKey);
    const { error: sendError } = await resend.emails.send({
      from: resendFrom,
      to: [email],
      subject,
      html,
    });

    if (sendError) {
      return {
        success: true,
        code: invitation.code,
        emailSent: false,
        error: "El correo no se pudo enviar. Pasale este código al padre.",
      };
    }

    return {
      success: true,
      code: invitation.code,
      emailSent: true,
    };
  } catch {
    return {
      success: true,
      code: invitation.code,
      emailSent: false,
      error: "El correo no se pudo enviar. Pasale este código al padre.",
    };
  }
}

export async function activateInvitation(
  input: ActivateInvitationInput
): Promise<ActivateInvitationResult> {
  const code = input.code.trim();
  const email = input.email.trim().toLowerCase();
  const password = input.password;

  if (!code) {
    return {
      success: false,
      error: "El código de invitación no es válido o expiró.",
    };
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      success: false,
      error: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`,
    };
  }

  const nowIso = new Date().toISOString();

  const { data: invitation, error: invitationError } = await adminClient
    .from("invitations")
    .select(
      "id, child_id, email, full_name, relationship, status, expires_at, children(id, full_name, rooms(daycare_id))"
    )
    .eq("code", code)
    .eq("status", "pending")
    .gt("expires_at", nowIso)
    .maybeSingle();

  if (invitationError || !invitation) {
    return {
      success: false,
      error: "El código de invitación no es válido o expiró.",
    };
  }

  if ((invitation.email ?? "").toLowerCase() !== email) {
    return {
      success: false,
      error: "El email no coincide con la invitación.",
    };
  }

  const child = Array.isArray(invitation.children)
    ? invitation.children[0]
    : invitation.children;

  const room = Array.isArray(child?.rooms) ? child.rooms[0] : child?.rooms;
  const daycareId = room?.daycare_id;

  if (!child?.id || !daycareId) {
    return {
      success: false,
      error: "No se pudo cargar la información del niño.",
    };
  }

  const { data: createdUser, error: createError } =
    await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: invitation.full_name,
        role: "parent",
        daycare_id: daycareId,
      },
    });

  if (createError || !createdUser.user) {
    if (isDuplicateEmailError(createError)) {
      return {
        success: false,
        error: "Ya existe una cuenta con ese email. Iniciá sesión.",
        showLoginLink: true,
      };
    }

    return {
      success: false,
      error: "No se pudo activar la cuenta. Probá de nuevo.",
    };
  }

  const parentId = createdUser.user.id;

  const { error: linkError } = await adminClient.from("parent_children").insert({
    parent_id: parentId,
    child_id: child.id,
    relationship: invitation.relationship,
  });

  if (linkError) {
    return {
      success: false,
      error:
        "No se pudo crear el vínculo con el niño. Iniciá sesión o contactá al staff de la guardería.",
      showLoginLink: true,
    };
  }

  const { error: invitationUpdateError } = await adminClient
    .from("invitations")
    .update({ status: "accepted", accepted_at: nowIso })
    .eq("id", invitation.id);

  if (invitationUpdateError) {
    return {
      success: false,
      error: "No se pudo actualizar la invitación. Probá de nuevo.",
    };
  }

  const { error: photoError } = await adminClient
    .from("children")
    .update({ photo_consent: input.photoAuth })
    .eq("id", child.id);

  if (photoError) {
    return {
      success: false,
      error: "No se pudo guardar el consentimiento de fotos. Probá de nuevo.",
    };
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    return {
      success: false,
      error:
        "La cuenta se creó, pero no se pudo iniciar sesión. Iniciá sesión con tu email y contraseña.",
      showLoginLink: true,
    };
  }

  redirect("/");
}
