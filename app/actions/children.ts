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
