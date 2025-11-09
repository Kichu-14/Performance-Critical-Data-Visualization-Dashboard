import { ref, computed } from 'vue';
import type { ViewportConfig } from '../types/dashboard.types';

interface UseViewportOptions {
  initialConfig: ViewportConfig;
  minZoom?: number;
  maxZoom?: number;
}

export function useViewport(options: UseViewportOptions) {
  const {
    initialConfig,
    minZoom = 0.1,
    maxZoom = 10
  } = options;

  const viewport = ref<ViewportConfig>({ ...initialConfig });
  const zoomLevel = ref(1);
  const isDragging = ref(false);
  const dragStart = ref({ x: 0, y: 0 });

  // Calculate the viewport range
  const range = computed(() => ({
    x: viewport.value.xMax - viewport.value.xMin,
    y: viewport.value.yMax - viewport.value.yMin
  }));

  // Update viewport with zoom
  const zoom = (factor: number, centerX: number, centerY: number) => {
    const newZoom = Math.max(minZoom, Math.min(maxZoom, zoomLevel.value * factor));
    const zoomFactor = newZoom / zoomLevel.value;
    zoomLevel.value = newZoom;

    // Calculate new viewport bounds maintaining the zoom center
    const dx = (centerX - viewport.value.xMin) * (1 - zoomFactor);
    const dy = (centerY - viewport.value.yMin) * (1 - zoomFactor);

    viewport.value = {
      ...viewport.value,
      xMin: viewport.value.xMin + dx,
      xMax: viewport.value.xMax - dx,
      yMin: viewport.value.yMin + dy,
      yMax: viewport.value.yMax - dy
    };
  };

  // Start dragging
  const startDrag = (x: number, y: number) => {
    isDragging.value = true;
    dragStart.value = { x, y };
  };

  // Update viewport during drag
  const drag = (x: number, y: number) => {
    if (!isDragging.value) return;

    const dx = (x - dragStart.value.x) * range.value.x;
    const dy = (y - dragStart.value.y) * range.value.y;

    viewport.value = {
      ...viewport.value,
      xMin: viewport.value.xMin - dx,
      xMax: viewport.value.xMax - dx,
      yMin: viewport.value.yMin - dy,
      yMax: viewport.value.yMax - dy
    };

    dragStart.value = { x, y };
  };

  // End dragging
  const endDrag = () => {
    isDragging.value = false;
  };

  // Reset viewport to initial state
  const reset = () => {
    viewport.value = { ...initialConfig };
    zoomLevel.value = 1;
  };

  return {
    viewport,
    zoomLevel,
    isDragging,
    zoom,
    startDrag,
    drag,
    endDrag,
    reset
  };
}