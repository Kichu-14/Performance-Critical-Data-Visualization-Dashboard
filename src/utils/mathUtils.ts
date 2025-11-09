import type { ChartDimensions, ViewportConfig } from '../types/dashboard.types';

/**
 * Create a scaling function for converting data values to pixel coordinates
 */
export function createScale(
  domainMin: number,
  domainMax: number,
  rangeMin: number,
  rangeMax: number
): (value: number) => number {
  const domainSpan = domainMax - domainMin;
  const rangeSpan = rangeMax - rangeMin;
  
  return (value: number): number => {
    const normalizedValue = (value - domainMin) / domainSpan;
    return rangeMin + (normalizedValue * rangeSpan);
  };
}

/**
 * Calculate chart dimensions and scaling functions based on viewport config
 */
export function calculateChartDimensions(
  width: number,
  height: number,
  viewport: ViewportConfig
): ChartDimensions {
  const padding = viewport.padding;
  const plotWidth = width * (1 - 2 * padding);
  const plotHeight = height * (1 - 2 * padding);
  
  const xScale = createScale(
    viewport.xMin,
    viewport.xMax,
    padding * width,
    padding * width + plotWidth
  );
  
  const yScale = createScale(
    viewport.yMin,
    viewport.yMax,
    padding * height + plotHeight,
    padding * height
  );
  
  return {
    width,
    height,
    xScale,
    yScale
  };
}

/**
 * Calculate tick values for axes
 */
export function calculateTicks(min: number, max: number, targetCount: number): number[] {
  const range = max - min;
  const roughStep = range / (targetCount - 1);
  
  // Calculate a nice step size
  const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
  const normalizedStep = roughStep / magnitude;
  
  let niceStep: number;
  if (normalizedStep < 1.5) niceStep = 1;
  else if (normalizedStep < 3) niceStep = 2;
  else if (normalizedStep < 7) niceStep = 5;
  else niceStep = 10;
  niceStep *= magnitude;
  
  // Generate ticks
  const ticks: number[] = [];
  const niceMin = Math.ceil(min / niceStep) * niceStep;
  let tick = niceMin;
  
  while (tick <= max) {
    ticks.push(tick);
    tick += niceStep;
  }
  
  return ticks;
}

/**
 * Linear interpolation between two values
 */
export function lerp(start: number, end: number, t: number): number {
  return start * (1 - t) + end * t;
}

/**
 * Calculate the moving average of an array of numbers
 */
export function movingAverage(values: number[], windowSize: number): number[] {
  const result: number[] = [];
  let sum = 0;
  
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= windowSize) {
      sum -= values[i - windowSize];
    }
    if (i >= windowSize - 1) {
      result.push(sum / windowSize);
    }
  }
  
  return result;
}