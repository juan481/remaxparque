-- Add drive_url to news (for past events photo albums)
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS drive_url TEXT;

-- Add image_url to news (cover image for novedades cards)
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add thumbnail_url to courses (cover image for course cards)
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
