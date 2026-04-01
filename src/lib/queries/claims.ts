import { createClient } from "@/lib/supabase/server";

export async function getClaimsQueue(params?: { status?: string; limit?: number }) {
  const supabase = await createClient();

  let query = supabase
    .from("profile_claims")
    .select(
      `
      *,
      doctor_profiles:doctor_id ( id, slug, public_display_name )
    `,
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .limit(params?.limit ?? 50);

  if (params?.status) {
    query = query.eq("status", params.status as never);
  }

  const { data, error, count } = await query;
  if (error) throw error;

  return { data: data ?? [], count: count ?? 0 };
}

export async function getClaimById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profile_claims")
    .select(
      `
      *,
      doctor_profiles:doctor_id ( * ),
      app_users:claimant_user_id ( id, full_name, role )
    `,
    )
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function getOwnClaims() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("profile_claims")
    .select(`*, doctor_profiles:doctor_id ( id, slug, public_display_name )`)
    .eq("claimant_user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}
