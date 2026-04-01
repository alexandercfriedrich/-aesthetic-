import { DoctorAdminHeader } from "./DoctorAdminHeader";
import { DoctorAdminTabs } from "./DoctorAdminTabs";
import { DoctorPublishChecklist } from "./DoctorPublishChecklist";
import { DoctorOwnershipCard } from "./sidebar/DoctorOwnershipCard";
import { DoctorSourceScoreCard } from "./sidebar/DoctorSourceScoreCard";
import { DoctorQuickActionsCard } from "./sidebar/DoctorQuickActionsCard";
import type { AdminDoctorDetail } from "@/lib/queries/doctors";

export function DoctorAdminDetail({ doctor }: { doctor: AdminDoctorDetail }) {
  const locations = (doctor.locations ?? []) as { is_primary?: boolean }[];
  const procedures = (doctor.doctor_procedures ?? []) as unknown[];

  return (
    <div className="space-y-6">
      <DoctorAdminHeader doctor={doctor} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        {/* Main content */}
        <div className="min-w-0">
          <DoctorAdminTabs doctor={doctor} />
        </div>

        {/* Right sidebar */}
        <aside className="space-y-4">
          <DoctorPublishChecklist
            hasSlug={!!doctor.slug}
            hasName={!!doctor.public_display_name}
            hasSpecialty={!!doctor.primary_specialty_id}
            hasLocation={locations.length > 0}
            hasProcedure={procedures.length > 0}
            hasNoConflicts={!doctor.has_open_conflicts}
          />
          <DoctorOwnershipCard doctor={doctor} />
          <DoctorSourceScoreCard doctor={doctor} />
          <DoctorQuickActionsCard doctor={doctor} />
        </aside>
      </div>
    </div>
  );
}
