-- Migration: 20261115000002_sabrina_sommelier_extra_photos.sql
-- Add extra photos for Sabrina Vance: poolside photo (2nd) and vineyard charcuterie activity (3rd)

UPDATE public.catalog_profiles
SET extra_photos = ARRAY['/profiles/sabrina-sommelier-2.jpg', '/profiles/sabrina-sommelier-3.jpg']
WHERE slug = 'sabrina-sommelier';
