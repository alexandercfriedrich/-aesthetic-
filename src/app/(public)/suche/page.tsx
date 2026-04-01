import type { Metadata } from "next";
import Link from "next/link";
import { searchDoctors } from "@/lib/queries/doctors";
import { Search, MapPin, ShieldCheck, Star } from "lucide-react";
import { searchDoctorsAction } from "./actions";

export const metadata: Metadata = {
  title: "Arztsuche – aesthetic",
  description:
    "Finde qualifizierte Ärztinnen und Ärzte für ästhetische Medizin in Österreich. Suche nach Behandlung und Ort.",
};

type SearchPageProps = {
  searchParams: Promise<{ q?: string; city?: string; procedure?: string }>;
};

export default async function SuchePage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.q ?? "";
  const city = params.city ?? "";
  const procedureSlug = params.procedure ?? "";

  const results = await searchDoctors({
    query: query || undefined,
    city: city || undefined,
    procedureSlug: procedureSlug || undefined,
    limit: 24,
  }).catch(() => []);

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Search bar */}
      <div className="bg-white border-b shadow-sm">
        <div className="container py-4">
          <form action={searchDoctorsAction}>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  name="query"
                  type="text"
                  defaultValue={query}
                  placeholder="Behandlung oder Arzt…"
                  className="h-11 w-full rounded-xl border bg-white pl-10 pr-4 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                />
              </div>
              <div className="relative sm:w-52">
                <MapPin className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  name="city"
                  type="text"
                  defaultValue={city}
                  placeholder="Stadt…"
                  className="h-11 w-full rounded-xl border bg-white pl-10 pr-4 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                />
              </div>
              <button
                type="submit"
                className="h-11 rounded-xl bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Suchen
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="container py-8">
        {/* Result header */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {results.length === 0
              ? "Keine Ergebnisse gefunden"
              : `${results.length} Ergebnis${results.length !== 1 ? "se" : ""} gefunden`}
            {query && ` für „${query}"`}
            {city && ` in ${city}`}
          </p>
        </div>

        {/* Results grid */}
        {results.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-white px-6 py-16 text-center">
            <Search className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <h2 className="font-semibold">Keine Ergebnisse</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Versuche es mit anderen Suchbegriffen oder einer anderen Stadt.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((doc) => (
              <Link
                key={doc.doctor_id}
                href={`/arzt/${doc.slug}`}
                className="group rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md hover:border-primary/30 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg font-bold text-primary">
                    {doc.public_display_name?.[0] ?? "?"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h3 className="font-semibold text-sm group-hover:text-primary transition-colors truncate">
                        {doc.public_display_name}
                      </h3>
                      {doc.is_verified && (
                        <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                      )}
                      {doc.is_premium && (
                        <Star className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                      )}
                    </div>
                    {doc.specialty && (
                      <p className="mt-0.5 text-xs text-muted-foreground truncate">{doc.specialty}</p>
                    )}
                    {doc.city && (
                      <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {doc.city}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
