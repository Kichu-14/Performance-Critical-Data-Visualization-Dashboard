<template>
  <div 
    class="zoom-pan-controls"
    :class="{ 'is-vertical': vertical }"
  >
    <div class="control-group zoom-controls">
      <button 
        @click="zoomIn"
        class="control-button zoom-button"
        :disabled="zoomLevel >= maxZoom"
        title="Zoom In"
      >
        <span class="button-icon">+</span>
      </button>
      
      <div class="zoom-level" v-if="showLevel">
        {{ Math.round(zoomLevel * 100) }}%
      </div>
      
      <button 
        @click="zoomOut"
        class="control-button zoom-button"
        :disabled="zoomLevel <= minZoom"
        title="Zoom Out"
      >
        <span class="button-icon">−</span>
      </button>
    </div>

    <div class="control-group pan-controls">
      <button 
        @click="panUp"
        class="control-button pan-button"
        :disabled="!canPanUp"
        title="Pan Up"
      >
        <span class="button-icon">↑</span>
      </button>
      
      <div class="pan-row">
        <button 
          @click="panLeft"
          class="control-button pan-button"
          :disabled="!canPanLeft"
          title="Pan Left"
        >
          <span class="button-icon">←</span>
        </button>
        
        <button 
          @click="resetView"
          class="control-button reset-button"
          :class="{ 'pulse': needsReset }"
          title="Reset View"
        >
          <span class="button-icon">↺</span>
        </button>
        
        <button 
          @click="panRight"
          class="control-button pan-button"
          :disabled="!canPanRight"
          title="Pan Right"
        >
          <span class="button-icon">→</span>
        </button>
      </div>
      
      <button 
        @click="panDown"
        class="control-button pan-button"
        :disabled="!canPanDown"
        title="Pan Down"
      >
        <span class="button-icon">↓</span>
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

interface Props {
  zoomLevel?: number;
  minZoom?: number;
  maxZoom?: number;
  canPanUp?: boolean;
  canPanDown?: boolean;
  canPanLeft?: boolean;
  canPanRight?: boolean;
  needsReset?: boolean;
  vertical?: boolean;
  showLevel?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  zoomLevel: 1,
  minZoom: 0.5,
  maxZoom: 5,
  canPanUp: true,
  canPanDown: true,
  canPanLeft: true,
  canPanRight: true,
  needsReset: false,
  vertical: false,
  showLevel: true
});

const emit = defineEmits<{
  (e: 'zoomIn'): void;
  (e: 'zoomOut'): void;
  (e: 'panUp'): void;
  (e: 'panDown'): void;
  (e: 'panLeft'): void;
  (e: 'panRight'): void;
  (e: 'resetView'): void;
}>();

// Event handlers
function zoomIn() {
  if (props.zoomLevel < props.maxZoom) {
    emit('zoomIn');
  }
}

function zoomOut() {
  if (props.zoomLevel > props.minZoom) {
    emit('zoomOut');
  }
}

function panUp() {
  if (props.canPanUp) {
    emit('panUp');
  }
}

function panDown() {
  if (props.canPanDown) {
    emit('panDown');
  }
}

function panLeft() {
  if (props.canPanLeft) {
    emit('panLeft');
  }
}

function panRight() {
  if (props.canPanRight) {
    emit('panRight');
  }
}

function resetView() {
  emit('resetView');
}
</script>

<style scoped>
.zoom-pan-controls {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0.5rem;
  background: rgba(30, 42, 120, 0.15);
  backdrop-filter: blur(8px);
  border-radius: 8px;
  border: 1px solid rgba(255, 234, 112, 0.1);
}

.zoom-pan-controls.is-vertical {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
}

.control-group {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.zoom-controls {
  flex-direction: column;
  align-items: center;
}

.pan-controls {
  flex-direction: column;
  align-items: center;
}

.pan-row {
  display: flex;
  gap: 0.5rem;
}

.control-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  background-color: rgba(255, 234, 112, 0.15);
  color: #ffea70;
  border: 1px solid rgba(255, 234, 112, 0.2);
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  user-select: none;
  transition: all 0.2s ease;
}

.control-button:hover:not(:disabled) {
  background-color: rgba(255, 234, 112, 0.25);
  border-color: rgba(255, 234, 112, 0.4);
}

.control-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.zoom-button {
  background-color: rgba(255, 234, 112, 0.2);
}

.reset-button {
  background-color: rgba(255, 234, 112, 0.25);
}

.button-icon {
  font-size: 1.1rem;
  line-height: 1;
}

.zoom-level {
  color: rgba(255, 234, 112, 0.9);
  font-size: 0.8rem;
  font-weight: 500;
  padding: 0.2rem 0;
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
  .zoom-pan-controls:not(.is-vertical) {
    flex-direction: row;
    justify-content: center;
    padding: 0.8rem;
  }

  .is-vertical {
    right: 0.5rem;
    padding: 0.4rem;
  }

  .control-button {
    width: 1.8rem;
    height: 1.8rem;
  }

  .button-icon {
    font-size: 1rem;
  }
}
</style>