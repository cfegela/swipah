-- Migration: 20261115000006_elena_fiona_extra_photos.sql
-- Add extra photos for Elena Rostova and Fiona Delacroix

UPDATE public.catalog_profiles
SET extra_photos = ARRAY['/profiles/elena-estate-lawyer-2.jpg', '/profiles/elena-estate-lawyer-3.jpg']
WHERE slug = 'elena-estate-lawyer';

UPDATE public.catalog_profiles
SET extra_photos = ARRAY['/profiles/fiona-delacroix-2.jpg', '/profiles/fiona-delacroix-3.jpg']
WHERE slug = 'fiona-delacroix';
