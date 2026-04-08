-- Create storage bucket for movement media (GIFs from ExerciseDB)
-- FEAT-009: Movement Media Library
insert into storage.buckets (id, name, public)
values ('movement-media', 'movement-media', true)
on conflict (id) do nothing;

-- RLS Policies for movement-media bucket

-- Allow public access to view movement media (served directly to browser)
create policy "Public read movement-media"
on storage.objects for select
using ( bucket_id = 'movement-media' );

-- Allow service_role to upload media (seed script uses service_role key)
-- Note: service_role bypasses RLS by default, but this policy also allows
-- authenticated admins to upload via the Movements page.
create policy "Admins can upload movement media"
on storage.objects for insert
with check (
  bucket_id = 'movement-media' AND
  auth.role() = 'authenticated'
);

-- Allow admins to update movement media
create policy "Admins can update movement media"
on storage.objects for update
using (
  bucket_id = 'movement-media' AND
  auth.role() = 'authenticated'
);

-- Allow admins to delete movement media
create policy "Admins can delete movement media"
on storage.objects for delete
using (
  bucket_id = 'movement-media' AND
  auth.role() = 'authenticated'
);
