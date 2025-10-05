import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Calendar as CalendarIcon, Clock, User, Loader2, X, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Agendamento {
  id: string;
  data: string;
  hora: string;
  status: string;
  cliente: {
    nome: string;
    telefone: string;
  };
  servico: {
    nome: string;
    duracao_minutos: number;
    preco: number;
  };
}

interface AgendaManagerProps {
  empresaId: string;
}

const AgendaManager = ({ empresaId }: AgendaManagerProps) => {
  const { toast } = useToast();
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgendamentos();
  }, [empresaId]);

  const fetchAgendamentos = async () => {
    try {
      const { data, error } = await supabase
        .from('agendamentos')
        .select(`
          id,
          data,
          hora,
          status,
          cliente:clientes(nome, telefone),
          servico:servicos(nome, duracao_minutos, preco)
        `)
        .eq('empresa_id', empresaId)
        .order('data', { ascending: true })
        .order('hora', { ascending: true });

      if (error) throw error;
      setAgendamentos(data as any || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar agendamentos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelar = async (id: string) => {
    if (!confirm('Tem certeza que deseja cancelar este agendamento?')) return;

    try {
      const { error } = await supabase
        .from('agendamentos')
        .update({ status: 'cancelado' })
        .eq('id', id);

      if (error) throw error;
      toast({ title: "Agendamento cancelado!" });
      fetchAgendamentos();
    } catch (error: any) {
      toast({
        title: "Erro ao cancelar agendamento",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleReverterCancelamento = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('agendamentos')
        .select('status')
        .eq('id', id)
        .single();

      if (error) throw error;

      const statusAtual = data?.status || 'pendente';
      const statusRestaurado = statusAtual === 'cancelado' ? 'pendente' : statusAtual;

      if (statusAtual !== 'cancelado') {
        toast({ title: "Este agendamento não está cancelado." });
        return;
      }

      const { error: updateError } = await supabase
        .from('agendamentos')
        .update({ status: statusRestaurado })
        .eq('id', id);

      if (updateError) throw updateError;
      toast({ title: "Cancelamento revertido!" });
      fetchAgendamentos();
    } catch (error: any) {
      toast({
        title: "Erro ao reverter cancelamento",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmado':
        return 'bg-primary/20 text-primary';
      case 'cancelado':
        return 'bg-destructive/20 text-destructive';
      case 'pendente':
        return 'bg-yellow-500/20 text-yellow-500';
      default:
        return 'bg-muted';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Agenda de Atendimentos</h2>
        <p className="text-muted-foreground">Gerencie seus agendamentos</p>
      </div>

      <div className="grid gap-4">
        {agendamentos.length === 0 ? (
          <Card className="glass border-primary/20">
            <CardContent className="p-12 text-center">
              <CalendarIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Nenhum agendamento encontrado</p>
            </CardContent>
          </Card>
        ) : (
          agendamentos.map((agendamento) => (
            <Card key={agendamento.id} className="glass border-primary/20 hover:border-primary/50 smooth-transition">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      <CalendarIcon className="w-5 h-5 text-primary" />
                      {format(new Date(agendamento.data + 'T00:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {agendamento.hora} - {agendamento.servico.nome}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(agendamento.status)}>
                    {agendamento.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{agendamento.cliente.nome}</span>
                  <span className="text-muted-foreground">• {agendamento.cliente.telefone}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Duração: </span>
                    <span className="font-medium">{agendamento.servico.duracao_minutos} min</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Valor: </span>
                    <span className="font-bold text-primary">R$ {agendamento.servico.preco.toFixed(2)}</span>
                  </div>
                </div>
                {agendamento.status !== 'cancelado' ? (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleCancelar(agendamento.id)}
                    className="w-full"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancelar Agendamento
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleReverterCancelamento(agendamento.id)}
                    className="w-full"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reverter Cancelamento
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default AgendaManager;
