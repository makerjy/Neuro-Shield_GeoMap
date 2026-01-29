import { create } from 'zustand'
import type { GeoLevel } from '../api/geoApi'
import { metricLabels } from '../utils/normalizers'

export type LegendConfig = {
  method: 'quantile'
  classes: 5
}

type RegionMeta = {
  region_code: string
  region_name: string
  parent_code: string | null
  level: GeoLevel
}

type GeoOpsState = {
  time: string
  metric: string
  level: GeoLevel
  selectedSido: string | null
  selectedSigungu: string | null
  selectedRegion: string | null
  selection: { code: string; name: string | null; level: GeoLevel } | null
  hoveredRegion: string | null
  legend: LegendConfig
  regionMetaByCode: Record<string, RegionMeta>
  isDrillingDown: boolean
  pendingRequestId: number | null
  setMetric: (metric: string) => void
  setTime: (time: string) => void
  selectRegion: (code: string | null) => void
  selectRegionWithName: (code: string | null, name: string | null) => void
  hoverRegion: (code: string | null) => void
  drillDownFromMap: (code: string, name: string | null) => number | null
  drillDown: () => void
  drillUp: () => void
  setRegionMeta: (meta: RegionMeta[]) => void
  setLevel: (level: GeoLevel) => void
  endDrilldown: (requestId: number) => void
  regionPathLabel: () => string
  activeFiltersSummary: () => string
}

const defaultTime = '2025-12'
const defaultMetric = 'dementia_risk_score'

export const useGeoOpsStore = create<GeoOpsState>((set, get) => ({
  time: defaultTime,
  metric: defaultMetric,
  level: 'nation',
  selectedSido: null,
  selectedSigungu: null,
  selectedRegion: null,
  selection: null,
  hoveredRegion: null,
  legend: { method: 'quantile', classes: 5 },
  regionMetaByCode: {},
  isDrillingDown: false,
  pendingRequestId: null,

  setMetric: (metric) => set({ metric }),
  setTime: (time) => set({ time }),
  setLevel: (level) => set({ level }),

  selectRegion: (code) => {
    const { level, regionMetaByCode } = get()

    if (!code) {
      set({ selectedRegion: null, selection: null })
      return
    }

    const selectionLevel: GeoLevel = level === 'nation' ? 'sido' : level
    const name = regionMetaByCode[code]?.region_name ?? null

    if (level === 'nation' || level === 'sido') {
      set({
        selectedSido: code,
        selectedSigungu: null,
        selectedRegion: code,
        selection: { code, name, level: selectionLevel },
      })
    } else if (level === 'sigungu') {
      set({
        selectedSigungu: code,
        selectedRegion: code,
        selection: { code, name, level: selectionLevel },
      })
    } else if (level === 'emd') {
      set({
        selectedRegion: code,
        selection: { code, name, level: selectionLevel },
      })
    }
  },

  selectRegionWithName: (code, name) => {
    const { level } = get()
    if (!code) {
      set({ selectedRegion: null, selection: null })
      return
    }
    const selectionLevel: GeoLevel = level === 'nation' ? 'sido' : level
    if (level === 'nation' || level === 'sido') {
      set({ selectedSido: code, selectedSigungu: null, selectedRegion: code, selection: { code, name, level: selectionLevel } })
    } else if (level === 'sigungu') {
      set({ selectedSigungu: code, selectedRegion: code, selection: { code, name, level: selectionLevel } })
    } else {
      set({ selectedRegion: code, selection: { code, name, level: selectionLevel } })
    }
  },

  hoverRegion: (code) => set({ hoveredRegion: code }),

  drillDownFromMap: (code, name) => {
    const { level } = get()
    const requestId = Date.now()

    if (level === 'nation' || level === 'sido') {
      set({
        level: 'sigungu',
        selectedSido: code,
        selectedSigungu: null,
        selectedRegion: null,
        selection: { code, name, level: 'sido' },
        isDrillingDown: true,
        pendingRequestId: requestId,
      })
      return requestId
    }

    if (level === 'sigungu') {
      set({
        level: 'emd',
        selectedSigungu: code,
        selectedRegion: code,
        selection: { code, name, level: 'emd' },
        isDrillingDown: true,
        pendingRequestId: requestId,
      })
      return requestId
    }

    set({ selectedRegion: code, selection: { code, name, level } })
    return null
  },

  drillDown: () => {
    const { level, selectedSido, selectedSigungu } = get()
    if ((level === 'nation' || level === 'sido') && selectedSido) {
      set({
        level: 'sigungu',
        selectedRegion: null,
      })
    } else if (level === 'sigungu' && selectedSigungu) {
      set({
        level: 'emd',
        selectedRegion: null,
      })
    }
  },

  drillUp: () => {
    const { level, selectedSido, selectedSigungu } = get()
    if (level === 'emd') {
      set({
        level: 'sigungu',
        selectedRegion: selectedSigungu,
      })
    } else if (level === 'sigungu') {
      set({
        level: 'sido',
        selectedRegion: selectedSido,
      })
    } else if (level === 'sido') {
      set({
        level: 'nation',
        selectedRegion: selectedSido,
      })
    }
  },

  endDrilldown: (requestId) => {
    const { pendingRequestId } = get()
    if (pendingRequestId === requestId) {
      set({ isDrillingDown: false, pendingRequestId: null })
    }
  },

  setRegionMeta: (meta) => {
    const map: Record<string, RegionMeta> = { ...get().regionMetaByCode }
    meta.forEach((m) => {
      map[m.region_code] = m
    })
    set({ regionMetaByCode: map })
  },

  regionPathLabel: () => {
    const { level, selectedSido, selectedSigungu, selectedRegion, regionMetaByCode } = get()
    const sidoName = selectedSido ? regionMetaByCode[selectedSido]?.region_name ?? selectedSido : '시도'
    const sigunguName = selectedSigungu ? regionMetaByCode[selectedSigungu]?.region_name ?? selectedSigungu : '시군구'
    const eupName = selectedRegion ? regionMetaByCode[selectedRegion]?.region_name ?? selectedRegion : '읍면동'

    if (level === 'nation') {
      return '전국'
    }
    if (level === 'sido') {
      return `전국 → ${sidoName}`
    }
    if (level === 'sigungu') {
      return `전국 → ${sidoName} → ${sigunguName}`
    }
    return `전국 → ${sidoName} → ${sigunguName} → ${eupName}`
  },

  activeFiltersSummary: () => {
    const { time, metric } = get()
    const regionPath = get().regionPathLabel().replace(/→/g, '·')
    const metricLabel = metricLabels[metric] ?? metric
    return `${time} · ${metricLabel} · ${regionPath}`
  },
}))
