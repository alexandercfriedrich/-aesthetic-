import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `Arzt-Profil beanspruchen – ${slug} | aesthetic`,
    description: "Beanspruche dein Arztprofil auf aesthetic und verwalte deine Leistungen.",
  };
}

export default async function ArztClaimPage({ params }: PageProps) {
  const { slug } = await params;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="container max-w-xl py-16">
        <div className="rounded-2xl border bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold">Profil beanspruchen</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Profil: <span className="font-mono font-medium">{slug}</span>
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            Um dieses Profil zu beanspruchen, musst du zunächst ein Konto erstellen oder dich
            anmelden. Anschließend kannst du deine Identität als Arzt oder Praxisinhaber
            verifizieren.
          </p>
          <div className="mt-6 space-y-3">
            <Link
              href={`/login?redirect=/arzt-claim/${slug}`}
              className="block w-full rounded-xl bg-primary py-3 text-center text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Anmelden & Claim starten
            </Link>
            <Link
              href={`/registrieren?redirect=/arzt-claim/${slug}`}
              className="block w-full rounded-xl border py-3 text-center text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Neues Konto erstellen
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
