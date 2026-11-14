-- Migration: 20261114000003_sierra_eco_extra_photos.sql
-- Add extra photos for Sierra Eco-Warrior: olive-green bikini at creek (2nd) and bicycle activity (3rd)

UPDATE public.catalog_profiles
SET extra_photos = ARRAY['/profiles/sierra-eco-warrior-2.jpg', '/profiles/sierra-eco-warrior-3.jpg']
WHERE slug = 'sierra-eco-warrior';
