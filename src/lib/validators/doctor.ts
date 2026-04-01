import { z } from "zod";
import { SlugSchema, OptionalPhone } from "./common";

export const DoctorProfileUpdateSchema = z.object({
  slug: SlugSchema,
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  titlePrefix: z.string().trim().max(80).optional().or(z.literal("")),
  titleSuffix: z.string().trim().max(120).optional().or(z.literal("")),
  publicDisplayName: z.string().trim().min(3).max(180),
  shortBio: z.string().trim().max(500).optional().or(z.literal("")),
  longBio: z.string().trim().max(6000).optional().or(z.literal("")),
  yearsExperience: z.coerce.number().int().min(0).max(70).optional(),
  languages: z.array(z.string().trim().min(2).max(40)).max(10),
  websiteUrl: z.string().url().optional().or(z.literal("")),
  emailPublic: z.string().email().optional().or(z.literal("")),
  phonePublic: OptionalPhone,
  primarySpecialtyId: z.string().uuid().optional().nullable(),
});

export type DoctorProfileUpdateInput = z.infer<typeof DoctorProfileUpdateSchema>;

export const LocationSchema = z.object({
  city: z.string().min(1, "Stadt ist erforderlich").max(100),
  postal_code: z.string().max(10).optional().nullable(),
  street: z.string().max(200).optional().nullable(),
  house_number: z.string().max(20).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  country_code: z.string().length(2).default("AT"),
  is_primary: z.boolean().default(false),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
});

export type LocationInput = z.infer<typeof LocationSchema>;

export const DoctorProcedureSchema = z
  .object({
    procedure_id: z.string().uuid(),
    price_from: z.number().positive().optional().nullable(),
    price_to: z.number().positive().optional().nullable(),
    currency: z.string().length(3).default("EUR"),
    price_note: z.string().max(500).optional().nullable(),
    description_short: z.string().max(500).optional().nullable(),
    is_primary_focus: z.boolean().default(false),
    years_offered: z.number().int().min(0).max(50).optional().nullable(),
  })
  .refine(
    (d) => {
      if (d.price_from != null && d.price_to != null) return d.price_from <= d.price_to;
      return true;
    },
    { message: "Mindestpreis darf nicht höher als Höchstpreis sein" },
  );

export type DoctorProcedureInput = z.infer<typeof DoctorProcedureSchema>;
