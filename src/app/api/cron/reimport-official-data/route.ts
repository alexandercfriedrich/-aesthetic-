import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Vercel Cron: reimport-official-data
 * Schedule: 0 2 * * 1 (every Monday at 02:00 UTC)
 *
 * Triggers a re-import of official registry data (e.g. Ärztekammer listings).
 * The actual import work is handled by a Supabase Edge Function to keep
 * sensitive API keys server-side.
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
    job_name: "reimport-official-data",
    trigger_type: "cron",
    status: "running",
    started_at: new Date().toISOString(),
  });

  if (insertError) {
    return NextResponse.json({ ok: false, error: insertError.message }, { status: 500 });
  }

  try {
    // TODO: invoke Supabase Edge Function "import-official-sources" with secret header
    // const res = await fetch(`${process.env.SUPABASE_URL}/functions/v1/import-official-sources`, {
    //   method: "POST",
    //   headers: { Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` },
    // });

    await supabase
      .from("job_runs")
      .update({ status: "success", finished_at: new Date().toISOString() })
      .eq("id", runId);

    return NextResponse.json({ ok: true, job: "reimport-official-data" });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await supabase
      .from("job_runs")
      .update({ status: "failed", finished_at: new Date().toISOString(), error_text: message })
      .eq("id", runId);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
