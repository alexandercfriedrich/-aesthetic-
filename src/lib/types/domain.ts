export type UserRole = "admin" | "editor" | "doctor" | "staff" | "user";
export type ProfileStatus = "draft" | "published" | "hidden" | "suspended";
export type VerificationLevel = "none" | "basic" | "document" | "editorial";
export type ClaimStatus =
  | "initiated"
  | "email_sent"
  | "otp_verified"
  | "document_pending"
  | "manual_review"
  | "approved"
  | "rejected";
export type LeadStatus = "new" | "sent" | "viewed" | "contacted" | "won" | "lost" | "spam";
export type ReviewVerificationStatus = "unverified" | "email" | "document" | "editorial";
export type ReviewModerationStatus = "pending" | "published" | "rejected" | "flagged";
export type MediaVisibility = "public" | "private" | "premium" | "internal";
export type MediaKind = "portrait" | "clinic" | "certificate" | "logo" | "gallery" | "other";
export type ProcedureType = "operation" | "behandlung";

export interface Specialty {
  id: string;
  slug: string;
  name_de: string;
  description?: string | null;
  sort_order: number;
}

export interface ProcedureCategory {
  id: string;
  slug: string;
  name_de: string;
  sort_order: number;
}

export interface Procedure {
  id: string;
  slug: string;
  name_de: string;
  synonyms: string[];
  category_id?: string | null;
  procedure_type: ProcedureType;
  body_area?: string | null;
  intro_md?: string | null;
  risks_md?: string | null;
  recovery_md?: string | null;
  faq_md?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Location {
  id: string;
  doctor_id?: string | null;
  clinic_id?: string | null;
  country_code: string;
  state?: string | null;
  city: string;
  district?: string | null;
  postal_code?: string | null;
  street?: string | null;
  house_number?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  is_primary: boolean;
}

export interface DoctorProfile {
  id: string;
  owner_user_id?: string | null;
  slug: string;
  first_name: string;
  last_name: string;
  title_prefix?: string | null;
  title_suffix?: string | null;
  public_display_name: string;
  gender?: string | null;
  primary_specialty_id?: string | null;
  short_bio?: string | null;
  long_bio?: string | null;
  years_experience?: number | null;
  languages: string[];
  website_url?: string | null;
  email_public?: string | null;
  phone_public?: string | null;
  is_claimed: boolean;
  is_verified: boolean;
  verification_level: VerificationLevel;
  is_premium: boolean;
  profile_status: ProfileStatus;
  source_confidence: number;
  source_type?: string | null;
  source_url?: string | null;
  last_verified_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DoctorProcedure {
  id: string;
  doctor_id: string;
  procedure_id: string;
  clinic_id?: string | null;
  years_offered?: number | null;
  description_short?: string | null;
  is_primary_focus: boolean;
  price_from?: number | null;
  price_to?: number | null;
  currency: string;
  price_note?: string | null;
  consultation_fee?: number | null;
  is_price_verified: boolean;
  last_price_check_at?: string | null;
  is_active: boolean;
}

export interface Review {
  id: string;
  doctor_id: string;
  clinic_id?: string | null;
  user_id?: string | null;
  procedure_id?: string | null;
  rating_overall: number;
  rating_consultation?: number | null;
  rating_result?: number | null;
  rating_staff?: number | null;
  title?: string | null;
  body?: string | null;
  visit_month?: number | null;
  visit_year?: number | null;
  verification_status: ReviewVerificationStatus;
  moderation_status: ReviewModerationStatus;
  created_at: string;
  updated_at: string;
}

export interface MediaAsset {
  id: string;
  doctor_id?: string | null;
  clinic_id?: string | null;
  uploaded_by?: string | null;
  bucket_id: string;
  object_path: string;
  mime_type?: string | null;
  width?: number | null;
  height?: number | null;
  alt_text?: string | null;
  visibility: MediaVisibility;
  media_kind: MediaKind;
  sort_order: number;
  approved_at?: string | null;
  created_at: string;
}

export interface ProfileClaim {
  id: string;
  doctor_id?: string | null;
  clinic_id?: string | null;
  claimant_user_id: string;
  claimant_email: string;
  claimant_phone?: string | null;
  requested_role: string;
  status: ClaimStatus;
  proof_type?: string | null;
  proof_value?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeadRequest {
  id: string;
  doctor_id?: string | null;
  clinic_id?: string | null;
  procedure_id?: string | null;
  patient_name: string;
  patient_email: string;
  patient_phone?: string | null;
  preferred_contact?: string | null;
  preferred_time?: string | null;
  message: string;
  consent_privacy: boolean;
  consent_data_forwarding: boolean;
  status: LeadStatus;
  spam_score?: number | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  gclid?: string | null;
  created_at: string;
}
