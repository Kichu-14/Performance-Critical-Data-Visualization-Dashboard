import { ref } from 'vue'
import type { DataPoint } from '@/types/dashboard.types'

export function useCsvData() {
  const csvData = ref<DataPoint[]>([])
  const isLoading = ref(false)

  const loadCsv = (file: File) => {
    isLoading.value = true
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      const lines = content.split('\n').slice(1) // Skip header
      const data: DataPoint[] = lines.map(line => {
        const [timestamp, value, category] = line.split(',')
        return {
          timestamp: new Date(timestamp).getTime(),
          value: parseFloat(value),
          category,
        }
      }).filter(d => !isNaN(d.timestamp) && !isNaN(d.value))
      
      // Simulate a delay for demonstration purposes
      setTimeout(() => {
        csvData.value = data
        isLoading.value = false
      }, 2000) // 2 second delay
    }
    reader.readAsText(file)
  }

  return {
    csvData,
    loadCsv,
    isLoading,
  }
}
