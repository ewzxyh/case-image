import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

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
    const [visible, setVisible] = useState<boolean>(true);

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
    }, [fabricCanvas]);

    const handleObjectSelection = (object: unknown) => {
        if (!object) return;

        const fabricObject = object as FabricObject;
        setSelectedObject(fabricObject);

        if (fabricObject.type === "rect") {
            const rect = fabricObject as RectProps;
            setWidth(Math.round((rect.width || 0) * (rect.scaleX || 1)));
            setHeight(Math.round((rect.height || 0) * (rect.scaleY || 1)));
            setColor(rect.fill || "#000000");
            setDiameter(0);
            setBorderColor(rect.stroke || "#000000");
            setBorderWidth(rect.strokeWidth || 0);
            setOpacity(rect.opacity || 1);
            setVisible(rect.visible !== false);
        } else if (fabricObject.type === "circle") {
            const circle = fabricObject as CircleProps;
            setWidth(0);
            setHeight(0);
            setDiameter(Math.round((circle.radius || 0) * 2 * (circle.scaleX || 1)));
            setColor(circle.fill || "#000000");
            setBorderColor(circle.stroke || "#000000");
            setBorderWidth(circle.strokeWidth || 0);
            setOpacity(circle.opacity || 1);
            setVisible(circle.visible !== false);
        }
    }

    const clearSettings = () => {
        setWidth(0);
        setHeight(0);
        setColor("#000000");
        setDiameter(0);
        setBorderColor("#000000");
        setBorderWidth(0);
        setOpacity(1);
        setVisible(true);
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

    const handleVisibleChange = (checked: boolean) => {
        setVisible(checked);
        updateObjectProperty("visible", checked);
    }

    const deleteSelectedObject = () => {
        if (selectedObject && fabricCanvas) {
            fabricCanvas.remove?.(selectedObject);
            fabricCanvas.renderAll();
            setSelectedObject(null);
            clearSettings();
        }
    }


    if (!selectedObject) {
        return (
            <div className="p-4 border-b bg-background">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-medium text-muted-foreground">
                            Propriedades do Elemento
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                            Selecione um elemento no canvas para editar suas propriedades
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="p-4 border-b bg-background space-y-4">
            <div>
                <h3 className="text-sm font-medium text-foreground">
                    Propriedades do Elemento
                </h3>
                <p className="text-xs text-muted-foreground">
                    {selectedObject?.type === 'rect' ? 'Retângulo' : 'Círculo'} selecionado
                </p>
            </div>

            <div className="space-y-4">
                {/* Dimensões */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Dimensões</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {selectedObject?.type === "rect" ? (
                            <>
                                <div className="space-y-1">
                                    <Label htmlFor="width" className="text-xs">Largura</Label>
                                    <Input
                                        id="width"
                                        type="number"
                                        value={width}
                                        onChange={(e) => handleWidthChange(e.target.value)}
                                        placeholder="Largura em px"
                                        className="h-8"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="height" className="text-xs">Altura</Label>
                                    <Input
                                        id="height"
                                        type="number"
                                        value={height}
                                        onChange={(e) => handleHeightChange(e.target.value)}
                                        placeholder="Altura em px"
                                        className="h-8"
                                    />
                                </div>
                            </>
                        ) : (
                            <div className="space-y-1">
                                <Label htmlFor="diameter" className="text-xs">Diâmetro</Label>
                                <Input
                                    id="diameter"
                                    type="number"
                                    value={diameter}
                                    onChange={(e) => handleDiameterChange(e.target.value)}
                                    placeholder="Diâmetro em px"
                                    className="h-8"
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Cores */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Cores</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="space-y-1">
                            <Label htmlFor="color" className="text-xs">Cor de Fundo</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="color"
                                    type="color"
                                    value={color}
                                    onChange={(e) => handleColorChange(e.target.value)}
                                    className="w-12 h-8 p-0 border-0"
                                />
                                <Input
                                    type="text"
                                    value={color}
                                    onChange={(e) => handleColorChange(e.target.value)}
                                    placeholder="#000000"
                                    className="flex-1 h-8"
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="borderColor" className="text-xs">Cor da Borda</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="borderColor"
                                    type="color"
                                    value={borderColor}
                                    onChange={(e) => handleBorderColorChange(e.target.value)}
                                    className="w-12 h-8 p-0 border-0"
                                />
                                <Input
                                    type="text"
                                    value={borderColor}
                                    onChange={(e) => handleBorderColorChange(e.target.value)}
                                    placeholder="#000000"
                                    className="flex-1 h-8"
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="borderWidth" className="text-xs">Espessura da Borda</Label>
                            <Input
                                id="borderWidth"
                                type="number"
                                value={borderWidth}
                                onChange={(e) => handleBorderWidthChange(e.target.value)}
                                placeholder="Espessura em px"
                                className="h-8"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Aparência */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Aparência</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs">Opacidade: {Math.round(opacity * 100)}%</Label>
                            <Slider
                                value={[opacity]}
                                onValueChange={handleOpacityChange}
                                max={1}
                                min={0}
                                step={0.01}
                                className="w-full"
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <Label htmlFor="visible" className="text-xs">Visível</Label>
                            <Switch
                                id="visible"
                                checked={visible}
                                onCheckedChange={handleVisibleChange}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Ações */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Ações</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">

                        <Button
                            onClick={deleteSelectedObject}
                            variant="destructive"
                            size="sm"
                            className="w-full text-xs"
                        >
                            Excluir Elemento
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default CanvasSettings;