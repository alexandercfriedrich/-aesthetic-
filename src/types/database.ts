// AUTO-GENERATED: matches supabase/migrations/001-008
// Re-generate with: npx supabase gen types typescript --local

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "admin" | "editor" | "doctor" | "staff" | "user";
export type ProfileStatus = "draft" | "published" | "hidden" | "suspended";
export type VerificationLevel = "none" | "basic" | "document" | "editorial";
export type ClaimStatus =
  | "initiated" | "email_sent" | "otp_verified" | "document_pending"
  | "manual_review" | "approved" | "rejected";
export type LeadStatus =
  | "new" | "sent" | "viewed" | "contacted" | "won" | "lost" | "spam";
export type ReviewVerificationStatus = "unverified" | "email" | "document" | "editorial";
export type ReviewModerationStatus = "pending" | "published" | "rejected" | "flagged";
export type MediaVisibility = "public" | "private" | "premium" | "internal";
export type MediaKind = "portrait" | "clinic" | "certificate" | "logo" | "gallery" | "other";
export type ProcedureType = "operation" | "behandlung";
export type ImportBatchStatus = "created" | "running" | "needs_review" | "completed" | "failed";
export type ImportCandidateStatus = "new" | "matched" | "needs_review" | "approved" | "rejected" | "merged";
export type MergeDecision = "create_new" | "merge_into_existing" | "ignore";
export type ClaimVerificationMethod = "email_domain" | "document_upload" | "phone_callback" | "manual";

