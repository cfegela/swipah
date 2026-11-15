-- Migration: 20261115000014_kyle_extra_photos.sql
-- Add extra photos for Kyle Brooks

UPDATE public.catalog_profiles
SET extra_photos = ARRAY['/profiles/kyle-triathlete-2.jpg', '/profiles/kyle-triathlete-3.jpg']
WHERE slug = 'kyle-triathlete';
