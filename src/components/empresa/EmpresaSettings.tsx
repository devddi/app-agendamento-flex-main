import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Building2 } from "lucide-react";
import HorariosFuncionamento from "./HorariosFuncionamento";

interface EmpresaSettingsProps {
  empresa: {
    id: string;
    nome: string;
    responsavel: string;
    email: string;
    telefone: string;
    logo_url?: string;
  };
  onUpdate: () => void;
}

const EmpresaSettings = ({ empresa, onUpdate }: EmpresaSettingsProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: empresa.nome,
    responsavel: empresa.responsavel,
    email: empresa.email,
    telefone: empresa.telefone,
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(empresa.logo_url || null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let logoUrlToSave: string | null = empresa.logo_url || null;

      if (logoFile) {
        const targetBucket = 'servicos';
        const fileExt = logoFile.name.split('.').pop();
        const unique = (crypto as any)?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const filePath = `logos/${empresa.id}/${unique}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from(targetBucket)
          .upload(filePath, logoFile, { upsert: true, contentType: logoFile.type });

        if (uploadError) {
          toast({ title: "Falha ao enviar logo", description: uploadError.message, variant: "destructive" });
        } else {
          const { data } = supabase.storage.from(targetBucket).getPublicUrl(filePath);
          logoUrlToSave = data.publicUrl;
        }
      }

      const updatePayload = { 
        ...formData, 
        logo_url: logoUrlToSave
      };
      const { error } = await supabase
        .from('empresas')
        .update(updatePayload)
        .eq('id', empresa.id);

      if (error) throw error;

      toast({
        title: "Dados atualizados!",
        description: "As informações da empresa foram salvas com sucesso.",
      });
      onUpdate();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <Card className="glass border-primary/20">
        <CardHeader>
          <CardTitle>Dados da Empresa</CardTitle>
          <CardDescription>
            Atualize as informações básicas da sua empresa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome da Empresa</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="glass"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="responsavel">Responsável</Label>
                <Input
                  id="responsavel"
                  value={formData.responsavel}
                  onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                  className="glass"
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="glass"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  className="glass"
                  required
                />
              </div>
            </div>

            {/* Logo Upload */}
            <div className="space-y-2">
              <Label htmlFor="logo">Logo da Empresa</Label>
              <div className="flex items-center gap-4">
                <div className={`w-20 h-20 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center ${logoPreview ? '' : 'border-2 border-primary/30'}`}>
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="w-8 h-8 text-primary" />
                  )}
                </div>
                <Input 
                  id="logo" 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileChange}
                  className="glass" 
                />
              </div>
              <p className="text-xs text-muted-foreground">Formatos suportados: JPG, PNG, SVG. Tamanho recomendado: quadrado.</p>
            </div>

            <Button type="submit" disabled={loading} className="w-full md:w-auto">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Componente separado para horários de funcionamento */}
      <HorariosFuncionamento empresaId={empresa.id} />
    </div>
  );
};

export default EmpresaSettings;
