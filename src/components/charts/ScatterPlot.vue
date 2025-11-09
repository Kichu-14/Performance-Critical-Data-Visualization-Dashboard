<template>
  <div
    class="scatter-plot-container"
    ref="containerRef"
    @wheel="onWheel"
    @mousedown="onMouseDown"
    @mouseup="onMouseUp"
    @mouseleave="onMouseUp"
    @mousemove="onMouseMove"
  >
    <canvas ref="canvasRef" :width="canvasWidth" :height="canvasHeight" />
    <svg class="axes" :width="canvasWidth" :height="canvasHeight" aria-hidden="true">
      <!-- Grid Lines -->
      <g class="grid-lines">
        <line
          v-for="tick in yTicks"
          :key="`y-grid-${tick.value}`"
          :x1="margin.left"
          :y1="tick.pos"
          :x2="canvasWidth - margin.right"
          :y2="tick.pos"
          class="grid-line"
        />
        <line
          v-for="tick in xTicks"
          :key="`x-grid-${tick.value}`"
          :x1="tick.pos"
          :y1="margin.top"
          :x2="tick.pos"
          :y2="canvasHeight - margin.bottom"
          class="grid-line"
        />
      </g>

      <!-- Axes -->
      <line
        :x1="margin.left"
        :y1="canvasHeight - margin.bottom"
        :x2="canvasWidth - margin.right"
        :y2="canvasHeight - margin.bottom"
        class="axis-line"
      />
      <line
        :x1="margin.left"
        :y1="margin.top"
        :x2="margin.left"
        :y2="canvasHeight - margin.bottom"
        class="axis-line"
      />

      <!-- Y Axis Ticks & Labels -->
      <g v-for="tick in yTicks" :key="`y-tick-${tick.value}`" class="y-tick">
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
      <g v-for="tick in xTicks" :key="`x-tick-${tick.value}`" class="x-tick">
        <line
          :x1="tick.pos"
          :y1="canvasHeight - margin.bottom"
          :x2="tick.pos"
          :y2="canvasHeight - margin.bottom + 5"
          class="tick-line"
        />
        <text
          :x="tick.pos"
          :y="canvasHeight - margin.bottom + 15"
          class="tick-text"
          text-anchor="middle"
        >
          {{ formatTime(tick.value) }}
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

    <!-- Tooltip -->
    <div
      v-if="hoveredPoint"
      class="tooltip"
      :style="{
        left: `${tooltipX}px`,
        top: `${tooltipY}px`
      }"
    >
      <div class="tooltip-time">{{ formatTime(hoveredPoint.timestamp) }}</div>
      <div class="tooltip-value">{{ formatValue(hoveredPoint.value) }}</div>
      <div v-if="hoveredPoint.category" class="tooltip-category">
        {{ hoveredPoint.category }}
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, onMounted } from 'vue';
import type { DataPoint } from '../../types/dashboard.types';

interface Props {
  data: DataPoint[];
  pointSize?: number;
  xLabel?: string;
  yLabel?: string;
}

const props = withDefaults(defineProps<Props>(), {
  pointSize: 4,
  xLabel: 'Time',
  yLabel: 'Value',
});

// Constants
const canvasWidth = 800;
const canvasHeight = 400;
const margin = { top: 20, right: 20, bottom: 40, left: 50 };
const categoryColors: { [key: string]: string } = {
  'Alpha': '#FF6B6B',
  'Beta': '#4ECDC4',
  'Gamma': '#45B7D1',
  'Delta': '#96CEB4',
  'Default': '#70ff70'
};

// Refs
const canvasRef = ref<HTMLCanvasElement | null>(null);
const containerRef = ref<HTMLDivElement | null>(null);
const yTicks = ref<Array<{ value: number; pos: number }>>([]);
const xTicks = ref<Array<{ value: number; pos: number }>>([]);

// State
let zoomLevel = 1;
let panX = 0;
let panY = 0;
let isPanning = false;
let startDragX = 0;
let startDragY = 0;
let bounds = {
  minX: 0,
  maxX: 0,
  minY: 0,
  maxY: 0
};

// Hover state
const hoveredPoint = ref<DataPoint | null>(null);
const tooltipX = ref(0);
const tooltipY = ref(0);

// Event handlers
function onWheel(e: WheelEvent) {
  e.preventDefault();
  const zoomIntensity = 0.1;
  const delta = e.deltaY < 0 ? 1 : -1;
  const oldZoom = zoomLevel;
  zoomLevel = Math.min(Math.max(0.5, zoomLevel + delta * zoomIntensity), 5);

  if (oldZoom !== zoomLevel) {
    const rect = canvasRef.value?.getBoundingClientRect();
    if (rect) {
      const mouseX = e.clientX - rect.left - margin.left;
      const mouseY = e.clientY - rect.top - margin.top;
      panX = mouseX - (mouseX - panX) * (zoomLevel / oldZoom);
      panY = mouseY - (mouseY - panY) * (zoomLevel / oldZoom);
    }
    draw();
  }
}

