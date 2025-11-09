<template>
  <div class="bar-chart-container" ref="containerRef">
    <canvas ref="canvasRef" :width="canvasWidth" :height="canvasHeight" />
    <svg class="axes" :width="canvasWidth" :height="canvasHeight" aria-hidden="true">
      <!-- X Axis -->
      <line
        :x1="margin.left"
        :y1="canvasHeight - margin.bottom"
        :x2="canvasWidth - margin.right"
        :y2="canvasHeight - margin.bottom"
        class="axis-line"
      />
      <!-- Y Axis -->
      <line
        :x1="margin.left"
        :y1="margin.top"
        :x2="margin.left"
        :y2="canvasHeight - margin.bottom"
        class="axis-line"
      />
      <!-- Y Axis Ticks & Labels -->
      <g v-for="tick in yTicks" :key="tick.value" class="y-tick">
        <line
          :x1="margin.left - 5"
          :y1="tick.pos"
          :x2="margin.left"
          :y2="tick.pos"
          class="tick-line"
        />
        <text
          :x="margin.left - 10"
          :y="tick.pos + 4"
          class="tick-text"
          text-anchor="end"
        >
          {{ formatValue(tick.value) }}
        </text>
      </g>
      <!-- X Axis Ticks & Labels -->
      <g v-for="(category, index) in categories" :key="category" class="x-tick">
        <text
          :x="getX(index) + barWidth / 2"
          :y="canvasHeight - margin.bottom + 15"
          class="tick-text"
          text-anchor="middle"
        >
          {{ category }}
        </text>
      </g>
      <!-- X Axis Label -->
      <text
        :x="(canvasWidth - margin.left - margin.right) / 2 + margin.left"
        :y="canvasHeight - margin.bottom + 35"
        class="axis-label"
        text-anchor="middle"
      >
        {{ xLabel }}
      </text>
      <!-- Y Axis Label -->
      <text
        class="axis-label"
        :transform="`translate(${margin.left - 35}, ${(canvasHeight - margin.top - margin.bottom) / 2 + margin.top}) rotate(-90)`"
        text-anchor="middle"
      >
        {{ yLabel }}
      </text>
    </svg>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, onMounted, computed } from 'vue';
import type { DataPoint } from '../../types/dashboard.types';
import { createGradient } from '../../utils/colorUtils';

interface Props {
  data: DataPoint[];
  xLabel?: string;
  yLabel?: string;
}

const props = withDefaults(defineProps<Props>(), {
  xLabel: 'Category',
  yLabel: 'Average Value',
});

// Constants
const canvasWidth = 800;
const canvasHeight = 400;
const margin = { top: 20, right: 20, bottom: 40, left: 50 };

// Refs
const canvasRef = ref<HTMLCanvasElement | null>(null);
const containerRef = ref<HTMLDivElement | null>(null);
const yTicks = ref<Array<{ value: number; pos: number }>>([]);

// State
let bounds = {
  minY: 0,
  maxY: 0,
};

const processedData = computed(() => {
  const categoryMap = new Map<string, { sum: number; count: number }>();
  props.data.forEach(d => {
    if (!categoryMap.has(d.category)) {
      categoryMap.set(d.category, { sum: 0, count: 0 });
    }
    const entry = categoryMap.get(d.category)!;
    entry.sum += d.value;
    entry.count++;
  });

  return Array.from(categoryMap.entries()).map(([category, { sum, count }]) => ({
    category,
    value: sum / count,
  }));
});

const categories = computed(() => processedData.value.map(d => d.category));

const barWidth = computed(() => {
  const availableWidth = canvasWidth - margin.left - margin.right;
  return (availableWidth / categories.value.length) * 0.7;
});

// Utility functions
function formatValue(val: number): string {
  return val.toFixed(1);
}

function getX(index: number): number {
  const availableWidth = canvasWidth - margin.left - margin.right;
  const bandWidth = availableWidth / categories.value.length;
  return margin.left + index * bandWidth + (bandWidth - barWidth.value) / 2;
}

function getY(val: number): number {
  if (bounds.maxY === bounds.minY) return canvasHeight - margin.bottom;
  return margin.top +
    ((bounds.maxY - val) / (bounds.maxY - bounds.minY)) *
    (canvasHeight - margin.top - margin.bottom);
}

// Drawing functions
function calculateBounds() {
  if (!processedData.value.length) return;

  bounds = {
    minY: 0,
    maxY: Math.max(...processedData.value.map(p => p.value)),
  };

  // Add padding to Y axis
  const yPadding = (bounds.maxY - bounds.minY) * 0.1;
  bounds.maxY += yPadding;
}

function updateTicks() {
  const stepsY = 5;
  yTicks.value = Array.from({ length: stepsY + 1 }, (_, i) => {
    const value = bounds.minY + ((bounds.maxY - bounds.minY) / stepsY) * i;
    return {
      value: Number(value.toFixed(1)),
      pos: getY(value),
    };
  });
}

function draw() {
  const canvas = canvasRef.value;
  const ctx = canvas?.getContext('2d');
  if (!canvas || !ctx || !processedData.value.length) return;

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  calculateBounds();
  updateTicks();

  const categoryColors = {
    'Alpha': '#FF6B6B',
    'Beta': '#4ECDC4',
    'Gamma': '#45B7D1',
    'Delta': '#96CEB4'
  };

  processedData.value.forEach((d, i) => {
    const x = getX(i);
    const y = getY(d.value);
    const height = canvasHeight - margin.bottom - y;
    const color = categoryColors[d.category as keyof typeof categoryColors] || '#6a93ff';

    const gradient = createGradient(ctx, color, color, 0.8, 0.4);
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, barWidth.value, height);
  });
}

watch(() => props.data, () => {
  draw();
}, { deep: true });

onMounted(() => {
  draw();
  const observer = new ResizeObserver(() => {
    draw();
  });
  if (containerRef.value) {
    observer.observe(containerRef.value);
  }
});
</script>

<style scoped>
.bar-chart-container {
  position: relative;
  width: 100%;
  height: 100%;
}

canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.axes {
  pointer-events: none;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.axis-line, .tick-line {
  stroke: rgba(255, 255, 255, 0.2);
  stroke-width: 1;
}

.tick-text {
  fill: rgba(255, 255, 255, 0.6);
  font-size: 10px;
}

.axis-label {
  fill: rgba(255, 255, 255, 0.8);
  font-size: 12px;
  font-weight: 500;
}
</style>