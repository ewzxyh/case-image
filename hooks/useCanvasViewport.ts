import { useCallback, useEffect, useRef } from "react";
import type { Canvas } from "fabric";
import {
  DEBOUNCE_SCALE_TO_ZOOM_MS,
  DRAG_VISIBLE_RATIO,
  PINCH_SCALE_SMOOTHING,
  THROTTLE_MS,
  ZOOM_MAX,
  ZOOM_MIN,
  ZOOM_WHEEL_FACTOR,
} from "@/lib/canvas/constants";

type TransformValues = {
  scaleX: number;
  scaleY: number;
  translateX: number;
  translateY: number;
  width: number;
  height: number;
};

type UseCanvasViewportParams = {
  canvas: Canvas | null;
  wrapperEl: HTMLElement | null;
  initialDimensions?: { width: number; height: number };
  limits?: {
    zoomMin?: number;
    zoomMax?: number;
    dragVisibleRatio?: number;
  };
  onZoomChange?: (zoom: number) => void;
};

/**
 * Obter valores de transform do elemento
 */
function getTransformVals(element: HTMLElement): TransformValues {
  const style = window.getComputedStyle(element);
  const matrix = new DOMMatrixReadOnly(style.transform);
  return {
    scaleX: matrix.m11,
    scaleY: matrix.m22,
    translateX: matrix.m41,
    translateY: matrix.m42,
    width: element.getBoundingClientRect().width,
    height: element.getBoundingClientRect().height,
  };
}

/**
 * Throttle: limita execução a uma vez por intervalo
 */
function throttle<T extends (...args: unknown[]) => void>(
  fn: T,
  wait: number
): (...args: Parameters<T>) => void {
  let lastTime = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastTime >= wait) {
      lastTime = now;
      fn(...args);
    }
  };
}

/**
 * Debounce: executa função após período de inatividade
 */
function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
    }, wait);
  };
}

/**
 * Hook para gerenciar viewport do canvas com CSS transform
 */
