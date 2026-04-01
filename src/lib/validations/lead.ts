import { z } from "zod";

export const LeadSubmitSchema = z.object({
  doctor_id: z.string().uuid(),
  name: z.string().min(2, "Name ist erforderlich").max(200),
  email: z.string().email("Bitte gib eine gültige E-Mail-Adresse ein"),
  phone: z.string().max(50).optional().nullable(),
  procedure_id: z.string().uuid().optional().nullable(),
  message: z.string().max(2000).optional().nullable(),
  preferred_contact: z.enum(["email", "phone", "either"]).default("email"),
  consent_data_processing: z.literal(true, {
    errorMap: () => ({ message: "Datenschutzzustimmung ist erforderlich" }),
  }),
  consent_forwarding: z.literal(true, {
    errorMap: () => ({ message: "Zustimmung zur Weiterleitung ist erforderlich" }),
  }),
  // Honeypot field - must be empty
  website: z.string().max(0).optional(),
  // UTM tracking
  utm_source: z.string().optional().nullable(),
  utm_medium: z.string().optional().nullable(),
  utm_campaign: z.string().optional().nullable(),
  gclid: z.string().optional().nullable(),
});

export type LeadSubmitInput = z.infer<typeof LeadSubmitSchema>;
