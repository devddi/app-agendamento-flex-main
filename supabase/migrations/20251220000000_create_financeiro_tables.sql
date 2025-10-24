-- Criação das tabelas para o sistema de receitas e despesas

-- Tabela de categorias financeiras
CREATE TABLE IF NOT EXISTS categorias_financeiras (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('receita', 'despesa')),
    cor VARCHAR(7) DEFAULT '#3B82F6', -- Cor em hexadecimal para identificação visual
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de lançamentos financeiros
CREATE TABLE IF NOT EXISTS lancamentos_financeiros (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    categoria_id UUID NOT NULL REFERENCES categorias_financeiras(id) ON DELETE RESTRICT,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('receita', 'despesa')),
    descricao VARCHAR(255) NOT NULL,
    valor DECIMAL(10,2) NOT NULL CHECK (valor > 0),
    data_lancamento DATE NOT NULL,
    observacao TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_categorias_financeiras_empresa_id ON categorias_financeiras(empresa_id);
CREATE INDEX IF NOT EXISTS idx_categorias_financeiras_tipo ON categorias_financeiras(tipo);
CREATE INDEX IF NOT EXISTS idx_lancamentos_financeiros_empresa_id ON lancamentos_financeiros(empresa_id);
CREATE INDEX IF NOT EXISTS idx_lancamentos_financeiros_categoria_id ON lancamentos_financeiros(categoria_id);
CREATE INDEX IF NOT EXISTS idx_lancamentos_financeiros_data ON lancamentos_financeiros(data_lancamento);
CREATE INDEX IF NOT EXISTS idx_lancamentos_financeiros_tipo ON lancamentos_financeiros(tipo);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_categorias_financeiras_updated_at 
    BEFORE UPDATE ON categorias_financeiras 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lancamentos_financeiros_updated_at 
    BEFORE UPDATE ON lancamentos_financeiros 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) para categorias_financeiras
ALTER TABLE categorias_financeiras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Empresas podem ver suas próprias categorias" ON categorias_financeiras
    FOR SELECT USING (
        empresa_id IN (
            SELECT id FROM empresas 
            WHERE owner_id = auth.uid()
        )
        OR 
        public.has_role(auth.uid(), 'admin_master')
    );

CREATE POLICY "Empresas podem inserir suas próprias categorias" ON categorias_financeiras
    FOR INSERT WITH CHECK (
        empresa_id IN (
            SELECT id FROM empresas 
            WHERE owner_id = auth.uid()
        )
        OR 
        public.has_role(auth.uid(), 'admin_master')
    );

CREATE POLICY "Empresas podem atualizar suas próprias categorias" ON categorias_financeiras
    FOR UPDATE USING (
        empresa_id IN (
            SELECT id FROM empresas 
            WHERE owner_id = auth.uid()
        )
        OR 
        public.has_role(auth.uid(), 'admin_master')
    );

CREATE POLICY "Empresas podem deletar suas próprias categorias" ON categorias_financeiras
    FOR DELETE USING (
        empresa_id IN (
            SELECT id FROM empresas 
            WHERE owner_id = auth.uid()
        )
        OR 
        public.has_role(auth.uid(), 'admin_master')
    );

-- RLS (Row Level Security) para lancamentos_financeiros
ALTER TABLE lancamentos_financeiros ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Empresas podem ver seus próprios lançamentos" ON lancamentos_financeiros
    FOR SELECT USING (
        empresa_id IN (
            SELECT id FROM empresas 
            WHERE owner_id = auth.uid()
        )
        OR 
        public.has_role(auth.uid(), 'admin_master')
    );

CREATE POLICY "Empresas podem inserir seus próprios lançamentos" ON lancamentos_financeiros
    FOR INSERT WITH CHECK (
        empresa_id IN (
            SELECT id FROM empresas 
            WHERE owner_id = auth.uid()
        )
        OR 
        public.has_role(auth.uid(), 'admin_master')
    );

CREATE POLICY "Empresas podem atualizar seus próprios lançamentos" ON lancamentos_financeiros
    FOR UPDATE USING (
        empresa_id IN (
            SELECT id FROM empresas 
            WHERE owner_id = auth.uid()
        )
        OR 
        public.has_role(auth.uid(), 'admin_master')
    );

CREATE POLICY "Empresas podem deletar seus próprios lançamentos" ON lancamentos_financeiros
    FOR DELETE USING (
        empresa_id IN (
            SELECT id FROM empresas 
            WHERE owner_id = auth.uid()
        )
        OR 
        public.has_role(auth.uid(), 'admin_master')
    );

-- Inserir algumas categorias padrão para facilitar o uso inicial
INSERT INTO categorias_financeiras (empresa_id, nome, tipo, cor) 
SELECT 
    e.id,
    categoria.nome,
    categoria.tipo,
    categoria.cor
FROM empresas e
CROSS JOIN (
    VALUES 
    ('Vendas', 'receita', '#10B981'),
    ('Serviços', 'receita', '#3B82F6'),
    ('Outras Receitas', 'receita', '#8B5CF6'),
    ('Aluguel', 'despesa', '#EF4444'),
    ('Salários', 'despesa', '#F59E0B'),
    ('Fornecedores', 'despesa', '#EC4899'),
    ('Marketing', 'despesa', '#06B6D4'),
    ('Outras Despesas', 'despesa', '#6B7280')
) AS categoria(nome, tipo, cor)
WHERE NOT EXISTS (
    SELECT 1 FROM categorias_financeiras cf 
    WHERE cf.empresa_id = e.id
);