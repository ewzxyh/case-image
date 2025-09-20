import { neon } from '@neondatabase/serverless'

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set')
}

// Configuração da conexão com Neon
export const sql = neon(process.env.DATABASE_URL, {
    // Configurações opcionais para Neon
    fetchOptions: {
        // Cache para melhorar performance
        cache: 'no-store',
    },
})

// Tipos para as tabelas principais
export interface User {
    id: string
    email: string
    name: string | null
    avatar_url: string | null
    role: 'admin' | 'user' | 'moderator'
    is_active: boolean
    last_login_at: string | null
    created_at: string
    updated_at: string
}

export interface Template {
    id: string
    name: string
    description: string | null
    image_url: string
    image_key: string | null
    lottery_type: string | null
    status: 'active' | 'inactive' | 'draft'
    is_public: boolean
    usage_count: number
    average_generation_time: number | null
    created_by: string | null
    created_at: string
    updated_at: string
}

export interface TemplatePlaceholder {
    id: string
    template_id: string
    name: string
    placeholder_type: 'text' | 'image'
    x_position: number
    y_position: number
    width: number
    height: number
    font_family: string
    font_size: number
    font_color: string
    font_weight: string
    text_align: 'left' | 'center' | 'right'
    background_color: string | null
    border_radius: number
    opacity: number
    z_index: number
    is_visible: boolean
    created_at: string
    updated_at: string
}

export interface LotteryDraw {
    id: string
    lottery_type: string
    draw_number: number
    draw_date: string
    result_data: Record<string, unknown>
    is_special: boolean
    prize_value: number | null
    next_draw_date: string | null
    created_at: string
    updated_at: string
}

export interface GeneratedImage {
    id: string
    template_id: string
    lottery_draw_id: string | null
    image_url: string
    image_key: string | null
    thumbnail_url: string | null
    file_size: number | null
    width: number | null
    height: number | null
    format: string
    generation_time: number | null
    is_downloaded: boolean
    download_count: number
    created_by: string | null
    created_at: string
}

// Funções helper para queries comuns
export const dbHelpers = {
    // Buscar template com placeholders
    async getTemplateWithPlaceholders(templateId: string) {
        const [template] = await sql`
      SELECT * FROM templates WHERE id = ${templateId}
    `

        if (!template) return null

        const placeholders = await sql`
      SELECT * FROM template_placeholders
      WHERE template_id = ${templateId}
      ORDER BY z_index ASC
    `

        return {
            ...template,
            placeholders
        }
    },

    // Buscar estatísticas do dashboard
    async getDashboardStats() {
        const [stats] = await sql`
      SELECT * FROM dashboard_stats
    `
        return stats
    },

    // Buscar templates com estatísticas
    async getTemplatesWithStats() {
        const templates = await sql`
      SELECT * FROM templates_with_stats
      ORDER BY created_at DESC
    `
        return templates
    },

    // Buscar sorteio mais recente por tipo
    async getLatestDraw(lotteryType: string) {
        const [draw] = await sql`
      SELECT * FROM lottery_draws
      WHERE lottery_type = ${lotteryType}
      ORDER BY draw_date DESC
      LIMIT 1
    `
        return draw
    },

    // Registrar uso de template
    async recordTemplateUsage(templateId: string, generationTime?: number) {
        await sql`
      SELECT update_template_usage(${templateId}, ${generationTime})
    `
    },

    // Buscar imagens geradas por template
    async getGeneratedImages(templateId: string, limit = 50) {
        if (!templateId || templateId.trim() === '') {
            // Buscar todas as imagens se não houver templateId específico
            const images = await sql`
        SELECT gi.*, t.name as template_name
        FROM generated_images gi
        JOIN templates t ON gi.template_id = t.id
        ORDER BY gi.created_at DESC
        LIMIT ${limit}
      `
            return images
        }

        const images = await sql`
      SELECT gi.*, t.name as template_name
      FROM generated_images gi
      JOIN templates t ON gi.template_id = t.id
      WHERE gi.template_id = ${templateId}
      ORDER BY gi.created_at DESC
      LIMIT ${limit}
    `
        return images
    }
}

export default sql
