-- Migration: 20261115000003_daisy_wanderlust_extra_photos.sql
-- Add extra photos for Daisy Wanderlust: tropical beach bikini photo (2nd) and mountain hiking action photo (3rd)

UPDATE public.catalog_profiles
SET extra_photos = ARRAY['/profiles/daisy-wanderlust-2.jpg', '/profiles/daisy-wanderlust-3.jpg']
WHERE slug = 'daisy-wanderlust';
