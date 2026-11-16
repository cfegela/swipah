-- Migration: 20261115000023_chet_arthur_extra_photos.sql
-- Add extra photos for Chet Dawson and Dr. Arthur Pendelton

UPDATE public.catalog_profiles
SET extra_photos = ARRAY['/profiles/chet-vanlife-2.jpg', '/profiles/chet-vanlife-3.jpg']
WHERE slug = 'chet-vanlife';

UPDATE public.catalog_profiles
SET extra_photos = ARRAY['/profiles/dr-arthur-bibliophile-2.jpg', '/profiles/dr-arthur-bibliophile-3.jpg']
WHERE slug = 'dr-arthur-bibliophile';
