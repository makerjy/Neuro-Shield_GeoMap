import { Card } from '../../../components/ui/card'
import { useGeoOpsStore } from '../store/useGeoOpsStore'
import type { KPIRecord } from '../api/geoApi'
import { formatNumber, metricOptions, metricLabels } from '../utils/normalizers'

export default function LeftPanel({
  kpiRecords,
  metricSummary,
}: {
  kpiRecords: KPIRecord[]
  metricSummary: Record<string, { value: number | null; change_rate: number | null; percentile: number | null; avg: number | null }>
}) {
  const { level, metric, setMetric, regionPathLabel, selection } = useGeoOpsStore()

  const values = kpiRecords.map((r) => r.value).filter((v): v is number => typeof v === 'number')
  const max = values.length ? Math.max(...values) : null
  const min = values.length ? Math.min(...values) : null
  const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : null

  const levelLabel = level === 'nation' ? '전국' : level === 'sido' ? '시도' : level === 'sigungu' ? '시군구' : '읍면동'

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-700">{regionPathLabel()}</div>
        <span className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700">{levelLabel}</span>
      </div>

      <Card className="border border-slate-100 bg-slate-50 p-3 text-center">
        <div className="text-xs text-slate-500">최대값</div>
        <div className="mt-1 text-2xl font-semibold text-rose-500">{formatNumber(max)}</div>
        <div className="text-[10px] text-slate-400">명</div>
      </Card>

      <Card className="border border-slate-100 bg-slate-50 p-3 text-center">
        <div className="text-xs text-slate-500">평균값</div>
        <div className="mt-1 text-2xl font-semibold text-blue-600">{formatNumber(avg)}</div>
        <div className="text-[10px] text-slate-400">명</div>
      </Card>

      <Card className="border border-slate-100 bg-slate-50 p-3 text-center">
        <div className="text-xs text-slate-500">최소값</div>
        <div className="mt-1 text-2xl font-semibold text-slate-700">{formatNumber(min)}</div>
        <div className="text-[10px] text-slate-400">명</div>
      </Card>

      <div className="mt-2">
        <div className="mb-2 text-xs font-semibold text-slate-600">선택 지역 KPI</div>
        <div className="grid grid-cols-1 gap-2">
          {metricOptions.map((m) => {
            const summary = metricSummary[m.key] ?? { value: null, change_rate: null, percentile: null, avg: null }
            const delta = summary.avg != null && summary.value != null ? summary.value - summary.avg : null
            const percentile = summary?.percentile
            const active = metric === m.key
            return (
              <button
                key={m.key}
                onClick={() => setMetric(m.key)}
                className={`rounded border p-2 text-left text-xs transition ${
                  active ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">{metricLabels[m.key]}</span>
                  {percentile !== null && percentile !== undefined ? (
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">상위 {100 - Math.min(99, Math.max(1, Math.round(percentile)))}%</span>
                  ) : (
                    <span className="text-[10px] text-slate-400">퍼센타일 없음</span>
                  )}
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-800">{formatNumber(summary?.value ?? null)}</span>
                  <span className="text-[10px] text-slate-500">
                    Δ {summary?.change_rate !== null && summary?.change_rate !== undefined ? `${summary.change_rate.toFixed(1)}%` : '-'}
                  </span>
                </div>
                <div className="mt-1 text-[10px] text-slate-500">
                  {selection ? '선택 지역 vs 전국 평균' : '전국 평균 대비'} · Δ {formatNumber(delta)}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-2 text-xs font-semibold text-slate-600">지표 선택</div>
        <div className="flex flex-col gap-2">
          {metricOptions.map((m) => (
            <label key={m.key} className="flex cursor-pointer items-center gap-2 rounded border border-slate-200 bg-white px-2 py-2 text-sm transition hover:border-blue-200 hover:bg-blue-50/40">
              <input
                type="radio"
                checked={metric === m.key}
                onChange={() => setMetric(m.key)}
                className="h-3 w-3"
              />
              <span className="text-slate-700">{m.label}</span>
            </label>
          ))}
        </div>
      </div>

      <Card className="mt-4 border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
        <div className="font-semibold">사용 안내</div>
        <ul className="mt-2 list-disc pl-4">
          <li>지도를 클릭하면 지역 상세정보를 확인할 수 있습니다.</li>
          <li>지표를 선택하면 다양한 데이터를 시각화합니다.</li>
          <li>우측 패널에서 상위/하위 지역 정보를 확인하세요.</li>
        </ul>
      </Card>
    </div>
  )
}
