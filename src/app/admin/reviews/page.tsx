import { createClient } from "@/lib/supabase/server";
import { AlertTriangle } from "lucide-react";

async function getReviewQueue() {
  const supabase = await createClient();
  const { data, count } = await supabase
    .from("reviews")
    .select(
      `*, doctor_profiles:doctor_id ( id, slug, public_display_name )`,
      { count: "exact" },
    )
    .in("moderation_status", ["pending", "flagged"])
    .order("created_at", { ascending: false })
    .limit(50);
  return { data: data ?? [], count: count ?? 0 };
}

const MODERATION_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  flagged: "bg-rose-100 text-rose-700",
  published: "bg-emerald-100 text-emerald-700",
  rejected: "bg-slate-100 text-slate-500",
};

function StarBar({ value }: { value: number }) {
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= value ? "text-amber-400" : "text-slate-200"}>
          ★
        </span>
      ))}
    </div>
  );
}

export default async function AdminReviewsPage() {
  const { data: reviews, count } = await getReviewQueue().catch(() => ({ data: [], count: 0 }));

  return (
    <div className="p-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reviews</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {count} ausstehende / gemeldete Bewertungen
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          <AlertTriangle className="h-3.5 w-3.5" />
          Reviews nie direkt live – immer manuell freischalten
        </div>
      </div>

      <div className="space-y-4">
        {reviews.length === 0 && (
          <div className="rounded-2xl border border-dashed bg-white px-5 py-12 text-center text-muted-foreground">
            Keine ausstehenden Reviews.
          </div>
        )}
        {reviews.map((review) => {
          const doctor = review.doctor_profiles as { public_display_name?: string; slug?: string } | null;
          return (
            <div key={review.id} className="rounded-2xl border bg-white p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <StarBar value={review.rating_overall} />
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${MODERATION_COLORS[review.moderation_status] ?? "bg-slate-100 text-slate-600"}`}
                    >
                      {review.moderation_status}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Arzt: {doctor?.public_display_name ?? "—"}
                    </span>
                  </div>
                  {review.title && (
                    <div className="font-medium text-sm">{review.title}</div>
                  )}
                  {review.body && (
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-3">{review.body}</p>
                  )}
                  <div className="mt-2 text-xs text-muted-foreground">
                    {new Date(review.created_at).toLocaleDateString("de-AT")}
                  </div>
                </div>
                <div className="shrink-0 flex flex-col gap-2">
                  <button className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 transition-colors">
                    Freischalten
                  </button>
                  <button className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-slate-50 transition-colors">
                    Ablehnen
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
