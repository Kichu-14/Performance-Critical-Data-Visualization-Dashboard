<template>
  <div class="data-table-wrapper">
    <!-- Table Controls -->
    <div class="table-controls">
      <div class="search-filter">
        <input
          type="text"
          v-model="searchQuery"
          placeholder="Search..."
          class="search-input"
        />
      </div>
      
      <div class="view-options">
        <button 
          @click="toggleAutoScroll"
          class="control-button"
          :class="{ 'active': autoScroll }"
        >
          <span class="button-icon">{{ autoScroll ? '⏸' : '▶' }}</span>
          Auto-scroll
        </button>
        
        <select v-model="rowsPerPage" class="rows-select">
          <option value="20">20 rows</option>
          <option value="50">50 rows</option>
          <option value="100">100 rows</option>
        </select>
      </div>
    </div>

    <!-- Virtual Table -->
    <div 
      class="data-table-container" 
      @scroll="onScroll" 
      ref="tableContainerRef"
    >
      <div 
        class="total-height" 
        :style="{ height: totalHeight + 'px' }"
      >
        <table 
          class="data-table"
          :style="{ transform: `translateY(${translateY}px)` }"
        >
          <thead>
            <tr>
              <th 
                v-for="column in columns" 
                :key="column.key"
                @click="sortBy(column.key)"
                :class="{ 
                  'sortable': column.sortable,
                  'sorted': sortColumn === column.key,
                  'asc': sortColumn === column.key && sortDirection === 'asc',
                  'desc': sortColumn === column.key && sortDirection === 'desc'
                }"
              >
                {{ column.label }}
                <span v-if="column.sortable" class="sort-indicator">
                  {{ getSortIcon(column.key) }}
                </span>
              </th>
            </tr>
          </thead>
          
          <tbody>
            <tr 
              v-for="row in visibleRows" 
              :key="row.timestamp + '-' + row.value"
              :class="{ 'highlighted': isHighlighted(row) }"
            >
              <td>{{ formatDate(row.timestamp) }}</td>
              <td :class="{ 
                'value-increased': row.trend > 0,
                'value-decreased': row.trend < 0
              }">
                {{ formatValue(row.value) }}
                <span class="trend-indicator">
                  {{ row.trend > 0 ? '↑' : row.trend < 0 ? '↓' : '−' }}
                </span>
              </td>
              <td>
                <span class="category-badge" :style="getCategoryColor(row.category)">
                  {{ row.category }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Loading & Status -->
    <div class="table-footer">
      <div class="status-text">
        Showing {{ startIndex + 1 }} - {{ Math.min(endIndex + 1, filteredData.length) }} 
        of {{ filteredData.length }} entries
      </div>
      
      <div v-if="isLoading" class="loading-indicator">
        <div class="loading-spinner"></div>
        Loading data...
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { interpolateColor } from '../utils/colorUtils';
import type { DataPoint } from '../types/dashboard.types';

interface Props {
  data: DataPoint[];
  highlightRecent?: boolean;
  isLoading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  highlightRecent: true,
  isLoading: false
});

// Constants
const HIGHLIGHT_DURATION = 3000; // ms to highlight new entries
const ROW_HEIGHT = 40;
const BUFFER_SIZE = 5; // extra rows to render above/below viewport

// Column definitions
const columns = [
  { key: 'timestamp', label: 'Timestamp', sortable: true },
  { key: 'value', label: 'Value', sortable: true },
  { key: 'category', label: 'Category', sortable: true }
];

// State
const tableContainerRef = ref<HTMLDivElement | null>(null);
const scrollTop = ref(0);
const rowsPerPage = ref(20);
const searchQuery = ref('');
const sortColumn = ref('timestamp');
const sortDirection = ref<'asc' | 'desc'>('desc');
const autoScroll = ref(true);
const recentEntries = ref(new Set<number>());

// Computed properties
const filteredData = computed(() => {
  let result = [...props.data];
  
  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(row => 
      row.category.toLowerCase().includes(query) ||
      row.value.toString().includes(query) ||
      formatDate(row.timestamp).toLowerCase().includes(query)
    );
  }
  
  // Apply sorting
  result.sort((a, b) => {
    const aVal = a[sortColumn.value as keyof DataPoint];
    const bVal = b[sortColumn.value as keyof DataPoint];
    const modifier = sortDirection.value === 'asc' ? 1 : -1;
    return aVal > bVal ? modifier : -modifier;
  });
  
  return result;
});

const totalHeight = computed(() => filteredData.value.length * ROW_HEIGHT);

const visibleCount = computed(() => 
  Math.ceil(tableContainerRef.value?.clientHeight ?? 0 / ROW_HEIGHT) + BUFFER_SIZE * 2
);

const startIndex = computed(() => 
  Math.max(0, Math.floor(scrollTop.value / ROW_HEIGHT) - BUFFER_SIZE)
);

const endIndex = computed(() => 
  Math.min(
    startIndex.value + visibleCount.value,
    filteredData.value.length - 1
  )
);

const visibleRows = computed(() => {
  const rows = filteredData.value.slice(startIndex.value, endIndex.value + 1);
  return rows.map((row, idx) => ({
    ...row,
    trend: getTrend(row, idx)
  }));
});

const translateY = computed(() => startIndex.value * ROW_HEIGHT);

// Methods
function onScroll(event: Event) {
  const target = event.target as HTMLElement;
  scrollTop.value = target.scrollTop;
  if (target.scrollTop + target.clientHeight >= target.scrollHeight - 50) {
    emit('loadMore');
  }
}