function onMouseDown(e: MouseEvent) {
  isPanning = true;
  startDragX = e.clientX;
  startDragY = e.clientY;
}

function onMouseUp() {
  isPanning = false;
}

function onMouseMove(e: MouseEvent) {
  if (isPanning) {
    const deltaX = e.clientX - startDragX;
    const deltaY = e.clientY - startDragY;
    panX = Math.min(Math.max(panX + deltaX, -canvasWidth * (zoomLevel - 1)), 0);
    panY = Math.min(Math.max(panY + deltaY, -canvasHeight * (zoomLevel - 1)), 0);
    startDragX = e.clientX;
    startDragY = e.clientY;
    draw();
  } else {
    updateHoveredPoint(e);
  }
}

// Utility functions
function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
}

function formatValue(val: number): string {
  return val.toFixed(1);
}

function getX(val: number): number {
  if (bounds.maxX === bounds.minX) return margin.left;
  return margin.left +
    ((val - bounds.minX) / (bounds.maxX - bounds.minX)) *
    (canvasWidth - margin.left - margin.right) * zoomLevel + panX;
}

function getY(val: number): number {
  if (bounds.maxY === bounds.minY) return canvasHeight - margin.bottom;
  return margin.top +
    ((bounds.maxY - val) / (bounds.maxY - bounds.minY)) *
    (canvasHeight - margin.top - margin.bottom) * zoomLevel + panY;
}

// Drawing functions
function calculateBounds() {
  if (!props.data.length) return;

  bounds = {
    minX: Math.min(...props.data.map(p => p.timestamp)),
    maxX: Math.max(...props.data.map(p => p.timestamp)),
    minY: Math.min(...props.data.map(p => p.value)),
    maxY: Math.max(...props.data.map(p => p.value))
  };

  const yPadding = (bounds.maxY - bounds.minY) * 0.1;
  bounds.minY -= yPadding;
  bounds.maxY += yPadding;

  const xPadding = (bounds.maxX - bounds.minX) * 0.05;
  bounds.minX -= xPadding;
  bounds.maxX += xPadding;
}

function updateTicks() {
  const stepsY = 5;
  const stepsX = 5;

  yTicks.value = Array.from({ length: stepsY + 1 }, (_, i) => {
    const value = bounds.minY + ((bounds.maxY - bounds.minY) / stepsY) * i;
    return {
      value: Number(value.toFixed(1)),
      pos: getY(value)
    };
  });

  xTicks.value = Array.from({ length: stepsX + 1 }, (_, i) => {
    const value = bounds.minX + ((bounds.maxX - bounds.minX) / stepsX) * i;
    return {
      value: Math.floor(value),
      pos: getX(value)
    };
  });
}

function updateHoveredPoint(e: MouseEvent) {
  const rect = canvasRef.value?.getBoundingClientRect();
  if (!rect) return;

  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  const threshold = props.pointSize * 2;

  let closestPoint: DataPoint | null = null;
  let minDistance = Infinity;

  for (const point of props.data) {
    const x = getX(point.timestamp);
    const y = getY(point.value);
    const distance = Math.sqrt(Math.pow(mouseX - x, 2) + Math.pow(mouseY - y, 2));

    if (distance < threshold && distance < minDistance) {
      minDistance = distance;
      closestPoint = point;
      tooltipX.value = x;
      tooltipY.value = y - 20;
    }
  }
  hoveredPoint.value = closestPoint;
}

function draw() {
  const canvas = canvasRef.value;
  const ctx = canvas?.getContext('2d');
  if (!canvas || !ctx || !props.data.length) return;

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  calculateBounds();
  updateTicks();

  props.data.forEach(point => {
    const x = getX(point.timestamp);
    const y = getY(point.value);
    const color = categoryColors[point.category] || categoryColors['Default'];

    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.arc(x, y, props.pointSize, 0, 2 * Math.PI);
    ctx.fill();
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
.scatter-plot-container {
  position: relative;
  user-select: none;
  touch-action: none;
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

.grid-line {
  stroke: rgba(255, 255, 255, 0.1);
  stroke-width: 1;
}

.axis-line, .tick-line {
  stroke: rgba(255, 255, 255, 0.3);
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

.tooltip {
  position: absolute;
  transform: translate(-50%, -100%);
  background: rgba(10, 20, 30, 0.9);
  border: 1px solid rgba(112, 255, 112, 0.3);
  border-radius: 4px;
  padding: 8px 12px;
  pointer-events: none;
  font-size: 12px;
  white-space: nowrap;
  z-index: 1000;
}

.tooltip-time {
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 2px;
}

.tooltip-value {
  color: #70ff70;
  font-weight: 500;
}

.tooltip-category {
  color: rgba(112, 255, 112, 0.7);
  font-size: 10px;
  margin-top: 2px;
}
</style>