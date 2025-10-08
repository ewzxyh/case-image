import { NextRequest, NextResponse } from 'next/server'
import { dbHelpers, sql } from '@/lib/database'
import type { TemplateDetailResponse, PageResponse, LayerResponse } from '@/lib/types/api'
import type { TemplatePlaceholder } from '@/lib/types/database'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: templateId } = await params

        if (!templateId) {
            return NextResponse.json(
                { error: 'ID do template não fornecido' },
                { status: 400 }
            )
        }

        // Buscar template com canvases e placeholders
        const template = await dbHelpers.getTemplateDeep(templateId)

        if (!template) {
            return NextResponse.json(
                { error: 'Template não encontrado' },
                { status: 404 }
            )
        }

        // Mapear para formato de resposta
        const pages: PageResponse[] = template.canvases.map(canvas => ({
            id: canvas.id,
            name: canvas.name,
            order: canvas.canvas_order,
            width: canvas.width,
            height: canvas.height,
            backgroundColor: canvas.background_color,
            backgroundAssetId: canvas.background_asset_id || undefined,
            layers: canvas.placeholders.map((p: TemplatePlaceholder): LayerResponse => ({
                id: p.id,
                name: p.name,
                type: p.placeholder_type,
                x: p.x_position,
                y: p.y_position,
                width: p.width,
                height: p.height,
                zIndex: p.z_index,

                // Text props
                text: p.text_content || undefined,
                fontFamily: p.font_family,
                fontSize: p.font_size,
                fontColor: p.font_color,
                fontWeight: p.font_weight,
                textAlign: p.text_align,

                // Image props
                imageUrl: p.image_url || undefined,
                imageAssetId: p.image_asset_id || undefined,
                imagePosition: p.image_position,
                imageAlignH: p.image_align_h,
                imageAlignV: p.image_align_v,

                // Common style props
                backgroundColor: p.background_color || undefined,
                borderColor: p.border_color || undefined,
                borderWidth: p.border_width,
                borderRadius: p.border_radius,
                opacity: p.opacity,
                isVisible: p.is_visible
            }))
        }))

        const response: TemplateDetailResponse = {
            id: template.id,
            name: template.name,
            description: template.description,
            status: template.status,
            lottery_type: template.lottery_type,
            created_at: template.created_at.toISOString(),
            updated_at: template.updated_at.toISOString(),
            pages
        }

        return NextResponse.json(response)

    } catch (error) {
        console.error('Erro ao buscar template:', error)
        return NextResponse.json(
            { error: 'Erro ao buscar template' },
            { status: 500 }
        )
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: templateId } = await params
        const body = await request.json()

        if (!templateId) {
            return NextResponse.json(
                { error: 'ID do template não fornecido' },
                { status: 400 }
            )
        }

        // Atualizar template
        const updatedTemplate = await dbHelpers.updateTemplate(templateId, {
            name: body.name,
            description: body.description,
            lottery_type: body.lottery_type,
            status: body.status
        })

        if (!updatedTemplate) {
            return NextResponse.json(
                { error: 'Template não encontrado' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            template: updatedTemplate
        })

    } catch (error) {
        console.error('Erro ao atualizar template:', error)
        return NextResponse.json(
            { error: 'Erro ao atualizar template' },
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
                { error: 'ID do template não fornecido' },
                { status: 400 }
            )
        }

        // Deletar template (CASCADE irá deletar canvases e placeholders)
        await sql`
            DELETE FROM templates
            WHERE id = ${templateId}
        `

        return NextResponse.json({
            success: true,
            message: 'Template deletado com sucesso'
        })

    } catch (error) {
        console.error('Erro ao deletar template:', error)
        return NextResponse.json(
            { error: 'Erro ao deletar template' },
            { status: 500 }
        )
    }
}
