import React, { useState, useEffect } from 'react';
import { supabase } from '../../integrations/supabase/client';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Save, X, Plus } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';

interface Categoria {
  id: string;
  nome: string;
  tipo: 'receita' | 'despesa';
  cor: string;
}

interface Lancamento {
  id?: string;
  tipo: 'receita' | 'despesa';
  descricao: string;
  valor: number;
  data_lancamento: string;
  observacao?: string;
  categoria_id: string;
}

interface FormularioFinanceiroProps {
  empresaId: string;
  lancamentoEdicao?: Lancamento | null;
  onSalvar: () => void;
  onCancelar: () => void;
  hideCancelButton?: boolean;
}

const FormularioFinanceiro: React.FC<FormularioFinanceiroProps> = ({
  empresaId,
  lancamentoEdicao,
  onSalvar,
  onCancelar,
  hideCancelButton = false
}) => {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<Lancamento>({
    tipo: 'receita',
    descricao: '',
    valor: 0,
    data_lancamento: new Date().toISOString().split('T')[0],
    observacao: '',
    categoria_id: 'selecione'
  });
  const { toast } = useToast();

  useEffect(() => {
    carregarCategorias();
  }, [empresaId]);

  useEffect(() => {
    if (lancamentoEdicao) {
      setForm({
        ...lancamentoEdicao,
        data_lancamento: lancamentoEdicao.data_lancamento.split('T')[0]
      });
    } else {
      setForm({
        tipo: 'receita',
        descricao: '',
        valor: 0,
        data_lancamento: new Date().toISOString().split('T')[0],
        observacao: '',
        categoria_id: 'selecione'
      });
    }
  }, [lancamentoEdicao]);



  const carregarCategorias = async () => {
    try {
      const { data, error } = await supabase
        .from('categorias_financeiras')
        .select('*')
        .eq('empresa_id', empresaId)
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setCategorias(data || []);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as categorias.",
        variant: "destructive",
      });
    }
  };

  const validarFormulario = () => {
    if (!form.descricao.trim()) {
      toast({
        title: "Erro",
        description: "Descrição é obrigatória.",
        variant: "destructive",
      });
      return false;
    }

    if (form.valor <= 0) {
      toast({
        title: "Erro",
        description: "Valor deve ser maior que zero.",
        variant: "destructive",
      });
      return false;
    }

    if (!form.categoria_id || form.categoria_id === 'selecione') {
      toast({
        title: "Erro",
        description: "Categoria é obrigatória.",
        variant: "destructive",
      });
      return false;
    }

    if (!form.data_lancamento) {
      toast({
        title: "Erro",
        description: "Data é obrigatória.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const salvarLancamento = async () => {
    if (!validarFormulario()) return;

    setLoading(true);
    try {
      const dadosLancamento = {
        empresa_id: empresaId,
        tipo: form.tipo,
        descricao: form.descricao.trim(),
        valor: form.valor,
        data_lancamento: form.data_lancamento,
        observacao: form.observacao?.trim() || null,
        categoria_id: form.categoria_id
      };

      if (lancamentoEdicao?.id) {
        // Atualizar lançamento existente
        const { error } = await supabase
          .from('lancamentos_financeiros')
          .update(dadosLancamento)
          .eq('id', lancamentoEdicao.id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Lançamento atualizado com sucesso!",
        });
      } else {
        // Criar novo lançamento
        const { error } = await supabase
          .from('lancamentos_financeiros')
          .insert(dadosLancamento);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Lançamento adicionado com sucesso!",
        });
      }

      onSalvar();
    } catch (error) {
      console.error('Erro ao salvar lançamento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o lançamento.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const categoriasDoTipo = categorias.filter(cat => cat.tipo === form.tipo);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          {lancamentoEdicao ? (
            <>
              <Save className="w-5 h-5 mr-2" />
              Editar Lançamento
            </>
          ) : (
            <>
              <Plus className="w-5 h-5 mr-2" />
              Novo Lançamento
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tipo */}
        <div>
          <Label htmlFor="tipo">Tipo</Label>
          <div className="flex gap-4 mt-2">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="tipo"
                value="receita"
                checked={form.tipo === 'receita'}
                onChange={(e) => {
                  const novoTipo = e.target.value as 'receita' | 'despesa';
                  // Se não estamos editando um lançamento, limpar a categoria ao mudar o tipo
                  const novaCategoria = !lancamentoEdicao ? 'selecione' : form.categoria_id;
                  setForm({ ...form, tipo: novoTipo, categoria_id: novaCategoria });
                }}
                className="text-green-600"
              />
              <span className="text-green-600 font-medium">Receita</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="tipo"
                value="despesa"
                checked={form.tipo === 'despesa'}
                onChange={(e) => {
                  const novoTipo = e.target.value as 'receita' | 'despesa';
                  // Se não estamos editando um lançamento, limpar a categoria ao mudar o tipo
                  const novaCategoria = !lancamentoEdicao ? 'selecione' : form.categoria_id;
                  setForm({ ...form, tipo: novoTipo, categoria_id: novaCategoria });
                }}
                className="text-red-600"
              />
              <span className="text-red-600 font-medium">Despesa</span>
            </label>
          </div>
        </div>

        {/* Descrição */}
        <div>
          <Label htmlFor="descricao">Descrição *</Label>
          <Input
            id="descricao"
            value={form.descricao}
            onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            placeholder="Descrição do lançamento"
            maxLength={255}
          />
        </div>

        {/* Valor e Data */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="valor">Valor *</Label>
            <Input
              id="valor"
              type="number"
              step="0.01"
              min="0.01"
              value={form.valor || ''}
              onChange={(e) => setForm({ ...form, valor: parseFloat(e.target.value) || 0 })}
              placeholder="0,00"
            />
          </div>
          <div>
            <Label htmlFor="data">Data *</Label>
            <Input
              id="data"
              type="date"
              value={form.data_lancamento}
              onChange={(e) => setForm({ ...form, data_lancamento: e.target.value })}
            />
          </div>
        </div>

        {/* Categoria */}
        <div>
          <Label htmlFor="categoria">Categoria *</Label>
          <Select
            value={form.categoria_id}
            onValueChange={(value) => setForm({ ...form, categoria_id: value })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione uma categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="selecione">Selecione uma categoria</SelectItem>
              {categoriasDoTipo.map((categoria) => (
                <SelectItem key={categoria.id} value={categoria.id}>
                  {categoria.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {categoriasDoTipo.length === 0 && (
            <p className="text-sm text-gray-500 mt-1">
              Nenhuma categoria de {form.tipo} encontrada. Crie uma categoria primeiro.
            </p>
          )}
        </div>

        {/* Observação */}
        <div>
          <Label htmlFor="observacao">Observação</Label>
          <Textarea
            id="observacao"
            value={form.observacao || ''}
            onChange={(e) => setForm({ ...form, observacao: e.target.value })}
            placeholder="Observações adicionais (opcional)"
            rows={3}
          />
        </div>

        {/* Botões */}
        <div className="flex gap-3 pt-4">
          <Button 
            onClick={salvarLancamento} 
            disabled={loading}
            className={hideCancelButton ? "w-full" : "flex-1"}
          >
            {loading ? (
              'Salvando...'
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {lancamentoEdicao ? 'Atualizar' : 'Salvar'}
              </>
            )}
          </Button>
          {!hideCancelButton && (
            <Button variant="outline" onClick={onCancelar} disabled={loading}>
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
          )}
        </div>

        <div className="text-sm text-gray-500 pt-2">
          * Campos obrigatórios
        </div>
      </CardContent>
    </Card>
  );
};

export default FormularioFinanceiro;