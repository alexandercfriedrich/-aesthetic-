import type { AdminDoctorDetail } from "@/lib/queries/doctors";

type AuditLog = {
  id: string;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  user_id?: string | null;
  old_data?: unknown;
  new_data?: unknown;
  ip_address?: string | null;
  created_at: string;
};

const actionColor: Record<string, string> = {
  create: "bg-emerald-100 text-emerald-700",
  update: "bg-blue-100 text-blue-700",
  delete: "bg-rose-100 text-rose-700",
  publish: "bg-purple-100 text-purple-700",
  hide: "bg-amber-100 text-amber-700",
  approve: "bg-emerald-100 text-emerald-700",
  reject: "bg-rose-100 text-rose-700",
};

export function DoctorAuditTab({ doctor }: { doctor: AdminDoctorDetail }) {
  const logs = (doctor.audit_logs ?? []) as AuditLog[];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-white p-5">
        <h2 className="mb-1 text-sm font-semibold">Audit-Log</h2>
        <p className="text-xs text-muted-foreground">
          Letzte {logs.length} Änderungen an diesem Profil.
        </p>
      </div>

      {logs.length === 0 && (
        <div className="rounded-2xl border border-dashed bg-white px-5 py-10 text-center text-sm text-muted-foreground">
          Noch keine Audit-Einträge vorhanden.
        </div>
      )}

      <div className="space-y-2">
        {logs.map((log) => {
          const color = actionColor[log.action] ?? "bg-slate-100 text-slate-600";
          return (
            <div key={log.id} className="flex items-start gap-3 rounded-xl border bg-white px-4 py-3">
              <span className={`mt-0.5 shrink-0 rounded-md px-2 py-0.5 text-xs font-medium ${color}`}>
                {log.action}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm">{log.entity_type}</div>
                {log.user_id && (
                  <div className="mt-0.5 font-mono text-xs text-muted-foreground truncate">
                    User: {log.user_id}
                  </div>
                )}
              </div>
              <time className="shrink-0 text-xs text-muted-foreground">
                {new Date(log.created_at).toLocaleString("de-AT", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </time>
            </div>
          );
        })}
      </div>
    </div>
  );
}
