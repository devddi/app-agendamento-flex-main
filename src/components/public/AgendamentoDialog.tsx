import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AgendamentoDialogProps {
  servico: {
    id: string;
    nome: string;
    duracao_minutos: number;
    preco: number;
  };
  empresa: {
    id: string;
    nome: string;
  };
  open: boolean;
  onClose: () => void;
}

const AgendamentoDialog = ({ servico, empresa, open, onClose }: AgendamentoDialogProps) => {
  const { toast } = useToast();
  const [step, setStep] = useState<'calendar' | 'phone' | 'form' | 'confirm'>('calendar');
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState("");
  const [telefone, setTelefone] = useState("");
  const [clienteExistente, setClienteExistente] = useState<any>(null);
  const [formData, setFormData] = useState({
    nome: "",
    data_nascimento: "",
  });
  const [horariosDisponiveis, setHorariosDisponiveis] = useState<string[]>([]);

  // Helpers para fuso horário do Brasil (America/Sao_Paulo)
  const getBRDateString = (date: Date) => {
    const fmt = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return fmt.format(date); // YYYY-MM-DD
  };

  const isDateBeforeBR = (date: Date, reference: Date) => {
    return getBRDateString(date) < getBRDateString(reference);
  };

  const getBRNowMinutes = () => {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Sao_Paulo',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(new Date());
    const hh = Number(parts.find(p => p.type === 'hour')?.value || '0');
    const mm = Number(parts.find(p => p.type === 'minute')?.value || '0');
    return hh * 60 + mm;
  };

  const getBRWeekdayNumber = (date: Date) => {
    const weekday = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Sao_Paulo',
      weekday: 'long',
    }).format(date);
    const map: Record<string, number> = {
      Sunday: 0,
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6,
    };
    return map[weekday] ?? date.getDay();
  };

  const isHorarioPassado = (hora: string) => {
    if (!selectedDate) return false;
    // Desabilitar horários passados apenas para o dia atual no fuso brasileiro
    if (getBRDateString(selectedDate) !== getBRDateString(new Date())) return false;
    const [hh, mm] = hora.split(':').map(Number);
    return hh * 60 + mm < getBRNowMinutes();
  };

  const formatTelefone = (value: string) => {
    // Remove todos os caracteres não numéricos
    const numbers = value.replace(/\D/g, '');
    
    // Aplica a máscara (XX) X XXXX-XXXX
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 3) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    } else if (numbers.length <= 7) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 3)} ${numbers.slice(3)}`;
    } else {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 3)} ${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
    }
  };

  // Buscar horários disponíveis da empresa para a data selecionada
  const fetchHorariosDisponiveis = async (data: Date) => {
    try {
      const diaSemana = getBRWeekdayNumber(data);
      const dataFormatada = getBRDateString(data);
      
      // Buscar horários de funcionamento
      const responseHorarios = await (supabase as any)
        .from('horarios_funcionamento')
        .select('horario')
        .eq('empresa_id', empresa.id)
        .eq('dia_semana', diaSemana)
        .eq('ativo', true)
        .order('horario');
      
      if (responseHorarios.error) throw responseHorarios.error;
      
      // Buscar agendamentos já marcados (confirmados ou pendentes) para esta data
      const { data: agendamentos, error: agendamentosError } = await supabase
        .from('agendamentos')
        .select('hora')
        .eq('empresa_id', empresa.id)
        .eq('data', dataFormatada)
        .in('status', ['confirmado', 'pendente']);
      
      if (agendamentosError) throw agendamentosError;
      
      // Converter horários ocupados para formato HH:MM
      const horariosOcupados = agendamentos?.map(a => {
        if (typeof a.hora === 'string') {
          // Se já é string, garantir formato HH:MM
          return a.hora.slice(0, 5);
        }
        return a.hora;
      }) || [];

      const horariosFormatados = (responseHorarios.data as any[])?.map((h: any) => 
        typeof h.horario === 'string' ? h.horario.slice(0, 5) : h.horario
      ) || [];
      
      // Filtrar horários que não estão ocupados
      const horariosLivres = horariosFormatados.filter(horario => 
        !horariosOcupados.includes(horario)
      );
      
      setHorariosDisponiveis(horariosLivres);
    } catch (error: any) {
      console.error('Erro ao buscar horários:', error);
      setHorariosDisponiveis([]);
    }
  };

  const handleSelectTime = async (hora: string) => {
    setSelectedTime(hora);
    setStep('phone');
  };

  // Buscar horários quando uma data for selecionada
  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      fetchHorariosDisponiveis(date);
    } else {
      setHorariosDisponiveis([]);
    }
  };

  const handleCheckTelefone = async () => {
    if (telefone.length < 10) {
      toast({
        title: "Telefone inválido",
        description: "Digite um telefone válido",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('empresa_id', empresa.id)
        .eq('telefone', telefone)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setClienteExistente(data);
        setStep('confirm');
      } else {
        setStep('form');
      }
    } catch (error: any) {
      toast({
        title: "Erro ao verificar telefone",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedDate || !selectedTime) return;

    setLoading(true);
    try {
      let clienteId = clienteExistente?.id;

      // Se não existe cliente, criar
      if (!clienteId) {
        const { data: novoCliente, error: clienteError } = await supabase
          .from('clientes')
          .insert({
            empresa_id: empresa.id,
            nome: formData.nome,
            telefone: telefone,
            data_nascimento: formData.data_nascimento || null,
          })
          .select()
          .single();

        if (clienteError) throw clienteError;
        clienteId = novoCliente.id;
      }

      // Criar agendamento
      const { error: agendamentoError } = await supabase
        .from('agendamentos')
        .insert({
          empresa_id: empresa.id,
          cliente_id: clienteId,
          servico_id: servico.id,
          data: getBRDateString(selectedDate),
          hora: selectedTime + ':00', // Garantir formato TIME (HH:MM:SS)
          status: 'pendente',
        });

      if (agendamentoError) throw agendamentoError;

      // Atualizar lista de horários disponíveis após confirmar
      await fetchHorariosDisponiveis(selectedDate);

      toast({
        title: "🎉 Agendamento confirmado!",
        description: "Você receberá uma confirmação no WhatsApp em breve.",
      });

      onClose();
      resetForm();
    } catch (error: any) {
      toast({
        title: "Erro ao confirmar agendamento",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep('calendar');
    setSelectedDate(undefined);
    setSelectedTime("");
    setTelefone("");
    setClienteExistente(null);
    setFormData({ nome: "", data_nascimento: "" });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="glass border-primary/20 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Agendar {servico.nome}</DialogTitle>
          <DialogDescription>
            Duração: {servico.duracao_minutos} min • Valor: R$ {servico.preco.toFixed(2)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {step === 'calendar' && (
            <>
              <div className="space-y-4">
                <h3 className="font-semibold text-center">Escolha a data</h3>
                <div className="flex justify-center">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    disabled={(date) => isDateBeforeBR(date as Date, new Date())}
                    locale={ptBR}
                    className="rounded-2xl glass border-primary/20 p-4"
                  />
                </div>
              </div>
              
              {selectedDate && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-center">Escolha o horário</h3>
                  {horariosDisponiveis.length === 0 ? (
                    <div className="text-center p-6 text-muted-foreground">
                      <p>Nenhum horário disponível para esta data</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-2">
                      {horariosDisponiveis.map((hora) => (
                        <Button
                          key={hora}
                          variant="outline"
                          className="glass"
                          onClick={() => handleSelectTime(hora)}
                          disabled={isHorarioPassado(hora)}
                        >
                          {hora}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {step === 'phone' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="telefone">Seu Telefone</Label>
                <Input
                  id="telefone"
                  value={telefone}
                  onChange={(e) => {
                    const formatted = formatTelefone(e.target.value);
                    setTelefone(formatted);
                  }}
                  placeholder="(XX) X XXXX-XXXX"
                  className="glass"
                  maxLength={16}
                />
              </div>
              <Button onClick={handleCheckTelefone} className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  'Continuar'
                )}
              </Button>
            </div>
          )}

          {step === 'form' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Complete seus dados para finalizar o agendamento
              </p>
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="glass"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="data_nascimento">Data de Nascimento</Label>
                <Input
                  id="data_nascimento"
                  type="date"
                  value={formData.data_nascimento}
                  onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
                  className="glass"
                />
              </div>
              <Button onClick={handleConfirm} className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Confirmando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Confirmar Agendamento
                  </>
                )}
              </Button>
            </div>
          )}

          {step === 'confirm' && clienteExistente && selectedDate && (
            <div className="space-y-6">
              <div className="glass rounded-2xl p-6 space-y-4">
                <p className="text-lg">
                  👋 Olá <span className="font-bold text-primary">{clienteExistente.nome}</span>!
                </p>
                <p className="text-muted-foreground">Confirme seu agendamento:</p>
                <div className="space-y-2 text-sm">
                  <p><span className="font-semibold">Serviço:</span> {servico.nome}</p>
                  <p><span className="font-semibold">Data:</span> {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
                  <p><span className="font-semibold">Hora:</span> {selectedTime}</p>
                  <p><span className="font-semibold">Empresa:</span> {empresa.nome}</p>
                </div>
              </div>
              <Button onClick={handleConfirm} className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Confirmando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Confirmar Agendamento
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AgendamentoDialog;
