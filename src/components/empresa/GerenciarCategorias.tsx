import React, { useState, useEffect } from 'react';
import { supabase } from '../../integrations/supabase/client';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Trash2, Edit, Plus, Save, X } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';

interface Categoria {
  id: string;
  nome: string;
  tipo: 'receita' | 'despesa';
  cor: string;
  ativo: boolean;
}

interface GerenciarCategoriasProps {
  empresaId: string;
  onClose: () => void;
  hideCloseButton?: boolean;
}

const GerenciarCategorias: React.FC<GerenciarCategoriasProps> = ({ empresaId, onClose, hideCloseButton = false }) => {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [novaCategoria, setNovaCategoria] = useState({
    nome: '',
    tipo: 'receita' as 'receita' | 'despesa',
    cor: '#3B82F6'
  });
  const [editForm, setEditForm] = useState({
    nome: '',
    tipo: 'receita' as 'receita' | 'despesa',
    cor: '#3B82F6'
  });
  const { toast } = useToast();

  const cores = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
    '#8B5CF6', '#EC4899', '#06B6D4', '#6B7280'
  ];

  useEffect(() => {
    carregarCategorias();
  }, [empresaId]);

  const carregarCategorias = async () => {
    try {
      const { data, error } = await supabase
        .from('categorias_financeiras')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('tipo', { ascending: true })
        .order('nome', { ascending: true });

      if (error) throw error;
      setCategorias(data || []);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as categorias.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const adicionarCategoria = async () => {
    if (!novaCategoria.nome.trim()) {
      toast({
        title: "Erro",
        description: "Nome da categoria é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('categorias_financeiras')
        .insert({
          empresa_id: empresaId,
          nome: novaCategoria.nome.trim(),
          tipo: novaCategoria.tipo,
          cor: novaCategoria.cor
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Categoria adicionada com sucesso!",
      });

      setNovaCategoria({ nome: '', tipo: 'receita', cor: '#3B82F6' });
      carregarCategorias();
    } catch (error) {
      console.error('Erro ao adicionar categoria:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar a categoria.",
        variant: "destructive",
      });
    }
  };

  const iniciarEdicao = (categoria: Categoria) => {
    setEditandoId(categoria.id);
    setEditForm({
      nome: categoria.nome,
      tipo: categoria.tipo,
      cor: categoria.cor
    });
  };

  const salvarEdicao = async () => {
    if (!editForm.nome.trim()) {
      toast({
        title: "Erro",
        description: "Nome da categoria é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('categorias_financeiras')
        .update({
          nome: editForm.nome.trim(),
          tipo: editForm.tipo,
          cor: editForm.cor
        })
        .eq('id', editandoId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Categoria atualizada com sucesso!",
      });

      setEditandoId(null);
      carregarCategorias();
    } catch (error) {
      console.error('Erro ao atualizar categoria:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a categoria.",
        variant: "destructive",
      });
    }
  };

  const excluirCategoria = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) return;

    try {
      const { error } = await supabase
        .from('categorias_financeiras')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Categoria excluída com sucesso!",
      });

      carregarCategorias();
    } catch (error) {
      console.error('Erro ao excluir categoria:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a categoria. Verifique se não há lançamentos vinculados.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      {!hideCloseButton && (
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Gerenciar Categorias</h2>
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            Fechar
          </Button>
        </div>
      )}

      {/* Formulário para nova categoria */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Plus className="w-5 h-5 mr-2" />
            Nova Categoria
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={novaCategoria.nome}
                onChange={(e) => setNovaCategoria({ ...novaCategoria, nome: e.target.value })}
                placeholder="Nome da categoria"
              />
            </div>
            <div>
              <Label htmlFor="tipo">Tipo</Label>
              <Select
                value={novaCategoria.tipo}
                onValueChange={(value) => setNovaCategoria({ ...novaCategoria, tipo: value as 'receita' | 'despesa' })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="receita">Receita</SelectItem>
                  <SelectItem value="despesa">Despesa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="cor">Cor</Label>
              <div className="flex gap-2 mt-1">
                {cores.map((cor) => (
                  <button
                    key={cor}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 ${
                      novaCategoria.cor === cor ? 'border-gray-800' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: cor }}
                    onClick={() => setNovaCategoria({ ...novaCategoria, cor })}
                  />
                ))}
              </div>
            </div>
          </div>
          <Button onClick={adicionarCategoria} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Categoria
          </Button>
        </CardContent>
      </Card>

      {/* Lista de categorias */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categorias.map((categoria) => (
          <Card key={categoria.id}>
            <CardContent className="p-4">
              {editandoId === categoria.id ? (
                <div className="space-y-3">
                  <Input
                    value={editForm.nome}
                    onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })}
                    placeholder="Nome da categoria"
                  />
                  <Select
                    value={editForm.tipo}
                    onValueChange={(value) => setEditForm({ ...editForm, tipo: value as 'receita' | 'despesa' })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="receita">Receita</SelectItem>
                      <SelectItem value="despesa">Despesa</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2">
                    {cores.map((cor) => (
                      <button
                        key={cor}
                        type="button"
                        className={`w-6 h-6 rounded-full border-2 ${
                          editForm.cor === cor ? 'border-gray-800' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: cor }}
                        onClick={() => setEditForm({ ...editForm, cor })}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={salvarEdicao}>
                      <Save className="w-4 h-4 mr-1" />
                      Salvar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditandoId(null)}>
                      <X className="w-4 h-4 mr-1" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: categoria.cor }}
                    />
                    <div>
                      <p className="font-medium">{categoria.nome}</p>
                      <Badge variant={categoria.tipo === 'receita' ? 'default' : 'destructive'}>
                        {categoria.tipo === 'receita' ? 'Receita' : 'Despesa'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => iniciarEdicao(categoria)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => excluirCategoria(categoria.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default GerenciarCategorias;