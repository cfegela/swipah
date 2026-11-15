-- Migration: 20261115000004_astrid_beatrice_extra_photos.sql
-- Add extra photos for Astrid Lindholm and Beatrice Beaumont

UPDATE public.catalog_profiles
SET extra_photos = ARRAY['/profiles/astrid-architect-2.jpg', '/profiles/astrid-architect-3.jpg']
WHERE slug = 'astrid-architect';

UPDATE public.catalog_profiles
SET extra_photos = ARRAY['/profiles/beatrice-baker-2.jpg', '/profiles/beatrice-baker-3.jpg']
WHERE slug = 'beatrice-baker';
