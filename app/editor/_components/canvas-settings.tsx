/** biome-ignore-all lint/a11y/useSemanticElements: false positive */
import { GripVertical, Trash2, X } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  CANVAS_SETTINGS_CARD_HEIGHT_ESTIMATE,
  CANVAS_SETTINGS_CARD_WIDTH,
  CANVAS_SETTINGS_DRAG_HEIGHT,
  CANVAS_SETTINGS_MARGIN,
  CANVAS_SETTINGS_MIN_BOUND,
  OPACITY_PERCENTAGE_MULTIPLIER,
} from "@/lib/canvas/constants";

type CanvasSettingsProps = {
  canvas?: unknown;
};

// Interfaces baseadas na documentação do Fabric.js
type FabricObjectProps = {
  type?: string;
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  radius?: number;
  fill?: string | null;
  stroke?: string | null;
  strokeWidth?: number;
  opacity?: number;
  visible?: boolean;
  scaleX?: number;
  scaleY?: number;
  set?(property: string, value: unknown): void;
  set?(properties: Record<string, unknown>): void;
};

interface RectProps extends FabricObjectProps {
  type: "rect";
  rx?: number;
  ry?: number;
}

interface CircleProps extends FabricObjectProps {
  type: "circle";
  startAngle?: number;
  endAngle?: number;
  counterClockwise?: boolean;
}

type FabricObjectType = RectProps | CircleProps;

type FabricCanvas = {
  on(eventName: string, handler: (evt: unknown) => void): void;
  remove?(object: FabricObjectType): void;
  renderAll(): void;
  discardActiveObject(): boolean;
};

const SCALE_DEFAULT = 1;
const RADIUS_MULTIPLIER = 2;
const INITIAL_WIDTH = 0;
const INITIAL_HEIGHT = 0;
const INITIAL_DIAMETER = 0;
const INITIAL_OPACITY = 1;
const INITIAL_BORDER_WIDTH = 0;

const DEFAULT_COLOR = "#000000";

function calculateDefaultPosition(
  cardWidth: number,
  cardHeight: number,
  margin: number
) {
  return {
    x: window.innerWidth - cardWidth - margin,
    y: window.innerHeight - cardHeight - margin,
  };
}

function calculateAdjustedPosition(
  newX: number,
  newY: number,
  cardWidth: number,
  cardHeight: number
) {
  const minBound = CANVAS_SETTINGS_MIN_BOUND;
  const adjustedX = Math.max(
    minBound,
    Math.min(newX, window.innerWidth - cardWidth - minBound)
  );
  const adjustedY = Math.max(
    minBound,
    Math.min(newY, window.innerHeight - cardHeight - minBound)
  );
  return { x: adjustedX, y: adjustedY };
}

