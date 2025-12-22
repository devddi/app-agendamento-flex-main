import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Calendar as CalendarIcon, Clock, User, Loader2, X, RotateCcw, CheckCircle2, Filter, Search } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import FinalizarAtendimentoModal from "./FinalizarAtendimentoModal";
import CancelarAgendamentoModal from "./CancelarAgendamentoModal";
import EditarAgendamentoModal from "./EditarAgendamentoModal";

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

interface Filtros {
  data: string;
  cliente: string;
  status: string;
}

const AgendaManager = ({ empresaId }: AgendaManagerProps) => {
  const { toast } = useToast();
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [agendamentosFiltrados, setAgendamentosFiltrados] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState<Filtros>({
    data: "",
    cliente: "",
    status: "pendente"
  });
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [modalFinalizarAberto, setModalFinalizarAberto] = useState(false);
  const [agendamentoParaFinalizar, setAgendamentoParaFinalizar] = useState<Agendamento | null>(null);
  const [modalCancelarAberto, setModalCancelarAberto] = useState(false);
  const [agendamentoParaCancelar, setAgendamentoParaCancelar] = useState<Agendamento | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [modalEditarAberto, setModalEditarAberto] = useState(false);
  const [agendamentoParaEditar, setAgendamentoParaEditar] = useState<Agendamento | null>(null);

  useEffect(() => {
    fetchAgendamentos();
  }, [empresaId]);

  useEffect(() => {
    aplicarFiltros();
  }, [agendamentos, filtros]);

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

  const aplicarFiltros = () => {
    let resultado = [...agendamentos];

    // Filtro por data
    if (filtros.data) {
      resultado = resultado.filter(agendamento => 
        agendamento.data.includes(filtros.data)
      );
    }

    // Filtro por cliente
    if (filtros.cliente) {
      resultado = resultado.filter(agendamento => 
        agendamento.cliente.nome.toLowerCase().includes(filtros.cliente.toLowerCase()) ||
        agendamento.cliente.telefone.includes(filtros.cliente)
      );
    }

    // Filtro por status
    if (filtros.status) {
      resultado = resultado.filter(agendamento => 
        agendamento.status === filtros.status
      );
    }

    setAgendamentosFiltrados(resultado);
  };

  const limparFiltros = () => {
    setFiltros({
      data: "",
      cliente: "",
      status: ""
    });
  };

  const handleCancelar = (agendamento: Agendamento) => {
    setAgendamentoParaCancelar(agendamento);
    setModalCancelarAberto(true);
  };

  const confirmarCancelamento = async () => {
    if (!agendamentoParaCancelar) return;
    setCancelLoading(true);
    try {
      const { error } = await supabase
        .from('agendamentos')
        .update({ status: 'cancelado' })
        .eq('id', agendamentoParaCancelar.id);
      if (error) throw error;
      toast({ title: "Agendamento cancelado!" });
      setModalCancelarAberto(false);
      setAgendamentoParaCancelar(null);
      fetchAgendamentos();
    } catch (error: any) {
      toast({
        title: "Erro ao cancelar agendamento",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setCancelLoading(false);
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

  const handleFinalizar = (agendamento: Agendamento) => {
    setAgendamentoParaFinalizar(agendamento);
    setModalFinalizarAberto(true);
  };

  const handleEditar = (agendamento: Agendamento) => {
    setAgendamentoParaEditar(agendamento);
    setModalEditarAberto(true);
  };

  const handleFecharModal = () => {
    setModalFinalizarAberto(false);
    setAgendamentoParaFinalizar(null);
  };

  const handleSucessoFinalizacao = () => {
    fetchAgendamentos();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'cancelado':
        return 'bg-destructive/20 text-destructive';
      case 'pendente':
        return 'bg-yellow-500/20 text-yellow-500';
      case 'finalizado':
        return 'bg-emerald-500/20 text-emerald-600';
      default:
        return 'bg-muted';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'cancelado':
        return 'Cancelado';
      case 'pendente':
        return 'Pendente';
      case 'finalizado':
        return 'Finalizado';
      default:
        return status;
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Agenda de Atendimentos</h2>
          <p className="text-muted-foreground">Gerencie seus agendamentos</p>
        </div>
        <Button
          variant="outline"
          onClick={() => setMostrarFiltros(!mostrarFiltros)}
          className="gap-2"
        >
          <Filter className="w-4 h-4" />
          Filtros
        </Button>
      </div>

      {/* Painel de Filtros */}
      {mostrarFiltros && (
        <Card className="glass border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Search className="w-5 h-5" />
              Filtros de Busca
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="filtro-data">Data</Label>
                <Input
                  id="filtro-data"
                  type="date"
                  value={filtros.data}
                  onChange={(e) => setFiltros(prev => ({ ...prev, data: e.target.value }))}
                  placeholder="Filtrar por data"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="filtro-cliente">Cliente</Label>
                <Input
                  id="filtro-cliente"
                  value={filtros.cliente}
                  onChange={(e) => setFiltros(prev => ({ ...prev, cliente: e.target.value }))}
                  placeholder="Nome ou telefone do cliente"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="filtro-status">Status</Label>
                <Select
                  value={filtros.status || "todos"}
                  onValueChange={(value) => setFiltros(prev => ({ ...prev, status: value === "todos" ? "" : value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os status</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="finalizado">Finalizado</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex justify-between items-center pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                {agendamentosFiltrados.length} agendamento(s) encontrado(s)
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={limparFiltros}
                className="gap-2"
              >
                <X className="w-4 h-4" />
                Limpar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {agendamentosFiltrados.length === 0 ? (
          <Card className="glass border-primary/20">
            <CardContent className="p-12 text-center">
              <CalendarIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                {agendamentos.length === 0 
                  ? "Nenhum agendamento encontrado" 
                  : "Nenhum agendamento corresponde aos filtros aplicados"
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          agendamentosFiltrados.map((agendamento) => (
            <Card 
              key={agendamento.id} 
              className="glass border-primary/20 hover:border-primary/50 smooth-transition cursor-pointer"
              onClick={() => handleEditar(agendamento)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2 text-base md:text-xl">
                      <CalendarIcon className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                      {format(new Date(agendamento.data + 'T00:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 text-xs md:text-sm">
                      <Clock className="w-3 h-3 md:w-4 md:h-4" />
                      {agendamento.hora} - {agendamento.servico.nome}
                    </CardDescription>
                  </div>
                  <Badge className={`${getStatusColor(agendamento.status)} text-xs px-2 py-1 md:text-sm`}>
                    {getStatusLabel(agendamento.status)}
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
                {agendamento.status === 'cancelado' ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); handleReverterCancelamento(agendamento.id); }}
                    className="w-full h-8 text-xs md:h-9 md:text-sm"
                  >
                    <RotateCcw className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                    Reverter Cancelamento
                  </Button>
                ) : agendamento.status === 'finalizado' ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled
                    className="w-full h-8 text-xs md:h-9 md:text-sm"
                  >
                    <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                    Atendimento Finalizado
                  </Button>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); handleFinalizar(agendamento); }}
                      className="h-8 px-2 text-xs md:h-9 md:px-3 md:text-sm col-span-2 md:col-span-1"
                    >
                      <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                      Finalizar Atendimento
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); handleCancelar(agendamento); }}
                      className="h-8 px-2 text-xs md:h-9 md:px-3 md:text-sm col-span-2 md:col-span-1"
                    >
                      <X className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                      Cancelar Agendamento
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <FinalizarAtendimentoModal
        isOpen={modalFinalizarAberto}
        onClose={handleFecharModal}
        agendamento={agendamentoParaFinalizar}
        empresaId={empresaId}
        onSuccess={handleSucessoFinalizacao}
      />
      <CancelarAgendamentoModal
        isOpen={modalCancelarAberto}
        onClose={() => {
          setModalCancelarAberto(false);
          setAgendamentoParaCancelar(null);
        }}
        agendamento={agendamentoParaCancelar}
        onConfirm={confirmarCancelamento}
        loading={cancelLoading}
      />
      <EditarAgendamentoModal
        isOpen={modalEditarAberto}
        onClose={() => {
          setModalEditarAberto(false);
          setAgendamentoParaEditar(null);
        }}
        agendamento={agendamentoParaEditar}
        empresaId={empresaId}
        onSuccess={fetchAgendamentos}
      />
    </div>
  );
};

export default AgendaManager;
