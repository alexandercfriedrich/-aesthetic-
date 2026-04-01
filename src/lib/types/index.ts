/**
 * Zentrale Re-Exports aller Typen.
 *
 * Import-Konventionen:
 *   DB-Rows:      import type { DoctorProfileRow } from "@/lib/types"
 *   View Models:  import type { DoctorCardVM }     from "@/lib/types"
 *   Domain:       import type { ProfileStatus }    from "@/lib/types"
 *   Mapper:       import { toDoctorProfileVM }     from "@/lib/types/mappers"
 *   Forms:        import { DoctorProfileUpdateSchema } from "@/lib/validators/doctor"
 */

export type * from "./db";
export type * from "./domain";
export type * from "./view-models";
