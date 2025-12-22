import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Calendar as CalendarIcon, Clock, User, Tag } from "lucide-react";

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

interface EditarAgendamentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  agendamento: Agendamento | null;
  empresaId: string;
  onSuccess: () => void;
}

const EditarAgendamentoModal = ({
  isOpen,
  onClose,
  agendamento,
  empresaId,
  onSuccess,
}: EditarAgendamentoModalProps) => {
  const { toast } = useToast();
  const [data, setData] = useState<string>("");
  const [hora, setHora] = useState<string>("");
  const [status, setStatus] = useState<string>("pendente");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && agendamento) {
      setData(agendamento.data);
      setHora(agendamento.hora?.substring(0, 5) || "");
      setStatus(agendamento.status || "pendente");
    }
  }, [isOpen, agendamento]);

  const handleSalvar = async () => {
    if (!agendamento) return;
    if (!data || !hora) {
      toast({
        title: "Dados incompletos",
        description: "Informe data e hora.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase
        .from("agendamentos")
        .update({
          data,
          hora: `${hora}:00`,
          status,
        })
        .eq("id", agendamento.id)
        .eq("empresa_id", empresaId);
      if (error) throw error;
      toast({
        title: "Agendamento atualizado",
        description: "As alterações foram salvas.",
      });
      onSuccess();
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Tente novamente.";
      toast({
        title: "Erro ao atualizar",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  if (!agendamento) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="glass border-primary/20 max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Agendamento</DialogTitle>
          <DialogDescription>Altere data, hora e status do agendamento.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted/30 p-3 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">{agendamento.cliente.nome}</span>
              <span className="text-muted-foreground">• {agendamento.cliente.telefone}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Tag className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">{agendamento.servico.nome}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data">Data</Label>
              <div className="relative">
                <CalendarIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="data"
                  type="date"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="hora">Hora</Label>
              <div className="relative">
                <Clock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="hora"
                  type="time"
                  value={hora}
                  onChange={(e) => setHora(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Selecione um status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="secondary" onClick={handleClose} disabled={loading}>
              Voltar
            </Button>
            <Button type="button" onClick={handleSalvar} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>Salvar Alterações</>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditarAgendamentoModal;
