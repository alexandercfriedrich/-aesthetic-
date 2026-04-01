"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { DoctorProcedureSchema } from "@/lib/validators/doctor-procedure";

export async function upsertDoctorProcedureAction(raw: unknown) {
  const input = DoctorProcedureSchema.parse(raw);
  const supabase = await createClient();

  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) throw new Error("Unauthorized");

  const { data: ownedDoctor } = await supabase
    .from("doctor_profiles")
    .select("id, slug")
    .eq("id", input.doctorId)
    .eq("owner_user_id", authData.user.id)
    .single();

  if (!ownedDoctor) throw new Error("Kein Zugriff");

  const payload = {
    doctor_id: input.doctorId,
    procedure_id: input.procedureId,
    clinic_id: input.clinicId ?? null,
    years_offered: input.yearsOffered ?? null,
    description_short: input.descriptionShort || null,
    is_primary_focus: input.isPrimaryFocus,
    price_from: input.priceFrom ?? null,
    price_to: input.priceTo ?? null,
    currency: input.currency,
    price_note: input.priceNote || null,
    consultation_fee: input.consultationFee ?? null,
    is_active: true,
  };

  const { error } = await supabase
    .from("doctor_procedures")
    .upsert(payload, { onConflict: "doctor_id,procedure_id,clinic_id" });

  if (error) throw error;

  revalidatePath(`/arzt/${ownedDoctor.slug}`);
  revalidatePath("/dashboard/profil");

  return { ok: true };
}
