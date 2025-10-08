import { NextRequest, NextResponse } from 'next/server'
import { dbHelpers } from '@/lib/database'
import type { CreatePlaceholderRequest } from '@/lib/types/api'

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: templateId } = await params
        const body: CreatePlaceholderRequest = await request.json()

        if (!templateId) {
            return NextResponse.json(
                { error: 'ID do template não fornecido' },
                { status: 400 }
            )
        }

        const { canvasId, name, type, x, y, width, height } = body

        if (!canvasId || !name || !type || x === undefined || y === undefined || !width || !height) {
            return NextResponse.json(
                { error: 'Campos obrigatórios faltando' },
                { status: 400 }
            )
        }

        // Criar placeholder
        const placeholder = await dbHelpers.createPlaceholder({
            canvas_id: canvasId,
            name,
            placeholder_type: type,
            x_position: x,
            y_position: y,
            width,
            height,
            z_index: body.zIndex,

            // Text props
            text_content: body.text,
            font_family: body.fontFamily,
            font_size: body.fontSize,
            font_color: body.fontColor,
            font_weight: body.fontWeight,
            text_align: body.textAlign,

            // Image props
            image_asset_id: body.imageAssetId,
            image_url: body.imageUrl,
            image_position: body.imagePosition,
            image_align_h: body.imageAlignH,
            image_align_v: body.imageAlignV,

            // Style props
            background_color: body.backgroundColor,
            border_color: body.borderColor,
            border_width: body.borderWidth,
            border_radius: body.borderRadius,
            opacity: body.opacity
        })

        return NextResponse.json({
            success: true,
            placeholder
        }, { status: 201 })

    } catch (error) {
        console.error('Erro ao criar placeholder:', error)
        return NextResponse.json(
            { error: 'Erro ao criar placeholder' },
            { status: 500 }
        )
    }
}

