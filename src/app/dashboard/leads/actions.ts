"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateLeadStatusAction(leadId: string, status: string) {
  const allowed = ["viewed", "contacted", "won", "lost", "spam"];
  if (!allowed.includes(status)) throw new Error("Ungültiger Status");

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) throw new Error("Unauthorized");

  const { data: lead } = await supabase
    .from("lead_requests")
    .select("id, doctor_id")
    .eq("id", leadId)
    .single();

  if (!lead) throw new Error("Lead nicht gefunden");
  if (!lead.doctor_id) throw new Error("Lead hat keine Arzt-ID");

  const { data: doctor } = await supabase
    .from("doctor_profiles")
    .select("id")
    .eq("id", lead.doctor_id)
    .eq("owner_user_id", authData.user.id)
    .single();

  if (!doctor) throw new Error("Kein Zugriff");

  const { error } = await supabase
    .from("lead_requests")
    .update({ status: status as "viewed" | "contacted" | "won" | "lost" | "spam" })
    .eq("id", leadId);

  if (error) throw error;

  revalidatePath("/dashboard/leads");
  return { ok: true };
}
