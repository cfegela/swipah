-- Migration: 20261115000013_garrison_extra_photos.sql
-- Add extra photos for Garrison Cole

UPDATE public.catalog_profiles
SET extra_photos = ARRAY['/profiles/garrison-gearhead-2.jpg', '/profiles/garrison-gearhead-3.jpg']
WHERE slug = 'garrison-gearhead';
