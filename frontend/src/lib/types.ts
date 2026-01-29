export type RegionLevel = 'nation' | 'sido' | 'sigungu' | 'eupmyeon'
export type MetricType = 'risk_score' | 'prevalence' | 'screening_coverage' | 'referral_backlog' | 'capacity_util'

export type TimeRange = { start: string; end: string }

export type KPIResponse = {
  data: Array<{
    region_code: string
    region_name: string
    metric: MetricType
    value: number
    unit: string
    change_rate?: number
    percentile?: number
    status?: 'normal' | 'warning' | 'critical'
    timestamp: string
  }>
  metadata: { computed_at: string; data_source: string }
}

export type TrendResponse = {
  region_code: string
  region_name: string
  metric: MetricType
  period: string
  data: Array<{ timestamp: string; value: number; moving_avg?: number }>
}

export type DistributionResponse = {
  region_code: string
  region_name: string
  metric: MetricType
  dimension: string
  total: number
  data: Array<{ label: string; count: number; percentage: number }>
}

export type RankingResponse = {
  metric: MetricType
  level: RegionLevel
  timestamp: string
  top_10: Array<{ rank: number; region_code: string; region_name: string; value: number; percentile: number; status: string }>
  bottom_10: Array<{ rank: number; region_code: string; region_name: string; value: number; percentile: number; status: string }>
}

export type GeoCollection = {
  type: 'FeatureCollection'
  features: Array<{
    type: 'Feature'
    properties: Record<string, any>
    geometry: { type: string; coordinates: any }
  }>
}
