-- =================================================
-- GERADOR DE IMAGENS DE LOTERIA - SETUP COMPLETO
-- Arquivo único para criar banco de dados do zero
-- Compatível com Neon PostgreSQL
-- =================================================

-- =================================================
-- CONFIGURAÇÃO INICIAL
-- =================================================

-- Script para adicionar colunas novas aos templates existentes
-- ALTER TABLE templates ADD COLUMN IF NOT EXISTS image_is_background BOOLEAN DEFAULT true;
-- ALTER TABLE templates ADD COLUMN IF NOT EXISTS canvas_width INTEGER;
-- ALTER TABLE templates ADD COLUMN IF NOT EXISTS canvas_height INTEGER;

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =================================================
-- TABELAS DO SISTEMA
-- =================================================

-- 1. Tabela de usuários
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    avatar_url TEXT,
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'user', 'moderator')),
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de templates
CREATE TABLE templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    image_key TEXT,
    lottery_type VARCHAR(100),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft')),
    is_public BOOLEAN DEFAULT false,
    image_is_background BOOLEAN DEFAULT true,
    canvas_width INTEGER,
    canvas_height INTEGER,
    usage_count INTEGER DEFAULT 0,
    average_generation_time DECIMAL(5,2),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de placeholders dos templates
CREATE TABLE template_placeholders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    placeholder_type VARCHAR(50) DEFAULT 'text' CHECK (placeholder_type IN ('text', 'image')),
    x_position INTEGER NOT NULL,
    y_position INTEGER NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    font_family VARCHAR(100) DEFAULT 'Inter',
    font_size INTEGER DEFAULT 24,
    font_color VARCHAR(20) DEFAULT '#000000',
    font_weight VARCHAR(20) DEFAULT 'normal',
    text_align VARCHAR(20) DEFAULT 'left' CHECK (text_align IN ('left', 'center', 'right')),
    background_color VARCHAR(20),
    border_radius INTEGER DEFAULT 0,
    opacity DECIMAL(3,2) DEFAULT 1.0,
    z_index INTEGER DEFAULT 0,
    is_visible BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(template_id, name)
);

-- 4. Tabela de sorteios das loterias
CREATE TABLE lottery_draws (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lottery_type VARCHAR(100) NOT NULL,
    draw_number INTEGER NOT NULL,
    draw_date DATE NOT NULL,
    result_data JSONB NOT NULL,
    is_special BOOLEAN DEFAULT false,
    prize_value DECIMAL(15,2),
    next_draw_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(lottery_type, draw_number)
);

-- 5. Tabela de imagens geradas
CREATE TABLE generated_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    lottery_draw_id UUID REFERENCES lottery_draws(id) ON DELETE SET NULL,
    image_url TEXT NOT NULL,
    image_key TEXT,
    thumbnail_url TEXT,
    file_size INTEGER,
    width INTEGER,
    height INTEGER,
    format VARCHAR(10) DEFAULT 'png',
    generation_time DECIMAL(5,2),
    is_downloaded BOOLEAN DEFAULT false,
    download_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Tabela de estatísticas de uso dos templates
CREATE TABLE template_usage_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    usage_count INTEGER DEFAULT 0,
    total_generation_time DECIMAL(8,2) DEFAULT 0,
    average_generation_time DECIMAL(5,2),
    success_rate DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(template_id, date)
);

-- 7. Tabela de sessões de usuário
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_token TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =================================================
-- ÍNDICES PARA PERFORMANCE
-- =================================================

-- Índices para templates
CREATE INDEX idx_templates_status ON templates(status);
CREATE INDEX idx_templates_lottery_type ON templates(lottery_type);
CREATE INDEX idx_templates_created_by ON templates(created_by);
CREATE INDEX idx_templates_created_at ON templates(created_at DESC);

-- Índices para placeholders
CREATE INDEX idx_placeholders_template_id ON template_placeholders(template_id);

-- Índices para sorteios
CREATE INDEX idx_lottery_draws_type_number ON lottery_draws(lottery_type, draw_number DESC);
CREATE INDEX idx_lottery_draws_date ON lottery_draws(draw_date DESC);

-- Índices para imagens geradas
CREATE INDEX idx_generated_images_template_id ON generated_images(template_id);
CREATE INDEX idx_generated_images_created_at ON generated_images(created_at DESC);
CREATE INDEX idx_generated_images_created_by ON generated_images(created_by);

