import { z } from "zod";

export const ClaimStartSchema = z
  .object({
    doctorId: z.string().uuid().optional(),
    clinicId: z.string().uuid().optional(),
    claimantEmail: z.string().email(),
    claimantPhone: z.string().min(6).max(30).optional().or(z.literal("")),
    requestedRole: z.enum(["doctor", "staff", "agency"]).default("doctor"),
  })
  .refine((v) => !!v.doctorId || !!v.clinicId, {
    message: "doctorId oder clinicId ist erforderlich",
  });

export type ClaimStartInput = z.infer<typeof ClaimStartSchema>;
