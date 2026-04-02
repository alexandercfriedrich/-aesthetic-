import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Vercel Cron: claim-reminders
 * Schedule: 0 8 * * * (daily at 08:00 UTC)
 *
 * Sends reminder notifications to pending claimants who have not
 * completed their verification within 72 hours.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const ua = req.headers.get("user-agent") ?? "";

  if (
    !ua.includes("vercel-cron") &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const supabase = await createClient();
  const runId = crypto.randomUUID();

  const { error: insertError } = await supabase.from("job_runs").insert({
    id: runId,
    job_name: "claim-reminders",
    trigger_type: "cron",
    status: "running",
    started_at: new Date().toISOString(),
  });

  if (insertError) {
    return NextResponse.json({ ok: false, error: insertError.message }, { status: 500 });
  }

  try {
    // Fetch claims stuck in document_pending or email_sent for > 72 hours
    const cutoff = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
    const { data: staleClaims } = await supabase
      .from("profile_claims")
      .select("id, claimant_email, status")
      .in("status", ["email_sent", "document_pending"])
      .lt("updated_at", cutoff)
      .limit(50);

    // TODO: send reminder emails via Supabase Edge Function or transactional email provider
    const reminderCount = staleClaims?.length ?? 0;

    await supabase
      .from("job_runs")
      .update({
        status: "success",
        finished_at: new Date().toISOString(),
        output_json: { reminder_count: reminderCount },
      })
      .eq("id", runId);

    return NextResponse.json({ ok: true, job: "claim-reminders", reminderCount });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await supabase
      .from("job_runs")
      .update({ status: "failed", finished_at: new Date().toISOString(), error_text: message })
      .eq("id", runId);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
