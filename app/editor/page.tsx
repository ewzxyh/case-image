"use client";

import {
  Canvas,
  FabricImage,
  type FabricObject,
  FabricText,
  Rect,
} from "fabric";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCanvasViewport } from "@/hooks/useCanvasViewport";
import {
  CENTER_IMAGE_HEIGHT_HALF,
  CENTER_IMAGE_WIDTH_HALF,
  CENTER_TEXT_HEIGHT_HALF,
  CENTER_TEXT_WIDTH_HALF,
  DEFAULT_CANVAS_HEIGHT,
  DEFAULT_CANVAS_WIDTH,
  RATIO_DECIMAL_PLACES,
  SAVE_STATUS_RESET_MS,
} from "@/lib/canvas/constants";
import type {
  LayerResponse,
  PageResponse,
  TemplateDetailResponse,
} from "@/lib/types/api";
import ImageProperties from "./_components/image-properties";
import PagesLayersPanel from "./_components/pages-layers-panel";
import TextProperties from "./_components/text-properties";
import ToolsToolbar from "./_components/tools-toolbar";
import ZoomControls from "./_components/zoom-controls";

const FIRST_PAGE_INDEX = 0;
const SINGLE_OBJECT = 1;
const DEBOUNCE_SAVE_MS = 400;
const FONT_SIZE_DEFAULT = 24;
const ZOOM_STEP_INCREMENT = 0.1;
const ZOOM_MAX_LIMIT = 3;
const ZOOM_MIN_LIMIT = 0.1;

