/**
 * Mapper-Funktionen: DB-Rows → View-Models
 *
 * Regeln:
 * - Keine DB-Row-Typen dürfen in UI-Komponenten durchgereicht werden
 * - Mapper sind pure Funktionen ohne Side-Effects
 * - Fehlende / null-Werte werden hier normalisiert, nicht in den Komponenten
 */

import type {
  SearchDoctorRow,
  DoctorProfileJoined,
  LocationRow,
  DoctorProcedureRow,
  ProcedureRow,
  ReviewRow,
  MediaAssetRow,
} from "./db";
import type { DoctorCardVM, DoctorProfileVM } from "./view-models";
import { SUPABASE_STORAGE_URL } from "@/lib/supabase/storage-url";

// ---------------------------------------------------------------------------
// Search result → DoctorCardVM (schlankes Karten-Modell für Suchergebnisse)
// ---------------------------------------------------------------------------
export function toSearchCardVM(row: SearchDoctorRow): DoctorCardVM {
  return {
    id: row.doctor_id,
    slug: row.slug,
    name: row.public_display_name,
    specialty: row.specialty ?? null,
    city: row.city ?? null,
    district: null,
    isVerified: row.is_verified,
    isPremium: row.is_premium,
    profileImageUrl: null, // kein join hier, erst auf Profilseite laden
    procedureBadges: [],
    priceHighlights: [],
    ratingAvg: null,
    reviewCount: 0,
  };
}

// ---------------------------------------------------------------------------
// Full doctor profile join → DoctorProfileVM (Profilseite)
// ---------------------------------------------------------------------------
export function toDoctorProfileVM(row: DoctorProfileJoined): DoctorProfileVM {
  const specialty = row.specialties?.name_de ?? null;

  const locations = row.locations ?? [];
  const procedures = row.doctor_procedures ?? [];
  const reviews = (row.reviews ?? []).filter(
    (r: ReviewRow) => r.moderation_status === "published",
  );
  const mediaAssets = row.media_assets ?? [];

  const procedureVMs = (
    procedures as Array<DoctorProcedureRow & { procedures: Pick<ProcedureRow, "id" | "slug" | "name_de"> | null }>
  )
    .filter((p) => p.is_active)
    .map((p) => ({
      id: p.id,
      slug: p.procedures?.slug ?? p.procedure_id,
      name: p.procedures?.name_de ?? "Behandlung",
      descriptionShort: p.description_short ?? null,
      priceFrom: p.price_from ?? null,
      priceTo: p.price_to ?? null,
      currency: p.currency,
      isPriceVerified: p.is_price_verified,
    }));

  const reviewVMs = (reviews as ReviewRow[]).map((r) => ({
    id: r.id,
    title: r.title ?? null,
    body: r.body ?? null,
    ratingOverall: r.rating_overall,
    verificationStatus: r.verification_status as DoctorProfileVM["reviews"][number]["verificationStatus"],
    createdAt: r.created_at,
  }));

  const mediaVMs = (mediaAssets as MediaAssetRow[])
    .filter((m) => m.visibility === "public" && m.approved_at)
    .map((m) => ({
      id: m.id,
      url: `${SUPABASE_STORAGE_URL}/${m.bucket_id}/${m.object_path}`,
      kind: m.media_kind as DoctorProfileVM["media"][number]["kind"],
      alt: m.alt_text ?? null,
    }));

  return {
    id: row.id,
    slug: row.slug,
    name: row.public_display_name,
    specialty: specialty,
    bioShort: row.short_bio ?? null,
    bioLong: row.long_bio ?? null,
    yearsExperience: row.years_experience ?? null,
    languages: row.languages ?? [],
    websiteUrl: row.website_url ?? null,
    emailPublic: row.email_public ?? null,
    phonePublic: row.phone_public ?? null,
    isClaimed: row.is_claimed,
    isVerified: row.is_verified,
    verificationLevel: row.verification_level as DoctorProfileVM["verificationLevel"],
    isPremium: row.is_premium,
    locations: (locations as LocationRow[]).map((l) => ({
      id: l.id,
      doctor_id: l.doctor_id,
      clinic_id: l.clinic_id,
      country_code: l.country_code,
      state: l.state,
      city: l.city,
      district: l.district,
      postal_code: l.postal_code,
      street: l.street,
      house_number: l.house_number,
      latitude: l.latitude,
      longitude: l.longitude,
      is_primary: l.is_primary,
    })),
    procedures: procedureVMs,
    reviews: reviewVMs,
    media: mediaVMs,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
export function formatPriceRange(
  from: number | null | undefined,
  to: number | null | undefined,
  currency = "EUR",
): string {
  const fmt = (n: number) =>
    n.toLocaleString("de-AT", { style: "currency", currency, maximumFractionDigits: 0 });

  if (from != null && to != null) return `${fmt(from)} – ${fmt(to)}`;
  if (from != null) return `ab ${fmt(from)}`;
  if (to != null) return `bis ${fmt(to)}`;
  return "Auf Anfrage";
}

export function calcAvgRating(reviews: Array<{ ratingOverall: number }>): number | null {
  if (reviews.length === 0) return null;
  return reviews.reduce((s, r) => s + r.ratingOverall, 0) / reviews.length;
}
