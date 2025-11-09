<template>
  <div 
    class="line-chart-container" 
    ref="containerRef" 
    @wheel="onWheel" 
    @mousedown="onMouseDown" 
    @mouseup="onMouseUp" 
    @mouseleave="onMouseUp" 
    @mousemove="onMouseMove"
  >
    <canvas ref="canvasRef" :width="canvasWidth" :height="canvasHeight" />
    <svg 
      class="axes" 
      :width="canvasWidth" 
      :height="canvasHeight" 
      aria-hidden="true"
    >
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
          {{ tick.value }}
        </text>
      </g>
      <!-- X Axis Ticks & Labels -->
      <g v-for="tick in xTicks" :key="tick.value" class="x-tick">
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
        :y="canvasHeight - margin.bottom + 40" 
        class="axis-label"
      >
        {{ xAxisLabel }}
      </text>
      <!-- Y Axis Label -->
      <text 
        class="axis-label"
        :transform="`translate(${margin.left - 40}, ${(canvasHeight - margin.top - margin.bottom) / 2 + margin.top}) rotate(-90)`"
      >
        {{ yAxisLabel }}
      </text>
    </svg>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, onMounted, onBeforeUnmount, computed } from 'vue';
import type { DataPoint } from '../../types/dashboard.types';
import { createGradient, withOpacity } from '../../utils/colorUtils';
import { useDataStream } from '../../composables/useDataStream';

// Props
interface Props {
  data?: DataPoint[];
  color?: string;
  showPoints?: boolean;
  loading?: boolean;
  live?: boolean; // if true, use internal data stream
  category?: string; // optional category filter in live mode
  xAxisLabel?: string;
  yAxisLabel?: string;
}

const props = withDefaults(defineProps<Props>(), {
  data: () => [],
  color: '#6a93ff',
  showPoints: true,
  loading: false,
  live: false,
  category: undefined,
  xAxisLabel: 'Time',
  yAxisLabel: 'Value'
});

// Category colors
const categoryColors = {
  'Alpha': '#FF6B6B',
  'Beta': '#4ECDC4',
  'Gamma': '#45B7D1',
  'Delta': '#96CEB4'
};

// Constants
const canvasWidth = 800;
const canvasHeight = 400;
const margin = { top: 20, right: 20, bottom: 40, left: 50 };
const pointSpacing = 500; // Draw points every 500 data points for performance

// Refs
const canvasRef = ref<HTMLCanvasElement | null>(null);
const containerRef = ref<HTMLDivElement | null>(null);
// Use a data source: either props.data or the live stream
const dataToPlot = ref<DataPoint[]>([]);

let stream: ReturnType<typeof useDataStream> | null = null;

// Reactive state
const yTicks = ref<Array<{ value: number; pos: number }>>([]);
const xTicks = ref<Array<{ value: number; pos: number }>>([]);

// View state
let zoomLevel = 1;
let panX = 0;
let isPanning = false;
let startDragX = 0;
let bounds = {
  minX: 0,
  maxX: 0,
  minY: 0,
  maxY: 0
};

// Event handlers
function onWheel(e: WheelEvent) {
  e.preventDefault();
  const zoomIntensity = 0.1;
  const delta = e.deltaY < 0 ? 1 : -1;
  const oldZoom = zoomLevel;
  zoomLevel = Math.min(Math.max(0.5, zoomLevel + delta * zoomIntensity), 5);
  
  // Adjust pan to keep the zoom centered on mouse position
  if (oldZoom !== zoomLevel) {
    const rect = canvasRef.value?.getBoundingClientRect();
    if (rect) {
      const mouseX = e.clientX - rect.left - margin.left;
      panX = mouseX - (mouseX - panX) * (zoomLevel / oldZoom);
    }
    draw();
  }
}

function onMouseDown(e: MouseEvent) {
  isPanning = true;
  startDragX = e.clientX;
}

function onMouseUp() {
  isPanning = false;
}

function onMouseMove(e: MouseEvent) {
  if (!isPanning) return;
  const deltaX = e.clientX - startDragX;
  panX = Math.min(Math.max(panX + deltaX, -canvasWidth * (zoomLevel - 1)), 0);
  startDragX = e.clientX;
  draw();
}

// Utility functions
function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
}

function getX(val: number): number {
  const dataSpan = bounds.maxX - bounds.minX;
  return margin.left + 
    ((val - bounds.minX) / dataSpan * (canvasWidth - margin.left - margin.right) * zoomLevel + panX);
}

function getY(val: number): number {
  const valueSpan = bounds.maxY - bounds.minY;
  return margin.top + 
    ((bounds.maxY - val) / valueSpan * (canvasHeight - margin.top - margin.bottom));
}

