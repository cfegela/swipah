-- Migration: 20261115000019_camila_extra_photos.sql
-- Add extra photos for Camila Morales

UPDATE public.catalog_profiles
SET extra_photos = ARRAY['/profiles/camila-crossfit-2.jpg', '/profiles/camila-crossfit-3.jpg']
WHERE slug = 'camila-crossfit';
