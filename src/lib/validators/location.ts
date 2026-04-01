import { z } from "zod";

export const LocationSchema = z.object({
  city: z.string().trim().min(2).max(120),
  state: z.string().trim().max(120).optional().or(z.literal("")),
  district: z.string().trim().max(120).optional().or(z.literal("")),
  postalCode: z.string().trim().max(12).optional().or(z.literal("")),
  street: z.string().trim().max(160).optional().or(z.literal("")),
  houseNumber: z.string().trim().max(30).optional().or(z.literal("")),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  isPrimary: z.boolean().default(false),
});

export type LocationInput = z.infer<typeof LocationSchema>;
