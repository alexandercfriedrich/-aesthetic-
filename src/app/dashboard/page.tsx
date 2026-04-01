import type { Metadata } from "next";
import Link from "next/link";
import { LayoutDashboard, User, Briefcase, MessageSquare, Image, ShieldCheck } from "lucide-react";

export const metadata: Metadata = { title: "Dashboard | aesthetic" };

const NAV = [
  { href: "/dashboard/profil", icon: User, label: "Profil" },
  { href: "/dashboard/profil/leistungen", icon: Briefcase, label: "Leistungen" },
  { href: "/dashboard/leads", icon: MessageSquare, label: "Leads" },
  { href: "/dashboard/medien", icon: Image, label: "Medien" },
  { href: "/dashboard/verifizierung", icon: ShieldCheck, label: "Verifizierung" },
];

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="hidden w-56 border-r bg-white lg:flex lg:flex-col">
        <div className="flex h-14 items-center border-b px-5">
          <Link href="/" className="text-lg font-bold text-primary">aesthetic</Link>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 rounded-xl bg-primary/10 px-3 py-2 text-sm font-medium text-primary"
          >
            <LayoutDashboard className="h-4 w-4" />
            Übersicht
          </Link>
          {NAV.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-slate-50 hover:text-foreground transition-colors"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6">
        <h1 className="text-2xl font-bold">Mein Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Willkommen zurück.</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {NAV.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className="rounded-2xl border bg-white p-6 shadow-sm hover:shadow-md hover:border-primary/30 transition-all"
            >
              <Icon className="mb-3 h-6 w-6 text-primary" />
              <div className="font-semibold">{label}</div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
