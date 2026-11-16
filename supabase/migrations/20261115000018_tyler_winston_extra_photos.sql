-- Migration: 20261115000018_tyler_winston_extra_photos.sql
-- Add extra photos for Tyler "Alpha" Vance and Winston Montgomery

UPDATE public.catalog_profiles
SET extra_photos = ARRAY['/profiles/tyler-alpha-vance-2.jpg', '/profiles/tyler-alpha-vance-3.jpg']
WHERE slug = 'tyler-alpha-vance';

UPDATE public.catalog_profiles
SET extra_photos = ARRAY['/profiles/winston-wealth-advisor-2.jpg', '/profiles/winston-wealth-advisor-3.jpg']
WHERE slug = 'winston-wealth-advisor';
