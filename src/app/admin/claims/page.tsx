import { getClaimsQueue } from "@/lib/queries/claims";

const STATUS_COLORS: Record<string, string> = {
  initiated: "bg-blue-100 text-blue-700",
  email_sent: "bg-sky-100 text-sky-700",
  otp_verified: "bg-indigo-100 text-indigo-700",
  document_pending: "bg-amber-100 text-amber-700",
  manual_review: "bg-orange-100 text-orange-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-rose-100 text-rose-700",
};

const STATUS_LABELS: Record<string, string> = {
  initiated: "Initiiert",
  email_sent: "E-Mail gesendet",
  otp_verified: "OTP verifiziert",
  document_pending: "Dokument ausstehend",
  manual_review: "Manuelle Prüfung",
  approved: "Genehmigt",
  rejected: "Abgelehnt",
};

export default async function AdminClaimsPage() {
  const { data: claims, count } = await getClaimsQueue().catch(() => ({ data: [], count: 0 }));

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Claims</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">{count} Claims gesamt</p>
      </div>

      <div className="rounded-2xl border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Arzt</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">
                Claimant
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">
                Rolle
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">
                Erstellt
              </th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {claims.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  Keine Claims vorhanden.
                </td>
              </tr>
            )}
            {claims.map((claim) => {
              const doctor = claim.doctor_profiles as { public_display_name?: string; id?: string } | null;
              return (
                <tr key={claim.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 font-medium">
                    {doctor?.public_display_name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                    {claim.claimant_email}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                    {claim.requested_role}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[claim.status] ?? "bg-slate-100 text-slate-600"}`}
                    >
                      {STATUS_LABELS[claim.status] ?? claim.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                    {new Date(claim.created_at).toLocaleDateString("de-AT")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-700 transition-colors">
                        Genehmigen
                      </button>
                      <button className="rounded-lg border px-2.5 py-1 text-xs font-medium hover:bg-slate-50 transition-colors">
                        Ablehnen
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
