// =================================================
// Exemplos de uso do banco de dados
// =================================================

import { sql, dbHelpers } from '@/lib/database'
import type { Template, GeneratedImage } from '@/lib/database'

// =================================================
// EXEMPLOS DE QUERIES BÁSICAS
// =================================================

// 1. Buscar todos os templates ativos
export async function getActiveTemplates() {
    const templates = await sql`
    SELECT * FROM templates
    WHERE status = 'active'
    ORDER BY usage_count DESC
  `
    return templates
}

// 2. Buscar template com todos os placeholders
export async function getTemplateWithPlaceholders(templateId: string) {
    const templateWithPlaceholders = await dbHelpers.getTemplateWithPlaceholders(templateId)
    return templateWithPlaceholders
}

// 3. Criar um novo template
export async function createTemplate(templateData: {
    name: string
    description?: string
    image_url: string
    lottery_type: string
    user_id: string
}) {
    const [newTemplate] = await sql`
    INSERT INTO templates (name, description, image_url, lottery_type, created_by)
    VALUES (${templateData.name}, ${templateData.description}, ${templateData.image_url}, ${templateData.lottery_type}, ${templateData.user_id})
    RETURNING *
  `
    return newTemplate
}

// 4. Adicionar placeholder a um template
export async function addPlaceholder(placeholderData: {
    template_id: string
    name: string
    x_position: number
    y_position: number
    width: number
    height: number
    font_size?: number
    font_color?: string
}) {
    const [newPlaceholder] = await sql`
    INSERT INTO template_placeholders (
      template_id, name, x_position, y_position, width, height,
      font_size, font_color
    ) VALUES (
      ${placeholderData.template_id}, ${placeholderData.name},
      ${placeholderData.x_position}, ${placeholderData.y_position},
      ${placeholderData.width}, ${placeholderData.height},
      ${placeholderData.font_size || 24}, ${placeholderData.font_color || '#000000'}
    )
    RETURNING *
  `
    return newPlaceholder
}

// =================================================
// EXEMPLOS DE USO NO DASHBOARD
// =================================================

// 5. Buscar estatísticas para o dashboard
export async function getDashboardData() {
    const stats = await dbHelpers.getDashboardStats()

    // Buscar templates recentes
    const recentTemplates = await sql`
    SELECT id, name, created_at, usage_count
    FROM templates
    WHERE status = 'active'
    ORDER BY created_at DESC
    LIMIT 5
  `

    // Buscar atividades recentes
    const recentActivities = await sql`
    SELECT
      gi.created_at,
      t.name as template_name,
      'Imagem gerada' as action
    FROM generated_images gi
    JOIN templates t ON gi.template_id = t.id
    ORDER BY gi.created_at DESC
    LIMIT 10
  `

    return {
        stats,
        recentTemplates,
        recentActivities
    }
}

// =================================================
// EXEMPLOS DE GERAÇÃO DE IMAGENS
// =================================================

// 6. Registrar uma imagem gerada
export async function saveGeneratedImage(imageData: {
    template_id: string
    image_url: string
    generation_time: number
    user_id?: string
    lottery_draw_id?: string
}) {
    // Inserir imagem gerada
    const [newImage] = await sql`
    INSERT INTO generated_images (
      template_id, image_url, generation_time,
      created_by, lottery_draw_id
    ) VALUES (
      ${imageData.template_id}, ${imageData.image_url},
      ${imageData.generation_time}, ${imageData.user_id},
      ${imageData.lottery_draw_id}
    )
    RETURNING *
  `

    // Registrar uso do template
    await dbHelpers.recordTemplateUsage(imageData.template_id, imageData.generation_time)

    return newImage
}

// =================================================
// EXEMPLOS DE SORTEIOS
// =================================================

// 7. Buscar último sorteio de uma loteria
export async function getLatestLotteryDraw(lotteryType: string) {
    const draw = await dbHelpers.getLatestDraw(lotteryType)
    return draw
}

// 8. Salvar novo sorteio
export async function saveLotteryDraw(drawData: {
    lottery_type: string
    draw_number: number
    draw_date: string
    result_data: any
    prize_value?: number
}) {
    const [newDraw] = await sql`
    INSERT INTO lottery_draws (
      lottery_type, draw_number, draw_date,
      result_data, prize_value
    ) VALUES (
      ${drawData.lottery_type}, ${drawData.draw_number},
      ${drawData.draw_date}, ${JSON.stringify(drawData.result_data)},
      ${drawData.prize_value}
    )
    RETURNING *
  `
    return newDraw
}

// =================================================
// EXEMPLOS DE GESTÃO DE USUÁRIOS
// =================================================

// 9. Buscar usuário por email
export async function getUserByEmail(email: string) {
    const [user] = await sql`
    SELECT * FROM users
    WHERE email = ${email}
  `
    return user
}

// 10. Atualizar último login do usuário
export async function updateUserLastLogin(userId: string) {
    await sql`
    UPDATE users
    SET last_login_at = NOW()
    WHERE id = ${userId}
  `
}

