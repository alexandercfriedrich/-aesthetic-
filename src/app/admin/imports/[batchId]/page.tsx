import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MergeDecisionPanel } from "@/components/admin/imports/MergeDecisionPanel";

type PageProps = {
  params: Promise<{ batchId: string }>;
};

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

async function getImportBatch(batchId: string) {
  const supabase = await createClient();

  const { data: batch, error } = await supabase
    .from("import_batches")
    .select("*")
    .eq("id", batchId)
    .single();

  if (error || !batch) return null;

  const { data: candidates } = await supabase
    .from("import_candidates")
    .select("*")
    .eq("batch_id", batchId)
    .order("confidence_score", { ascending: false })
    .limit(100);

  return { batch, candidates: candidates ?? [] };
}

export default async function ImportBatchDetailPage({ params }: PageProps) {
  const { batchId } = await params;
  const result = await getImportBatch(batchId);

  if (!result) notFound();

  const { batch, candidates } = result;

  const needsReview = candidates.filter((c) => c.status === "needs_review");
  const firstCandidate = needsReview[0] ?? candidates[0];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <a href="/admin/imports" className="hover:text-foreground transition-colors">
            Imports
          </a>
          <span>/</span>
          <span>{batch.source_label}</span>
        </div>
        <h1 className="text-2xl font-bold">{batch.source_label}</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Quelle: {batch.source_type} ·{" "}
          {new Date(batch.created_at).toLocaleDateString("de-AT")}
        </p>
      </div>

      {/* Batch stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-6">
        {[
          ["Gesamt", batch.total_rows],
          ["Verarbeitet", batch.processed_rows],
          ["Freigegeben", batch.approved_rows],
          ["Abgelehnt", batch.rejected_rows],
          ["Fehler", batch.error_count],
          ["Kandidaten", candidates.length],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-2xl border bg-white px-4 py-3">
            <div className="text-2xl font-bold tabular-nums">{value}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>

      {/* Two-pane layout: candidate list + merge decision panel */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        {/* Candidate list */}
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
              {candidates.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
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
              ))}
            </tbody>
          </table>
        </div>

        {/* Merge decision panel — shows first needs_review or first candidate */}
        {firstCandidate && (
          <div className="space-y-4">
            <MergeDecisionPanel
              candidate={firstCandidate}
              matchedProfile={null}
            />
            <div className="rounded-2xl border bg-amber-50 border-amber-200 px-5 py-4 text-xs text-amber-700">
              <strong>Merge-Regeln:</strong> Geclaimte Profile niemals
              automatisch überschreiben. Hochwertigere Quellen schlagen schwache.
              Medien nie automatisch auf „public" setzen.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
