import type { Metadata } from "next";
import Link from "next/link";
import { searchDoctorsAction } from "./suche/actions";
import { Search, MapPin, ShieldCheck, Star, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "aesthetic – Ästhetische Medizin in Österreich",
  description:
    "Finde qualifizierte Ärztinnen und Ärzte für ästhetische Medizin und Schönheitschirurgie in Österreich. Vergleiche Profile, Preise und Bewertungen.",
};

const TOP_TREATMENTS = [
  { slug: "botox", label: "Botox" },
  { slug: "hyaluron", label: "Hyaluron-Filler" },
  { slug: "nasen-op", label: "Nasen-OP" },
  { slug: "brustvergroesserung", label: "Brustvergrößerung" },
  { slug: "haartransplantation", label: "Haartransplantation" },
  { slug: "fettabsaugung", label: "Fettabsaugung" },
  { slug: "microneedling", label: "Microneedling" },
  { slug: "lidstraffung", label: "Lidstraffung" },
];

const TOP_CITIES = ["Wien", "Graz", "Linz", "Salzburg", "Innsbruck", "Klagenfurt"];

const FAQ = [
  {
    q: "Wie finde ich den richtigen Arzt für ästhetische Eingriffe?",
    a: "Achte auf die Fachrichtung, Qualifikation und Erfahrung. Ärzte für Plastische, Rekonstruktive und Ästhetische Chirurgie decken das breiteste operative Spektrum ab. Lass dich nicht von ungewöhnlich günstigen Preisen verleiten.",
  },
  {
    q: "Warum sind Bewertungen allein kein verlässliches Kriterium?",
    a: "Online-Bewertungen können gefälscht oder verzerrt sein. Die Stadt Wien empfiehlt, Bewertungen kritisch zu lesen und als einen von mehreren Entscheidungsfaktoren zu nutzen – nicht als einziges Kriterium.",
  },
  {
    q: "Was bedeutet 'Verifiziert' auf aesthetic?",
    a: "Verifizierte Profile wurden durch Dokumentenprüfung oder editorielle Kontrolle bestätigt. Wir prüfen Berufsqualifikation und Praxisexistenz – für mehr Vertrauen bei deiner Entscheidung.",
  },
  {
    q: "Kann ich direkt über aesthetic einen Termin buchen?",
    a: "Du kannst eine Anfrage senden, die direkt an den Arzt weitergeleitet wird. Die finale Terminvereinbarung erfolgt dann mit der Praxis.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container flex h-14 items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight text-primary">
            aesthetic
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/suche" className="text-muted-foreground hover:text-foreground transition-colors">
              Suche
            </Link>
            <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">
              Anmelden
            </Link>
            <Link
              href="/arzt-claim"
              className="rounded-xl bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Profil beanspruchen
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-b from-rose-50 to-white py-20">
        <div className="container text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Ästhetische Medizin in Österreich
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Finde qualifizierte Ärztinnen und Ärzte für Schönheitschirurgie und ästhetische Medizin.
            Vergleiche Profile, Behandlungen und Preise – transparent und vertrauenswürdig.
          </p>

          {/* Search form */}
          <form action={searchDoctorsAction} className="mx-auto mt-10 max-w-2xl">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  name="query"
                  type="text"
                  placeholder="Behandlung oder Arzt suchen…"
                  className="h-12 w-full rounded-xl border bg-white pl-10 pr-4 text-sm shadow-sm outline-none ring-offset-background focus:ring-2 focus:ring-primary focus:ring-offset-2"
                />
              </div>
              <div className="relative flex-1 sm:max-w-[200px]">
                <MapPin className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  name="city"
                  type="text"
                  placeholder="Stadt…"
                  className="h-12 w-full rounded-xl border bg-white pl-10 pr-4 text-sm shadow-sm outline-none ring-offset-background focus:ring-2 focus:ring-primary focus:ring-offset-2"
                />
              </div>
              <button
                type="submit"
                className="h-12 rounded-xl bg-primary px-6 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 active:scale-[0.98] transition-all"
              >
                Suchen
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-y bg-slate-50 py-6">
        <div className="container">
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
            {[
              { icon: <ShieldCheck className="h-4 w-4 text-emerald-600" />, text: "Verifizierte Ärzte" },
              { icon: <Star className="h-4 w-4 text-amber-500" />, text: "Geprüfte Qualifikationen" },
              { icon: <Search className="h-4 w-4 text-primary" />, text: "Österreichweit" },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-2">
                {icon}
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Top Treatments */}
      <section className="py-16">
        <div className="container">
          <h2 className="mb-8 text-2xl font-bold">Beliebte Behandlungen</h2>
          <div className="flex flex-wrap gap-3">
            {TOP_TREATMENTS.map(({ slug, label }) => (
              <Link
                key={slug}
                href={`/behandlung/${slug}`}
                className="rounded-xl border bg-white px-4 py-2.5 text-sm font-medium shadow-sm hover:border-primary hover:text-primary transition-colors"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Top Cities */}
      <section className="bg-slate-50 py-16">
        <div className="container">
          <h2 className="mb-8 text-2xl font-bold">Nach Stadt suchen</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
            {TOP_CITIES.map((city) => (
              <Link
                key={city}
                href={`/standort/${city.toLowerCase()}`}
                className="rounded-2xl border bg-white p-4 text-center text-sm font-medium shadow-sm hover:border-primary hover:text-primary transition-colors"
              >
                {city}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Claim CTA */}
      <section className="py-16">
        <div className="container">
          <div className="rounded-2xl bg-gradient-to-r from-primary/10 to-rose-50 p-8 md:p-12">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-bold">Arzt oder Klinik? Profil beanspruchen</h2>
              <p className="mt-3 text-muted-foreground">
                Wir haben möglicherweise bereits ein Profil für dich angelegt. Claim es kostenlos,
                ergänze deine Leistungen und Preise und werde von Patientinnen und Patienten gefunden.
              </p>
              <Link
                href="/arzt-claim"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Jetzt Profil beanspruchen
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-slate-50 py-16">
        <div className="container max-w-3xl">
          <h2 className="mb-8 text-2xl font-bold">Häufige Fragen</h2>
          <div className="space-y-4">
            {FAQ.map(({ q, a }) => (
              <div key={q} className="rounded-2xl border bg-white p-6">
                <h3 className="font-semibold">{q}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-10 text-center text-sm text-muted-foreground">
        <div className="container">
          <p>
            © {new Date().getFullYear()} aesthetic ·{" "}
            <Link href="/datenschutz" className="hover:text-foreground">Datenschutz</Link>{" "}
            ·{" "}
            <Link href="/impressum" className="hover:text-foreground">Impressum</Link>
          </p>
          <p className="mt-2 text-xs max-w-2xl mx-auto">
            Die Informationen auf dieser Plattform ersetzen keine medizinische Beratung.
            Online-Bewertungen sind kritisch zu lesen. Lasse dich vor einem Eingriff von einem
            qualifizierten Arzt beraten.
          </p>
        </div>
      </footer>
    </main>
  );
}
