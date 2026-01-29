import { useState } from 'react'
import { Card } from '../../../components/ui/card'
import type { KPIRecord, RankingResponse, TrendPoint } from '../api/geoApi'
import { useGeoOpsStore } from '../store/useGeoOpsStore'
import { formatNumber } from '../utils/normalizers'
import DistributionMiniChart from './DistributionMiniChart'
import TrendChart from './TrendChart'
import CompareChart from './CompareChart'

export default function RightPanel({
  kpiRecords,
  ranking,
  trendData,
  compareData,
}: {
  kpiRecords: KPIRecord[]
  ranking: RankingResponse | null
  trendData: TrendPoint[]
  compareData: Array<{ name: string; value: number | null }>
}) {
  const { hoveredRegion, selectedRegion, hoverRegion, selectRegion } = useGeoOpsStore()

  const values = kpiRecords.map((r) => r.value).filter((v): v is number => typeof v === 'number')
  const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : null

  const top = ranking?.top ?? []
  const bottom = ranking?.bottom ?? []
  const [mode, setMode] = useState<'top' | 'bottom'>('top')
  const list = mode === 'top' ? top : bottom
  const listLabel = mode === 'top' ? '상위 지역' : '하위 지역'
  const toneBorder = mode === 'top' ? 'border-blue-500 bg-blue-50' : 'border-rose-500 bg-rose-50'

  return (
    <div className="flex flex-col gap-3">
      <div className="text-sm font-semibold text-slate-700">상세 통계</div>

      <Card className="border border-slate-100 bg-slate-50 p-3">
        <div className="mb-2 text-xs font-semibold text-slate-600">분포도</div>
        <DistributionMiniChart values={values} />
      </Card>

      <Card className="border border-slate-100 bg-white p-3">
        <div className="mb-2 text-xs font-semibold text-slate-600">선택 지역 추세</div>
        <TrendChart data={trendData} />
      </Card>

      <Card className="border border-slate-100 bg-white p-3">
        <div className="mb-2 text-xs font-semibold text-slate-600">선택 지역 vs 전국 평균</div>
        <CompareChart data={compareData} />
      </Card>

      <Card className="border border-slate-100 bg-white p-3">
        <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-600">
          <span>{listLabel}</span>
          <div className="flex items-center gap-1 rounded border border-slate-200 bg-slate-50 p-0.5">
            <button
              className={`px-2 py-1 text-[10px] font-semibold ${mode === 'top' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}
              onClick={() => setMode('top')}
            >
              상위
            </button>
            <button
              className={`px-2 py-1 text-[10px] font-semibold ${mode === 'bottom' ? 'bg-rose-500 text-white' : 'text-slate-500'}`}
              onClick={() => setMode('bottom')}
            >
              하위
            </button>
          </div>
        </div>
        <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
          {list.map((r, idx) => {
            const delta = avg !== null && typeof r.value === 'number' ? r.value - avg : null
            return (
              <button
                key={r.region_code}
                className={`flex w-full items-center justify-between rounded border px-2 py-2 text-xs transition ${
                  selectedRegion === r.region_code ? toneBorder : 'border-slate-200'
                } ${hoveredRegion === r.region_code ? (mode === 'top' ? 'bg-blue-50/40' : 'bg-rose-50/40') : ''}`}
                onMouseEnter={() => hoverRegion(r.region_code)}
                onMouseLeave={() => hoverRegion(null)}
                onClick={() => selectRegion(r.region_code)}
              >
                <div className="flex items-center gap-2">
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">{idx + 1}</span>
                  <span className="truncate text-left text-slate-700">{r.region_name}</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-slate-700">{formatNumber(r.value)}</div>
                  <div className="text-[10px] text-slate-500">
                    Δ {delta === null ? '-' : formatNumber(delta)}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
