import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { NewBatchDialog } from "@/components/admin/imports/NewBatchDialog";
import {
  AesthOpStatusCard,
  type AesthOpLastBatch,
} from "@/components/admin/imports/AesthOpStatusCard";

const STATUS_COLORS: Record<string, string> = {
  created: "bg-slate-100 text-slate-600",
  running: "bg-blue-100 text-blue-700",
  needs_review: "bg-amber-100 text-amber-700",
  completed: "bg-emerald-100 text-emerald-700",
  failed: "bg-rose-100 text-rose-700",
};

const STATUS_LABELS: Record<string, string> = {
  created: "Erstellt",
  running: "Läuft",
  needs_review: "Prüfung nötig",
  completed: "Abgeschlossen",
  failed: "Fehler",
};

async function getImportBatches() {
  const supabase = await createClient();
  const { data, count } = await supabase
    .from("import_batches")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(50);
  return { data: data ?? [], count: count ?? 0 };
}

async function getLastAesthOpBatch(): Promise<AesthOpLastBatch> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("import_batches")
    .select("processed_rows, finished_at, status")
    .eq("source_type", "aesthop_scraper")
    .order("finished_at", { ascending: false, nullsFirst: true })
    .limit(1)
    .maybeSingle();
  return data ?? null;
}

export default async function AdminImportsPage() {
  const [{ data: batches, count }, lastAesthOpBatch] = await Promise.all([
    getImportBatches().catch(() => ({ data: [], count: 0 })),
    getLastAesthOpBatch().catch(() => null),
  ]);

  return (
    <div className="p-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Imports</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {count} Batches gesamt
          </p>
        </div>
        <div className="flex gap-2">
          <NewBatchDialog />
        </div>
      </div>

      {/* Stats strip */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(
          [
            ["needs_review", "Prüfung nötig"],
            ["running", "Läuft"],
            ["failed", "Fehler"],
            ["completed", "Abgeschlossen"],
          ] as const
        ).map(([status, label]) => {
          const n = batches.filter((b) => b.status === status).length;
          return (
            <div
              key={status}
              className="rounded-2xl border bg-white px-4 py-3"
            >
              <div className="text-2xl font-bold">{n}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {label}
              </div>
            </div>
          );
        })}
      </div>

      {/* ÄsthOp CLI status card */}
      <div className="mb-6">
        <AesthOpStatusCard lastBatch={lastAesthOpBatch} />
      </div>

      <div className="rounded-2xl border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Quelle
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">
                Typ
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">
                Zeilen
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">
                Fehler
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Status
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden xl:table-cell">
                Erstellt
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {batches.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-12 text-center text-muted-foreground"
                >
                  Noch keine Import-Batches vorhanden.
                </td>
              </tr>
            )}
            {batches.map((batch) => (
              <tr
                key={batch.id}
                className="hover:bg-slate-50/50 transition-colors"
              >
                <td className="px-4 py-3 font-medium">{batch.source_label}</td>
                <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                  {batch.source_type}
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className="tabular-nums">
                    {batch.processed_rows}/{batch.total_rows}
                  </span>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  {batch.error_count > 0 ? (
                    <span className="text-rose-600 font-medium">
                      {batch.error_count}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[batch.status] ?? "bg-slate-100 text-slate-600"}`}
                  >
                    {STATUS_LABELS[batch.status] ?? batch.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground hidden xl:table-cell">
                  {new Date(batch.created_at).toLocaleDateString("de-AT")}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/imports/${batch.id}`}
                    className="rounded-lg border px-2.5 py-1 text-xs font-medium hover:bg-slate-50 transition-colors"
                  >
                    Details
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
