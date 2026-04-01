-- Enums
CREATE TYPE user_role AS ENUM ('user', 'doctor', 'admin');
CREATE TYPE profile_status AS ENUM ('draft', 'pending_review', 'published', 'hidden', 'suspended');
CREATE TYPE verification_level AS ENUM ('unverified', 'email_verified', 'document_verified', 'premium');
CREATE TYPE claim_status AS ENUM ('pending', 'in_review', 'approved', 'rejected', 'withdrawn');
CREATE TYPE lead_status AS ENUM ('new', 'viewed', 'contacted', 'won', 'lost', 'spam');
CREATE TYPE review_verification_status AS ENUM ('unverified', 'verified_patient', 'verified_purchase');
CREATE TYPE review_moderation_status AS ENUM ('pending', 'approved', 'rejected', 'flagged');
CREATE TYPE media_visibility AS ENUM ('public', 'private', 'admin_only');
CREATE TYPE media_kind AS ENUM ('profile_photo', 'clinic_photo', 'gallery', 'verification_document', 'certificate');
CREATE TYPE procedure_type AS ENUM ('surgical', 'non_surgical', 'dental', 'diagnostic');
CREATE TYPE import_batch_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');
CREATE TYPE import_candidate_status AS ENUM ('pending', 'matched', 'new_profile', 'merged', 'ignored', 'error');
CREATE TYPE merge_decision AS ENUM ('merge', 'new_profile', 'ignore');
CREATE TYPE claim_verification_method AS ENUM ('domain_email', 'document_upload', 'phone_callback', 'manual');
