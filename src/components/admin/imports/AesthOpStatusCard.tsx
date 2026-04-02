import { createClient } from "@/lib/supabase/server";
import { Terminal } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  running: "bg-blue-100 text-blue-700",
  needs_review: "bg-amber-100 text-amber-700",
  completed: "bg-emerald-100 text-emerald-700",
  failed: "bg-rose-100 text-rose-700",
};

const STATUS_LABELS: Record<string, string> = {
  running: "Läuft",
  needs_review: "Prüfung nötig",
  completed: "Abgeschlossen",
  failed: "Fehler",
};

async function getLastAesthOpBatch() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("import_batches")
    .select("id, source_label, status, total_rows, processed_rows, error_count, created_at")
    .eq("source_type", "aesthop_scraper")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
  return data ?? null;
}

export async function AesthOpStatusCard() {
  const batch = await getLastAesthOpBatch().catch(() => null);

  return (
    <div className="rounded-2xl border bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 border-b px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold">
            Ärztekammer ÄsthOp-Import
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Offizielle Datenquelle gemäß ÄsthOpG + ÄsthOp-VO 2013 —
            confidence_score 100, keine False Positives.
          </p>
        </div>
        {batch && (
          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[batch.status] ?? "bg-slate-100 text-slate-600"}`}
          >
            {STATUS_LABELS[batch.status] ?? batch.status}
          </span>
        )}
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* Last batch stats */}
        {batch ? (
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl border px-3 py-2">
              <div className="text-xl font-bold tabular-nums">
                {batch.total_rows ?? "—"}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Roh-Einträge
              </div>
            </div>
            <div className="rounded-xl border px-3 py-2">
              <div className="text-xl font-bold tabular-nums">
                {batch.processed_rows ?? "—"}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Importiert
              </div>
            </div>
            <div className="rounded-xl border px-3 py-2">
              <div
                className={`text-xl font-bold tabular-nums ${(batch.error_count ?? 0) > 0 ? "text-rose-600" : ""}`}
              >
                {batch.error_count ?? 0}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Fehler
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Noch kein ÄsthOp-Import durchgeführt.
          </p>
        )}

        {batch && (
          <p className="text-xs text-muted-foreground">
            Letzter Import:{" "}
            {new Date(batch.created_at).toLocaleDateString("de-AT", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}

        {/* CLI instructions */}
        <div className="rounded-xl border bg-slate-50 p-3 space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
            <Terminal className="h-3.5 w-3.5" />
            CLI-Import starten (lokal oder GitHub Actions)
          </div>
          <pre className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap break-all">
            {`# Vollständiger Import (alle Bundesländer × alle Operationen)
npx tsx scripts/import-aesthop.ts

# Nur ein Bundesland
npx tsx scripts/import-aesthop.ts --bundesland Wien

# Nur bestimmte Operation
npx tsx scripts/import-aesthop.ts --operation "Brustvergrößerung"

# Ohne Google-Places-Anreicherung
npx tsx scripts/import-aesthop.ts --no-enrich

# Testlauf ohne DB-Schreibvorgänge
npx tsx scripts/import-aesthop.ts --dry-run`}
          </pre>
          <p className="text-xs text-muted-foreground">
            Voraussetzungen:{" "}
            <code className="rounded bg-slate-200 px-1">
              npx playwright install chromium
            </code>{" "}
            und{" "}
            <code className="rounded bg-slate-200 px-1">
              SUPABASE_SERVICE_ROLE_KEY
            </code>{" "}
            in{" "}
            <code className="rounded bg-slate-200 px-1">.env.local</code>
          </p>
        </div>
      </div>
    </div>
  );
}
