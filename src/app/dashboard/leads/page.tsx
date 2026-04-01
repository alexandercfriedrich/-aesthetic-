import type { Metadata } from "next";
import { MessageSquare } from "lucide-react";

export const metadata: Metadata = { title: "Leads | Dashboard" };

const STATUS_LABELS: Record<string, string> = {
  new: "Neu",
  sent: "Gesendet",
  viewed: "Gesehen",
  contacted: "Kontaktiert",
  won: "Gewonnen",
  lost: "Verloren",
  spam: "Spam",
};

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-700",
  sent: "bg-sky-100 text-sky-700",
  viewed: "bg-amber-100 text-amber-700",
  contacted: "bg-purple-100 text-purple-700",
  won: "bg-emerald-100 text-emerald-700",
  lost: "bg-rose-100 text-rose-700",
  spam: "bg-slate-100 text-slate-500",
};

export default function DashboardLeadsPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Leads</h1>
          <p className="mt-1 text-sm text-muted-foreground">Eingehende Patientenanfragen.</p>
        </div>
      </div>

      {/* Empty state */}
      <div className="rounded-2xl border border-dashed bg-white px-6 py-16 text-center">
        <MessageSquare className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
        <h2 className="font-semibold">Noch keine Leads</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Sobald Patientenanfragen eingehen, erscheinen sie hier.
        </p>
      </div>
    </main>
  );
}
