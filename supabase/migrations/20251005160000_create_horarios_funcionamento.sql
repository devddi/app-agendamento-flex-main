-- Create horarios_funcionamento table for granular schedule management
CREATE TABLE public.horarios_funcionamento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE NOT NULL,
  dia_semana INTEGER NOT NULL CHECK (dia_semana >= 0 AND dia_semana <= 6), -- 0=domingo, 1=segunda, ..., 6=sábado
  horario TIME NOT NULL, -- horário específico (ex: 09:00, 09:30, 10:00, etc.)
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(empresa_id, dia_semana, horario)
);

ALTER TABLE public.horarios_funcionamento ENABLE ROW LEVEL SECURITY;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_horarios_funcionamento_updated_at
BEFORE UPDATE ON public.horarios_funcionamento
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for horarios_funcionamento
CREATE POLICY "Public can view active horarios"
ON public.horarios_funcionamento
FOR SELECT
USING (ativo = true);

CREATE POLICY "Empresa owners can manage their horarios"
ON public.horarios_funcionamento
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.empresas
    WHERE empresas.id = horarios_funcionamento.empresa_id
    AND empresas.owner_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin_master')
);

-- Create function to generate default schedule for a company
CREATE OR REPLACE FUNCTION public.create_default_schedule(empresa_uuid UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  dia INTEGER;
  horario_atual TIME;
BEGIN
  -- Generate schedule for Monday to Friday (1-5), 9:00 to 18:00, every 30 minutes
  FOR dia IN 1..5 LOOP
    horario_atual := '09:00:00'::TIME;
    WHILE horario_atual <= '18:00:00'::TIME LOOP
      INSERT INTO public.horarios_funcionamento (empresa_id, dia_semana, horario, ativo)
      VALUES (empresa_uuid, dia, horario_atual, true)
      ON CONFLICT (empresa_id, dia_semana, horario) DO NOTHING;
      
      horario_atual := horario_atual + INTERVAL '30 minutes';
    END LOOP;
  END LOOP;
  
  -- Generate schedule for Saturday (6), 9:00 to 13:00, every 30 minutes
  dia := 6;
  horario_atual := '09:00:00'::TIME;
  WHILE horario_atual <= '13:00:00'::TIME LOOP
    INSERT INTO public.horarios_funcionamento (empresa_id, dia_semana, horario, ativo)
    VALUES (empresa_uuid, dia, horario_atual, true)
    ON CONFLICT (empresa_id, dia_semana, horario) DO NOTHING;
    
    horario_atual := horario_atual + INTERVAL '30 minutes';
  END LOOP;
END;
$$;

-- Create function to toggle all day schedule
CREATE OR REPLACE FUNCTION public.toggle_day_schedule(empresa_uuid UUID, dia INTEGER, ativo_status BOOLEAN)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.horarios_funcionamento
  SET ativo = ativo_status, updated_at = NOW()
  WHERE empresa_id = empresa_uuid AND dia_semana = dia;
END;
$$;