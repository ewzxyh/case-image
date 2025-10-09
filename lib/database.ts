import { neon } from "@neondatabase/serverless";
import type {
  GeneratedImage,
  MediaAsset,
  Template,
  TemplateCanvas,
  TemplateDeep,
  TemplatePlaceholder,
  TemplateWithStats,
} from "./types/database";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Configuração da conexão com Neon
export const sql = neon(process.env.DATABASE_URL, {
  // Configurações opcionais para Neon
  fetchOptions: {
    // Cache para melhorar performance
    cache: "no-store",
  },
});

// Re-export types from types/database
export type {
  GeneratedImage,
  MediaAsset,
  Template,
  TemplateCanvas,
  TemplateDeep,
  TemplatePlaceholder,
  TemplateWithStats,
  User,
} from "./types/database";

// Funções helper para queries comuns
export const dbHelpers = {
  // Buscar templates com estatísticas
  async listTemplatesWithStats(): Promise<TemplateWithStats[]> {
    const templates = await sql`
            SELECT * FROM templates_with_stats
            ORDER BY created_at DESC
        `;
    return templates as TemplateWithStats[];
  },

  // Buscar template com canvases e placeholders (deep)
  async getTemplateDeep(templateId: string): Promise<TemplateDeep | null> {
    const [template] = await sql`
            SELECT * FROM templates WHERE id = ${templateId}
        `;

    if (!template) {
      return null;
    }

    // Buscar canvases do template
    const canvases = await sql`
            SELECT * FROM template_canvases
            WHERE template_id = ${templateId}
            ORDER BY canvas_order ASC
        `;

    // Para cada canvas, buscar placeholders e background asset
    const canvasesWithData = await Promise.all(
      canvases.map(async (canvas: any) => {
        const placeholders = await sql`
                    SELECT * FROM template_placeholders
                    WHERE canvas_id = ${canvas.id}
                    ORDER BY z_index ASC
                `;

        let background_asset = null;
        if (canvas.background_asset_id) {
          const [asset] = await sql`
                        SELECT * FROM media_assets
                        WHERE id = ${canvas.background_asset_id}
                    `;
          background_asset = asset;
        }

        return {
          ...canvas,
          placeholders,
          background_asset,
        };
      })
    );

    return {
      ...template,
      canvases: canvasesWithData,
    } as TemplateDeep;
  },

  // Buscar template com placeholders (DEPRECATED - use getTemplateDeep)
  async getTemplateWithPlaceholders(templateId: string) {
    return this.getTemplateDeep(templateId);
  },

  // Buscar estatísticas do dashboard
  async getDashboardStats() {
    const [stats] = await sql`
      SELECT * FROM dashboard_stats
    `;
    return stats;
  },

  // Buscar templates com estatísticas (DEPRECATED - use listTemplatesWithStats)
  async getTemplatesWithStats() {
    return this.listTemplatesWithStats();
  },

  // Buscar sorteio mais recente por tipo
  async getLatestDraw(lotteryType: string) {
    const [draw] = await sql`
      SELECT * FROM lottery_draws
      WHERE lottery_type = ${lotteryType}
      ORDER BY draw_date DESC
      LIMIT 1
    `;
    return draw;
  },

  // Registrar uso de template
  async recordTemplateUsage(templateId: string, generationTime?: number) {
    await sql`
      SELECT update_template_usage(${templateId}, ${generationTime})
    `;
  },

  // Criar novo template
  async createTemplate(data: {
    name: string;
    description?: string;
    lottery_type?: string;
    status?: "active" | "inactive" | "draft";
  }): Promise<Template> {
    const [newTemplate] = await sql`
            INSERT INTO templates (name, description, lottery_type, status)
            VALUES (
                ${data.name},
                ${data.description || null},
                ${data.lottery_type || null},
                ${data.status || "draft"}
            )
            RETURNING *
        `;
    return newTemplate as Template;
  },

  // Atualizar template
  async updateTemplate(
    templateId: string,
    data: {
      name?: string;
      description?: string;
      lottery_type?: string;
      status?: "active" | "inactive" | "draft";
    }
  ): Promise<Template | null> {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) {
      updates.push(`name = $${values.length + 1}`);
      values.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push(`description = $${values.length + 1}`);
      values.push(data.description);
    }
    if (data.lottery_type !== undefined) {
      updates.push(`lottery_type = $${values.length + 1}`);
      values.push(data.lottery_type);
    }
    if (data.status !== undefined) {
      updates.push(`status = $${values.length + 1}`);
      values.push(data.status);
    }

    if (updates.length === 0) {
      const [template] =
        await sql`SELECT * FROM templates WHERE id = ${templateId}`;
      return template as Template;
    }

    const [updatedTemplate] = await sql`
            UPDATE templates 
            SET ${sql.unsafe(updates.join(", "))}
            WHERE id = ${templateId}
            RETURNING *
        `;
    return updatedTemplate as Template;
  },

  // Criar canvas (página)
  async createCanvas(data: {
    template_id: string;
    name?: string;
    width: number;
    height: number;
    background_color?: string;
    background_asset_id?: string;
  }): Promise<TemplateCanvas> {
    // Buscar próxima ordem
    const [maxOrder] = await sql`
            SELECT COALESCE(MAX(canvas_order), 0) as max_order
            FROM template_canvases
            WHERE template_id = ${data.template_id}
        `;

    const nextOrder = (maxOrder?.max_order || 0) + 1;

    const [newCanvas] = await sql`
            INSERT INTO template_canvases (
                template_id, name, canvas_order, width, height,
                background_color, background_asset_id
            ) VALUES (
                ${data.template_id},
                ${data.name || `Page ${nextOrder}`},
                ${nextOrder},
                ${data.width},
                ${data.height},
                ${data.background_color || "#FFFFFF"},
                ${data.background_asset_id || null}
            )
            RETURNING *
        `;
    return newCanvas as TemplateCanvas;
  },

  // Criar placeholder (layer)
  async createPlaceholder(data: {
    canvas_id: string;
    name: string;
    placeholder_type: "text" | "image";
    x_position?: number;
    y_position?: number;
    width?: number;
    height?: number;
    x_ratio?: number;
    y_ratio?: number;
    width_ratio?: number;
    height_ratio?: number;
    z_index?: number;
    anchor_h?: string;
    anchor_v?: string;
    is_background?: boolean;

    // Text props
    text_content?: string;
    font_family?: string;
    font_size?: number;
    font_color?: string;
    font_weight?: string;
    text_align?: "left" | "center" | "right";
    line_height?: number;

    // Image props
    image_asset_id?: string;
    image_url?: string;
    image_position?: string;
    image_align_h?: string;
    image_align_v?: string;

    // Style props
    background_color?: string;
    border_color?: string;
    border_width?: string;
    border_radius?: number;
    opacity?: number;
    is_visible?: boolean;
    is_static?: boolean;
    hide_if_empty?: boolean;
  }): Promise<TemplatePlaceholder> {
    const [newPlaceholder] = await sql`
            INSERT INTO template_placeholders (
                canvas_id, name, placeholder_type,
                x_position, y_position, width, height, z_index,
                x_ratio, y_ratio, width_ratio, height_ratio,
                anchor_h, anchor_v, is_background,
                text_content, font_family, font_size, font_color, font_weight, text_align, line_height,
                image_asset_id, image_url, image_position, image_align_h, image_align_v,
                background_color, border_color, border_width, border_radius, opacity,
                is_visible, is_static, hide_if_empty
            ) VALUES (
                ${data.canvas_id}, ${data.name}, ${data.placeholder_type},
                ${data.x_position || 0}, ${data.y_position || 0}, ${data.width || 100}, ${data.height || 100}, 
                ${data.z_index || 0},
                ${data.x_ratio || null}, ${data.y_ratio || null}, ${data.width_ratio || null}, ${data.height_ratio || null},
                ${data.anchor_h || "left"}, ${data.anchor_v || "top"}, ${data.is_background},
                ${data.text_content || null}, ${data.font_family || "Inter"}, 
                ${data.font_size || 24}, ${data.font_color || "#000000"},
                ${data.font_weight || "normal"}, ${data.text_align || "left"}, ${data.line_height || 1.2},
                ${data.image_asset_id || null}, ${data.image_url || null},
                ${data.image_position || "cover"}, ${data.image_align_h || "center"},
                ${data.image_align_v || "center"},
                ${data.background_color || null}, ${data.border_color || null},
                ${data.border_width || "0px"}, ${data.border_radius || 0},
                ${data.opacity || 1.0},
                ${data.is_visible !== undefined ? data.is_visible : true}, 
                ${data.is_static}, ${data.hide_if_empty}
            )
            RETURNING *
        `;
    return newPlaceholder as TemplatePlaceholder;
  },

  // Atualizar placeholder
  async updatePlaceholder(
    placeholderId: string,
    data: Partial<{
      name: string;
      x_position: number;
      y_position: number;
      width: number;
      height: number;
      x_ratio: number;
      y_ratio: number;
      width_ratio: number;
      height_ratio: number;
      z_index: number;
      anchor_h: string;
      anchor_v: string;
      is_background: boolean;
      text_content: string;
      font_family: string;
      font_size: number;
      font_color: string;
      font_weight: string;
      text_align: string;
      line_height: number;
      image_asset_id: string;
      image_url: string;
      image_position: string;
      image_align_h: string;
      image_align_v: string;
      background_color: string;
      border_color: string;
      border_width: string;
      border_radius: number;
      opacity: number;
      is_visible: boolean;
      is_static: boolean;
      hide_if_empty: boolean;
    }>
  ): Promise<TemplatePlaceholder | null> {
    const updates: string[] = [];
    const values: any[] = [];

    Object.entries(data).forEach(([key, value]) => {
      updates.push(`${key} = $${values.length + 1}`);
      values.push(value);
    });

    if (updates.length === 0) {
      const [placeholder] =
        await sql`SELECT * FROM template_placeholders WHERE id = ${placeholderId}`;
      return placeholder as TemplatePlaceholder;
    }

    const [updated] = await sql`
            UPDATE template_placeholders
            SET ${sql.unsafe(updates.join(", "))}
            WHERE id = ${placeholderId}
            RETURNING *
        `;
    return updated as TemplatePlaceholder;
  },

  // Deletar placeholder
  async deletePlaceholder(placeholderId: string): Promise<boolean> {
    await sql`DELETE FROM template_placeholders WHERE id = ${placeholderId}`;
    return true;
  },

  // Media Library - listar assets
  async listMedia(options?: {
    limit?: number;
    offset?: number;
    tags?: string[];
  }): Promise<MediaAsset[]> {
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    if (options?.tags && options.tags.length > 0) {
      const assets = await sql`
                SELECT * FROM media_assets
                WHERE tags && ${options.tags}
                ORDER BY created_at DESC
                LIMIT ${limit} OFFSET ${offset}
            `;
      return assets as MediaAsset[];
    }

    const assets = await sql`
            SELECT * FROM media_assets
            ORDER BY created_at DESC
            LIMIT ${limit} OFFSET ${offset}
        `;
    return assets as MediaAsset[];
  },

  // Inserir media asset
  async insertMedia(data: {
    name: string;
    description?: string;
    file_url: string;
    file_key?: string;
    thumbnail_url?: string;
    file_type?: string;
    file_size?: number;
    width?: number;
    height?: number;
    tags?: string[];
    is_public?: boolean;
  }): Promise<MediaAsset> {
    const [newAsset] = await sql`
            INSERT INTO media_assets (
                name, description, file_url, file_key, thumbnail_url,
                file_type, file_size, width, height, tags, is_public
            ) VALUES (
                ${data.name},
                ${data.description || null},
                ${data.file_url},
                ${data.file_key || null},
                ${data.thumbnail_url || null},
                ${data.file_type || null},
                ${data.file_size || null},
                ${data.width || null},
                ${data.height || null},
                ${data.tags || []},
                ${data.is_public !== undefined ? data.is_public : true}
            )
            RETURNING *
        `;
    return newAsset as MediaAsset;
  },

  // Inserir imagem gerada
  async insertGeneratedImage(data: {
    template_id: string;
    canvas_id?: string;
    page_index: number;
    image_url: string;
    image_key?: string;
    thumbnail_url?: string;
    retina_thumbnail_url?: string;
    width?: number;
    height?: number;
    format?: string;
    file_size?: number;
    metadata?: string;
    generation_time?: number;
  }): Promise<GeneratedImage> {
    const [newImage] = await sql`
            INSERT INTO generated_images (
                template_id, canvas_id, page_index, image_url, image_key,
                thumbnail_url, retina_thumbnail_url, width, height, format,
                file_size, metadata, generation_time
            ) VALUES (
                ${data.template_id},
                ${data.canvas_id || null},
                ${data.page_index},
                ${data.image_url},
                ${data.image_key || null},
                ${data.thumbnail_url || null},
                ${data.retina_thumbnail_url || null},
                ${data.width || null},
                ${data.height || null},
                ${data.format || "png"},
                ${data.file_size || null},
                ${data.metadata || null},
                ${data.generation_time || null}
            )
            RETURNING *
        `;
    return newImage as GeneratedImage;
  },

  // Buscar imagens geradas por template
  async getGeneratedImages(templateId: string, limit = 50) {
    if (!templateId || templateId.trim() === "") {
      // Buscar todas as imagens se não houver templateId específico
      const images = await sql`
        SELECT gi.*, t.name as template_name
        FROM generated_images gi
        JOIN templates t ON gi.template_id = t.id
        ORDER BY gi.created_at DESC
        LIMIT ${limit}
      `;
      return images;
    }

    const images = await sql`
      SELECT gi.*, t.name as template_name
      FROM generated_images gi
      JOIN templates t ON gi.template_id = t.id
      WHERE gi.template_id = ${templateId}
      ORDER BY gi.created_at DESC
      LIMIT ${limit}
    `;
    return images;
  },
};

export default sql;
