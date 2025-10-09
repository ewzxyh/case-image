-- =================================================
-- GERADOR DE IMAGENS - SETUP COMPLETO (INSTALAÇÃO LIMPA)
-- Sistema de Image Templates com múltiplos canvases
-- Media Library e Generated Images Gallery
-- Compatível com Neon PostgreSQL
-- =================================================

-- =================================================
-- INSTALAÇÃO LIMPA - DROP TABLES
-- =================================================

BEGIN;

-- Drop tables na ordem correta (dependências primeiro)
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS template_usage_stats CASCADE;
DROP TABLE IF EXISTS generated_images CASCADE;
DROP TABLE IF EXISTS lottery_draws CASCADE;
DROP TABLE IF EXISTS template_placeholders CASCADE;
DROP TABLE IF EXISTS template_canvases CASCADE;
DROP TABLE IF EXISTS media_assets CASCADE;
DROP TABLE IF EXISTS templates CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop views
DROP VIEW IF EXISTS dashboard_stats CASCADE;
DROP VIEW IF EXISTS templates_with_stats CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS update_template_usage(UUID, DECIMAL, UUID) CASCADE;
DROP FUNCTION IF EXISTS update_users_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_templates_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_placeholders_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_media_assets_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_canvases_updated_at() CASCADE;
DROP FUNCTION IF EXISTS normalize_placeholder_positions() CASCADE;

-- =================================================
-- EXTENSÕES NECESSÁRIAS
-- =================================================

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

-- 2. Tabela de Media Library (biblioteca de mídia)
CREATE TABLE media_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    file_key TEXT,
    thumbnail_url TEXT,
    file_type VARCHAR(50), -- image/png, image/jpeg, etc
    file_size INTEGER, -- bytes
    width INTEGER,
    height INTEGER,
    is_public BOOLEAN DEFAULT false,
    tags TEXT[], -- array de tags para busca
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de Image Templates
CREATE TABLE templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    lottery_type VARCHAR(100), -- mega-sena, lotofacil, etc
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft')),
    is_public BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    average_generation_time DECIMAL(5,2),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabela de Canvases (páginas do template)
CREATE TABLE template_canvases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    name VARCHAR(255) DEFAULT 'Canvas',
    canvas_order INTEGER NOT NULL DEFAULT 1,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    background_color VARCHAR(20) DEFAULT '#FFFFFF',
    background_asset_id UUID REFERENCES media_assets(id) ON DELETE SET NULL,
    is_background_cover BOOLEAN DEFAULT true, -- true=cover, false=contain
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(template_id, canvas_order)
);

