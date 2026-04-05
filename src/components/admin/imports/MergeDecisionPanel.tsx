"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  approveCandidateAction,
  mergeCandidateAction,
  rejectCandidateAction,
  updateCandidateAction,
} from "@/app/admin/imports/actions";
import type { Database } from "@/types/database";

type ImportCandidateRow =
  Database["public"]["Tables"]["import_candidates"]["Row"];

type MergeDecisionPanelProps = {
  candidate: ImportCandidateRow;
  matchedProfile?: Record<string, unknown> | null;
};

const EDITABLE_FIELDS: {
  key: keyof ImportCandidateRow;
  label: string;
  type?: "text" | "textarea" | "select";
  options?: { value: string; label: string }[];
}[] = [
  { key: "normalized_name", label: "Name" },
  { key: "city", label: "Stadt" },
  { key: "postal_code", label: "PLZ" },
  { key: "normalized_phone", label: "Telefon" },
  { key: "normalized_website_domain", label: "Website" },
  { key: "specialty_text", label: "Fachgebiet" },
  {
    key: "entity_kind",
    label: "Typ",
    type: "select",
    options: [
      { value: "doctor", label: "Arzt" },
      { value: "clinic", label: "Klinik" },
    ],
  },
  { key: "reviewer_notes", label: "Notizen", type: "textarea" },
];

const READONLY_FIELDS: { key: keyof ImportCandidateRow; label: string }[] = [
  { key: "source_url", label: "Quelle" },
  { key: "confidence_score", label: "Confidence" },
  { key: "status", label: "Status" },
];