// =================================================
// EXEMPLOS DE ESTATÍSTICAS
// =================================================

// 11. Buscar estatísticas de um template específico
export async function getTemplateStats(templateId: string) {
    const [stats] = await sql`
    SELECT
      t.name,
      t.usage_count as total_usage,
      t.average_generation_time,
      COUNT(gi.id) as images_generated_today,
      AVG(gi.generation_time) as avg_time_today
    FROM templates t
    LEFT JOIN generated_images gi ON t.id = gi.template_id
      AND DATE(gi.created_at) = CURRENT_DATE
    WHERE t.id = ${templateId}
    GROUP BY t.id, t.name, t.usage_count, t.average_generation_time
  `
    return stats
}

// 12. Buscar templates mais usados na semana
export async function getTopTemplatesThisWeek() {
    const templates = await sql`
    SELECT
      t.id,
      t.name,
      COUNT(gi.id) as weekly_usage,
      AVG(gi.generation_time) as avg_generation_time
    FROM templates t
    LEFT JOIN generated_images gi ON t.id = gi.template_id
      AND gi.created_at >= CURRENT_DATE - INTERVAL '7 days'
    WHERE t.status = 'active'
    GROUP BY t.id, t.name
    ORDER BY weekly_usage DESC
    LIMIT 10
  `
    return templates
}

// =================================================
// EXEMPLOS DE LIMPEZA E MANUTENÇÃO
// =================================================

// 13. Limpar imagens antigas (mais de 30 dias)
export async function cleanupOldImages(daysOld = 30) {
    const deletedImages = await sql`
    DELETE FROM generated_images
    WHERE created_at < CURRENT_DATE - INTERVAL '${daysOld} days'
    RETURNING id, image_url
  `
    return deletedImages
}

// 14. Resetar estatísticas diárias (para testes)
export async function resetDailyStats() {
    await sql`
    UPDATE template_usage_stats
    SET usage_count = 0, total_generation_time = 0, average_generation_time = 0
    WHERE date < CURRENT_DATE
  `
}

// =================================================
// EXEMPLOS DE QUERIES AVANÇADAS
// =================================================

// 15. Buscar templates com filtros avançados
export async function searchTemplates(filters: {
    lottery_type?: string
    status?: string
    is_public?: boolean
    created_by?: string
    search_term?: string
    limit?: number
    offset?: number
}) {
    let query = sql`
    SELECT
      t.*,
      u.name as creator_name,
      COUNT(gi.id) as images_generated
    FROM templates t
    LEFT JOIN users u ON t.created_by = u.id
    LEFT JOIN generated_images gi ON t.id = gi.template_id
  `

    const conditions = []

    if (filters.lottery_type) {
        conditions.push(sql`AND t.lottery_type = ${filters.lottery_type}`)
    }

    if (filters.status) {
        conditions.push(sql`AND t.status = ${filters.status}`)
    }

    if (filters.is_public !== undefined) {
        conditions.push(sql`AND t.is_public = ${filters.is_public}`)
    }

    if (filters.created_by) {
        conditions.push(sql`AND t.created_by = ${filters.created_by}`)
    }

    if (filters.search_term) {
        conditions.push(sql`
      AND (
        t.name ILIKE ${`%${filters.search_term}%`} OR
        t.description ILIKE ${`%${filters.search_term}%`}
      )
    `)
    }

    query = sql`
    ${query}
    WHERE 1=1
    ${conditions}
    GROUP BY t.id, u.name
    ORDER BY t.created_at DESC
    LIMIT ${filters.limit || 20}
    OFFSET ${filters.offset || 0}
  `

    const templates = await query
    return templates
}

// =================================================
// EXEMPLO DE USO COMPLETO
// =================================================

/*
// Exemplo de fluxo completo de geração de imagem:

// 1. Buscar template
const template = await getTemplateWithPlaceholders(templateId)

// 2. Buscar dados do sorteio
const lotteryDraw = await getLatestLotteryDraw(template.lottery_type)

// 3. Gerar imagem (lógica externa)
// const generatedImageUrl = await generateImage(template, lotteryDraw)

// 4. Salvar imagem gerada
const savedImage = await saveGeneratedImage({
  template_id: templateId,
  image_url: generatedImageUrl,
  generation_time: 2.3,
  user_id: userId,
  lottery_draw_id: lotteryDraw.id
})

console.log('Imagem gerada com sucesso:', savedImage)
*/

export default {
    getActiveTemplates,
    getTemplateWithPlaceholders,
    createTemplate,
    addPlaceholder,
    getDashboardData,
    saveGeneratedImage,
    getLatestLotteryDraw,
    saveLotteryDraw,
    getUserByEmail,
    updateUserLastLogin,
    getTemplateStats,
    getTopTemplatesThisWeek,
    cleanupOldImages,
    resetDailyStats,
    searchTemplates
}
