import type { Metadata } from "next";
import Link from "next/link";
import { searchDoctors } from "@/lib/queries/doctors";

type PageProps = { params: Promise<{ slug: string; city: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, city } = await params;
  const name = slug.split("-").map((w) => w[0]?.toUpperCase() + w.slice(1)).join(" ");
  const cityName = city[0]?.toUpperCase() + city.slice(1);

  return {
    title: `${name} in ${cityName} – aesthetic`,
    description: `Qualifizierte Ärztinnen und Ärzte für ${name} in ${cityName}. Preise, Profile und Anfragen.`,
    alternates: { canonical: `/behandlung/${slug}/${city}` },
  };
}

export default async function BehandlungCityPage({ params }: PageProps) {
  const { slug, city } = await params;
  const name = slug.split("-").map((w) => w[0]?.toUpperCase() + w.slice(1)).join(" ");
  const cityName = city[0]?.toUpperCase() + city.slice(1);

  const doctors = await searchDoctors({
    city: cityName,
    procedureSlug: slug,
    limit: 12,
  }).catch(() => []);

  return (
    <main className="min-h-screen bg-white">
      <div className="container py-10">
        <nav className="mb-6 text-sm text-muted-foreground">
          <Link href="/">Home</Link> /{" "}
          <Link href={`/behandlung/${slug}`}>{name}</Link> / {cityName}
        </nav>

        <h1 className="text-3xl font-bold">
          {name} in {cityName}
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          {doctors.length > 0
            ? `${doctors.length} Arzt/Ärztin für ${name} in ${cityName} gefunden.`
            : `Noch keine Einträge für ${name} in ${cityName}.`}
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {doctors.map((doc) => (
            <Link
              key={doc.doctor_id}
              href={`/arzt/${doc.slug}`}
              className="rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md hover:border-primary/30 transition-all"
            >
              <div className="font-semibold">{doc.public_display_name}</div>
              {doc.specialty && (
                <div className="mt-1 text-sm text-muted-foreground">{doc.specialty}</div>
              )}
            </Link>
          ))}
        </div>

        {doctors.length === 0 && (
          <Link
            href={`/suche?procedure=${slug}`}
            className="mt-6 inline-block rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Österreichweit suchen
          </Link>
        )}
      </div>
    </main>
  );
}
