/**
 * Constantes para configuração do canvas e viewport
 */

// Limites de zoom
export const ZOOM_MIN = 0.1;
export const ZOOM_MAX = 3;
export const ZOOM_STEP = 0.1;
export const DEFAULT_ZOOM = 1;

// Margens e proporções
export const FIT_MARGIN = 24;
export const DRAG_VISIBLE_RATIO = 0.5; // 50% do wrapper deve ser visível

// Performance
export const THROTTLE_MS = 16; // ~60 FPS
export const DEBOUNCE_SCALE_TO_ZOOM_MS = 600;

// Zoom por mouse wheel
export const ZOOM_WHEEL_FACTOR = 0.999;

// Dimensões iniciais padrão
export const DEFAULT_CANVAS_WIDTH = 1080;
export const DEFAULT_CANVAS_HEIGHT = 1920;

// Números para cálculo de opacidade
export const OPACITY_MIN = 0;
export const OPACITY_MAX = 1;
export const OPACITY_STEP = 0.01;
export const OPACITY_PERCENTAGE_MULTIPLIER = 100;

// Dimensões para centralização
export const CENTER_TEXT_WIDTH_DEFAULT = 200;
export const CENTER_TEXT_HEIGHT_DEFAULT = 50;
export const CENTER_TEXT_WIDTH_HALF = 100;
export const CENTER_TEXT_HEIGHT_HALF = 25;

export const CENTER_IMAGE_WIDTH_DEFAULT = 300;
export const CENTER_IMAGE_HEIGHT_DEFAULT = 300;
export const CENTER_IMAGE_WIDTH_HALF = 150;
export const CENTER_IMAGE_HEIGHT_HALF = 150;

// Card de configurações
export const CANVAS_SETTINGS_CARD_WIDTH = 280;
export const CANVAS_SETTINGS_CARD_HEIGHT_ESTIMATE = 420;
export const CANVAS_SETTINGS_MARGIN = 20;
export const CANVAS_SETTINGS_MIN_BOUND = 10;
export const CANVAS_SETTINGS_DRAG_HEIGHT = 400;

// Formato de arquivo
export const FILE_SIZE_KB_DIVISOR = 1024;
export const FILE_SIZE_MB_DIVISOR = 1024 * 1024;

// Precisão de ratios
export const RATIO_DECIMAL_PLACES = 5;

// Timers
export const SAVE_STATUS_RESET_MS = 2000;
export const DEBOUNCE_SAVE_MS = 400;

// Índices de ViewportTransform
export const VPT_SCALE_X = 0;
export const VPT_SCALE_Y = 3;
export const VPT_TRANSLATE_X = 4;
export const VPT_TRANSLATE_Y = 5;

// Divisores para suavizar gestos
export const PINCH_SCALE_SMOOTHING = 20;

// Z-index para floating elements
export const Z_INDEX_FLOATING_SETTINGS = 1000;

