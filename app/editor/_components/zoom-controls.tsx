"use client";

import { Maximize, Maximize2, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 3;
const PERCENTAGE_MULTIPLIER = 100;

type ZoomControlsProps = {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onFit: () => void;
};

export default function ZoomControls({
  zoom,
  onZoomIn,
  onZoomOut,
  onReset,
  onFit,
}: ZoomControlsProps) {
  return (
    <div className="absolute top-4 right-4 z-10 flex items-center gap-2 rounded-lg border bg-background p-2 shadow-lg">
      <Button
        disabled={zoom <= MIN_ZOOM}
        onClick={onZoomOut}
        size="icon"
        title="Zoom out (-)"
        type="button"
        variant="ghost"
      >
        <ZoomOut className="h-4 w-4" />
      </Button>
      <span className="min-w-[60px] text-center font-medium text-sm">
        {Math.round(zoom * PERCENTAGE_MULTIPLIER)}%
      </span>
      <Button
        disabled={zoom >= MAX_ZOOM}
        onClick={onZoomIn}
        size="icon"
        title="Zoom in (+)"
        type="button"
        variant="ghost"
      >
        <ZoomIn className="h-4 w-4" />
      </Button>
      <Button
        onClick={onReset}
        size="icon"
        title="Resetar zoom (100%)"
        type="button"
        variant="ghost"
      >
        <Maximize2 className="h-4 w-4" />
      </Button>
      <div className="h-4 w-px bg-border" />
      <Button
        onClick={onFit}
        size="icon"
        title="Ajustar ao espaço disponível (Fit)"
        type="button"
        variant="ghost"
      >
        <Maximize className="h-4 w-4" />
      </Button>
    </div>
  );
}
