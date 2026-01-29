import { create } from 'zustand'

export type GeoLevel = 'nation' | 'sido' | 'sigungu' | 'eup'

export type LegendMethod = 'quantile' | 'equal' | 'custom'

export interface LegendConfig {
  method: LegendMethod
  classes: number
  breaks?: number[]
}

export interface GeoState {
  time: string
  metric: string
  level: GeoLevel
  regionCode: string | null
  regionPath: { sido?: string; sigungu?: string; eup?: string }
  legendConfig: LegendConfig
  hoveredRegionCode: string | null
  computedAt?: string
  kpiRecords: { region_code: string; region_name: string; value: number | null; change_rate: number | null; percentile: number | null; status: 'normal' | 'warning' | 'critical'; computed_at: string }[]
  loading: boolean
  error?: string
  setMetric: (metric: string) => void
  setTime: (time: string) => void
  setLevel: (level: GeoLevel) => void
  selectRegion: (regionCode: string | null) => void
  hoverRegion: (regionCode: string | null) => void
  setLegendConfig: (config: LegendConfig) => void
  drillDown: () => void
  drillUp: () => void
  resetSelection: () => void
  setKpiData: (records: GeoState['kpiRecords']) => void
  setLoading: (loading: boolean) => void
  setError: (message?: string) => void
  setComputedAt: (computedAt?: string) => void
}

export const useGeoStore = create<GeoState>((set, get) => ({
  time: '2025-12',
  metric: 'risk_score',
  level: 'nation',
  regionCode: null,
  regionPath: {},
  legendConfig: { method: 'quantile', classes: 5 },
  hoveredRegionCode: null,
  computedAt: undefined,
  kpiRecords: [],
  loading: false,
  error: undefined,
  setMetric: (metric) => set({ metric }),
  setTime: (time) => set({ time }),
  setLevel: (level) => set({ level }),
  selectRegion: (regionCode) => {
    const { level, regionPath } = get()
    const nextPath = { ...regionPath }
    if ((level === 'nation' || level === 'sido') && regionCode) nextPath.sido = regionCode
    if (level === 'sigungu' && regionCode) nextPath.sigungu = regionCode
    if (level === 'eup' && regionCode) nextPath.eup = regionCode
    set({ regionCode, regionPath: nextPath })
  },
  hoverRegion: (regionCode) => set({ hoveredRegionCode: regionCode }),
  setLegendConfig: (config) => set({ legendConfig: config }),
  drillDown: () => {
    const { level, regionCode, regionPath } = get()
    if (!regionCode) return
    if (level === 'nation' || level === 'sido') {
      set({ level: 'sigungu', regionPath: { ...regionPath, sido: regionCode }, regionCode: null })
    } else if (level === 'sigungu') {
      set({ level: 'eup', regionPath: { ...regionPath, sigungu: regionCode }, regionCode: null })
    }
  },
  drillUp: () => {
    const { level, regionPath } = get()
    if (level === 'eup') {
      set({ level: 'sigungu', regionCode: regionPath.sigungu ?? null })
    } else if (level === 'sigungu') {
      set({ level: 'nation', regionCode: regionPath.sido ?? null })
    }
  },
  resetSelection: () => set({ regionCode: null, regionPath: {} }),
  setKpiData: (records) => set({ kpiRecords: records }),
  setLoading: (loading) => set({ loading }),
  setError: (message) => set({ error: message }),
  setComputedAt: (computedAt) => set({ computedAt }),
}))
