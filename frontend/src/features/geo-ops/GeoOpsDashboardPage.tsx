import { useEffect, useMemo, useRef, useState } from 'react'
import { fetchKpi, fetchRanking, computeRankingFromKpi, fetchTrend, type KPIRecord, type RankingResponse, type TrendPoint } from './api/geoApi'
import { useGeoOpsStore } from './store/useGeoOpsStore'
import { filterKpiByParent, metricLabels, metricOptions } from './utils/normalizers'
import TopBar from './components/TopBar'
import LeftPanel from './components/LeftPanel'
import RmateMapPanel from './components/RmateMapPanel'
import RightPanel from './components/RightPanel'
import Legend from './components/Legend'

export default function GeoOpsDashboardPage() {
  const { level, metric, time, selectedSido, selectedSigungu, selection, setRegionMeta, isDrillingDown, pendingRequestId, endDrilldown } = useGeoOpsStore()
  const [kpiRecords, setKpiRecords] = useState<KPIRecord[]>([])
  const [ranking, setRanking] = useState<RankingResponse | null>(null)
  const [trendData, setTrendData] = useState<TrendPoint[]>([])
  const [metricSummary, setMetricSummary] = useState<Record<string, { value: number | null; change_rate: number | null; percentile: number | null; avg: number | null }>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const requestIdRef = useRef(0)

  useEffect(() => {
    const loadMeta = async () => {
      const pathMap: Record<string, string> = {
        nation: '/geo/normalized/sido.geojson',
        sido: '/geo/normalized/sido.geojson',
        sigungu: '/geo/normalized/sigungu.geojson',
        emd: '/geo/normalized/eupmyeon.geojson',
      }

      const path = pathMap[level]
      if (!path) return

      const res = await fetch(path)
      if (!res.ok) return
      const data = (await res.json()) as any
      const meta = (data.features ?? []).map((f: any) => ({
        region_code: String(f.properties?.region_code ?? ''),
        region_name: String(f.properties?.region_name ?? f.properties?.name ?? ''),
        parent_code: (f.properties?.parent_code ?? null) as string | null,
        level,
      }))
      setRegionMeta(meta)
    }

    loadMeta().catch(() => null)
  }, [level, setRegionMeta])

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      const requestId = pendingRequestId ?? Date.now()
      requestIdRef.current = requestId
      try {
        setLoading(true)
        setError(null)
        const kpi = await fetchKpi({ level, metric, time })
        const filtered = filterKpiByParent(kpi, level, selectedSido, selectedSigungu)

        if (cancelled || requestIdRef.current !== requestId) return
        setKpiRecords(filtered)

        const rankingRes = await fetchRanking({ level, metric, time })
        if (!cancelled && requestIdRef.current === requestId) {
          setRanking(rankingRes ?? computeRankingFromKpi(filtered))
        }
      } catch (err: any) {
        if (!cancelled && requestIdRef.current === requestId) setError(err?.message ?? '데이터 로드 실패')
      } finally {
        if (!cancelled && requestIdRef.current === requestId) {
          setLoading(false)
          if (pendingRequestId) endDrilldown(pendingRequestId)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [level, metric, time, selectedSido, selectedSigungu, pendingRequestId, endDrilldown])

  useEffect(() => {
    let cancelled = false
    const loadSummaries = async () => {
      const entries = await Promise.all(
        metricOptions.map(async (m) => {
          const kpi = await fetchKpi({ level, metric: m.key, time })
          const filtered = filterKpiByParent(kpi, level, selectedSido, selectedSigungu)
          const values = filtered.map((r) => r.value).filter((v): v is number => typeof v === 'number')
          const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : null
          const selected = selection ? filtered.find((r) => r.region_code === selection.code) : null
          return [m.key, {
            value: selected?.value ?? null,
            change_rate: selected?.change_rate ?? null,
            percentile: selected?.percentile ?? null,
            avg,
          }] as const
        })
      )

      if (cancelled) return
      const next: Record<string, { value: number | null; change_rate: number | null; percentile: number | null; avg: number | null }> = {}
      entries.forEach(([key, summary]) => {
        next[key] = summary
      })
      setMetricSummary(next)
    }

    loadSummaries().catch(() => setMetricSummary({}))
    return () => {
      cancelled = true
    }
  }, [level, time, selectedSido, selectedSigungu, selection])

  const values = useMemo(
    () => kpiRecords.map((r) => r.value).filter((v): v is number => typeof v === 'number'),
    [kpiRecords]
  )

  const min = values.length ? Math.min(...values) : null
  const max = values.length ? Math.max(...values) : null
  const metricLabel = metricLabels[metric] ?? metric
  const levelLabel = level === 'nation' ? '전국' : level === 'sido' ? '시도' : level === 'sigungu' ? '시군구' : '읍면동'

  const selectedRecord = selection ? kpiRecords.find((r) => r.region_code === selection.code) : null
  const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : null
  const compareData = selection && avg !== null && selectedRecord
    ? [
        { name: '선택', value: selectedRecord.value },
        { name: '전국 평균', value: avg },
      ]
    : []

  useEffect(() => {
    let cancelled = false
    const loadTrend = async () => {
      if (!selection?.code) {
        setTrendData([])
        return
      }
      const data = await fetchTrend({
        level: selection.level ?? level,
        metric,
        region_code: selection.code,
      })
      if (!cancelled) setTrendData(data)
    }
    loadTrend().catch(() => setTrendData([]))
    return () => {
      cancelled = true
    }
  }, [selection, metric, level])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <TopBar />

      <div className="mx-auto grid max-w-[1400px] grid-cols-[260px_1fr_280px] gap-4 px-4 py-4">
        <aside className="rounded bg-white p-3 shadow-sm">
          <LeftPanel kpiRecords={kpiRecords} metricSummary={metricSummary} />
        </aside>

        <main className="relative rounded bg-white p-2 shadow-sm">
          {error && (
            <div className="mb-2 rounded border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-600">
              {error}
            </div>
          )}
          <div className="mb-2 rounded border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700">
            지역을 클릭하면 상세 정보를 볼 수 있습니다. (지도 드릴다운 가능)
          </div>
          <div className="flex items-center justify-center py-2 text-sm font-semibold text-slate-700">
            {metricLabel} · {levelLabel} 통계
          </div>
          <div className="h-[640px]">
            <RmateMapPanel kpiRecords={kpiRecords} />
          </div>
          <Legend min={min} max={max} />
          {(loading || isDrillingDown) && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/60 text-sm text-slate-600">
              데이터 로딩 중...
            </div>
          )}
        </main>

        <aside className="max-h-[calc(100vh-120px)] overflow-y-auto rounded bg-white p-3 shadow-sm">
          <RightPanel kpiRecords={kpiRecords} ranking={ranking} trendData={trendData} compareData={compareData} />
        </aside>
      </div>
    </div>
  )
}
