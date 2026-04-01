import { z } from "zod";

export const ClaimStartSchema = z.object({
  doctor_id: z.string().uuid("Ungültige Arzt-ID"),
  verification_method: z.enum(["domain_email", "document_upload", "phone_callback", "manual"]),
  claimant_email: z.string().email("Ungültige E-Mail-Adresse"),
  claimant_phone: z.string().max(50).optional().nullable(),
  claimant_role: z.enum(["doctor", "practice_manager", "clinic_admin"]).optional(),
  notes: z.string().max(1000).optional().nullable(),
});

export type ClaimStartInput = z.infer<typeof ClaimStartSchema>;