-- Índices para estatísticas
CREATE INDEX idx_usage_stats_template_date ON template_usage_stats(template_id, date DESC);

-- =================================================
-- TRIGGERS PARA AUTO-ATUALIZAÇÃO
-- =================================================

-- Trigger para users
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_users_updated_at();

-- Trigger para templates
CREATE OR REPLACE FUNCTION update_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_templates_updated_at
    BEFORE UPDATE ON templates
    FOR EACH ROW
    EXECUTE FUNCTION update_templates_updated_at();

-- Trigger para placeholders
CREATE OR REPLACE FUNCTION update_placeholders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_placeholders_updated_at
    BEFORE UPDATE ON template_placeholders
    FOR EACH ROW
    EXECUTE FUNCTION update_placeholders_updated_at();

-- =================================================
-- DADOS INICIAIS E DE EXEMPLO
-- =================================================

-- Usuário administrador
INSERT INTO users (id, email, name, role) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'admin@loteria.com', 'Administrador', 'admin');

-- Templates principais
INSERT INTO templates (id, name, description, image_url, lottery_type, status, usage_count, average_generation_time, created_by) VALUES
-- Mega-Sena Principal
('550e8400-e29b-41d4-a716-446655440001', 'Mega-Sena Principal', 'Template principal para resultados da Mega-Sena com design moderno', '/megasena-template.png', 'mega-sena', 'active', 1247, 2.3, '550e8400-e29b-41d4-a716-446655440000'),

-- Lotofácil Resultados
('550e8400-e29b-41d4-a716-446655440002', 'Lotofácil Resultados', 'Template para sorteios da Lotofácil com layout limpo', '/lotofacil-template.png', 'lotofacil', 'inactive', 856, 1.8, '550e8400-e29b-41d4-a716-446655440000'),

-- Mega-Sena Clássico
('550e8400-e29b-41d4-a716-446655440003', 'Mega-Sena Clássico', 'Versão clássica do template Mega-Sena com design tradicional', '/megasena-template.png', 'mega-sena', 'active', 523, 2.1, '550e8400-e29b-41d4-a716-446655440000'),

-- Quina Resultados
('550e8400-e29b-41d4-a716-446655440004', 'Quina Resultados', 'Template para sorteios da Quina com cores vibrantes', '/quina-template.png', 'quina', 'active', 389, 1.9, '550e8400-e29b-41d4-a716-446655440000'),

-- Lotomania Sorteios
('550e8400-e29b-41d4-a716-446655440005', 'Lotomania Sorteios', 'Template especial para sorteios da Lotomania', '/lotomania-template.png', 'lotomania', 'active', 234, 2.4, '550e8400-e29b-41d4-a716-446655440000'),

-- Timemania Resultados
('550e8400-e29b-41d4-a716-446655440006', 'Timemania Resultados', 'Template para sorteios da Timemania', '/timemania-template.png', 'timemania', 'draft', 0, NULL, '550e8400-e29b-41d4-a716-446655440000');

-- =================================================
-- PLACEHOLDERS PARA CADA TEMPLATE
-- =================================================

-- Placeholders - Mega-Sena Principal
INSERT INTO template_placeholders (id, template_id, name, placeholder_type, x_position, y_position, width, height, font_family, font_size, font_color, font_weight, text_align) VALUES
('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440001', '{{VALOR_PREMIO}}', 'text', 150, 300, 800, 200, 'Inter Black', 180, '#00FF00', 'bold', 'center'),
('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440001', '{{NUM_GANHADORES}}', 'text', 200, 550, 700, 100, 'Inter Bold', 90, '#FFFF00', 'bold', 'center'),
('550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440001', '{{STATUS_ACUMULADO}}', 'text', 200, 750, 700, 100, 'Inter Bold', 90, '#FFFF00', 'bold', 'center'),
('550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440001', '{{NUMEROS_SORTEADOS}}', 'text', 100, 150, 900, 120, 'Arial Black', 72, '#FF0000', 'bold', 'center'),
('550e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440001', '{{CONCURSO_ATUAL}}', 'text', 100, 50, 400, 80, 'Arial', 48, '#000000', 'normal', 'left'),
('550e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440001', '{{DATA_SORTEIO}}', 'text', 100, 900, 300, 60, 'Arial', 36, '#666666', 'normal', 'left');