-- 5. Tabela de Placeholders/Layers (elementos do canvas)
CREATE TABLE template_placeholders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    canvas_id UUID NOT NULL REFERENCES template_canvases(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    placeholder_type VARCHAR(50) DEFAULT 'text' CHECK (placeholder_type IN ('text', 'image')),
    
    -- Posicionamento e dimensões (pixels)
    x_position INTEGER NOT NULL,
    y_position INTEGER NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    z_index INTEGER DEFAULT 0,
    
    -- Posicionamento normalizado (ratios 0-1 relativos ao canvas)
    x_ratio DECIMAL(6,5) CHECK (x_ratio IS NULL OR (x_ratio >= 0 AND x_ratio <= 1)),
    y_ratio DECIMAL(6,5) CHECK (y_ratio IS NULL OR (y_ratio >= 0 AND y_ratio <= 1)),
    width_ratio DECIMAL(6,5) CHECK (width_ratio IS NULL OR (width_ratio >= 0 AND width_ratio <= 1)),
    height_ratio DECIMAL(6,5) CHECK (height_ratio IS NULL OR (height_ratio >= 0 AND height_ratio <= 1)),
    
    -- Âncoras para alinhamento
    anchor_h VARCHAR(10) DEFAULT 'left' CHECK (anchor_h IN ('left', 'center', 'right')),
    anchor_v VARCHAR(10) DEFAULT 'top' CHECK (anchor_v IN ('top', 'middle', 'bottom')),
    is_background BOOLEAN DEFAULT false,
    
    -- Propriedades de texto
    text_content TEXT, -- conteúdo padrão ou placeholder {{VALOR}}
    font_family VARCHAR(100) DEFAULT 'Inter',
    font_size INTEGER DEFAULT 24,
    font_color VARCHAR(20) DEFAULT '#000000',
    font_weight VARCHAR(20) DEFAULT 'normal',
    text_align VARCHAR(20) DEFAULT 'left' CHECK (text_align IN ('left', 'center', 'right')),
    line_height DECIMAL(3,2) DEFAULT 1.2,
    
    -- Propriedades de imagem
    image_asset_id UUID REFERENCES media_assets(id) ON DELETE SET NULL,
    image_url TEXT, -- URL externa alternativa
    image_position VARCHAR(20) DEFAULT 'cover' CHECK (image_position IN ('cover', 'contain', 'fill', 'align', 'crop', 'background')),
    image_align_h VARCHAR(20) DEFAULT 'center' CHECK (image_align_h IN ('left', 'center', 'right', 'full')),
    image_align_v VARCHAR(20) DEFAULT 'center' CHECK (image_align_v IN ('top', 'center', 'bottom', 'full')),
    
    -- Estilização comum
    background_color VARCHAR(20),
    border_color VARCHAR(20),
    border_width VARCHAR(10) DEFAULT '0px',
    border_radius INTEGER DEFAULT 0,
    opacity DECIMAL(3,2) DEFAULT 1.0,
    is_visible BOOLEAN DEFAULT true,
    is_static BOOLEAN DEFAULT false,
    hide_if_empty BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(canvas_id, name)
);

-- 6. Tabela de sorteios das loterias
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

-- 7. Tabela de Generated Images (galeria de imagens geradas)
CREATE TABLE generated_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    canvas_id UUID REFERENCES template_canvases(id) ON DELETE SET NULL, -- se for multipage
    lottery_draw_id UUID REFERENCES lottery_draws(id) ON DELETE SET NULL,
    page_index INTEGER DEFAULT 1, -- para templates multipage
    
    -- Arquivos gerados
    image_url TEXT NOT NULL,
    image_key TEXT,
    thumbnail_url TEXT,
    retina_thumbnail_url TEXT,
    
    -- Metadados
    file_size INTEGER,
    width INTEGER,
    height INTEGER,
    format VARCHAR(10) DEFAULT 'png',
    metadata TEXT, -- dados customizados
    
    -- Estatísticas
    generation_time DECIMAL(5,2),
    is_downloaded BOOLEAN DEFAULT false,
    download_count INTEGER DEFAULT 0,
    
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Tabela de estatísticas de uso dos templates
CREATE TABLE template_usage_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    canvas_id UUID REFERENCES template_canvases(id) ON DELETE SET NULL, -- opcional
    date DATE NOT NULL,
    usage_count INTEGER DEFAULT 0,
    total_generation_time DECIMAL(8,2) DEFAULT 0,
    average_generation_time DECIMAL(5,2),
    success_rate DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Tabela de sessões de usuário
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

-- Índices para media_assets
CREATE INDEX idx_media_assets_created_by ON media_assets(created_by);
CREATE INDEX idx_media_assets_file_type ON media_assets(file_type);
CREATE INDEX idx_media_assets_created_at ON media_assets(created_at DESC);
CREATE INDEX idx_media_assets_tags ON media_assets USING GIN(tags);

-- Índices para templates
CREATE INDEX idx_templates_status ON templates(status);
CREATE INDEX idx_templates_lottery_type ON templates(lottery_type);
CREATE INDEX idx_templates_created_by ON templates(created_by);
CREATE INDEX idx_templates_created_at ON templates(created_at DESC);

-- Índices para canvases
CREATE INDEX idx_canvases_template_id ON template_canvases(template_id);
CREATE INDEX idx_canvases_order ON template_canvases(template_id, canvas_order);

