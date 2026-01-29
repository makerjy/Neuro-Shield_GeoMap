import type { KPIRecord } from '../api/geoApi'

type GeoFeature = {
  properties?: {
    region_code?: string
  }
}

export function joinAudit(features: GeoFeature[], kpi: KPIRecord[]) {
  const geoCodes = features.map((f) => String(f.properties?.region_code ?? ''))
  const kpiCodes = kpi.map((k) => String(k.region_code))

  const geoSet = new Set(geoCodes)
  const kpiSet = new Set(kpiCodes)

  const matched = kpiCodes.filter((c) => geoSet.has(c))
  const missingGeo = geoCodes.filter((c) => !kpiSet.has(c))
  const unmatchedKpi = kpiCodes.filter((c) => !geoSet.has(c))

  console.log('[JOIN-AUDIT] geo feature count:', geoCodes.length)
  console.log('[JOIN-AUDIT] kpi row count:', kpiCodes.length)
  console.log('[JOIN-AUDIT] matched count:', matched.length)
  console.log('[JOIN-AUDIT] unmatched KPI sample:', unmatchedKpi.slice(0, 5))
  console.log('[JOIN-AUDIT] missing KPI sample:', missingGeo.slice(0, 5))

  if (matched.length < 0.9 * geoCodes.length) {
    throw new Error('Region code join mismatch: fix normalization or backend codes.')
  }
}
