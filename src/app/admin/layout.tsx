import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Star,
  MessageSquare,
  Upload,
} from "lucide-react";

const NAV = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/doctors", icon: Users, label: "Ärzte" },
  { href: "/admin/claims", icon: ShieldCheck, label: "Claims" },
  { href: "/admin/reviews", icon: Star, label: "Reviews" },
  { href: "/admin/leads", icon: MessageSquare, label: "Leads" },
  { href: "/admin/imports", icon: Upload, label: "Imports" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="hidden w-56 flex-col border-r bg-white lg:flex">
        <div className="flex h-14 items-center border-b px-5">
          <Link href="/" className="text-lg font-bold text-primary">
            aesthetic
          </Link>
          <span className="ml-2 rounded-md bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-500">
            Admin
          </span>
        </div>
        <nav className="flex-1 space-y-0.5 p-2">
          {NAV.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-slate-50 hover:text-foreground transition-colors"
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="border-t p-3">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Zur Website
          </Link>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-white px-6">
          <div className="text-sm font-medium">Admin</div>
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            aesthetic.at
          </Link>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
