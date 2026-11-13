-- Migration: Remove distance from catalog profile locations
UPDATE public.catalog_profiles
SET location = TRIM(regexp_replace(location, '\s*\([^)]*(?:miles?|mi\s*away|online)[^)]*\)', '', 'gi'));
