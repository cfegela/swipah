-- Migration: 20261115000027_harper_brody_final_extra_photos.sql
-- Add extra photos for Harper Vance and Brody Patel (completing all 41 profiles)

UPDATE public.catalog_profiles
SET extra_photos = ARRAY['/profiles/harper-corporate-climber-2.jpg', '/profiles/harper-corporate-climber-3.jpg']
WHERE slug = 'harper-corporate-climber';

UPDATE public.catalog_profiles
SET extra_photos = ARRAY['/profiles/brody-brogrammer-2.jpg', '/profiles/brody-brogrammer-3.jpg']
WHERE slug = 'brody-brogrammer';
