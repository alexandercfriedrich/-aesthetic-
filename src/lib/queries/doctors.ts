import { createClient } from "@/lib/supabase/server";
import type { ProfileStatus } from "@/types/database";

export async function searchDoctors(params: {
  query?: string;
  city?: string;
  procedureSlug?: string;
  limit?: number;
  offset?: number;
}) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("search_doctors", {
    p_query: params.query ?? null,
    p_city: params.city ?? null,
    p_procedure_slug: params.procedureSlug ?? null,
    p_limit: params.limit ?? 20,
    p_offset: params.offset ?? 0,
  });

  if (error) throw error;
  return data ?? [];
}

export async function getDoctorBySlug(slug: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("doctor_profiles")
    .select(
      `
      *,
      specialties:primary_specialty_id ( id, slug, name_de ),
      doctor_procedures (
        *,
        procedures ( id, slug, name_de )
      ),
      locations ( * ),
      reviews ( * ),
      media_assets ( * )
    `,
    )
    .eq("slug", slug)
    .eq("profile_status", "published")
    .single();

  if (error) throw error;
  return data;
}

export async function getAdminDoctorById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("doctor_profiles")
    .select(
      `
      *,
      specialties:primary_specialty_id ( id, slug, name_de ),
      doctor_procedures (
        *,
        procedures ( id, slug, name_de )
      ),
      locations ( * ),
      reviews ( * ),
      media_assets ( * ),
      profile_claims (
        id, status, claimant_email, claimant_phone, requested_role, created_at
      )
    `,
    )
    .eq("id", id)
    .single();

  if (error) return null;

  const { data: sourceRecords } = await supabase
    .from("source_records" as never)
    .select("*")
    .eq("doctor_id", id)
    .order("created_at", { ascending: false });

  const { data: auditLogs } = await supabase
    .from("audit_logs" as never)
    .select("*")
    .eq("entity_type", "doctor_profile")
    .eq("entity_id", id)
    .order("created_at", { ascending: false })
    .limit(50);

  return {
    ...data,
    source_records: (sourceRecords as unknown[]) ?? [],
    audit_logs: (auditLogs as unknown[]) ?? [],
    has_open_conflicts: false,
  };
}

export type AdminDoctorDetail = NonNullable<Awaited<ReturnType<typeof getAdminDoctorById>>>;

export async function listAdminDoctors(params: {
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const supabase = await createClient();

  let query = supabase
    .from("doctor_profiles")
    .select(
      `
      id, slug, public_display_name, profile_status, is_verified, is_premium,
      is_claimed, verification_level, source_confidence, created_at,
      specialties:primary_specialty_id ( name_de ),
      locations ( city, is_primary )
    `,
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(params.offset ?? 0, (params.offset ?? 0) + (params.limit ?? 50) - 1);

  if (params.status) {
    query = query.eq("profile_status", params.status as ProfileStatus);
  }

  const { data, error, count } = await query;
  if (error) throw error;

  return { data: data ?? [], count: count ?? 0 };
}
