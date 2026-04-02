import { createClient } from "@/lib/supabase/server";
import type { LeadStatus } from "@/types/database";

export async function getDashboardLeads(doctorId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("lead_requests")
    .select(`*, procedures:procedure_id ( id, slug, name_de )`)
    .eq("doctor_id", doctorId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getAdminLeads(params?: { status?: string; limit?: number; offset?: number }) {
  const supabase = await createClient();

  let query = supabase
    .from("lead_requests")
    .select(
      `
      *,
      doctor_profiles:doctor_id ( id, slug, public_display_name ),
      procedures:procedure_id ( id, slug, name_de )
    `,
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(params?.offset ?? 0, (params?.offset ?? 0) + (params?.limit ?? 50) - 1);

  if (params?.status) {
    query = query.eq("status", params.status as LeadStatus);
  }

  const { data, error, count } = await query;
  if (error) throw error;

  return { data: data ?? [], count: count ?? 0 };
}

export async function updateLeadStatus(id: string, status: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("lead_requests")
    .update({ status: status as LeadStatus })
    .eq("id", id);

  if (error) throw error;
}