function sortBy(column: string) {
  if (sortColumn.value === column) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortColumn.value = column;
    sortDirection.value = 'desc';
  }
}

function getSortIcon(column: string): string {
  if (sortColumn.value !== column) return '⇅';
  return sortDirection.value === 'asc' ? '↑' : '↓';
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3
  });
}

function formatValue(val: number): string {
  return val.toFixed(2);
}

function getTrend(row: DataPoint, index: number): number {
  if (index === 0) return 0;
  const prevRow = filteredData.value[startIndex.value + index - 1];
  return row.value - prevRow.value;
}

function getCategoryColor(category: string) {
  // Generate consistent color based on category string
  const hue = Array.from(category).reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360;
  return {
    backgroundColor: `hsla(${hue}, 70%, 60%, 0.2)`,
    borderColor: `hsla(${hue}, 70%, 60%, 0.4)`
  };
}

function isHighlighted(row: DataPoint): boolean {
  return props.highlightRecent && recentEntries.value.has(row.timestamp);
}

function toggleAutoScroll() {
  autoScroll.value = !autoScroll.value;
  if (autoScroll.value) {
    scrollToBottom();
  }
}

function scrollToBottom() {
  if (!tableContainerRef.value) return;
  tableContainerRef.value.scrollTop = tableContainerRef.value.scrollHeight;
}

// Lifecycle
onMounted(() => {
  if (autoScroll.value) {
    scrollToBottom();
  }
});

// Watchers
watch(() => props.data, (newData, oldData) => {
  if (!oldData || !autoScroll.value) return;
  
  // Track new entries for highlighting
  const oldTimestamps = new Set(oldData.map(d => d.timestamp));
  const newEntries = newData.filter(d => !oldTimestamps.has(d.timestamp));
  
  newEntries.forEach(entry => {
    recentEntries.value.add(entry.timestamp);
    setTimeout(() => {
      recentEntries.value.delete(entry.timestamp);
    }, HIGHLIGHT_DURATION);
  });
  
  if (autoScroll.value) {
    scrollToBottom();
  }
}, { deep: true });

// Emits
const emit = defineEmits<{
  (e: 'loadMore'): void;
}>();
</script>

<style scoped>
.data-table-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  height: 100%;
}

.table-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: rgba(30, 42, 120, 0.15);
  backdrop-filter: blur(8px);
  border-radius: 8px;
  border: 1px solid rgba(255, 234, 112, 0.1);
}

.search-input {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 234, 112, 0.2);
  color: #ffd365;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  width: 200px;
}

.search-input:focus {
  outline: none;
  border-color: rgba(255, 234, 112, 0.4);
  box-shadow: 0 0 0 2px rgba(255, 234, 112, 0.1);
}

.view-options {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.control-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 234, 112, 0.15);
  border: 1px solid rgba(255, 234, 112, 0.2);
  color: #ffd365;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.control-button:hover {
  background: rgba(255, 234, 112, 0.25);
}

.control-button.active {
  background: rgba(255, 234, 112, 0.3);
  border-color: rgba(255, 234, 112, 0.4);
}

.rows-select {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 234, 112, 0.2);
  color: #ffd365;
  padding: 0.5rem;
  border-radius: 4px;
  cursor: pointer;
}

.data-table-container {
  flex: 1;
  overflow-y: auto;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  background: rgba(30, 42, 120, 0.15);
  backdrop-filter: blur(8px);
}

.total-height {
  position: relative;
}

.data-table {
  position: absolute;
  width: 100%;
  border-collapse: collapse;
  font-family: 'Poppins', sans-serif;
  color: #ffd365;
}

thead {
  position: sticky;
  top: 0;
  background: rgba(255, 218, 77, 0.9);
  backdrop-filter: blur(8px);
  color: #3f2a00;
  font-weight: 700;
  box-shadow: 0 3px 10px -5px rgba(255, 191, 0, 0.5);
}

th {
  padding: 1rem;
  text-align: left;
  transition: background-color 0.3s ease;
}

th.sortable {
  cursor: pointer;
}

th.sortable:hover {
  background: rgba(255, 218, 77, 1);
}

.sort-indicator {
  margin-left: 0.5rem;
  opacity: 0.7;
}

td {
  padding: 0.8rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  font-variant-numeric: tabular-nums;
  transition: all 0.3s ease;
}

tr:hover td {
  background: rgba(255, 218, 77, 0.15);
}

tr.highlighted td {
  animation: highlight 3s ease-out;
}

.value-increased {
  color: #4caf50;
}

.value-decreased {
  color: #f44336;
}

.trend-indicator {
  margin-left: 0.5rem;
  font-size: 0.8em;
  opacity: 0.7;
}

.category-badge {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  font-size: 0.9em;
  border: 1px solid;
}

.table-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  color: rgba(255, 234, 112, 0.7);
  font-size: 0.9em;
}

.loading-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 234, 112, 0.3);
  border-top-color: #ffd365;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes highlight {
  0% { background: rgba(255, 218, 77, 0.3); }
  100% { background: transparent; }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .table-controls {
    flex-direction: column;
    gap: 1rem;
  }
  
  .search-input {
    width: 100%;
  }
  
  .view-options {
    width: 100%;
    justify-content: space-between;
  }
  
  th, td {
    padding: 0.6rem;
  }
}
</style>