-- Índices para placeholders
CREATE INDEX idx_placeholders_canvas_id ON template_placeholders(canvas_id);
CREATE INDEX idx_placeholders_type ON template_placeholders(placeholder_type);
CREATE INDEX idx_placeholders_z_index ON template_placeholders(canvas_id, z_index);
CREATE INDEX idx_placeholders_background ON template_placeholders(canvas_id, is_background) WHERE is_background = true;

-- Índices para sorteios
CREATE INDEX idx_lottery_draws_type_number ON lottery_draws(lottery_type, draw_number DESC);
CREATE INDEX idx_lottery_draws_date ON lottery_draws(draw_date DESC);

-- Índices para imagens geradas
CREATE INDEX idx_generated_images_template_id ON generated_images(template_id);
CREATE INDEX idx_generated_images_canvas_id ON generated_images(canvas_id);
CREATE INDEX idx_generated_images_created_at ON generated_images(created_at DESC);
CREATE INDEX idx_generated_images_created_by ON generated_images(created_by);

-- Índices para estatísticas
CREATE INDEX idx_usage_stats_template_date ON template_usage_stats(template_id, date DESC);

-- Índices únicos parciais para template_usage_stats (para garantir unicidade com canvas_id NULL ou NOT NULL)
CREATE UNIQUE INDEX idx_usage_stats_template_canvas_date 
    ON template_usage_stats(template_id, canvas_id, date) 
    WHERE canvas_id IS NOT NULL;

CREATE UNIQUE INDEX idx_usage_stats_template_date_no_canvas 
    ON template_usage_stats(template_id, date) 
    WHERE canvas_id IS NULL;

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

-- Trigger para media_assets
CREATE OR REPLACE FUNCTION update_media_assets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_media_assets_updated_at
    BEFORE UPDATE ON media_assets
    FOR EACH ROW
    EXECUTE FUNCTION update_media_assets_updated_at();

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

-- Trigger para canvases
CREATE OR REPLACE FUNCTION update_canvases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_canvases_updated_at
    BEFORE UPDATE ON template_canvases
    FOR EACH ROW
    EXECUTE FUNCTION update_canvases_updated_at();

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

-- Trigger para normalizar posições (pixels <-> ratios)
CREATE OR REPLACE FUNCTION normalize_placeholder_positions()
RETURNS TRIGGER AS $$
DECLARE
    canvas_width INTEGER;
    canvas_height INTEGER;
BEGIN
    -- Buscar dimensões do canvas
    SELECT width, height INTO canvas_width, canvas_height
    FROM template_canvases
    WHERE id = NEW.canvas_id;

    -- Se recebeu pixels mas não tem ratios, calcular ratios
    IF NEW.x_ratio IS NULL AND canvas_width > 0 THEN
        NEW.x_ratio = LEAST(1.0, GREATEST(0.0, NEW.x_position::DECIMAL / canvas_width));
    END IF;

    IF NEW.y_ratio IS NULL AND canvas_height > 0 THEN
        NEW.y_ratio = LEAST(1.0, GREATEST(0.0, NEW.y_position::DECIMAL / canvas_height));
    END IF;

    IF NEW.width_ratio IS NULL AND canvas_width > 0 THEN
        NEW.width_ratio = LEAST(1.0, GREATEST(0.0, NEW.width::DECIMAL / canvas_width));
    END IF;

    IF NEW.height_ratio IS NULL AND canvas_height > 0 THEN
        NEW.height_ratio = LEAST(1.0, GREATEST(0.0, NEW.height::DECIMAL / canvas_height));
    END IF;

    -- Se recebeu ratios, recalcular pixels
    IF NEW.x_ratio IS NOT NULL AND canvas_width > 0 THEN
        NEW.x_position = ROUND(NEW.x_ratio * canvas_width);
    END IF;

    IF NEW.y_ratio IS NOT NULL AND canvas_height > 0 THEN
        NEW.y_position = ROUND(NEW.y_ratio * canvas_height);
    END IF;

    IF NEW.width_ratio IS NOT NULL AND canvas_width > 0 THEN
        NEW.width = ROUND(NEW.width_ratio * canvas_width);
    END IF;

    IF NEW.height_ratio IS NOT NULL AND canvas_height > 0 THEN
        NEW.height = ROUND(NEW.height_ratio * canvas_height);
    END IF;

    -- Para background, garantir que cobre todo o canvas
    IF NEW.is_background = true THEN
        NEW.x_position = 0;
        NEW.y_position = 0;
        NEW.width = canvas_width;
        NEW.height = canvas_height;
        NEW.x_ratio = 0;
        NEW.y_ratio = 0;
        NEW.width_ratio = 1.0;
        NEW.height_ratio = 1.0;
        NEW.anchor_h = 'center';
        NEW.anchor_v = 'middle';
        NEW.z_index = LEAST(NEW.z_index, -100); -- Backgrounds vão para trás
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_normalize_placeholder_positions
    BEFORE INSERT OR UPDATE ON template_placeholders
    FOR EACH ROW
    EXECUTE FUNCTION normalize_placeholder_positions();

