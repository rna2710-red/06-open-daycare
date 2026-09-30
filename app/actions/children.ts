"use server";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

interface AddChildInput {
  fullName: string;
  birthDate: string;
  roomId: string;
  medicalNotes?: string;
  allergyTags?: string[];
  photoConsent?: boolean;
}

export async function addChild(input: AddChildInput) {
  const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!UUID_REGEX.test(input.roomId)) {
    throw new Error("Sala no válida");
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from("children")
    .insert({
      full_name: input.fullName,
      birth_date: input.birthDate,
      room_id: input.roomId,
      medical_notes: input.medicalNotes || null,
      allergy_tags: input.allergyTags || [],
      photo_consent: input.photoConsent ?? true,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
