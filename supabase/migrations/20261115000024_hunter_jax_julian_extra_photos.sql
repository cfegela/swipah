-- Migration: 20261115000024_hunter_jax_julian_extra_photos.sql
-- Add extra photos for Hunter Callahan, Jax Nova, and Julian Vance

UPDATE public.catalog_profiles
SET extra_photos = ARRAY['/profiles/hunter-wilderness-2.jpg', '/profiles/hunter-wilderness-3.jpg']
WHERE slug = 'hunter-wilderness';

UPDATE public.catalog_profiles
SET extra_photos = ARRAY['/profiles/jax-nova-2.jpg', '/profiles/jax-nova-3.jpg']
WHERE slug = 'jax-nova';

UPDATE public.catalog_profiles
SET extra_photos = ARRAY['/profiles/julian-architectural-digest-2.jpg', '/profiles/julian-architectural-digest-3.jpg']
WHERE slug = 'julian-architectural-digest';
