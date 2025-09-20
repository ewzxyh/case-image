// =================================================
// Configuração do Banco de Dados
// =================================================

export const dbConfig = {
    // Configurações de conexão
    connection: {
        max: 10, // Máximo de conexões simultâneas
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
    },

    // Configurações de pool
    pool: {
        min: 2,
        max: 10,
        idleTimeoutMillis: 30000,
    },

    // Timeouts
    timeouts: {
        query: 30000, // 30 segundos
        connection: 10000, // 10 segundos
    },

    // Retry configuration
    retry: {
        attempts: 3,
        delay: 1000, // 1 segundo
        backoff: 2, // Multiplicador de backoff
    }
}

// =================================================
// Queries SQL Pré-compiladas
// =================================================

export const queries = {
    // Templates
    getTemplates: `
    SELECT * FROM templates
    WHERE status = 'active'
    ORDER BY created_at DESC
  `,

    getTemplateById: `
    SELECT * FROM templates
    WHERE id = $1
  `,

    // Placeholders
    getPlaceholdersByTemplateId: `
    SELECT * FROM template_placeholders
    WHERE template_id = $1
    ORDER BY z_index ASC
  `,

    // Estatísticas
    getDashboardStats: `
    SELECT * FROM dashboard_stats
  `,

    // Sorteios
    getLatestDrawByType: `
    SELECT * FROM lottery_draws
    WHERE lottery_type = $1
    ORDER BY draw_date DESC
    LIMIT 1
  `,

    // Imagens geradas
    getImagesByTemplateId: `
    SELECT gi.*, t.name as template_name
    FROM generated_images gi
    JOIN templates t ON gi.template_id = t.id
    WHERE gi.template_id = $1
    ORDER BY gi.created_at DESC
    LIMIT $2
  `,

    // Estatísticas de uso
    recordTemplateUsage: `
    SELECT update_template_usage($1, $2)
  `,
}

// =================================================
// Tipos de dados para validação
// =================================================

export const validation = {
    lotteryTypes: [
        'mega-sena',
        'lotofacil',
        'quina',
        'lotomania',
        'dupla-sena',
        'timemania',
        'dia-de-sorte'
    ] as const,

    templateStatuses: [
        'active',
        'inactive',
        'draft'
    ] as const,

    imageFormats: [
        'png',
        'jpg',
        'jpeg',
        'webp'
    ] as const,

    placeholderTypes: [
        'text',
        'image'
    ] as const,

    userRoles: [
        'admin',
        'user',
        'moderator'
    ] as const,
}

// =================================================
// Constantes da aplicação
// =================================================

export const constants = {
    // Limites
    maxImageSize: 10 * 1024 * 1024, // 10MB
    maxTemplatesPerUser: 100,
    maxImagesPerDay: 1000,

    // Tempos
    imageCacheTime: 3600, // 1 hora em segundos
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 horas em ms

    // Páginas
    itemsPerPage: {
        templates: 12,
        images: 24,
        users: 50,
    },

    // URLs de API
    externalAPIs: {
        loteria: 'https://api.loteria.com',
        // Adicione outras APIs aqui
    },
}

export default dbConfig
