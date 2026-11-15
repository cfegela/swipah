-- Migration: 20261115000010_brad_extra_photos.sql
-- Add extra photos for Brad "Hedge" Sterling

UPDATE public.catalog_profiles
SET extra_photos = ARRAY['/profiles/brad-hedge-sterling-2.jpg', '/profiles/brad-hedge-sterling-3.jpg']
WHERE slug = 'brad-hedge-sterling';
