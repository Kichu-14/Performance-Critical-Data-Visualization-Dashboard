import { ref, onMounted, onUnmounted, computed } from 'vue';
import type { DataPoint } from '../types/dashboard.types';
import { generateInitialData, generateNextDataPoints, getCategories } from '../utils/dataGenerator';

interface UseDataStreamOptions {
  updateInterval?: number;
  maxPoints?: number;
  categories?: string[];
}

export function useDataStream(options: UseDataStreamOptions = {}) {
  const {
    updateInterval = 100,
    maxPoints = 10000,
    categories = getCategories()
  } = options;

  const dataMap = ref<Map<string, DataPoint[]>>(new Map());
  const isStreaming = ref(false);
  let intervalId: number | undefined;

  // Initialize data for each category
  const initializeData = () => {
    const initialData = generateInitialData(maxPoints);
    
    // Group data by category
    categories.forEach(category => {
      dataMap.value.set(
        category,
        initialData.filter(point => point.category === category)
      );
    });
  };

  // Get latest points for each category
  const getLatestPoints = (): DataPoint[] => {
    return Array.from(dataMap.value.values())
      .map(points => points[points.length - 1])
      .filter((point): point is DataPoint => point !== undefined);
  };

  // Update data stream
  const updateData = () => {
    const latestPoints = getLatestPoints();
    const newPoints = generateNextDataPoints(latestPoints);

    newPoints.forEach(point => {
      const categoryData = dataMap.value.get(point.category!);
      if (categoryData) {
        if (categoryData.length >= maxPoints) {
          categoryData.shift(); // Remove oldest point
        }
        categoryData.push(point);
      }
    });
  };

  // Start data streaming
  const startStream = () => {
    if (isStreaming.value) return;
    
    isStreaming.value = true;
    intervalId = window.setInterval(updateData, updateInterval);
  };

  // Stop data streaming
  const stopStream = () => {
    if (!isStreaming.value) return;
    
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = undefined;
    }
    isStreaming.value = false;
  };

  // Computed property for all data points
  const allData = computed(() => {
    const result: DataPoint[] = [];
    dataMap.value.forEach(points => result.push(...points));
    return result.sort((a, b) => a.timestamp - b.timestamp);
  });

  // Lifecycle hooks
  onMounted(() => {
    initializeData();
  });

  onUnmounted(() => {
    stopStream();
  });

  return {
    dataMap,
    allData,
    isStreaming,
    startStream,
    stopStream,
    updateData
  };
}