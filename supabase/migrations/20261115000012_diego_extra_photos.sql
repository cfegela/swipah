-- Migration: 20261115000012_diego_extra_photos.sql
-- Add extra photos for Diego Cruz

UPDATE public.catalog_profiles
SET extra_photos = ARRAY['/profiles/diego-dj-restaurateur-2.jpg', '/profiles/diego-dj-restaurateur-3.jpg']
WHERE slug = 'diego-dj-restaurateur';
