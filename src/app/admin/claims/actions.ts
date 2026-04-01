"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/** Verify the calling user has admin or editor rights */
async function assertAdminOrEditor() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) throw new Error("Unauthorized");

  const { data: me } = await supabase
    .from("app_users")
    .select("role")
    .eq("id", authData.user.id)
    .single();

  if (!me || !["admin", "editor"].includes(me.role)) {
    throw new Error("Kein Zugriff");
  }
  return { supabase, userId: authData.user.id };
}

/**
 * Approve a claim:
 * 1. Link the doctor profile to the claimant user.
 * 2. Mark is_claimed, is_verified, verification_level.
 * 3. Update claim status → approved.
 */
export async function approveDoctorClaimAction(claimId: string) {
  const { supabase, userId } = await assertAdminOrEditor();

  const { data: claim, error } = await supabase
    .from("profile_claims")
    .select("*")
    .eq("id", claimId)
    .single();

  if (error || !claim) throw new Error("Claim nicht gefunden");
  if (!claim.doctor_id || !claim.claimant_user_id) {
    throw new Error("Claim hat keine Arzt-ID oder Claimant-ID");
  }

  const { error: doctorErr } = await supabase
    .from("doctor_profiles")
    .update({
      owner_user_id: claim.claimant_user_id,
      is_claimed: true,
      is_verified: true,
      verification_level: "basic",
      last_verified_at: new Date().toISOString(),
    })
    .eq("id", claim.doctor_id);

  if (doctorErr) throw doctorErr;

  const { error: claimErr } = await supabase
    .from("profile_claims")
    .update({
      status: "approved",
      reviewed_at: new Date().toISOString(),
      approved_user_id: userId,
    })
    .eq("id", claimId);

  if (claimErr) throw claimErr;

  revalidatePath("/admin/claims");
  revalidatePath("/dashboard");
}

/**
 * Reject a claim with optional reason stored in notes.
 */
export async function rejectDoctorClaimAction(claimId: string) {
  const { supabase, userId } = await assertAdminOrEditor();

  const { error } = await supabase
    .from("profile_claims")
    .update({
      status: "rejected",
      reviewed_at: new Date().toISOString(),
      approved_user_id: userId,
    })
    .eq("id", claimId);

  if (error) throw error;

  revalidatePath("/admin/claims");
}

/**
 * Move claim to manual_review for escalation.
 */
export async function requestManualReviewAction(
  claimId: string,
  assignedTo?: string,
) {
  const { supabase } = await assertAdminOrEditor();

  const { error } = await supabase
    .from("profile_claims")
    .update({
      status: "manual_review",
      assigned_to: assignedTo ?? null,
    })
    .eq("id", claimId);

  if (error) throw error;

  revalidatePath("/admin/claims");
}
