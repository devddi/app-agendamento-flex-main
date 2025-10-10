import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Building2 } from "lucide-react";


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
    password: "",
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(empresa.logo_url || null);

  const [address, setAddress] = useState({
    cep: "",
    cidade: "",
    uf: "",
    rua: "",
    numero: "",
    bairro: "",
    ponto_referencia: "",
  });

  const formatTelefone = (value: string) => {
    // Remove todos os caracteres não numéricos
    const numbers = value.replace(/\D/g, '');
    
    // Aplica a máscara (XX) X XXXX-XXXX
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 3) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    } else if (numbers.length <= 7) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 3)} ${numbers.slice(3)}`;
    } else {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 3)} ${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
    }
  };

  const formatCep = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 8);
    if (numbers.length <= 5) return numbers;
    return `${numbers.slice(0,5)}-${numbers.slice(5)}`;
  };

  const buscarCep = async (cepInput?: string) => {
    try {
      const cep = (cepInput ?? address.cep).replace(/\D/g, '');
      if (cep.length !== 8) return;
      const resp = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await resp.json();
      if (data?.erro) return;
      setAddress((prev) => ({
        ...prev,
        cidade: data.localidade ?? prev.cidade,
        uf: data.uf ?? prev.uf,
        rua: data.logradouro ?? prev.rua,
        bairro: data.bairro ?? prev.bairro,
      }));
    } catch {}
  };

  useEffect(() => {
    const fetchEndereco = async () => {
      try {
        const { data, error } = await supabase
          .from('enderecos_empresas')
          .select('*')
          .eq('empresa_id', empresa.id)
          .single();
        if (error) return;
        if (data) {
          setAddress({
            cep: data.cep || "",
            cidade: data.cidade || "",
            uf: data.uf || "",
            rua: data.rua || "",
            numero: data.numero || "",
            bairro: data.bairro || "",
            ponto_referencia: data.ponto_referencia || "",
          });
        }
      } catch {}
    };
    fetchEndereco();
  }, [empresa.id]);

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
        nome: formData.nome,
        responsavel: formData.responsavel,
        email: formData.email,
        telefone: formData.telefone,
        logo_url: logoUrlToSave
      };
      const { error } = await supabase
        .from('empresas')
        .update(updatePayload)
        .eq('id', empresa.id);

      if (error) throw error;

      // Atualizar senha se fornecida
      if (formData.password.trim()) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: formData.password
        });
        
        if (passwordError) {
          throw new Error(`Erro ao atualizar senha: ${passwordError.message}`);
        }
      }

      // Upsert endereço
      try {
        const cepDigits = address.cep.replace(/\D/g, '');
        await supabase
          .from('enderecos_empresas')
          .upsert({
            empresa_id: empresa.id,
            cep: cepDigits,
            cidade: address.cidade,
            uf: address.uf,
            rua: address.rua,
            numero: address.numero,
            bairro: address.bairro,
            ponto_referencia: address.ponto_referencia,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'empresa_id' });
      } catch {}

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
                  onChange={(e) => {
                    const formatted = formatTelefone(e.target.value);
                    setFormData({ ...formData, telefone: formatted });
                  }}
                  className="glass"
                  required
                  maxLength={16}
                  placeholder="(XX) X XXXX-XXXX"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Nova Senha (opcional)</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="glass"
                placeholder="Deixe em branco para manter a senha atual"
              />
              <p className="text-xs text-muted-foreground">Preencha apenas se desejar alterar sua senha de acesso.</p>
            </div>

            {/* Logo Upload */}
            <div className="space-y-2">
              <Label htmlFor="logo">Logo da Empresa</Label>
              <div className="flex items-center gap-4">
                <div className={`w-20 h-20 min-w-20 min-h-20 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center flex-shrink-0 ${logoPreview ? '' : 'border-2 border-primary/30'}`}>
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover object-center" style={{aspectRatio: '1/1'}} />
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

            {/* Endereço */}
            <div className="space-y-4 pt-2 border-t">
              <div>
                <Label>Endereço</Label>
                <p className="text-xs text-muted-foreground">Preencha os dados de endereço da sua empresa. Use o CEP para buscar automaticamente.</p>
              </div>

              <div className="grid md:grid-cols-[1fr_auto] gap-4 items-end">
                <div className="space-y-2">
                  <Label htmlFor="cep">CEP</Label>
                  <Input
                    id="cep"
                    value={address.cep}
                    onChange={(e) => setAddress({ ...address, cep: formatCep(e.target.value) })}
                    onBlur={() => buscarCep()}
                    placeholder="00000-000"
                    className="glass"
                    maxLength={9}
                  />
                </div>
                <Button type="button" variant="secondary" onClick={() => buscarCep()}>
                  Buscar CEP
                </Button>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input id="cidade" value={address.cidade} onChange={(e) => setAddress({ ...address, cidade: e.target.value })} className="glass" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="uf">UF</Label>
                  <Input id="uf" value={address.uf} onChange={(e) => setAddress({ ...address, uf: e.target.value.toUpperCase().slice(0,2) })} className="glass" maxLength={2} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bairro">Bairro</Label>
                  <Input id="bairro" value={address.bairro} onChange={(e) => setAddress({ ...address, bairro: e.target.value })} className="glass" />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="rua">Rua</Label>
                  <Input id="rua" value={address.rua} onChange={(e) => setAddress({ ...address, rua: e.target.value })} className="glass" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numero">Número</Label>
                  <Input id="numero" value={address.numero} onChange={(e) => setAddress({ ...address, numero: e.target.value })} className="glass" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ponto_referencia">Ponto de Referência</Label>
                <Input id="ponto_referencia" value={address.ponto_referencia} onChange={(e) => setAddress({ ...address, ponto_referencia: e.target.value })} className="glass" placeholder="Ex: Próximo ao Shopping X" />
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


    </div>
  );
};

export default EmpresaSettings;
