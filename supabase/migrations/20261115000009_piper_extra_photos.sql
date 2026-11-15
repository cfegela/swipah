-- Migration: 20261115000009_piper_extra_photos.sql
-- Add extra photos for Piper Quinn

UPDATE public.catalog_profiles
SET extra_photos = ARRAY['/profiles/piper-parenting-influencer-2.jpg', '/profiles/piper-parenting-influencer-3.jpg']
WHERE slug = 'piper-parenting-influencer';
