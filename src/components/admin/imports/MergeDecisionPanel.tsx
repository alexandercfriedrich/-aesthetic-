"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  approveCandidateAction,
  mergeCandidateAction,
  rejectCandidateAction,
} from "@/app/admin/imports/actions";
import type { Database } from "@/types/database";

type ImportCandidateRow =
  Database["public"]["Tables"]["import_candidates"]["Row"];

type MergeDecisionPanelProps = {
  candidate: ImportCandidateRow;
  matchedProfile?: Record<string, unknown> | null;
};

export function MergeDecisionPanel({
  candidate,
  matchedProfile,
}: MergeDecisionPanelProps) {
  const [isPending, startTransition] = useTransition();

  const confidencePct =
    candidate.confidence_score != null
      ? Math.round(candidate.confidence_score * 100)
      : null;

  function handleNewProfile() {
    startTransition(async () => {
      await approveCandidateAction(candidate.id);
    });
  }

  function handleMerge() {
    const profileId = matchedProfile?.id as string | undefined;
    if (!profileId) return;
    startTransition(async () => {
      await mergeCandidateAction(candidate.id, profileId);
    });
  }

  function handleIgnore() {
    startTransition(async () => {
      await rejectCandidateAction(candidate.id);
    });
  }

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
            {(
              Object.entries(candidate) as [
                keyof ImportCandidateRow,
                unknown,
              ][]
            )
              .filter(
                ([k]) =>
                  !["id", "batch_id", "raw_json", "confidence_score"].includes(
                    k as string,
                  ),
              )
              .slice(0, 10)
              .map(([key, val]) => (
                <div key={key as string} className="flex gap-2 text-xs">
                  <dt className="w-28 shrink-0 font-medium text-muted-foreground truncate">
                    {key as string}
                  </dt>
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
        <Button variant="default" size="sm" disabled={isPending} onClick={handleNewProfile}>
          {isPending ? "…" : "Neues Profil anlegen"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={isPending || !matchedProfile}
          onClick={handleMerge}
        >
          In bestehendes Profil mergen
        </Button>
        <Button variant="ghost" size="sm" disabled={isPending} onClick={handleIgnore}>
          Ignorieren
        </Button>
      </div>
    </div>
  );
}
