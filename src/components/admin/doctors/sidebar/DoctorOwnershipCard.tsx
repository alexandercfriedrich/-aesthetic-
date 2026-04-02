import { User, Mail, Phone, Calendar, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { AdminDoctorDetail } from "@/lib/queries/doctors";

export function DoctorOwnershipCard({ doctor }: { doctor: AdminDoctorDetail }) {
  return (
    <div className="rounded-2xl border bg-white p-5">
      <h2 className="mb-4 text-sm font-semibold">Ownership</h2>

      <div className="space-y-3">
        {doctor.is_claimed && doctor.owner_user_id ? (
          <>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
                <User className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Geclaimed von</div>
                <div className="font-mono text-xs font-medium">{doctor.owner_user_id.slice(0, 16)}…</div>
              </div>
            </div>

            <Separator />

            {doctor.email_public && (
              <div className="flex items-center gap-2 text-xs">
                <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate">{doctor.email_public}</span>
              </div>
            )}
            {doctor.phone_public && (
              <div className="flex items-center gap-2 text-xs">
                <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span>{doctor.phone_public}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-xs">
              <Calendar className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span>
                Profil seit{" "}
                {new Date(doctor.created_at).toLocaleDateString("de-AT", {
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 py-3 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
              <Shield className="h-5 w-5 text-slate-400" />
            </div>
            <div className="text-sm text-muted-foreground">Noch nicht geclaimed</div>
            <Badge variant="muted">Unclaimed</Badge>
          </div>
        )}
      </div>
    </div>
  );
}
