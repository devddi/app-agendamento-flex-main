import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, DollarSign, Tag } from 'lucide-react';

interface Categoria {
  id: string;
  nome: string;
  tipo: 'receita' | 'despesa';
  cor: string;
}

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

interface FinalizarAtendimentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  agendamento: Agendamento | null;
  empresaId: string;
  onSuccess: () => void;
}

const FinalizarAtendimentoModal: React.FC<FinalizarAtendimentoModalProps> = ({
  isOpen,
  onClose,
  agendamento,
  empresaId,
  onSuccess
}) => {
  const { toast } = useToast();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(false);
  const [categoriaId, setCategoriaId] = useState<string>('');
  const [valor, setValor] = useState<number>(0);

  useEffect(() => {
    if (isOpen && agendamento) {
      setValor(agendamento.servico.preco);
      carregarCategorias();
    }
  }, [isOpen, agendamento, empresaId]);

  const carregarCategorias = async () => {
    try {
      const { data, error } = await supabase
        .from('categorias_financeiras')
        .select('*')
        .eq('empresa_id', empresaId)
        .eq('tipo', 'receita')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      
      setCategorias(data || []);
      
      // Selecionar automaticamente a categoria "Serviços" se existir
      const categoriaServicos = data?.find(cat => cat.nome.toLowerCase().includes('serviço'));
      if (categoriaServicos) {
        setCategoriaId(categoriaServicos.id);
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as categorias de receita.",
        variant: "destructive",
      });
    }
  };

  const handleFinalizar = async () => {
    if (!agendamento || !categoriaId || valor <= 0) {
      toast({
        title: "Dados incompletos",
        description: "Por favor, selecione uma categoria e informe um valor válido.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // 1. Atualizar status do agendamento para finalizado
      const { error: agendamentoError } = await supabase
        .from('agendamentos')
        .update({ status: 'finalizado' })
        .eq('id', agendamento.id);

      if (agendamentoError) throw agendamentoError;

      // 2. Criar lançamento financeiro
      const { error: financeiroError } = await supabase
        .from('lancamentos_financeiros')
        .insert({
          empresa_id: empresaId,
          categoria_id: categoriaId,
          tipo: 'receita',
          descricao: agendamento.servico.nome,
          valor: valor,
          data_lancamento: agendamento.data,
          observacao: `Atendimento finalizado - Cliente: ${agendamento.cliente.nome}`
        });

      if (financeiroError) throw financeiroError;

      toast({
        title: "Atendimento finalizado!",
        description: "O atendimento foi finalizado e a receita foi registrada automaticamente.",
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Erro ao finalizar atendimento:', error);
      toast({
        title: "Erro ao finalizar atendimento",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCategoriaId('');
    setValor(0);
    onClose();
  };

  if (!agendamento) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            Finalizar Atendimento
          </DialogTitle>
          <DialogDescription>
            Confirme os dados da receita que será registrada automaticamente no sistema financeiro.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Informações do Agendamento */}
          <div className="bg-muted/50 p-3 rounded-lg space-y-2">
            <div className="text-sm">
              <span className="font-medium">Serviço:</span> {agendamento.servico.nome}
            </div>
            <div className="text-sm">
              <span className="font-medium">Cliente:</span> {agendamento.cliente.nome}
            </div>
            <div className="text-sm">
              <span className="font-medium">Data:</span> {new Date(agendamento.data + 'T00:00:00').toLocaleDateString('pt-BR')}
            </div>
          </div>

          {/* Seleção de Categoria */}
          <div className="space-y-2">
            <Label htmlFor="categoria" className="flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Categoria de Receita
            </Label>
            <Select value={categoriaId} onValueChange={setCategoriaId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categorias.map((categoria) => (
                  <SelectItem key={categoria.id} value={categoria.id}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: categoria.cor }}
                      />
                      {categoria.nome}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Edição do Valor */}
          <div className="space-y-2">
            <Label htmlFor="valor" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Valor da Receita
            </Label>
            <Input
              id="valor"
              type="number"
              step="0.01"
              min="0"
              value={valor}
              onChange={(e) => setValor(parseFloat(e.target.value) || 0)}
              placeholder="0,00"
            />
            <p className="text-xs text-muted-foreground">
              Valor padrão baseado no preço do serviço. Você pode editar se necessário.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleFinalizar} disabled={loading || !categoriaId || valor <= 0}>
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Finalizando...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Finalizar Atendimento
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FinalizarAtendimentoModal;