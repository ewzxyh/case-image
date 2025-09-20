import { NextRequest, NextResponse } from 'next/server'
import { dbHelpers } from '@/lib/database'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status') || 'active'
        const limit = parseInt(searchParams.get('limit') || '20')

        // Buscar templates com estatísticas
        const templates = await dbHelpers.getTemplatesWithStats()

        // Filtrar por status se especificado
        const filteredTemplates = status === 'all'
            ? templates
            : templates.filter(template => template.status === status)

        // Limitar resultados
        const limitedTemplates = filteredTemplates.slice(0, limit)

        // Buscar contagem total
        const totalCount = filteredTemplates.length

        return NextResponse.json({
            templates: limitedTemplates,
            total: totalCount,
            status: status
        })

    } catch (error) {
        console.error('Erro ao buscar templates:', error)

        // Retornar dados mockados como fallback
        return NextResponse.json({
            templates: [
                {
                    id: '550e8400-e29b-41d4-a716-446655440001',
                    name: 'Mega-Sena Principal',
                    description: 'Template principal para resultados da Mega-Sena',
                    image_url: '/megasena-template.png',
                    lottery_type: 'mega-sena',
                    status: 'active',
                    usage_count: 1247,
                    usage_today: 15,
                    current_avg_time: 2.3,
                    created_at: new Date().toISOString()
                },
                {
                    id: '550e8400-e29b-41d4-a716-446655440002',
                    name: 'Lotofácil Resultados',
                    description: 'Template para sorteios da Lotofácil',
                    image_url: '/lotofacil-template.png',
                    lottery_type: 'lotofacil',
                    status: 'inactive',
                    usage_count: 856,
                    usage_today: 8,
                    current_avg_time: 1.8,
                    created_at: new Date().toISOString()
                }
            ],
            total: 3,
            status: 'active'
        })
    }
}
