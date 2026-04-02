import { cn } from "@/lib/utils";
import type { AdminDoctorDetail } from "@/lib/queries/doctors";

function ScoreBar({ value, max = 1 }: { value: number; max?: number }) {
  const pct = Math.min(100, (value / max) * 100);
  const color = pct >= 75 ? "bg-emerald-500" : pct >= 40 ? "bg-amber-400" : "bg-rose-400";

  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
      <div
        className={cn("h-full rounded-full transition-all duration-700", color)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function DoctorSourceScoreCard({ doctor }: { doctor: AdminDoctorDetail }) {
  const confidence = Number(doctor.source_confidence ?? 0);
  const pct = Math.round(confidence * 100);

  const dimensions = [
    {
      label: "Name",
      score: doctor.public_display_name ? 1 : 0,
    },
    {
      label: "Fachrichtung",
      score: doctor.primary_specialty_id ? 1 : 0,
    },
    {
      label: "Kontakt",
      score:
        ((doctor.email_public ? 0.5 : 0) + (doctor.phone_public ? 0.5 : 0)),
    },
    {
      label: "Bio",
      score:
        ((doctor.short_bio ? 0.5 : 0) + (doctor.long_bio ? 0.5 : 0)),
    },
    {
      label: "Standort",
      score: ((doctor.locations as unknown[]) ?? []).length > 0 ? 1 : 0,
    },
  ];

  return (
    <div className="rounded-2xl border bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Source Score</h2>
        <span
          className={cn(
            "text-xl font-bold tabular-nums",
            pct >= 75
              ? "text-emerald-600"
              : pct >= 40
                ? "text-amber-600"
                : "text-rose-600",
          )}
        >
          {pct}%
        </span>
      </div>

      <ScoreBar value={confidence} />

      <div className="mt-4 space-y-2.5">
        {dimensions.map(({ label, score }) => (
          <div key={label}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{label}</span>
              <span className={cn("font-medium", score === 1 ? "text-emerald-600" : score > 0 ? "text-amber-600" : "text-slate-400")}>
                {Math.round(score * 100)}%
              </span>
            </div>
            <ScoreBar value={score} />
          </div>
        ))}
      </div>
    </div>
  );
}
