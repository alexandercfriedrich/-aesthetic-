"use server";

import { createClient } from "@/lib/supabase/server";
import { LeadSchema } from "@/lib/validators/lead";

export async function submitLeadAction(raw: unknown) {
  const input = LeadSchema.parse(raw);
  const supabase = await createClient();

  const { error } = await supabase.from("lead_requests").insert({
    doctor_id: input.doctorId,
    clinic_id: input.clinicId ?? null,
    procedure_id: input.procedureId ?? null,
    patient_name: input.patientName,
    patient_email: input.patientEmail,
    patient_phone: input.patientPhone || null,
    preferred_contact: input.preferredContact ?? null,
    preferred_time: input.preferredTime ?? null,
    message: input.message,
    consent_privacy: input.consentPrivacy,
    consent_data_forwarding: input.consentDataForwarding,
    source_page_url: input.sourcePageUrl,
    source_page_type: input.sourcePageType,
    status: "new",
  });

  if (error) throw error;

  return { ok: true };
}
