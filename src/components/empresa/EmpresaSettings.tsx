import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save } from "lucide-react";

interface EmpresaSettingsProps {
  empresa: {
    id: string;
    nome: string;
    responsavel: string;
    email: string;
    telefone: string;
    cor_primaria: string | null;
    cor_secundaria: string | null;
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
    cor_primaria: empresa.cor_primaria || '#1a1a1a',
    cor_secundaria: empresa.cor_secundaria || '#32F08C',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('empresas')
        .update(formData)
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

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cor_primaria">Cor Primária</Label>
              <div className="flex gap-2">
                <Input
                  id="cor_primaria"
                  type="color"
                  value={formData.cor_primaria}
                  onChange={(e) => setFormData({ ...formData, cor_primaria: e.target.value })}
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  value={formData.cor_primaria}
                  onChange={(e) => setFormData({ ...formData, cor_primaria: e.target.value })}
                  className="glass flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cor_secundaria">Cor Secundária</Label>
              <div className="flex gap-2">
                <Input
                  id="cor_secundaria"
                  type="color"
                  value={formData.cor_secundaria}
                  onChange={(e) => setFormData({ ...formData, cor_secundaria: e.target.value })}
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  value={formData.cor_secundaria}
                  onChange={(e) => setFormData({ ...formData, cor_secundaria: e.target.value })}
                  className="glass flex-1"
                />
              </div>
            </div>
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
  );
};

export default EmpresaSettings;
