<template>
  <div class="app">
    <LoadingOverlay v-if="isLoading" />
    <header class="header">
      <div class="header-content">
        <h1>Real-Time Dashboard</h1>
        <div class="header-info">
          <span class="time">🕒 {{ formattedTime }}</span>
          <span class="status" :class="{ 'status-active': isStreaming }">
            {{ isStreaming ? '● Live' : '○ Paused' }}
          </span>
        </div>
        <div class="header-controls">
          <input type="file" ref="fileInput" @change="handleFileUpload" style="display: none" accept=".csv">
          <button class="control-button" @click="toggleStream">{{ isStreaming ? 'Pause Stream' : 'Start Stream' }}</button>
          <button class="control-button" @click="openFilePicker">Upload CSV</button>
        </div>
      </div>
    </header>
    <main class="main">
      <div class="dashboard-grid">
        <!-- Line Chart -->
        <div class="chart-container">
          <div class="chart-header">
            <div class="chart-title">
              <h2>Sensor Value Over Time</h2>
              <p class="subtitle">Tracking Alpha, Beta, Gamma, and Delta sensor values</p>
            </div>
          </div>
          <div class="chart-legend">
            <div v-for="category in categories" :key="category" class="legend-item">
              <span class="legend-color" :style="{ backgroundColor: getCategoryColor(category) }"></span>
              <span class="legend-label">{{ category }}</span>
            </div>
          </div>
          <LineChart
            :data="allData"
            :loading="isLoading"
            x-axis-label="Time"
            y-axis-label="Sensor Value"
            class="chart-content"
          />
        </div>

        <!-- Bar Chart -->
        <div class="chart-container">
          <div class="chart-header">
            <div class="chart-title">
              <h2>Average Value by Category</h2>
              <p class="subtitle">Average sensor value for each category</p>
            </div>
          </div>
          <BarChart
            :data="allData"
            :loading="isLoading"
            x-label="Category"
            y-label="Average Sensor Value"
            class="chart-content"
          />
        </div>

        <!-- Scatter Plot -->
        <div class="chart-container">
          <div class="chart-header">
            <div class="chart-title">
              <h2>Sensor Data Scatter Plot</h2>
              <p class="subtitle">Individual sensor readings over time</p>
            </div>
          </div>
          <div class="chart-legend">
            <div v-for="category in categories" :key="category" class="legend-item">
              <span class="legend-color" :style="{ backgroundColor: getCategoryColor(category) }"></span>
              <span class="legend-label">{{ category }}</span>
            </div>
          </div>
          <ScatterPlot
            :data="allData"
            :loading="isLoading"
            x-label="Time"
            y-label="Sensor Value"
            class="chart-content"
          />
        </div>

        <!-- Heatmap -->
        <div class="chart-container">
          <div class="chart-header">
            <div class="chart-title">
              <h2>Data Point Density</h2>
              <p class="subtitle">Concentration of sensor readings over time</p>
            </div>
          </div>
          <Heatmap
            :data="allData"
            :loading="isLoading"
            x-label="Time"
            y-label="Sensor Value"
            class="chart-content"
          />
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import LineChart from './components/charts/LineChart.vue'
import BarChart from './components/charts/BarChart.vue'
import ScatterPlot from './components/charts/ScatterPlot.vue'
import Heatmap from './components/charts/Heatmap.vue'
import LoadingOverlay from './components/LoadingOverlay.vue'
import { useDataStream } from './composables/useDataStream'
import { useCsvData } from './composables/useCsvData'
import { getCategories } from './utils/dataGenerator'

const currentTime = ref(Date.now())
const categories = getCategories()
const fileInput = ref<HTMLInputElement | null>(null)

const { allData: streamingData, isStreaming, startStream, stopStream } = useDataStream({
  updateInterval: 500,
  maxPoints: 200
})

const { csvData, loadCsv, isLoading } = useCsvData()

const allData = computed(() => csvData.value.length > 0 ? csvData.value : streamingData.value)

const categoryColors = {
  'Alpha': '#FF6B6B',
  'Beta': '#4ECDC4',
  'Gamma': '#45B7D1',
  'Delta': '#96CEB4'
}

const getCategoryColor = (category: string) => categoryColors[category as keyof typeof categoryColors] || '#666'

const formattedTime = computed(() => {
  return new Date(currentTime.value).toLocaleString()
})

const updateClock = () => {
  currentTime.value = Date.now()
  requestAnimationFrame(updateClock)
}

const openFilePicker = () => {
  if (fileInput.value) {
    fileInput.value.click()
  }
}

const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    loadCsv(target.files[0])
  }
}

const toggleStream = () => {
  if (isStreaming.value) {
    stopStream()
  } else {
    startStream()
  }
}

onMounted(() => {
  updateClock()
  startStream()
})
</script>

<style scoped>
.app {
  min-height: 100vh;
  background: var(--primary-bg);
  color: var(--text-primary);
  display: flex;
  flex-direction: column;
}

.header {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1rem 2rem;
  position: sticky;
  top: 0;
  z-index: 10;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header h1 {
  color: var(--accent-color);
  font-size: 1.8rem;
  margin: 0;
  background: linear-gradient(45deg, #FFD700, #FFA500);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.header-info {
  display: flex;
  gap: 1.5rem;
  align-items: center;
}

.time {
  color: var(--text-secondary);
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status {
  font-size: 0.9rem;
  color: var(--text-secondary);
  padding: 0.3rem 0.8rem;
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-active {
  color: #4CAF50;
  background: rgba(76, 175, 80, 0.1);
}

.header-controls {
  display: flex;
  gap: 1rem;
}

.control-button {
  background: #4CAF50; /* A more vibrant, readable green */
  color: white; /* White text for high contrast */
  border: none;
  border-radius: 8px;
  padding: 0.6rem 1.2rem;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
  font-weight: 500;
}

.control-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.main {
  flex: 1;
  padding: 2rem;
}

.dashboard-grid {
  max-width: 1400px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(600px, 1fr));
  gap: 2rem;
}

.chart-container {
  background: var(--card-bg);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}

.chart-title h2 {
  color: var(--accent-color-2);
  font-size: 1.3rem;
  margin: 0;
  margin-bottom: 0.3rem;
}

.subtitle {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin: 0;
}

.controls {
  display: flex;
  gap: 1rem;
}

.stream-control {
  background: var(--accent-color);
  color: var(--text-primary);
  border: none;
  border-radius: 8px;
  padding: 0.6rem 1.2rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  font-weight: 500;
}

.stream-control:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.stream-control.active {
  background: var(--accent-color-2);
}

.stream-control .icon {
  font-size: 1.1rem;
}

.chart-legend {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1rem;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 3px;
}

.legend-label {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.chart-content {
  flex: 1;
  min-height: 300px;
}
</style>