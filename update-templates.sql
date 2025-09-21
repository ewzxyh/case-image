-- Script para atualizar templates com status 'draft' para 'active'
-- Execute este script no seu banco de dados PostgreSQL

-- Primeiro, vamos ver quantos templates têm status 'draft'
SELECT
    COUNT(*) as total_draft,
    COUNT(*) FILTER (WHERE status = 'draft') as draft_count,
    COUNT(*) FILTER (WHERE status = 'active') as active_count
FROM templates;

-- Atualizar todos os templates com status 'draft' para 'active'
UPDATE templates
SET
    status = 'active',
    updated_at = CURRENT_TIMESTAMP
WHERE status = 'draft';

-- Verificar se a atualização foi bem-sucedida
SELECT
    COUNT(*) as total_after_update,
    COUNT(*) FILTER (WHERE status = 'draft') as draft_after,
    COUNT(*) FILTER (WHERE status = 'active') as active_after
FROM templates;

-- Mostrar os templates que foram atualizados
SELECT id, name, status, updated_at
FROM templates
WHERE status = 'active'
ORDER BY updated_at DESC
LIMIT 10;