export function MergeDecisionPanel({
  candidate,
  matchedProfile,
}: MergeDecisionPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Local editable state — initialized from candidate
  const [fields, setFields] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const f of EDITABLE_FIELDS) {
      init[f.key] = String(candidate[f.key] ?? "");
    }
    return init;
  });

  // Operations from raw_json — editable as comma-separated text
  const rawOps = (candidate.raw_json as Record<string, unknown> | null)?.[
    "operations"
  ];
  const [operationsText, setOperationsText] = useState<string>(() =>
    Array.isArray(rawOps) ? (rawOps as string[]).join(", ") : "",
  );

  const confidencePct =
    candidate.confidence_score != null
      ? Math.round(Number(candidate.confidence_score) * 100)
      : null;

  const googleMatchStatus =
    (candidate.raw_json as Record<string, unknown> | null)?.["google_match_status"] as
      | string
      | undefined;

  // ── Save editable fields ──────────────────────────────────────────────────
  async function handleSave() {
    setSaveError(null);
    setSaveSuccess(false);
    setIsSaving(true);
    try {
      const operations = operationsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      await updateCandidateAction(candidate.id, {
        normalized_name: fields.normalized_name || undefined,
        city: fields.city || undefined,
        postal_code: fields.postal_code || undefined,
        normalized_phone: fields.normalized_phone || undefined,
        normalized_website_domain: fields.normalized_website_domain || undefined,
        specialty_text: fields.specialty_text || undefined,
        entity_kind: fields.entity_kind || undefined,
        reviewer_notes: fields.reviewer_notes || undefined,
        operations,
      });
      setSaveSuccess(true);
      router.refresh();
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Fehler beim Speichern");
    } finally {
      setIsSaving(false);
    }
  }

  // ── Approve / Merge / Reject ───────────────────────────────────────────────
  function handleNewProfile() {
    startTransition(async () => {
      await approveCandidateAction(candidate.id);
      router.refresh();
    });
  }

  function handleMerge() {
    const profileId = matchedProfile?.id as string | undefined;
    if (!profileId) return;
    startTransition(async () => {
      await mergeCandidateAction(candidate.id, profileId);
      router.refresh();
    });
  }

  function handleIgnore() {
    startTransition(async () => {
      await rejectCandidateAction(candidate.id);
      router.refresh();
    });
  }

  const isEditable = ["new", "needs_review"].includes(candidate.status);

  return (
    <div className="space-y-5 rounded-2xl border bg-white p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Kandidat bearbeiten</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {isEditable
              ? "Felder prüfen und korrigieren, dann freigeben oder ablehnen."
              : "Kandidat wurde bereits bearbeitet."}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {confidencePct != null && (
            <Badge
              variant={
                confidencePct >= 75
                  ? "success"
                  : confidencePct >= 40
                    ? "warning"
                    : "destructive"
              }
            >
              {confidencePct}% Match
            </Badge>
          )}
          {googleMatchStatus && (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-medium",
                googleMatchStatus === "matched_strict"
                  ? "bg-emerald-100 text-emerald-700"
                  : googleMatchStatus === "ambiguous"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-slate-100 text-slate-600",
              )}
            >
              Google: {googleMatchStatus}
            </span>
          )}
        </div>
      </div>

      <Separator />

      {/* Editable fields */}
      <div className="space-y-3">
        {EDITABLE_FIELDS.map((f) => (
          <div key={f.key} className="grid grid-cols-[120px_1fr] items-start gap-2">
            <label
              htmlFor={`field-${f.key}`}
              className="pt-2 text-xs font-medium text-muted-foreground"
            >
              {f.label}
            </label>
            {f.type === "textarea" ? (
              <textarea
                id={`field-${f.key}`}
                rows={2}
                value={fields[f.key]}
                onChange={(e) =>
                  setFields((prev) => ({ ...prev, [f.key]: e.target.value }))
                }
                disabled={!isEditable || isSaving}
                className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-ring"
              />
            ) : f.type === "select" ? (
              <select
                id={`field-${f.key}`}
                value={fields[f.key]}
                onChange={(e) =>
                  setFields((prev) => ({ ...prev, [f.key]: e.target.value }))
                }
                disabled={!isEditable || isSaving}
                className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {f.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id={`field-${f.key}`}
                type="text"
                value={fields[f.key]}
                onChange={(e) =>
                  setFields((prev) => ({ ...prev, [f.key]: e.target.value }))
                }
                disabled={!isEditable || isSaving}
                className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-ring"
              />
            )}
          </div>
        ))}
      </div>

      {/* Read-only meta fields */}
      <div className="rounded-xl border bg-slate-50 px-4 py-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Metadaten (nur Lesen)
        </p>
        <dl className="space-y-1.5">
          {READONLY_FIELDS.map(({ key, label }) => (
            <div key={key} className="flex gap-2 text-xs">
              <dt className="w-24 shrink-0 font-medium text-muted-foreground">{label}</dt>
              <dd className="truncate text-foreground">{String(candidate[key] ?? "—")}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Operations / Eingriffe — editable when status allows */}
      {(() => {
        const ops = (candidate.raw_json as Record<string, unknown> | null)?.["operations"];
        const hasOps = Array.isArray(ops) && ops.length > 0;
        if (!hasOps && !isEditable) return null;
        return (
          <div className="rounded-xl border bg-slate-50 px-4 py-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Eingriffe / Fachrichtungen
            </p>
            {isEditable ? (
              <textarea
                rows={3}
                value={operationsText}
                onChange={(e) => setOperationsText(e.target.value)}
                disabled={isSaving}
                placeholder="Kommagetrennt, z.B. Facelift, Brustvergrößerung, Nasenkorrektur"
                className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-ring"
              />
            ) : hasOps ? (
              <div className="flex flex-wrap gap-1">
                {(ops as string[]).map((op) => (
                  <span
                    key={op}
                    className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700"
                  >
                    {op}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        );
      })()}

      <Separator />

      {/* Save feedback */}
      {saveError && (
        <p className="text-xs text-rose-600">{saveError}</p>
      )}
      {saveSuccess && (
        <p className="text-xs text-emerald-600">✓ Gespeichert</p>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {isEditable && (
          <Button
            variant="outline"
            size="sm"
            disabled={isSaving || isPending}
            onClick={handleSave}
          >
            {isSaving ? "Speichert…" : "Änderungen speichern"}
          </Button>
        )}
        <Button
          variant="default"
          size="sm"
          disabled={isPending || isSaving}
          onClick={handleNewProfile}
        >
          {isPending ? "…" : "Neues Profil anlegen"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={isPending || isSaving || !matchedProfile}
          onClick={handleMerge}
        >
          In bestehendes Profil mergen
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={isPending || isSaving}
          onClick={handleIgnore}
          className="text-rose-600 hover:text-rose-700"
        >
          Ablehnen
        </Button>
      </div>
    </div>
  );
}
