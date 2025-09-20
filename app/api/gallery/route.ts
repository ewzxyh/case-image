import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/database'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')
        const search = searchParams.get('search') || ''
        const template = searchParams.get('template') || 'all'
        const sort = searchParams.get('sort') || 'newest'

        const offset = (page - 1) * limit

        // Query simplificada e direta
        const orderBy = sort === 'oldest' ? 'gi.created_at ASC' : 'gi.created_at DESC'

        // Buscar imagens geradas
        let images: any[] = []
        let total = 0

        if (search && template !== 'all') {
            // Query com ambos os filtros
            images = await sql`
                SELECT
                    gi.*,
                    t.name as template_name,
                    t.lottery_type
                FROM generated_images gi
                JOIN templates t ON gi.template_id = t.id
                WHERE (gi.id::text ILIKE ${'%' + search + '%'} OR t.name ILIKE ${'%' + search + '%'})
                AND t.lottery_type = ${template}
                ORDER BY gi.created_at ${sort === 'oldest' ? sql`ASC` : sql`DESC`}
                LIMIT ${limit} OFFSET ${offset}
            `

            const countResult = await sql`
                SELECT COUNT(*) as total
                FROM generated_images gi
                JOIN templates t ON gi.template_id = t.id
                WHERE (gi.id::text ILIKE ${'%' + search + '%'} OR t.name ILIKE ${'%' + search + '%'})
                AND t.lottery_type = ${template}
            `
            total = parseInt(countResult[0]?.total || '0')

        } else if (search) {
            // Query apenas com filtro de busca
            images = await sql`
                SELECT
                    gi.*,
                    t.name as template_name,
                    t.lottery_type
                FROM generated_images gi
                JOIN templates t ON gi.template_id = t.id
                WHERE gi.id::text ILIKE ${'%' + search + '%'} OR t.name ILIKE ${'%' + search + '%'}
                ORDER BY gi.created_at ${sort === 'oldest' ? sql`ASC` : sql`DESC`}
                LIMIT ${limit} OFFSET ${offset}
            `

            const countResult = await sql`
                SELECT COUNT(*) as total
                FROM generated_images gi
                JOIN templates t ON gi.template_id = t.id
                WHERE gi.id::text ILIKE ${'%' + search + '%'} OR t.name ILIKE ${'%' + search + '%'}
            `
            total = parseInt(countResult[0]?.total || '0')

        } else if (template !== 'all') {
            // Query apenas com filtro de template
            images = await sql`
                SELECT
                    gi.*,
                    t.name as template_name,
                    t.lottery_type
                FROM generated_images gi
                JOIN templates t ON gi.template_id = t.id
                WHERE t.lottery_type = ${template}
                ORDER BY gi.created_at ${sort === 'oldest' ? sql`ASC` : sql`DESC`}
                LIMIT ${limit} OFFSET ${offset}
            `

            const countResult = await sql`
                SELECT COUNT(*) as total
                FROM generated_images gi
                JOIN templates t ON gi.template_id = t.id
                WHERE t.lottery_type = ${template}
            `
            total = parseInt(countResult[0]?.total || '0')

        } else {
            // Query sem filtros
            images = await sql`
                SELECT
                    gi.*,
                    t.name as template_name,
                    t.lottery_type
                FROM generated_images gi
                JOIN templates t ON gi.template_id = t.id
                ORDER BY gi.created_at ${sort === 'oldest' ? sql`ASC` : sql`DESC`}
                LIMIT ${limit} OFFSET ${offset}
            `

            const countResult = await sql`
                SELECT COUNT(*) as total
                FROM generated_images gi
                JOIN templates t ON gi.template_id = t.id
            `
            total = parseInt(countResult[0]?.total || '0')
        }

        const totalPages = Math.ceil(total / limit)

        // Transformar dados
        const formattedImages = images.map((img: any) => ({
            id: img.id,
            template_name: img.template_name,
            image_url: img.image_url || '/megasena-template.png',
            created_at: img.created_at?.toISOString() || new Date().toISOString(),
            template_id: img.template_id,
            generation_time: img.generation_time || 2.3,
            lottery_type: img.lottery_type
        }))

        return NextResponse.json({
            images: formattedImages,
            total,
            currentPage: page,
            totalPages,
            status: 'success'
        })

    } catch (error) {
        console.error('Erro ao buscar imagens da galeria:', error)
        return NextResponse.json(
            { error: 'Erro interno do servidor', status: 'error' },
            { status: 500 }
        )
    }
}
