import Link from "next/link";
import { listAdminDoctors } from "@/lib/queries/doctors";
import { ShieldCheck, Star, ExternalLink } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  published: "bg-emerald-100 text-emerald-700",
  draft: "bg-slate-100 text-slate-600",
  hidden: "bg-amber-100 text-amber-700",
  suspended: "bg-rose-100 text-rose-700",
};

export default async function AdminDoctorsPage() {
  const { data: doctors, count } = await listAdminDoctors({ limit: 50 }).catch(() => ({
    data: [],
    count: 0,
  }));

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ärzte</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{count} Einträge gesamt</p>
        </div>
      </div>

      <div className="rounded-2xl border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Fachrichtung</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Stadt</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Flags</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {doctors.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  Keine Einträge gefunden.
                </td>
              </tr>
            )}
            {doctors.map((doc) => {
              const specialty = (doc.specialties as { name_de?: string } | null)?.name_de;
              const primaryCity = (doc.locations as { city: string; is_primary: boolean }[])?.find(
                (l) => l.is_primary,
              )?.city ?? (doc.locations as { city: string }[])?.[0]?.city;

              return (
                <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 font-medium">{doc.public_display_name}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                    {specialty ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                    {primaryCity ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[doc.profile_status] ?? STATUS_COLORS.draft}`}
                    >
                      {doc.profile_status}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <div className="flex items-center gap-1.5">
                      {doc.is_verified && (
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" aria-label="Verifiziert" />
                      )}
                      {doc.is_premium && (
                        <Star className="h-3.5 w-3.5 text-amber-500" aria-label="Premium" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/doctors/${doc.id}`}
                      className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium hover:bg-slate-50 transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Detail
                    </Link>
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
