"use client";

import { AlignCenter, AlignLeft, AlignRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { LayerResponse } from "@/lib/types/api";

// Valores padrão para propriedades de texto
const DEFAULT_LINE_HEIGHT = 1.2;

type TextPropertiesProps = {
  layer: LayerResponse;
  onUpdate: (updates: Partial<LayerResponse>) => void;
};

const FONTS = [
  "Inter",
  "Arial",
  "Helvetica",
  "Times New Roman",
  "Georgia",
  "Courier New",
  "Verdana",
  "Comic Sans MS",
  "Impact",
  "Roboto",
  "Open Sans",
  "Lato",
  "Montserrat",
];

const FONT_WEIGHTS = [
  { value: "normal", label: "Normal" },
  { value: "bold", label: "Bold" },
  { value: "300", label: "Light" },
  { value: "600", label: "Semi Bold" },
];

export default function TextProperties({
  layer,
  onUpdate,
}: TextPropertiesProps) {
  const [localText, setLocalText] = useState(layer.text || "");

  useEffect(() => {
    setLocalText(layer.text || "");
  }, [layer.text]);

  const handleTextChange = (value: string) => {
    setLocalText(value);
  };

  const handleTextBlur = () => {
    if (localText !== layer.text) {
      onUpdate({ text: localText });
    }
  };

  // Grid de alinhamento 3x3
  const alignGrid = [
    { h: "left", v: "top", label: "Topo Esquerda" },
    { h: "center", v: "top", label: "Topo Centro" },
    { h: "right", v: "top", label: "Topo Direita" },
    { h: "left", v: "middle", label: "Centro Esquerda" },
    { h: "center", v: "middle", label: "Centro" },
    { h: "right", v: "middle", label: "Centro Direita" },
    { h: "left", v: "bottom", label: "Baixo Esquerda" },
    { h: "center", v: "bottom", label: "Baixo Centro" },
    { h: "right", v: "bottom", label: "Baixo Direita" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Propriedades do Texto</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Conteúdo */}
        <div className="space-y-2">
          <Label htmlFor="text-content">Conteúdo</Label>
          <Textarea
            id="text-content"
            onBlur={handleTextBlur}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="Digite o texto..."
            rows={3}
            value={localText}
          />
        </div>

        {/* Fonte */}
        <div className="space-y-2">
          <Label>Fonte</Label>
          <Select
            onValueChange={(value) => onUpdate({ fontFamily: value })}
            value={layer.fontFamily || "Inter"}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONTS.map((font) => (
                <SelectItem key={font} value={font}>
                  {font}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tamanho e Peso */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Tamanho</Label>
            <Input
              max={200}
              min={8}
              onChange={(e) =>
                onUpdate({ fontSize: Number.parseInt(e.target.value, 10) })
              }
              type="number"
              value={layer.fontSize || 24}
            />
          </div>
          <div className="space-y-2">
            <Label>Peso</Label>
            <Select
              onValueChange={(value) => onUpdate({ fontWeight: value })}
              value={layer.fontWeight || "normal"}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONT_WEIGHTS.map((weight) => (
                  <SelectItem key={weight.value} value={weight.value}>
                    {weight.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Cor */}
        <div className="space-y-2">
          <Label>Cor do Texto</Label>
          <div className="flex gap-2">
            <Input
              className="h-10 w-16 p-1"
              onChange={(e) => onUpdate({ fontColor: e.target.value })}
              type="color"
              value={layer.fontColor || "#000000"}
            />
            <Input
              className="flex-1"
              onChange={(e) => onUpdate({ fontColor: e.target.value })}
              type="text"
              value={layer.fontColor || "#000000"}
            />
          </div>
        </div>

        {/* Alinhamento do texto */}
        <div className="space-y-2">
          <Label>Alinhamento de Texto</Label>
          <div className="flex gap-1">
            <Button
              onClick={() => onUpdate({ textAlign: "left" })}
              size="icon"
              variant={layer.textAlign === "left" ? "default" : "outline"}
            >
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => onUpdate({ textAlign: "center" })}
              size="icon"
              variant={layer.textAlign === "center" ? "default" : "outline"}
            >
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => onUpdate({ textAlign: "right" })}
              size="icon"
              variant={layer.textAlign === "right" ? "default" : "outline"}
            >
              <AlignRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Altura da linha */}
        <div className="space-y-2">
          <Label>
            Altura da Linha: {layer.lineHeight?.toFixed(1) || "1.2"}
          </Label>
          <Slider
            max={3}
            min={0.8}
            onValueChange={([value]) => onUpdate({ lineHeight: value })}
            step={0.1}
            value={[layer.lineHeight || DEFAULT_LINE_HEIGHT]}
          />
        </div>

        {/* Cor de fundo */}
        <div className="space-y-2">
          <Label>Cor de Fundo</Label>
          <div className="flex gap-2">
            <Input
              className="h-10 w-16 p-1"
              onChange={(e) => onUpdate({ backgroundColor: e.target.value })}
              type="color"
              value={layer.backgroundColor || "#ffffff"}
            />
            <Input
              className="flex-1"
              onChange={(e) =>
                onUpdate({ backgroundColor: e.target.value || undefined })
              }
              placeholder="Transparente"
              type="text"
              value={layer.backgroundColor || ""}
            />
          </div>
        </div>

        {/* Alinhar no Canvas (grid 3x3) */}
        <div className="space-y-2">
          <Label>Alinhar no Canvas</Label>
          <div className="grid grid-cols-3 gap-1">
            {alignGrid.map((align) => (
              <Button
                className="h-10"
                key={`${align.h}-${align.v}`}
                onClick={() =>
                  onUpdate({
                    anchorH: align.h as "left" | "center" | "right",
                    anchorV: align.v as "top" | "middle" | "bottom",
                  })
                }
                size="sm"
                title={align.label}
                variant={
                  layer.anchorH === align.h && layer.anchorV === align.v
                    ? "default"
                    : "outline"
                }
              >
                <div className={"h-2 w-2 rounded-full bg-current"} />
              </Button>
            ))}
          </div>
        </div>

        {/* Switches */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="visible">Visível</Label>
            <Switch
              checked={layer.isVisible}
              id="visible"
              onCheckedChange={(checked) => onUpdate({ isVisible: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="static">Estático</Label>
            <Switch
              checked={layer.isStatic}
              id="static"
              onCheckedChange={(checked) => onUpdate({ isStatic: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="hide-if-empty">Ocultar se vazio</Label>
            <Switch
              checked={layer.hideIfEmpty}
              id="hide-if-empty"
              onCheckedChange={(checked) => onUpdate({ hideIfEmpty: checked })}
            />
          </div>
        </div>

        {/* Posição e Tamanho */}
        <div className="space-y-3 border-t pt-2">
          <Label className="font-semibold text-xs">Posição e Tamanho</Label>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">X</Label>
              <Input
                onChange={(e) =>
                  onUpdate({ x: Number.parseInt(e.target.value, 10) })
                }
                type="number"
                value={Math.round(layer.x)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Y</Label>
              <Input
                onChange={(e) =>
                  onUpdate({ y: Number.parseInt(e.target.value, 10) })
                }
                type="number"
                value={Math.round(layer.y)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Largura</Label>
              <Input
                onChange={(e) =>
                  onUpdate({ width: Number.parseInt(e.target.value, 10) })
                }
                type="number"
                value={Math.round(layer.width)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Altura</Label>
              <Input
                onChange={(e) =>
                  onUpdate({ height: Number.parseInt(e.target.value, 10) })
                }
                type="number"
                value={Math.round(layer.height)}
              />
            </div>
          </div>
        </div>

        {/* Opacidade */}
        <div className="space-y-2">
          {/* biome-ignore lint/style/noMagicNumbers: 100 é a conversão padrão de decimal para porcentagem */}
          <Label>Opacidade: {Math.round((layer.opacity || 1) * 100)}%</Label>
          <Slider
            max={1}
            min={0}
            onValueChange={([value]) => onUpdate({ opacity: value })}
            step={0.01}
            value={[layer.opacity || 1]}
          />
        </div>
      </CardContent>
    </Card>
  );
}
