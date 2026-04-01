import { ExternalLink } from "lucide-react";
import type { AdminDoctorDetail } from "@/lib/queries/doctors";

type SourceRecord = {
  id: string;
  source_name?: string;
  external_id?: string | null;
  confidence_score?: number;
  source_url?: string | null;
  created_at: string;
};

export function DoctorSourcesTab({ doctor }: { doctor: AdminDoctorDetail }) {
  const sources = (doctor.source_records ?? []) as SourceRecord[];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-white p-5">
        <h2 className="mb-1 text-sm font-semibold">Datenquellen</h2>
        <p className="text-xs text-muted-foreground">
          Alle importierten Quelleinträge für dieses Profil.
        </p>
      </div>

      {sources.length === 0 && (
        <div className="rounded-2xl border border-dashed bg-white px-5 py-10 text-center text-sm text-muted-foreground">
          Keine Quelldaten vorhanden.
        </div>
      )}

      {sources.map((src) => {
        const score = src.confidence_score ?? 0;
        const scoreColor =
          score >= 0.8 ? "text-emerald-600" : score >= 0.5 ? "text-amber-600" : "text-rose-600";

        return (
          <div key={src.id} className="rounded-2xl border bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">
                    {src.source_name ?? "Unbekannte Quelle"}
                  </span>
                  {src.external_id && (
                    <span className="font-mono text-xs text-muted-foreground">
                      #{src.external_id}
                    </span>
                  )}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Importiert: {new Date(src.created_at).toLocaleDateString("de-AT")}
                </div>
                {src.source_url && (
                  <a
                    href={src.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Quelle ansehen
                  </a>
                )}
              </div>
              <div className="shrink-0 text-right">
                <div className={`text-lg font-bold tabular-nums ${scoreColor}`}>
                  {(score * 100).toFixed(0)}%
                </div>
                <div className="text-xs text-muted-foreground">Confidence</div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Raw source info */}
      <div className="rounded-2xl border bg-white p-5">
        <h3 className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Profil-Quelldaten
        </h3>
        <dl className="grid gap-3 sm:grid-cols-2 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">Typ</dt>
            <dd>{doctor.source_type ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Confidence</dt>
            <dd>{doctor.source_confidence != null ? `${(Number(doctor.source_confidence) * 100).toFixed(0)} %` : "—"}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs text-muted-foreground">URL</dt>
            <dd className="truncate">{doctor.source_url ?? "—"}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
