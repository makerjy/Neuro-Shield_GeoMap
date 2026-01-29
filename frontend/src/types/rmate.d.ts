export {}

declare global {
  interface Window {
    rMateMapChartH5?: {
      create: (id: string, holderId: string, vars: string, width?: string, height?: string) => void
    }
    geoOpsMapReady?: (id: string) => void
    geoOpsMapClick?: (code: number | string, label: string, data: any) => void
    geoOpsDataTip?: (code: number | string, label: string, data: any) => string
  }
}
