import type { AdminDoctorDetail } from "@/lib/queries/doctors";

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm text-foreground">{value || "—"}</dd>
    </div>
  );
}

function FieldBlock({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <div className="mb-1.5 text-xs font-medium text-muted-foreground">{label}</div>
      <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-foreground whitespace-pre-wrap">
        {value || "—"}
      </div>
    </div>
  );
}

export function DoctorOverviewTab({ doctor }: { doctor: AdminDoctorDetail }) {
  const specialty = (doctor.specialties as { name_de?: string } | null)?.name_de;

  return (
    <div className="space-y-4">
      {/* Stammdaten */}
      <section className="rounded-2xl border bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-foreground">Stammdaten</h2>
        <dl className="grid gap-4 sm:grid-cols-2">
          <Field label="Anzeigename" value={doctor.public_display_name} />
          <Field label="Slug" value={doctor.slug} />
          <Field label="Titel (Prefix)" value={doctor.title_prefix} />
          <Field label="Titel (Suffix)" value={doctor.title_suffix} />
          <Field label="Fachrichtung" value={specialty} />
          <Field label="Berufserfahrung" value={doctor.years_experience != null ? `${doctor.years_experience} Jahre` : null} />
          <Field label="Website" value={doctor.website_url} />
          <Field label="Telefon (öffentlich)" value={doctor.phone_public} />
          <Field label="E-Mail (öffentlich)" value={doctor.email_public} />
          <Field label="Sprachen" value={doctor.languages?.join(", ")} />
        </dl>
      </section>

      {/* Texte */}
      <section className="rounded-2xl border bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-foreground">Texte</h2>
        <div className="space-y-4">
          <FieldBlock label="Kurzbio" value={doctor.short_bio} />
          <FieldBlock label="Langbio" value={doctor.long_bio} />
        </div>
      </section>

      {/* Source */}
      <section className="rounded-2xl border bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-foreground">Datenquelle</h2>
        <dl className="grid gap-4 sm:grid-cols-2">
          <Field label="Typ" value={doctor.source_type} />
          <Field label="URL" value={doctor.source_url} />
          <Field label="Confidence Score" value={doctor.source_confidence != null ? `${(Number(doctor.source_confidence) * 100).toFixed(0)} %` : null} />
          <Field label="Zuletzt verifiziert" value={doctor.last_verified_at ? new Date(doctor.last_verified_at).toLocaleDateString("de-AT") : null} />
        </dl>
      </section>
    </div>
  );
}