// Drawing functions
function calculateBounds() {
  const data = dataToPlot.value;
  if (!data.length) return;

  bounds = {
    minX: data[0].timestamp,
    maxX: data[data.length - 1].timestamp,
    minY: Math.min(...data.map(p => p.value)),
    maxY: Math.max(...data.map(p => p.value))
  };
  
  // Add 5% padding to Y axis
  const yPadding = (bounds.maxY - bounds.minY) * 0.05;
  bounds.minY -= yPadding;
  bounds.maxY += yPadding;
}

function updateTicks() {
  const stepsY = 6;
  const stepsX = 6;

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

function draw() {
  const canvas = canvasRef.value;
  const ctx = canvas?.getContext('2d');
  const data = dataToPlot.value.length ? dataToPlot.value : props.data || [];
  if (!canvas || !ctx || !data.length) return;

  // Clear canvas
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  
  // Calculate bounds and update ticks
  calculateBounds();
  updateTicks();
  
  // Set up line style
  ctx.lineWidth = 2;
  ctx.strokeStyle = props.color;
  
  // Create gradient for area fill
  const gradient = createGradient(
    ctx,
    props.color,
    props.color,
    0.2,
    0.05
  );
  
  // Draw area and line
  ctx.beginPath();
  let firstPoint = true;
  
  for (let i = 0; i < data.length; i++) {
    const point = data[i];
    const x = getX(point.timestamp);
    const y = getY(point.value);

    if (firstPoint) {
      ctx.moveTo(x, y);
      firstPoint = false;
    } else {
      ctx.lineTo(x, y);
    }
  }
  
  // Draw line
  ctx.stroke();
  
  // Fill area
  ctx.lineTo(getX(data[data.length - 1].timestamp), getY(bounds.minY));
  ctx.lineTo(getX(data[0].timestamp), getY(bounds.minY));
  ctx.fillStyle = gradient;
  ctx.fill();
  
  // Draw points
  if (props.showPoints) {
    ctx.fillStyle = withOpacity(props.color!, 0.8);
    for (let i = 0; i < data.length; i += pointSpacing) {
      const point = data[i];
      const x = getX(point.timestamp);
      const y = getY(point.value);

      ctx.beginPath();
      ctx.arc(x, y, 3, 0, 2 * Math.PI);
      ctx.fill();
    }
  }
}

// Watchers and lifecycle hooks
// Watch props.data and live stream data
watch(() => props.data, () => {
  if (!props.live) {
    dataToPlot.value = props.data || [];
    draw();
  }
}, { deep: true });

// If live mode is enabled, bind to the internal data stream
onMounted(() => {
  if (props.live) {
    stream = useDataStream();
    const filtered = computed(() => {
      if (!props.category) return stream!.allData.value;
      return stream!.allData.value.filter(p => p.category === props.category);
    });

    // Keep dataToPlot synced to the stream
    dataToPlot.value = filtered.value;
    watch(filtered, () => {
      dataToPlot.value = filtered.value;
      draw();
    }, { deep: true });
  } else {
    // initialize with provided data
    dataToPlot.value = props.data || [];
  }

  // draw and set up resize observer
  draw();
  const observer = new ResizeObserver(() => {
    draw();
  });
  if (containerRef.value) {
    observer.observe(containerRef.value);
  }
});

onBeforeUnmount(() => {
  // Stop stream when leaving
  if (stream && stream.stopStream) {
    stream.stopStream();
  }
});
</script>

<style scoped>
.line-chart-container {
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
  border-radius: 8px;
  background: rgba(20, 29, 56, 0.3);
  backdrop-filter: blur(8px);
  box-shadow: 0 5px 20px rgba(255, 165, 0, 0.1);
  transition: box-shadow 0.3s ease;
}

.line-chart-container:hover canvas {
  box-shadow: 0 5px 30px rgba(255, 165, 0, 0.2);
}

.axes {
  pointer-events: none;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.axis-line {
  stroke: rgba(255, 255, 255, 0.2);
  stroke-width: 1;
}

.tick-line {
  stroke: rgba(255, 255, 255, 0.2);
  stroke-width: 1;
}

.tick-text {
  fill: rgba(255, 255, 255, 0.6);
  font-size: 10px;
  font-family: 'Poppins', sans-serif;
  font-weight: 300;
}

.axis-label {
  fill: rgba(255, 255, 255, 0.8);
  font-size: 12px;
  font-family: 'Poppins', sans-serif;
  font-weight: 500;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .tick-text {
    font-size: 8px;
  }
}
</style>