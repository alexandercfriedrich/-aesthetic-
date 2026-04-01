import { z } from "zod";

export const DoctorProcedureSchema = z
  .object({
    doctorId: z.string().uuid(),
    procedureId: z.string().uuid(),
    clinicId: z.string().uuid().optional().nullable(),
    yearsOffered: z.coerce.number().int().min(0).max(70).optional(),
    descriptionShort: z.string().trim().max(500).optional().or(z.literal("")),
    isPrimaryFocus: z.boolean().default(false),
    priceFrom: z.coerce.number().min(0).max(100000).optional(),
    priceTo: z.coerce.number().min(0).max(100000).optional(),
    currency: z.string().trim().length(3).default("EUR"),
    priceNote: z.string().trim().max(250).optional().or(z.literal("")),
    consultationFee: z.coerce.number().min(0).max(5000).optional(),
  })
  .refine(
    (v) => v.priceFrom == null || v.priceTo == null || v.priceTo >= v.priceFrom,
    { message: "priceTo muss größer oder gleich priceFrom sein", path: ["priceTo"] },
  );

export type DoctorProcedureInput = z.infer<typeof DoctorProcedureSchema>;
