<template>
  <div class="filter-panel">
    <div class="filter-group">
      <label class="filter-label">
        Time Range
        <select 
          v-model="timeRange" 
          @change="updateTimeRange"
          class="filter-select"
        >
          <option value="1min">Last 1 Minute</option>
          <option value="5min">Last 5 Minutes</option>
          <option value="15min">Last 15 Minutes</option>
          <option value="1hr">Last 1 Hour</option>
          <option value="all">All Data</option>
        </select>
      </label>
    </div>
    
    <div class="filter-group">
      <label class="filter-label">
        Update Rate
        <select 
          v-model="updateRate" 
          @change="updateRefreshRate"
          class="filter-select"
        >
          <option value="100">100ms (Max)</option>
          <option value="250">250ms (Fast)</option>
          <option value="500">500ms (Medium)</option>
          <option value="1000">1s (Slow)</option>
        </select>
      </label>
    </div>

    <div class="filter-actions">
      <button 
        @click="resetView"
        class="action-button reset-button"
        :class="{ 'pulse': needsReset }"
      >
        <span class="button-icon">↺</span>
        Reset View
      </button>
      
      <button 
        @click="togglePause"
        class="action-button"
        :class="{ 'paused': isPaused }"
      >
        <span class="button-icon">{{ isPaused ? '▶' : '⏸' }}</span>
        {{ isPaused ? 'Resume' : 'Pause' }}
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { defineEmits, ref, watch } from 'vue';

interface Props {
  needsReset?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  needsReset: false
});

// Emit events to parent for filter changes
const emit = defineEmits<{
  (e: 'update:timeRange', range: string): void;
  (e: 'update:updateRate', rate: number): void;
  (e: 'resetView'): void;
  (e: 'togglePause'): void;
}>();

// Local state
const timeRange = ref('1min');
const updateRate = ref('250');
const isPaused = ref(false);

// Event handlers
function updateTimeRange() {
  emit('update:timeRange', timeRange.value);
}

function updateRefreshRate() {
  emit('update:updateRate', Number(updateRate.value));
}

function resetView() {
  emit('resetView');
}

function togglePause() {
  isPaused.value = !isPaused.value;
  emit('togglePause');
}

// Reset paused state when time range changes
watch(timeRange, () => {
  if (isPaused.value) {
    isPaused.value = false;
    emit('togglePause');
  }
});
</script>

<style scoped>
.filter-panel {
  display: flex;
  gap: 1.5rem;
  align-items: center;
  padding: 1rem;
  background: rgba(30, 42, 120, 0.15);
  backdrop-filter: blur(8px);
  border-radius: 8px;
  border: 1px solid rgba(255, 234, 112, 0.1);
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-label {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  color: rgba(255, 234, 112, 0.9);
  font-size: 0.9rem;
  font-weight: 500;
}

.filter-select {
  background-color: rgba(30, 42, 120, 0.3);
  color: #ffea70;
  border: 1px solid rgba(255, 234, 112, 0.2);
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  min-width: 140px;
  transition: all 0.3s ease;
}

.filter-select:hover {
  border-color: rgba(255, 234, 112, 0.4);
  background-color: rgba(30, 42, 120, 0.4);
}

.filter-select:focus {
  outline: none;
  border-color: rgba(255, 234, 112, 0.6);
  box-shadow: 0 0 0 2px rgba(255, 234, 112, 0.1);
}

.filter-actions {
  display: flex;
  gap: 0.8rem;
  margin-left: auto;
}

.action-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: rgba(255, 234, 112, 0.15);
  color: #ffea70;
  border: 1px solid rgba(255, 234, 112, 0.2);
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.9rem;
  user-select: none;
  transition: all 0.3s ease;
}

.action-button:hover {
  background-color: rgba(255, 234, 112, 0.25);
  border-color: rgba(255, 234, 112, 0.4);
}

.action-button.reset-button {
  background-color: rgba(255, 234, 112, 0.2);
}

.action-button.paused {
  background-color: rgba(255, 234, 112, 0.25);
  border-color: rgba(255, 234, 112, 0.4);
}

.button-icon {
  font-size: 1.1rem;
  line-height: 1;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(255, 234, 112, 0.4);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(255, 234, 112, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(255, 234, 112, 0);
  }
}

.reset-button.pulse {
  animation: pulse 2s infinite;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .filter-panel {
    flex-direction: column;
    gap: 1rem;
    padding: 0.8rem;
  }

  .filter-actions {
    margin-left: 0;
    width: 100%;
    justify-content: space-between;
  }

  .filter-select {
    width: 100%;
  }
}
</style>