import { createClient } from "@/lib/supabase/server";

export async function getAdminDoctorById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("doctor_profiles")
    .select(
      `
      *,
      specialties:specialty_id (
        id,
        slug,
        name
      ),
      locations (
        *
      ),
      doctor_procedures (
        *,
        procedures (
          id,
          slug,
          name
        )
      ),
      reviews (
        *
      ),
      media_assets (
        *
      ),
      profile_claims (
        id,
        status,
        claimant_email,
        claimant_phone,
        verification_method,
        created_at
      )
    `,
    )
    .eq("id", id)
    .single();

  if (error) return null;

  const { data: sourceRecords } = await supabase
    .from("source_records")
    .select("*")
    .eq("doctor_id", id)
    .order("created_at", { ascending: false });

  const { data: auditLogs } = await supabase
    .from("audit_logs")
    .select("*")
    .eq("entity_type", "doctor_profile")
    .eq("entity_id", id)
    .order("created_at", { ascending: false })
    .limit(50);

  const hasOpenConflicts = false;

  return {
    ...data,
    source_records: sourceRecords ?? [],
    audit_logs: auditLogs ?? [],
    has_open_conflicts: hasOpenConflicts,
  };
}

export type AdminDoctorDetail = NonNullable<Awaited<ReturnType<typeof getAdminDoctorById>>>;
