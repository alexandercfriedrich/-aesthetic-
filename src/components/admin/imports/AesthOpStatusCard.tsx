"use client";

import { useState } from "react";
import { triggerAesthOpWorkflowAction } from "@/app/admin/imports/actions";

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

export type AesthOpLastBatch = {
  processed_rows: number | null;
  finished_at: string | null;
  status: string;
} | null;

export function AesthOpStatusCard({
  lastBatch,
}: {
  lastBatch: AesthOpLastBatch;
}) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ workflowUrl: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleTrigger() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await triggerAesthOpWorkflowAction();
      setResult(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
  }

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
        <div className="flex items-center gap-2 shrink-0">
          {lastBatch && (
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[lastBatch.status] ?? "bg-slate-100 text-slate-600"}`}
            >
              {STATUS_LABELS[lastBatch.status] ?? lastBatch.status}
            </span>
          )}
          <button
            onClick={handleTrigger}
            disabled={loading}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "⏳ Wird gestartet…" : "▶ Scraper starten"}
          </button>
        </div>
      </div>

      <div className="px-5 py-4 space-y-3">
        {/* Last batch stats */}
        {lastBatch ? (
          <p className="text-xs text-muted-foreground">
            Letzter Import:{" "}
            {lastBatch.finished_at
              ? new Date(lastBatch.finished_at).toLocaleDateString("de-AT", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "—"}{" "}
            — {lastBatch.processed_rows ?? 0} Ärzte importiert
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Noch kein ÄsthOp-Import durchgeführt.
          </p>
        )}

        {/* Success feedback */}
        {result && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            ✅ Workflow gestartet!{" "}
            <a
              href={result.workflowUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-medium"
            >
              → Fortschritt in GitHub Actions ansehen
            </a>
          </div>
        )}

        {/* Error feedback */}
        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            ❌ {error}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Startet einen GitHub Actions Workflow (~5–10 min). Scrapet alle
          13 Eingriffsarten × 9 Bundesländer und reichert mit Google Places an.
        </p>
      </div>
    </div>
  );
}

