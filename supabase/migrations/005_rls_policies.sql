-- Enable RLS on all sensitive tables
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_candidates ENABLE ROW LEVEL SECURITY;

-- Helper: check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM app_users
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- app_users policies
CREATE POLICY "Users can read own profile" ON app_users
  FOR SELECT USING (id = auth.uid() OR is_admin());

CREATE POLICY "Users can update own profile" ON app_users
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Service role can insert users" ON app_users
  FOR INSERT WITH CHECK (true);

-- doctor_profiles policies
CREATE POLICY "Published profiles are publicly readable" ON doctor_profiles
  FOR SELECT USING (status = 'published' OR owner_id = auth.uid() OR is_admin());

CREATE POLICY "Owner can update own profile" ON doctor_profiles
  FOR UPDATE USING (owner_id = auth.uid() OR is_admin());

CREATE POLICY "Admin can insert profiles" ON doctor_profiles
  FOR INSERT WITH CHECK (is_admin());

-- clinic_profiles policies
CREATE POLICY "Published clinics are publicly readable" ON clinic_profiles
  FOR SELECT USING (status = 'published' OR owner_id = auth.uid() OR is_admin());

CREATE POLICY "Owner can update own clinic" ON clinic_profiles
  FOR UPDATE USING (owner_id = auth.uid() OR is_admin());

-- locations policies
CREATE POLICY "Public locations readable if profile published" ON locations
  FOR SELECT USING (
    is_admin()
    OR (doctor_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM doctor_profiles dp
      WHERE dp.id = doctor_id AND (dp.status = 'published' OR dp.owner_id = auth.uid())
    ))
    OR (clinic_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM clinic_profiles cp
      WHERE cp.id = clinic_id AND (cp.status = 'published' OR cp.owner_id = auth.uid())
    ))
  );

CREATE POLICY "Owner can manage own locations" ON locations
  FOR ALL USING (
    is_admin()
    OR (doctor_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM doctor_profiles dp WHERE dp.id = doctor_id AND dp.owner_id = auth.uid()
    ))
    OR (clinic_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM clinic_profiles cp WHERE cp.id = clinic_id AND cp.owner_id = auth.uid()
    ))
  );

-- doctor_procedures policies
CREATE POLICY "Public procedures readable if profile published" ON doctor_procedures
  FOR SELECT USING (
    is_admin()
    OR EXISTS (
      SELECT 1 FROM doctor_profiles dp
      WHERE dp.id = doctor_id AND (dp.status = 'published' OR dp.owner_id = auth.uid())
    )
  );

CREATE POLICY "Owner can manage own procedures" ON doctor_procedures
  FOR ALL USING (
    is_admin()
    OR EXISTS (
      SELECT 1 FROM doctor_profiles dp
      WHERE dp.id = doctor_id AND dp.owner_id = auth.uid()
    )
  );

-- profile_claims policies
CREATE POLICY "Claimant can read own claims" ON profile_claims
  FOR SELECT USING (claimant_id = auth.uid() OR is_admin());

CREATE POLICY "Authenticated users can create claims" ON profile_claims
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND claimant_id = auth.uid());

CREATE POLICY "Admin can update claims" ON profile_claims
  FOR UPDATE USING (is_admin());

-- lead_requests policies
CREATE POLICY "Public can submit leads" ON lead_requests
  FOR INSERT WITH CHECK (consent_data_processing = true AND consent_forwarding = true);

CREATE POLICY "Doctor can read own leads" ON lead_requests
  FOR SELECT USING (
    is_admin()
    OR EXISTS (
      SELECT 1 FROM doctor_profiles dp
      WHERE dp.id = doctor_id AND dp.owner_id = auth.uid()
    )
  );

CREATE POLICY "Doctor can update lead status" ON lead_requests
  FOR UPDATE USING (
    is_admin()
    OR EXISTS (
      SELECT 1 FROM doctor_profiles dp
      WHERE dp.id = doctor_id AND dp.owner_id = auth.uid()
    )
  );

-- reviews policies
CREATE POLICY "Approved reviews are publicly readable" ON reviews
  FOR SELECT USING (moderation_status = 'approved' OR is_admin());

CREATE POLICY "Anyone can submit a review" ON reviews
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin can moderate reviews" ON reviews
  FOR UPDATE USING (is_admin());

-- media_assets policies
CREATE POLICY "Public approved media readable" ON media_assets
  FOR SELECT USING (
    (visibility = 'public' AND is_approved = true)
    OR is_admin()
    OR (doctor_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM doctor_profiles dp
      WHERE dp.id = doctor_id AND dp.owner_id = auth.uid()
    ))
  );

CREATE POLICY "Owner can manage own media" ON media_assets
  FOR ALL USING (
    is_admin()
    OR (doctor_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM doctor_profiles dp
      WHERE dp.id = doctor_id AND dp.owner_id = auth.uid()
    ))
  );

-- source_records - admin only
CREATE POLICY "Admin only source records" ON source_records
  FOR ALL USING (is_admin());

-- audit_logs - admin only
CREATE POLICY "Admin only audit logs" ON audit_logs
  FOR SELECT USING (is_admin());

CREATE POLICY "Service can insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (true);

-- import tables - admin only
CREATE POLICY "Admin only import batches" ON import_batches
  FOR ALL USING (is_admin());

CREATE POLICY "Admin only import candidates" ON import_candidates
  FOR ALL USING (is_admin());
