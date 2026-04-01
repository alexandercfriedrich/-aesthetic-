import { z } from "zod";

export const DoctorProcedureSchema = z.object({
  procedure_id: z.string().uuid("Ungültige Behandlungs-ID"),
  price_min: z.number().int().positive().optional().nullable(),
  price_max: z.number().int().positive().optional().nullable(),
  price_note: z.string().max(500).optional().nullable(),
  is_featured: z.boolean().default(false),
}).refine(
  (data) => {
    if (data.price_min && data.price_max) {
      return data.price_min <= data.price_max;
    }
    return true;
  },
  { message: "Mindestpreis darf nicht höher als Höchstpreis sein" }
);

export type DoctorProcedureInput = z.infer<typeof DoctorProcedureSchema>;
