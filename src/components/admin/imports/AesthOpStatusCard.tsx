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
  const [loading, setLoading] = useState<"test" | "full" | null>(null);
  const [result, setResult] = useState<{ workflowUrl: string; mode: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleTrigger(mode: "test" | "full") {
    setLoading(mode);
    setError(null);
    setResult(null);
    try {
      const res = await triggerAesthOpWorkflowAction(
        mode === "test" ? { limit: 10 } : undefined,
      );
      setResult({ ...res, mode });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setLoading(null);
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
        {lastBatch && (
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium shrink-0 ${STATUS_COLORS[lastBatch.status] ?? "bg-slate-100 text-slate-600"}`}
          >
            {STATUS_LABELS[lastBatch.status] ?? lastBatch.status}
          </span>
        )}
      </div>

      <div className="px-5 py-4 space-y-3">
        {/* Last batch stats */}
        {lastBatch ? (
          <p className="text-xs text-muted-foreground">
            Letzter Import:{" "}
            {lastBatch.finished_at
              ? new Date(lastBatch.finished_at).toLocaleString("de-AT", {
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

        {/* Two buttons: Test + Full */}
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            onClick={() => handleTrigger("test")}
            disabled={loading !== null}
            className="flex-1 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-left hover:bg-amber-100 disabled:opacity-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-base">🔬</span>
              <span className="text-sm font-semibold text-amber-900">
                {loading === "test" ? "⏳ Wird gestartet…" : "Test-Import (erste 10 Ärzte)"}
              </span>
            </div>
            <p className="mt-1 text-xs text-amber-700">
              Scraped + importiert nur die ersten 10 Ärzte. Ideal zum Prüfen ob Scraper + DB korrekt arbeiten.
            </p>
          </button>

          <button
            onClick={() => handleTrigger("full")}
            disabled={loading !== null}
            className="flex-1 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-left hover:bg-emerald-100 disabled:opacity-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-base">🚀</span>
              <span className="text-sm font-semibold text-emerald-900">
                {loading === "full" ? "⏳ Wird gestartet…" : "Alle Ärzte importieren"}
              </span>
            </div>
            <p className="mt-1 text-xs text-emerald-700">
              Startet den vollständigen Import aller Ärzte. Kann mehrere Minuten dauern.
            </p>
          </button>
        </div>

        {/* Success feedback */}
        {result && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            ✅ Workflow gestartet
            {result.mode === "test" && (
              <span className="ml-2 rounded-full bg-amber-200 px-2 py-0.5 text-xs font-medium text-amber-800">
                TEST
              </span>
            )}
            {" "}
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
