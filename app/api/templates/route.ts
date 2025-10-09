import { type NextRequest, NextResponse } from "next/server";
import { dbHelpers } from "@/lib/database";
import type { TemplateListItem } from "@/lib/types/api";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "all";
    const limit = Number.parseInt(searchParams.get("limit") || "50", 10);

    // Buscar templates com estatísticas
    const templates = await dbHelpers.listTemplatesWithStats();

    // Filtrar por status se especificado
    const filteredTemplates =
      status === "all"
        ? templates
        : templates.filter((template) => template.status === status);

    // Limitar resultados
    const limitedTemplates = filteredTemplates.slice(0, limit);

    // Mapear para resposta
    const response: TemplateListItem[] = limitedTemplates.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      status: t.status,
      canvas_count: t.canvas_count || 0,
      usage_count: t.usage_count,
      created_at: t.created_at.toISOString(),
      updated_at: t.updated_at.toISOString(),
    }));

    return NextResponse.json({
      templates: response,
      total: filteredTemplates.length,
      status,
    });
  } catch (_error) {
    return NextResponse.json(
      { error: "Erro ao buscar templates" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      lottery_type,
      width = 1080,
      height = 1920,
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Nome é obrigatório" },
        { status: 400 }
      );
    }

    // Criar template
    const template = await dbHelpers.createTemplate({
      name,
      description: description || null,
      lottery_type: lottery_type || null,
      status: "draft",
    });

    // Criar primeiro canvas automaticamente
    const _canvas = await dbHelpers.createCanvas({
      template_id: template.id,
      name: "Page 1",
      width,
      height,
      background_color: "#FFFFFF",
    });

    // Buscar template completo
    const templateDeep = await dbHelpers.getTemplateDeep(template.id);

    return NextResponse.json(
      {
        success: true,
        template: templateDeep,
        message: "Template criado com sucesso!",
      },
      { status: 201 }
    );
  } catch (_error) {
    return NextResponse.json(
      { error: "Erro ao criar template" },
      { status: 500 }
    );
  }
}
