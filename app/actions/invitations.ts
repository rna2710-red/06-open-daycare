"use server";

import { adminClient } from "@/utils/supabase/admin";

export type InvitationPreview = {
  childFullName: string;
  roomName: string;
  email: string;
};

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
