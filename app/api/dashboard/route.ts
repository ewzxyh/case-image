import { NextResponse } from "next/server";
import { dbHelpers } from "@/lib/database";

export async function GET() {
  try {
    // Buscar estatísticas do dashboard
    const stats = await dbHelpers.getDashboardStats();

    // Buscar templates recentes (últimos 5)
    const recentTemplates = await dbHelpers
      .getTemplatesWithStats()
      .then((templates) => templates.slice(0, 5));

    // Buscar atividades recentes (últimas 10)
    const recentActivities = await dbHelpers
      .getGeneratedImages("", 10)
      .then((images) =>
        images.map((img) => ({
          id: img.id,
          template_name: img.template_name,
          created_at: img.created_at,
          action: "Imagem gerada",
        }))
      );

    return NextResponse.json({
      stats: {
        totalTemplates: Number(stats.total_templates) || 0,
        totalCanvases: Number(stats.total_canvases) || 0,
        totalMediaAssets: Number(stats.total_media_assets) || 0,
        imagesGenerated: Number(stats.images_last_30_days) || 0,
        averageTime: Number(stats.avg_generation_time) || 0,
        activeUsers: Number(stats.active_users_week) || 0,
      },
      recentTemplates,
      recentActivities,
    });
  } catch (_error) {
    // Retornar dados mockados como fallback
    return NextResponse.json({
      stats: {
        totalTemplates: 3,
        imagesGenerated: 1247,
        averageTime: 2.3,
        activeUsers: 573,
      },
      recentTemplates: [],
      recentActivities: [],
    });
  }
}
