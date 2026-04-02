import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type MergeDecisionPanelProps = {
  candidate: Record<string, unknown>;
  matchedProfile?: Record<string, unknown> | null;
  onNewProfile?: () => void;
  onMerge?: () => void;
  onIgnore?: () => void;
};

export function MergeDecisionPanel({
  candidate,
  matchedProfile,
  onNewProfile,
  onMerge,
  onIgnore,
}: MergeDecisionPanelProps) {
  if (!candidate) return null;

  const confidence = typeof candidate.confidence_score === "number" ? candidate.confidence_score : null;
  const confidencePct = confidence != null ? Math.round(confidence * 100) : null;

  return (
    <div className="space-y-5 rounded-2xl border bg-white p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Merge-Entscheidung</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Vergleiche Kandidat und bestehendes Profil feldweise.
          </p>
        </div>
        {confidencePct != null && (
          <Badge
            variant={confidencePct >= 75 ? "success" : confidencePct >= 40 ? "warning" : "destructive"}
          >
            {confidencePct}% Match
          </Badge>
        )}
      </div>

      <Separator />

      {/* Side-by-side comparison */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-slate-50 p-4">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Kandidat (Import)
          </div>
          <dl className="space-y-2">
            {Object.entries(candidate)
              .filter(([k]) => !["id", "batch_id", "raw_data", "normalized_data", "confidence_score"].includes(k))
              .slice(0, 10)
              .map(([key, val]) => (
                <div key={key} className="flex gap-2 text-xs">
                  <dt className="w-28 shrink-0 font-medium text-muted-foreground truncate">{key}</dt>
                  <dd className="truncate">{String(val ?? "—")}</dd>
                </div>
              ))}
          </dl>
        </div>

        <div className={cn("rounded-xl border p-4", matchedProfile ? "bg-slate-50" : "bg-slate-50/50")}>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Bestehendes Profil
          </div>
          {matchedProfile ? (
            <dl className="space-y-2">
              {Object.entries(matchedProfile)
                .filter(([k]) => !["fts", "search_text", "id"].includes(k))
                .slice(0, 10)
                .map(([key, val]) => (
                  <div key={key} className="flex gap-2 text-xs">
                    <dt className="w-28 shrink-0 font-medium text-muted-foreground truncate">{key}</dt>
                    <dd className="truncate">{String(val ?? "—")}</dd>
                  </div>
                ))}
            </dl>
          ) : (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              Kein passendes Profil gefunden
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Button variant="default" size="sm" onClick={onNewProfile}>
          Neues Profil anlegen
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!matchedProfile}
          onClick={onMerge}
        >
          In bestehendes Profil mergen
        </Button>
        <Button variant="ghost" size="sm" onClick={onIgnore}>
          Ignorieren
        </Button>
      </div>
    </div>
  );
}
