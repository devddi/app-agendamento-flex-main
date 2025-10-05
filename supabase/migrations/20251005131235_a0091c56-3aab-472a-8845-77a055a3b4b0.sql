-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin_master', 'empresa_owner');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT,
  telefone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create empresas table
CREATE TABLE public.empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  responsavel TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  logo_url TEXT,
  cor_primaria TEXT DEFAULT '#1a1a1a',
  cor_secundaria TEXT DEFAULT '#32F08C',
  horario_funcionamento JSONB DEFAULT '{"seg-sex": "9:00-18:00", "sab": "9:00-13:00", "dom": "fechado"}',
  status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;

-- Create servicos table
CREATE TABLE public.servicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  duracao_minutos INTEGER NOT NULL,
  preco DECIMAL(10,2) NOT NULL,
  imagem_url TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.servicos ENABLE ROW LEVEL SECURITY;

-- Create clientes table
CREATE TABLE public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  data_nascimento DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(empresa_id, telefone)
);

ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

-- Create agendamentos table
CREATE TABLE public.agendamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE NOT NULL,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE NOT NULL,
  servico_id UUID REFERENCES public.servicos(id) ON DELETE CASCADE NOT NULL,
  data DATE NOT NULL,
  hora TIME NOT NULL,
  status TEXT DEFAULT 'confirmado' CHECK (status IN ('confirmado', 'cancelado', 'pendente')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;

-- Function to generate slug from name
CREATE OR REPLACE FUNCTION public.generate_slug(name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
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

-- Trigger to auto-generate slug
CREATE OR REPLACE FUNCTION public.set_empresa_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_slug(NEW.nome);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_empresa_slug
BEFORE INSERT ON public.empresas
FOR EACH ROW
EXECUTE FUNCTION public.set_empresa_slug();

-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, telefone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', ''),
    COALESCE(NEW.raw_user_meta_data->>'telefone', '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admin master can manage all roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin_master'));

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

-- RLS Policies for empresas
CREATE POLICY "Admin master can manage all empresas"
ON public.empresas
FOR ALL
USING (public.has_role(auth.uid(), 'admin_master'));

CREATE POLICY "Empresa owners can view their empresa"
ON public.empresas
FOR SELECT
USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin_master'));

CREATE POLICY "Empresa owners can update their empresa"
ON public.empresas
FOR UPDATE
USING (auth.uid() = owner_id);

CREATE POLICY "Public can view active empresas"
ON public.empresas
FOR SELECT
USING (status = 'ativo');

-- RLS Policies for servicos
CREATE POLICY "Public can view active servicos"
ON public.servicos
FOR SELECT
USING (ativo = true);

CREATE POLICY "Empresa owners can manage their servicos"
ON public.servicos
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.empresas
    WHERE empresas.id = servicos.empresa_id
    AND empresas.owner_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin_master')
);

-- RLS Policies for clientes
CREATE POLICY "Public can insert clientes"
ON public.clientes
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Empresa owners can view their clientes"
ON public.clientes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.empresas
    WHERE empresas.id = clientes.empresa_id
    AND empresas.owner_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin_master')
);

CREATE POLICY "Empresa owners can manage their clientes"
ON public.clientes
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.empresas
    WHERE empresas.id = clientes.empresa_id
    AND empresas.owner_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin_master')
);

-- RLS Policies for agendamentos
CREATE POLICY "Public can create agendamentos"
ON public.agendamentos
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Empresa owners can view their agendamentos"
ON public.agendamentos
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.empresas
    WHERE empresas.id = agendamentos.empresa_id
    AND empresas.owner_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin_master')
);

CREATE POLICY "Empresa owners can manage their agendamentos"
ON public.agendamentos
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.empresas
    WHERE empresas.id = agendamentos.empresa_id
    AND empresas.owner_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin_master')
);