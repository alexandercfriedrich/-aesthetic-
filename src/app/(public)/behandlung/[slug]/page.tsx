import type { Metadata } from "next";
import Link from "next/link";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const name = slug.split("-").map((w) => w[0]?.toUpperCase() + w.slice(1)).join(" ");
  return {
    title: `${name} in Österreich – Ablauf, Kosten & Ärzte | aesthetic`,
    description: `Alle Infos zu ${name}: Ablauf, Risiken, Heilungsverlauf und typische Kosten in Österreich. Qualifizierte Ärzte finden und Anfrage stellen.`,
    alternates: { canonical: `/behandlung/${slug}` },
  };
}

export default async function BehandlungPage({ params }: PageProps) {
  const { slug } = await params;
  const name = slug.split("-").map((w) => w[0]?.toUpperCase() + w.slice(1)).join(" ");

  return (
    <main className="min-h-screen bg-white">
      <div className="container py-10">
        <nav className="mb-6 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>{" "}
          /{" "}
          <Link href="/suche" className="hover:text-foreground">
            Suche
          </Link>{" "}
          / {name}
        </nav>

        <h1 className="text-3xl font-bold">{name}</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Alles Wichtige zu {name} – Ablauf, Risiken, Heilungsverlauf und typische Kosten in
          Österreich. Finde qualifizierte Ärztinnen und Ärzte für deinen Eingriff.
        </p>

        {/* Medical disclaimer */}
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
          <strong>Medizinischer Hinweis:</strong> Die folgenden Informationen dienen ausschließlich
          der allgemeinen Orientierung und ersetzen keine individuelle ärztliche Beratung. Kläre
          alle Fragen zu Eingriffen stets mit einem qualifizierten Facharzt ab.
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* What is it */}
            <section className="rounded-2xl border p-6">
              <h2 className="mb-3 text-lg font-semibold">Was ist {name}?</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {name} ist ein Verfahren aus dem Bereich der ästhetischen Medizin, das in
                Österreich von qualifizierten Fachärztinnen und Fachärzten durchgeführt wird.
                Der genaue Ablauf, die Methode und die eingesetzten Mittel können je nach
                Praxis, individuellem Befund und gewünschtem Ergebnis variieren.
              </p>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                In einem persönlichen Beratungsgespräch klärt dein Arzt, ob der Eingriff für
                dich geeignet ist, welche Vorbereitungen notwendig sind und welches Ergebnis
                realistisch erwartet werden kann.
              </p>
            </section>

            {/* Procedure steps */}
            <section className="rounded-2xl border p-6">
              <h2 className="mb-3 text-lg font-semibold">Ablauf</h2>
              <ol className="space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    1
                  </span>
                  <span>
                    <strong className="text-foreground">Erstberatung</strong> – Diagnose,
                    Anamnese und individuelle Behandlungsplanung durch den Facharzt.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    2
                  </span>
                  <span>
                    <strong className="text-foreground">Vorbereitung</strong> – Je nach Eingriff
                    können Blutuntersuchungen, Medikamentenpausen oder besondere
                    Verhaltensregeln erforderlich sein.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    3
                  </span>
                  <span>
                    <strong className="text-foreground">Durchführung</strong> – Der Eingriff
                    selbst, meist ambulant in der Praxis oder Klinik.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    4
                  </span>
                  <span>
                    <strong className="text-foreground">Nachsorge</strong> – Kontrolltermine und
                    Pflegehinweise für eine optimale Heilung.
                  </span>
                </li>
              </ol>
            </section>

            {/* Risks */}
            <section className="rounded-2xl border p-6">
              <h2 className="mb-3 text-lg font-semibold">Risiken & Heilungsverlauf</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Wie jeder medizinische Eingriff ist auch {name} mit möglichen Risiken
                verbunden. Dazu können zählen: vorübergehende Schwellungen, Hämatome,
                Sensibilitätsveränderungen, Infektionen oder in seltenen Fällen
                Unverträglichkeitsreaktionen.
              </p>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                Der Heilungsverlauf variiert je nach Eingriff und individueller Konstitution.
                Dein behandelnder Arzt informiert dich im Aufklärungsgespräch ausführlich über
                alle möglichen Komplikationen und Verhaltensregeln während der Heilungsphase.
              </p>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-4">
            {/* Price info */}
            <div className="rounded-2xl border bg-slate-50 p-5">
              <h3 className="mb-2 font-semibold">Typische Kosten in Österreich</h3>
              <p className="text-sm text-muted-foreground">
                Die Kosten für {name} sind abhängig von Umfang, Praxis und Region. Eine
                genaue Preisauskunft erhältst du im persönlichen Beratungsgespräch. Nutze
                aesthetic, um Ärzte in deiner Nähe zu vergleichen.
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Ästhetische Eingriffe werden in der Regel nicht von der gesetzlichen
                Krankenversicherung übernommen.
              </p>
              <Link
                href={`/suche?procedure=${slug}`}
                className="mt-4 block w-full rounded-xl bg-primary py-2.5 text-center text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Ärzte für {name} finden
              </Link>
            </div>

            {/* Why aesthetic */}
            <div className="rounded-2xl border p-5">
              <h3 className="mb-3 font-semibold text-sm">Warum aesthetic nutzen?</h3>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-emerald-500">✓</span>
                  Verifizierte Arztprofile mit Qualifikationen
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-emerald-500">✓</span>
                  Direkte Anfrage stellen – kostenlos
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-emerald-500">✓</span>
                  Bewertungen echter Patienten
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-emerald-500">✓</span>
                  Preisvergleich nach Behandlung & Stadt
                </li>
              </ul>
            </div>
          </aside>
        </div>

        {/* CTA strip */}
        <div className="mt-10 rounded-2xl bg-primary/5 p-8 text-center">
          <h2 className="text-xl font-bold">Jetzt qualifizierte Ärzte für {name} finden</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Vergleiche Profile, Bewertungen und Preise – kostenlos und unverbindlich.
          </p>
          <Link
            href={`/suche?procedure=${slug}`}
            className="mt-5 inline-block rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Zur Arztsuche für {name}
          </Link>
        </div>
      </div>
    </main>
  );
}
