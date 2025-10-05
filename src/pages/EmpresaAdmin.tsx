import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Loader2, Building2, Package, Calendar as CalendarIcon, Users } from "lucide-react";
import EmpresaSettings from "@/components/empresa/EmpresaSettings";
import CatalogoManager from "@/components/empresa/CatalogoManager";
import AgendaManager from "@/components/empresa/AgendaManager";
import ClientesManager from "@/components/empresa/ClientesManager";

interface Empresa {
  id: string;
  nome: string;
  slug: string;
  responsavel: string;
  email: string;
  telefone: string;
  logo_url: string | null;
  cor_primaria: string | null;
  cor_secundaria: string | null;
  horario_funcionamento: any;
}

const EmpresaAdmin = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, isEmpresaOwner, loading: authLoading, signOut } = useAuth();
  const { toast } = useToast();
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user || !isEmpresaOwner) {
        navigate('/empresa/login');
        return;
      }
      fetchEmpresa();
    }
  }, [user, isEmpresaOwner, authLoading, slug, navigate]);

  const fetchEmpresa = async () => {
    try {
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .eq('slug', slug)
        .eq('owner_id', user?.id)
        .single();

      if (error) throw error;
      setEmpresa(data);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar empresa",
        description: error.message,
        variant: "destructive",
      });
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!empresa) return null;

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="glass rounded-3xl p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center neon-border">
              <Building2 className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{empresa.nome}</h1>
              <p className="text-sm text-muted-foreground">
                Link público: /empresa/{empresa.slug}
              </p>
            </div>
          </div>
          <Button onClick={handleSignOut} variant="outline" size="icon">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="empresa" className="w-full">
          <TabsList className="glass grid w-full grid-cols-4 p-1">
            <TabsTrigger value="empresa" className="gap-2">
              <Building2 className="w-4 h-4" />
              Empresa
            </TabsTrigger>
            <TabsTrigger value="catalogo" className="gap-2">
              <Package className="w-4 h-4" />
              Catálogo
            </TabsTrigger>
            <TabsTrigger value="agenda" className="gap-2">
              <CalendarIcon className="w-4 h-4" />
              Agenda
            </TabsTrigger>
            <TabsTrigger value="clientes" className="gap-2">
              <Users className="w-4 h-4" />
              Clientes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="empresa" className="mt-6">
            <EmpresaSettings empresa={empresa} onUpdate={fetchEmpresa} />
          </TabsContent>

          <TabsContent value="catalogo" className="mt-6">
            <CatalogoManager empresaId={empresa.id} />
          </TabsContent>

          <TabsContent value="agenda" className="mt-6">
            <AgendaManager empresaId={empresa.id} />
          </TabsContent>

          <TabsContent value="clientes" className="mt-6">
            <ClientesManager empresaId={empresa.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EmpresaAdmin;
