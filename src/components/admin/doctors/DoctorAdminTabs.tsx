"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DoctorOverviewTab } from "./tabs/DoctorOverviewTab";
import { DoctorLocationsTab } from "./tabs/DoctorLocationsTab";
import { DoctorProceduresTab } from "./tabs/DoctorProceduresTab";
import { DoctorMediaTab } from "./tabs/DoctorMediaTab";
import { DoctorReviewsTab } from "./tabs/DoctorReviewsTab";
import { DoctorSourcesTab } from "./tabs/DoctorSourcesTab";
import { DoctorPublishingTab } from "./tabs/DoctorPublishingTab";
import { DoctorAuditTab } from "./tabs/DoctorAuditTab";
import type { AdminDoctorDetail } from "@/lib/queries/admin-doctors";

export function DoctorAdminTabs({ doctor }: { doctor: AdminDoctorDetail }) {
  return (
    <Tabs defaultValue="overview">
      <TabsList className="h-auto w-full justify-start gap-0.5 rounded-2xl bg-slate-100 p-1">
        {[
          ["overview", "Overview"],
          ["locations", "Standorte"],
          ["procedures", "Behandlungen"],
          ["media", "Medien"],
          ["reviews", "Reviews"],
          ["sources", "Quellen"],
          ["publishing", "Publishing"],
          ["audit", "Audit"],
        ].map(([value, label]) => (
          <TabsTrigger
            key={value}
            value={value}
            className="rounded-xl px-3 py-1.5 text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            {label}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="overview" className="mt-4">
        <DoctorOverviewTab doctor={doctor} />
      </TabsContent>
      <TabsContent value="locations" className="mt-4">
        <DoctorLocationsTab doctor={doctor} />
      </TabsContent>
      <TabsContent value="procedures" className="mt-4">
        <DoctorProceduresTab doctor={doctor} />
      </TabsContent>
      <TabsContent value="media" className="mt-4">
        <DoctorMediaTab doctor={doctor} />
      </TabsContent>
      <TabsContent value="reviews" className="mt-4">
        <DoctorReviewsTab doctor={doctor} />
      </TabsContent>
      <TabsContent value="sources" className="mt-4">
        <DoctorSourcesTab doctor={doctor} />
      </TabsContent>
      <TabsContent value="publishing" className="mt-4">
        <DoctorPublishingTab doctor={doctor} />
      </TabsContent>
      <TabsContent value="audit" className="mt-4">
        <DoctorAuditTab doctor={doctor} />
      </TabsContent>
    </Tabs>
  );
}
