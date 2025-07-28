/*
  # Create media storage bucket

  1. Storage
    - Create 'media' bucket for file uploads
    - Set public access for uploaded files
    - Configure RLS policies for bucket access

  2. Security
    - Allow authenticated users to upload files
    - Allow public read access to files
    - Allow admins to delete files
*/

-- Create the media bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload media" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'media');

-- Allow public read access to media files
CREATE POLICY "Public can view media" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'media');

-- Allow admins to delete media files
CREATE POLICY "Admins can delete media" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'media' AND auth.jwt() ->> 'is_admin' = 'true');

-- Allow admins to update media files
CREATE POLICY "Admins can update media" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'media' AND auth.jwt() ->> 'is_admin' = 'true');