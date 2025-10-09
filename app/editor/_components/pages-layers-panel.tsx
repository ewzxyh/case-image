"use client";

import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  FileImage,
  GripVertical,
  MoreVertical,
  Plus,
  Trash2,
  Type,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { LayerResponse, PageResponse } from "@/lib/types/api";
import { cn } from "@/lib/utils";

type PagesLayersPanelProps = {
  pages: PageResponse[];
  activePage: PageResponse | null;
  selectedLayer: LayerResponse | null;
  onPageChange: (page: PageResponse) => void;
  onAddPage: () => void;
  onLayerSelect: (layer: LayerResponse) => void;
  onLayerToggleVisibility: (layer: LayerResponse) => void;
  onLayerDelete: (layer: LayerResponse) => void;
  onLayerReorder: (layer: LayerResponse, direction: "up" | "down") => void;
};

export default function PagesLayersPanel({
  pages,
  activePage,
  selectedLayer,
  onPageChange,
  onAddPage,
  onLayerSelect,
  onLayerToggleVisibility,
  onLayerDelete,
  onLayerReorder,
}: PagesLayersPanelProps) {
  const [_isDragging, _setIsDragging] = useState(false);

  const layers = activePage?.layers || [];
  const sortedLayers = [...layers].sort((a, b) => b.zIndex - a.zIndex);

  return (
    <div className="flex h-full w-64 flex-col border-r bg-muted/30">
      {/* Páginas */}
      <div className="border-b p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-semibold text-sm">Páginas</h3>
          <Button
            className="h-6 w-6"
            onClick={onAddPage}
            size="icon"
            variant="ghost"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <ScrollArea className="h-24">
          <div className="space-y-1">
            {pages.map((page) => (
              <Button
                className="w-full justify-start"
                key={page.id}
                onClick={() => onPageChange(page)}
                size="sm"
                variant={activePage?.id === page.id ? "secondary" : "ghost"}
              >
                {page.name}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>

      <Separator />

      {/* Layers */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="p-4 pb-2">
          <h3 className="font-semibold text-sm">Layers</h3>
          <p className="text-muted-foreground text-xs">
            {layers.length} {layers.length === 1 ? "elemento" : "elementos"}
          </p>
        </div>
        <ScrollArea className="flex-1 px-2">
          <div className="space-y-1 pb-2">
            {sortedLayers.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                Nenhum layer ainda.
                <br />
                Use as ferramentas para adicionar.
              </div>
            ) : (
              sortedLayers.map((layer) => (
                <Card
                  className={cn(
                    "cursor-pointer transition-colors hover:bg-accent",
                    selectedLayer?.id === layer.id && "ring-2 ring-primary"
                  )}
                  key={layer.id}
                  onClick={() => onLayerSelect(layer)}
                >
                  <CardContent className="flex items-center gap-2 p-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    {layer.type === "text" ? (
                      <Type className="h-4 w-4" />
                    ) : (
                      <FileImage className="h-4 w-4" />
                    )}
                    <span className="flex-1 truncate text-sm">
                      {layer.name}
                    </span>
                    <Button
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        onLayerToggleVisibility(layer);
                      }}
                      size="icon"
                      variant="ghost"
                    >
                      {layer.isVisible ? (
                        <Eye className="h-3 w-3" />
                      ) : (
                        <EyeOff className="h-3 w-3" />
                      )}
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        asChild
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button className="h-6 w-6" size="icon" variant="ghost">
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onLayerReorder(layer, "up");
                          }}
                        >
                          <ChevronUp className="mr-2 h-4 w-4" />
                          Trazer para frente
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onLayerReorder(layer, "down");
                          }}
                        >
                          <ChevronDown className="mr-2 h-4 w-4" />
                          Enviar para trás
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            onLayerDelete(layer);
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
