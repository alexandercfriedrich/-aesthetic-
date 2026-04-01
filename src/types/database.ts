export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      app_users: {
        Row: {
          id: string;
          email: string;
          role: UserRole;
          full_name: string | null;
          phone: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          role?: UserRole;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          role?: UserRole;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
      };
      doctor_profiles: {
        Row: {
          id: string;
          slug: string;
          owner_id: string | null;
          status: ProfileStatus;
          verification_level: VerificationLevel;
          is_premium: boolean;
          title: string | null;
          first_name: string;
          last_name: string;
          gender: string | null;
          specialty_id: string | null;
          bio_short: string | null;
          bio_long: string | null;
          website_url: string | null;
          phone: string | null;
          email: string | null;
          languages: string[];
          profile_image_url: string | null;
          fts: unknown;
          created_at: string;
          updated_at: string;
          published_at: string | null;
        };
        Insert: {
          id?: string;
          slug: string;
          owner_id?: string | null;
          status?: ProfileStatus;
          verification_level?: VerificationLevel;
          is_premium?: boolean;
          title?: string | null;
          first_name: string;
          last_name: string;
          gender?: string | null;
          specialty_id?: string | null;
          bio_short?: string | null;
          bio_long?: string | null;
          website_url?: string | null;
          phone?: string | null;
          email?: string | null;
          languages?: string[];
          profile_image_url?: string | null;
        };
        Update: {
          slug?: string;
          owner_id?: string | null;
          status?: ProfileStatus;
          verification_level?: VerificationLevel;
          is_premium?: boolean;
          title?: string | null;
          first_name?: string;
          last_name?: string;
          gender?: string | null;
          specialty_id?: string | null;
          bio_short?: string | null;
          bio_long?: string | null;
          website_url?: string | null;
          phone?: string | null;
          email?: string | null;
          languages?: string[];
          profile_image_url?: string | null;
        };
      };
      clinic_profiles: {
        Row: {
          id: string;
          slug: string;
          owner_id: string | null;
          status: ProfileStatus;
          name: string;
          description: string | null;
          website_url: string | null;
          phone: string | null;
          email: string | null;
          logo_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          owner_id?: string | null;
          status?: ProfileStatus;
          name: string;
          description?: string | null;
          website_url?: string | null;
          phone?: string | null;
          email?: string | null;
          logo_url?: string | null;
        };
        Update: {
          slug?: string;
          owner_id?: string | null;
          status?: ProfileStatus;
          name?: string;
          description?: string | null;
          website_url?: string | null;
          phone?: string | null;
          email?: string | null;
          logo_url?: string | null;
        };
      };
      specialties: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
        };
        Update: {
          name?: string;
          slug?: string;
          description?: string | null;
        };
      };
      procedure_categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          icon: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          icon?: string | null;
          sort_order?: number;
        };
        Update: {
          name?: string;
          slug?: string;
          icon?: string | null;
          sort_order?: number;
        };
      };
      procedures: {
        Row: {
          id: string;
          category_id: string | null;
          name: string;
          slug: string;
          description: string | null;
          procedure_type: ProcedureType;
          typical_price_min: number | null;
          typical_price_max: number | null;
          recovery_days: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          category_id?: string | null;
          name: string;
          slug: string;
          description?: string | null;
          procedure_type?: ProcedureType;
          typical_price_min?: number | null;
          typical_price_max?: number | null;
          recovery_days?: number | null;
        };
        Update: {
          category_id?: string | null;
          name?: string;
          slug?: string;
          description?: string | null;
          procedure_type?: ProcedureType;
          typical_price_min?: number | null;
          typical_price_max?: number | null;
          recovery_days?: number | null;
        };
      };
      doctor_procedures: {
        Row: {
          id: string;
          doctor_id: string;
          procedure_id: string;
          price_min: number | null;
          price_max: number | null;
          price_note: string | null;
          is_featured: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          doctor_id: string;
          procedure_id: string;
          price_min?: number | null;
          price_max?: number | null;
          price_note?: string | null;
          is_featured?: boolean;
        };
        Update: {
          price_min?: number | null;
          price_max?: number | null;
          price_note?: string | null;
          is_featured?: boolean;
        };
      };
      locations: {
        Row: {
          id: string;
          doctor_id: string | null;
          clinic_id: string | null;
          name: string | null;
          address_street: string | null;
          address_city: string;
          address_zip: string | null;
          address_state: string | null;
          address_country: string;
          lat: number | null;
          lng: number | null;
          phone: string | null;
          is_primary: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          doctor_id?: string | null;
          clinic_id?: string | null;
          name?: string | null;
          address_street?: string | null;
          address_city: string;
          address_zip?: string | null;
          address_state?: string | null;
          address_country?: string;
          lat?: number | null;
          lng?: number | null;
          phone?: string | null;
          is_primary?: boolean;
        };
        Update: {
          name?: string | null;
          address_street?: string | null;
          address_city?: string;
          address_zip?: string | null;
          address_state?: string | null;
          lat?: number | null;
          lng?: number | null;
          phone?: string | null;
          is_primary?: boolean;
        };
      };
      profile_claims: {
        Row: {
          id: string;
          doctor_id: string;
          claimant_id: string;
          status: ClaimStatus;
          verification_method: ClaimVerificationMethod;
          claimant_email: string;
          claimant_phone: string | null;
          claimant_role: string | null;
          notes: string | null;
          admin_notes: string | null;
          document_urls: string[];
          created_at: string;
          updated_at: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
        };
        Insert: {
          id?: string;
          doctor_id: string;
          claimant_id: string;
          status?: ClaimStatus;
          verification_method: ClaimVerificationMethod;
          claimant_email: string;
          claimant_phone?: string | null;
          claimant_role?: string | null;
          notes?: string | null;
          document_urls?: string[];
        };
        Update: {
          status?: ClaimStatus;
          admin_notes?: string | null;
          document_urls?: string[];
          reviewed_at?: string | null;
          reviewed_by?: string | null;
        };
      };
      lead_requests: {
        Row: {
          id: string;
          doctor_id: string;
          status: LeadStatus;
          name: string;
          email: string;
          phone: string | null;
          procedure_id: string | null;
          message: string | null;
          preferred_contact: string | null;
          consent_data_processing: boolean;
          consent_forwarding: boolean;
          utm_source: string | null;
          utm_medium: string | null;
          utm_campaign: string | null;
          gclid: string | null;
          ip_hash: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          doctor_id: string;
          status?: LeadStatus;
          name: string;
          email: string;
          phone?: string | null;
          procedure_id?: string | null;
          message?: string | null;
          preferred_contact?: string | null;
          consent_data_processing: boolean;
          consent_forwarding: boolean;
          utm_source?: string | null;
          utm_medium?: string | null;
          utm_campaign?: string | null;
          gclid?: string | null;
          ip_hash?: string | null;
        };
        Update: {
          status?: LeadStatus;
        };
      };
      reviews: {
        Row: {
          id: string;
          doctor_id: string;
          author_name: string;
          author_email: string | null;
          rating: number;
          text: string | null;
          treatment: string | null;
          verification_status: ReviewVerificationStatus;
          moderation_status: ReviewModerationStatus;
          doctor_reply: string | null;
          created_at: string;
          updated_at: string;
          published_at: string | null;
        };
        Insert: {
          id?: string;
          doctor_id: string;
          author_name: string;
          author_email?: string | null;
          rating: number;
          text?: string | null;
          treatment?: string | null;
          verification_status?: ReviewVerificationStatus;
          moderation_status?: ReviewModerationStatus;
        };
        Update: {
          moderation_status?: ReviewModerationStatus;
          doctor_reply?: string | null;
          published_at?: string | null;
        };
      };
      media_assets: {
        Row: {
          id: string;
          doctor_id: string | null;
          clinic_id: string | null;
          kind: MediaKind;
          visibility: MediaVisibility;
          storage_path: string;
          url: string | null;
          alt_text: string | null;
          is_approved: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          doctor_id?: string | null;
          clinic_id?: string | null;
          kind: MediaKind;
          visibility?: MediaVisibility;
          storage_path: string;
          url?: string | null;
          alt_text?: string | null;
          is_approved?: boolean;
          sort_order?: number;
        };
        Update: {
          visibility?: MediaVisibility;
          alt_text?: string | null;
          is_approved?: boolean;
          sort_order?: number;
        };
      };
      source_records: {
        Row: {
          id: string;
          doctor_id: string | null;
          source_name: string;
          external_id: string | null;
          raw_data: Json;
          confidence_score: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          doctor_id?: string | null;
          source_name: string;
          external_id?: string | null;
          raw_data: Json;
          confidence_score?: number;
        };
        Update: {
          doctor_id?: string | null;
          confidence_score?: number;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          old_data: Json | null;
          new_data: Json | null;
          ip_address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          old_data?: Json | null;
          new_data?: Json | null;
          ip_address?: string | null;
        };
        Update: never;
      };
      import_batches: {
        Row: {
          id: string;
          name: string;
          source: string;
          status: ImportBatchStatus;
          total_records: number;
          processed_records: number;
          error_count: number;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          source: string;
          status?: ImportBatchStatus;
          total_records?: number;
          processed_records?: number;
          error_count?: number;
          created_by?: string | null;
        };
        Update: {
          status?: ImportBatchStatus;
          total_records?: number;
          processed_records?: number;
          error_count?: number;
          completed_at?: string | null;
        };
      };
      import_candidates: {
        Row: {
          id: string;
          batch_id: string;
          status: ImportCandidateStatus;
          raw_data: Json;
          normalized_data: Json | null;
          matched_doctor_id: string | null;
          confidence_score: number;
          merge_decision: MergeDecision | null;
          admin_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          batch_id: string;
          status?: ImportCandidateStatus;
          raw_data: Json;
          normalized_data?: Json | null;
          matched_doctor_id?: string | null;
          confidence_score?: number;
          merge_decision?: MergeDecision | null;
        };
        Update: {
          status?: ImportCandidateStatus;
          normalized_data?: Json | null;
          matched_doctor_id?: string | null;
          confidence_score?: number;
          merge_decision?: MergeDecision | null;
          admin_notes?: string | null;
        };
      };
      merge_events: {
        Row: {
          id: string;
          source_doctor_id: string;
          target_doctor_id: string;
          performed_by: string | null;
          merge_data: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          source_doctor_id: string;
          target_doctor_id: string;
          performed_by?: string | null;
          merge_data: Json;
        };
        Update: never;
      };
      job_runs: {
        Row: {
          id: string;
          job_name: string;
          status: string;
          started_at: string;
          completed_at: string | null;
          result: Json | null;
          error: string | null;
        };
        Insert: {
          id?: string;
          job_name: string;
          status?: string;
          started_at?: string;
          result?: Json | null;
          error?: string | null;
        };
        Update: {
          status?: string;
          completed_at?: string | null;
          result?: Json | null;
          error?: string | null;
        };
      };
      doctor_clinic_links: {
        Row: {
          id: string;
          doctor_id: string;
          clinic_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          doctor_id: string;
          clinic_id: string;
        };
        Update: never;
      };
    };
    Views: Record<string, never>;
    Functions: {
      search_doctors: {
        Args: {
          query_text?: string;
          city?: string;
          procedure_slug?: string;
          limit_count?: number;
          offset_count?: number;
        };
        Returns: DoctorSearchResult[];
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
  };
};

