import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Building2, Loader2, Clock, DollarSign, MapPin, Calendar } from "lucide-react";
import AgendamentoDialog from "@/components/public/AgendamentoDialog";
import MeusAgendamentosDialog from "@/components/public/MeusAgendamentosDialog";

interface Empresa {
  id: string;
  nome: string;
  slug: string;
  telefone: string;
  email: string;
  logo_url: string | null;
}

interface Servico {
  id: string;
  nome: string;
  descricao: string | null;
  duracao_minutos: number;
  preco: number;
  imagem_url?: string | null;
}

interface Endereco {
  cep: string | null;
  cidade: string | null;
  uf: string | null;
  rua: string | null;
  numero: string | null;
  bairro: string | null;
  ponto_referencia: string | null;
}

const EmpresaPublica = () => {
  const { slug } = useParams();
  const { toast } = useToast();
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedServico, setSelectedServico] = useState<Servico | null>(null);
  const [endereco, setEndereco] = useState<Endereco | null>(null);
  const [showMeusAgendamentos, setShowMeusAgendamentos] = useState(false);

  useEffect(() => {
    fetchEmpresa();
  }, [slug]);

  const formatCep = (cep?: string | null) => {
    if (!cep) return "";
    const digits = cep.replace(/\D/g, "").slice(0, 8);
    if (digits.length !== 8) return digits;
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  };

  const openMapsForEndereco = () => {
    if (!endereco) return;
    const parts = [
      [endereco.rua, endereco.numero].filter(Boolean).join(' '),
      endereco.bairro,
      [endereco.cidade, endereco.uf].filter(Boolean).join(' '),
    ].filter(Boolean);
    const query = parts.join(', ');
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    window.open(url, '_blank', 'noopener');
  };

  const fetchEmpresa = async () => {
    try {
      const { data: empresaData, error: empresaError } = await supabase
        .from('empresas')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'ativo')
        .single();

      if (empresaError) throw empresaError;
      setEmpresa(empresaData);

      const { data: servicosData, error: servicosError } = await supabase
        .from('servicos')
        .select('*')
        .eq('empresa_id', empresaData.id)
        .eq('ativo', true)
        .order('nome');

      if (servicosError) throw servicosError;
      setServicos(servicosData || []);

      // Buscar endereço da empresa para exibição pública
      const { data: enderecoData } = await supabase
        .from('enderecos_empresas')
        .select('cep,cidade,uf,rua,numero,bairro,ponto_referencia')
        .eq('empresa_id', empresaData.id)
        .single();
      setEndereco(enderecoData || null);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar dados",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!empresa) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="glass border-primary/20 max-w-md w-full">
          <CardContent className="p-12 text-center">
            <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">Empresa não encontrada</h2>
            <p className="text-muted-foreground">
              A empresa que você está procurando não existe ou está inativa.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="glass rounded-3xl p-8 text-center fade-in">
          <div className={`w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4 overflow-hidden ${empresa.logo_url ? '' : 'border-2 border-primary/30'}`}>
             {empresa.logo_url ? (
               <img src={empresa.logo_url} alt={empresa.nome} className="w-full h-full object-cover" />
             ) : (
               <Building2 className="w-10 h-10 text-primary" />
             )}
           </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2">{empresa.nome}</h1>
          <p className="text-muted-foreground text-lg mb-4">
            Escolha um serviço e agende seu horário
          </p>
          <Button 
            variant="outline" 
            onClick={() => setShowMeusAgendamentos(true)}
            className="gap-2"
          >
            <Calendar className="w-4 h-4" />
            Ver Meus Agendamentos
          </Button>
        </div>

        {/* Endereço da Empresa */}
        {endereco && (
          <Card className="glass border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary mt-1" />
                <div className="text-sm">
                  <div className="font-medium">
                    {[endereco.rua, endereco.numero].filter(Boolean).join(', ')}
                  </div>
                  <div className="text-muted-foreground">
                    {[
                      endereco.bairro,
                      [endereco.cidade, endereco.uf].filter(Boolean).join(' - '),
                    ]
                      .filter(Boolean)
                      .join(' • ')}
                  </div>
                  {/* Removido CEP */}
                  {endereco.ponto_referencia && (
                    <div className="text-muted-foreground">Ref.: {endereco.ponto_referencia}</div>
                  )}
                  <div className="mt-3">
                    <Button variant="outline" size="sm" onClick={openMapsForEndereco} className="gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>Como chegar</span>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Catálogo de Serviços */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-center">Nossos Serviços</h2>
          
          {servicos.length === 0 ? (
            <Card className="glass border-primary/20">
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">
                  Nenhum serviço disponível no momento
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {servicos.map((servico) => (
                <Card 
                  key={servico.id} 
                  className="glass border-primary/20 hover:border-primary/50 smooth-transition scale-in cursor-pointer"
                  onClick={() => setSelectedServico(servico)}
                >
                  <CardHeader>
                    {servico.imagem_url ? (
                      <div className="w-full h-40 rounded-xl overflow-hidden neon-border">
                        <img src={servico.imagem_url} alt={servico.nome} className="w-full h-full object-cover" />
                      </div>
                    ) : null}
                    <CardTitle className="text-xl mt-2">{servico.nome}</CardTitle>
                    <CardDescription className="min-h-[3rem]">
                      {servico.descricao || 'Serviço profissional de qualidade'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>{servico.duracao_minutos} minutos</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-primary" />
                        <span className="text-2xl font-bold text-primary">
                          {servico.preco.toFixed(2)}
                        </span>
                      </div>
                      <Button size="sm" className="animate-glow">
                        Agendar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Agendamento Dialog */}
      {selectedServico && empresa && (
        <AgendamentoDialog
          servico={selectedServico}
          empresa={empresa}
          open={!!selectedServico}
          onClose={() => setSelectedServico(null)}
        />
      )}

      {/* Meus Agendamentos Dialog */}
      {empresa && (
        <MeusAgendamentosDialog
          open={showMeusAgendamentos}
          onClose={() => setShowMeusAgendamentos(false)}
          empresaId={empresa.id}
        />
      )}
    </div>
  );
};

export default EmpresaPublica;
