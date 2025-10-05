import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import AdminMaster from "./pages/AdminMaster";
import AdminMasterLogin from "./pages/AdminMasterLogin";
import EmpresaLogin from "./pages/EmpresaLogin";
import EmpresaAdmin from "./pages/EmpresaAdmin";
import EmpresaPublica from "./pages/EmpresaPublica";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/admin-master" element={<AdminMaster />} />
            <Route path="/admin-master/login" element={<AdminMasterLogin />} />
            <Route path="/empresa/login" element={<EmpresaLogin />} />
            <Route path="/empresa/:slug/admin" element={<EmpresaAdmin />} />
            <Route path="/empresa/:slug" element={<EmpresaPublica />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
