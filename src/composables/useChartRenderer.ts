import { ref, onMounted, onUnmounted } from 'vue';
import type { ChartDimensions } from '../types/dashboard.types';
import { calculateChartDimensions } from '../utils/mathUtils';

interface UseChartRendererOptions {
  canvasId: string;
  width?: number;
  height?: number;
}

export function useChartRenderer(options: UseChartRendererOptions) {
  const {
    canvasId,
    width = 800,
    height = 400
  } = options;

  const canvas = ref<HTMLCanvasElement | null>(null);
  const ctx = ref<CanvasRenderingContext2D | null>(null);
  const dimensions = ref<ChartDimensions | null>(null);
  let animationFrameId: number;
  
  // Initialize canvas and context
  const initializeCanvas = () => {
    canvas.value = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas.value) return;

    // Set up canvas dimensions with device pixel ratio
    const dpr = window.devicePixelRatio || 1;
    canvas.value.width = width * dpr;
    canvas.value.height = height * dpr;
    canvas.value.style.width = `${width}px`;
    canvas.value.style.height = `${height}px`;

    // Get context and scale for device pixel ratio
    ctx.value = canvas.value.getContext('2d');
    if (ctx.value) {
      ctx.value.scale(dpr, dpr);
    }
  };

  // Clear the canvas
  const clear = () => {
    if (!ctx.value || !canvas.value) return;
    ctx.value.clearRect(0, 0, canvas.value.width, canvas.value.height);
  };

  // Set up animation loop
  const startAnimation = (renderFrame: () => void) => {
    const animate = () => {
      renderFrame();
      animationFrameId = requestAnimationFrame(animate);
    };
    animationFrameId = requestAnimationFrame(animate);
  };

  // Stop animation
  const stopAnimation = () => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
  };

  // Update dimensions when viewport changes
  const updateDimensions = (viewport: any) => {
    if (!canvas.value) return;
    dimensions.value = calculateChartDimensions(
      canvas.value.width,
      canvas.value.height,
      viewport
    );
  };

  // Draw axis and grid
  const drawGrid = (xTicks: number[], yTicks: number[]) => {
    if (!ctx.value || !dimensions.value) return;

    ctx.value.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.value.lineWidth = 1;

    // Draw vertical grid lines
    xTicks.forEach(x => {
      const pixelX = dimensions.value!.xScale(x);
      ctx.value!.beginPath();
      ctx.value!.moveTo(pixelX, 0);
      ctx.value!.lineTo(pixelX, dimensions.value!.height);
      ctx.value!.stroke();
    });

    // Draw horizontal grid lines
    yTicks.forEach(y => {
      const pixelY = dimensions.value!.yScale(y);
      ctx.value!.beginPath();
      ctx.value!.moveTo(0, pixelY);
      ctx.value!.lineTo(dimensions.value!.width, pixelY);
      ctx.value!.stroke();
    });
  };

  // Lifecycle hooks
  onMounted(() => {
    initializeCanvas();
  });

  onUnmounted(() => {
    stopAnimation();
  });

  return {
    canvas,
    ctx,
    dimensions,
    clear,
    startAnimation,
    stopAnimation,
    updateDimensions,
    drawGrid
  };
}