-- Placeholders - Lotofácil Resultados
INSERT INTO template_placeholders (id, template_id, name, placeholder_type, x_position, y_position, width, height, font_family, font_size, font_color, font_weight, text_align) VALUES
('550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440002', '{{VALOR_LOTOFACIL}}', 'text', 100, 250, 600, 150, 'Inter Black', 120, '#0066CC', 'bold', 'center'),
('550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440002', '{{NUM_SORTEADO}}', 'text', 100, 450, 600, 80, 'Inter Regular', 60, '#333333', 'normal', 'center'),
('550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440002', '{{CONCURSO_LOTOFACIL}}', 'text', 50, 50, 300, 60, 'Arial', 36, '#000000', 'normal', 'left'),
('550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440002', '{{GANHADORES_LOTOFACIL}}', 'text', 100, 600, 600, 100, 'Inter Bold', 48, '#008000', 'bold', 'center');

-- Placeholders - Mega-Sena Clássico
INSERT INTO template_placeholders (id, template_id, name, placeholder_type, x_position, y_position, width, height, font_family, font_size, font_color, font_weight, text_align) VALUES
('550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440003', '{{PREMIO_PRINCIPAL}}', 'text', 120, 280, 760, 180, 'Arial Black', 160, '#FFD700', 'bold', 'center'),
('550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440003', '{{CONCURSO_NUMERO}}', 'text', 120, 500, 760, 60, 'Arial', 48, '#FFFFFF', 'normal', 'center'),
('550e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440003', '{{DATA_SORTEIO}}', 'text', 120, 580, 760, 40, 'Arial', 32, '#CCCCCC', 'normal', 'center'),
('550e8400-e29b-41d4-a716-446655440033', '550e8400-e29b-41d4-a716-446655440003', '{{NUMEROS_MEGA}}', 'text', 120, 150, 760, 100, 'Arial Black', 64, '#FF0000', 'bold', 'center'),
('550e8400-e29b-41d4-a716-446655440034', '550e8400-e29b-41d4-a716-446655440003', '{{GANHADORES_MEGA}}', 'text', 120, 650, 760, 80, 'Arial', 40, '#00FF00', 'normal', 'center');

-- Placeholders - Quina Resultados
INSERT INTO template_placeholders (id, template_id, name, placeholder_type, x_position, y_position, width, height, font_family, font_size, font_color, font_weight, text_align) VALUES
('550e8400-e29b-41d4-a716-446655440040', '550e8400-e29b-41d4-a716-446655440004', '{{VALOR_QUINA}}', 'text', 100, 300, 700, 150, 'Inter Black', 140, '#FF6600', 'bold', 'center'),
('550e8400-e29b-41d4-a716-446655440041', '550e8400-e29b-41d4-a716-446655440004', '{{NUMEROS_QUINA}}', 'text', 100, 150, 700, 100, 'Arial Black', 56, '#FF4500', 'bold', 'center'),
('550e8400-e29b-41d4-a716-446655440042', '550e8400-e29b-41d4-a716-446655440004', '{{CONCURSO_QUINA}}', 'text', 50, 50, 350, 60, 'Arial', 42, '#000000', 'normal', 'left'),
('550e8400-e29b-41d4-a716-446655440043', '550e8400-e29b-41d4-a716-446655440004', '{{GANHADORES_QUINA}}', 'text', 100, 500, 700, 100, 'Inter Bold', 48, '#FFA500', 'bold', 'center');

-- Placeholders - Lotomania Sorteios
INSERT INTO template_placeholders (id, template_id, name, placeholder_type, x_position, y_position, width, height, font_family, font_size, font_color, font_weight, text_align) VALUES
('550e8400-e29b-41d4-a716-446655440050', '550e8400-e29b-41d4-a716-446655440005', '{{VALOR_LOTOMANIA}}', 'text', 80, 250, 640, 150, 'Inter Black', 130, '#8B4513', 'bold', 'center'),
('550e8400-e29b-41d4-a716-446655440051', '550e8400-e29b-41d4-a716-446655440005', '{{NUMEROS_LOTOMANIA}}', 'text', 80, 120, 640, 100, 'Arial Black', 52, '#654321', 'bold', 'center'),
('550e8400-e29b-41d4-a716-446655440052', '550e8400-e29b-41d4-a716-446655440005', '{{CONCURSO_LOTOMANIA}}', 'text', 50, 40, 300, 60, 'Arial', 38, '#000000', 'normal', 'left'),
('550e8400-e29b-41d4-a716-446655440053', '550e8400-e29b-41d4-a716-446655440005', '{{GANHADORES_LOTOMANIA}}', 'text', 80, 450, 640, 120, 'Inter Bold', 46, '#D2691E', 'bold', 'center');

