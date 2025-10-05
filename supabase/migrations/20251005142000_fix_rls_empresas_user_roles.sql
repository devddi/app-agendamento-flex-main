-- Fix RLS policies to allow Admin Master to create and manage empresas and roles

-- Empresas: allow Admin Master to INSERT
CREATE POLICY "Admin master can insert empresas"
ON public.empresas
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin_master'));

-- Empresas: allow Admin Master to UPDATE (USING + WITH CHECK)
CREATE POLICY "Admin master can update empresas"
ON public.empresas
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin_master'))
WITH CHECK (public.has_role(auth.uid(), 'admin_master'));

-- Empresas: allow Admin Master to DELETE
CREATE POLICY "Admin master can delete empresas"
ON public.empresas
FOR DELETE
USING (public.has_role(auth.uid(), 'admin_master'));

-- user_roles: allow Admin Master to INSERT roles
CREATE POLICY "Admin master can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin_master'));

-- user_roles: allow Admin Master to UPDATE roles
CREATE POLICY "Admin master can update roles"
ON public.user_roles
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin_master'))
WITH CHECK (public.has_role(auth.uid(), 'admin_master'));

-- user_roles: allow Admin Master to DELETE roles
CREATE POLICY "Admin master can delete roles"
ON public.user_roles
FOR DELETE
USING (public.has_role(auth.uid(), 'admin_master'));