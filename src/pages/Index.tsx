import { Calendar, Building2, Sparkles, ArrowRight, Users, Clock, Shield, CreditCard, BarChart3, CheckCircle, Zap, Smartphone, Globe, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const navigate = useNavigate();
  const { isAdmin, isEmpresaOwner, user } = useAuth();

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass backdrop-blur-md border-b border-primary/10">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center">
            <div className="h-8 sm:h-10">
              <img src="https://gcblvcvokubxlhlaikvq.supabase.co/storage/v1/object/public/utils/logo.png" alt="AgendaTOP Logo" className="h-full w-auto object-contain" />
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <Button 
              size="sm" 
              onClick={() => navigate('/empresa/login')} 
              className="group hidden sm:inline-flex"
            >
              Já tenho conta
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              size="sm" 
              onClick={() => navigate('/empresa/login')} 
              className="group sm:hidden"
            >
              Login
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </header>

      {/* Animated background */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        {/* Gradient blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-br from-primary/20 via-primary/10 to-transparent blur-3xl animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-tl from-primary/15 via-primary/8 to-transparent blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[40vw] h-[40vw] rounded-full bg-gradient-to-r from-transparent via-primary/5 to-transparent blur-2xl animate-pulse" style={{ animationDelay: '2s' }} />
        



      </div>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="pt-24 sm:pt-32 pb-12 sm:pb-16 px-4">
          <div className="max-w-7xl mx-auto text-center space-y-6 sm:space-y-8">
            <div className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 glass rounded-full border border-primary/20">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-primary animate-pulse" />
              <span className="text-xs sm:text-sm font-medium bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Sistema de Agendamento Inteligente
              </span>
            </div>

            <h1 className="text-4xl sm:text-6xl md:text-8xl font-bold tracking-tight leading-tight">
              Agende com
              <span className="neon-text bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent"> Facilidade</span>
            </h1>

            <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed px-4 sm:px-0">
              Plataforma moderna e completa para gerenciar agendamentos, clientes e serviços com máxima eficiência — tudo em um só lugar.
            </p>



            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mt-8 sm:mt-12">
              <div className="glass rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center border border-primary/10 hover:border-primary/30 transition-all duration-300">
                <p className="text-2xl sm:text-4xl font-bold text-primary">24/7</p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">Agendamentos Automáticos</p>
              </div>
              <div className="glass rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center border border-primary/10 hover:border-primary/30 transition-all duration-300">
                <p className="text-2xl sm:text-4xl font-bold text-primary">+500</p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">Empresas Atendidas</p>
              </div>
              <div className="glass rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center border border-primary/10 hover:border-primary/30 transition-all duration-300">
                <p className="text-2xl sm:text-4xl font-bold text-primary">30s</p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">Tempo Médio de Reserva</p>
              </div>
              <div className="glass rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center border border-primary/10 hover:border-primary/30 transition-all duration-300">
                <p className="text-2xl sm:text-4xl font-bold text-primary">99.9%</p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">Disponibilidade</p>
              </div>
            </div>
          </div>
        </section>



        {/* Features Section */}
        <section className="px-4 pb-20">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4">
                Recursos que você vai <span className="text-primary">amar</span>
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
                Tudo que você precisa para modernizar e otimizar seus agendamentos
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              <div className="glass rounded-2xl md:rounded-3xl p-6 md:p-8 border border-primary/10 hover:border-primary/30 transition-all duration-300 group">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 transition-transform">
                  <Calendar className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                </div>
                <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3">Calendário Inteligente</h3>
                <p className="text-sm md:text-base text-muted-foreground">Visualize disponibilidade em tempo real, gerencie horários e evite conflitos automaticamente.</p>
              </div>

              <div className="glass rounded-2xl md:rounded-3xl p-6 md:p-8 border border-primary/10 hover:border-primary/30 transition-all duration-300 group">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                </div>
                <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3">Gestão de Clientes</h3>
                <p className="text-sm md:text-base text-muted-foreground">Histórico completo, contatos organizados e preferências dos clientes em um só lugar.</p>
              </div>

              <div className="glass rounded-2xl md:rounded-3xl p-6 md:p-8 border border-primary/10 hover:border-primary/30 transition-all duration-300 group">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 transition-transform">
                  <Clock className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                </div>
                <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3">Serviços Personalizáveis</h3>
                <p className="text-sm md:text-base text-muted-foreground">Configure duração, preços e descrições detalhadas do seu catálogo de serviços.</p>
              </div>

              <div className="glass rounded-2xl md:rounded-3xl p-6 md:p-8 border border-primary/10 hover:border-primary/30 transition-all duration-300 group">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 transition-transform">
                  <Smartphone className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                </div>
                <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3">Mobile First</h3>
                <p className="text-sm md:text-base text-muted-foreground">Interface responsiva e otimizada para todos os dispositivos e tamanhos de tela.</p>
              </div>

              <div className="glass rounded-2xl md:rounded-3xl p-6 md:p-8 border border-primary/10 hover:border-primary/30 transition-all duration-300 group">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 transition-transform">
                  <Shield className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                </div>
                <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3">Segurança Total</h3>
                <p className="text-sm md:text-base text-muted-foreground">Autenticação robusta, permissões granulares e proteção completa dos dados.</p>
              </div>

              <div className="glass rounded-2xl md:rounded-3xl p-6 md:p-8 border border-primary/10 hover:border-primary/30 transition-all duration-300 group">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                </div>
                <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3">Relatórios Avançados</h3>
                <p className="text-sm md:text-base text-muted-foreground">Acompanhe métricas de desempenho, receita e satisfação dos clientes.</p>
              </div>
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section className="px-4 pb-20">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4">
                Como <span className="text-primary">funciona</span>
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground px-4">
                Simples, rápido e eficiente em apenas 3 passos
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-8">
              <div className="text-center space-y-4 md:space-y-6">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mx-auto text-white text-xl md:text-2xl font-bold">
                  1
                </div>
                <div className="glass rounded-xl md:rounded-2xl p-6 md:p-8">
                  <CheckCircle className="w-10 h-10 md:w-12 md:h-12 text-primary mx-auto mb-3 md:mb-4" />
                  <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3">Cadastre sua Empresa</h3>
                  <p className="text-sm md:text-base text-muted-foreground">Crie seu perfil, adicione informações da empresa e personalize seu catálogo de serviços.</p>
                </div>
              </div>

              <div className="text-center space-y-4 md:space-y-6">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mx-auto text-white text-xl md:text-2xl font-bold">
                  2
                </div>
                <div className="glass rounded-xl md:rounded-2xl p-6 md:p-8">
                  <Globe className="w-10 h-10 md:w-12 md:h-12 text-primary mx-auto mb-3 md:mb-4" />
                  <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3">Compartilhe o Link</h3>
                  <p className="text-sm md:text-base text-muted-foreground">Envie seu endereço público personalizado para clientes agendarem diretamente.</p>
                </div>
              </div>

              <div className="text-center space-y-4 md:space-y-6">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mx-auto text-white text-xl md:text-2xl font-bold">
                  3
                </div>
                <div className="glass rounded-xl md:rounded-2xl p-6 md:p-8">
                  <TrendingUp className="w-10 h-10 md:w-12 md:h-12 text-primary mx-auto mb-3 md:mb-4" />
                  <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3">Receba Agendamentos</h3>
                  <p className="text-sm md:text-base text-muted-foreground">Acompanhe tudo pelo painel com confirmações instantâneas e notificações automáticas.</p>
                </div>
              </div>
            </div>
          </div>
        </section>



        {/* Pricing */}
        <section className="px-4 pb-20">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4">
                Nosso <span className="text-primary">Plano</span>
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground px-4">
                Solução completa para o seu negócio
              </p>
            </div>

            <div className="flex justify-center">
              <div className="glass rounded-2xl md:rounded-3xl p-6 md:p-12 border-2 border-primary relative overflow-hidden max-w-md w-full">
                <div className="absolute top-4 right-4 md:top-6 md:right-6 bg-primary text-white px-3 py-1 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-medium">
                  Recomendado
                </div>
                <div className="text-center mb-8 md:mb-10">
                  <h3 className="text-2xl md:text-3xl font-bold mb-2 md:mb-3">Pro</h3>
                  <p className="text-sm md:text-base text-muted-foreground mb-4 md:mb-6">Solução completa para sua empresa</p>
                  <div className="text-4xl md:text-5xl font-bold text-primary">R$ 59<span className="text-lg md:text-xl text-muted-foreground">/mês</span></div>
                </div>
                <ul className="space-y-3 md:space-y-4 mb-8 md:mb-10">
                  <li className="flex items-center gap-2 md:gap-3">
                    <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-primary flex-shrink-0" />
                    <span className="text-sm md:text-lg">Agendamentos ilimitados</span>
                  </li>
                  <li className="flex items-center gap-2 md:gap-3">
                    <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-primary flex-shrink-0" />
                    <span className="text-sm md:text-lg">Catálogo de serviços</span>
                  </li>
                  <li className="flex items-center gap-2 md:gap-3">
                    <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-primary flex-shrink-0" />
                    <span className="text-sm md:text-lg">Link público personalizado</span>
                  </li>
                  <li className="flex items-center gap-2 md:gap-3">
                    <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-primary flex-shrink-0" />
                    <span className="text-sm md:text-lg">Suporte por email</span>
                  </li>
                  <li className="flex items-center gap-2 md:gap-3">
                    <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-primary flex-shrink-0" />
                    <span className="text-sm md:text-lg">Relatórios avançados</span>
                  </li>
                  <li className="flex items-center gap-2 md:gap-3">
                    <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-primary flex-shrink-0" />
                    <span className="text-sm md:text-lg">Personalização avançada</span>
                  </li>
                  <li className="flex items-center gap-2 md:gap-3">
                    <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-primary flex-shrink-0" />
                    <span className="text-sm md:text-lg">Suporte prioritário</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-4 pb-16 md:pb-24">
          <div className="max-w-4xl mx-auto text-center">
            <div className="glass rounded-2xl md:rounded-3xl p-6 md:p-12 border border-primary/20">
              <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6">
                Pronto para <span className="text-primary">modernizar</span> seus agendamentos?
              </h2>
              <p className="text-base md:text-xl text-muted-foreground mb-6 md:mb-8 max-w-2xl mx-auto px-4">
                Comece em minutos, configure sua empresa e compartilhe seu link público com seus clientes hoje mesmo.
              </p>
              <div className="flex items-center justify-center">
                <Button
                  size="lg"
                  className="bg-green-600 hover:bg-green-700 text-white px-6 md:px-8 py-3 md:py-4 text-base md:text-lg"
                  onClick={() => {
                    const text = encodeURIComponent("Olá, tenho interesse em conhecer mais o sistema AgendaTOP.");
                    const url = `https://wa.me/5588988634517?text=${text}`;
                    window.open(url, "_blank", "noopener");
                  }}
                >
                  Falar com Especialista
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="px-4 pb-6 md:pb-8">
          <div className="max-w-7xl mx-auto">
            <div className="glass rounded-xl md:rounded-2xl p-6 md:p-8 text-center">
              <p className="text-xs md:text-sm text-muted-foreground">
                © {new Date().getFullYear()} Sistema de Agendamento. Todos os direitos reservados.
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Index;
