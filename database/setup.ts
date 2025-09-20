// =================================================
// Script de Setup do Banco de Dados
// Execute este arquivo para configurar o banco inicialmente
// =================================================

import { sql } from '@/lib/database'
import { readFileSync } from 'fs'
import { join } from 'path'

export async function setupDatabase() {
    try {
        console.log('🚀 Iniciando setup do banco de dados...')

        // Ler e executar o schema
        const schemaPath = join(process.cwd(), 'database', 'schema.sql')
        const schemaSQL = readFileSync(schemaPath, 'utf-8')

        console.log('📄 Executando schema...')
        await sql.unsafe(schemaSQL)

        console.log('✅ Schema executado com sucesso!')

        // Verificar se os dados foram inseridos
        const [templateCount] = await sql`SELECT COUNT(*) as count FROM templates`
        const [userCount] = await sql`SELECT COUNT(*) as count FROM users`
        const [placeholderCount] = await sql`SELECT COUNT(*) as count FROM template_placeholders`

        console.log('📊 Dados inseridos:')
        console.log(`   - ${userCount.count} usuários`)
        console.log(`   - ${templateCount.count} templates`)
        console.log(`   - ${placeholderCount.count} placeholders`)

        // Executar validações
        await validateDatabase()

        console.log('🎉 Setup do banco de dados concluído com sucesso!')

    } catch (error) {
        console.error('❌ Erro durante o setup do banco:', error)
        throw error
    }
}

