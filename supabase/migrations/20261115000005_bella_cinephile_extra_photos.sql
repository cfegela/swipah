-- Migration: 20261115000005_bella_cinephile_extra_photos.sql
-- Add extra photos for Bella Cinephile

UPDATE public.catalog_profiles
SET extra_photos = ARRAY['/profiles/bella-cinephile-2.jpg', '/profiles/bella-cinephile-3.jpg']
WHERE slug = 'bella-cinephile';
