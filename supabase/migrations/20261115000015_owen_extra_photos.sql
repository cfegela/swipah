-- Migration: 20261115000015_owen_extra_photos.sql
-- Add extra photos for Owen Miller

UPDATE public.catalog_profiles
SET extra_photos = ARRAY['/profiles/owen-organic-farmer-2.jpg', '/profiles/owen-organic-farmer-3.jpg']
WHERE slug = 'owen-organic-farmer';