-- =================================================
-- DADOS INICIAIS E DE EXEMPLO
-- =================================================

-- Usuário administrador
INSERT INTO users (id, email, name, role) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'admin@loteria.com', 'Administrador', 'admin');

-- Media Assets (imagens de fundo)
INSERT INTO media_assets (id, name, description, file_url, file_type, width, height, is_public, created_by) VALUES
('550e8400-e29b-41d4-a716-446655440100', 'Mega-Sena Template Background', 'Imagem de fundo para template Mega-Sena', '/megasena-template.png', 'image/png', 1080, 1920, true, '550e8400-e29b-41d4-a716-446655440000'),
('550e8400-e29b-41d4-a716-446655440101', 'Logo Mega-Sena', 'Logo oficial da Mega-Sena', '/uploads/templates/logo-megasena.png', 'image/png', 200, 200, true, '550e8400-e29b-41d4-a716-446655440000');

-- Image Templates
INSERT INTO templates (id, name, description, lottery_type, status, usage_count, average_generation_time, created_by) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Story', 'Template multipage para Instagram Stories com resultados de loterias', NULL, 'active', 0, NULL, '550e8400-e29b-41d4-a716-446655440000');

-- Template Canvases (páginas/canvases dos templates)
INSERT INTO template_canvases (id, template_id, name, canvas_order, width, height, background_color, background_asset_id) VALUES
('550e8400-e29b-41d4-a716-446655440200', '550e8400-e29b-41d4-a716-446655440001', 'Page 1 - Mega-Sena', 1, 1080, 1920, '#00A859', '550e8400-e29b-41d4-a716-446655440100'),
('550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440001', 'Page 2 - Lotofácil', 2, 1080, 1920, '#930089', NULL);

-- Template Placeholders/Layers (elementos dos canvases)

-- Page 1: Mega-Sena
INSERT INTO template_placeholders (id, canvas_id, name, placeholder_type, x_position, y_position, width, height, font_family, font_size, font_color, font_weight, text_align, text_content, z_index) VALUES
-- Header
('550e8400-e29b-41d4-a716-446655440300', '550e8400-e29b-41d4-a716-446655440200', 'titulo', 'text', 90, 150, 900, 120, 'Inter', 72, '#FFFFFF', 'bold', 'center', 'MEGA-SENA', 10),
('550e8400-e29b-41d4-a716-446655440301', '550e8400-e29b-41d4-a716-446655440200', 'concurso', 'text', 90, 280, 900, 60, 'Inter', 36, '#FFFFFF', 'normal', 'center', 'Concurso {{CONCURSO_NUMERO}}', 9),

-- Números sorteados
('550e8400-e29b-41d4-a716-446655440302', '550e8400-e29b-41d4-a716-446655440200', 'numeros', 'text', 90, 500, 900, 200, 'Inter', 90, '#FFFFFF', 'bold', 'center', '{{NUMEROS_SORTEADOS}}', 10),