async function validateDatabase() {
    console.log('🔍 Validando estrutura do banco...')

    // Verificar tabelas principais
    const tables = await sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `

    const expectedTables = [
        'generated_images',
        'lottery_draws',
        'template_placeholders',
        'template_usage_stats',
        'templates',
        'user_sessions',
        'users'
    ]

    const existingTables = tables.map(t => t.table_name)
    const missingTables = expectedTables.filter(t => !existingTables.includes(t))

    if (missingTables.length > 0) {
        throw new Error(`Tabelas faltando: ${missingTables.join(', ')}`)
    }

    console.log(`✅ ${tables.length} tabelas encontradas`)

    // Verificar dados iniciais
    const [dashboardStats] = await sql`SELECT * FROM dashboard_stats`

    if (!dashboardStats) {
        console.warn('⚠️  View dashboard_stats não foi criada')
    } else {
        console.log('✅ Estatísticas do dashboard disponíveis')
    }

    // Verificar função de atualização
    try {
        await sql`SELECT update_template_usage('00000000-0000-0000-0000-000000000000', 1.0)`
        console.log('✅ Função update_template_usage funcionando')
    } catch (error) {
        console.warn('⚠️  Função update_template_usage pode não estar funcionando')
    }
}

// =================================================
// Função para popular dados de exemplo
// =================================================

export async function seedDatabase() {
    console.log('🌱 Populando banco com dados de exemplo...')

    // Adicionar mais templates de exemplo
    const sampleTemplates = [
        {
            name: 'Quina Resultados',
            description: 'Template para sorteios da Quina',
            image_url: '/quina-template.png',
            lottery_type: 'quina',
            status: 'active'
        },
        {
            name: 'Lotomania Números',
            description: 'Template especial para Lotomania',
            image_url: '/lotomania-template.png',
            lottery_type: 'lotomania',
            status: 'active'
        }
    ]

    for (const template of sampleTemplates) {
        try {
            await sql`
        INSERT INTO templates (name, description, image_url, lottery_type, status)
        VALUES (${template.name}, ${template.description}, ${template.image_url}, ${template.lottery_type}, ${template.status})
      `
        } catch (error) {
            // Ignorar erro se template já existir
            console.log(`ℹ️  Template ${template.name} já existe`)
        }
    }

    // Adicionar sorteios de exemplo
    const sampleDraws = [
        {
            lottery_type: 'quina',
            draw_number: 6000,
            draw_date: '2025-09-20',
            result_data: { dezenas_sorteadas: ['12', '25', '33', '41', '47'] },
            prize_value: 5000000.00
        },
        {
            lottery_type: 'lotomania',
            draw_number: 2500,
            draw_date: '2025-09-19',
            result_data: { dezenas_sorteadas: ['05', '12', '18', '23', '29', '34', '41', '47', '52', '58', '63', '67', '72', '78', '83', '89', '94', '99'] },
            prize_value: 1500000.00
        }
    ]

    for (const draw of sampleDraws) {
        try {
            await sql`
        INSERT INTO lottery_draws (lottery_type, draw_number, draw_date, result_data, prize_value)
        VALUES (${draw.lottery_type}, ${draw.draw_number}, ${draw.draw_date}, ${JSON.stringify(draw.result_data)}, ${draw.prize_value})
      `
        } catch (error) {
            console.log(`ℹ️  Sorteio ${draw.lottery_type} ${draw.draw_number} já existe`)
        }
    }

    // Adicionar placeholders de exemplo para os templates
    const samplePlaceholders = [
        {
            template_name: 'Mega-Sena Principal',
            placeholders: [
                {
                    name: '{{CONCURSO}}',
                    placeholder_type: 'text',
                    x_position: 100,
                    y_position: 100,
                    width: 200,
                    height: 50,
                    font_size: 24,
                    font_family: 'Arial',
                    font_color: '#000000',
                    text_align: 'center'
                },
                {
                    name: '{{NUMEROS}}',
                    placeholder_type: 'text',
                    x_position: 100,
                    y_position: 200,
                    width: 400,
                    height: 100,
                    font_size: 32,
                    font_family: 'Arial',
                    font_color: '#FF0000',
                    text_align: 'center'
                },
                {
                    name: '{{PREMIO}}',
                    placeholder_type: 'text',
                    x_position: 100,
                    y_position: 350,
                    width: 300,
                    height: 50,
                    font_size: 20,
                    font_family: 'Arial',
                    font_color: '#008000',
                    text_align: 'center'
                }
            ]
        },
        {
            template_name: 'Lotofácil Resultados',
            placeholders: [
                {
                    name: '{{CONCURSO}}',
                    placeholder_type: 'text',
                    x_position: 50,
                    y_position: 50,
                    width: 150,
                    height: 40,
                    font_size: 20,
                    font_family: 'Arial',
                    font_color: '#000000',
                    text_align: 'left'
                },
                {
                    name: '{{NUMEROS}}',
                    placeholder_type: 'text',
                    x_position: 50,
                    y_position: 120,
                    width: 500,
                    height: 150,
                    font_size: 28,
                    font_family: 'Arial',
                    font_color: '#0000FF',
                    text_align: 'center'
                }
            ]
        },
        {
            template_name: 'Quina Resultados',
            placeholders: [
                {
                    name: '{{CONCURSO_QUINA}}',
                    placeholder_type: 'text',
                    x_position: 75,
                    y_position: 75,
                    width: 200,
                    height: 45,
                    font_size: 22,
                    font_family: 'Arial',
                    font_color: '#000000',
                    text_align: 'center'
                },
                {
                    name: '{{NUMEROS_QUINA}}',
                    placeholder_type: 'text',
                    x_position: 75,
                    y_position: 150,
                    width: 350,
                    height: 120,
                    font_size: 30,
                    font_family: 'Arial',
                    font_color: '#FFA500',
                    text_align: 'center'
                }
            ]
        }
    ]

    for (const sample of samplePlaceholders) {
        try {
            // Buscar ID do template
            const [template] = await sql`
                SELECT id FROM templates WHERE name = ${sample.template_name} LIMIT 1
            `

            if (template) {
                // Inserir placeholders para este template
                for (const placeholder of sample.placeholders) {
                    try {
                        await sql`
                            INSERT INTO template_placeholders (
                                template_id, name, placeholder_type, x_position, y_position,
                                width, height, font_size, font_family, font_color, text_align
                            ) VALUES (
                                ${template.id}, ${placeholder.name}, ${placeholder.placeholder_type},
                                ${placeholder.x_position}, ${placeholder.y_position}, ${placeholder.width},
                                ${placeholder.height}, ${placeholder.font_size},
                                ${placeholder.font_family}, ${placeholder.font_color},
                                ${placeholder.text_align}
                            )
                        `
                    } catch (error) {
                        // Ignorar erro se placeholder já existir
                        console.log(`ℹ️  Placeholder ${placeholder.name} já existe para ${sample.template_name}`)
                    }
                }
            }
        } catch (error) {
            console.log(`ℹ️  Template ${sample.template_name} não encontrado ou placeholders já existem`)
        }
    }

    console.log('✅ Dados de exemplo inseridos!')
}

// =================================================
// Função para limpar banco (usar com cuidado!)
// =================================================

export async function resetDatabase() {
    console.log('🧹 Limpando banco de dados...')

    const tables = [
        'generated_images',
        'template_usage_stats',
        'template_placeholders',
        'user_sessions',
        'templates',
        'lottery_draws',
        'users'
    ]

    for (const table of tables) {
        await sql`TRUNCATE TABLE ${sql(table)} CASCADE`
    }

    console.log('✅ Banco limpo!')
}

// =================================================
// Uso do script
// =================================================

/*
// Para configurar o banco do zero:
import { setupDatabase, seedDatabase } from '@/database/setup'

await setupDatabase()  // Cria tabelas e dados básicos
await seedDatabase()   // Adiciona dados de exemplo

// Para limpar tudo (cuidado!):
import { resetDatabase } from '@/database/setup'
await resetDatabase()
*/

export default {
    setupDatabase,
    seedDatabase,
    resetDatabase
}
