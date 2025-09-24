import React, { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { X, GripVertical } from "lucide-react";

interface CanvasSettingsProps {
    canvas?: unknown;
}

// Interfaces baseadas na documentação do Fabric.js
interface FabricObjectProps {
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
}

interface RectProps extends FabricObjectProps {
    type: 'rect';
    rx?: number;
    ry?: number;
}

interface CircleProps extends FabricObjectProps {
    type: 'circle';
    startAngle?: number;
    endAngle?: number;
    counterClockwise?: boolean;
}

interface FabricCanvas {
    on(event: string, handler: (event: unknown) => void): void;
    remove?(object: FabricObject): void;
    renderAll(): void;
}

type FabricObject = RectProps | CircleProps;

function CanvasSettings({ canvas }: CanvasSettingsProps) {
    const [selectedObject, setSelectedObject] = useState<FabricObject | null>(null);
    const fabricCanvas = canvas as FabricCanvas;
    const [width, setWidth] = useState<number>(0);
    const [height, setHeight] = useState<number>(0);
    const [color, setColor] = useState<string>("#000000");
    const [diameter, setDiameter] = useState<number>(0);
    const [borderColor, setBorderColor] = useState<string>("#000000");
    const [borderWidth, setBorderWidth] = useState<number>(0);
    const [opacity, setOpacity] = useState<number>(1);

    // Estados para posicionamento flutuante
    const [cardPosition, setCardPosition] = useState({ x: 100, y: 100 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const cardRef = useRef<HTMLDivElement>(null);

    const handleObjectSelection = useCallback((object: unknown) => {
        if (!object) return;

        const fabricObject = object as FabricObject;
        setSelectedObject(fabricObject);

        // Posicionar card acima do objeto selecionado no canvas
        const canvasElement = document.getElementById('canvas');
        if (canvasElement && fabricCanvas) {
            const canvasRect = canvasElement.getBoundingClientRect();
            const centerX = fabricObject.left || 0;
            const centerY = fabricObject.top || 0;
            const cardWidth = 280; // Largura estimada do card
            const cardHeight = 400; // Altura estimada do card

            // Calcular posição considerando a posição do canvas na página
            const canvasLeft = canvasRect.left;
            const canvasTop = canvasRect.top;

            // Converter coordenadas do canvas para coordenadas da tela
            const objectX = canvasLeft + centerX;
            const objectY = canvasTop + centerY;

            let newX = objectX - cardWidth / 2;
            let newY = objectY - cardHeight - 20; // 20px acima do objeto

            // Ajustar posição para manter o card dentro da tela
            newX = Math.max(10, Math.min(newX, window.innerWidth - cardWidth - 10));
            newY = Math.max(10, Math.min(newY, window.innerHeight - cardHeight - 10));

            setCardPosition({ x: newX, y: newY });
        }

        if (fabricObject.type === "rect") {
            const rect = fabricObject as RectProps;
            setWidth(Math.round((rect.width || 0) * (rect.scaleX || 1)));
            setHeight(Math.round((rect.height || 0) * (rect.scaleY || 1)));
            setColor(rect.fill || "#000000");
            setDiameter(0);
            setBorderColor(rect.stroke || "#000000");
            setBorderWidth(rect.strokeWidth || 0);
            setOpacity(rect.opacity || 1);
        } else if (fabricObject.type === "circle") {
            const circle = fabricObject as CircleProps;
            setWidth(0);
            setHeight(0);
            setDiameter(Math.round((circle.radius || 0) * 2 * (circle.scaleX || 1)));
            setColor(circle.fill || "#000000");
            setBorderColor(circle.stroke || "#000000");
            setBorderWidth(circle.strokeWidth || 0);
            setOpacity(circle.opacity || 1);
        }
    }, [fabricCanvas]);

    useEffect(() => {
        if (fabricCanvas) {
            fabricCanvas.on("selection:created", (event: unknown) => {
                handleObjectSelection((event as { selected?: unknown[] })?.selected?.[0]);
            });

            fabricCanvas.on("selection:updated", (event: unknown) => {
                handleObjectSelection((event as { selected?: unknown[] })?.selected?.[0]);
            });

            fabricCanvas.on("selection:cleared", () => {
                setSelectedObject(null);
                clearSettings();
            });

            fabricCanvas.on("object:modified", (event: unknown) => {
                handleObjectSelection((event as { target?: unknown })?.target);
            });

            fabricCanvas.on("object:scaling", (event: unknown) => {
                handleObjectSelection((event as { target?: unknown })?.target);
            });
        }
    }, [fabricCanvas, handleObjectSelection]);

    const clearSettings = () => {
        setWidth(0);
        setHeight(0);
        setColor("#000000");
        setDiameter(0);
        setBorderColor("#000000");
        setBorderWidth(0);
        setOpacity(1);
    }

    const updateObjectProperty = (property: string, value: unknown) => {
        if (selectedObject && fabricCanvas) {
            selectedObject.set?.(property, value);
            fabricCanvas.renderAll();
        }
    }

    const handleWidthChange = (value: string) => {
        const numValue = parseInt(value) || 0;
        setWidth(numValue);
        if (selectedObject && selectedObject.type === "rect") {
            const rect = selectedObject as RectProps;
            rect.set?.({ width: numValue / (rect.scaleX || 1) });
            fabricCanvas.renderAll();
        }
    }

    const handleHeightChange = (value: string) => {
        const numValue = parseInt(value) || 0;
        setHeight(numValue);
        if (selectedObject && selectedObject.type === "rect") {
            const rect = selectedObject as RectProps;
            rect.set?.({ height: numValue / (rect.scaleY || 1) });
            fabricCanvas.renderAll();
        }
    }

    const handleDiameterChange = (value: string) => {
        const numValue = parseInt(value) || 0;
        setDiameter(numValue);
        if (selectedObject && selectedObject.type === "circle") {
            const circle = selectedObject as CircleProps;
            circle.set?.({ radius: numValue / 2 / (circle.scaleX || 1) });
            fabricCanvas.renderAll();
        }
    }

    const handleColorChange = (value: string) => {
        setColor(value);
        updateObjectProperty("fill", value);
    }

    const handleBorderColorChange = (value: string) => {
        setBorderColor(value);
        updateObjectProperty("stroke", value);
    }

    const handleBorderWidthChange = (value: string) => {
        const numValue = parseInt(value) || 0;
        setBorderWidth(numValue);
        updateObjectProperty("strokeWidth", numValue);
    }

    const handleOpacityChange = (value: number[]) => {
        const numValue = value[0] || 1;
        setOpacity(numValue);
        updateObjectProperty("opacity", numValue);
    }

    const deleteSelectedObject = () => {
        if (selectedObject && fabricCanvas) {
            fabricCanvas.remove?.(selectedObject);
            fabricCanvas.renderAll();
            setSelectedObject(null);
            clearSettings();
        }
    }

    // Funções para drag
    const handleMouseDown = (e: React.MouseEvent) => {
        // Permitir arraste em qualquer parte do header do card
        const target = e.target as HTMLElement;
        const header = target.closest('[data-drag-handle]') || target.closest('.cursor-grab');

        if (header || target === e.currentTarget) {
            setIsDragging(true);
            const rect = cardRef.current?.getBoundingClientRect();
            if (rect) {
                setDragOffset({
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top
                });
            }
            e.preventDefault();
        }
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (isDragging) {
            const newX = e.clientX - dragOffset.x;
            const newY = e.clientY - dragOffset.y;
            const cardWidth = 280;
            const cardHeight = 400;

            const adjustedX = Math.max(10, Math.min(newX, window.innerWidth - cardWidth - 10));
            const adjustedY = Math.max(10, Math.min(newY, window.innerHeight - cardHeight - 10));

            setCardPosition({ x: adjustedX, y: adjustedY });
        }
    }, [isDragging, dragOffset]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.body.style.userSelect = 'none';

            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
                document.body.style.userSelect = 'select';
            };
        }
    }, [isDragging, handleMouseMove, handleMouseUp]);


    if (!selectedObject) {
        return null; // Não renderizar nada quando não há objeto selecionado
    }

    return (
        <div
            ref={cardRef}
            className={`fixed floating-canvas-settings ${isDragging ? 'dragging' : ''}`}
            style={{
                left: cardPosition.x,
                top: cardPosition.y,
            }}
            onMouseDown={handleMouseDown}
        >
            <Card className="shadow-lg border-2">
                <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0 cursor-grab" data-drag-handle>
                    <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <CardTitle className="text-xs font-medium">
                            {selectedObject?.type === 'rect' ? 'Retângulo' : 'Círculo'}
                        </CardTitle>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                        onClick={deleteSelectedObject}
                    >
                        <X className="h-3 w-3" />
                    </Button>
                </CardHeader>

                <CardContent className="space-y-3 pt-2">
                    {/* Dimensões - Compacto */}
                    {selectedObject?.type === "rect" ? (
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <Label className="text-[10px] text-muted-foreground">L</Label>
                                <Input
                                    type="number"
                                    value={width}
                                    onChange={(e) => handleWidthChange(e.target.value)}
                                    className="h-7 text-xs"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[10px] text-muted-foreground">A</Label>
                                <Input
                                    type="number"
                                    value={height}
                                    onChange={(e) => handleHeightChange(e.target.value)}
                                    className="h-7 text-xs"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground">D</Label>
                            <Input
                                type="number"
                                value={diameter}
                                onChange={(e) => handleDiameterChange(e.target.value)}
                                className="h-7 text-xs"
                            />
                        </div>
                    )}

                    {/* Cores - Compacto */}
                    <div className="space-y-2">
                        <div className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground">Fundo</Label>
                            <div className="flex gap-1">
                                <Input
                                    type="color"
                                    value={color}
                                    onChange={(e) => handleColorChange(e.target.value)}
                                    className="w-8 h-7 p-0 border-0"
                                />
                                <Input
                                    type="text"
                                    value={color}
                                    onChange={(e) => handleColorChange(e.target.value)}
                                    className="flex-1 h-7 text-xs"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <Label className="text-[10px] text-muted-foreground">Borda</Label>
                                <div className="flex gap-1">
                                    <Input
                                        type="color"
                                        value={borderColor}
                                        onChange={(e) => handleBorderColorChange(e.target.value)}
                                        className="w-6 h-7 p-0 border-0"
                                    />
                                    <Input
                                        type="number"
                                        value={borderWidth}
                                        onChange={(e) => handleBorderWidthChange(e.target.value)}
                                        className="flex-1 h-7 text-xs"
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Opacidade */}
                    <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">
                            Opacidade: {Math.round(opacity * 100)}%
                        </Label>
                        <Slider
                            value={[opacity]}
                            onValueChange={handleOpacityChange}
                            max={1}
                            min={0}
                            step={0.01}
                            className="w-full"
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default CanvasSettings;