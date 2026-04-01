import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Impressum – aesthetic",
  description: "Impressum der aesthetic Plattform.",
  alternates: { canonical: "/impressum" },
};

export default function ImpressumPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="container max-w-3xl py-12">
        <nav className="mb-6 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>{" "}
          / Impressum
        </nav>

        <h1 className="mb-8 text-3xl font-bold">Impressum</h1>

        <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">
              Angaben gemäß § 5 ECG (E-Commerce-Gesetz)
            </h2>
            <p>aesthetic – Vergleichsplattform für ästhetische Medizin in Österreich</p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">Kontakt</h2>
            <p>
              E-Mail:{" "}
              <a href="mailto:hello@aesthetic.at" className="text-primary hover:underline">
                hello@aesthetic.at
              </a>
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">
              Haftungsausschluss
            </h2>
            <p>
              Die Inhalte dieser Website wurden mit größtmöglicher Sorgfalt erstellt. Für die
              Richtigkeit, Vollständigkeit und Aktualität der Inhalte kann jedoch keine Gewähr
              übernommen werden.
            </p>
            <p className="mt-2">
              Die auf dieser Plattform bereitgestellten Informationen zu medizinischen Behandlungen
              dienen ausschließlich der allgemeinen Information und ersetzen keine individuelle
              ärztliche Beratung. Für medizinische Entscheidungen ist stets ein qualifizierter
              Arzt hinzuzuziehen.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">Urheberrecht</h2>
            <p>
              Die durch die Betreiber dieser Plattform erstellten Inhalte und Werke sind
              urheberrechtlich geschützt. Beiträge Dritter sind als solche gekennzeichnet.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">
              Online-Streitbeilegung
            </h2>
            <p>
              Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS)
              bereit:{" "}
              <a
                href="https://ec.europa.eu/consumers/odr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                ec.europa.eu/consumers/odr
              </a>
            </p>
          </section>

          <div className="border-t pt-6">
            <Link href="/datenschutz" className="text-primary hover:underline">
              → Datenschutzerklärung
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
