import { z } from "zod";

export const UuidSchema = z.string().uuid();
export const NullableString = z.string().trim().optional().nullable();
export const OptionalPhone = z
  .string()
  .trim()
  .min(6)
  .max(30)
  .regex(/^[0-9+()\/\-\s]+$/)
  .optional()
  .or(z.literal(""));

export const SlugSchema = z
  .string()
  .trim()
  .min(2)
  .max(160)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
