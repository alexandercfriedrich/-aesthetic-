import { getAdminLeads } from "@/lib/queries/leads";

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-700",
  sent: "bg-sky-100 text-sky-700",
  viewed: "bg-amber-100 text-amber-700",
  contacted: "bg-purple-100 text-purple-700",
  won: "bg-emerald-100 text-emerald-700",
  lost: "bg-rose-100 text-rose-700",
  spam: "bg-slate-100 text-slate-500",
};

const STATUS_LABELS: Record<string, string> = {
  new: "Neu", sent: "Gesendet", viewed: "Gesehen",
  contacted: "Kontaktiert", won: "Gewonnen", lost: "Verloren", spam: "Spam",
};

export default async function AdminLeadsPage() {
  const { data: leads, count } = await getAdminLeads({ limit: 50 }).catch(() => ({ data: [], count: 0 }));

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Leads</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">{count} Leads gesamt</p>
      </div>
      <div className="rounded-2xl border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">E-Mail</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Arzt</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Behandlung</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Erstellt</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {leads.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">Keine Leads vorhanden.</td></tr>
            )}
            {leads.map((lead) => {
              const doctor = lead.doctor_profiles as { public_display_name?: string } | null;
              const procedure = lead.procedures as { name_de?: string } | null;
              return (
                <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 font-medium">{lead.patient_name}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{lead.patient_email}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{doctor?.public_display_name ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{procedure?.name_de ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[lead.status] ?? "bg-slate-100 text-slate-600"}`}>
                      {STATUS_LABELS[lead.status] ?? lead.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{new Date(lead.created_at).toLocaleDateString("de-AT")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
