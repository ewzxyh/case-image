"use client"

import React, { useRef, useEffect, useState } from "react";
import { Canvas, Rect, Circle } from "fabric";
import CanvasSettings from "./_components/canvas-settings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useSidebar } from "@/components/ui/sidebar";

export default function EditorPage() {
    const canvasRef = useRef(null);
    const [canvas, setCanvas] = useState<Canvas | null>(null);

    useEffect(() => {
        if (canvasRef.current) {
            const initCanvas = new Canvas(canvasRef.current,
                {
                    width: 800,
                    height: 600,
                }
            );
            initCanvas.backgroundColor = "#b9b9b9";
            initCanvas.renderAll();

            setCanvas(initCanvas);

            return () => {
                initCanvas.dispose();
            }
        }
    }, []);

    const addRectangle = () => {
        if (canvas) {
            const rect = new Rect({
                left: 100,
                top: 100,
                width: 100,
                height: 100,
                fill: "#3b82f6",
            });
            canvas?.add(rect);
        }
    }

    const addCircle = () => {
        if (canvas) {
            const circle = new Circle({
                left: 150,
                top: 150,
                radius: 50,
                fill: "#ef4444",
            });
            canvas?.add(circle);
        }
    }

    const { state } = useSidebar();

    return (
        <div className="flex h-full w-full">
            {/* Toolbar lateral do editor - integrada com sidebar principal */}
            <div className={`editor-toolbar ${state === 'expanded' ? 'expanded' : 'collapsed'
                }`}>
                <div className="h-full border-r bg-muted/30 p-4 space-y-4">
                    <div>
                        <h2 className="text-lg font-semibold">Editor de Canvas</h2>
                        <p className="text-sm text-muted-foreground">Ferramentas para edição</p>
                    </div>
                    <Separator />
                    <Card>
                        <CardHeader>
                            <CardTitle>Ferramentas</CardTitle>
                            <CardDescription>
                                Adicione elementos ao canvas
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button
                                onClick={addRectangle}
                                variant="ghost"
                                size="default"
                                className="w-full"
                            >
                                Adicionar Retângulo
                            </Button>
                            <Button
                                onClick={addCircle}
                                variant="ghost"
                                size="default"
                                className="w-full"
                            >
                                Adicionar Círculo
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Área principal do canvas */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <CanvasSettings canvas={canvas} />
                <div className="flex-1 p-4 min-h-0 bg-neutral-800 overflow-hidden">
                    <canvas id="canvas" ref={canvasRef} className="" />
                </div>
            </div>
        </div>
    )
}
