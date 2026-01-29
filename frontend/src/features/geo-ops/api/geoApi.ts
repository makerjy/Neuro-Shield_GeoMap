export type GeoLevel = 'nation' | 'sido' | 'sigungu' | 'emd'

export type KPIRecord = {
  region_code: string
  region_name: string
  value: number | null
  change_rate?: number | null
  percentile?: number | null
  status?: 'normal' | 'warning' | 'critical'
  computed_at: string
}

export type RankingResponse = {
  top: Array<{ region_code: string; region_name: string; value: number | null }>
  bottom: Array<{ region_code: string; region_name: string; value: number | null }>
}

export type TrendPoint = {
  time: string
  value: number | null
}

const API_BASE = ''

// 테스트용 목 KPI 데이터 캐시
const mockKpiCache: Record<string, KPIRecord[]> = {}

/**
 * 정규화된 GeoJSON을 로드하여 모든 지역에 대해 목 KPI 데이터를 생성합니다.
 */
const levelToMockPath: Record<GeoLevel, string> = {
  nation: '/geo/normalized/sido.geojson',
  sido: '/geo/normalized/sido.geojson',
  sigungu: '/geo/normalized/sigungu.geojson',
  emd: '/geo/normalized/eupmyeon.geojson',
}

const levelToApi: Record<GeoLevel, string> = {
  nation: 'sido',
  sido: 'sido',
  sigungu: 'sigungu',
  emd: 'eupmyeondong',
}

async function generateMockKpiData(level: GeoLevel): Promise<KPIRecord[]> {
  const cacheKey = level
  if (mockKpiCache[cacheKey]) {
    return mockKpiCache[cacheKey]
  }

  const path = levelToMockPath[level]

  try {
    const res = await fetch(path)
    if (!res.ok) throw new Error(`Failed to load ${path}`)

    const data = (await res.json()) as any
    const records: KPIRecord[] = data.features.map((f: any) => {
      const code = String(f.properties?.region_code ?? '')
      const name = String(f.properties?.region_name ?? '')
      // Hash-based pseudo-random value (deterministic for same region_code)
      const hash = code.split('').reduce((a: number, b: string) => a + b.charCodeAt(0), 0)
      const value = 30 + ((hash % 70) / 100) * 70 // 30-100 range
      const percentile = Math.floor((value / 100) * 100)
      const status = percentile < 33 ? 'normal' : percentile < 66 ? 'warning' : 'critical'

      return {
        region_code: code,
        region_name: name,
        value,
        change_rate: (Math.random() - 0.5) * 5,
        percentile,
        status,
        computed_at: new Date().toISOString(),
      }
    })

    mockKpiCache[cacheKey] = records
    return records
  } catch (err) {
    console.error(`Failed to generate mock KPI for ${level}:`, err)
    return []
  }
}

export async function fetchKpi(params: { level: GeoLevel; metric: string; time: string }): Promise<KPIRecord[]> {
  try {
    const query = new URLSearchParams({
      level: levelToApi[params.level],
      metric: params.metric,
      time: params.time,
    })

    const res = await fetch(`${API_BASE}/api/geo/kpi?${query.toString()}`)
    if (res.ok) {
      const contentType = res.headers.get('content-type') ?? ''
      if (contentType.includes('application/json')) {
        const data = (await res.json()) as KPIRecord[]
        if (data.length > 0) {
          return data
        }
      }
    }
  } catch (err) {
    console.warn('API fetch failed, using mock data:', err)
  }

  // Fall back to mock data from GeoJSON
  return generateMockKpiData(params.level)
}

export async function fetchRanking(params: { level: GeoLevel; metric: string; time: string }): Promise<RankingResponse | null> {
  try {
    const query = new URLSearchParams({
      level: levelToApi[params.level],
      metric: params.metric,
      time: params.time,
    })

    const res = await fetch(`${API_BASE}/api/geo/ranking?${query.toString()}`)
    if (res.ok) {
      const contentType = res.headers.get('content-type') ?? ''
      if (contentType.includes('application/json')) {
        const data = (await res.json()) as RankingResponse
        return data
      }
    }
  } catch (err) {
    console.warn('Ranking API fetch failed:', err)
  }

  return null
}

export async function fetchTrend(params: { level: GeoLevel; metric: string; region_code: string }): Promise<TrendPoint[]> {
  try {
    const query = new URLSearchParams({
      level: levelToApi[params.level],
      metric: params.metric,
      region_code: params.region_code,
    })

    const res = await fetch(`${API_BASE}/api/geo/trend?${query.toString()}`)
    if (res.ok) {
      const contentType = res.headers.get('content-type') ?? ''
      if (contentType.includes('application/json')) {
        const data = (await res.json()) as TrendPoint[]
        return data
      }
    }
  } catch (err) {
    console.warn('Trend API fetch failed:', err)
  }

  return []
}

export function computeRankingFromKpi(kpi: KPIRecord[]): RankingResponse {
  const numeric = kpi.filter((r) => typeof r.value === 'number')
  const sorted = [...numeric].sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
  const top = sorted.slice(0, 20).map((r) => ({ region_code: r.region_code, region_name: r.region_name, value: r.value }))
  const bottom = [...sorted].reverse().slice(0, 20).map((r) => ({ region_code: r.region_code, region_name: r.region_name, value: r.value }))
  return { top, bottom }
}
