import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Verifizierung | Dashboard" };

const METHODS = [
  {
    id: "email",
    title: "Praxis-E-Mail",
    description: "Verifiziere dich über eine E-Mail-Adresse mit Praxis-Domain (keine Freemail).",
    badge: "Schnellste Methode",
  },
  {
    id: "document",
    title: "Dokumenten-Upload",
    description: "Lade eine Kopie deiner Berufszulassung oder deines Diploms hoch.",
    badge: "Empfohlen",
  },
  {
    id: "phone",
    title: "Telefon-Callback",
    description: "Wir rufen dich auf deiner Praxisnummer an und verifizieren persönlich.",
    badge: null,
  },
];

export default function DashboardVerifizierungPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Verifizierung</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Verifiziere dein Profil um das Vertrauen von Patientinnen und Patienten zu stärken.
          </p>
        </div>

        <div className="space-y-4">
          {METHODS.map(({ id, title, description, badge }) => (
            <div key={id} className="rounded-2xl border bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{title}</span>
                      {badge && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                          {badge}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                  </div>
                </div>
                <button className="shrink-0 rounded-xl border px-3 py-1.5 text-xs font-medium hover:bg-slate-50 transition-colors">
                  Starten
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
