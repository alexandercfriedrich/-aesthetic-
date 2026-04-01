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
