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

  const sanitizeTelefone = (telefone?: string | null) => {
    if (!telefone) return "";
    const digits = telefone.replace(/\D/g, "");
    return digits.startsWith("55") ? digits : `55${digits}`;
  };

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
          <div className="flex flex-col items-center gap-2 md:flex-row md:justify-center">
            <Button 
              variant="outline" 
              onClick={() => setShowMeusAgendamentos(true)}
              className="gap-2"
            >
              <Calendar className="w-4 h-4" />
              Ver Meus Agendamentos
            </Button>
            {empresa.telefone && (
              <Button
                onClick={() => {
                  const mensagem = "Olá!\n Vim pelo link do sistema de agendamentos. Gostaria de informações e agendar um horário.";
                  const url = `https://wa.me/${sanitizeTelefone(empresa.telefone)}?text=${encodeURIComponent(mensagem)}`;
                  window.open(url, '_blank', 'noopener');
                }}
                className="gap-2 bg-green-500 hover:bg-green-600 text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                  <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.643-.182-.066-.315-.1-.447.099-.132.198-.513.643-.628.775-.115.132-.232.149-.43.05-.197-.1-.834-.308-1.588-.985-.587-.522-.98-1.168-1.095-1.365-.115-.198-.012-.305.087-.403.089-.088.198-.23.297-.346.1-.115.132-.198.198-.33.066-.132.033-.248-.017-.347-.05-.099-.447-1.077-.612-1.47-.161-.387-.323-.334-.447-.34l-.38-.007c-.115 0-.3.05-.457.248-.157.198-.6.586-.6 1.43 0 .844.616 1.659.702 1.773.082.115 1.216 1.857 2.953 2.6.413.178.735.285.987.366.414.132.79.114 1.088.069.332-.05 1.017-.416 1.16-.818.144-.403.144-.748.1-.818-.04-.07-.18-.113-.377-.212"/>
                </svg>
                Chamar no WhatsApp
              </Button>
            )}
          </div>
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
