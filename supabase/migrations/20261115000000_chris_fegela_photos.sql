-- Migration: 20261115000000_chris_fegela_photos.sql
-- Wire generated photos for Chris Fegela: patio portrait (main), sunset sailboat (2nd), and mountain trail hike (3rd)

UPDATE public.catalog_profiles
SET
  avatar_url = '/profiles/chris-fegela.jpg',
  extra_photos = ARRAY['/profiles/chris-fegela-2.jpg', '/profiles/chris-fegela-3.jpg']
WHERE slug = 'chris-fegela';
