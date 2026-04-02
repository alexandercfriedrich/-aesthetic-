import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Profil beanspruchen – aesthetic",
  description:
    "Beanspruche dein Arztprofil auf aesthetic. Suche nach deinem Namen und verifiziere deine Identität.",
};

export default function ArztClaimRootPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="container max-w-xl py-16">
        <div className="rounded-2xl border bg-white p-8 shadow-sm">
          <Link
            href="/"
            className="mb-8 block text-center text-xl font-bold text-primary hover:opacity-80 transition-opacity"
          >
            aesthetic
          </Link>

          <h1 className="text-2xl font-bold text-center">Profil beanspruchen</h1>
          <p className="mt-3 text-sm text-center text-muted-foreground">
            Suche nach deinem Namen, um dein bestehendes Profil zu finden,
            <br />
            oder registriere dich, um ein neues Profil anzulegen.
          </p>

          {/* Search form */}
          <form action="/suche" method="get" className="mt-6">
            <input type="hidden" name="mode" value="claim" />
            <div className="flex gap-2">
              <input
                name="q"
                type="text"
                placeholder="Dein Name oder Praxisname …"
                className="h-11 flex-1 rounded-xl border bg-white px-4 text-sm outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                autoFocus
              />
              <button
                type="submit"
                className="h-11 rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Suchen
              </button>
            </div>
          </form>

          {/* Benefits */}
          <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
            {[
              "Profil kostenlos beanspruchen",
              "Kontaktdaten und Leistungen ergänzen",
              "Anfragen von Patientinnen und Patienten erhalten",
              "Verifiziertes Profil-Badge erhalten",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Noch kein Profil vorhanden?{" "}
            <Link
              href="/registrieren"
              className="font-medium text-primary hover:underline"
            >
              Jetzt registrieren
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
