-- Script de teste para verificar conexão com o banco
SELECT
    'Conexão bem-sucedida!' as status,
    NOW() as timestamp,
    version() as postgres_version;

-- Verificar se existem tabelas
SELECT
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
