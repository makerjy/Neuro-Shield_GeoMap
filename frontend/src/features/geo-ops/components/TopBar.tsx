import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Button } from '../../../components/ui/button'
import { useGeoOpsStore } from '../store/useGeoOpsStore'
import { metricOptions } from '../utils/normalizers'

export default function TopBar() {
  const {
    level,
    time,
    metric,
    selectedSido,
    selectedSigungu,
    setMetric,
    setTime,
    setLevel,
    selectRegion,
    regionPathLabel,
    activeFiltersSummary,
  } = useGeoOpsStore()

  const levelLabel = level === 'nation' ? '전국' : level === 'sido' ? '시도' : level === 'sigungu' ? '시군구' : '읍면동'

  const handleBreadcrumbClick = (target: 'nation' | 'sido' | 'sigungu' | 'emd') => {
    if (target === 'nation') {
      setLevel('nation')
      return
    }
    if (target === 'sido') {
      setLevel('sido')
      if (selectedSido) selectRegion(selectedSido)
      return
    }
    if (target === 'sigungu') {
      setLevel('sigungu')
      if (selectedSigungu) selectRegion(selectedSigungu)
      return
    }
    if (target === 'emd') {
      setLevel('emd')
    }
  }

  return (
    <div className="sticky top-0 z-20 w-full border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <button className="hover:text-slate-900" onClick={() => handleBreadcrumbClick('nation')}>전국</button>
          <span className="text-slate-300">›</span>
          <button className="hover:text-slate-900" onClick={() => handleBreadcrumbClick('sido')}>시도</button>
          <span className="text-slate-300">›</span>
          <button className="hover:text-slate-900" onClick={() => handleBreadcrumbClick('sigungu')}>시군구</button>
          <span className="text-slate-300">›</span>
          <button className="hover:text-slate-900" onClick={() => handleBreadcrumbClick('emd')}>읍면동</button>
          <span className="ml-3 rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700">현재: {levelLabel}</span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Select value={metric} onValueChange={(v) => setMetric(v)}>
            <SelectTrigger className="h-9 w-[180px]">
              <SelectValue placeholder="지표 선택" />
            </SelectTrigger>
            <SelectContent>
              {metricOptions.map((m) => (
                <SelectItem key={m.key} value={m.key}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <input
            className="h-9 w-[120px] rounded border border-slate-200 px-2 text-sm"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            placeholder="YYYY-MM"
          />

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" disabled>
              PNG
            </Button>
            <Button size="sm" variant="outline" disabled>
              CSV
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] px-4 pb-2 text-xs text-slate-500">
        {activeFiltersSummary()}
      </div>
    </div>
  )
}