-- =================================================
-- SORTEIOS DE EXEMPLO
-- =================================================

INSERT INTO lottery_draws (id, lottery_type, draw_number, draw_date, result_data, prize_value, next_draw_date) VALUES
-- Mega-Sena
('550e8400-e29b-41d4-a716-446655440100', 'mega-sena', 2916, '2025-09-20', '{"acumulado": 1, "data_proximo_concurso": "2025-09-23", "dezenas_sorteadas": ["16", "11", "45", "05", "27", "40"], "f1_ganhadores": 0, "valor_estimado_prox_concurso": 40000000}', 40000000.00, '2025-09-23'),

-- Lotofácil
('550e8400-e29b-41d4-a716-446655440101', 'lotofacil', 3200, '2025-09-19', '{"concurso": 3200, "data": "2025-09-21", "dezenas_sorteadas": ["01", "05", "08", "12", "15", "19", "22", "24", "27", "31", "35", "38", "42", "45", "47"], "valor_premio": 2500000.00}', 2500000.00, '2025-09-21'),

-- Quina
('550e8400-e29b-41d4-a716-446655440102', 'quina', 6000, '2025-09-20', '{"concurso": 6000, "data": "2025-09-20", "dezenas_sorteadas": ["12", "25", "33", "41", "47"], "valor_premio": 1500000.00}', 1500000.00, '2025-09-21'),

-- Lotomania
('550e8400-e29b-41d4-a716-446655440103', 'lotomania', 2500, '2025-09-19', '{"concurso": 2500, "data": "2025-09-21", "dezenas_sorteadas": ["05", "12", "18", "23", "29", "34", "41", "47", "52", "58", "63", "67", "72", "78", "83", "89", "94", "99"], "valor_premio": 1500000.00}', 1500000.00, '2025-09-21'),

-- Timemania
('550e8400-e29b-41d4-a716-446655440104', 'timemania', 1800, '2025-09-20', '{"concurso": 1800, "data": "2025-09-22", "dezenas_sorteadas": ["02", "07", "13", "18", "24", "29", "35", "40"], "time_sorteado": "Flamengo", "valor_premio": 800000.00}', 800000.00, '2025-09-22');

-- =================================================
-- ESTATÍSTICAS DE USO INICIAIS
-- =================================================

INSERT INTO template_usage_stats (id, template_id, date, usage_count, average_generation_time) VALUES
('550e8400-e29b-41d4-a716-446655440200', '550e8400-e29b-41d4-a716-446655440001', CURRENT_DATE, 15, 2.3),
('550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440002', CURRENT_DATE, 8, 1.8),
('550e8400-e29b-41d4-a716-446655440202', '550e8400-e29b-41d4-a716-446655440003', CURRENT_DATE, 12, 2.1),
('550e8400-e29b-41d4-a716-446655440203', '550e8400-e29b-41d4-a716-446655440004', CURRENT_DATE, 10, 1.9),
('550e8400-e29b-41d4-a716-446655440204', '550e8400-e29b-41d4-a716-446655440005', CURRENT_DATE, 6, 2.4);

-- =================================================
-- VIEWS PARA FACILITAR CONSULTAS
-- =================================================

