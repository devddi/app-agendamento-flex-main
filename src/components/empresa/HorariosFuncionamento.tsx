import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Clock, Save, Loader2, Power, PowerOff } from "lucide-react";

interface HorarioItem {
  id?: string;
  dia_semana: number;
  horario: string;
  ativo: boolean;
}

interface HorariosFuncionamentoProps {
  empresaId: string;
}

const HorariosFuncionamento = ({ empresaId }: HorariosFuncionamentoProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [horarios, setHorarios] = useState<HorarioItem[]>([]);
  const [diasAtivos, setDiasAtivos] = useState<{ [key: number]: boolean }>({});
  const [loadingDias, setLoadingDias] = useState<{ [key: number]: boolean }>({});

  const diasSemana = [
    { valor: 1, nome: 'Segunda-feira', short: 'SEG' },
    { valor: 2, nome: 'Terça-feira', short: 'TER' },
    { valor: 3, nome: 'Quarta-feira', short: 'QUA' },
    { valor: 4, nome: 'Quinta-feira', short: 'QUI' },
    { valor: 5, nome: 'Sexta-feira', short: 'SEX' },
    { valor: 6, nome: 'Sábado', short: 'SAB' },
    { valor: 0, nome: 'Domingo', short: 'DOM' },
  ];

  // Gerar horários de 30 em 30 minutos das 6:00 às 22:30
  const gerarHorarios = () => {
    const horarios = [];
    for (let hora = 6; hora <= 22; hora++) {
      for (let minuto = 0; minuto < 60; minuto += 30) {
        const horarioStr = `${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}`;
        horarios.push(horarioStr);
      }
    }
    return horarios;
  };

  const horariosDisponiveis = gerarHorarios();

  useEffect(() => {
    fetchHorarios();
  }, [empresaId]);

  const fetchHorarios = async () => {
    try {
      const { data, error } = await supabase
        .from('horarios_funcionamento')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('dia_semana')
        .order('horario');

      if (error) throw error;

      // Se não há horários, criar estrutura padrão
      if (!data || data.length === 0) {
        await criarHorariosPadrao();
        return;
      }

      setHorarios((data as any).map((h: any) => ({
        ...h,
        horario: typeof h.horario === 'string' ? h.horario.slice(0, 5) : h.horario,
      })));
      
      // Calcular quais dias estão ativos (pelo menos um horário ativo)
      const novoDiasAtivos: { [key: number]: boolean } = {};
      diasSemana.forEach(dia => {
        const horariosDodia = data.filter(h => h.dia_semana === dia.valor);
        novoDiasAtivos[dia.valor] = horariosDodia.some(h => h.ativo);
      });
      setDiasAtivos(novoDiasAtivos);
      
    } catch (error: any) {
      console.error('Erro ao carregar horários:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar horários de funcionamento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const alterarStatusDia = async (diaSemana: number, ativo: boolean) => {
    setLoadingDias(prev => ({ ...prev, [diaSemana]: true }));
    
    try {
      // Atualizar todos os horários deste dia para o status especificado
      const { error } = await supabase
        .from('horarios_funcionamento')
        .update({ ativo: ativo })
        .eq('empresa_id', empresaId)
        .eq('dia_semana', diaSemana);

      if (error) throw error;
      
      // Atualizar estado local
      setHorarios(prev => prev.map(h => 
        h.dia_semana === diaSemana 
          ? { ...h, ativo: ativo }
          : h
      ));
      
      // Atualizar estado dos dias ativos
      setDiasAtivos(prev => ({ ...prev, [diaSemana]: ativo }));
      
      toast({
        title: "Sucesso",
        description: `Dia ${ativo ? 'ativado' : 'desativado'} com sucesso`,
      });
      
    } catch (error) {
      console.error('Erro ao alterar status do dia:', error);
      toast({
        title: "Erro",
        description: "Erro ao alterar status do dia",
        variant: "destructive",
      });
    } finally {
      setLoadingDias(prev => ({ ...prev, [diaSemana]: false }));
    }
  };

  const criarHorariosPadrao = async () => {
    try {
      const horariosDefault: HorarioItem[] = [];
      
      // Criar horários para todos os dias da semana (6:00 às 22:30)
       diasSemana.forEach(dia => {
         for (let hora = 6; hora <= 22; hora++) {
           for (let minuto = 0; minuto < 60; minuto += 30) {
             const horarioStr = `${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}`;
             horariosDefault.push({
               dia_semana: dia.valor,
               horario: horarioStr,
               ativo: false // Todos começam como FALSE
             });
           }
         }
       });

      const { data, error } = await supabase
        .from('horarios_funcionamento')
        .insert(horariosDefault.map(h => ({ ...h, empresa_id: empresaId })))
        .select();

      if (error) throw error;
      setHorarios(data);
    } catch (error: any) {
      toast({
        title: "Erro ao criar horários padrão",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const toggleHorario = async (dia: number, horario: string) => {
    try {
      // Encontrar o horário atual
      const horarioAtual = horarios.find(h => h.dia_semana === dia && h.horario === horario);
      if (!horarioAtual) return;
      
      const novoStatus = !horarioAtual.ativo;
      
      // Atualizar no banco de dados
      const { error } = await supabase
        .from('horarios_funcionamento')
        .update({ ativo: novoStatus })
        .eq('id', horarioAtual.id as string);

      if (error) throw error;
      
      // Atualizar estado local
      setHorarios(prev => prev.map(h => 
        h.dia_semana === dia && h.horario === horario 
          ? { ...h, ativo: novoStatus }
          : h
      ));
      
      // Atualizar estado dos dias ativos
      const horariosDodia = horarios.filter(h => h.dia_semana === dia);
      const horariosAtualizados = horariosDodia.map(h => 
        h.horario === horario ? { ...h, ativo: novoStatus } : h
      );
      const diaAtivo = horariosAtualizados.some(h => h.ativo);
      setDiasAtivos(prev => ({ ...prev, [dia]: diaAtivo }));
      
    } catch (error) {
      console.error('Erro ao alterar horário:', error);
      toast({
        title: "Erro",
        description: "Erro ao alterar horário",
        variant: "destructive",
      });
    }
  };

  const toggleDiaCompleto = (dia: number) => {
    const horariosDodia = horarios.filter(h => h.dia_semana === dia);
    const todosAtivos = horariosDodia.every(h => h.ativo);
    
    setHorarios(prev => prev.map(h => 
      h.dia_semana === dia 
        ? { ...h, ativo: !todosAtivos }
        : h
    ));
  };

  const salvarHorarios = async () => {
    setSaving(true);
    try {
      // Deletar todos os horários existentes da empresa
      await supabase
        .from('horarios_funcionamento')
        .delete()
        .eq('empresa_id', empresaId);

      // Inserir novos horários
      const { error } = await supabase
        .from('horarios_funcionamento')
        .insert(horarios.map(h => ({ ...h, empresa_id: empresaId })));

      if (error) throw error;

      toast({
        title: "Horários salvos!",
        description: "Os horários de funcionamento foram atualizados com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao salvar horários",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getHorarioStatus = (dia: number, horario: string) => {
    const item = horarios.find(h => h.dia_semana === dia && h.horario === horario);
    return item?.ativo || false;
  };

  const getDiaStatus = (dia: number) => {
    const horariosDodia = horarios.filter(h => h.dia_semana === dia);
    if (horariosDodia.length === 0) return false;
    return horariosDodia.some(h => h.ativo);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="glass border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Horários de Funcionamento
        </CardTitle>
        <CardDescription>
          Configure os horários disponíveis para agendamento. Clique nos horários para ativar/desativar.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {diasSemana.map((dia) => {
          const horariosDodia = horariosDisponiveis;
          const diaAtivo = diasAtivos[dia.valor] || false;
          
          return (
            <div key={dia.valor} className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <Label className="font-semibold text-base min-w-[120px]">
                    {dia.nome}
                  </Label>
                  <div className="flex items-center space-x-2">
                    {loadingDias[dia.valor] ? (
                      <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
                    ) : (
                      <div className={`
                        p-2 rounded-full transition-all duration-300 cursor-pointer
                        ${diaAtivo 
                          ? 'bg-green-500 text-white shadow-lg' 
                          : 'bg-gray-300 text-gray-600'
                        }
                      `}
                      onClick={() => alterarStatusDia(dia.valor, !diaAtivo)}
                      >
                        {diaAtivo ? (
                          <Power className="h-4 w-4" />
                        ) : (
                          <PowerOff className="h-4 w-4" />
                        )}
                      </div>
                    )}
                    <span className={`text-sm font-medium ${
                      diaAtivo ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {diaAtivo ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2 pl-4">
                {horariosDodia.map((horario) => {
                  const ativo = getHorarioStatus(dia.valor, horario);
                  return (
                    <Button
                      key={`${dia.valor}-${horario}`}
                      variant={ativo ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleHorario(dia.valor, horario)}
                      className={`text-xs h-8 transition-all duration-200 ${
                        ativo 
                          ? "bg-green-500 text-white hover:bg-green-600 border-green-500 shadow-md" 
                          : "bg-muted hover:bg-muted/80 border-gray-300"
                      }`}
                    >
                      {horario}
                    </Button>
                  );
                })}
              </div>
            </div>
          );
        })}
        
        <div className="pt-4 border-t">
          <Button 
            onClick={salvarHorarios} 
            disabled={saving}
            className="w-full md:w-auto"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Horários
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default HorariosFuncionamento;