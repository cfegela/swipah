-- Migration: 20261115000022_violet_zara_extra_photos.sql
-- Add extra photos for Violet Ramirez and Zara Neon

UPDATE public.catalog_profiles
SET extra_photos = ARRAY['/profiles/violet-vintage-revival-2.jpg', '/profiles/violet-vintage-revival-3.jpg']
WHERE slug = 'violet-vintage-revival';

UPDATE public.catalog_profiles
SET extra_photos = ARRAY['/profiles/zara-neon-2.jpg', '/profiles/zara-neon-3.jpg']
WHERE slug = 'zara-neon';