-- Valor do prêmio
('550e8400-e29b-41d4-a716-446655440303', '550e8400-e29b-41d4-a716-446655440200', 'valor_label', 'text', 90, 800, 900, 60, 'Inter', 32, '#FFFFFF', 'normal', 'center', 'Prêmio estimado', 8),
('550e8400-e29b-41d4-a716-446655440304', '550e8400-e29b-41d4-a716-446655440200', 'valor_premio', 'text', 90, 870, 900, 150, 'Inter', 80, '#FFD700', 'bold', 'center', '{{VALOR_PREMIO}}', 10),

-- Status acumulado
('550e8400-e29b-41d4-a716-446655440305', '550e8400-e29b-41d4-a716-446655440200', 'status_acumulado', 'text', 90, 1100, 900, 80, 'Inter', 48, '#FFFF00', 'bold', 'center', '{{STATUS_ACUMULADO}}', 10),

-- Ganhadores
('550e8400-e29b-41d4-a716-446655440306', '550e8400-e29b-41d4-a716-446655440200', 'ganhadores', 'text', 90, 1250, 900, 100, 'Inter', 40, '#FFFFFF', 'normal', 'center', '{{NUM_GANHADORES}} ganhadores', 9),

-- Data do sorteio
('550e8400-e29b-41d4-a716-446655440307', '550e8400-e29b-41d4-a716-446655440200', 'data_sorteio', 'text', 90, 1700, 900, 60, 'Inter', 28, '#CCCCCC', 'normal', 'center', 'Sorteio: {{DATA_SORTEIO}}', 8);

-- Page 2: Lotofácil
INSERT INTO template_placeholders (id, canvas_id, name, placeholder_type, x_position, y_position, width, height, font_family, font_size, font_color, font_weight, text_align, text_content, z_index) VALUES
-- Header
('550e8400-e29b-41d4-a716-446655440310', '550e8400-e29b-41d4-a716-446655440201', 'titulo', 'text', 90, 150, 900, 120, 'Inter', 72, '#FFFFFF', 'bold', 'center', 'LOTOFÁCIL', 10),
('550e8400-e29b-41d4-a716-446655440311', '550e8400-e29b-41d4-a716-446655440201', 'concurso', 'text', 90, 280, 900, 60, 'Inter', 36, '#FFFFFF', 'normal', 'center', 'Concurso {{CONCURSO_NUMERO}}', 9),

-- Números sorteados (15 números da Lotofácil)
('550e8400-e29b-41d4-a716-446655440312', '550e8400-e29b-41d4-a716-446655440201', 'numeros', 'text', 90, 450, 900, 300, 'Inter', 60, '#FFFFFF', 'bold', 'center', '{{NUMEROS_SORTEADOS}}', 10),

-- Valor do prêmio
('550e8400-e29b-41d4-a716-446655440313', '550e8400-e29b-41d4-a716-446655440201', 'valor_label', 'text', 90, 850, 900, 60, 'Inter', 32, '#FFFFFF', 'normal', 'center', 'Prêmio estimado', 8),
('550e8400-e29b-41d4-a716-446655440314', '550e8400-e29b-41d4-a716-446655440201', 'valor_premio', 'text', 90, 920, 900, 150, 'Inter', 80, '#FFD700', 'bold', 'center', '{{VALOR_PREMIO}}', 10),

-- Ganhadores 15 acertos
('550e8400-e29b-41d4-a716-446655440315', '550e8400-e29b-41d4-a716-446655440201', 'ganhadores_15', 'text', 90, 1150, 900, 80, 'Inter', 38, '#FFFFFF', 'normal', 'center', '{{GANHADORES_15}} ganhadores (15 acertos)', 9),

-- Ganhadores 14 acertos
('550e8400-e29b-41d4-a716-446655440316', '550e8400-e29b-41d4-a716-446655440201', 'ganhadores_14', 'text', 90, 1250, 900, 70, 'Inter', 32, '#FFFFFF', 'normal', 'center', '{{GANHADORES_14}} ganhadores (14 acertos)', 8),

