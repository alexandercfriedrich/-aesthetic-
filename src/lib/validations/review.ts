import { z } from "zod";

export const ReviewCreateSchema = z.object({
  doctor_id: z.string().uuid(),
  author_name: z.string().min(2, "Name ist erforderlich").max(200),
  author_email: z.string().email("Ungültige E-Mail").optional().nullable(),
  rating: z.number().int().min(1).max(5),
  text: z.string().min(20, "Bitte schreibe mindestens 20 Zeichen").max(3000).optional().nullable(),
  treatment: z.string().max(200).optional().nullable(),
});

export type ReviewCreateInput = z.infer<typeof ReviewCreateSchema>;
