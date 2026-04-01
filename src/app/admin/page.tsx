import Link from "next/link";
import {
  Users,
  ShieldCheck,
  MessageSquare,
  Star,
  AlertTriangle,
  Upload,
  Zap,
} from "lucide-react";

const KPI_CARDS = [
  {
    label: "Neue Claims",
    value: "—",
    icon: ShieldCheck,
    color: "text-blue-600",
    bg: "bg-blue-50",
    href: "/admin/claims",
  },
  {
    label: "Offene Reviews",
    value: "—",
    icon: Star,
    color: "text-amber-600",
    bg: "bg-amber-50",
    href: "/admin/reviews",
  },
  {
    label: "Neue Leads heute",
    value: "—",
    icon: MessageSquare,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    href: "/admin/leads",
  },
  {
    label: "Publish-ready",
    value: "—",
    icon: Users,
    color: "text-purple-600",
    bg: "bg-purple-50",
    href: "/admin/doctors",
  },
  {
    label: "Import-Fehler",
    value: "—",
    icon: AlertTriangle,
    color: "text-rose-600",
    bg: "bg-rose-50",
    href: "/admin/imports",
  },
  {
    label: "Laufende Jobs",
    value: "—",
    icon: Zap,
    color: "text-slate-600",
    bg: "bg-slate-100",
    href: "/admin/jobs",
  },
];

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/doctors", label: "Ärzte" },
  { href: "/admin/claims", label: "Claims" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/leads", label: "Leads" },
  { href: "/admin/content", label: "Content" },
];

export default function AdminDashboardPage() {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Übersicht aller offenen Aufgaben.</p>
      </div>

      {/* KPI Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {KPI_CARDS.map(({ label, value, icon: Icon, color, bg, href }) => (
          <Link
            key={label}
            href={href}
            className="group rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md hover:border-primary/30 transition-all"
          >
            <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl ${bg}`}>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <div className="text-2xl font-bold">{value}</div>
            <div className="mt-0.5 text-xs text-muted-foreground group-hover:text-foreground transition-colors">
              {label}
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Nav */}
      <div className="mt-8">
        <h2 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Bereiche
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {NAV_ITEMS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="rounded-2xl border bg-white px-5 py-4 text-sm font-medium shadow-sm hover:shadow-md hover:border-primary/30 hover:text-primary transition-all"
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
