-- Migration: 20261115000025_marcus_maverick_extra_photos.sql
-- Add extra photos for Marcus Vance and Maverick Sterling

UPDATE public.catalog_profiles
SET extra_photos = ARRAY['/profiles/marcus-master-distiller-2.jpg', '/profiles/marcus-master-distiller-3.jpg']
WHERE slug = 'marcus-master-distiller';

UPDATE public.catalog_profiles
SET extra_photos = ARRAY['/profiles/maverick-skater-2.jpg', '/profiles/maverick-skater-3.jpg']
WHERE slug = 'maverick-skater';
