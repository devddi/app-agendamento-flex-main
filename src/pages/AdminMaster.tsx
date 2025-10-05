import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Building2, Mail, Phone, User, LogOut, Loader2 } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

// Cliente Supabase temporário sem persistência de sessão para não afetar a sessão atual do Admin Master
const supabaseNoPersist = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

interface Empresa {
  id: string;
  nome: string;
  slug: string;
  responsavel: string;
  email: string;
  telefone: string;
  status: string;
  created_at: string;
  logo_url: string | null;
}

const AdminMaster = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading, signOut } = useAuth();
  const { toast } = useToast();
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedEmpresa, setSelectedEmpresa] = useState<Empresa | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    nome: "",
    responsavel: "",
    email: "",
    telefone: "",
    password: "",
  });

  const [editFormData, setEditFormData] = useState({
    nome: "",
    responsavel: "",
    email: "",
    telefone: "",
    status: "ativo",
  });

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

  useEffect(() => {
    if (!authLoading) {
      if (!user || !isAdmin) {
        navigate('/admin-master/login');
        return;
      }
      fetchEmpresas();
    }
  }, [user, isAdmin, authLoading, navigate]);

  const fetchEmpresas = async () => {
    try {
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEmpresas(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar empresas",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };



  const handleEditEmpresa = (empresa: Empresa) => {
    setSelectedEmpresa(empresa);
    setEditFormData({
      nome: empresa.nome,
      responsavel: empresa.responsavel,
      email: empresa.email,
      telefone: empresa.telefone,
      status: empresa.status,
    });
    setEditDialogOpen(true);
  };

  const handleUpdateEmpresa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpresa) return;
    
    setEditSubmitting(true);
    
    try {
      const updateData = {
        nome: editFormData.nome,
        responsavel: editFormData.responsavel,
        email: editFormData.email,
        telefone: editFormData.telefone,
        status: editFormData.status,
      };

      const { error } = await supabase
        .from('empresas')
        .update(updateData)
        .eq('id', selectedEmpresa.id);

      if (error) throw error;

      toast({
        title: "Empresa atualizada!",
        description: `${editFormData.nome} foi atualizada com sucesso.`,
      });

      setEditDialogOpen(false);
      setSelectedEmpresa(null);
      fetchEmpresas();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar empresa",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteEmpresa = async () => {
    if (!selectedEmpresa) return;
    
    if (!confirm(`Tem certeza que deseja deletar a empresa "${selectedEmpresa.nome}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    setEditSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('empresas')
        .delete()
        .eq('id', selectedEmpresa.id);

      if (error) throw error;

      toast({
        title: "Empresa deletada!",
        description: `${selectedEmpresa.nome} foi deletada com sucesso.`,
      });

      setEditDialogOpen(false);
      setSelectedEmpresa(null);
      fetchEmpresas();
    } catch (error: any) {
      toast({
        title: "Erro ao deletar empresa",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // 1. Create user with Supabase Auth
      const { data: authData, error: authError } = await supabaseNoPersist.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            nome: formData.responsavel,
            telefone: formData.telefone,
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Usuário não criado');

      // 2. Create empresa
      const { data: empresa, error: empresaError } = await supabase
        .from('empresas')
        .insert({
          nome: formData.nome,
          responsavel: formData.responsavel,
          email: formData.email,
          telefone: formData.telefone,
          owner_id: authData.user.id,
          slug: '', // Will be auto-generated by trigger
        })
        .select()
        .single();

      if (empresaError) throw empresaError;

      // 3. Add empresa_owner role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          role: 'empresa_owner'
        });

      if (roleError) throw roleError;

      toast({
        title: "Empresa cadastrada!",
        description: `${formData.nome} foi criada com sucesso.`,
      });

      setDialogOpen(false);
      setFormData({
        nome: "",
        responsavel: "",
        email: "",
        telefone: "",
        password: "",
      });
      fetchEmpresas();
    } catch (error: any) {
      toast({
        title: "Erro ao cadastrar empresa",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Admin Master</h1>
            <p className="text-muted-foreground">Gerencie todas as empresas do sistema</p>
          </div>
          <Button onClick={signOut} variant="outline" size="icon">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>

        {/* Actions */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="animate-glow">
              <Plus className="w-5 h-5 mr-2" />
              Nova Empresa
            </Button>
          </DialogTrigger>
          <DialogContent className="glass border-primary/20 max-w-md">
            <DialogHeader>
              <DialogTitle>Cadastrar Nova Empresa</DialogTitle>
              <DialogDescription>
                Preencha os dados da empresa e do responsável
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome da Empresa</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Tiara Lima Nails"
                  required
                  className="glass"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="responsavel">Nome do Responsável</Label>
                <Input
                  id="responsavel"
                  value={formData.responsavel}
                  onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                  placeholder="Ex: Maria Silva"
                  required
                  className="glass"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="empresa@exemplo.com"
                  required
                  className="glass"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => {
                    const formatted = formatTelefone(e.target.value);
                    setFormData({ ...formData, telefone: formatted });
                  }}
                  placeholder="(XX) X XXXX-XXXX"
                  required
                  className="glass"
                  maxLength={16}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                  className="glass"
                />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Cadastrando...
                  </>
                ) : (
                  'Cadastrar Empresa'
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Empresas List */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {empresas.map((empresa) => (
            <Card 
              key={empresa.id} 
              className="glass border-primary/20 hover:border-primary/50 smooth-transition cursor-pointer"
              onClick={() => handleEditEmpresa(empresa)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className={`w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden ${empresa.logo_url ? '' : 'border-2 border-primary/30'}`}>
                     {empresa.logo_url ? (
                       <img src={empresa.logo_url} alt={empresa.nome} className="w-full h-full object-cover" />
                     ) : (
                       <Building2 className="w-6 h-6 text-primary" />
                     )}
                   </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    empresa.status === 'ativo' 
                      ? 'bg-primary/20 text-primary' 
                      : 'bg-destructive/20 text-destructive'
                  }`}>
                    {empresa.status}
                  </span>
                </div>
                <CardTitle className="mt-4">{empresa.nome}</CardTitle>
                <CardDescription className="font-mono text-xs text-primary">
                  /empresa/{empresa.slug}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="w-4 h-4" />
                  {empresa.responsavel}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  {empresa.email}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  {empresa.telefone}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Modal de Edição da Empresa */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="glass max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Empresa</DialogTitle>
              <DialogDescription>
                Edite as informações da empresa {selectedEmpresa?.nome}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateEmpresa} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-nome">Nome da Empresa</Label>
                <Input
                  id="edit-nome"
                  value={editFormData.nome}
                  onChange={(e) => setEditFormData({ ...editFormData, nome: e.target.value })}
                  placeholder="Ex: Tiara Lima Nails"
                  required
                  className="glass"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-responsavel">Nome do Responsável</Label>
                <Input
                  id="edit-responsavel"
                  value={editFormData.responsavel}
                  onChange={(e) => setEditFormData({ ...editFormData, responsavel: e.target.value })}
                  placeholder="Ex: Maria Silva"
                  required
                  className="glass"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">E-mail</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  placeholder="empresa@exemplo.com"
                  required
                  className="glass"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-telefone">Telefone</Label>
                <Input
                  id="edit-telefone"
                  value={editFormData.telefone}
                  onChange={(e) => {
                    const formatted = formatTelefone(e.target.value);
                    setEditFormData({ ...editFormData, telefone: formatted });
                  }}
                  placeholder="(XX) X XXXX-XXXX"
                  required
                  className="glass"
                  maxLength={16}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <select
                  id="edit-status"
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 glass"
                  required
                >
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </select>
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1" disabled={editSubmitting}>
                  {editSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar Alterações'
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="destructive" 
                  onClick={handleDeleteEmpresa}
                  disabled={editSubmitting}
                  className="px-4"
                >
                  {editSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Deletar'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminMaster;
