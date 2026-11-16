-- Migration: 20261115000017_trent_extra_photos.sql
-- Add extra photos for Trent Holloway

UPDATE public.catalog_profiles
SET extra_photos = ARRAY['/profiles/trent-tech-executive-2.jpg', '/profiles/trent-tech-executive-3.jpg']
WHERE slug = 'trent-tech-executive';