export default function EditorPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const templateId = searchParams.get("template");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<Canvas | null>(null);
  const [zoom, setZoom] = useState(1);

  // Data state
  const [template, setTemplate] = useState<TemplateDetailResponse | null>(null);
  const [pages, setPages] = useState<PageResponse[]>([]);
  const [activePage, setActivePage] = useState<PageResponse | null>(null);

  // Hook de viewport para drag/zoom por CSS transform
  const viewport = useCanvasViewport({
    canvas: fabricCanvas,
    wrapperEl: wrapperRef.current,
    initialDimensions: activePage
      ? { width: activePage.width, height: activePage.height }
      : undefined,
    limits: {
      zoomMin: ZOOM_MIN_LIMIT,
      zoomMax: ZOOM_MAX_LIMIT,
    },
    onZoomChange: setZoom,
  });
  const [selectedLayer, setSelectedLayer] = useState<LayerResponse | null>(
    null
  );
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle"
  );

  // Debounce timer for saving
  const saveTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const fetchTemplate = useCallback(async () => {
    try {
      const response = await fetch(`/api/templates/${templateId}`);
      if (!response.ok) {
        throw new Error("Falha ao carregar template");
      }

      const data: TemplateDetailResponse = await response.json();
      setTemplate(data);
      setPages(data.pages);

      if (data.pages.length > FIRST_PAGE_INDEX) {
        setActivePage(data.pages[FIRST_PAGE_INDEX]);
      }
    } catch (_error) {
      toast.error("Erro ao carregar template");
    }
  }, [templateId]);

  // Carregar template
  useEffect(() => {
    if (!templateId) {
      toast.error("ID do template não fornecido");
      router.push("/templates");
      return;
    }

    fetchTemplate();
  }, [templateId, fetchTemplate, router]);

  const debouncedUpdateLayer = useCallback(
    (layerId: string, updates: Partial<LayerResponse>) => {
      setSaveStatus("saving");

      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }

      saveTimerRef.current = setTimeout(async () => {
        try {
          const response = await fetch(`/api/placeholders/${layerId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates),
          });

          if (!response.ok) {
            throw new Error("Falha ao salvar");
          }

          setSaveStatus("saved");

          setTimeout(() => setSaveStatus("idle"), SAVE_STATUS_RESET_MS);
        } catch (_error) {
          toast.error("Erro ao salvar alterações");
          setSaveStatus("idle");
        }
      }, DEBOUNCE_SAVE_MS);
    },
    []
  );

  const updateSelectedLayerFromObject = useCallback(
    (obj: FabricObject) => {
      const layerId = (obj as unknown as Record<string, unknown>).layerId as
        | string
        | undefined;
      if (layerId && activePage) {
        const layer = activePage.layers.find((l) => l.id === layerId);
        if (layer) {
          setSelectedLayer(layer);
        }
      }
    },
    [activePage]
  );

  const calculatePositionRatios = useCallback(
    (obj: FabricObject) => ({
      xRatio: (obj.left || 0) / (activePage?.width || 1),
      yRatio: (obj.top || 0) / (activePage?.height || 1),
      widthRatio:
        ((obj.width || 0) * (obj.scaleX || 1)) / (activePage?.width || 1),
      heightRatio:
        ((obj.height || 0) * (obj.scaleY || 1)) / (activePage?.height || 1),
    }),
    [activePage]
  );

  const handleObjectModified = useCallback(
    (obj: FabricObject) => {
      const layerId = (obj as unknown as Record<string, unknown>).layerId as
        | string
        | undefined;
      if (!(layerId && activePage)) {
        return;
      }

      const layer = activePage.layers.find((l) => l.id === layerId);
      if (!layer) {
        return;
      }

      const ratios = calculatePositionRatios(obj);

      debouncedUpdateLayer(layerId, {
        x: Math.round(obj.left || 0),
        y: Math.round(obj.top || 0),
        width: Math.round((obj.width || 0) * (obj.scaleX || 1)),
        height: Math.round((obj.height || 0) * (obj.scaleY || 1)),
        xRatio: Number.parseFloat(ratios.xRatio.toFixed(RATIO_DECIMAL_PLACES)),
        yRatio: Number.parseFloat(ratios.yRatio.toFixed(RATIO_DECIMAL_PLACES)),
        widthRatio: Number.parseFloat(
          ratios.widthRatio.toFixed(RATIO_DECIMAL_PLACES)
        ),
        heightRatio: Number.parseFloat(
          ratios.heightRatio.toFixed(RATIO_DECIMAL_PLACES)
        ),
      });
    },
    [activePage, debouncedUpdateLayer, calculatePositionRatios]
  );

  const createTextLayer = useCallback(
    (canvas: Canvas, layer: LayerResponse) => {
      const text = new FabricText(layer.text || "Texto", {
        left: layer.x,
        top: layer.y,
        width: layer.width,
        fontSize: layer.fontSize || FONT_SIZE_DEFAULT,
        fontFamily: layer.fontFamily || "Inter",
        fill: layer.fontColor || "#000000",
        fontWeight: layer.fontWeight || "normal",
        textAlign: (layer.textAlign || "left") as
          | "left"
          | "center"
          | "right"
          | "justify",
        backgroundColor: layer.backgroundColor,
        opacity: layer.opacity || 1,
        objectCaching: false,
        noScaleCache: true,
      });

      (text as unknown as Record<string, unknown>).layerId = layer.id;
      canvas.add(text);
    },
    []
  );

  const createPlaceholderRect = useCallback(
    (canvas: Canvas, layer: LayerResponse) => {
      const rect = new Rect({
        left: layer.x,
        top: layer.y,
        width: layer.width,
        height: layer.height,
        fill: layer.backgroundColor || "#e0e0e0",
        opacity: layer.opacity || 1,
        objectCaching: false,
        noScaleCache: true,
      });
      (rect as unknown as Record<string, unknown>).layerId = layer.id;
      canvas.add(rect);
      canvas.requestRenderAll();
    },
    []
  );

  const createImageLayer = useCallback(
    (canvas: Canvas, layer: LayerResponse) => {
      if (!layer.imageUrl) {
        createPlaceholderRect(canvas, layer);
        return;
      }

      FabricImage.fromURL(layer.imageUrl)
        .then((img) => {
          img.set({
            left: layer.x,
            top: layer.y,
            scaleX: layer.width / (img.width || 1),
            scaleY: layer.height / (img.height || 1),
            opacity: layer.opacity || 1,
            objectCaching: false,
            noScaleCache: true,
          });
          (img as unknown as Record<string, unknown>).layerId = layer.id;
          canvas.add(img);
          canvas.requestRenderAll();
        })
        .catch(() => {
          createPlaceholderRect(canvas, layer);
        });
    },
    [createPlaceholderRect]
  );

  const loadLayerToCanvas = useCallback(
    (canvas: Canvas, layer: LayerResponse) => {
      if (!layer.isVisible) {
        return;
      }

      if (layer.type === "text") {
        createTextLayer(canvas, layer);
      } else if (layer.type === "image") {
        createImageLayer(canvas, layer);
      }
    },
    [createTextLayer, createImageLayer]
  );

  const loadLayersToCanvas = useCallback(
    (canvas: Canvas, layers: LayerResponse[]) => {
      canvas.clear();
      canvas.backgroundColor = activePage?.backgroundColor || "#ffffff";

      // Ordenar por z-index
      const sortedLayers = [...layers].sort((a, b) => a.zIndex - b.zIndex);

      for (const layer of sortedLayers) {
        loadLayerToCanvas(canvas, layer);
      }

      canvas.requestRenderAll();
    },
    [activePage, loadLayerToCanvas]
  );

  // Inicializar Fabric Canvas
  useEffect(() => {
    if (!(canvasRef.current && activePage && wrapperRef.current)) {
      return;
    }

    const canvas = new Canvas(canvasRef.current, {
      width: activePage.width,
      height: activePage.height,
      backgroundColor: activePage.backgroundColor || "#ffffff",
      selection: true,
      preserveObjectStacking: true,
    });

    // Detectar seleção de objetos
    canvas.on("selection:created", (e) => {
      if (e.selected && e.selected.length === SINGLE_OBJECT) {
        const obj = e.selected[FIRST_PAGE_INDEX];
        updateSelectedLayerFromObject(obj);
      }
    });

    canvas.on("selection:updated", (e) => {
      if (e.selected && e.selected.length === SINGLE_OBJECT) {
        const obj = e.selected[FIRST_PAGE_INDEX];
        updateSelectedLayerFromObject(obj);
      }
    });

    canvas.on("selection:cleared", () => {
      setSelectedLayer(null);
    });

    // Detectar modificações (mover, redimensionar)
    canvas.on("object:modified", (e) => {
      if (e.target) {
        handleObjectModified(e.target);
      }
    });

    setFabricCanvas(canvas);

    // Load layers para o canvas
    loadLayersToCanvas(canvas, activePage.layers);

    return () => {
      canvas.dispose();
    };
  }, [
    activePage,
    handleObjectModified,
    loadLayersToCanvas,
    updateSelectedLayerFromObject,
  ]);

  const handleZoomIn = useCallback(() => {
    if (!(wrapperRef.current && viewport)) {
      return;
    }
    const newZoom = Math.min(zoom + ZOOM_STEP_INCREMENT, ZOOM_MAX_LIMIT);
    const centerX = wrapperRef.current.clientWidth / 2;
    const centerY = wrapperRef.current.clientHeight / 2;
    viewport.zoomTo(newZoom, { x: centerX, y: centerY });
  }, [zoom, viewport]);

  const handleZoomOut = useCallback(() => {
    if (!(wrapperRef.current && viewport)) {
      return;
    }
    const newZoom = Math.max(zoom - ZOOM_STEP_INCREMENT, ZOOM_MIN_LIMIT);
    const centerX = wrapperRef.current.clientWidth / 2;
    const centerY = wrapperRef.current.clientHeight / 2;
    viewport.zoomTo(newZoom, { x: centerX, y: centerY });
  }, [zoom, viewport]);

  const handleResetZoom = useCallback(() => {
    if (!viewport) {
      return;
    }
    viewport.resetCanvas();
  }, [viewport]);

  const handleFitZoom = useCallback(() => {
    if (!viewport) {
      return;
    }
    viewport.fitToWrapper();
  }, [viewport]);

  const handlePageChange = (page: PageResponse) => {
    setActivePage(page);
    setSelectedLayer(null);
  };

  const handleAddPage = async () => {
    if (!template) {
      return;
    }

    try {
      const response = await fetch(`/api/templates/${template.id}/canvases`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `Page ${pages.length + 1}`,
          order: pages.length,
          width: DEFAULT_CANVAS_WIDTH,
          height: DEFAULT_CANVAS_HEIGHT,
        }),
      });

      if (!response.ok) {
        throw new Error("Falha ao criar página");
      }

      toast.success("Página criada com sucesso");
      await fetchTemplate();
    } catch (_error) {
      toast.error("Erro ao criar página");
    }
  };

  const handleAddText = async () => {
    if (!activePage) {
      return;
    }

    try {
      const centerX = activePage.width / 2 - CENTER_TEXT_WIDTH_HALF;
      const centerY = activePage.height / 2 - CENTER_TEXT_HEIGHT_HALF;

      const response = await fetch(
        `/api/templates/${templateId}/placeholders`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            canvasId: activePage.id,
            name: `Text ${activePage.layers.length + 1}`,
            type: "text",
            x: centerX,
            y: centerY,
            width: 200,
            height: 50,
            text: "Novo Texto",
            fontSize: FONT_SIZE_DEFAULT,
            fontColor: "#000000",
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Falha ao criar texto");
      }

      toast.success("Texto adicionado");
      await fetchTemplate();
    } catch (_error) {
      toast.error("Erro ao adicionar texto");
    }
  };

  const handleAddImage = async () => {
    if (!activePage) {
      return;
    }

    try {
      const centerX = activePage.width / 2 - CENTER_IMAGE_WIDTH_HALF;
      const centerY = activePage.height / 2 - CENTER_IMAGE_HEIGHT_HALF;

      const response = await fetch(
        `/api/templates/${templateId}/placeholders`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            canvasId: activePage.id,
            name: `Image ${activePage.layers.length + 1}`,
            type: "image",
            x: centerX,
            y: centerY,
            width: 300,
            height: 300,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Falha ao criar imagem");
      }

      toast.success("Imagem adicionada");
      await fetchTemplate();
    } catch (_error) {
      toast.error("Erro ao adicionar imagem");
    }
  };

  const updateTextProperties = useCallback(
    (obj: FabricText, updates: Partial<LayerResponse>) => {
      if (updates.text !== undefined) {
        obj.set("text", updates.text);
      }
      if (updates.fontSize !== undefined) {
        obj.set("fontSize", updates.fontSize);
      }
      if (updates.fontFamily !== undefined) {
        obj.set("fontFamily", updates.fontFamily);
      }
      if (updates.fontColor !== undefined) {
        obj.set("fill", updates.fontColor);
      }
      if (updates.fontWeight !== undefined) {
        obj.set("fontWeight", updates.fontWeight);
      }
      if (updates.textAlign !== undefined) {
        obj.set(
          "textAlign",
          updates.textAlign as "left" | "center" | "right" | "justify"
        );
      }
      if (updates.backgroundColor !== undefined) {
        obj.set("backgroundColor", updates.backgroundColor);
      }
    },
    []
  );

  const updateCommonProperties = useCallback(
    (obj: FabricObject, updates: Partial<LayerResponse>) => {
      if (updates.opacity !== undefined) {
        obj.set("opacity", updates.opacity);
      }
      if (updates.x !== undefined) {
        obj.set("left", updates.x);
      }
      if (updates.y !== undefined) {
        obj.set("top", updates.y);
      }
      if (updates.width !== undefined) {
        obj.set("width", updates.width);
      }
      if (updates.height !== undefined) {
        obj.set("height", updates.height);
      }
      if (updates.isVisible !== undefined) {
        obj.set("visible", updates.isVisible);
      }
    },
    []
  );

  const updateCanvasObject = useCallback(
    (layerId: string, updates: Partial<LayerResponse>) => {
      if (!fabricCanvas) {
        return;
      }

      const obj = fabricCanvas
        .getObjects()
        .find(
          (o) => (o as unknown as Record<string, unknown>).layerId === layerId
        );

      if (!obj) {
        return;
      }

      if (obj instanceof FabricText) {
        updateTextProperties(obj, updates);
      }

      updateCommonProperties(obj, updates);
      obj.setCoords();
      fabricCanvas.requestRenderAll();
    },
    [fabricCanvas, updateTextProperties, updateCommonProperties]
  );

  const handleLayerUpdate = useCallback(
    (layerId: string, updates: Partial<LayerResponse>) => {
      debouncedUpdateLayer(layerId, updates);

      // Update local state immediately for UI responsiveness
      if (activePage) {
        const updatedLayers = activePage.layers.map((l) =>
          l.id === layerId ? { ...l, ...updates } : l
        );
        setActivePage({ ...activePage, layers: updatedLayers });

        if (selectedLayer?.id === layerId) {
          setSelectedLayer({ ...selectedLayer, ...updates });
        }
      }

      // Update canvas object
      updateCanvasObject(layerId, updates);
    },
    [debouncedUpdateLayer, activePage, selectedLayer, updateCanvasObject]
  );

  const handleLayerToggleVisibility = (layer: LayerResponse) => {
    handleLayerUpdate(layer.id, { isVisible: !layer.isVisible });
  };

  const handleLayerDelete = async (layer: LayerResponse) => {
    try {
      const response = await fetch(`/api/placeholders/${layer.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Falha ao excluir");
      }

      toast.success("Layer excluído");
      await fetchTemplate();
    } catch (_error) {
      toast.error("Erro ao excluir layer");
    }
  };

  const handleLayerReorder = async (
    layer: LayerResponse,
    direction: "up" | "down"
  ) => {
    const INCREMENT = 1;
    const newZIndex =
      direction === "up" ? layer.zIndex + INCREMENT : layer.zIndex - INCREMENT;
    await handleLayerUpdate(layer.id, { zIndex: newZIndex });
  };

  if (!templateId) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 font-semibold text-2xl">
            Nenhum template selecionado
          </h2>
          <p className="text-muted-foreground">
            Selecione um template para começar a editar.
          </p>
        </div>
      </div>
    );
  }

  if (!(template && activePage)) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-primary border-b-2" />
          <p className="text-muted-foreground">Carregando template...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full w-full">
      {/* Painel de Páginas e Layers (esquerda) */}
      <PagesLayersPanel
        activePage={activePage}
        onAddPage={handleAddPage}
        onLayerDelete={handleLayerDelete}
        onLayerReorder={handleLayerReorder}
        onLayerSelect={setSelectedLayer}
        onLayerToggleVisibility={handleLayerToggleVisibility}
        onPageChange={handlePageChange}
        pages={pages}
        selectedLayer={selectedLayer}
      />

      {/* Área principal do canvas */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Header com nome do template */}
        <div className="border-b bg-background p-4">
          <h1 className="font-semibold text-xl">{template.name}</h1>
          <p className="text-muted-foreground text-sm">
            {activePage.name} - {activePage.width}x{activePage.height}px
          </p>
        </div>

        {/* Canvas com zoom controls */}
        <section
          className="canvas-wrapper relative flex-1 overflow-auto bg-neutral-800"
          ref={wrapperRef}
        >
          <canvas ref={canvasRef} />
          <ZoomControls
            onFit={handleFitZoom}
            onReset={handleResetZoom}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            zoom={zoom}
          />
        </section>
      </div>

      {/* Painel direito: Ferramentas e Propriedades */}
      <div className="flex w-80 flex-col border-l bg-muted/30">
        <ScrollArea className="flex-1">
          <div className="space-y-4 p-4">
            {/* Ferramentas */}
            <ToolsToolbar
              onAddImage={handleAddImage}
              onAddText={handleAddText}
              saveStatus={saveStatus}
            />

            {/* Propriedades do layer selecionado */}
            {selectedLayer && (
              <>
                {selectedLayer.type === "text" && (
                  <TextProperties
                    layer={selectedLayer}
                    onUpdate={(updates) =>
                      handleLayerUpdate(selectedLayer.id, updates)
                    }
                  />
                )}
                {selectedLayer.type === "image" && (
                  <ImageProperties
                    layer={selectedLayer}
                    onUpdate={(updates) =>
                      handleLayerUpdate(selectedLayer.id, updates)
                    }
                  />
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
