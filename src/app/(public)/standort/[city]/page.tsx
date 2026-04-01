import type { Metadata } from "next";
import Link from "next/link";
import { searchDoctors } from "@/lib/queries/doctors";

type PageProps = { params: Promise<{ city: string }> };

const TOP_CITIES = [
  "wien",
  "graz",
  "linz",
  "salzburg",
  "innsbruck",
  "klagenfurt",
];

export async function generateStaticParams() {
  return TOP_CITIES.map((city) => ({ city }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city } = await params;
  const cityName = city.charAt(0).toUpperCase() + city.slice(1);
  return {
    title: `Ästhetische Medizin in ${cityName} – aesthetic`,
    description: `Finde qualifizierte Ärztinnen und Ärzte für ästhetische Medizin in ${cityName}. Profile, Preisranges und direkt anfragen.`,
    alternates: { canonical: `/standort/${city}` },
    openGraph: {
      title: `Ästhetische Medizin in ${cityName}`,
      description: `Qualifizierte Ärzte für Schönheitschirurgie und ästhetische Medizin in ${cityName}.`,
    },
  };
}

export default async function StandortPage({ params }: PageProps) {
  const { city } = await params;
  const cityName = city.charAt(0).toUpperCase() + city.slice(1);

  const doctors = await searchDoctors({ city: cityName, limit: 24 }).catch(() => []);

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b bg-slate-50">
        <div className="container py-10">
          <nav className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">{cityName}</span>
          </nav>
          <h1 className="text-3xl font-bold tracking-tight">
            Ästhetische Medizin in {cityName}
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            {doctors.length > 0
              ? `${doctors.length} Ärztinnen und Ärzte in ${cityName} gefunden.`
              : `Noch keine Einträge für ${cityName} vorhanden.`}{" "}
            Finde qualifizierte Ärztinnen und Ärzte, vergleiche Profile und sende direkt eine
            Anfrage.
          </p>
        </div>
      </div>

      {/* Doctor grid */}
      <div className="container py-10">
        {doctors.length === 0 ? (
          <div className="rounded-2xl border bg-slate-50 py-16 text-center">
            <p className="text-muted-foreground">
              Für {cityName} sind noch keine Profile verfügbar.
            </p>
            <Link
              href="/suche"
              className="mt-4 inline-block rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Zur Suche
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {doctors.map((doc) => (
              <Link
                key={doc.doctor_id}
                href={`/arzt/${doc.slug}`}
                className="group rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md hover:border-primary/30 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 shrink-0 rounded-xl bg-slate-100" />
                  <div className="min-w-0">
                    <div className="font-semibold truncate group-hover:text-primary transition-colors">
                      {doc.public_display_name}
                    </div>
                    {doc.specialty && (
                      <div className="mt-0.5 text-sm text-muted-foreground truncate">
                        {doc.specialty}
                      </div>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                      {doc.is_verified && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                          Verifiziert
                        </span>
                      )}
                      {doc.is_premium && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                          Premium
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Related cities */}
        <div className="mt-12">
          <h2 className="mb-4 text-lg font-semibold">Andere Städte</h2>
          <div className="flex flex-wrap gap-2">
            {TOP_CITIES.filter((c) => c !== city).map((c) => (
              <Link
                key={c}
                href={`/standort/${c}`}
                className="rounded-full border px-4 py-1.5 text-sm hover:bg-slate-50 hover:border-primary/30 transition-colors"
              >
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
