"use server";

import { createClient } from "@/lib/supabase/server";
import { ClaimStartSchema } from "@/lib/validators/claim";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export async function startClaimAction(raw: unknown) {
  const input = ClaimStartSchema.parse(raw);
  const supabase = await createClient();

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    const requestHeaders = await headers();
    const referer = requestHeaders.get("referer");
    const redirectTarget = (() => {
      if (!referer) return "/arzt-claim";
      try {
        const url = new URL(referer);
        if (url.pathname.startsWith("/arzt-claim/")) return url.pathname;
      } catch {
        // ignore invalid referrer URL
      }
      return "/arzt-claim";
    })();
    redirect(`/login?redirect=${encodeURIComponent(redirectTarget)}`);
  }

  const { error } = await supabase.from("profile_claims").insert({
    doctor_id: input.doctorId ?? null,
    clinic_id: input.clinicId ?? null,
    claimant_user_id: auth.user.id,
    claimant_email: input.claimantEmail,
    claimant_phone: input.claimantPhone || null,
    requested_role: input.requestedRole,
    status: "initiated",
  });

  if (error) throw error;

  return { ok: true };
}
