import { z } from "zod";

export const DoctorProfileUpdateSchema = z.object({
  title: z.string().max(50).optional().nullable(),
  first_name: z.string().min(1, "Vorname ist erforderlich").max(100),
  last_name: z.string().min(1, "Nachname ist erforderlich").max(100),
  gender: z.enum(["male", "female", "diverse"]).optional().nullable(),
  bio_short: z.string().max(500).optional().nullable(),
  bio_long: z.string().max(5000).optional().nullable(),
  website_url: z.string().url("Ungültige URL").optional().nullable().or(z.literal("")),
  phone: z.string().max(50).optional().nullable(),
  email: z.string().email("Ungültige E-Mail").optional().nullable(),
  languages: z.array(z.string()).default([]),
  specialty_id: z.string().uuid().optional().nullable(),
});

export type DoctorProfileUpdateInput = z.infer<typeof DoctorProfileUpdateSchema>;
