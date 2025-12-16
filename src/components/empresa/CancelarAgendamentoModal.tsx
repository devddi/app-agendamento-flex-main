import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ptBR } from "date-fns/locale";
import { format } from "date-fns";

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

interface CancelarAgendamentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  agendamento: Agendamento | null;
  onConfirm: () => void;
  loading?: boolean;
}

const CancelarAgendamentoModal = ({
  isOpen,
  onClose,
  agendamento,
  onConfirm,
  loading,
}: CancelarAgendamentoModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="glass border-primary/20 max-w-lg">
        <DialogHeader>
          <DialogTitle>Cancelar Agendamento</DialogTitle>
          <DialogDescription>
            Confirme para cancelar este agendamento. Esta ação pode ser revertida depois.
          </DialogDescription>
        </DialogHeader>
        {agendamento && (
          <div className="space-y-2 text-sm">
            <p>
              <span className="font-semibold">Cliente:</span> {agendamento.cliente.nome} • {agendamento.cliente.telefone}
            </p>
            <p>
              <span className="font-semibold">Serviço:</span> {agendamento.servico.nome} • {agendamento.servico.duracao_minutos} min
            </p>
            <p>
              <span className="font-semibold">Data:</span>{" "}
              {format(new Date(agendamento.data + "T00:00:00"), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
            <p>
              <span className="font-semibold">Hora:</span> {agendamento.hora.substring(0, 5)}
            </p>
          </div>
        )}
        <div className="grid grid-cols-2 gap-2 mt-4">
          <Button type="button" variant="secondary" onClick={onClose} disabled={!!loading}>
            Voltar
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm} disabled={!!loading}>
            Confirmar Cancelamento
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CancelarAgendamentoModal;
