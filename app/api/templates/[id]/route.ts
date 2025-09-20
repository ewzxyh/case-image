import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/database'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: templateId } = await params

        if (!templateId) {
            return NextResponse.json(
                { error: 'ID do template não fornecido', status: 'error' },
                { status: 400 }
            )
        }

        // Buscar template específico com placeholders
        const templates = await sql`
      SELECT
        t.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', p.id,
              'name', p.name,
              'type', p.placeholder_type,
              'x', p.x_position,
              'y', p.y_position,
              'width', p.width,
              'height', p.height,
              'fontSize', p.font_size,
              'fontFamily', p.font_family,
              'color', p.font_color,
              'align', p.text_align
            )
          ) FILTER (WHERE p.id IS NOT NULL),
          '[]'::json
        ) as placeholders
      FROM templates t
      LEFT JOIN template_placeholders p ON t.id = p.template_id
      WHERE t.id = ${templateId}
      GROUP BY t.id
    `

        if (templates.length === 0) {
            return NextResponse.json(
                { error: 'Template não encontrado', status: 'error' },
                { status: 404 }
            )
        }

        const template = templates[0]

        // Formatar placeholders
        const formattedPlaceholders = Array.isArray(template.placeholders)
            ? template.placeholders
            : []

        return NextResponse.json({
            template: {
                ...template,
                placeholders: formattedPlaceholders
            },
            status: 'success'
        })

    } catch (error) {
        console.error('Erro ao buscar template:', error)
        return NextResponse.json(
            { error: 'Erro interno do servidor', status: 'error' },
            { status: 500 }
        )
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: templateId } = await params
        const body = await request.json()

        if (!templateId) {
            return NextResponse.json(
                { error: 'ID do template não fornecido', status: 'error' },
                { status: 400 }
            )
        }

        // Atualizar template
        const updatedTemplate = await sql`
      UPDATE templates
      SET
        name = ${body.name || 'Template'},
        description = ${body.description || null},
        lottery_type = ${body.lottery_type || 'mega-sena'},
        status = ${body.status || 'draft'},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${templateId}
      RETURNING *
    `

        if (updatedTemplate.length === 0) {
            return NextResponse.json(
                { error: 'Template não encontrado', status: 'error' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            template: updatedTemplate[0],
            status: 'success'
        })

    } catch (error) {
        console.error('Erro ao atualizar template:', error)
        return NextResponse.json(
            { error: 'Erro interno do servidor', status: 'error' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: templateId } = await params

        if (!templateId) {
            return NextResponse.json(
                { error: 'ID do template não fornecido', status: 'error' },
                { status: 400 }
            )
        }

        // Deletar template (isso também vai deletar os placeholders por CASCADE)
        const deletedTemplate = await sql`
      DELETE FROM templates
      WHERE id = ${templateId}
      RETURNING *
    `

        if (deletedTemplate.length === 0) {
            return NextResponse.json(
                { error: 'Template não encontrado', status: 'error' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            message: 'Template deletado com sucesso',
            template: deletedTemplate[0],
            status: 'success'
        })

    } catch (error) {
        console.error('Erro ao deletar template:', error)
        return NextResponse.json(
            { error: 'Erro interno do servidor', status: 'error' },
            { status: 500 }
        )
    }
}
