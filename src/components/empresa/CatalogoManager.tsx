import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Loader2, Package } from "lucide-react";

interface Servico {
  id: string;
  nome: string;
  descricao: string | null;
  duracao_minutos: number;
  preco: number;
  ativo: boolean;
  imagem_url?: string | null;
}

interface CatalogoManagerProps {
  empresaId: string;
}

const CatalogoManager = ({ empresaId }: CatalogoManagerProps) => {
  const { toast } = useToast();
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    duracao_minutos: 30,
    preco: 0,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [editingImagemUrl, setEditingImagemUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchServicos();
  }, [empresaId]);

  const fetchServicos = async () => {
    try {
      const { data, error } = await supabase
        .from('servicos')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setServicos(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar serviços",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let imagemUrlToSave: string | null = editingImagemUrl || null;

      if (imageFile) {
        // Usar bucket padrão 'servicos' com subpasta por empresa
        const targetBucket = 'servicos';

        const fileExt = imageFile.name.split('.').pop();
        const unique = (crypto as any)?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const filePath = `${empresaId}/${unique}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from(targetBucket)
          .upload(filePath, imageFile, { upsert: true, contentType: imageFile.type });

        if (uploadError) {
          toast({ title: "Falha ao enviar imagem", description: uploadError.message, variant: "destructive" });
        } else {
          const { data } = supabase.storage.from(targetBucket).getPublicUrl(filePath);
          imagemUrlToSave = data.publicUrl;
        }
      }

      if (editingId) {
        const { error } = await supabase
          .from('servicos')
          .update({ ...formData, imagem_url: imagemUrlToSave })
          .eq('id', editingId);

        if (error) throw error;
        toast({ title: "Serviço atualizado!" });
      } else {
        const { error } = await supabase
          .from('servicos')
          .insert({ ...formData, imagem_url: imagemUrlToSave, empresa_id: empresaId });

        if (error) throw error;
        toast({ title: "Serviço adicionado!" });
      }

      setDialogOpen(false);
      resetForm();
      fetchServicos();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar serviço",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (servico: Servico) => {
    setEditingId(servico.id);
    setFormData({
      nome: servico.nome,
      descricao: servico.descricao || "",
      duracao_minutos: servico.duracao_minutos,
      preco: servico.preco,
    });
    setEditingImagemUrl(servico.imagem_url || null);
    setImagePreview(servico.imagem_url || null);
    setImageFile(null);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este serviço?')) return;

    try {
      const { error } = await supabase
        .from('servicos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: "Serviço excluído!" });
      fetchServicos();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir serviço",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      nome: "",
      descricao: "",
      duracao_minutos: 30,
      preco: 0,
    });
    setImageFile(null);
    setImagePreview(null);
    setEditingImagemUrl(null);
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
          <h2 className="text-2xl font-bold">Catálogo de Serviços</h2>
          <p className="text-muted-foreground">Gerencie os serviços oferecidos</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Serviço
            </Button>
          </DialogTrigger>
          <DialogContent className="glass border-primary/20">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar' : 'Novo'} Serviço</DialogTitle>
              <DialogDescription>
                Preencha os detalhes do serviço
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome do Serviço</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="glass"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  className="glass"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="imagem">Imagem do Serviço (opcional)</Label>
                <Input
                  id="imagem"
                  type="file"
                  accept="image/*"
                  className="glass"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setImageFile(file);
                    setImagePreview(file ? URL.createObjectURL(file) : (editingImagemUrl || null));
                  }}
                />
                {(imagePreview || editingImagemUrl) && (
                  <img
                    src={(imagePreview || editingImagemUrl) as string}
                    alt="Pré-visualização"
                    className="mt-2 h-24 w-full object-cover rounded-md border border-primary/20"
                  />
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duracao">Duração (min)</Label>
                  <Input
                    id="duracao"
                    type="number"
                    value={formData.duracao_minutos}
                    onChange={(e) => setFormData({ ...formData, duracao_minutos: parseInt(e.target.value) })}
                    className="glass"
                    required
                    min="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="preco">Preço (R$)</Label>
                  <Input
                    id="preco"
                    type="number"
                    step="0.01"
                    value={formData.preco}
                    onChange={(e) => setFormData({ ...formData, preco: parseFloat(e.target.value) })}
                    className="glass"
                    required
                    min="0"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar'
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {servicos.map((servico) => (
          <Card key={servico.id} className="glass border-primary/20 hover:border-primary/50 smooth-transition">
            <CardHeader>
              <div className="flex items-start justify-between">
                {servico.imagem_url ? (
                  <div className="w-24 h-24 rounded-xl overflow-hidden neon-border">
                    <img src={servico.imagem_url} alt={servico.nome} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center neon-border">
                    <Package className="w-6 h-6 text-primary" />
                  </div>
                )}
                <div className="flex gap-2">
                  <Button size="icon" variant="ghost" onClick={() => handleEdit(servico)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(servico.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
              <CardTitle className="mt-4">{servico.nome}</CardTitle>
              <CardDescription>{servico.descricao}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Duração:</span>
                <span className="font-medium">{servico.duracao_minutos} min</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Preço:</span>
                <span className="font-bold text-primary">
                  R$ {servico.preco.toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CatalogoManager;
