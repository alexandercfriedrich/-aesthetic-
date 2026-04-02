import { z } from "zod";

export const ReviewCreateSchema = z.object({
  doctorId: z.string().uuid(),
  clinicId: z.string().uuid().optional().nullable(),
  procedureId: z.string().uuid().optional().nullable(),
  ratingOverall: z.coerce.number().int().min(1).max(5),
  ratingConsultation: z.coerce.number().int().min(1).max(5).optional(),
  ratingResult: z.coerce.number().int().min(1).max(5).optional(),
  ratingStaff: z.coerce.number().int().min(1).max(5).optional(),
  title: z.string().trim().min(3).max(120).optional().or(z.literal("")),
  body: z.string().trim().min(40).max(3000),
  visitMonth: z.coerce.number().int().min(1).max(12).optional(),
  visitYear: z.coerce
    .number()
    .int()
    .min(2000)
    .max(new Date().getFullYear())
    .optional(),
});

export type ReviewCreateInput = z.infer<typeof ReviewCreateSchema>;
