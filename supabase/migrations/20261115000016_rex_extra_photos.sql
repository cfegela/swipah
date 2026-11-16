-- Migration: 20261115000016_rex_extra_photos.sql
-- Add extra photos for Rex "Iron" Callahan

UPDATE public.catalog_profiles
SET extra_photos = ARRAY['/profiles/rex-iron-callahan-2.jpg', '/profiles/rex-iron-callahan-3.jpg']
WHERE slug = 'rex-iron-callahan';
