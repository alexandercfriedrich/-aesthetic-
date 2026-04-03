"use client";

import { useState } from "react";
import { triggerAesthOpWorkflowAction } from "@/app/admin/imports/actions";
import { Play, FlaskConical, Loader2 } from "lucide-react";

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

type RunState = "idle" | "running-test" | "running-full" | "success" | "error";

export function AesthOpStatusCard({
  lastBatch,
}: {
  lastBatch: AesthOpLastBatch;
}) {
  const [runState, setRunState] = useState<RunState>("idle");
  const [result, setResult] = useState<{ workflowUrl: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isRunning = runState === "running-test" || runState === "running-full";

  async function handleTrigger(limitDoctors: number | null) {
    const newState: RunState =
      limitDoctors !== null ? "running-test" : "running-full";
    setRunState(newState);
    setError(null);
    setResult(null);
    try {
      const res = await triggerAesthOpWorkflowAction(
        limitDoctors !== null && limitDoctors > 0
          ? { limitDoctors }
          : undefined,
      );
      setResult(res);
      setRunState("success");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
      setRunState("error");
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

      <div className="px-5 py-4 space-y-4">
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

        {/* Hint box */}
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
          <strong>Workflow:</strong> Der Scraper läuft als GitHub Action (~5–15
          Min). Der Status ist im{" "}
          <a
            href="https://github.com/alexandercfriedrich/-aesthetic-/actions"
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-medium"
          >
            GitHub Actions Tab
          </a>{" "}
          sichtbar.
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap gap-3">
          {/* Test run (first 10 doctors) */}
          <button
            onClick={() => handleTrigger(10)}
            disabled={isRunning}
            className="flex items-center gap-2 rounded-lg border border-blue-300 bg-blue-50 px-5 py-2.5 text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {runState === "running-test" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FlaskConical className="h-4 w-4" />
            )}
            Testlauf (erste 10 Ärzte)
          </button>

          {/* Full import (all doctors) */}
          <button
            onClick={() => handleTrigger(null)}
            disabled={isRunning}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {runState === "running-full" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            Vollständiger Import (alle Ärzte)
          </button>
        </div>

        {/* Success feedback */}
        {result && runState === "success" && (
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
          Scrapet alle 13 Eingriffsarten × 9 Bundesländer und reichert mit
          Google Places an. Testlauf: nur erste 10 Ärzte.
        </p>
      </div>
    </div>
  );
}

