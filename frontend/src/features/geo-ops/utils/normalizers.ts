import type { GeoLevel, KPIRecord } from '../api/geoApi'

export const metricOptions = [
  { key: 'dementia_risk_score', label: '치매 위험 스코어' },
  { key: 'elderly_population', label: '노인 인구수' },
  { key: 'facility_count', label: '의료 시설 수' },
  { key: 'total_population', label: '총 인구수' },
]

export const metricLabels = metricOptions.reduce<Record<string, string>>((acc, cur) => {
  acc[cur.key] = cur.label
  return acc
}, {})

export function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return '-'
  return new Intl.NumberFormat('ko-KR').format(value)
}

export function filterKpiByParent(
  kpi: KPIRecord[],
  level: GeoLevel,
  selectedSido: string | null,
  selectedSigungu: string | null
) {
  if (level === 'sigungu' && selectedSido) {
    return kpi.filter((r) => r.region_code.startsWith(selectedSido))
  }

  if (level === 'emd' && selectedSigungu) {
    return kpi.filter((r) => r.region_code.startsWith(selectedSigungu))
  }

  return kpi
}
