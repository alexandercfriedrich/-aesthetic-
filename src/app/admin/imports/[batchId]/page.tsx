import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { BatchDetailClient } from "@/components/admin/imports/BatchDetailClient";

type PageProps = {
  params: Promise<{ batchId: string }>;
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

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <Link href="/admin/imports" className="hover:text-foreground transition-colors">
            Imports
          </Link>
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

      {/* Interactive part: toolbar + candidate table + merge panel */}
      <BatchDetailClient batch={batch} candidates={candidates} />
    </div>
  );
}
