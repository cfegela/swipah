-- Migration: 20261115000020_gemma_extra_photos.sql
-- Add extra photos for Gemma Sterling

UPDATE public.catalog_profiles
SET extra_photos = ARRAY['/profiles/gemma-vintage-2.jpg', '/profiles/gemma-vintage-3.jpg']
WHERE slug = 'gemma-vintage';
