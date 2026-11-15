-- Migration: 20261115000008_nadia_penelope_extra_photos.sql
-- Add extra photos for Dr. Nadia Thorne and Penelope Green

UPDATE public.catalog_profiles
SET extra_photos = ARRAY['/profiles/nadia-neuroscientist-2.jpg', '/profiles/nadia-neuroscientist-3.jpg']
WHERE slug = 'nadia-neuroscientist';

UPDATE public.catalog_profiles
SET extra_photos = ARRAY['/profiles/penelope-sourdough-green-2.jpg', '/profiles/penelope-sourdough-green-3.jpg']
WHERE slug = 'penelope-sourdough-green';
