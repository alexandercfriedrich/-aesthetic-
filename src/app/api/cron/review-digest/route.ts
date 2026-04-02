import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Vercel Cron: review-digest
 * Schedule: 0 7 * * * (daily at 07:00 UTC)
 *
 * Sends a daily digest of pending reviews to editors for moderation.
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
    job_name: "review-digest",
    trigger_type: "cron",
    status: "running",
    started_at: new Date().toISOString(),
  });

  if (insertError) {
    return NextResponse.json({ ok: false, error: insertError.message }, { status: 500 });
  }

  try {
    const { count: pendingCount } = await supabase
      .from("reviews")
      .select("id", { count: "exact", head: true })
      .in("moderation_status", ["pending", "flagged"]);

    // TODO: send digest email to editors via transactional email provider
    // if pendingCount > 0

    await supabase
      .from("job_runs")
      .update({
        status: "success",
        finished_at: new Date().toISOString(),
        output_json: { pending_reviews: pendingCount ?? 0 },
      })
      .eq("id", runId);

    return NextResponse.json({
      ok: true,
      job: "review-digest",
      pendingReviews: pendingCount ?? 0,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await supabase
      .from("job_runs")
      .update({ status: "failed", finished_at: new Date().toISOString(), error_text: message })
      .eq("id", runId);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