export type UserRole = "user" | "doctor" | "admin";
export type ProfileStatus = "draft" | "pending_review" | "published" | "hidden" | "suspended";
export type VerificationLevel = "unverified" | "email_verified" | "document_verified" | "premium";
export type ClaimStatus = "pending" | "in_review" | "approved" | "rejected" | "withdrawn";
export type LeadStatus = "new" | "viewed" | "contacted" | "won" | "lost" | "spam";
export type ReviewVerificationStatus = "unverified" | "verified_patient" | "verified_purchase";
export type ReviewModerationStatus = "pending" | "approved" | "rejected" | "flagged";
export type MediaVisibility = "public" | "private" | "admin_only";
export type MediaKind =
  | "profile_photo"
  | "clinic_photo"
  | "gallery"
  | "verification_document"
  | "certificate";
export type ProcedureType = "surgical" | "non_surgical" | "dental" | "diagnostic";
export type ImportBatchStatus = "pending" | "processing" | "completed" | "failed" | "cancelled";
export type ImportCandidateStatus =
  | "pending"
  | "matched"
  | "new_profile"
  | "merged"
  | "ignored"
  | "error";
export type MergeDecision = "merge" | "new_profile" | "ignore";
export type ClaimVerificationMethod =
  | "domain_email"
  | "document_upload"
  | "phone_callback"
  | "manual";

export type DoctorSearchResult = {
  id: string;
  slug: string;
  first_name: string;
  last_name: string;
  title: string | null;
  specialty_name: string | null;
  city: string | null;
  profile_image_url: string | null;
  is_premium: boolean;
  verification_level: VerificationLevel;
  review_count: number;
  avg_rating: number | null;
  procedure_names: string[];
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];
