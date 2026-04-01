import type { Metadata } from "next";
import Link from "next/link";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const name = slug.replace(/-/g, " ");
  return {
    title: `${name} – Behandlungsinfo | aesthetic`,
    description: `Informationen, Preise und Ärzte für ${name} in Österreich.`,
  };
}

export default async function BehandlungPage({ params }: PageProps) {
  const { slug } = await params;
  const name = slug.split("-").map((w) => w[0]?.toUpperCase() + w.slice(1)).join(" ");

  return (
    <main className="min-h-screen bg-white">
      <div className="container py-10">
        <nav className="mb-6 text-sm text-muted-foreground">
          <Link href="/">Home</Link> / <Link href="/suche">Suche</Link> / {name}
        </nav>

        <h1 className="text-3xl font-bold">{name}</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Alle Informationen zu {name} – Ablauf, Risiken, Heilungsverlauf und typische Preise in
          Österreich.
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <section className="rounded-2xl border p-6">
              <h2 className="mb-3 text-lg font-semibold">Was ist {name}?</h2>
              <p className="text-sm text-muted-foreground">
                Detaillierte Informationen zu dieser Behandlung werden in Kürze ergänzt.
              </p>
            </section>
            <section className="rounded-2xl border p-6">
              <h2 className="mb-3 text-lg font-semibold">Risiken & Heilungsverlauf</h2>
              <p className="text-sm text-muted-foreground">
                Jeder Eingriff birgt Risiken. Lasse dich vorab von einem qualifizierten Arzt beraten.
              </p>
            </section>
          </div>
          <aside>
            <div className="rounded-2xl border bg-slate-50 p-5">
              <h3 className="mb-3 font-semibold">Typische Preise in Österreich</h3>
              <p className="text-sm text-muted-foreground">Preisangaben folgen in Kürze.</p>
              <Link
                href={`/suche?procedure=${slug}`}
                className="mt-4 block w-full rounded-xl bg-primary py-2.5 text-center text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Ärzte für {name} finden
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
