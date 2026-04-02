import { notFound } from "next/navigation";
import { getAdminDoctorById } from "@/lib/queries/doctors";
import { DoctorAdminDetail } from "@/components/admin/doctors/DoctorAdminDetail";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminDoctorDetailPage({ params }: PageProps) {
  const { id } = await params;
  const doctor = await getAdminDoctorById(id);

  if (!doctor) notFound();

  return (
    <div className="p-6">
      <DoctorAdminDetail doctor={doctor} />
    </div>
  );
}