-- Data do sorteio
('550e8400-e29b-41d4-a716-446655440317', '550e8400-e29b-41d4-a716-446655440201', 'data_sorteio', 'text', 90, 1700, 900, 60, 'Inter', 28, '#CCCCCC', 'normal', 'center', 'Sorteio: {{DATA_SORTEIO}}', 8);

-- Sorteios de exemplo
INSERT INTO lottery_draws (id, lottery_type, draw_number, draw_date, result_data, prize_value, next_draw_date) VALUES
('550e8400-e29b-41d4-a716-446655440400', 'mega-sena', 2916, '2025-09-20', '{"acumulado": 1, "data_proximo_concurso": "2025-09-23", "dezenas_sorteadas": ["05", "11", "16", "27", "40", "45"], "f1_ganhadores": 0, "valor_estimado_prox_concurso": 40000000}', 40000000.00, '2025-09-23'),
('550e8400-e29b-41d4-a716-446655440401', 'lotofacil', 3200, '2025-09-19', '{"concurso": 3200, "data": "2025-09-21", "dezenas_sorteadas": ["01", "05", "08", "12", "15", "19", "22", "24", "27", "31", "35", "38", "42", "45", "47"], "valor_premio": 2500000.00}', 2500000.00, '2025-09-21'),
('550e8400-e29b-41d4-a716-446655440402', 'quina', 6000, '2025-09-20', '{"concurso": 6000, "data": "2025-09-20", "dezenas_sorteadas": ["12", "25", "33", "41", "47"], "valor_premio": 1500000.00}', 1500000.00, '2025-09-21');

-- =================================================
-- VIEWS PARA FACILITAR CONSULTAS
-- =================================================

