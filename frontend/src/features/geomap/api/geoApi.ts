export type GeoLevel = 'sido' | 'sigungu' | 'eup'

export interface KPIRecord {
  region_code: string
  region_name: string
  value: number | null
  change_rate: number | null
  percentile: number | null
  status: 'normal' | 'warning' | 'critical'
  computed_at: string
}

export interface GeoApi {
  fetchKpi: (params: { level: GeoLevel; metric: string; time: string }) => Promise<KPIRecord[]>
}

export const geoApi: GeoApi = {
  async fetchKpi({ level, metric, time }) {
    const url = `/api/geo/kpi?level=${level}&metric=${encodeURIComponent(metric)}&time=${time}`
    const useMock = import.meta.env.VITE_USE_MOCK_API === 'true'
    if (!useMock) {
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch KPI')
      return res.json()
    }
    // mock adapter (requires public/mock/geo-kpi.json)
    const mockRes = await fetch('/mock/geo-kpi.json')
    if (!mockRes.ok) return []
    const all = (await mockRes.json()) as KPIRecord[]
    return all.filter((r) => r)
  },
}
