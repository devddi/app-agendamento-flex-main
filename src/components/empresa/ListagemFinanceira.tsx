import React, { useState, useEffect } from 'react';
import { supabase } from '../../integrations/supabase/client';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Trash2, Edit, Filter, TrendingUp, TrendingDown, DollarSign, Search, X, Plus } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { useIsMobile } from '../../hooks/use-mobile';

interface Lancamento {
  id: string;
  tipo: 'receita' | 'despesa';
  descricao: string;
  valor: number;
  data_lancamento: string;
  observacao?: string;
  categoria_id: string;
  categorias_financeiras: {
    nome: string;
    cor: string;
  };
}

interface Categoria {
  id: string;
  nome: string;
  tipo: 'receita' | 'despesa';
  cor: string;
}

interface ListagemFinanceiraProps {
  empresaId: string;
  onEditarLancamento: (lancamento: Lancamento) => void;
  onNovoLancamento: () => void;
}

const ListagemFinanceira: React.FC<ListagemFinanceiraProps> = ({ empresaId, onEditarLancamento, onNovoLancamento }) => {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [lancamentoSelecionado, setLancamentoSelecionado] = useState<Lancamento | null>(null);
  const [filtros, setFiltros] = useState({
    dataInicio: '',
    dataFim: '',
    categoria: 'todas',
    tipo: 'todos',
    descricao: ''
  });
  const { toast } = useToast();
  const isMobile = useIsMobile();

  useEffect(() => {
    carregarDados();
  }, [empresaId]);

  useEffect(() => {
    carregarLancamentos();
  }, [filtros, empresaId]);

  const handleClickLancamento = (lancamento: Lancamento) => {
    if (isMobile) {
      setLancamentoSelecionado(lancamento);
      setModalAberto(true);
    }
  };

  const handleEditarModal = () => {
    if (lancamentoSelecionado) {
      onEditarLancamento(lancamentoSelecionado);
      setModalAberto(false);
    }
  };

  const handleExcluirModal = () => {
    if (lancamentoSelecionado) {
      excluirLancamento(lancamentoSelecionado.id);
      setModalAberto(false);
    }
  };

  const carregarDados = async () => {
    await Promise.all([carregarCategorias(), carregarLancamentos()]);
    setLoading(false);
  };

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
    }
  };

  const carregarLancamentos = async () => {
    try {
      let query = supabase
        .from('lancamentos_financeiros')
        .select(`
          *,
          categorias_financeiras (
            nome,
            cor
          )
        `)
        .eq('empresa_id', empresaId)
        .order('data_lancamento', { ascending: false });

      // Aplicar filtros
      if (filtros.dataInicio) {
        query = query.gte('data_lancamento', filtros.dataInicio);
      }
      if (filtros.dataFim) {
        query = query.lte('data_lancamento', filtros.dataFim);
      }
      if (filtros.categoria && filtros.categoria !== 'todas') {
        query = query.eq('categoria_id', filtros.categoria);
      }
      if (filtros.tipo && filtros.tipo !== 'todos') {
        query = query.eq('tipo', filtros.tipo);
      }
      if (filtros.descricao) {
        query = query.ilike('descricao', `%${filtros.descricao}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLancamentos(data || []);
    } catch (error) {
      console.error('Erro ao carregar lançamentos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os lançamentos.",
        variant: "destructive",
      });
    }
  };

  const excluirLancamento = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este lançamento?')) return;

    try {
      const { error } = await supabase
        .from('lancamentos_financeiros')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Lançamento excluído com sucesso!",
      });

      carregarLancamentos();
    } catch (error) {
      console.error('Erro ao excluir lançamento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o lançamento.",
        variant: "destructive",
      });
    }
  };

  const limparFiltros = () => {
    setFiltros({
      dataInicio: '',
      dataFim: '',
      categoria: 'todas',
      tipo: 'todos',
      descricao: ''
    });
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR');
  };

  // Cálculos dos totais
  const totalReceitas = lancamentos
    .filter(l => l.tipo === 'receita')
    .reduce((total, l) => total + l.valor, 0);

  const totalDespesas = lancamentos
    .filter(l => l.tipo === 'despesa')
    .reduce((total, l) => total + l.valor, 0);

  const saldo = totalReceitas - totalDespesas;

  if (loading) {
    return <div className="flex justify-center p-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho com botão de filtros */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestão Financeira</h2>
          <p className="text-muted-foreground">Gerencie suas receitas e despesas</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
            className="gap-2"
          >
            <Filter className="w-4 h-4" />
            Filtros
          </Button>
        </div>
      </div>

      {/* Resumo Financeiro */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4">
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex flex-col items-center text-center md:flex-row md:items-center md:text-left md:space-x-2">
              <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-green-600 mb-2 md:mb-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm text-gray-600 truncate">Receitas</p>
                <p className="text-sm md:text-lg font-bold text-green-600 truncate">{formatarMoeda(totalReceitas)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex flex-col items-center text-center md:flex-row md:items-center md:text-left md:space-x-2">
              <TrendingDown className="w-4 h-4 md:w-5 md:h-5 text-red-600 mb-2 md:mb-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm text-gray-600 truncate">Despesas</p>
                <p className="text-sm md:text-lg font-bold text-red-600 truncate">{formatarMoeda(totalDespesas)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex flex-col items-center text-center md:flex-row md:items-center md:text-left md:space-x-2">
              <DollarSign className={`w-4 h-4 md:w-5 md:h-5 mb-2 md:mb-0 ${saldo >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm text-gray-600 truncate">Saldo</p>
                <p className={`text-sm md:text-lg font-bold truncate ${saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatarMoeda(saldo)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      {mostrarFiltros && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filtros</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="categoria">Categoria</Label>
                <Select
                  value={filtros.categoria}
                  onValueChange={(value) => setFiltros({ ...filtros, categoria: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as categorias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas as categorias</SelectItem>
                    {categorias.map((categoria) => (
                      <SelectItem key={categoria.id} value={categoria.id}>
                        {categoria.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="tipo">Tipo</Label>
                <Select
                  value={filtros.tipo}
                  onValueChange={(value) => setFiltros({ ...filtros, tipo: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os tipos</SelectItem>
                    <SelectItem value="receita">Receita</SelectItem>
                    <SelectItem value="despesa">Despesa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="descricao"
                    placeholder="Buscar por descrição..."
                    value={filtros.descricao}
                    onChange={(e) => setFiltros({ ...filtros, descricao: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="dataInicio">Data Início</Label>
                <Input
                  id="dataInicio"
                  type="date"
                  value={filtros.dataInicio}
                  onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="dataFim">Data Fim</Label>
                <Input
                  id="dataFim"
                  type="date"
                  value={filtros.dataFim}
                  onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-4">
              <p className="text-sm text-gray-600">
                {lancamentos.length} lançamento(s) encontrado(s)
              </p>
              <Button variant="outline" onClick={limparFiltros} className="gap-2">
                <X className="w-4 h-4" />
                Limpar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Lançamentos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Lista de Lançamentos</CardTitle>
        </CardHeader>
        <CardContent>
          {lancamentos.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhum lançamento encontrado
            </div>
          ) : (
            <div className="space-y-2">
              {lancamentos.map((lancamento) => (
                <div
                  key={lancamento.id}
                  className={`p-4 border rounded-lg ${
                    isMobile ? 'cursor-pointer' : ''
                  }`}
                  onClick={() => handleClickLancamento(lancamento)}
                >
                  {isMobile ? (
                    // Layout Mobile
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          Categoria: {lancamento.categorias_financeiras.nome}
                        </span>
                      </div>
                      <div className="text-sm">
                        <strong>Descrição:</strong> {lancamento.descricao}
                      </div>
                      <div className="text-sm">
                        <strong>Data:</strong> {formatarData(lancamento.data_lancamento)}
                      </div>
                      <div className="text-sm">
                        <strong>Valor:</strong>{' '}
                        <span className={lancamento.tipo === 'receita' ? 'text-green-600' : 'text-red-600'}>
                          {lancamento.tipo === 'receita' ? '+' : '-'} {formatarMoeda(lancamento.valor)}
                        </span>
                      </div>
                      {lancamento.observacao && (
                        <div className="text-sm text-gray-600">
                          <strong>Observação:</strong> {lancamento.observacao}
                        </div>
                      )}
                    </div>
                  ) : (
                    // Layout Desktop
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{lancamento.descricao}</span>
                            <Badge variant={lancamento.tipo === 'receita' ? 'default' : 'destructive'}>
                              {lancamento.tipo}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {lancamento.categorias_financeiras.nome} • {formatarData(lancamento.data_lancamento)}
                            {lancamento.observacao && ` • ${lancamento.observacao}`}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`font-bold ${lancamento.tipo === 'receita' ? 'text-green-600' : 'text-red-600'}`}>
                          {lancamento.tipo === 'receita' ? '+' : '-'} {formatarMoeda(lancamento.valor)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditarLancamento(lancamento);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            excluirLancamento(lancamento.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal para ações mobile */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto text-black [&>button]:text-white [&>button]:hover:text-white [&>button]:opacity-100">
          <DialogHeader>
            <DialogTitle className="text-white">Ações do Lançamento</DialogTitle>
          </DialogHeader>
          {lancamentoSelecionado && (
            <div className="space-y-4">
              <Card className="bg-gray-50 border-gray-200">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-700">Categoria:</span>
                      <span className="font-medium text-black">
                        {lancamentoSelecionado.categorias_financeiras.nome}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-700">Descrição:</span>
                      <span className="font-medium text-black">{lancamentoSelecionado.descricao}</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-700">Data:</span>
                      <span className="font-medium text-black">{formatarData(lancamentoSelecionado.data_lancamento)}</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-700">Valor:</span>
                      <span className={`font-bold text-lg ${
                        lancamentoSelecionado.tipo === 'receita' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {lancamentoSelecionado.tipo === 'receita' ? '+' : '-'} {formatarMoeda(lancamentoSelecionado.valor)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="space-y-3 pt-4">
                <Button 
                  onClick={handleEditarModal} 
                  className="w-full"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar Lançamento
                </Button>
                <Button 
                  onClick={handleExcluirModal} 
                  variant="destructive"
                  className="w-full"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir Lançamento
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ListagemFinanceira;