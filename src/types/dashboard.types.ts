// Data point interface for time-series data
export interface DataPoint {
  timestamp: number;    // Unix ms timestamp
  value: number;        // metric/measurement value
  category?: string;    // optional grouping/categorization
}

// Chart viewport configuration
export interface ViewportConfig {
  xMin: number;         // minimum timestamp
  xMax: number;         // maximum timestamp
  yMin: number;         // minimum value
  yMax: number;         // maximum value
  padding: number;      // padding percentage (0-1)
}

// Performance metrics interface
export interface PerformanceMetrics {
  fps: number;          // frames per second
  memory: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
  lastUpdateTime: number;
}

// Chart dimensions and scaling
export interface ChartDimensions {
  width: number;
  height: number;
  xScale: (value: number) => number;
  yScale: (value: number) => number;
}

// Chart theme configuration
export interface ChartTheme {
  backgroundColor: string;
  axisColor: string;
  gridColor: string;
  textColor: string;
  colors: string[];     // array of colors for different categories
}