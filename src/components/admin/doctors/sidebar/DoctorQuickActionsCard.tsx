import { Eye, EyeOff, CheckCircle2, XCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { AdminDoctorDetail } from "@/lib/queries/doctors";

export function DoctorQuickActionsCard({ doctor }: { doctor: AdminDoctorDetail }) {
  const isPublished = doctor.profile_status === "published";
  const isVerified = doctor.is_verified;

  return (
    <div className="rounded-2xl border bg-white p-5">
      <h2 className="mb-4 text-sm font-semibold">Quick Actions</h2>

      <div className="space-y-2">
        {/* Publish / Unpublish */}
        {isPublished ? (
          <Button variant="outline" size="sm" className="w-full justify-start gap-2">
            <EyeOff className="h-3.5 w-3.5" />
            Profil verstecken
          </Button>
        ) : (
          <Button variant="success" size="sm" className="w-full justify-start gap-2">
            <Eye className="h-3.5 w-3.5" />
            Profil veröffentlichen
          </Button>
        )}

        {/* Verify / Unverify */}
        {isVerified ? (
          <Button variant="outline" size="sm" className="w-full justify-start gap-2">
            <XCircle className="h-3.5 w-3.5" />
            Verifizierung entfernen
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="w-full justify-start gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            Als verifiziert markieren
          </Button>
        )}

        <Separator />

        {/* Danger */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Profil löschen
        </Button>
      </div>
    </div>
  );
}
