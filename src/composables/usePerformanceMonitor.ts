import { ref, onMounted, onUnmounted, computed } from 'vue';
import type { PerformanceMetrics } from '../types/dashboard.types';

export function usePerformanceMonitor() {
  const metrics = ref<PerformanceMetrics>({
    fps: 0,
    memory: {
      usedJSHeapSize: 0,
      totalJSHeapSize: 0,
      jsHeapSizeLimit: 0
    },
    lastUpdateTime: performance.now()
  });

  let frameCount = 0;
  let lastFpsUpdate = performance.now();
  let animationFrameId: number;

  // Update FPS counter
  const updateFps = () => {
    const now = performance.now();
    frameCount++;

    if (now - lastFpsUpdate >= 1000) {
      metrics.value.fps = frameCount;
      frameCount = 0;
      lastFpsUpdate = now;
    }
  };

  // Update memory stats if available
  const updateMemory = () => {
    if (performance && (performance as any).memory) {
      const memory = (performance as any).memory;
      metrics.value.memory = {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit
      };
    }
  };

  // Format memory values for display
  const formattedMemory = computed(() => {
    const { usedJSHeapSize, totalJSHeapSize, jsHeapSizeLimit } = metrics.value.memory;
    return {
      used: (usedJSHeapSize / 1024 / 1024).toFixed(1),
      total: (totalJSHeapSize / 1024 / 1024).toFixed(1),
      limit: (jsHeapSizeLimit / 1024 / 1024).toFixed(1)
    };
  });

  // Animation frame loop
  const update = () => {
    updateFps();
    updateMemory();
    metrics.value.lastUpdateTime = performance.now();
    animationFrameId = requestAnimationFrame(update);
  };

  // Start monitoring
  const startMonitoring = () => {
    frameCount = 0;
    lastFpsUpdate = performance.now();
    animationFrameId = requestAnimationFrame(update);
  };

  // Stop monitoring
  const stopMonitoring = () => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
  };

  // Lifecycle hooks
  onMounted(() => {
    startMonitoring();
  });

  onUnmounted(() => {
    stopMonitoring();
  });

  return {
    metrics,
    formattedMemory
  };
}