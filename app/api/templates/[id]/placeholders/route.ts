import { type NextRequest, NextResponse } from "next/server";
import { dbHelpers } from "@/lib/database";
import type { CreatePlaceholderRequest } from "@/lib/types/api";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: templateId } = await params;
    const body: CreatePlaceholderRequest = await request.json();

    if (!templateId) {
      return NextResponse.json(
        { error: "ID do template não fornecido" },
        { status: 400 }
      );
    }

    const { canvasId, name, type } = body;

    if (!(canvasId && name && type)) {
      return NextResponse.json(
        { error: "Campos obrigatórios faltando" },
        { status: 400 }
      );
    }

    // Criar placeholder (trigger irá calcular pixels ou ratios automaticamente)
    const placeholder = await dbHelpers.createPlaceholder({
      canvas_id: canvasId,
      name,
      placeholder_type: type,

      // Position (pode ser pixels ou ratios)
      x_position: body.x,
      y_position: body.y,
      width: body.width,
      height: body.height,
      x_ratio: body.xRatio,
      y_ratio: body.yRatio,
      width_ratio: body.widthRatio,
      height_ratio: body.heightRatio,

      z_index: body.zIndex,
      anchor_h: body.anchorH,
      anchor_v: body.anchorV,
      is_background: body.isBackground,

      // Text props
      text_content: body.text,
      font_family: body.fontFamily,
      font_size: body.fontSize,
      font_color: body.fontColor,
      font_weight: body.fontWeight,
      text_align: body.textAlign,
      line_height: body.lineHeight,

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
      opacity: body.opacity,
      is_visible: body.isVisible,
      is_static: body.isStatic,
      hide_if_empty: body.hideIfEmpty,
    });

    return NextResponse.json(
      {
        success: true,
        placeholder,
      },
      { status: 201 }
    );
  } catch (_error) {
    return NextResponse.json(
      { error: "Erro ao criar placeholder" },
      { status: 500 }
    );
  }
}
