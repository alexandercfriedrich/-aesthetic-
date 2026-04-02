import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getDoctorBySlug } from "@/lib/queries/doctors";
import { ShieldCheck, Star, Globe, Phone, MapPin, AlertCircle } from "lucide-react";
import { LeadFormSection } from "@/components/forms/LeadFormSection";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const doctor = await getDoctorBySlug(slug).catch(() => null);
  if (!doctor) return { title: "Arzt nicht gefunden" };

  return {
    title: `${doctor.public_display_name} – aesthetic`,
    description: doctor.short_bio ?? `Profil von ${doctor.public_display_name} auf aesthetic.`,
    alternates: { canonical: `/arzt/${slug}` },
  };
}

export default async function ArztProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const doctor = await getDoctorBySlug(slug).catch(() => null);
  if (!doctor) notFound();

  const specialty = (doctor.specialties as { name_de?: string } | null)?.name_de;
  const primaryLocation = (doctor.locations as { city: string; is_primary: boolean }[])
    ?.find((l) => l.is_primary) ?? (doctor.locations as { city: string }[])?.[0];
  const procedures = (doctor.doctor_procedures as {
    id: string;
    price_from?: number | null;
    price_to?: number | null;
    currency: string;
    is_price_verified: boolean;
    procedures?: { name_de: string; slug: string } | null;
  }[]) ?? [];
  const reviews = (doctor.reviews as {
    id: string;
    rating_overall: number;
    body?: string | null;
    moderation_status: string;
  }[])?.filter((r) => r.moderation_status === "published") ?? [];
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating_overall, 0) / reviews.length
      : null;

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-2xl font-bold text-primary">
                {doctor.public_display_name[0]}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold">{doctor.public_display_name}</h1>
                  {doctor.is_verified && (
                    <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                      <ShieldCheck className="h-3 w-3" /> Verifiziert
                    </span>
                  )}
                  {doctor.is_premium && (
                    <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                      <Star className="h-3 w-3" /> Premium
                    </span>
                  )}
                </div>
                {specialty && <p className="mt-1 text-sm text-muted-foreground">{specialty}</p>}
                {primaryLocation && (
                  <p className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" /> {primaryLocation.city}
                  </p>
                )}
                {avgRating !== null && (
                  <div className="mt-1 flex items-center gap-1 text-sm">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span className="font-medium">{avgRating.toFixed(1)}</span>
                    <span className="text-muted-foreground">({reviews.length} Bewertung{reviews.length !== 1 ? "en" : ""})</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {doctor.website_url && (
                <a href={doctor.website_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm hover:bg-slate-50 transition-colors">
                  <Globe className="h-3.5 w-3.5" /> Website
                </a>
              )}
              {doctor.phone_public && (
                <a href={`tel:${doctor.phone_public}`}
                  className="flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm hover:bg-slate-50 transition-colors">
                  <Phone className="h-3.5 w-3.5" /> {doctor.phone_public}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            {/* Disclaimer */}
            <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                Online-Bewertungen sind nur ein Anhaltspunkt. Hole dir vor einem Eingriff eine
                persönliche ärztliche Beratung ein und prüfe ungewöhnlich günstige Angebote
                kritisch.
              </p>
            </div>

            {/* Bio */}
            {doctor.short_bio && (
              <section className="rounded-2xl border bg-white p-6">
                <h2 className="mb-3 font-semibold">Über {doctor.public_display_name}</h2>
                <p className="text-sm text-muted-foreground">{doctor.short_bio}</p>
                {doctor.long_bio && (
                  <p className="mt-3 text-sm text-muted-foreground">{doctor.long_bio}</p>
                )}
              </section>
            )}

            {/* Treatments */}
            {procedures.length > 0 && (
              <section className="rounded-2xl border bg-white p-6">
                <h2 className="mb-4 font-semibold">Behandlungen & Preise</h2>
                <div className="space-y-3">
                  {procedures.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3">
                      <Link href={`/behandlung/${item.procedures?.slug ?? ""}`}
                        className="text-sm font-medium hover:text-primary transition-colors">
                        {item.procedures?.name_de ?? "Behandlung"}
                      </Link>
                      <div className="shrink-0 text-right text-sm">
                        {item.price_from != null || item.price_to != null ? (
                          <span>
                            {item.price_from != null ? `ab ${item.price_from.toLocaleString("de-AT")} €` : ""}
                            {item.price_from != null && item.price_to != null ? " – " : ""}
                            {item.price_to != null && item.price_from == null ? `bis ${item.price_to.toLocaleString("de-AT")} €` : ""}
                            {item.price_to != null && item.price_from != null ? `${item.price_to.toLocaleString("de-AT")} €` : ""}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Auf Anfrage</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Reviews */}
            {reviews.length > 0 && (
              <section className="rounded-2xl border bg-white p-6">
                <h2 className="mb-4 font-semibold">Bewertungen</h2>
                <p className="mb-4 text-xs text-muted-foreground">
                  Bewertungen werden moderiert, sind aber nur ein Anhaltspunkt. Bitte lies sie
                  kritisch.
                </p>
                <div className="space-y-4">
                  {reviews.slice(0, 5).map((r) => (
                    <div key={r.id} className="rounded-xl bg-slate-50 px-4 py-3">
                      <div className="flex items-center gap-1 text-amber-400">
                        {Array.from({ length: r.rating_overall }).map((_, i) => (
                          <Star key={i} className="h-3.5 w-3.5 fill-current" />
                        ))}
                      </div>
                      {r.body && <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{r.body}</p>}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Lead form sidebar */}
          <aside>
            <LeadFormSection doctorId={doctor.id} doctorName={doctor.public_display_name} />
          </aside>
        </div>
      </div>
    </main>
  );
}
