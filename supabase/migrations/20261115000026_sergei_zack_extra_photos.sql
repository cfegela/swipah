-- Migration: 20261115000026_sergei_zack_extra_photos.sql
-- Add extra photos for Sergei Volkov and Zack Moon

UPDATE public.catalog_profiles
SET extra_photos = ARRAY['/profiles/sergei-chess-quant-2.jpg', '/profiles/sergei-chess-quant-3.jpg']
WHERE slug = 'sergei-chess-quant';

UPDATE public.catalog_profiles
SET extra_photos = ARRAY['/profiles/zack-crypto-mooner-2.jpg', '/profiles/zack-crypto-mooner-3.jpg']
WHERE slug = 'zack-crypto-mooner';
