import { Calendar, Building2, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const navigate = useNavigate();
  const { isAdmin, isEmpresaOwner, user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative z-10 max-w-4xl w-full space-y-12 fade-in">
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Sistema de Agendamento Inteligente</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
            Agende com
            <span className="neon-text"> Facilidade</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Plataforma completa para gerenciar agendamentos, clientes e serviços de forma profissional
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Admin Master Card */}
          {(!user || isAdmin) && (
            <div className="glass glass-hover rounded-3xl p-8 space-y-4 scale-in">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center neon-border">
                <Building2 className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold">Admin Master</h3>
              <p className="text-muted-foreground">
                Gerencie todas as empresas cadastradas no sistema
              </p>
              <Button 
                className="w-full group" 
                size="lg"
                onClick={() => navigate('/admin-master')}
              >
                Acessar Painel
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          )}

          {/* Empresa Card */}
          {isEmpresaOwner && (
            <div 
              className="glass glass-hover rounded-3xl p-8 space-y-4 scale-in"
              style={{ animationDelay: '0.1s' }}
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center neon-border">
                <Calendar className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold">Minha Empresa</h3>
              <p className="text-muted-foreground">
                Acesse o painel da sua empresa e gerencie agendamentos
              </p>
              <Button 
                className="w-full group" 
                variant="secondary" 
                size="lg"
                onClick={() => navigate('/empresa/login')}
              >
                Fazer Login
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          )}

          {/* Public booking - always visible */}
          {!user && (
            <div 
              className="glass glass-hover rounded-3xl p-8 space-y-4 scale-in"
              style={{ animationDelay: '0.2s' }}
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center neon-border">
                <Calendar className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold">Fazer Agendamento</h3>
              <p className="text-muted-foreground">
                Acesse o link da empresa para realizar seu agendamento
              </p>
              <p className="text-sm text-primary">
                /empresa/[nome-da-empresa]
              </p>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="glass rounded-3xl p-8 space-y-4">
          <h4 className="text-lg font-semibold text-center mb-6">Recursos Principais</h4>
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div className="space-y-2">
              <div className="text-3xl">📅</div>
              <p className="font-medium">Calendário Inteligente</p>
              <p className="text-sm text-muted-foreground">Visualize disponibilidade em tempo real</p>
            </div>
            <div className="space-y-2">
              <div className="text-3xl">👥</div>
              <p className="font-medium">Gestão de Clientes</p>
              <p className="text-sm text-muted-foreground">Histórico completo de agendamentos</p>
            </div>
            <div className="space-y-2">
              <div className="text-3xl">💅</div>
              <p className="font-medium">Catálogo de Serviços</p>
              <p className="text-sm text-muted-foreground">Personalize preços e duração</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
