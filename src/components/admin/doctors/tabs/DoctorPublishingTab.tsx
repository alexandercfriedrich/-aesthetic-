import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AdminDoctorDetail } from "@/lib/queries/doctors";

type ProfileClaim = {
  id: string;
  status: string;
  claimant_email: string;
  claimant_phone?: string | null;
  requested_role: string;
  created_at: string;
};

const statusConfig: Record<string, { label: string; variant: "success" | "warning" | "muted" | "destructive" | "info" }> = {
  approved: { label: "Genehmigt", variant: "success" },
  initiated: { label: "Initiiert", variant: "info" },
  email_sent: { label: "E-Mail gesendet", variant: "info" },
  otp_verified: { label: "OTP verifiziert", variant: "warning" },
  document_pending: { label: "Dokument ausstehend", variant: "warning" },
  manual_review: { label: "Manuelle Prüfung", variant: "warning" },
  rejected: { label: "Abgelehnt", variant: "destructive" },
};

export function DoctorPublishingTab({ doctor }: { doctor: AdminDoctorDetail }) {
  const claims = (doctor.profile_claims ?? []) as ProfileClaim[];
  const isPublished = doctor.profile_status === "published";

  return (
    <div className="space-y-4">
      {/* Status Banner */}
      <div
        className={cn(
          "flex items-center gap-3 rounded-2xl border p-5",
          isPublished ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50",
        )}
      >
        {isPublished ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
        ) : (
          <AlertTriangle className="h-5 w-5 text-amber-600" />
        )}
        <div>
          <div className={cn("font-semibold text-sm", isPublished ? "text-emerald-700" : "text-amber-700")}>
            {isPublished ? "Profil ist öffentlich sichtbar" : "Profil ist nicht veröffentlicht"}
          </div>
          <div className="text-xs text-muted-foreground">
            Status: <strong>{doctor.profile_status}</strong> · Verification:{" "}
            <strong>{doctor.verification_level}</strong>
          </div>
        </div>
      </div>

      {/* Claims */}
      <div className="rounded-2xl border bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold">Claiming-History</h2>
        {claims.length === 0 ? (
          <p className="text-sm text-muted-foreground">Noch keine Claims vorhanden.</p>
        ) : (
          <div className="space-y-3">
            {claims.map((claim) => {
              const cfg = statusConfig[claim.status] ?? statusConfig.initiated;
              return (
                <div key={claim.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3">
                  <div>
                    <div className="text-sm font-medium">{claim.claimant_email}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      Rolle: {claim.requested_role} ·{" "}
                      {new Date(claim.created_at).toLocaleDateString("de-AT")}
                    </div>
                  </div>
                  <Badge variant={cfg.variant}>{cfg.label}</Badge>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="rounded-2xl border bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold">Publishing-Aktionen</h2>
        <div className="flex flex-wrap gap-3">
          {!isPublished && (
            <Button variant="success" size="sm">Profil veröffentlichen</Button>
          )}
          {isPublished && (
            <Button variant="outline" size="sm">Profil verstecken</Button>
          )}
          <Button variant="outline" size="sm">Verification setzen</Button>
          <Button variant="destructive" size="sm">Profil sperren</Button>
        </div>
      </div>
    </div>
  );
}
