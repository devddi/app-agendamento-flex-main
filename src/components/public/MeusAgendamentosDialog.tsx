import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Calendar, Clock, User, DollarSign, Phone } from "lucide-react";

interface MeusAgendamentosDialogProps {
  open: boolean;
  onClose: () => void;
  empresaId: string;
}

interface Agendamento {
  id: string;
  data: string;
  hora: string;
  status: string;
  servico: {
    nome: string;
    duracao_minutos: number;
    preco: number;
  };
  cliente: {
    nome: string;
    telefone: string;
  };
}

const MeusAgendamentosDialog = ({ open, onClose, empresaId }: MeusAgendamentosDialogProps) => {
  const { toast } = useToast();
  const [telefone, setTelefone] = useState("");
  const [loading, setLoading] = useState(false);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [showAgendamentos, setShowAgendamentos] = useState(false);

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  };

  const formatTime = (timeString: string) => {
    // Remove seconds from time string (HH:MM:SS -> HH:MM)
    return timeString.substring(0, 5);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmado':
        return 'bg-green-500/20 text-green-700 border-green-500/30';
      case 'pendente':
        return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30';
      case 'cancelado':
        return 'bg-red-500/20 text-red-700 border-red-500/30';
      case 'concluido':
      case 'finalizado':
        return 'bg-green-500/20 text-green-700 border-green-500/30';
      default:
        return 'bg-gray-500/20 text-gray-700 border-gray-500/30';
    }
  };

  const buscarAgendamentos = async () => {
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
      // Primeiro, buscar o cliente pelo telefone
      const { data: cliente, error: clienteError } = await supabase
        .from('clientes')
        .select('id')
        .eq('empresa_id', empresaId)
        .eq('telefone', telefone)
        .single();

      if (clienteError) {
        if (clienteError.code === 'PGRST116') {
          toast({
            title: "Nenhum agendamento encontrado",
            description: "Não encontramos agendamentos para este telefone.",
            variant: "destructive",
          });
        } else {
          throw clienteError;
        }
        return;
      }

      // Buscar agendamentos do cliente
      const { data: agendamentosData, error: agendamentosError } = await supabase
        .from('agendamentos')
        .select(`
          id,
          data,
          hora,
          status,
          servicos!inner(nome, duracao_minutos, preco),
          clientes!inner(nome, telefone)
        `)
        .eq('empresa_id', empresaId)
        .eq('cliente_id', cliente.id)
        .order('data', { ascending: false })
        .order('hora', { ascending: false });

      if (agendamentosError) throw agendamentosError;

      // Transformar os dados para o formato esperado
      const agendamentosFormatados = agendamentosData?.map(agendamento => ({
        id: agendamento.id,
        data: agendamento.data,
        hora: agendamento.hora,
        status: agendamento.status,
        servico: {
          nome: agendamento.servicos.nome,
          duracao_minutos: agendamento.servicos.duracao_minutos,
          preco: agendamento.servicos.preco,
        },
        cliente: {
          nome: agendamento.clientes.nome,
          telefone: agendamento.clientes.telefone,
        },
      })) || [];

      setAgendamentos(agendamentosFormatados);
      setShowAgendamentos(true);

      if (agendamentosFormatados.length === 0) {
        toast({
          title: "Nenhum agendamento encontrado",
          description: "Você ainda não possui agendamentos.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro ao buscar agendamentos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetDialog = () => {
    setTelefone("");
    setAgendamentos([]);
    setShowAgendamentos(false);
  };

  const handleClose = () => {
    resetDialog();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="glass border-primary/20 max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Meus Agendamentos</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {!showAgendamentos ? (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Digite seu telefone para visualizar seus agendamentos
              </p>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
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
              <Button onClick={buscarAgendamentos} className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Buscando...
                  </>
                ) : (
                  <>
                    <Phone className="w-4 h-4 mr-2" />
                    Buscar Agendamentos
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  Seus Agendamentos ({agendamentos.length})
                </h3>
              </div>

              {agendamentos.length === 0 ? (
                <Card className="glass border-primary/20">
                  <CardContent className="p-8 text-center">
                    <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      Você ainda não possui agendamentos.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {agendamentos.map((agendamento) => (
                    <Card key={agendamento.id} className="glass border-primary/20">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base sm:text-lg leading-tight">
                              {formatDate(agendamento.data)}
                            </CardTitle>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2 flex-wrap">
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {formatTime(agendamento.hora)}
                              </div>
                              <span className="hidden sm:inline">-</span>
                              <span className="truncate">{agendamento.servico.nome}</span>
                            </div>
                          </div>
                          <Badge className={`${getStatusColor(agendamento.status)} text-xs px-2 py-1 shrink-0`}>
                            {agendamento.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3 pt-0">
                        <div className="flex items-center gap-2 text-sm flex-wrap">
                          <User className="w-4 h-4 text-muted-foreground shrink-0" />
                          <span className="font-medium truncate">{agendamento.cliente.nome}</span>
                          <span className="text-muted-foreground">• {agendamento.cliente.telefone}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                          <div className="text-sm">
                            <span className="text-muted-foreground">Duração: </span>
                            <span className="font-medium">{agendamento.servico.duracao_minutos} min</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm">
                            <DollarSign className="w-4 h-4 text-primary" />
                            <span className="font-bold text-primary">R$ {agendamento.servico.preco.toFixed(2)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MeusAgendamentosDialog;