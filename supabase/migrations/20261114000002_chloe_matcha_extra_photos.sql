-- Migration: 20261114000002_chloe_matcha_extra_photos.sql
-- Add extra photos for Chloe Matcha: revealing poolside (2nd) and matcha whisking activity (3rd)

UPDATE public.catalog_profiles
SET extra_photos = ARRAY['/profiles/chloe-matcha-2.jpg', '/profiles/chloe-matcha-3.jpg']
WHERE slug = 'chloe-matcha';
