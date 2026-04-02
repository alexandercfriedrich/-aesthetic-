import { z } from "zod";

export const LeadSchema = z.object({
  doctorId: z.string().uuid(),
  clinicId: z.string().uuid().optional().nullable(),
  procedureId: z.string().uuid().optional().nullable(),
  patientName: z.string().min(2).max(120),
  patientEmail: z.string().email(),
  patientPhone: z.string().min(6).max(30).optional().or(z.literal("")),
  preferredContact: z.enum(["email", "phone", "whatsapp"]).optional(),
  preferredTime: z.string().max(120).optional(),
  message: z.string().min(20).max(3000),
  consentPrivacy: z.literal(true),
  consentDataForwarding: z.literal(true),
  sourcePageUrl: z.string().url(),
  sourcePageType: z.string().min(2).max(50),
});

export type LeadInput = z.infer<typeof LeadSchema>;
