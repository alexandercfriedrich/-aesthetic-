import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AdminDoctorDetail } from "@/lib/queries/doctors";

type ReviewRow = {
  id: string;
  rating_overall: number;
  rating_consultation?: number | null;
  rating_result?: number | null;
  rating_staff?: number | null;
  title?: string | null;
  body?: string | null;
  visit_month?: number | null;
  visit_year?: number | null;
  verification_status: string;
  moderation_status: string;
  created_at: string;
};

const moderationConfig: Record<string, { label: string; variant: "success" | "warning" | "destructive" | "muted" }> = {
  published: { label: "Publiziert", variant: "success" },
  pending: { label: "Ausstehend", variant: "warning" },
  flagged: { label: "Gemeldet", variant: "destructive" },
  rejected: { label: "Abgelehnt", variant: "muted" },
};

function RatingStars({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn("h-3.5 w-3.5", i <= value ? "fill-amber-400 text-amber-400" : "text-slate-200")}
        />
      ))}
    </div>
  );
}

export function DoctorReviewsTab({ doctor }: { doctor: AdminDoctorDetail }) {
  const reviews = (doctor.reviews ?? []) as ReviewRow[];
  const published = reviews.filter((r) => r.moderation_status === "published").length;
  const pending = reviews.filter((r) => r.moderation_status === "pending").length;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Gesamt", value: reviews.length },
          { label: "Publiziert", value: published },
          { label: "Ausstehend", value: pending },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-2xl border bg-white p-4 text-center">
            <div className="text-2xl font-bold">{value}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>

      {reviews.length === 0 && (
        <div className="rounded-2xl border border-dashed bg-white px-5 py-10 text-center text-sm text-muted-foreground">
          Noch keine Bewertungen vorhanden.
        </div>
      )}

      {reviews.map((review) => {
        const mod = moderationConfig[review.moderation_status] ?? moderationConfig.pending;
        return (
          <div key={review.id} className="rounded-2xl border bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <RatingStars value={review.rating_overall} />
                  {review.title && <span className="text-sm font-medium">{review.title}</span>}
                </div>
                {review.body && (
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{review.body}</p>
                )}
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {review.visit_month && review.visit_year && (
                    <span>Besuch: {review.visit_month}/{review.visit_year}</span>
                  )}
                  {review.rating_consultation && <span>Beratung: {review.rating_consultation}/5</span>}
                  {review.rating_result && <span>Ergebnis: {review.rating_result}/5</span>}
                  {review.rating_staff && <span>Team: {review.rating_staff}/5</span>}
                </div>
              </div>
              <div className="shrink-0 flex flex-col items-end gap-2">
                <Badge variant={mod.variant}>{mod.label}</Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date(review.created_at).toLocaleDateString("de-AT")}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
