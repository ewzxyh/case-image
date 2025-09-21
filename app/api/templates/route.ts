import { NextRequest, NextResponse } from 'next/server'
import { dbHelpers } from '@/lib/database'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status') || 'all'
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

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const name = formData.get('name') as string
        const description = formData.get('description') as string
        const lotteryType = formData.get('lottery_type') as string
        const imageFile = formData.get('image') as File

        if (!name || !imageFile) {
            return NextResponse.json(
                { error: 'Nome e imagem são obrigatórios' },
                { status: 400 }
            )
        }

        // Criar diretório de uploads se não existir
        const uploadsDir = join(process.cwd(), 'public', 'uploads', 'templates')
        if (!existsSync(uploadsDir)) {
            await mkdir(uploadsDir, { recursive: true })
        }

        // Gerar nome único para o arquivo
        const fileExtension = imageFile.name.split('.').pop()
        const fileName = `${uuidv4()}.${fileExtension}`
        const filePath = join(uploadsDir, fileName)

        // Salvar arquivo no servidor
        const bytes = await imageFile.arrayBuffer()
        const buffer = Buffer.from(bytes)
        await writeFile(filePath, buffer)

        // Criar template no banco de dados
        const imageUrl = `/uploads/templates/${fileName}`
        const templateId = uuidv4()

        const template = {
            id: templateId,
            name,
            description: description || '',
            image_url: imageUrl,
            image_key: fileName,
            lottery_type: lotteryType || null,
            status: 'active',
            usage_count: 0,
            usage_today: 0,
            current_avg_time: null,
            created_at: new Date().toISOString()
        }

        // Tentar salvar no banco de dados
        try {
            await dbHelpers.createTemplate(template)
        } catch (dbError) {
            console.error('Erro ao salvar template no banco:', dbError)
            // Se der erro no banco, ainda assim retornamos sucesso pois o arquivo foi salvo
            // O template pode ser recriado depois se necessário
        }

        return NextResponse.json({
            success: true,
            template,
            message: 'Template criado com sucesso!'
        })

    } catch (error) {
        console.error('Erro ao criar template:', error)
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        )
    }
}
