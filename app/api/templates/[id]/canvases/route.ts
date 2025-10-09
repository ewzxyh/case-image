import { type NextRequest, NextResponse } from "next/server";
import { dbHelpers } from "@/lib/database";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: templateId } = await params;
    const body = await request.json();

    if (!templateId) {
      return NextResponse.json(
        { error: "ID do template não fornecido" },
        { status: 400 }
      );
    }

    const { name, width, height, backgroundColor, backgroundAssetId } = body;

    if (!(width && height)) {
      return NextResponse.json(
        { error: "Largura e altura são obrigatórios" },
        { status: 400 }
      );
    }

    // Criar novo canvas
    const canvas = await dbHelpers.createCanvas({
      template_id: templateId,
      name,
      width,
      height,
      background_color: backgroundColor,
      background_asset_id: backgroundAssetId,
    });

    return NextResponse.json(
      {
        success: true,
        canvas,
      },
      { status: 201 }
    );
  } catch (_error) {
    return NextResponse.json(
      { error: "Erro ao criar canvas" },
      { status: 500 }
    );
  }
}
