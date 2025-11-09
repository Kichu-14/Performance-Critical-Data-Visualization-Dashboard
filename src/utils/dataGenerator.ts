import type { DataPoint } from '../types/dashboard.types';

// Configuration for data generation
const CONFIG = {
  CATEGORIES: ['Alpha', 'Beta', 'Gamma', 'Delta'],
  MIN_VALUE: 0,
  MAX_VALUE: 100,
  BASE_FREQUENCY: 1/400,  // Base frequency for sine wave
  NOISE_AMPLITUDE: 10,    // Maximum random noise
  UPDATE_INTERVAL: 100    // ms between updates
};

/**
 * Generate sinusoidal data with noise and categories
 * @param pointCount Number of data points to generate
 * @param startTime Starting timestamp (defaults to 1 hour ago)
 */
export function generateInitialData(
  pointCount = 10000,
  startTime = Date.now() - 1000 * 60 * 60
): DataPoint[] {
  const data: DataPoint[] = [];
  
  for (let i = 0; i < pointCount; i++) {
    const timestamp = startTime + i * CONFIG.UPDATE_INTERVAL;
    
    // Generate base sine wave with different phases for categories
    CONFIG.CATEGORIES.forEach((category, categoryIndex) => {
      const phase = (categoryIndex * Math.PI) / 2; // Phase shift per category
      const baseValue = Math.sin(i * CONFIG.BASE_FREQUENCY + phase);
      const noise = (Math.random() - 0.5) * 2 * CONFIG.NOISE_AMPLITUDE;
      
      const value = Math.min(
        Math.max(
          CONFIG.MIN_VALUE,
          ((baseValue + 1) / 2) * (CONFIG.MAX_VALUE - CONFIG.MIN_VALUE) + noise
        ),
        CONFIG.MAX_VALUE
      );
      
      data.push({ timestamp, value, category });
    });
  }
  
  return data;
}

/**
 * Generate the next data point for each category
 * @param lastPoints Last data point for each category
 */
export function generateNextDataPoints(lastPoints: DataPoint[]): DataPoint[] {
  const timestamp = Date.now();
  
  return lastPoints.map(lastPoint => {
    const { category, value } = lastPoint;
    
    // Random walk with mean reversion
    const meanReversion = 0.3;
    const volatility = 0.5;
    const targetValue = (CONFIG.MAX_VALUE + CONFIG.MIN_VALUE) / 2;
    
    const newValue = Math.min(
      Math.max(
        CONFIG.MIN_VALUE,
        value + 
          meanReversion * (targetValue - value) + // Pull toward mean
          (Math.random() - 0.5) * volatility * CONFIG.NOISE_AMPLITUDE // Add noise
      ),
      CONFIG.MAX_VALUE
    );
    
    return { timestamp, value: newValue, category };
  });
}

/**
 * Get update interval for data generation
 */
export function getUpdateInterval(): number {
  return CONFIG.UPDATE_INTERVAL;
}

/**
 * Get available categories
 */
export function getCategories(): string[] {
  return [...CONFIG.CATEGORIES];
}