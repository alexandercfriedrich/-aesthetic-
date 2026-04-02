"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { DoctorProfileUpdateSchema } from "@/lib/validators/doctor";

export async function updateDoctorProfileAction(raw: unknown) {
  const input = DoctorProfileUpdateSchema.parse(raw);
  const supabase = await createClient();

  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) throw new Error("Unauthorized");

  const { data: doctor, error: doctorError } = await supabase
    .from("doctor_profiles")
    .select("id, slug")
    .eq("owner_user_id", authData.user.id)
    .single();

  if (doctorError || !doctor) throw new Error("Profil nicht gefunden");

  const { error } = await supabase
    .from("doctor_profiles")
    .update({
      slug: input.slug,
      first_name: input.firstName,
      last_name: input.lastName,
      title_prefix: input.titlePrefix || null,
      title_suffix: input.titleSuffix || null,
      public_display_name: input.publicDisplayName,
      short_bio: input.shortBio || null,
      long_bio: input.longBio || null,
      years_experience: input.yearsExperience ?? null,
      languages: input.languages,
      website_url: input.websiteUrl || null,
      email_public: input.emailPublic || null,
      phone_public: input.phonePublic || null,
      primary_specialty_id: input.primarySpecialtyId ?? null,
    })
    .eq("id", doctor.id);

  if (error) throw error;

  revalidatePath(`/arzt/${input.slug}`);
  revalidatePath("/dashboard/profil");

  return { ok: true };
}
