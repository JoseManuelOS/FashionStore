-- =============================================
-- Supabase Storage Policies for products-images bucket
-- =============================================

-- INSTRUCTIONS:
-- 1. Go to Supabase Dashboard > Storage
-- 2. Create a new bucket named "products-images"
-- 3. Set the bucket as PUBLIC (for image URLs to be accessible)
-- 4. Apply these policies in the SQL Editor

-- Allow public to view/download images
CREATE POLICY "Allow public read access on product images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'products-images');

-- Allow authenticated users to upload images
CREATE POLICY "Allow authenticated users to upload images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'products-images');

-- Allow authenticated users to update their uploaded images
CREATE POLICY "Allow authenticated users to update images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'products-images');

-- Allow authenticated users to delete images
CREATE POLICY "Allow authenticated users to delete images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'products-images');
