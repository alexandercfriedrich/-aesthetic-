import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  hasSlug: boolean;
  hasName: boolean;
  hasSpecialty: boolean;
  hasLocation: boolean;
  hasProcedure: boolean;
  hasNoConflicts: boolean;
};

export function DoctorPublishChecklist(props: Props) {
  const items: [string, boolean][] = [
    ["Slug vorhanden", props.hasSlug],
    ["Name vorhanden", props.hasName],
    ["Fachrichtung gesetzt", props.hasSpecialty],
    ["Mindestens ein Standort", props.hasLocation],
    ["Mindestens eine Behandlung", props.hasProcedure],
    ["Keine offenen Konflikte", props.hasNoConflicts],
  ];

  const doneCount = items.filter(([, ok]) => ok).length;
  const ready = doneCount === items.length;

  return (
    <div className="rounded-2xl border bg-white p-5">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Publish-Check</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Vor Veröffentlichung prüfen.</p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold",
            ready
              ? "bg-emerald-100 text-emerald-700"
              : "bg-amber-100 text-amber-700",
          )}
        >
          {doneCount}/{items.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            ready ? "bg-emerald-500" : "bg-amber-400",
          )}
          style={{ width: `${(doneCount / items.length) * 100}%` }}
        />
      </div>

      {/* Checklist */}
      <ul className="space-y-2">
        {items.map(([label, ok]) => (
          <li key={label} className="flex items-center justify-between gap-2 text-sm">
            <span className={cn(ok ? "text-foreground" : "text-muted-foreground")}>{label}</span>
            {ok ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
            ) : (
              <XCircle className="h-4 w-4 shrink-0 text-slate-300" />
            )}
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Button
        disabled={!ready}
        variant={ready ? "success" : "default"}
        className="mt-5 w-full"
        size="default"
      >
        {ready ? "Profil veröffentlichen" : "Profil unvollständig"}
      </Button>
    </div>
  );
}
