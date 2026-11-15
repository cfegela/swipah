-- Migration: 20261115000011_chad_extra_photos.sql
-- Add extra photos for Chad Thunderclout

UPDATE public.catalog_profiles
SET extra_photos = ARRAY['/profiles/chad-thunderclout-2.jpg', '/profiles/chad-thunderclout-3.jpg']
WHERE slug = 'chad-thunderclout';
