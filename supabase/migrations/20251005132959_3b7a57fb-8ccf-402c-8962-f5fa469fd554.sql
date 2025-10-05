-- Drop existing function
DROP FUNCTION IF EXISTS public.generate_slug(text);

-- Create a simpler slug generation function that doesn't require unaccent extension
CREATE OR REPLACE FUNCTION public.generate_slug(name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  slug_text TEXT;
BEGIN
  -- Convert to lowercase and replace spaces and special chars with hyphens
  slug_text := lower(trim(name));
  
  -- Replace accented characters manually (common Portuguese chars)
  slug_text := replace(slug_text, 'á', 'a');
  slug_text := replace(slug_text, 'à', 'a');
  slug_text := replace(slug_text, 'ã', 'a');
  slug_text := replace(slug_text, 'â', 'a');
  slug_text := replace(slug_text, 'é', 'e');
  slug_text := replace(slug_text, 'ê', 'e');
  slug_text := replace(slug_text, 'í', 'i');
  slug_text := replace(slug_text, 'ó', 'o');
  slug_text := replace(slug_text, 'õ', 'o');
  slug_text := replace(slug_text, 'ô', 'o');
  slug_text := replace(slug_text, 'ú', 'u');
  slug_text := replace(slug_text, 'ü', 'u');
  slug_text := replace(slug_text, 'ç', 'c');
  
  -- Replace non-alphanumeric chars with hyphens
  slug_text := regexp_replace(slug_text, '[^a-z0-9]+', '-', 'g');
  
  -- Remove leading/trailing hyphens
  slug_text := regexp_replace(slug_text, '^-+|-+$', '', 'g');
  
  RETURN slug_text;
END;
$$;