export interface Database {
  __InternalSupabase: {
    PostgrestVersion: "12";
  };
  public: {
    Tables: {
      app_users: {
        Row: { id: string; role: UserRole; full_name: string | null; phone: string | null; created_at: string; updated_at: string; };
        Insert: { id: string; role?: UserRole; full_name?: string | null; phone?: string | null; created_at?: string; updated_at?: string; };
        Update: { role?: UserRole; full_name?: string | null; phone?: string | null; updated_at?: string; };
        Relationships: [];
      };
      specialties: {
        Row: { id: string; slug: string; name_de: string; description: string | null; sort_order: number; created_at: string; };
        Insert: { id?: string; slug: string; name_de: string; description?: string | null; sort_order?: number; created_at?: string; };
        Update: { slug?: string; name_de?: string; description?: string | null; sort_order?: number; };
        Relationships: [];
      };
      procedure_categories: {
        Row: { id: string; slug: string; name_de: string; sort_order: number; created_at: string; };
        Insert: { id?: string; slug: string; name_de: string; sort_order?: number; created_at?: string; };
        Update: { slug?: string; name_de?: string; sort_order?: number; };
        Relationships: [];
      };
      procedures: {
        Row: {
          id: string; slug: string; name_de: string; synonyms: string[];
          category_id: string | null; procedure_type: ProcedureType; body_area: string | null;
          intro_md: string | null; risks_md: string | null; recovery_md: string | null; faq_md: string | null;
          is_active: boolean; search_text: string | null; fts: unknown | null;
          created_at: string; updated_at: string;
        };
        Insert: {
          id?: string; slug: string; name_de: string; synonyms?: string[];
          category_id?: string | null; procedure_type: ProcedureType; body_area?: string | null;
          intro_md?: string | null; risks_md?: string | null; recovery_md?: string | null; faq_md?: string | null;
          is_active?: boolean; created_at?: string; updated_at?: string;
        };
        Update: {
          slug?: string; name_de?: string; synonyms?: string[];
          category_id?: string | null; procedure_type?: ProcedureType; body_area?: string | null;
          intro_md?: string | null; risks_md?: string | null; recovery_md?: string | null; faq_md?: string | null;
          is_active?: boolean; updated_at?: string;
        };
        Relationships: [];
      };
      clinic_profiles: {
        Row: {
          id: string; owner_user_id: string | null; slug: string; name: string; clinic_type: string;
          about: string | null; website_url: string | null; phone: string | null; email: string | null;
          is_claimed: boolean; is_verified: boolean; verification_level: VerificationLevel;
          is_premium: boolean; profile_status: ProfileStatus; created_at: string; updated_at: string;
        };
        Insert: {
          id?: string; owner_user_id?: string | null; slug: string; name: string; clinic_type?: string;
          about?: string | null; website_url?: string | null; phone?: string | null; email?: string | null;
          is_claimed?: boolean; is_verified?: boolean; verification_level?: VerificationLevel;
          is_premium?: boolean; profile_status?: ProfileStatus; created_at?: string; updated_at?: string;
        };
        Update: {
          owner_user_id?: string | null; slug?: string; name?: string; clinic_type?: string;
          about?: string | null; website_url?: string | null; phone?: string | null; email?: string | null;
          is_claimed?: boolean; is_verified?: boolean; verification_level?: VerificationLevel;
          is_premium?: boolean; profile_status?: ProfileStatus; updated_at?: string;
        };
        Relationships: [];
      };
      doctor_profiles: {
        Row: {
          id: string; owner_user_id: string | null; slug: string;
          first_name: string; last_name: string; title_prefix: string | null; title_suffix: string | null;
          public_display_name: string; gender: string | null; primary_specialty_id: string | null;
          short_bio: string | null; long_bio: string | null; years_experience: number | null;
          languages: string[]; website_url: string | null; email_public: string | null; phone_public: string | null;
          is_claimed: boolean; is_verified: boolean; verification_level: VerificationLevel;
          is_premium: boolean; profile_status: ProfileStatus; source_confidence: number;
          source_type: string | null; source_url: string | null; last_verified_at: string | null;
          search_text: string | null; fts: unknown | null; created_at: string; updated_at: string;
        };
        Insert: {
          id?: string; owner_user_id?: string | null; slug: string;
          first_name: string; last_name: string; title_prefix?: string | null; title_suffix?: string | null;
          public_display_name: string; gender?: string | null; primary_specialty_id?: string | null;
          short_bio?: string | null; long_bio?: string | null; years_experience?: number | null;
          languages?: string[]; website_url?: string | null; email_public?: string | null; phone_public?: string | null;
          is_claimed?: boolean; is_verified?: boolean; verification_level?: VerificationLevel;
          is_premium?: boolean; profile_status?: ProfileStatus; source_confidence?: number;
          source_type?: string | null; source_url?: string | null; last_verified_at?: string | null;
          created_at?: string; updated_at?: string;
        };
        Update: {
          owner_user_id?: string | null; slug?: string;
          first_name?: string; last_name?: string; title_prefix?: string | null; title_suffix?: string | null;
          public_display_name?: string; gender?: string | null; primary_specialty_id?: string | null;
          short_bio?: string | null; long_bio?: string | null; years_experience?: number | null;
          languages?: string[]; website_url?: string | null; email_public?: string | null; phone_public?: string | null;
          is_claimed?: boolean; is_verified?: boolean; verification_level?: VerificationLevel;
          is_premium?: boolean; profile_status?: ProfileStatus; source_confidence?: number;
          source_type?: string | null; source_url?: string | null; last_verified_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "doctor_profiles_owner_user_id_fkey";
            columns: ["owner_user_id"];
            referencedRelation: "app_users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "doctor_profiles_primary_specialty_id_fkey";
            columns: ["primary_specialty_id"];
            referencedRelation: "specialties";
            referencedColumns: ["id"];
          }
        ];
      };
      doctor_clinic_links: {
        Row: { id: string; doctor_id: string; clinic_id: string; role_label: string | null; is_primary: boolean; created_at: string; };
        Insert: { id?: string; doctor_id: string; clinic_id: string; role_label?: string | null; is_primary?: boolean; created_at?: string; };
        Update: { role_label?: string | null; is_primary?: boolean; };
        Relationships: [];
      };
      locations: {
        Row: {
          id: string; doctor_id: string | null; clinic_id: string | null; country_code: string;
          state: string | null; city: string; district: string | null; postal_code: string | null;
          street: string | null; house_number: string | null; latitude: number | null; longitude: number | null;
          is_primary: boolean; created_at: string; updated_at: string;
        };
        Insert: {
          id?: string; doctor_id?: string | null; clinic_id?: string | null; country_code?: string;
          state?: string | null; city: string; district?: string | null; postal_code?: string | null;
          street?: string | null; house_number?: string | null; latitude?: number | null; longitude?: number | null;
          is_primary?: boolean; created_at?: string; updated_at?: string;
        };
        Update: {
          doctor_id?: string | null; clinic_id?: string | null; country_code?: string;
          state?: string | null; city?: string; district?: string | null; postal_code?: string | null;
          street?: string | null; house_number?: string | null; latitude?: number | null; longitude?: number | null;
          is_primary?: boolean; updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "locations_doctor_id_fkey";
            columns: ["doctor_id"];
            referencedRelation: "doctor_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "locations_clinic_id_fkey";
            columns: ["clinic_id"];
            referencedRelation: "clinic_profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      doctor_procedures: {
        Row: {
          id: string; doctor_id: string; procedure_id: string; clinic_id: string | null;
          years_offered: number | null; description_short: string | null; is_primary_focus: boolean;
          price_from: number | null; price_to: number | null; currency: string;
          price_note: string | null; consultation_fee: number | null; is_price_verified: boolean;
          last_price_check_at: string | null; is_active: boolean; created_at: string; updated_at: string;
        };
        Insert: {
          id?: string; doctor_id: string; procedure_id: string; clinic_id?: string | null;
          years_offered?: number | null; description_short?: string | null; is_primary_focus?: boolean;
          price_from?: number | null; price_to?: number | null; currency?: string;
          price_note?: string | null; consultation_fee?: number | null; is_price_verified?: boolean;
          last_price_check_at?: string | null; is_active?: boolean; created_at?: string; updated_at?: string;
        };
        Update: {
          years_offered?: number | null; description_short?: string | null; is_primary_focus?: boolean;
          price_from?: number | null; price_to?: number | null; currency?: string;
          price_note?: string | null; consultation_fee?: number | null; is_price_verified?: boolean;
          last_price_check_at?: string | null; is_active?: boolean; updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "doctor_procedures_doctor_id_fkey";
            columns: ["doctor_id"];
            referencedRelation: "doctor_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "doctor_procedures_procedure_id_fkey";
            columns: ["procedure_id"];
            referencedRelation: "procedures";
            referencedColumns: ["id"];
          }
        ];
      };
      profile_claims: {
        Row: {
          id: string; doctor_id: string | null; clinic_id: string | null;
          claimant_user_id: string; claimant_email: string; claimant_phone: string | null;
          requested_role: string; status: ClaimStatus; proof_type: string | null; proof_value: string | null;
          notes: string | null; verification_method: ClaimVerificationMethod | null;
          assigned_to: string | null; reviewed_at: string | null; approved_user_id: string | null;
          created_at: string; updated_at: string;
        };
        Insert: {
          id?: string; doctor_id?: string | null; clinic_id?: string | null;
          claimant_user_id: string; claimant_email: string; claimant_phone?: string | null;
          requested_role?: string; status?: ClaimStatus; proof_type?: string | null; proof_value?: string | null;
          notes?: string | null; verification_method?: ClaimVerificationMethod | null;
          assigned_to?: string | null; reviewed_at?: string | null; approved_user_id?: string | null;
          created_at?: string; updated_at?: string;
        };
        Update: {
          doctor_id?: string | null; clinic_id?: string | null;
          claimant_user_id?: string; claimant_email?: string; claimant_phone?: string | null;
          requested_role?: string; status?: ClaimStatus; proof_type?: string | null; proof_value?: string | null;
          notes?: string | null; verification_method?: ClaimVerificationMethod | null;
          assigned_to?: string | null; reviewed_at?: string | null; approved_user_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profile_claims_doctor_id_fkey";
            columns: ["doctor_id"];
            referencedRelation: "doctor_profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      lead_requests: {
        Row: {
          id: string; doctor_id: string | null; clinic_id: string | null; procedure_id: string | null;
          source_page_url: string | null; source_page_type: string | null;
          patient_name: string; patient_email: string; patient_phone: string | null;
          preferred_contact: string | null; preferred_time: string | null; message: string;
          consent_privacy: boolean; consent_data_forwarding: boolean;
          utm_source: string | null; utm_medium: string | null; utm_campaign: string | null;
          gclid: string | null; is_qualified: boolean | null; spam_score: number | null;
          status: LeadStatus; created_at: string;
        };
        Insert: {
          id?: string; doctor_id?: string | null; clinic_id?: string | null; procedure_id?: string | null;
          source_page_url?: string | null; source_page_type?: string | null;
          patient_name: string; patient_email: string; patient_phone?: string | null;
          preferred_contact?: string | null; preferred_time?: string | null; message: string;
          consent_privacy: boolean; consent_data_forwarding: boolean;
          utm_source?: string | null; utm_medium?: string | null; utm_campaign?: string | null;
          gclid?: string | null; is_qualified?: boolean | null; spam_score?: number | null;
          status?: LeadStatus; created_at?: string;
        };
        Update: {
          doctor_id?: string | null; clinic_id?: string | null; procedure_id?: string | null;
          source_page_url?: string | null; source_page_type?: string | null;
          patient_name?: string; patient_email?: string; patient_phone?: string | null;
          preferred_contact?: string | null; preferred_time?: string | null; message?: string;
          consent_privacy?: boolean; consent_data_forwarding?: boolean;
          utm_source?: string | null; utm_medium?: string | null; utm_campaign?: string | null;
          gclid?: string | null; is_qualified?: boolean | null; spam_score?: number | null;
          status?: LeadStatus;
        };
        Relationships: [];
      };
      reviews: {
        Row: {
          id: string; doctor_id: string; clinic_id: string | null; user_id: string | null;
          procedure_id: string | null; rating_overall: number; rating_consultation: number | null;
          rating_result: number | null; rating_staff: number | null; title: string | null; body: string | null;
          visit_month: number | null; visit_year: number | null;
          verification_status: ReviewVerificationStatus; moderation_status: ReviewModerationStatus;
          created_at: string; updated_at: string;
        };
        Insert: {
          id?: string; doctor_id: string; clinic_id?: string | null; user_id?: string | null;
          procedure_id?: string | null; rating_overall: number; rating_consultation?: number | null;
          rating_result?: number | null; rating_staff?: number | null; title?: string | null; body?: string | null;
          visit_month?: number | null; visit_year?: number | null;
          verification_status?: ReviewVerificationStatus; moderation_status?: ReviewModerationStatus;
          created_at?: string; updated_at?: string;
        };
        Update: {
          rating_overall?: number; rating_consultation?: number | null;
          rating_result?: number | null; rating_staff?: number | null; title?: string | null; body?: string | null;
          visit_month?: number | null; visit_year?: number | null;
          verification_status?: ReviewVerificationStatus; moderation_status?: ReviewModerationStatus;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reviews_doctor_id_fkey";
            columns: ["doctor_id"];
            referencedRelation: "doctor_profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      media_assets: {
        Row: {
          id: string; doctor_id: string | null; clinic_id: string | null; uploaded_by: string | null;
          bucket_id: string; object_path: string; mime_type: string | null;
          width: number | null; height: number | null; alt_text: string | null;
          visibility: MediaVisibility; media_kind: MediaKind; sort_order: number;
          approved_at: string | null; created_at: string;
        };
        Insert: {
          id?: string; doctor_id?: string | null; clinic_id?: string | null; uploaded_by?: string | null;
          bucket_id: string; object_path: string; mime_type?: string | null;
          width?: number | null; height?: number | null; alt_text?: string | null;
          visibility?: MediaVisibility; media_kind?: MediaKind; sort_order?: number;
          approved_at?: string | null; created_at?: string;
        };
        Update: {
          doctor_id?: string | null; clinic_id?: string | null; uploaded_by?: string | null;
          bucket_id?: string; object_path?: string; mime_type?: string | null;
          width?: number | null; height?: number | null; alt_text?: string | null;
          visibility?: MediaVisibility; media_kind?: MediaKind; sort_order?: number;
          approved_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "media_assets_doctor_id_fkey";
            columns: ["doctor_id"];
            referencedRelation: "doctor_profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      import_batches: {
        Row: {
          id: string; source_type: string; source_label: string; started_by: string | null;
          status: ImportBatchStatus; raw_file_path: string | null;
          total_rows: number; processed_rows: number; approved_rows: number;
          rejected_rows: number; error_count: number;
          started_at: string | null; finished_at: string | null;
          created_at: string; updated_at: string;
        };
        Insert: {
          id?: string; source_type: string; source_label: string; started_by?: string | null;
          status?: ImportBatchStatus; raw_file_path?: string | null;
          total_rows?: number; processed_rows?: number; approved_rows?: number;
          rejected_rows?: number; error_count?: number;
          started_at?: string | null; finished_at?: string | null;
          created_at?: string; updated_at?: string;
        };
        Update: {
          source_type?: string; source_label?: string; started_by?: string | null;
          status?: ImportBatchStatus; raw_file_path?: string | null;
          total_rows?: number; processed_rows?: number; approved_rows?: number;
          rejected_rows?: number; error_count?: number;
          started_at?: string | null; finished_at?: string | null; updated_at?: string;
        };
        Relationships: [];
      };
      import_candidates: {
        Row: {
          id: string; batch_id: string; entity_kind: string; status: ImportCandidateStatus;
          source_external_id: string | null; source_url: string | null; raw_json: Json;
          normalized_name: string | null; normalized_website_domain: string | null;
          normalized_phone: string | null; city: string | null; postal_code: string | null;
          specialty_text: string | null; confidence_score: number;
          matched_doctor_id: string | null; matched_clinic_id: string | null;
          merge_decision: MergeDecision | null; reviewer_id: string | null;
          reviewer_notes: string | null; created_at: string; updated_at: string;
        };
        Insert: {
          id?: string; batch_id: string; entity_kind: string; status?: ImportCandidateStatus;
          source_external_id?: string | null; source_url?: string | null; raw_json: Json;
          normalized_name?: string | null; normalized_website_domain?: string | null;
          normalized_phone?: string | null; city?: string | null; postal_code?: string | null;
          specialty_text?: string | null; confidence_score?: number;
          matched_doctor_id?: string | null; matched_clinic_id?: string | null;
          merge_decision?: MergeDecision | null; reviewer_id?: string | null;
          reviewer_notes?: string | null; created_at?: string; updated_at?: string;
        };
        Update: {
          status?: ImportCandidateStatus;
          normalized_name?: string | null; normalized_website_domain?: string | null;
          normalized_phone?: string | null; city?: string | null; postal_code?: string | null;
          specialty_text?: string | null; confidence_score?: number;
          matched_doctor_id?: string | null; matched_clinic_id?: string | null;
          merge_decision?: MergeDecision | null; reviewer_id?: string | null;
          reviewer_notes?: string | null; updated_at?: string;
        };
        Relationships: [];
      };
      merge_events: {
        Row: {
          id: string; candidate_id: string; target_doctor_id: string | null;
          target_clinic_id: string | null; decided_by: string | null; decision: MergeDecision;
          before_json: Json | null; after_json: Json | null; created_at: string;
        };
        Insert: {
          id?: string; candidate_id: string; target_doctor_id?: string | null;
          target_clinic_id?: string | null; decided_by?: string | null; decision: MergeDecision;
          before_json?: Json | null; after_json?: Json | null; created_at?: string;
        };
        Update: {
          target_doctor_id?: string | null; target_clinic_id?: string | null;
          decided_by?: string | null; decision?: MergeDecision;
          before_json?: Json | null; after_json?: Json | null;
        };
        Relationships: [];
      };
      job_runs: {
        Row: {
          id: string; job_name: string; trigger_type: string; status: string;
          started_by: string | null; input_json: Json | null; output_json: Json | null;
          error_text: string | null; started_at: string; finished_at: string | null;
        };
        Insert: {
          id?: string; job_name: string; trigger_type: string; status: string;
          started_by?: string | null; input_json?: Json | null; output_json?: Json | null;
          error_text?: string | null; started_at?: string; finished_at?: string | null;
        };
        Update: {
          status?: string; output_json?: Json | null; error_text?: string | null;
          finished_at?: string | null;
        };
        Relationships: [];
      };
      source_records: {
        Row: {
          id: string; entity_type: string; entity_id: string; source_type: string;
          source_url: string | null; raw_json: Json | null; checksum: string | null;
          imported_at: string; last_seen_at: string | null;
        };
        Insert: {
          id?: string; entity_type: string; entity_id: string; source_type: string;
          source_url?: string | null; raw_json?: Json | null; checksum?: string | null;
          imported_at?: string; last_seen_at?: string | null;
        };
        Update: { source_url?: string | null; raw_json?: Json | null; checksum?: string | null; last_seen_at?: string | null; };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string; actor_user_id: string | null; event_name: string;
          entity_type: string | null; entity_id: string | null;
          before_json: Json | null; after_json: Json | null;
          ip: string | null; user_agent: string | null; created_at: string;
        };
        Insert: {
          id?: string; actor_user_id?: string | null; event_name: string;
          entity_type?: string | null; entity_id?: string | null;
          before_json?: Json | null; after_json?: Json | null;
          ip?: string | null; user_agent?: string | null; created_at?: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
    };

    Views: {
      publish_queue: {
        Row: {
          id: string; slug: string; public_display_name: string; profile_status: ProfileStatus;
          is_claimed: boolean; is_verified: boolean; is_premium: boolean; source_confidence: number;
          has_location: boolean; has_procedure: boolean; has_specialty: boolean;
        };
        Relationships: [];
      };
      review_moderation_queue: {
        Row: {
          id: string; doctor_id: string; public_display_name: string; doctor_slug: string;
          rating_overall: number; title: string | null; body: string | null;
          verification_status: ReviewVerificationStatus; moderation_status: ReviewModerationStatus;
          created_at: string;
        };
        Relationships: [];
      };
    };

    Functions: {
      search_doctors: {
        Args: {
          p_query?: string | null;
          p_city?: string | null;
          p_procedure_slug?: string | null;
          p_limit?: number;
          p_offset?: number;
        };
        Returns: Array<{
          doctor_id: string;
          slug: string;
          public_display_name: string;
          city: string | null;
          specialty: string | null;
          is_verified: boolean;
          is_premium: boolean;
          rank: number;
        }>;
      };
    };
    Enums: {
      user_role: UserRole;
      profile_status: ProfileStatus;
      verification_level: VerificationLevel;
      claim_status: ClaimStatus;
      lead_status: LeadStatus;
      review_verification_status: ReviewVerificationStatus;
      review_moderation_status: ReviewModerationStatus;
      media_visibility: MediaVisibility;
      media_kind: MediaKind;
      procedure_type: ProcedureType;
      import_batch_status: ImportBatchStatus;
      import_candidate_status: ImportCandidateStatus;
      merge_decision: MergeDecision;
      claim_verification_method: ClaimVerificationMethod;
    };
    CompositeTypes: Record<string, never>;
  };
}
