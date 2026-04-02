-- Buckets vorher im Dashboard oder per SQL anlegen:
-- doctor-public, doctor-private, verification-private

create policy "doctor_public_read" on storage.objects for select to anon, authenticated using (bucket_id = 'doctor-public');

create policy "doctor_public_insert_own_folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'doctor-public' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "doctor_public_update_own_folder" on storage.objects for update to authenticated
  using (bucket_id = 'doctor-public' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'doctor-public' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "doctor_public_delete_own_folder" on storage.objects for delete to authenticated
  using (bucket_id = 'doctor-public' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "verification_private_insert_own_folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'verification-private' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "verification_private_read_own_folder" on storage.objects for select to authenticated
  using (bucket_id = 'verification-private' and (storage.foldername(name))[1] = auth.uid()::text);
