import { z } from "zod";

export const LocationSchema = z.object({
  name: z.string().max(200).optional().nullable(),
  address_street: z.string().max(200).optional().nullable(),
  address_city: z.string().min(1, "Stadt ist erforderlich").max(100),
  address_zip: z.string().max(10).optional().nullable(),
  address_state: z.string().max(100).optional().nullable(),
  address_country: z.string().default("AT"),
  lat: z.number().optional().nullable(),
  lng: z.number().optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  is_primary: z.boolean().default(false),
});

export type LocationInput = z.infer<typeof LocationSchema>;
