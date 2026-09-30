"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

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

const MIN_PASSWORD_LENGTH = 8;

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
