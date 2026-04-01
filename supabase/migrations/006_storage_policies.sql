-- Storage buckets (run via Supabase dashboard or CLI)
-- INSERT INTO storage.buckets (id, name, public) VALUES
--   ('doctor-public', 'doctor-public', true),
--   ('doctor-private', 'doctor-private', false),
--   ('verification-private', 'verification-private', false);

-- Doctor public bucket: authenticated users can upload to their own folder
CREATE POLICY "Users can upload to own folder in doctor-public"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'doctor-public'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
  );

CREATE POLICY "Public read for doctor-public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'doctor-public');

CREATE POLICY "Users can update own files in doctor-public"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'doctor-public'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
  );

CREATE POLICY "Users can delete own files in doctor-public"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'doctor-public'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
  );

-- Doctor private bucket
CREATE POLICY "Users can upload to own folder in doctor-private"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'doctor-private'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
  );

CREATE POLICY "Users can read own files in doctor-private"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'doctor-private'
    AND (
      auth.uid()::text = (string_to_array(name, '/'))[1]
      OR EXISTS (SELECT 1 FROM app_users WHERE id = auth.uid() AND role = 'admin')
    )
  );

-- Verification private bucket
CREATE POLICY "Users can upload to verification-private"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'verification-private'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
  );

CREATE POLICY "Admin can read verification documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'verification-private'
    AND EXISTS (SELECT 1 FROM app_users WHERE id = auth.uid() AND role = 'admin')
  );
