// Tipos para requisições e respostas de API

// Request types para geração de imagens (inspirado no DynaPictures)
export type LayerParam = {
  name: string;
  text?: string;
  imageUrl?: string;
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: string;
  borderRadius?: string;
  opacity?: number;
  imagePosition?: "cover" | "contain" | "fill" | "align";
  imageAlignH?: "left" | "center" | "right" | "full";
  imageAlignV?: "top" | "center" | "bottom" | "full";
};

export type PageParam = {
  pageIndex: number;
  params: LayerParam[];
};

export type GenerateImageRequest = {
  templateId: string;
  format?: "png" | "jpeg" | "webp";
  metadata?: string;
  // Single page
  params?: LayerParam[];
  // Multi page
  pages?: PageParam[];
};

export type GeneratedImageResponse = {
  id: string;
  templateId: string;
  imageUrl: string;
  thumbnailUrl?: string;
  retinaThumbnailUrl?: string;
  metadata?: string;
  width: number;
  height: number;
  pageIndex?: number;
};

export type GenerateImageResponse = {
  success: boolean;
  images: GeneratedImageResponse[];
  generationTime: number;
};

// Response types para templates
export type TemplateListItem = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  canvas_count: number;
  usage_count: number;
  thumbnail_url?: string;
  created_at: string;
  updated_at: string;
};

export type LayerResponse = {
  id: string;
  name: string;
  type: "text" | "image";

  // Position (pixels)
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;

  // Position (ratios)
  xRatio?: number;
  yRatio?: number;
  widthRatio?: number;
  heightRatio?: number;

  // Anchors
  anchorH?: "left" | "center" | "right";
  anchorV?: "top" | "middle" | "bottom";
  isBackground?: boolean;

  // Text props
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  fontColor?: string;
  fontWeight?: string;
  textAlign?: string;
  lineHeight?: number;

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
  isStatic?: boolean;
  hideIfEmpty?: boolean;
};

export type PageResponse = {
  id: string;
  name: string;
  order: number;
  width: number;
  height: number;
  backgroundColor: string;
  backgroundAssetId?: string;
  layers: LayerResponse[];
};

export type TemplateDetailResponse = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  lottery_type: string | null;
  created_at: string;
  updated_at: string;
  pages: PageResponse[];
};

// Media Library types
export type MediaAssetResponse = {
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
};

export type UploadMediaRequest = {
  name?: string;
  description?: string;
  tags?: string[];
};

// Create/Update types
export type CreateTemplateRequest = {
  name: string;
  description?: string;
  lottery_type?: string;
  width?: number;
  height?: number;
};

export type UpdateTemplateRequest = {
  name?: string;
  description?: string;
  lottery_type?: string;
  status?: "active" | "inactive" | "draft";
};

export type CreateCanvasRequest = {
  name?: string;
  width: number;
  height: number;
  backgroundColor?: string;
  backgroundAssetId?: string;
};

export type CreatePlaceholderRequest = {
  canvasId: string;
  name: string;
  type: "text" | "image";

  // Position (send either pixels OR ratios, trigger will handle conversion)
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  xRatio?: number;
  yRatio?: number;
  widthRatio?: number;
  heightRatio?: number;

  zIndex?: number;
  unit?: "px" | "ratio"; // Specify which unit is being used

  // Anchors
  anchorH?: "left" | "center" | "right";
  anchorV?: "top" | "middle" | "bottom";
  isBackground?: boolean;

  // Text props
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  fontColor?: string;
  fontWeight?: string;
  textAlign?: "left" | "center" | "right";
  lineHeight?: number;

  // Image props
  imageAssetId?: string;
  imageUrl?: string;
  imagePosition?:
    | "cover"
    | "contain"
    | "fill"
    | "align"
    | "crop"
    | "background";
  imageAlignH?: "left" | "center" | "right" | "full";
  imageAlignV?: "top" | "center" | "bottom" | "full";

  // Style props
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: string;
  borderRadius?: number;
  opacity?: number;
  isVisible?: boolean;
  isStatic?: boolean;
  hideIfEmpty?: boolean;
};

export interface UpdatePlaceholderRequest
  extends Partial<CreatePlaceholderRequest> {
  isVisible?: boolean;
}
