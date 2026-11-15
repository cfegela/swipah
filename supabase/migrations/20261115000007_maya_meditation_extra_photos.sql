-- Migration: 20261115000007_maya_meditation_extra_photos.sql
-- Add extra photos for Maya Lin

UPDATE public.catalog_profiles
SET extra_photos = ARRAY['/profiles/maya-meditation-2.jpg', '/profiles/maya-meditation-3.jpg']
WHERE slug = 'maya-meditation';
