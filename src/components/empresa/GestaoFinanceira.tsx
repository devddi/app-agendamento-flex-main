import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Plus, Settings, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import ListagemFinanceira from './ListagemFinanceira';
import FormularioFinanceiro from './FormularioFinanceiro';
import GerenciarCategorias from './GerenciarCategorias';

interface Lancamento {
  id?: string;
  tipo: 'receita' | 'despesa';
  descricao: string;
  valor: number;
  data_lancamento: string;
  observacao?: string;
  categoria_id: string;
}

interface GestaoFinanceiraProps {
  empresaId: string;
}

const GestaoFinanceira: React.FC<GestaoFinanceiraProps> = ({ empresaId }) => {
  const [abaSelecionada, setAbaSelecionada] = useState('listagem');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mostrarCategorias, setMostrarCategorias] = useState(false);
  const [lancamentoEdicao, setLancamentoEdicao] = useState<Lancamento | null>(null);
  
  // Estados para modais mobile
  const [modalFormularioAberto, setModalFormularioAberto] = useState(false);
  const [modalCategoriasAberto, setModalCategoriasAberto] = useState(false);

  const isMobile = () => window.innerWidth < 768;

  const handleNovoLancamento = () => {
    setLancamentoEdicao(null);
    if (isMobile()) {
      setModalFormularioAberto(true);
    } else {
      setMostrarFormulario(true);
      setAbaSelecionada('formulario');
    }
  };

  const handleEditarLancamento = (lancamento: Lancamento) => {
    setLancamentoEdicao(lancamento);
    if (isMobile()) {
      setModalFormularioAberto(true);
    } else {
      setMostrarFormulario(true);
      setAbaSelecionada('formulario');
    }
  };

  const handleSalvarLancamento = () => {
    setMostrarFormulario(false);
    setModalFormularioAberto(false);
    setLancamentoEdicao(null);
    setAbaSelecionada('listagem');
  };

  const handleCancelarFormulario = () => {
    setMostrarFormulario(false);
    setModalFormularioAberto(false);
    setLancamentoEdicao(null);
    setAbaSelecionada('listagem');
  };

  const handleGerenciarCategorias = () => {
    if (isMobile()) {
      setModalCategoriasAberto(true);
    } else {
      setMostrarCategorias(true);
    }
  };

  const handleFecharCategorias = () => {
    setMostrarCategorias(false);
    setModalCategoriasAberto(false);
  };

  if (mostrarCategorias) {
    return (
      <GerenciarCategorias 
        empresaId={empresaId} 
        onClose={handleFecharCategorias} 
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center">
            <DollarSign className="w-6 h-6 md:w-8 md:h-8 mr-2 md:mr-3 text-green-600 flex-shrink-0" />
            <span className="truncate">Gestão Financeira</span>
          </h1>
          <p className="text-gray-600 mt-1 text-sm md:text-base">
            Controle suas receitas e despesas de forma organizada
          </p>
        </div>
        <div className="flex gap-2 md:gap-3 flex-shrink-0">
          {/* Botões para mobile - distribuídos igualmente */}
          <div className="flex gap-2 w-full md:hidden">
            <Button variant="outline" onClick={handleGerenciarCategorias} size="sm" className="flex-1">
              <Settings className="w-4 h-4 mr-1" />
              Categorias
            </Button>
            <Button 
              variant="outline" 
              onClick={handleNovoLancamento} 
              size="sm" 
              className="flex-1"
            >
              <Plus className="w-4 h-4 mr-1" />
              Novo Lançamento
            </Button>
          </div>
          
          {/* Botão para desktop - apenas Categorias */}
          <Button variant="outline" onClick={handleGerenciarCategorias} size="default" className="hidden md:flex">
            <Settings className="w-4 h-4 mr-2" />
            Categorias
          </Button>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <Tabs value={abaSelecionada} onValueChange={(value) => {
        setAbaSelecionada(value);
        if (value === 'formulario' && !mostrarFormulario) {
          setMostrarFormulario(true);
          setLancamentoEdicao(null);
        }
      }}>
        <TabsList className="hidden md:grid w-full grid-cols-2">
          <TabsTrigger value="listagem" className="flex items-center">
            <TrendingUp className="w-4 h-4 mr-2" />
            Lançamentos
          </TabsTrigger>
          <TabsTrigger 
            value="formulario" 
            className="flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            {lancamentoEdicao ? 'Editar' : 'Novo'} Lançamento
          </TabsTrigger>
        </TabsList>

        <TabsContent value="listagem" className="mt-6">
          <ListagemFinanceira 
            empresaId={empresaId}
            onEditarLancamento={handleEditarLancamento}
            onNovoLancamento={handleNovoLancamento}
          />
        </TabsContent>

        <TabsContent value="formulario" className="mt-6">
          <FormularioFinanceiro
            empresaId={empresaId}
            lancamentoEdicao={lancamentoEdicao}
            onSalvar={handleSalvarLancamento}
            onCancelar={handleCancelarFormulario}
          />
        </TabsContent>
      </Tabs>

      {/* Modal para Formulário Financeiro - Mobile */}
      <Dialog open={modalFormularioAberto} onOpenChange={setModalFormularioAberto}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {lancamentoEdicao ? 'Editar' : 'Novo'} Lançamento
            </DialogTitle>
          </DialogHeader>
          <FormularioFinanceiro
            empresaId={empresaId}
            lancamentoEdicao={lancamentoEdicao}
            onSalvar={handleSalvarLancamento}
            onCancelar={() => setModalFormularioAberto(false)}
            hideCancelButton={true}
          />
        </DialogContent>
      </Dialog>

      {/* Modal para Categorias - Mobile */}
      <Dialog open={modalCategoriasAberto} onOpenChange={setModalCategoriasAberto}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerenciar Categorias</DialogTitle>
          </DialogHeader>
          <GerenciarCategorias 
            empresaId={empresaId} 
            onClose={() => setModalCategoriasAberto(false)} 
            hideCloseButton={true}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GestaoFinanceira;