-- Migration: 20261115000021_tiffany_extra_photos.sql
-- Add extra photos for Tiffany Sparkle

UPDATE public.catalog_profiles
SET extra_photos = ARRAY['/profiles/tiffany-sparkle-2.jpg', '/profiles/tiffany-sparkle-3.jpg']
WHERE slug = 'tiffany-sparkle';
