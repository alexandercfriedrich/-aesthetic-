"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MergeDecisionPanel } from "@/components/admin/imports/MergeDecisionPanel";
import {
  approveAllCandidatesAction,
  publishBatchAction,
} from "@/app/admin/imports/actions";
import type { Database } from "@/types/database";

type ImportBatchRow = Database["public"]["Tables"]["import_batches"]["Row"];
type ImportCandidateRow =
  Database["public"]["Tables"]["import_candidates"]["Row"];

const CANDIDATE_STATUS_COLORS: Record<string, string> = {
  new: "bg-slate-100 text-slate-600",
  matched: "bg-emerald-100 text-emerald-700",
  needs_review: "bg-amber-100 text-amber-700",
  approved: "bg-blue-100 text-blue-700",
  rejected: "bg-rose-100 text-rose-700",
  merged: "bg-purple-100 text-purple-700",
};

const CANDIDATE_STATUS_LABELS: Record<string, string> = {
  new: "Neu",
  matched: "Match",
  needs_review: "Prüfung",
  approved: "Freigegeben",
  rejected: "Abgelehnt",
  merged: "Gemergt",
};

type Props = {
  batch: ImportBatchRow;
  candidates: ImportCandidateRow[];
};

export function BatchDetailClient({ batch, candidates }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    const first =
      candidates.find((c) => c.status === "needs_review") ?? candidates[0];
    return first?.id ?? null;
  });
  const [error, setError] = useState<string | null>(null);

  const selectedCandidate =
    candidates.find((c) => c.id === selectedId) ?? null;

  const pendingCount = candidates.filter((c) =>
    ["new", "needs_review"].includes(c.status),
  ).length;

  const approvedCount = candidates.filter(
    (c) => c.status === "approved",
  ).length;

  function handleApproveAll() {
    setError(null);
    startTransition(async () => {
      try {
        await approveAllCandidatesAction(batch.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Fehler beim Freigeben");
      }
    });
  }

  function handlePublish() {
    setError(null);
    startTransition(async () => {
      try {
        await publishBatchAction(batch.id);
        router.push("/admin/imports?published=1");
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Fehler beim Veröffentlichen",
        );
      }
    });
  }

  return (
    <>
      {/* Batch action toolbar */}
      <div className="mb-6 flex flex-wrap gap-3">
        {pendingCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={handleApproveAll}
          >
            {isPending ? "…" : `✓ Alle freigeben (${pendingCount})`}
          </Button>
        )}
        {approvedCount > 0 && (
          <Button
            variant="default"
            size="sm"
            disabled={isPending}
            onClick={handlePublish}
          >
            {isPending
              ? "Wird veröffentlicht…"
              : `🚀 Freigegebene veröffentlichen (${approvedCount})`}
          </Button>
        )}
        {error && (
          <p className="self-center text-xs text-rose-600">{error}</p>
        )}
      </div>

      {/* Two-pane layout */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        {/* Candidate table */}
        <div className="rounded-2xl border bg-white overflow-hidden">
          <div className="border-b px-5 py-3">
            <h2 className="text-sm font-semibold">Kandidaten</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="border-b bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Name
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">
                  Stadt
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Score
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {candidates.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-10 text-center text-muted-foreground"
                  >
                    Keine Kandidaten in diesem Batch.
                  </td>
                </tr>
              )}
              {candidates.map((c) => {
                const isSelected = c.id === selectedId;
                return (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-blue-50 border-l-2 border-l-blue-500"
                        : "hover:bg-slate-50/50"
                    }`}
                  >
                    <td className="px-4 py-3 font-medium">
                      {c.normalized_name || "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                      {c.city || "—"}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {c.confidence_score != null
                        ? `${Math.round(Number(c.confidence_score) * 100)}%`
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          CANDIDATE_STATUS_COLORS[c.status] ??
                          "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {CANDIDATE_STATUS_LABELS[c.status] ?? c.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Merge decision panel */}
        {selectedCandidate && (
          <div className="space-y-4">
            <MergeDecisionPanel
              candidate={selectedCandidate}
              matchedProfile={null}
            />
            <div className="rounded-2xl border bg-amber-50 border-amber-200 px-5 py-4 text-xs text-amber-700">
              <strong>Merge-Regeln:</strong> Geclaimte Profile niemals
              automatisch überschreiben. Hochwertigere Quellen schlagen schwache.
              Medien nie automatisch auf &bdquo;public&quot; setzen.
            </div>
          </div>
        )}
      </div>
    </>
  );
}
