// Tipos do banco de dados

export interface User {
    id: string;
    email: string;
    name: string | null;
    avatar_url: string | null;
    role: 'admin' | 'user' | 'moderator';
    is_active: boolean;
    last_login_at: Date | null;
    created_at: Date;
    updated_at: Date;
}

export interface MediaAsset {
    id: string;
    name: string;
    description: string | null;
    file_url: string;
    file_key: string | null;
    thumbnail_url: string | null;
    file_type: string | null;
    file_size: number | null;
    width: number | null;
    height: number | null;
    is_public: boolean;
    tags: string[] | null;
    created_by: string | null;
    created_at: Date;
    updated_at: Date;
}

export interface Template {
    id: string;
    name: string;
    description: string | null;
    lottery_type: string | null;
    status: 'active' | 'inactive' | 'draft';
    is_public: boolean;
    usage_count: number;
    average_generation_time: number | null;
    created_by: string | null;
    created_at: Date;
    updated_at: Date;
}

export interface TemplateWithStats extends Template {
    canvas_count: number;
    usage_today: number;
    current_avg_time: number | null;
}

export interface TemplateCanvas {
    id: string;
    template_id: string;
    name: string;
    canvas_order: number;
    width: number;
    height: number;
    background_color: string;
    background_asset_id: string | null;
    is_background_cover: boolean;
    created_at: Date;
    updated_at: Date;
}

export type PlaceholderType = 'text' | 'image';

export interface TemplatePlaceholder {
    id: string;
    canvas_id: string;
    name: string;
    placeholder_type: PlaceholderType;

    // Posicionamento e dimensões
    x_position: number;
    y_position: number;
    width: number;
    height: number;
    z_index: number;

    // Propriedades de texto
    text_content: string | null;
    font_family: string;
    font_size: number;
    font_color: string;
    font_weight: string;
    text_align: 'left' | 'center' | 'right';

    // Propriedades de imagem
    image_asset_id: string | null;
    image_url: string | null;
    image_position: 'cover' | 'contain' | 'fill' | 'align';
    image_align_h: 'left' | 'center' | 'right' | 'full';
    image_align_v: 'top' | 'center' | 'bottom' | 'full';

    // Estilização comum
    background_color: string | null;
    border_color: string | null;
    border_width: string;
    border_radius: number;
    opacity: number;
    is_visible: boolean;

    created_at: Date;
    updated_at: Date;
}

export interface LotteryDraw {
    id: string;
    lottery_type: string;
    draw_number: number;
    draw_date: Date;
    result_data: Record<string, any>;
    is_special: boolean;
    prize_value: number | null;
    next_draw_date: Date | null;
    created_at: Date;
    updated_at: Date;
}

export interface GeneratedImage {
    id: string;
    template_id: string;
    canvas_id: string | null;
    lottery_draw_id: string | null;
    page_index: number;

    // Arquivos gerados
    image_url: string;
    image_key: string | null;
    thumbnail_url: string | null;
    retina_thumbnail_url: string | null;

    // Metadados
    file_size: number | null;
    width: number | null;
    height: number | null;
    format: string;
    metadata: string | null;

    // Estatísticas
    generation_time: number | null;
    is_downloaded: boolean;
    download_count: number;

    created_by: string | null;
    created_at: Date;
}

// Tipos compostos para uso na aplicação
export interface TemplateDeep extends Template {
    canvases: (TemplateCanvas & {
        placeholders: TemplatePlaceholder[];
        background_asset?: MediaAsset | null;
    })[];
}

export interface CanvasWithLayers extends TemplateCanvas {
    placeholders: TemplatePlaceholder[];
    background_asset?: MediaAsset | null;
}

