<template>
  <div
    class="heatmap-container"
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

      <!-- Ticks and Labels -->
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
      v-if="hoveredBin"
      class="tooltip"
      :style="{
        left: `${tooltipX}px`,
        top: `${tooltipY}px`
      }"
    >
      <div class="tooltip-time">{{ formatTime(hoveredBin.timestamp) }}</div>
      <div class="tooltip-value">{{ formatValue(hoveredBin.value) }}</div>
      <div class="tooltip-count">Count: {{ hoveredBin.count }}</div>
    </div>

    <!-- Color Scale Legend -->
    <div class="color-scale">
      <div class="color-gradient" :style="{ background: `linear-gradient(to right, ${colorLow}, ${colorHigh})` }"></div>
      <div class="scale-labels">
        <span>Low</span>
        <span>High</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, onMounted, computed } from 'vue';
import type { DataPoint } from '../../types/dashboard.types';
import { interpolateColor } from '../../utils/colorUtils';

interface Props {
  data: DataPoint[];
  colorLow?: string;
  colorHigh?: string;
  binCountX?: number;
  binCountY?: number;
  xLabel?: string;
  yLabel?: string;
}

const props = withDefaults(defineProps<Props>(), {
  colorLow: '#2b1700',
  colorHigh: '#ffa500',
  binCountX: 50,
  binCountY: 30,
  xLabel: 'Time',
  yLabel: 'Value',
});

// Constants
const canvasWidth = 800;
const canvasHeight = 400;
const margin = { top: 20, right: 20, bottom: 40, left: 50 };

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

// Bins state
type Bin = { count: number; timestamp: number; value: number };
const bins = ref<Bin[][]>([]);
const maxCount = ref(0);

// Hover state
const hoveredBin = ref<Bin | null>(null);
const tooltipX = ref(0);
const tooltipY = ref(0);

// Computed
const binWidth = computed(() =>
  (canvasWidth - margin.left - margin.right) / props.binCountX
);

const binHeight = computed(() =>
  (canvasHeight - margin.top - margin.bottom) / props.binCountY
);

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
    updateHoveredBin(e);
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

function getColor(intensity: number): string {
  return interpolateColor(props.colorLow, props.colorHigh, intensity);
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
}

function updateBins() {
  bins.value = Array(props.binCountX).fill(null).map(() =>
    Array(props.binCountY).fill(null).map(() => ({
      count: 0,
      timestamp: 0,
      value: 0
    }))
  );

  for (const pt of props.data) {
    const xIdx = Math.floor(
      ((pt.timestamp - bounds.minX) / (bounds.maxX - bounds.minX)) *
      props.binCountX
    );
    const yIdx = Math.floor(
      ((pt.value - bounds.minY) / (bounds.maxY - bounds.minY)) *
      props.binCountY
    );

    if (xIdx >= 0 && xIdx < props.binCountX && yIdx >= 0 && yIdx < props.binCountY) {
      bins.value[xIdx][yIdx].count++;
      bins.value[xIdx][yIdx].timestamp = pt.timestamp;
      bins.value[xIdx][yIdx].value = pt.value;
    }
  }

  maxCount.value = Math.max(1, ...bins.value.flat().map(bin => bin.count));
}

function updateHoveredBin(e: MouseEvent) {
  const rect = canvasRef.value?.getBoundingClientRect();
  if (!rect) return;

  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  const binX = Math.floor((mouseX - margin.left) / (binWidth.value * zoomLevel));
  const binY = Math.floor((mouseY - margin.top) / (binHeight.value * zoomLevel));

  if (
    binX >= 0 &&
    binX < props.binCountX &&
    binY >= 0 &&
    binY < props.binCountY &&
    bins.value[binX] &&
    bins.value[binX][binY] &&
    bins.value[binX][binY].count > 0
  ) {
    hoveredBin.value = bins.value[binX][binY];
    tooltipX.value = mouseX;
    tooltipY.value = mouseY - 20;
  } else {
    hoveredBin.value = null;
  }
}

function draw() {
  const canvas = canvasRef.value;
  const ctx = canvas?.getContext('2d');
  if (!canvas || !ctx || !props.data.length) return;

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  calculateBounds();
  updateBins();

  for (let i = 0; i < props.binCountX; i++) {
    for (let j = 0; j < props.binCountY; j++) {
      const bin = bins.value[i][j];
      if (bin.count === 0) continue;

      const intensity = bin.count / maxCount.value;
      const x = margin.left + i * binWidth.value;
      const y = margin.top + (props.binCountY - 1 - j) * binHeight.value;

      ctx.fillStyle = getColor(intensity);
      ctx.fillRect(
        x * zoomLevel + panX,
        y * zoomLevel + panY,
        binWidth.value * zoomLevel,
        binHeight.value * zoomLevel
      );
    }
  }
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
.heatmap-container {
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
  stroke: rgba(255, 165, 0, 0.1);
  stroke-width: 1;
}

.axis-line, .tick-line {
  stroke: rgba(255, 165, 0, 0.3);
  stroke-width: 1;
}

.tick-text {
  fill: rgba(255, 165, 0, 0.6);
  font-size: 10px;
}

.axis-label {
  fill: rgba(255, 165, 0, 0.8);
  font-size: 12px;
  font-weight: 500;
}

.tooltip {
  position: absolute;
  transform: translate(-50%, -100%);
  background: rgba(43, 23, 0, 0.9);
  border: 1px solid rgba(255, 165, 0, 0.3);
  border-radius: 4px;
  padding: 8px 12px;
  pointer-events: none;
  font-size: 12px;
  white-space: nowrap;
  z-index: 1000;
}

.tooltip-time, .tooltip-value, .tooltip-count {
  color: rgba(255, 255, 255, 0.9);
}

.color-scale {
  position: absolute;
  bottom: 10px;
  right: 10px;
  background: rgba(43, 23, 0, 0.6);
  padding: 8px;
  border-radius: 4px;
}

.color-gradient {
  width: 100px;
  height: 10px;
  border-radius: 2px;
}

.scale-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
  font-size: 10px;
  color: rgba(255, 165, 0, 0.7);
}
</style>