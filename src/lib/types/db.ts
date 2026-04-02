/**
 * DB-Row-Typen – direkte Abbild der Supabase-Tabellen (snake_case).
 * Diese Typen sollten NIEMALS direkt in UI-Komponenten verwendet werden.
 * Stattdessen über Mapper in View-Models konvertieren.
 */

export type DoctorProfileRow = {
  id: string;
  owner_user_id: string | null;
  slug: string;
  first_name: string;
  last_name: string;
  title_prefix: string | null;
  title_suffix: string | null;
  public_display_name: string;
  gender: string | null;
  primary_specialty_id: string | null;
  short_bio: string | null;
  long_bio: string | null;
  years_experience: number | null;
  languages: string[];
  website_url: string | null;
  email_public: string | null;
  phone_public: string | null;
  is_claimed: boolean;
  is_verified: boolean;
  verification_level: string;
  is_premium: boolean;
  profile_status: string;
  source_confidence: number;
  source_type: string | null;
  source_url: string | null;
  last_verified_at: string | null;
  created_at: string;
  updated_at: string;
};

export type SpecialtyRow = {
  id: string;
  slug: string;
  name_de: string;
  description: string | null;
  sort_order: number;
};

export type ProcedureRow = {
  id: string;
  slug: string;
  name_de: string;
  synonyms: string[];
  category_id: string | null;
  procedure_type: string;
  body_area: string | null;
  intro_md: string | null;
  risks_md: string | null;
  recovery_md: string | null;
  faq_md: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type LocationRow = {
  id: string;
  doctor_id: string | null;
  clinic_id: string | null;
  country_code: string;
  state: string | null;
  city: string;
  district: string | null;
  postal_code: string | null;
  street: string | null;
  house_number: string | null;
  latitude: number | null;
  longitude: number | null;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
};

export type DoctorProcedureRow = {
  id: string;
  doctor_id: string;
  procedure_id: string;
  clinic_id: string | null;
  years_offered: number | null;
  description_short: string | null;
  is_primary_focus: boolean;
  price_from: number | null;
  price_to: number | null;
  currency: string;
  price_note: string | null;
  consultation_fee: number | null;
  is_price_verified: boolean;
  last_price_check_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ReviewRow = {
  id: string;
  doctor_id: string;
  clinic_id: string | null;
  user_id: string | null;
  procedure_id: string | null;
  rating_overall: number;
  rating_consultation: number | null;
  rating_result: number | null;
  rating_staff: number | null;
  title: string | null;
  body: string | null;
  visit_month: number | null;
  visit_year: number | null;
  verification_status: string;
  moderation_status: string;
  created_at: string;
  updated_at: string;
};

export type MediaAssetRow = {
  id: string;
  doctor_id: string | null;
  clinic_id: string | null;
  uploaded_by: string | null;
  bucket_id: string;
  object_path: string;
  mime_type: string | null;
  width: number | null;
  height: number | null;
  alt_text: string | null;
  visibility: string;
  media_kind: string;
  sort_order: number;
  approved_at: string | null;
  created_at: string;
};

export type ProfileClaimRow = {
  id: string;
  doctor_id: string | null;
  clinic_id: string | null;
  claimant_user_id: string;
  claimant_email: string;
  claimant_phone: string | null;
  requested_role: string;
  status: string;
  proof_type: string | null;
  proof_value: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type LeadRequestRow = {
  id: string;
  doctor_id: string | null;
  clinic_id: string | null;
  procedure_id: string | null;
  source_page_url: string | null;
  source_page_type: string | null;
  patient_name: string;
  patient_email: string;
  patient_phone: string | null;
  preferred_contact: string | null;
  preferred_time: string | null;
  message: string;
  consent_privacy: boolean;
  consent_data_forwarding: boolean;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  gclid: string | null;
  is_qualified: boolean | null;
  spam_score: number | null;
  status: string;
  created_at: string;
};

/** RPC-Ergebnis von search_doctors() */
export type SearchDoctorRow = {
  doctor_id: string;
  slug: string;
  public_display_name: string;
  city: string | null;
  specialty: string | null;
  is_verified: boolean;
  is_premium: boolean;
  rank: number;
};

/** Joined doctor profile (aus getDoctorBySlug) */
export type DoctorProfileJoined = DoctorProfileRow & {
  specialties: Pick<SpecialtyRow, "id" | "slug" | "name_de"> | null;
  doctor_procedures: Array<
    DoctorProcedureRow & {
      procedures: Pick<ProcedureRow, "id" | "slug" | "name_de"> | null;
    }
  >;
  locations: LocationRow[];
  reviews: ReviewRow[];
  media_assets: MediaAssetRow[];
};

/** Admin-Detail (zusätzlich claims, sources, audit) */
export type DoctorAdminJoined = DoctorProfileJoined & {
  profile_claims: Array<
    Pick<
      ProfileClaimRow,
      "id" | "status" | "claimant_email" | "claimant_phone" | "requested_role" | "created_at"
    >
  >;
  source_records: unknown[];
  audit_logs: unknown[];
  has_open_conflicts: boolean;
};
