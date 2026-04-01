-- GIN index for FTS
CREATE INDEX idx_doctor_profiles_fts ON doctor_profiles USING gin(fts);

-- Trigram indexes for fuzzy search
CREATE INDEX idx_doctor_profiles_first_name_trgm ON doctor_profiles USING gin(normalize_text(first_name) gin_trgm_ops);
CREATE INDEX idx_doctor_profiles_last_name_trgm ON doctor_profiles USING gin(normalize_text(last_name) gin_trgm_ops);

-- City index for location search
CREATE INDEX idx_locations_city ON locations(lower(address_city));
CREATE INDEX idx_locations_doctor_id ON locations(doctor_id);

-- Status indexes
CREATE INDEX idx_doctor_profiles_status ON doctor_profiles(status);
CREATE INDEX idx_doctor_profiles_specialty_id ON doctor_profiles(specialty_id);
CREATE INDEX idx_doctor_profiles_slug ON doctor_profiles(slug);

-- Leads
CREATE INDEX idx_lead_requests_doctor_id ON lead_requests(doctor_id);
CREATE INDEX idx_lead_requests_status ON lead_requests(status);

-- Reviews
CREATE INDEX idx_reviews_doctor_id ON reviews(doctor_id);
CREATE INDEX idx_reviews_moderation ON reviews(moderation_status);

-- Import candidates
CREATE INDEX idx_import_candidates_batch_id ON import_candidates(batch_id);
CREATE INDEX idx_import_candidates_status ON import_candidates(status);

-- Audit logs
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);

-- Search RPC function
CREATE OR REPLACE FUNCTION search_doctors(
  query_text text DEFAULT NULL,
  city text DEFAULT NULL,
  procedure_slug text DEFAULT NULL,
  limit_count int DEFAULT 20,
  offset_count int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  slug text,
  first_name text,
  last_name text,
  title text,
  specialty_name text,
  city text,
  profile_image_url text,
  is_premium boolean,
  verification_level verification_level,
  review_count bigint,
  avg_rating numeric,
  procedure_names text[]
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    dp.id,
    dp.slug,
    dp.first_name,
    dp.last_name,
    dp.title,
    s.name AS specialty_name,
    l.address_city AS city,
    dp.profile_image_url,
    dp.is_premium,
    dp.verification_level,
    COUNT(DISTINCT r.id) AS review_count,
    ROUND(AVG(r.rating), 1) AS avg_rating,
    ARRAY_AGG(DISTINCT pr.name) FILTER (WHERE pr.name IS NOT NULL) AS procedure_names
  FROM doctor_profiles dp
  LEFT JOIN specialties s ON s.id = dp.specialty_id
  LEFT JOIN locations l ON l.doctor_id = dp.id AND l.is_primary = true
  LEFT JOIN reviews r ON r.doctor_id = dp.id AND r.moderation_status = 'approved'
  LEFT JOIN doctor_procedures dproc ON dproc.doctor_id = dp.id
  LEFT JOIN procedures pr ON pr.id = dproc.procedure_id
  WHERE
    dp.status = 'published'
    AND (
      query_text IS NULL
      OR dp.fts @@ plainto_tsquery('german', query_text)
      OR normalize_text(dp.first_name) % normalize_text(query_text)
      OR normalize_text(dp.last_name) % normalize_text(query_text)
    )
    AND (
      city IS NULL
      OR lower(l.address_city) = lower(city)
    )
    AND (
      procedure_slug IS NULL
      OR EXISTS (
        SELECT 1 FROM doctor_procedures dp2
        JOIN procedures p2 ON p2.id = dp2.procedure_id
        WHERE dp2.doctor_id = dp.id AND p2.slug = procedure_slug
      )
    )
  GROUP BY dp.id, dp.slug, dp.first_name, dp.last_name, dp.title,
           s.name, l.address_city, dp.profile_image_url, dp.is_premium,
           dp.verification_level
  ORDER BY
    dp.is_premium DESC,
    CASE dp.verification_level
      WHEN 'premium' THEN 4
      WHEN 'document_verified' THEN 3
      WHEN 'email_verified' THEN 2
      ELSE 1
    END DESC,
    COUNT(DISTINCT r.id) DESC
  LIMIT limit_count
  OFFSET offset_count;
$$;
