<template>
  <div class="performance-monitor" :class="{ expanded }">
    <!-- Main Metrics -->
    <div class="metrics-grid">
      <!-- FPS Meter -->
      <div 
        class="metric fps-metric"
        :class="getFPSClass(fps)"
      >
        <div class="metric-header">
          <h3>FPS</h3>
          <button 
            class="info-button" 
            @mouseenter="showTooltip('fps')"
            @mouseleave="hideTooltip"
          >
            ⓘ
          </button>
        </div>
        <div class="metric-value">
          <span class="value">{{ Math.round(fps) }}</span>
          <span class="unit">frames/sec</span>
        </div>
        <div class="metric-graph">
          <div 
            v-for="(bar, index) in fpsHistory"
            :key="index"
            class="history-bar"
            :style="{
              height: `${(bar / 60) * 100}%`,
              opacity: 1 - (index / 50) * 0.5
            }"
          ></div>
        </div>
      </div>

      <!-- Memory Usage -->
      <div 
        class="metric memory-metric"
        :class="getMemoryClass(memoryUsage)"
      >
        <div class="metric-header">
          <h3>Memory</h3>
          <button 
            class="info-button"
            @mouseenter="showTooltip('memory')"
            @mouseleave="hideTooltip"
          >
            ⓘ
          </button>
        </div>
        <div class="metric-value">
          <span class="value">{{ formatMemory(memory) }}</span>
          <span class="unit">MB</span>
        </div>
        <div class="memory-bars">
          <div 
            class="memory-bar"
            :style="{ width: `${memoryUsage}%` }"
          ></div>
        </div>
      </div>

      <!-- Event Rate -->
      <div class="metric events-metric">
        <div class="metric-header">
          <h3>Events/sec</h3>
          <button 
            class="info-button"
            @mouseenter="showTooltip('events')"
            @mouseleave="hideTooltip"
          >
            ⓘ
          </button>
        </div>
        <div class="metric-value">
          <span class="value">{{ eventRate }}</span>
          <span class="unit">evt/s</span>
        </div>
        <div class="pulse-indicator" :class="{ active: eventRate > 0 }"></div>
      </div>

      <!-- Render Time -->
      <div class="metric render-metric">
        <div class="metric-header">
          <h3>Render Time</h3>
          <button 
            class="info-button"
            @mouseenter="showTooltip('render')"
            @mouseleave="hideTooltip"
          >
            ⓘ
          </button>
        </div>
        <div class="metric-value">
          <span class="value">{{ renderTime.toFixed(1) }}</span>
          <span class="unit">ms</span>
        </div>
      </div>
    </div>

    <!-- Tooltip -->
    <div 
      v-if="tooltipContent"
      class="tooltip"
      :style="tooltipStyle"
    >
      {{ tooltipContent }}
    </div>

    <!-- Expand/Collapse Toggle -->
    <button 
      class="expand-toggle"
      @click="toggleExpand"
      :title="expanded ? 'Show less' : 'Show more'"
    >
      {{ expanded ? '▼' : '▲' }}
    </button>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';

interface Props {
  fps: number;
  memory: number;
  eventRate?: number;
  renderTime?: number;
  memoryLimit?: number;
}

const props = withDefaults(defineProps<Props>(), {
  eventRate: 0,
  renderTime: 0,
  memoryLimit: 1024 // 1GB default limit
});

// State
const expanded = ref(false);
const fpsHistory = ref<number[]>([]);
const tooltipContent = ref('');
const tooltipStyle = ref({});
const mousePos = ref({ x: 0, y: 0 });

// Computed
const memoryUsage = computed(() => 
  (props.memory / props.memoryLimit) * 100
);

// Methods
function getFPSClass(fps: number): string {
  if (fps >= 55) return 'status-good';
  if (fps >= 30) return 'status-warning';
  return 'status-critical';
}

function getMemoryClass(usage: number): string {
  if (usage <= 70) return 'status-good';
  if (usage <= 85) return 'status-warning';
  return 'status-critical';
}

function formatMemory(mb: number): string {
  if (mb >= 1024) {
    return (mb / 1024).toFixed(2) + ' GB';
  }
  return mb.toFixed(0);
}

function toggleExpand() {
  expanded.value = !expanded.value;
}

const tooltips = {
  fps: 'Frames per second. Target: 60 FPS for smooth animation',
  memory: `Memory usage out of ${props.memoryLimit}MB limit`,
  events: 'Number of data events processed per second',
  render: 'Average time to render a single frame'
};

