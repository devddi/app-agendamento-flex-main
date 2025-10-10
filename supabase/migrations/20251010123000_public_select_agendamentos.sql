-- Allow public (anon) to read occupied agendamentos to hide slots on public scheduling
-- This policy enables SELECT for rows with status 'confirmado' or 'pendente'
-- It does not expose canceled appointments
CREATE POLICY "Public can view occupied agendamentos"
ON public.agendamentos
FOR SELECT
USING (
  status IN ('confirmado', 'pendente')
);