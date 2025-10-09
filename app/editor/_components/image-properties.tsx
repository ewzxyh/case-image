"use client";

import { Image as ImageIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
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
import type { LayerResponse } from "@/lib/types/api";

type ImagePropertiesProps = {
  layer: LayerResponse;
  onUpdate: (updates: Partial<LayerResponse>) => void;
};

const PLACEMENT_TYPES = [
  { value: "cover", label: "Cover (Preencher)" },
  { value: "contain", label: "Contain (Conter)" },
  { value: "fill", label: "Fill (Esticar)" },
  { value: "align", label: "Align (Alinhar)" },
  { value: "crop", label: "Crop (Recortar)" },
  { value: "background", label: "Background (Fundo)" },
];

const ALIGN_H = [
  { value: "left", label: "Esquerda" },
  { value: "center", label: "Centro" },
  { value: "right", label: "Direita" },
];

const ALIGN_V = [
  { value: "top", label: "Topo" },
  { value: "center", label: "Centro" },
  { value: "bottom", label: "Baixo" },
];

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: A complexidade é necessária para lidar com múltiplos casos condicionais de layout de imagem
export default function ImageProperties({
  layer,
  onUpdate,
}: ImagePropertiesProps) {
  const [mediaLibraryOpen, setMediaLibraryOpen] = useState(false);

  const handlePlacementChange = (value: string) => {
    const FULL_SIZE_RATIO = 1.0;
    const BACKGROUND_Z_INDEX = -100;

    const updates: Partial<typeof layer> = { imagePosition: value };

    // Se for Background, ajustar propriedades
    if (value === "background") {
      updates.isBackground = true;
      updates.widthRatio = FULL_SIZE_RATIO;
      updates.heightRatio = FULL_SIZE_RATIO;
      updates.anchorH = "center";
      updates.anchorV = "middle";
      updates.zIndex = BACKGROUND_Z_INDEX;
      onUpdate(updates);
      return;
    }

    if (layer.isBackground) {
      // Se estava como background e mudou, remover flag
      updates.isBackground = false;
    }

    onUpdate(updates);
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
        <CardTitle className="text-sm">Propriedades da Imagem</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selecionar da Media Library */}
        <div className="space-y-2">
          <Label>Imagem</Label>
          <Drawer onOpenChange={setMediaLibraryOpen} open={mediaLibraryOpen}>
            <DrawerTrigger asChild>
              <Button className="w-full" variant="outline">
                <ImageIcon className="mr-2 h-4 w-4" />
                {layer.imageAssetId
                  ? "Trocar Imagem"
                  : "Selecionar da Biblioteca"}
              </Button>
            </DrawerTrigger>
            <DrawerContent className="h-[80vh]">
              <DrawerHeader>
                <DrawerTitle>Media Library</DrawerTitle>
              </DrawerHeader>
              <div className="p-4">
                <p className="text-muted-foreground text-sm">
                  Integração com Media Library será implementada.
                </p>
              </div>
            </DrawerContent>
          </Drawer>
        </div>

        {/* URL Externa */}
        <div className="space-y-2">
          <Label>URL Externa (opcional)</Label>
          <Input
            onChange={(e) =>
              onUpdate({ imageUrl: e.target.value || undefined })
            }
            placeholder="https://..."
            type="url"
            value={layer.imageUrl || ""}
          />
        </div>

        {/* Tipo de Placement */}
        <div className="space-y-2">
          <Label>Tipo de Ajuste</Label>
          <Select
            onValueChange={handlePlacementChange}
            value={layer.imagePosition || "cover"}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PLACEMENT_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Alinhamento da imagem (quando em modo Align) */}
        {layer.imagePosition === "align" && (
          <div className="space-y-2">
            <Label>Alinhamento da Imagem</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Horizontal</Label>
                <Select
                  onValueChange={(value) =>
                    onUpdate({
                      imageAlignH: value as "left" | "center" | "right",
                    })
                  }
                  value={layer.imageAlignH || "center"}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALIGN_H.map((align) => (
                      <SelectItem key={align.value} value={align.value}>
                        {align.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Vertical</Label>
                <Select
                  onValueChange={(value) =>
                    onUpdate({
                      imageAlignV: value as "top" | "middle" | "bottom",
                    })
                  }
                  value={layer.imageAlignV || "center"}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALIGN_V.map((align) => (
                      <SelectItem key={align.value} value={align.value}>
                        {align.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* Alinhar no Canvas (grid 3x3) */}
        {!layer.isBackground && (
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
        )}

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
          {layer.isBackground && (
            <div className="rounded bg-muted p-2 text-muted-foreground text-xs">
              Esta imagem está configurada como fundo e preenche todo o canvas.
            </div>
          )}
        </div>

        {/* Posição e Tamanho */}
        {!layer.isBackground && (
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
        )}

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

        {/* Borda */}
        <div className="space-y-2">
          <Label>Borda</Label>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Cor</Label>
              <Input
                className="h-10 p-1"
                onChange={(e) => onUpdate({ borderColor: e.target.value })}
                type="color"
                value={layer.borderColor || "#000000"}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Largura</Label>
              <Input
                onChange={(e) => onUpdate({ borderWidth: e.target.value })}
                placeholder="0px"
                type="text"
                value={layer.borderWidth || "0px"}
              />
            </div>
          </div>
        </div>

        {/* Border Radius */}
        <div className="space-y-2">
          <Label>Arredondamento: {layer.borderRadius || 0}px</Label>
          <Slider
            max={100}
            min={0}
            onValueChange={([value]) => onUpdate({ borderRadius: value })}
            step={1}
            value={[layer.borderRadius || 0]}
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
      </CardContent>
    </Card>
  );
}
