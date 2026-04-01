import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Datenschutzerklärung – aesthetic",
  description: "Datenschutzerklärung der aesthetic Plattform gemäß DSGVO/DSG.",
  alternates: { canonical: "/datenschutz" },
};

export default function DatenschutzPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="container max-w-3xl py-12">
        <nav className="mb-6 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>{" "}
          / Datenschutz
        </nav>

        <h1 className="mb-2 text-3xl font-bold">Datenschutzerklärung</h1>
        <p className="mb-10 text-xs text-muted-foreground">Stand: April 2026</p>

        <div className="space-y-10 text-sm leading-relaxed text-muted-foreground">

          {/* 1 */}
          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">
              1. Verantwortlicher
            </h2>
            <p>
              Verantwortlicher für die Verarbeitung personenbezogener Daten gemäß Art. 4 Nr. 7
              DSGVO ist der Betreiber dieser Plattform (siehe{" "}
              <Link href="/impressum" className="text-primary hover:underline">
                Impressum
              </Link>
              ). Anfragen zum Datenschutz richten Sie bitte an:{" "}
              <a href="mailto:datenschutz@aesthetic.at" className="text-primary hover:underline">
                datenschutz@aesthetic.at
              </a>
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="mb-4 text-base font-semibold text-foreground">
              2. Übersicht der Verarbeitungstätigkeiten
            </h2>
            <p className="mb-4">
              Die folgende Tabelle gibt einen Überblick über alle Verarbeitungstätigkeiten, die
              beim Betrieb dieser Plattform anfallen:
            </p>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="border-b bg-slate-50 text-left text-foreground">
                    <th className="py-2 pr-4 font-semibold">Verarbeitungstätigkeit</th>
                    <th className="py-2 pr-4 font-semibold">Betroffene Daten</th>
                    <th className="py-2 pr-4 font-semibold">Rechtsgrundlage</th>
                    <th className="py-2 font-semibold">Speicherdauer</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="py-2 pr-4 align-top">Besuch der Website (Server-Logs)</td>
                    <td className="py-2 pr-4 align-top">IP-Adresse, Browser, Betriebssystem, Zeitstempel, aufgerufene URL</td>
                    <td className="py-2 pr-4 align-top">Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse: IT-Sicherheit)</td>
                    <td className="py-2 align-top">7 Tage, danach automatische Löschung</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 align-top">Registrierung / Konto</td>
                    <td className="py-2 pr-4 align-top">E-Mail-Adresse, vollständiger Name, Passwort (gehasht)</td>
                    <td className="py-2 pr-4 align-top">Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung)</td>
                    <td className="py-2 align-top">Bis zur Kontolöschung, danach 30 Tage Backup-Frist</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 align-top">Kontaktanfrage an Arzt / Klinik (Lead-Formular)</td>
                    <td className="py-2 pr-4 align-top">Name, E-Mail, Telefonnummer (optional), Nachricht, bevorzugter Kontaktweg, Behandlungsinteresse</td>
                    <td className="py-2 pr-4 align-top">Art. 6 Abs. 1 lit. a DSGVO (Einwilligung) + Art. 6 Abs. 1 lit. b DSGVO (Vertragsanbahnung)</td>
                    <td className="py-2 align-top">3 Jahre oder bis Widerruf der Einwilligung</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 align-top">Arzt-/Klinik-Profil (öffentlich)</td>
                    <td className="py-2 pr-4 align-top">Name, Titel, Foto, Biografie, Behandlungsangebote, Praxisstandorte, öffentliche Kontaktdaten</td>
                    <td className="py-2 pr-4 align-top">Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung mit Arzt/Klinik)</td>
                    <td className="py-2 align-top">Während der Vertragslaufzeit; danach 6 Monate</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 align-top">Profil-Claim (Eigentumsnachweis)</td>
                    <td className="py-2 pr-4 align-top">E-Mail, Telefon, beanspruchte Rolle, Verifikationsdokumente</td>
                    <td className="py-2 pr-4 align-top">Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung) + Art. 6 Abs. 1 lit. c DSGVO (gesetzliche Pflicht)</td>
                    <td className="py-2 align-top">5 Jahre (Nachweispflicht)</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 align-top">Bewertungen</td>
                    <td className="py-2 pr-4 align-top">Bewertungstext, Sternebewertungen, Behandlungsmonat/-jahr, interne Verknüpfung zum Nutzerkonto</td>
                    <td className="py-2 pr-4 align-top">Art. 6 Abs. 1 lit. a DSGVO (Einwilligung)</td>
                    <td className="py-2 align-top">Bis Widerruf oder Kontolöschung</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 align-top">Medien-Upload (Bilder, Dokumente)</td>
                    <td className="py-2 pr-4 align-top">Bilddateien, ggf. Metadaten (EXIF), Dateiname</td>
                    <td className="py-2 pr-4 align-top">Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung)</td>
                    <td className="py-2 align-top">Bis zur manuellen Löschung durch den Nutzer</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 3 */}
          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">
              3. Weitergabe von Daten an Dritte
            </h2>
            <p className="mb-3">
              Personenbezogene Daten werden nur in folgenden Fällen an Dritte weitergegeben:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-foreground">Weiterleitung von Kontaktanfragen:</strong> Wenn
                Sie über das Lead-Formular eine Anfrage stellen, werden Ihre Kontaktdaten und Ihre
                Nachricht an den jeweiligen Arzt bzw. die Klinik übermittelt. Hierfür haben Sie
                ausdrücklich eingewilligt (Art. 6 Abs. 1 lit. a DSGVO).
              </li>
              <li>
                <strong className="text-foreground">Auftragsverarbeiter:</strong> Wir setzen
                technische Dienstleister ein, die als Auftragsverarbeiter gemäß Art. 28 DSGVO
                tätig sind (siehe Abschnitt 5). Diese verarbeiten Daten ausschließlich nach
                unseren Weisungen.
              </li>
              <li>
                <strong className="text-foreground">Gesetzliche Verpflichtung:</strong> Bei
                behördlichen Anfragen oder zur Geltendmachung, Ausübung oder Verteidigung von
                Rechtsansprüchen (Art. 6 Abs. 1 lit. c DSGVO).
              </li>
            </ul>
            <p className="mt-3">
              Eine Weitergabe zu Werbezwecken oder der Verkauf Ihrer Daten an Dritte findet
              nicht statt.
            </p>
          </section>

          {/* 4 */}
          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">
              4. Besondere Kategorien personenbezogener Daten
            </h2>
            <p>
              Das Lead-Formular und die Arztsuche können implizit Rückschlüsse auf den
              Gesundheitszustand zulassen (Art. 9 DSGVO – besondere Kategorie). Wir verarbeiten
              solche Informationen ausschließlich auf Basis Ihrer ausdrücklichen Einwilligung
              (Art. 9 Abs. 2 lit. a DSGVO), die Sie mit dem Abschicken der Anfrage erteilen.
              Sie können diese Einwilligung jederzeit widerrufen.
            </p>
          </section>

          {/* 5 */}
          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">
              5. Auftragsverarbeiter & Drittanbieter
            </h2>

            <div className="space-y-4">
              <div className="rounded-xl border p-4">
                <h3 className="mb-1 font-semibold text-foreground">Supabase Inc.</h3>
                <p className="text-xs">
                  Funktion: Datenbankbetrieb, Authentifizierung, Datei-Speicher (Storage).
                  Datenspeicherung in der EU (Region: West EU). Rechtsgrundlage für
                  Drittlandübermittlung: EU-Standardvertragsklauseln (Art. 46 Abs. 2 lit. c DSGVO)
                  sowie Supabase-eigene EU-Datenverarbeitungsvereinbarung (DPA).{" "}
                  <a
                    href="https://supabase.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Datenschutzerklärung
                  </a>{" "}
                  ·{" "}
                  <a
                    href="https://supabase.com/docs/guides/platform/gdpr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    DSGVO-Dokumentation
                  </a>
                </p>
              </div>

              <div className="rounded-xl border p-4">
                <h3 className="mb-1 font-semibold text-foreground">Vercel Inc.</h3>
                <p className="text-xs">
                  Funktion: Hosting der Web-Applikation, Edge-Functions, CDN. Vercel betreibt
                  EU-nahe Edge-Knoten; Kundendaten werden primär in der EU verarbeitet.
                  Rechtsgrundlage für eventuelle Drittlandübermittlung: EU-Standardvertragsklauseln
                  (Art. 46 Abs. 2 lit. c DSGVO).{" "}
                  <a
                    href="https://vercel.com/legal/privacy-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Datenschutzerklärung
                  </a>
                </p>
              </div>
            </div>
          </section>

          {/* 6 */}
          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">
              6. Cookies & technische Speicherung
            </h2>
            <p className="mb-3">
              Diese Plattform verwendet ausschließlich technisch notwendige Cookies. Es werden
              keine Tracking-, Analyse- oder Werbe-Cookies eingesetzt.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="border-b bg-slate-50 text-left text-foreground">
                    <th className="py-2 pr-4 font-semibold">Cookie / Storage</th>
                    <th className="py-2 pr-4 font-semibold">Zweck</th>
                    <th className="py-2 font-semibold">Speicherdauer</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="py-2 pr-4 font-mono align-top">sb-*-auth-token</td>
                    <td className="py-2 pr-4 align-top">Supabase-Authentifizierungssitzung (JWT)</td>
                    <td className="py-2 align-top">Sitzung / bis zu 7 Tage bei „Angemeldet bleiben"</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-mono align-top">__vercel_*</td>
                    <td className="py-2 pr-4 align-top">Technisches Routing durch Vercel-Infrastruktur</td>
                    <td className="py-2 align-top">Sitzung</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3">
              Da ausschließlich technisch notwendige Cookies verwendet werden, ist eine
              Einwilligung gemäß § 165 TKG 2021 nicht erforderlich.
            </p>
          </section>

          {/* 7 */}
          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">
              7. Einwilligung & Widerruf
            </h2>
            <p className="mb-3">
              Soweit die Verarbeitung auf Ihrer Einwilligung beruht (Art. 6 Abs. 1 lit. a bzw.
              Art. 9 Abs. 2 lit. a DSGVO), haben Sie das Recht, diese jederzeit mit Wirkung für
              die Zukunft zu widerrufen. Der Widerruf berührt nicht die Rechtmäßigkeit der bis
              dahin erfolgten Verarbeitung.
            </p>
            <p>
              Widerruf möglich per E-Mail an{" "}
              <a href="mailto:datenschutz@aesthetic.at" className="text-primary hover:underline">
                datenschutz@aesthetic.at
              </a>{" "}
              oder direkt über die Konto-Einstellungen im Dashboard.
            </p>
          </section>

          {/* 8 */}
          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">
              8. Ihre Rechte als betroffene Person
            </h2>
            <p className="mb-3">
              Sie haben gegenüber uns folgende Rechte hinsichtlich der Sie betreffenden
              personenbezogenen Daten:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-foreground">Auskunftsrecht</strong> (Art. 15 DSGVO) –
                Kopie der über Sie gespeicherten Daten
              </li>
              <li>
                <strong className="text-foreground">Berichtigung</strong> (Art. 16 DSGVO) –
                Korrektur unrichtiger oder Vervollständigung unvollständiger Daten
              </li>
              <li>
                <strong className="text-foreground">Löschung</strong> (Art. 17 DSGVO) –
                „Recht auf Vergessenwerden", sofern keine gesetzlichen Aufbewahrungspflichten
                entgegenstehen
              </li>
              <li>
                <strong className="text-foreground">Einschränkung der Verarbeitung</strong>{" "}
                (Art. 18 DSGVO) – Sperrung der Daten statt Löschung
              </li>
              <li>
                <strong className="text-foreground">Datenübertragbarkeit</strong> (Art. 20 DSGVO)
                – Herausgabe Ihrer Daten in maschinenlesbarem Format (JSON/CSV)
              </li>
              <li>
                <strong className="text-foreground">Widerspruch</strong> (Art. 21 DSGVO) –
                gegen Verarbeitungen auf Basis berechtigter Interessen (Art. 6 Abs. 1 lit. f
                DSGVO); wir stellen dann die Verarbeitung ein, sofern keine zwingenden
                schutzwürdigen Gründe überwiegen
              </li>
              <li>
                <strong className="text-foreground">Widerruf der Einwilligung</strong> (Art. 7
                Abs. 3 DSGVO) – jederzeit ohne Angabe von Gründen
              </li>
            </ul>
            <p className="mt-3">
              Anfragen richten Sie bitte schriftlich an{" "}
              <a href="mailto:datenschutz@aesthetic.at" className="text-primary hover:underline">
                datenschutz@aesthetic.at
              </a>
              . Wir beantworten Ihr Ersuchen innerhalb von 30 Tagen (Art. 12 Abs. 3 DSGVO). Zur
              Identitätsverifikation kann eine Kopie eines Lichtbildausweises erforderlich sein.
            </p>
          </section>

          {/* 9 */}
          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">
              9. Beschwerderecht bei der Aufsichtsbehörde
            </h2>
            <p>
              Unbeschadet anderweitiger Rechtsbehelfe haben Sie das Recht auf Beschwerde bei
              der österreichischen Datenschutzbehörde (DSB), wenn Sie der Ansicht sind, dass
              die Verarbeitung Ihrer personenbezogenen Daten gegen die DSGVO verstößt:
            </p>
            <address className="mt-3 not-italic rounded-xl border p-4 text-xs">
              <strong className="text-foreground">Österreichische Datenschutzbehörde</strong>
              <br />
              Barichgasse 40–42, 1030 Wien
              <br />
              Tel.: +43 1 52 152-0
              <br />
              E-Mail:{" "}
              <a href="mailto:dsb@dsb.gv.at" className="text-primary hover:underline">
                dsb@dsb.gv.at
              </a>
              <br />
              Web:{" "}
              <a
                href="https://www.dsb.gv.at"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                www.dsb.gv.at
              </a>
            </address>
          </section>

          {/* 10 */}
          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">
              10. Datensicherheit
            </h2>
            <p>
              Wir setzen dem Stand der Technik entsprechende technische und organisatorische
              Maßnahmen ein, um Ihre Daten vor Verlust, Zerstörung, unberechtigtem Zugriff,
              Veränderung oder Weitergabe zu schützen. Dazu gehören insbesondere:
            </p>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>Verschlüsselte Datenübertragung via TLS 1.2+</li>
              <li>Gehashte Passwörter (bcrypt, verwaltetet durch Supabase Auth)</li>
              <li>Row-Level Security (RLS) auf Datenbankebene: Nutzer können ausschließlich ihre eigenen Daten lesen und bearbeiten</li>
              <li>Rollenbasierte Zugriffskontrolle für Admin-Bereiche</li>
              <li>Regelmäßige automatisierte Sicherheits-Updates der Infrastruktur</li>
            </ul>
          </section>

          {/* 11 */}
          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">
              11. Änderungen dieser Datenschutzerklärung
            </h2>
            <p>
              Wir behalten uns vor, diese Datenschutzerklärung bei Änderungen der
              rechtlichen Anforderungen oder unserer Datenverarbeitungspraktiken anzupassen.
              Die aktuelle Fassung ist stets unter{" "}
              <Link href="/datenschutz" className="text-primary hover:underline">
                aesthetic.at/datenschutz
              </Link>{" "}
              abrufbar. Bei wesentlichen Änderungen informieren wir registrierte Nutzer per
              E-Mail.
            </p>
          </section>

          <p className="border-t pt-6 text-xs">
            Zuletzt aktualisiert: April 2026
          </p>
        </div>
      </div>
    </main>
  );
}
