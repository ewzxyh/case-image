// Tipos para requisições e respostas de API

// Request types para geração de imagens (inspirado no DynaPictures)
export interface LayerParam {
    name: string;
    text?: string;
    imageUrl?: string;
    color?: string;
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: string;
    borderRadius?: string;
    opacity?: number;
    imagePosition?: 'cover' | 'contain' | 'fill' | 'align';
    imageAlignH?: 'left' | 'center' | 'right' | 'full';
    imageAlignV?: 'top' | 'center' | 'bottom' | 'full';
}

export interface PageParam {
    pageIndex: number;
    params: LayerParam[];
}

export interface GenerateImageRequest {
    templateId: string;
    format?: 'png' | 'jpeg' | 'webp';
    metadata?: string;
    // Single page
    params?: LayerParam[];
    // Multi page
    pages?: PageParam[];
}

export interface GeneratedImageResponse {
    id: string;
    templateId: string;
    imageUrl: string;
    thumbnailUrl?: string;
    retinaThumbnailUrl?: string;
    metadata?: string;
    width: number;
    height: number;
    pageIndex?: number;
}

export interface GenerateImageResponse {
    success: boolean;
    images: GeneratedImageResponse[];
    generationTime: number;
}

// Response types para templates
export interface TemplateListItem {
    id: string;
    name: string;
    description: string | null;
    status: string;
    canvas_count: number;
    usage_count: number;
    thumbnail_url?: string;
    created_at: string;
    updated_at: string;
}

export interface LayerResponse {
    id: string;
    name: string;
    type: 'text' | 'image';
    x: number;
    y: number;
    width: number;
    height: number;
    zIndex: number;

    // Text props
    text?: string;
    fontFamily?: string;
    fontSize?: number;
    fontColor?: string;
    fontWeight?: string;
    textAlign?: string;

    // Image props
    imageUrl?: string;
    imageAssetId?: string;
    imagePosition?: string;
    imageAlignH?: string;
    imageAlignV?: string;

    // Common style props
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: string;
    borderRadius?: number;
    opacity?: number;
    isVisible: boolean;
}

export interface PageResponse {
    id: string;
    name: string;
    order: number;
    width: number;
    height: number;
    backgroundColor: string;
    backgroundAssetId?: string;
    layers: LayerResponse[];
}

export interface TemplateDetailResponse {
    id: string;
    name: string;
    description: string | null;
    status: string;
    lottery_type: string | null;
    created_at: string;
    updated_at: string;
    pages: PageResponse[];
}

// Media Library types
export interface MediaAssetResponse {
    id: string;
    name: string;
    description: string | null;
    fileUrl: string;
    thumbnailUrl: string | null;
    fileType: string | null;
    fileSize: number | null;
    width: number | null;
    height: number | null;
    tags: string[];
    created_at: string;
}

export interface UploadMediaRequest {
    name?: string;
    description?: string;
    tags?: string[];
}

// Create/Update types
export interface CreateTemplateRequest {
    name: string;
    description?: string;
    lottery_type?: string;
    width?: number;
    height?: number;
}

export interface UpdateTemplateRequest {
    name?: string;
    description?: string;
    lottery_type?: string;
    status?: 'active' | 'inactive' | 'draft';
}

export interface CreateCanvasRequest {
    name?: string;
    width: number;
    height: number;
    backgroundColor?: string;
    backgroundAssetId?: string;
}

export interface CreatePlaceholderRequest {
    canvasId: string;
    name: string;
    type: 'text' | 'image';
    x: number;
    y: number;
    width: number;
    height: number;
    zIndex?: number;

    // Text props
    text?: string;
    fontFamily?: string;
    fontSize?: number;
    fontColor?: string;
    fontWeight?: string;
    textAlign?: 'left' | 'center' | 'right';

    // Image props
    imageAssetId?: string;
    imageUrl?: string;
    imagePosition?: 'cover' | 'contain' | 'fill' | 'align';
    imageAlignH?: 'left' | 'center' | 'right' | 'full';
    imageAlignV?: 'top' | 'center' | 'bottom' | 'full';

    // Style props
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: string;
    borderRadius?: number;
    opacity?: number;
}

export interface UpdatePlaceholderRequest extends Partial<CreatePlaceholderRequest> {
    isVisible?: boolean;
}