export function useCanvasViewport({
  canvas,
  wrapperEl,
  initialDimensions,
  limits = {},
  onZoomChange,
}: UseCanvasViewportParams) {
  const { zoomMin = ZOOM_MIN, zoomMax = ZOOM_MAX, dragVisibleRatio = DRAG_VISIBLE_RATIO } = limits;

  // Estado interno
  const lastPosRef = useRef({ x: 0, y: 0 });
  const touchZoomRef = useRef(1);
  const pinchCenterRef = useRef({ x: 0, y: 0 });
  const initialDistanceRef = useRef(0);

  /**
   * Limitar offset de arrasto
   */
  const capCanvasOffset = useCallback(
    (offset: number, containerDimension: number, wrapperDimension: number): number => {
      const maxPositiveOffset = wrapperDimension * dragVisibleRatio;
      const cappedOffset = Math.max(offset, (containerDimension - maxPositiveOffset) * -1);
      return Math.min(cappedOffset, maxPositiveOffset);
    },
    [dragVisibleRatio]
  );

  /**
   * Traduz o canvas usando CSS transform
   */
  const translateCanvas = useCallback(
    (event: MouseEvent | Touch) => {
      if (!(canvas?.wrapperEl && wrapperEl)) {
        return;
      }

      const transform = getTransformVals(canvas.wrapperEl);
      const offsetX = transform.translateX + (event.clientX - (lastPosRef.current.x || 0));
      const offsetY = transform.translateY + (event.clientY - (lastPosRef.current.y || 0));

      const viewBox = wrapperEl.getBoundingClientRect();
      const offsetXCapped = capCanvasOffset(offsetX, transform.width, viewBox.width);
      const offsetYCapped = capCanvasOffset(offsetY, transform.height, viewBox.height);

      canvas.wrapperEl.style.setProperty("--tOriginX", "0px");
      canvas.wrapperEl.style.setProperty("--tOriginY", "0px");
      canvas.wrapperEl.style.transform = `translate(${offsetXCapped}px, ${offsetYCapped}px) scale(${transform.scaleX})`;

      lastPosRef.current = { x: event.clientX, y: event.clientY };
    },
    [canvas, wrapperEl, capCanvasOffset]
  );

  /**
   * Escala o canvas usando CSS transform
   */
  const scaleCanvas = useCallback(
    (zoom: number, aroundPoint: { x: number; y: number }) => {
      if (!canvas?.wrapperEl) {
        return;
      }

      let clampedZoom = Math.min(zoom, zoomMax);
      clampedZoom = Math.max(clampedZoom, zoomMin);

      if (clampedZoom === touchZoomRef.current) {
        return;
      }

      const tVals = getTransformVals(canvas.wrapperEl);
      const scaleFactor = (tVals.scaleX / touchZoomRef.current) * clampedZoom;

      canvas.wrapperEl.style.setProperty("--tOriginX", `${aroundPoint.x}px`);
      canvas.wrapperEl.style.setProperty("--tOriginY", `${aroundPoint.y}px`);
      canvas.wrapperEl.style.transform = `translate(${tVals.translateX}px, ${tVals.translateY}px) scale(${scaleFactor})`;

      touchZoomRef.current = clampedZoom;
    },
    [canvas, zoomMax, zoomMin]
  );

  /**
   * Converte CSS scale para Fabric zoom
   */
  const canvasScaleToZoom = useCallback(() => {
    if (!(canvas?.wrapperEl && wrapperEl && initialDimensions)) {
      return;
    }

    const transform = getTransformVals(canvas.wrapperEl);
    const canvasBox = canvas.wrapperEl.getBoundingClientRect();
    const viewBox = wrapperEl.getBoundingClientRect();

    const offsetX = canvasBox.x - viewBox.x;
    const offsetY = canvasBox.y - viewBox.y;

    // Redimensionar canvas para valores escalados
    canvas.setDimensions({ height: transform.height, width: transform.width });
    canvas.setZoom(touchZoomRef.current);

    // Resetar transform
    canvas.wrapperEl.style.setProperty("--tOriginX", "0px");
    canvas.wrapperEl.style.setProperty("--tOriginY", "0px");
    canvas.wrapperEl.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(1)`;

    canvas.renderAll();

    if (onZoomChange) {
      onZoomChange(touchZoomRef.current);
    }
  }, [canvas, wrapperEl, initialDimensions, onZoomChange]);

  /**
   * Resetar canvas para estado inicial
   */
  const resetCanvas = useCallback(() => {
    if (!(canvas?.wrapperEl && initialDimensions)) {
      return;
    }

    canvas.wrapperEl.style.transform = "";
    canvas.wrapperEl.style.setProperty("--tOriginX", "0px");
    canvas.wrapperEl.style.setProperty("--tOriginY", "0px");

    canvas.setDimensions(initialDimensions);
    canvas.viewportTransform = [1, 0, 0, 1, 0, 0];
    canvas.setViewportTransform(canvas.viewportTransform);

    touchZoomRef.current = 1;

    if (onZoomChange) {
      onZoomChange(1);
    }

    canvas.renderAll();
  }, [canvas, initialDimensions, onZoomChange]);

  /**
   * Zoom imediato para um valor específico (com conversão imediata para Fabric)
   */
  const zoomTo = useCallback(
    (nextZoom: number, aroundPoint: { x: number; y: number }) => {
      if (!canvas?.wrapperEl) {
        return;
      }

      // Aplicar scale CSS
      scaleCanvas(nextZoom, aroundPoint);

      // Converter imediatamente para Fabric zoom (sem esperar debounce)
      canvasScaleToZoom();
    },
    [canvas, scaleCanvas, canvasScaleToZoom]
  );

  /**
   * Ajustar canvas ao wrapper (fit)
   */
  const fitToWrapper = useCallback(() => {
    if (!(canvas?.wrapperEl && wrapperEl && initialDimensions)) {
      return;
    }

    const TWO_MARGINS = 2;
    const FIT_MARGIN_PX = 24;
    const cw = wrapperEl.clientWidth - FIT_MARGIN_PX * TWO_MARGINS;
    const ch = wrapperEl.clientHeight - FIT_MARGIN_PX * TWO_MARGINS;
    const scaleX = cw / initialDimensions.width;
    const scaleY = ch / initialDimensions.height;
    const fitZoom = Math.min(scaleX, scaleY);

    const centerX = wrapperEl.clientWidth / 2;
    const centerY = wrapperEl.clientHeight / 2;

    zoomTo(fitZoom, { x: centerX, y: centerY });
  }, [canvas, wrapperEl, initialDimensions, zoomTo]);

  // Throttled e debounced versions
  // biome-ignore lint/suspicious/noExplicitAny: Necessário para contornar limitações de tipagem do throttle do lodash
  const throttledTranslateCanvas = useCallback(
    // @ts-ignore - Lodash throttle tem limitações de tipagem com tipos específicos
    throttle((event: MouseEvent | Touch) => translateCanvas(event), THROTTLE_MS) as any as (event: MouseEvent | Touch) => void,
    [translateCanvas]
  );

  // biome-ignore lint/suspicious/noExplicitAny: Necessário para contornar limitações de tipagem do throttle do lodash
  const throttledScaleCanvas = useCallback(
    // @ts-ignore - Lodash throttle tem limitações de tipagem com tipos específicos
    throttle((zoom: number, aroundPoint: { x: number; y: number }) => scaleCanvas(zoom, aroundPoint), THROTTLE_MS) as any as (zoom: number, aroundPoint: { x: number; y: number }) => void,
    [scaleCanvas]
  );

  const debouncedScaleToZoom = useCallback(
    debounce(canvasScaleToZoom, DEBOUNCE_SCALE_TO_ZOOM_MS),
    [canvasScaleToZoom]
  );

  /**
   * Handlers de mouse
   */
  const handleMouseDown = useCallback((event: { e: MouseEvent | TouchEvent }) => {
    const evt = event.e;
    if (evt instanceof MouseEvent) {
      lastPosRef.current = { x: evt.clientX, y: evt.clientY };
    }
  }, []);

  const handleMouseMove = useCallback(
    (event: { e: MouseEvent | TouchEvent }) => {
      const evt = event.e;
      const LEFT_BUTTON = 1;
      
      if (!(evt instanceof MouseEvent)) {
        return;
      }
      if (evt.buttons !== LEFT_BUTTON) {
        return;
      }
      throttledTranslateCanvas(evt);
    },
    [throttledTranslateCanvas]
  );

  const handleMouseWheel = useCallback(
    (event: { e: WheelEvent }) => {
      const evt = event.e;
      evt.preventDefault();
      evt.stopPropagation();

      const delta = evt.deltaY;
      let zoom = touchZoomRef.current;
      zoom *= ZOOM_WHEEL_FACTOR ** delta;

      const point = { x: evt.offsetX, y: evt.offsetY };
      throttledScaleCanvas(zoom, point);
      debouncedScaleToZoom();
    },
    [throttledScaleCanvas, debouncedScaleToZoom]
  );

  /**
   * Helpers de touch
   */
  const getPinchCoordinates = (touch1: Touch, touch2: Touch) => ({
    x1: touch1.clientX,
    y1: touch1.clientY,
    x2: touch2.clientX,
    y2: touch2.clientY,
  });

  const getPinchDistance = (touch1: Touch, touch2: Touch): number => {
    const coord = getPinchCoordinates(touch1, touch2);
    return Math.sqrt((coord.x2 - coord.x1) ** 2 + (coord.y2 - coord.y1) ** 2);
  };

  const setPinchCenter = useCallback(
    (touch1: Touch, touch2: Touch) => {
      if (!canvas?.wrapperEl) {
        return;
      }

      const coord = getPinchCoordinates(touch1, touch2);
      const currentX = (coord.x1 + coord.x2) / 2;
      const currentY = (coord.y1 + coord.y2) / 2;

      const transform = getTransformVals(canvas.wrapperEl);

      pinchCenterRef.current = {
        x: currentX - transform.translateX,
        y: currentY - transform.translateY,
      };
    },
    [canvas]
  );

  /**
   * Handlers de touch
   */
  const handleTouchStart = useCallback(
    (event: TouchEvent) => {
      if (event.touches.length === 1) {
        lastPosRef.current = {
          x: event.touches[0].clientX,
          y: event.touches[0].clientY,
        };
      } else if (event.touches.length === 2) {
        initialDistanceRef.current = getPinchDistance(event.touches[0], event.touches[1]);
      }
    },
    [getPinchDistance]
  );

  const handleTouchMove = useCallback(
    (event: TouchEvent) => {
      event.preventDefault();

      if (event.touches.length === 1) {
        throttledTranslateCanvas(event.touches[0]);
      } else if (event.touches.length === 2) {
        setPinchCenter(event.touches[0], event.touches[1]);

        const currentDistance = getPinchDistance(event.touches[0], event.touches[1]);
        let scale = Number((currentDistance / initialDistanceRef.current).toFixed(2));
        scale = 1 + (scale - 1) / PINCH_SCALE_SMOOTHING;

        throttledScaleCanvas(scale * touchZoomRef.current, pinchCenterRef.current);
      }
    },
    [throttledTranslateCanvas, throttledScaleCanvas, setPinchCenter, getPinchDistance]
  );

  const handleTouchEnd = useCallback(
    (event: TouchEvent) => {
      if (event.touches.length < 2) {
        debouncedScaleToZoom();
      }
    },
    [debouncedScaleToZoom]
  );

  /**
   * Registrar event listeners
   */
  useEffect(() => {
    if (!(canvas && wrapperEl)) {
      return;
    }

    // Fabric events
    canvas.on("mouse:down", handleMouseDown);
    canvas.on("mouse:move", handleMouseMove);
    canvas.on("mouse:wheel", handleMouseWheel);

    // Touch events no wrapper
    wrapperEl.addEventListener("touchstart", handleTouchStart, { passive: false });
    wrapperEl.addEventListener("touchmove", handleTouchMove, { passive: false });
    wrapperEl.addEventListener("touchend", handleTouchEnd, { passive: false });

    return () => {
      canvas.off("mouse:down", handleMouseDown);
      canvas.off("mouse:move", handleMouseMove);
      canvas.off("mouse:wheel", handleMouseWheel);

      wrapperEl.removeEventListener("touchstart", handleTouchStart);
      wrapperEl.removeEventListener("touchmove", handleTouchMove);
      wrapperEl.removeEventListener("touchend", handleTouchEnd);
    };
  }, [
    canvas,
    wrapperEl,
    handleMouseDown,
    handleMouseMove,
    handleMouseWheel,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  ]);

  return {
    translateCanvas,
    scaleCanvas,
    resetCanvas,
    zoomTo,
    fitToWrapper,
    currentZoom: touchZoomRef.current,
  };
}

