import { NextRequest, NextResponse } from 'next/server'
import { dbHelpers } from '@/lib/database'
import type { UpdatePlaceholderRequest } from '@/lib/types/api'

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: placeholderId } = await params
        const body: UpdatePlaceholderRequest = await request.json()

        if (!placeholderId) {
            return NextResponse.json(
                { error: 'ID do placeholder não fornecido' },
                { status: 400 }
            )
        }

        // Mapear body para formato do banco
        const updateData: any = {}

        if (body.name !== undefined) updateData.name = body.name
        if (body.x !== undefined) updateData.x_position = body.x
        if (body.y !== undefined) updateData.y_position = body.y
        if (body.width !== undefined) updateData.width = body.width
        if (body.height !== undefined) updateData.height = body.height
        if (body.zIndex !== undefined) updateData.z_index = body.zIndex

        // Text props
        if (body.text !== undefined) updateData.text_content = body.text
        if (body.fontFamily !== undefined) updateData.font_family = body.fontFamily
        if (body.fontSize !== undefined) updateData.font_size = body.fontSize
        if (body.fontColor !== undefined) updateData.font_color = body.fontColor
        if (body.fontWeight !== undefined) updateData.font_weight = body.fontWeight
        if (body.textAlign !== undefined) updateData.text_align = body.textAlign

        // Image props
        if (body.imageAssetId !== undefined) updateData.image_asset_id = body.imageAssetId
        if (body.imageUrl !== undefined) updateData.image_url = body.imageUrl
        if (body.imagePosition !== undefined) updateData.image_position = body.imagePosition
        if (body.imageAlignH !== undefined) updateData.image_align_h = body.imageAlignH
        if (body.imageAlignV !== undefined) updateData.image_align_v = body.imageAlignV

        // Style props
        if (body.backgroundColor !== undefined) updateData.background_color = body.backgroundColor
        if (body.borderColor !== undefined) updateData.border_color = body.borderColor
        if (body.borderWidth !== undefined) updateData.border_width = body.borderWidth
        if (body.borderRadius !== undefined) updateData.border_radius = body.borderRadius
        if (body.opacity !== undefined) updateData.opacity = body.opacity
        if (body.isVisible !== undefined) updateData.is_visible = body.isVisible

        // Atualizar placeholder
        const updatedPlaceholder = await dbHelpers.updatePlaceholder(placeholderId, updateData)

        if (!updatedPlaceholder) {
            return NextResponse.json(
                { error: 'Placeholder não encontrado' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            placeholder: updatedPlaceholder
        })

    } catch (error) {
        console.error('Erro ao atualizar placeholder:', error)
        return NextResponse.json(
            { error: 'Erro ao atualizar placeholder' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: placeholderId } = await params

        if (!placeholderId) {
            return NextResponse.json(
                { error: 'ID do placeholder não fornecido' },
                { status: 400 }
            )
        }

        // Deletar placeholder
        await dbHelpers.deletePlaceholder(placeholderId)

        return NextResponse.json({
            success: true,
            message: 'Placeholder deletado com sucesso'
        })

    } catch (error) {
        console.error('Erro ao deletar placeholder:', error)
        return NextResponse.json(
            { error: 'Erro ao deletar placeholder' },
            { status: 500 }
        )
    }
}