-- View para estatísticas do dashboard
CREATE VIEW dashboard_stats AS
SELECT
    (SELECT COUNT(*) FROM templates WHERE status = 'active') as total_templates,
    (SELECT COUNT(*) FROM generated_images WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as images_last_30_days,
    (SELECT COALESCE(AVG(generation_time), 0) FROM generated_images WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as avg_generation_time,
    (SELECT COUNT(DISTINCT created_by) FROM generated_images WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as active_users_week
FROM templates LIMIT 1;

-- View para templates com estatísticas
CREATE VIEW templates_with_stats AS
SELECT
    t.*,
    COALESCE(us.usage_count, 0) as usage_today,
    COALESCE(us.average_generation_time, t.average_generation_time) as current_avg_time
FROM templates t
LEFT JOIN template_usage_stats us ON t.id = us.template_id AND us.date = CURRENT_DATE;

-- =================================================
-- FUNÇÕES AUXILIARES
-- =================================================

-- Função para atualizar estatísticas de uso
CREATE OR REPLACE FUNCTION update_template_usage(p_template_id UUID, p_generation_time DECIMAL DEFAULT NULL)
RETURNS VOID AS $$
BEGIN
    INSERT INTO template_usage_stats (template_id, date, usage_count, total_generation_time, average_generation_time)
    VALUES (
        p_template_id,
        CURRENT_DATE,
        1,
        COALESCE(p_generation_time, 0),
        COALESCE(p_generation_time, 0)
    )
    ON CONFLICT (template_id, date)
    DO UPDATE SET
        usage_count = template_usage_stats.usage_count + 1,
        total_generation_time = template_usage_stats.total_generation_time + COALESCE(p_generation_time, 0),
        average_generation_time = CASE
            WHEN template_usage_stats.usage_count + 1 > 0
            THEN (template_usage_stats.total_generation_time + COALESCE(p_generation_time, 0)) / (template_usage_stats.usage_count + 1)
            ELSE 0
        END;

    -- Atualizar contador no template
    UPDATE templates
    SET usage_count = usage_count + 1,
        average_generation_time = (
            SELECT average_generation_time
            FROM template_usage_stats
            WHERE template_id = p_template_id AND date = CURRENT_DATE
        )
    WHERE id = p_template_id;
END;
$$ LANGUAGE plpgsql;

-- =================================================
-- POLÍTICAS DE SEGURANÇA (RLS)
-- =================================================

-- Habilitar RLS nas tabelas principais
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_images ENABLE ROW LEVEL SECURITY;

-- Políticas para usuários
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Políticas para templates
CREATE POLICY "Users can view public templates or own templates" ON templates
    FOR SELECT USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Users can create templates" ON templates
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own templates" ON templates
    FOR UPDATE USING (created_by = auth.uid());

-- Políticas para imagens geradas
CREATE POLICY "Users can view images from templates they can access" ON generated_images
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM templates t
            WHERE t.id = template_id
            AND (t.is_public = true OR t.created_by = auth.uid())
        )
    );

CREATE POLICY "Users can create images" ON generated_images
    FOR INSERT WITH CHECK (auth.uid() = created_by);

-- =================================================
-- COMENTÁRIOS NAS TABELAS
-- =================================================

COMMENT ON TABLE users IS 'Usuários do sistema';
COMMENT ON TABLE templates IS 'Templates de imagem para geração automática';
COMMENT ON TABLE template_placeholders IS 'Placeholders configuráveis nos templates';
COMMENT ON TABLE lottery_draws IS 'Dados dos sorteios das loterias';
COMMENT ON TABLE generated_images IS 'Imagens geradas a partir dos templates';
COMMENT ON TABLE template_usage_stats IS 'Estatísticas de uso dos templates';
COMMENT ON TABLE user_sessions IS 'Sessões ativas dos usuários';

-- =================================================
-- VERIFICAÇÃO FINAL
-- =================================================

-- Mostrar resumo dos dados criados
SELECT
    '✅ Setup concluído com sucesso!' as status,
    NOW() as data_hora;

-- Contagem de registros por tabela
SELECT
    'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'templates' as table_name, COUNT(*) as count FROM templates
UNION ALL
SELECT 'template_placeholders' as table_name, COUNT(*) as count FROM template_placeholders
UNION ALL
SELECT 'lottery_draws' as table_name, COUNT(*) as count FROM lottery_draws
UNION ALL
SELECT 'generated_images' as table_name, COUNT(*) as count FROM generated_images
UNION ALL
SELECT 'template_usage_stats' as table_name, COUNT(*) as count FROM template_usage_stats
UNION ALL
SELECT 'user_sessions' as table_name, COUNT(*) as count FROM user_sessions;

-- Mostrar templates criados
SELECT
    name as template_name,
    lottery_type,
    status,
    usage_count,
    average_generation_time
FROM templates
ORDER BY name;

-- =================================================
-- FIM DO SETUP COMPLETO
-- =================================================

-- 🎉 BANCO DE DADOS CRIADO COM SUCESSO!
-- Todos os templates, placeholders e dados de exemplo foram inseridos.
-- Você pode testar acessando: http://localhost:3000/editor?template=550e8400-e29b-41d4-a716-446655440001
