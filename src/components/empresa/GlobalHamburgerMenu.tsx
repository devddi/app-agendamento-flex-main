import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Building2, ExternalLink, User, LogOut, Package, Calendar as CalendarIcon, Users, Clock, DollarSign } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import EmpresaSettings from "./EmpresaSettings";

interface GlobalHamburgerMenuProps {
  empresa: {
    id: string;
    nome: string;
    slug: string;
    responsavel: string;
    email: string;
    telefone: string;
    logo_url: string | null;
  };
  abaSelecionada: string;
  onAbaChange: (aba: string) => void;
  onEmpresaUpdate: () => void;
}

const GlobalHamburgerMenu = ({ empresa, abaSelecionada, onAbaChange, onEmpresaUpdate }: GlobalHamburgerMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleAbaSelect = (aba: string) => {
    onAbaChange(aba);
    setIsOpen(false);
  };

  const menuItems = [
    {
      id: "catalogo",
      label: "Catálogo",
      icon: Package,
      description: "Gerencie seus serviços"
    },
    {
      id: "agenda",
      label: "Agenda",
      icon: CalendarIcon,
      description: "Visualize agendamentos"
    },
    {
      id: "clientes",
      label: "Clientes",
      icon: Users,
      description: "Gerencie seus clientes"
    },
    {
      id: "horarios",
      label: "Horários",
      icon: Clock,
      description: "Configure funcionamento"
    },
    {
      id: "financeiro",
      label: "Financeiro",
      icon: DollarSign,
      description: "Controle receitas e despesas"
    },
  ];

  return (
    <>
      {/* Menu flutuante fixo no topo - apenas mobile */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button 
              variant="default" 
              size="icon" 
              className="shadow-lg bg-primary hover:bg-primary/90 rounded-full w-12 h-12"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 p-0">
            <div className="flex flex-col h-full">
              {/* Header com informações da empresa */}
              <SheetHeader className="p-6 border-b bg-gradient-to-r from-primary/5 to-primary/10">
                <div className="flex flex-col items-center gap-3">
                  <div className={`w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden ${empresa.logo_url ? '' : 'border-2 border-primary/30'}`}>
                    {empresa.logo_url ? (
                      <img src={empresa.logo_url} alt={empresa.nome} className="w-full h-full object-cover" />
                    ) : (
                      <Building2 className="w-7 h-7 text-primary" />
                    )}
                  </div>
                  <SheetTitle className="text-center text-base font-bold truncate">
                    {empresa.nome}
                  </SheetTitle>
                </div>
              </SheetHeader>

              {/* Menu de navegação */}
              <div className="flex-1 p-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground mb-4 px-2">
                    Navegação
                  </h3>
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = abaSelecionada === item.id;
                    return (
                      <Button
                        key={item.id}
                        variant={isActive ? "default" : "ghost"}
                        className={`w-full justify-start gap-3 h-12 px-3 ${
                          isActive 
                            ? "bg-primary text-primary-foreground shadow-sm" 
                            : "hover:bg-muted/50"
                        }`}
                        onClick={() => handleAbaSelect(item.id)}
                      >
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        <div className="flex-1 text-left">
                          <div className="font-medium">{item.label}</div>
                          <div className={`text-xs ${
                            isActive ? "text-primary-foreground/80" : "text-muted-foreground"
                          }`}>
                            {item.description}
                          </div>
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Footer com ações */}
              <div className="border-t p-4 space-y-2 bg-muted/20">
                <h3 className="text-sm font-medium text-muted-foreground mb-3 px-2">
                  Ações
                </h3>
                
                {/* Link público */}
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-10"
                  onClick={() => window.open(`${window.location.origin}/empresa/${empresa.slug}`, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                  Link Público
                </Button>

                {/* Perfil/Configurações */}
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-10"
                  onClick={() => {
                    setConfigDialogOpen(true);
                    setIsOpen(false);
                  }}
                >
                  <User className="h-4 w-4" />
                  Configurações da Empresa
                </Button>

                {/* Logout */}
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-10 text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4" />
                  Sair
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Dialog de configurações da empresa */}
      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configurações da Empresa</DialogTitle>
            <DialogDescription>
              Gerencie as informações e configurações da sua empresa.
            </DialogDescription>
          </DialogHeader>
          <EmpresaSettings 
            empresa={empresa} 
            onUpdate={() => {
              onEmpresaUpdate();
              setConfigDialogOpen(false);
            }} 
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GlobalHamburgerMenu;