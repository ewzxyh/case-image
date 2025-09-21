import { neon } from '@neondatabase/serverless'

// Configurar conexão com o banco
const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
    console.error('DATABASE_URL não encontrada')
    process.exit(1)
}

const sql = neon(DATABASE_URL)

async function updateTemplates() {
    try {
        console.log('🔄 Buscando templates com status draft...')

        // Buscar templates com status draft
        const draftTemplates = await sql`
            SELECT id, name, status FROM templates WHERE status = 'draft'
        `

        console.log(`📋 Encontrados ${draftTemplates.length} templates com status draft`)

        if (draftTemplates.length === 0) {
            console.log('✅ Nenhum template draft encontrado para atualizar')
            return
        }

        // Atualizar cada template
        for (const template of draftTemplates) {
            console.log(`📝 Atualizando template: ${template.name} (${template.id})`)

            await sql`
                UPDATE templates
                SET status = 'active', updated_at = CURRENT_TIMESTAMP
                WHERE id = ${template.id}
            `
        }

        console.log(`✅ ${draftTemplates.length} templates atualizados com sucesso!`)
        console.log('🎉 Todos os templates agora têm status "active"')

    } catch (error) {
        console.error('❌ Erro ao atualizar templates:', error)
        process.exit(1)
    }
}

// Executar atualização
updateTemplates()
