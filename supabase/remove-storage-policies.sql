-- =============================================
-- Eliminar políticas de Supabase Storage
-- =============================================
-- Ya no necesitamos estas políticas porque las imágenes
-- se almacenarán en Cloudinary en lugar de Supabase Storage
--
-- EJECUTAR ESTO EN SUPABASE SQL EDITOR
-- =============================================

-- Eliminar políticas de storage
DROP POLICY IF EXISTS "storage_public_read" ON storage.objects;
DROP POLICY IF EXISTS "storage_auth_insert" ON storage.objects;
DROP POLICY IF EXISTS "storage_auth_update" ON storage.objects;
DROP POLICY IF EXISTS "storage_auth_delete" ON storage.objects;

-- Políticas adicionales que puedan existir
DROP POLICY IF EXISTS "Allow public read access on product images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete images" ON storage.objects;

-- =============================================
-- NOTA IMPORTANTE
-- =============================================
-- ✅ La tabla product_images NO necesita cambios
-- ✅ El campo image_url ya acepta cualquier URL (Cloudinary, etc.)
-- ✅ Puedes eliminar el bucket "products-images" desde:
--    Supabase Dashboard > Storage > products-images > Settings > Delete bucket
--
-- ⚠️  Si tienes imágenes en Supabase Storage, descárgalas antes de eliminar el bucket
-- =============================================