function CanvasSettings({ canvas }: CanvasSettingsProps) {
  const [selectedObject, setSelectedObject] = useState<FabricObjectType | null>(
    null
  );
  const fabricCanvas = canvas as FabricCanvas;
  const [width, setWidth] = useState<number>(INITIAL_WIDTH);
  const [height, setHeight] = useState<number>(INITIAL_HEIGHT);
  const [color, setColor] = useState<string>(DEFAULT_COLOR);
  const [diameter, setDiameter] = useState<number>(INITIAL_DIAMETER);
  const [borderColor, setBorderColor] = useState<string>(DEFAULT_COLOR);
  const [borderWidth, setBorderWidth] = useState<number>(INITIAL_BORDER_WIDTH);
  const [opacity, setOpacity] = useState<number>(INITIAL_OPACITY);

  // Estados para posicionamento flutuante
  const [cardPosition, setCardPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isPositionedByUser, setIsPositionedByUser] = useState(false);
  const cardRef = useRef<HTMLElement>(null);

  const processRectSelection = useCallback((rect: RectProps) => {
    setWidth(Math.round((rect.width || 0) * (rect.scaleX || SCALE_DEFAULT)));
    setHeight(Math.round((rect.height || 0) * (rect.scaleY || SCALE_DEFAULT)));
    setColor(rect.fill || DEFAULT_COLOR);
    setDiameter(INITIAL_DIAMETER);
    setBorderColor(rect.stroke || DEFAULT_COLOR);
    setBorderWidth(rect.strokeWidth || INITIAL_BORDER_WIDTH);
    setOpacity(rect.opacity || INITIAL_OPACITY);
  }, []);

  const processCircleSelection = useCallback((circle: CircleProps) => {
    setWidth(INITIAL_WIDTH);
    setHeight(INITIAL_HEIGHT);
    setDiameter(
      Math.round(
        (circle.radius || 0) *
          RADIUS_MULTIPLIER *
          (circle.scaleX || SCALE_DEFAULT)
      )
    );
    setColor(circle.fill || DEFAULT_COLOR);
    setBorderColor(circle.stroke || DEFAULT_COLOR);
    setBorderWidth(circle.strokeWidth || INITIAL_BORDER_WIDTH);
    setOpacity(circle.opacity || INITIAL_OPACITY);
  }, []);

  const handleObjectSelection = useCallback(
    (object: unknown) => {
      if (!object) {
        return;
      }

      const fabricObject = object as FabricObjectType;
      setSelectedObject(fabricObject);

      if (!isPositionedByUser) {
        const defaultPosition = calculateDefaultPosition(
          CANVAS_SETTINGS_CARD_WIDTH,
          CANVAS_SETTINGS_CARD_HEIGHT_ESTIMATE,
          CANVAS_SETTINGS_MARGIN
        );
        setCardPosition(defaultPosition);
      }

      if (fabricObject.type === "rect") {
        processRectSelection(fabricObject as RectProps);
      } else if (fabricObject.type === "circle") {
        processCircleSelection(fabricObject as CircleProps);
      }
    },
    [isPositionedByUser, processRectSelection, processCircleSelection]
  );

  const clearSettings = useCallback(() => {
    setWidth(INITIAL_WIDTH);
    setHeight(INITIAL_HEIGHT);
    setColor(DEFAULT_COLOR);
    setDiameter(INITIAL_DIAMETER);
    setBorderColor(DEFAULT_COLOR);
    setBorderWidth(INITIAL_BORDER_WIDTH);
    setOpacity(INITIAL_OPACITY);
  }, []);

  useEffect(() => {
    if (fabricCanvas) {
      fabricCanvas.on("selection:created", (event: unknown) => {
        handleObjectSelection(
          (event as { selected?: unknown[] })?.selected?.[0]
        );
      });

      fabricCanvas.on("selection:updated", (event: unknown) => {
        handleObjectSelection(
          (event as { selected?: unknown[] })?.selected?.[0]
        );
      });

      fabricCanvas.on("selection:cleared", () => {
        setSelectedObject(null);
        clearSettings();
        setIsPositionedByUser(false);
      });

      fabricCanvas.on("object:modified", (event: unknown) => {
        handleObjectSelection((event as { target?: unknown })?.target);
      });

      fabricCanvas.on("object:scaling", (event: unknown) => {
        handleObjectSelection((event as { target?: unknown })?.target);
      });
    }
  }, [fabricCanvas, handleObjectSelection, clearSettings]);

  const updateObjectProperty = (property: string, value: unknown) => {
    if (selectedObject && fabricCanvas) {
      selectedObject.set?.(property, value);
      fabricCanvas.renderAll();
    }
  };

  const handleWidthChange = (value: string) => {
    const RADIX = 10;
    const numValue = Number.parseInt(value, RADIX) || 0;
    setWidth(numValue);
    if (selectedObject && selectedObject.type === "rect") {
      const rect = selectedObject as RectProps;
      rect.set?.({ width: numValue / (rect.scaleX || SCALE_DEFAULT) });
      fabricCanvas.renderAll();
    }
  };

  const handleHeightChange = (value: string) => {
    const RADIX = 10;
    const numValue = Number.parseInt(value, RADIX) || 0;
    setHeight(numValue);
    if (selectedObject && selectedObject.type === "rect") {
      const rect = selectedObject as RectProps;
      rect.set?.({ height: numValue / (rect.scaleY || SCALE_DEFAULT) });
      fabricCanvas.renderAll();
    }
  };

  const handleDiameterChange = (value: string) => {
    const RADIX = 10;
    const numValue = Number.parseInt(value, RADIX) || 0;
    setDiameter(numValue);
    if (selectedObject && selectedObject.type === "circle") {
      const circle = selectedObject as CircleProps;
      circle.set?.({
        radius: numValue / RADIUS_MULTIPLIER / (circle.scaleX || SCALE_DEFAULT),
      });
      fabricCanvas.renderAll();
    }
  };

  const handleColorChange = (value: string) => {
    setColor(value);
    updateObjectProperty("fill", value);
  };

  const handleBorderColorChange = (value: string) => {
    setBorderColor(value);
    updateObjectProperty("stroke", value);
  };

  const handleBorderWidthChange = (value: string) => {
    const RADIX = 10;
    const numValue = Number.parseInt(value, RADIX) || 0;
    setBorderWidth(numValue);
    updateObjectProperty("strokeWidth", numValue);
  };

  const handleOpacityChange = (value: number[]) => {
    const FIRST_VALUE = 0;
    const numValue = value[FIRST_VALUE] || INITIAL_OPACITY;
    setOpacity(numValue);
    updateObjectProperty("opacity", numValue);
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (fabricCanvas) {
      fabricCanvas.discardActiveObject();
      fabricCanvas.renderAll();
      setSelectedObject(null);
      setIsPositionedByUser(false);
    }
  };

  const handleConfirmDelete = () => {
    if (selectedObject && fabricCanvas) {
      fabricCanvas.remove?.(selectedObject);
      fabricCanvas.renderAll();
      setSelectedObject(null);
    }
  };

  // Funções para drag
  const handleMouseDown = (e: React.MouseEvent) => {
    // Permitir arraste em qualquer parte do header do card
    const target = e.target as HTMLElement;
    const header =
      target.closest("[data-drag-handle]") || target.closest(".cursor-grab");

    if (header || target === e.currentTarget) {
      setIsDragging(true);
      const rect = cardRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
      e.preventDefault();
    }
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) {
        return;
      }

      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;

      const position = calculateAdjustedPosition(
        newX,
        newY,
        CANVAS_SETTINGS_CARD_WIDTH,
        CANVAS_SETTINGS_DRAG_HEIGHT
      );

      setCardPosition(position);
    },
    [isDragging, dragOffset]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsPositionedByUser(true);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "none";

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.userSelect = "select";
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  if (!selectedObject) {
    return null; // Não renderizar nada quando não há objeto selecionado
  }

  const opacityPercentage = Math.round(opacity * OPACITY_PERCENTAGE_MULTIPLIER);
  const draggingClass = isDragging ? "dragging" : "";

  const positionVars = {
    "--settings-pos-x": `${cardPosition.x}px`,
    "--settings-pos-y": `${cardPosition.y}px`,
  } as React.CSSProperties;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      handleClose(e as unknown as React.MouseEvent);
    }
  };

  return (
    <aside
      aria-label="Configurações do elemento selecionado"
      className={`floating-canvas-settings fixed ${draggingClass} canvas-settings-position`}
      ref={cardRef}
      role="group"
      style={positionVars}
    >
      <Card
        className="border-2 shadow-lg"
        onKeyDown={handleKeyDown}
        onMouseDownCapture={handleMouseDown}
        role="dialog"
        tabIndex={0}
      >
        <CardHeader
          className="flex cursor-grab flex-row items-center justify-between space-y-0 pb-2"
          data-drag-handle="true"
        >
          <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="font-medium text-xs">
              {selectedObject?.type === "rect" ? "Retângulo" : "Círculo"}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  aria-label="Excluir elemento"
                  className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                  }}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent onMouseDown={(e) => e.stopPropagation()}>
                <AlertDialogHeader>
                  <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Isso excluirá
                    permanentemente o elemento.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleConfirmDelete}>
                    Continuar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button
              aria-label="Fechar configurações"
              className="h-6 w-6 p-0 hover:bg-accent hover:text-accent-foreground"
              onClick={handleClose}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleClose(e as unknown as React.MouseEvent);
                }
              }}
              onMouseDown={(e) => {
                // Impede que o onMouseDown do contêiner de arraste seja acionado
                e.stopPropagation();
              }}
              size="sm"
              type="button"
              variant="ghost"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 pt-2">
          {/* Dimensões - Compacto */}
          {selectedObject?.type === "rect" ? (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">L</Label>
                <Input
                  className="h-7 text-xs"
                  onChange={(e) => handleWidthChange(e.target.value)}
                  type="number"
                  value={width}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">A</Label>
                <Input
                  className="h-7 text-xs"
                  onChange={(e) => handleHeightChange(e.target.value)}
                  type="number"
                  value={height}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">D</Label>
              <Input
                className="h-7 text-xs"
                onChange={(e) => handleDiameterChange(e.target.value)}
                type="number"
                value={diameter}
              />
            </div>
          )}

          {/* Cores - Compacto */}
          <div className="space-y-2">
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">Fundo</Label>
              <div className="flex gap-1">
                <Input
                  className="h-7 w-8 border-0 p-0"
                  onChange={(e) => handleColorChange(e.target.value)}
                  type="color"
                  value={color}
                />
                <Input
                  className="h-7 flex-1 text-xs"
                  onChange={(e) => handleColorChange(e.target.value)}
                  type="text"
                  value={color}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">
                  Borda
                </Label>
                <div className="flex gap-1">
                  <Input
                    className="h-7 w-6 border-0 p-0"
                    onChange={(e) => handleBorderColorChange(e.target.value)}
                    type="color"
                    value={borderColor}
                  />
                  <Input
                    className="h-7 flex-1 text-xs"
                    onChange={(e) => handleBorderWidthChange(e.target.value)}
                    placeholder="0"
                    type="number"
                    value={borderWidth}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Opacidade */}
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">
              Opacidade: {opacityPercentage}%
            </Label>
            <Slider
              className="w-full"
              max={1}
              min={0}
              onValueChange={handleOpacityChange}
              step={0.01}
              value={[opacity]}
            />
          </div>
        </CardContent>
      </Card>
    </aside>
  );
}

export default CanvasSettings;
