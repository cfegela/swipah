-- Migration: 20261114000005_reorder_luna_starweaver_photos.sql
-- Move Luna Starweaver's poolside swimsuit photo (luna-starweaver-3.jpg) to 2nd position
-- and tarot activity photo (luna-starweaver-2.jpg) to 3rd position, matching Chloe & Sierra.

UPDATE public.catalog_profiles
SET extra_photos = ARRAY['/profiles/luna-starweaver-3.jpg', '/profiles/luna-starweaver-2.jpg']
WHERE slug = 'luna-starweaver';
