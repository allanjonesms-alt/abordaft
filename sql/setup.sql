
-- ... (tabelas anteriores permanecem)

-- 5. Tabela de Outros Anexos (Documentos, PDFs, etc)
CREATE TABLE IF NOT EXISTS individuos_anexos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    individuo_id UUID REFERENCES individuos(id) ON DELETE CASCADE,
    nome_arquivo TEXT NOT NULL,
    tipo_mime TEXT,
    path TEXT NOT NULL, -- Armazenamento em Base64 ou URL
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