-- View para estatísticas do dashboard
CREATE VIEW dashboard_stats AS
SELECT
    (SELECT COUNT(*) FROM templates WHERE status = 'active') as total_templates,
    (SELECT COUNT(*) FROM template_canvases) as total_canvases,
    (SELECT COUNT(*) FROM media_assets) as total_media_assets,
    (SELECT COUNT(*) FROM generated_images WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as images_last_30_days,
    (SELECT COALESCE(AVG(generation_time), 0) FROM generated_images WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as avg_generation_time,
    (SELECT COUNT(DISTINCT created_by) FROM generated_images WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as active_users_week
FROM templates LIMIT 1;

-- View para templates com estatísticas e contagem de canvases
CREATE VIEW templates_with_stats AS
SELECT
    t.*,
    COUNT(DISTINCT tc.id) as canvas_count,
    COALESCE(us.usage_count, 0) as usage_today,
    COALESCE(us.average_generation_time, t.average_generation_time) as current_avg_time
FROM templates t
LEFT JOIN template_canvases tc ON t.id = tc.template_id
LEFT JOIN template_usage_stats us ON t.id = us.template_id AND us.date = CURRENT_DATE AND us.canvas_id IS NULL
GROUP BY t.id, us.usage_count, us.average_generation_time;

-- =================================================
-- FUNÇÕES AUXILIARES
-- =================================================

-- Função para atualizar estatísticas de uso
CREATE OR REPLACE FUNCTION update_template_usage(p_template_id UUID, p_generation_time DECIMAL DEFAULT NULL, p_canvas_id UUID DEFAULT NULL)
RETURNS VOID AS $$
BEGIN
    -- Inserir ou atualizar estatísticas
    IF p_canvas_id IS NOT NULL THEN
        -- Com canvas específico
        INSERT INTO template_usage_stats (template_id, canvas_id, date, usage_count, total_generation_time, average_generation_time)
        VALUES (
            p_template_id,
            p_canvas_id,
            CURRENT_DATE,
            1,
            COALESCE(p_generation_time, 0),
            COALESCE(p_generation_time, 0)
        )
        ON CONFLICT ON CONSTRAINT idx_usage_stats_template_canvas_date
        DO UPDATE SET
            usage_count = template_usage_stats.usage_count + 1,
            total_generation_time = template_usage_stats.total_generation_time + COALESCE(p_generation_time, 0),
            average_generation_time = CASE
                WHEN template_usage_stats.usage_count + 1 > 0
                THEN (template_usage_stats.total_generation_time + COALESCE(p_generation_time, 0)) / (template_usage_stats.usage_count + 1)
                ELSE 0
            END;
    ELSE
        -- Sem canvas específico (estatística geral do template)
        INSERT INTO template_usage_stats (template_id, date, usage_count, total_generation_time, average_generation_time)
        VALUES (
            p_template_id,
            CURRENT_DATE,
            1,
            COALESCE(p_generation_time, 0),
            COALESCE(p_generation_time, 0)
        )
        ON CONFLICT ON CONSTRAINT idx_usage_stats_template_date_no_canvas
        DO UPDATE SET
            usage_count = template_usage_stats.usage_count + 1,
            total_generation_time = template_usage_stats.total_generation_time + COALESCE(p_generation_time, 0),
            average_generation_time = CASE
                WHEN template_usage_stats.usage_count + 1 > 0
                THEN (template_usage_stats.total_generation_time + COALESCE(p_generation_time, 0)) / (template_usage_stats.usage_count + 1)
                ELSE 0
            END;
    END IF;

    -- Atualizar contador no template
    UPDATE templates
    SET usage_count = usage_count + 1,
        average_generation_time = (
            SELECT average_generation_time
            FROM template_usage_stats
            WHERE template_id = p_template_id AND date = CURRENT_DATE AND canvas_id IS NULL
        )
    WHERE id = p_template_id;
END;
$$ LANGUAGE plpgsql;

-- =================================================
-- POLÍTICAS DE SEGURANÇA (RLS)
-- =================================================

-- RLS desabilitado - projeto solo sem autenticação
-- Todas as tabelas são acessíveis sem restrições

-- =================================================
-- COMENTÁRIOS NAS TABELAS
-- =================================================

COMMENT ON TABLE users IS 'Usuários do sistema';
COMMENT ON TABLE media_assets IS 'Biblioteca de mídia - imagens e recursos uploadados';
COMMENT ON TABLE templates IS 'Image Templates - templates de imagem com 1 ou mais canvases';
COMMENT ON TABLE template_canvases IS 'Canvases (páginas) dos templates - cada template pode ter múltiplos canvases';
COMMENT ON TABLE template_placeholders IS 'Layers/elementos dos canvases - textos e imagens posicionadas';
COMMENT ON TABLE lottery_draws IS 'Dados dos sorteios das loterias';
COMMENT ON TABLE generated_images IS 'Galeria de imagens geradas a partir dos templates';
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
SELECT 'media_assets' as table_name, COUNT(*) as count FROM media_assets
UNION ALL
SELECT 'templates' as table_name, COUNT(*) as count FROM templates
UNION ALL
SELECT 'template_canvases' as table_name, COUNT(*) as count FROM template_canvases
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

-- Mostrar templates criados com canvases
SELECT
    t.name as template_name,
    t.lottery_type,
    t.status,
    tc.name as canvas_name,
    tc.width,
    tc.height,
    COUNT(tp.id) as layers_count
FROM templates t
LEFT JOIN template_canvases tc ON t.id = tc.template_id
LEFT JOIN template_placeholders tp ON tc.id = tp.canvas_id
GROUP BY t.id, t.name, t.lottery_type, t.status, tc.id, tc.name, tc.width, tc.height
ORDER BY t.name, tc.canvas_order;

COMMIT;

-- =================================================
-- FIM DO SETUP COMPLETO
-- =================================================

-- 🎉 BANCO DE DADOS CRIADO COM SUCESSO!
-- Estrutura criada:
-- - Image Templates com múltiplos canvases
-- - Media Library para uploads
-- - Generated Images Gallery
-- - Layers/placeholders por canvas
-- 
-- Acesse o editor: http://localhost:3000/editor?template=550e8400-e29b-41d4-a716-446655440001
