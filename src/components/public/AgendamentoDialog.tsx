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

  const horarios = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
    "16:00", "16:30", "17:00", "17:30"
  ];

  const handleSelectTime = async (hora: string) => {
    setSelectedTime(hora);
    setStep('phone');
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
          data: format(selectedDate, 'yyyy-MM-dd'),
          hora: selectedTime,
          status: 'confirmado',
        });

      if (agendamentoError) throw agendamentoError;

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
                <h3 className="font-semibold">Escolha a data</h3>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date() || date.getDay() === 0}
                  locale={ptBR}
                  className="rounded-2xl glass border-primary/20 p-4"
                />
              </div>
              
              {selectedDate && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Escolha o horário</h3>
                  <div className="grid grid-cols-4 gap-2">
                    {horarios.map((hora) => (
                      <Button
                        key={hora}
                        variant="outline"
                        className="glass"
                        onClick={() => handleSelectTime(hora)}
                      >
                        {hora}
                      </Button>
                    ))}
                  </div>
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
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="(00) 00000-0000"
                  className="glass"
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