function showTooltip(type: keyof typeof tooltips) {
  tooltipContent.value = tooltips[type];
  updateTooltipPosition();
}

function hideTooltip() {
  tooltipContent.value = '';
}

function updateTooltipPosition() {
  tooltipStyle.value = {
    left: `${mousePos.value.x}px`,
    top: `${mousePos.value.y - 30}px`
  };
}

function onMouseMove(e: MouseEvent) {
  mousePos.value = { x: e.clientX, y: e.clientY };
  if (tooltipContent.value) {
    updateTooltipPosition();
  }
}

// Lifecycle
onMounted(() => {
  window.addEventListener('mousemove', onMouseMove);
});

onUnmounted(() => {
  window.removeEventListener('mousemove', onMouseMove);
});

// Watch FPS for history
watch(() => props.fps, (newFps) => {
  fpsHistory.value.unshift(newFps);
  if (fpsHistory.value.length > 50) {
    fpsHistory.value.pop();
  }
});
</script>

<style scoped>
.performance-monitor {
  position: relative;
  background: rgba(30, 42, 120, 0.15);
  backdrop-filter: blur(8px);
  border-radius: 12px;
  padding: 1rem;
  font-family: 'Poppins', sans-serif;
  color: #ffd365;
  user-select: none;
  border: 1px solid rgba(255, 234, 112, 0.1);
  transition: all 0.3s ease;
}

.performance-monitor:hover {
  border-color: rgba(255, 234, 112, 0.2);
  box-shadow: 0 0 20px rgba(255, 234, 112, 0.1);
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  transition: all 0.3s ease;
}

.metric {
  background: rgba(255, 234, 112, 0.1);
  padding: 1rem;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.metric:hover {
  background: rgba(255, 234, 112, 0.15);
}

.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

h3 {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 500;
  color: rgba(255, 234, 112, 0.7);
}

.metric-value {
  display: flex;
  align-items: baseline;
  gap: 0.3rem;
}

.value {
  font-size: 1.5rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.unit {
  font-size: 0.8rem;
  color: rgba(255, 234, 112, 0.6);
}

/* FPS Specific */
.metric-graph {
  display: flex;
  align-items: flex-end;
  gap: 1px;
  height: 30px;
  margin-top: 0.5rem;
}

.history-bar {
  flex: 1;
  background: currentColor;
  transition: height 0.3s ease;
}

/* Memory Specific */
.memory-bars {
  height: 4px;
  background: rgba(255, 234, 112, 0.1);
  border-radius: 2px;
  margin-top: 0.5rem;
  overflow: hidden;
}

.memory-bar {
  height: 100%;
  background: currentColor;
  transition: width 0.3s ease;
}

/* Event Rate Specific */
.pulse-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
  margin-top: 0.5rem;
  opacity: 0.3;
}

.pulse-indicator.active {
  animation: pulse 1s infinite;
}

/* Status Colors */
.status-good {
  color: #4caf50;
}

.status-warning {
  color: #ffc107;
}

.status-critical {
  color: #f44336;
}

/* Info Button */
.info-button {
  background: none;
  border: none;
  color: rgba(255, 234, 112, 0.4);
  cursor: pointer;
  padding: 0;
  font-size: 0.9rem;
  transition: color 0.3s ease;
}

.info-button:hover {
  color: rgba(255, 234, 112, 0.8);
}

/* Tooltip */
.tooltip {
  position: fixed;
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.8rem;
  pointer-events: none;
  z-index: 1000;
  transform: translate(-50%, -100%);
}

/* Expand Toggle */
.expand-toggle {
  position: absolute;
  bottom: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 234, 112, 0.15);
  border: 1px solid rgba(255, 234, 112, 0.2);
  color: rgba(255, 234, 112, 0.7);
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  transition: all 0.3s ease;
}

.expand-toggle:hover {
  background: rgba(255, 234, 112, 0.25);
  border-color: rgba(255, 234, 112, 0.4);
  color: rgba(255, 234, 112, 0.9);
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 0.3;
  }
  50% {
    transform: scale(1.5);
    opacity: 0.7;
  }
  100% {
    transform: scale(1);
    opacity: 0.3;
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .value {
    font-size: 1.2rem;
  }
}

@media (max-width: 480px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }
}
</style>