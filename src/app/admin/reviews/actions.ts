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
 * Moderate a review — publish, reject or flag.
 * Reviews are never shown publicly until explicitly published.
 */
export async function moderateReviewAction(
  reviewId: string,
  status: "published" | "rejected" | "flagged",
) {
  const { supabase } = await assertAdminOrEditor();

  const { error } = await supabase
    .from("reviews")
    .update({ moderation_status: status })
    .eq("id", reviewId);

  if (error) throw error;

  revalidatePath("/admin/reviews");
  return { ok: true };
}
