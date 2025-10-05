-- Fix search_path for generate_slug function
CREATE OR REPLACE FUNCTION public.generate_slug(name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN lower(regexp_replace(
    unaccent(trim(name)),
    '[^a-z0-9]+',
    '-',
    'g'
  ));
END;
$$;

-- Fix search_path for set_empresa_slug function
CREATE OR REPLACE FUNCTION public.set_empresa_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_slug(NEW.nome);
  END IF;
  RETURN NEW;
END;
$$;