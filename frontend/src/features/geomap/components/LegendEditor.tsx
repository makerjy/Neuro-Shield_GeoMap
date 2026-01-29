import React, { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { useGeoStore } from '../store/useGeoStore'
import { buildBreaks } from '../utils/classification'

export default function LegendEditor() {
  const { legendConfig, setLegendConfig, kpiRecords } = useGeoStore()

  const preview = useMemo(() => {
    const values = kpiRecords.filter((r) => r.value !== null).map((r) => r.value as number)
    return buildBreaks(values, legendConfig.method, legendConfig.classes, legendConfig.breaks)
  }, [legendConfig, kpiRecords])

  const getColorForBreak = (index: number) => {
    const colors = ['#fee5d9', '#fcae91', '#fb6a4a', '#cb181d']
    return colors[Math.min(index, colors.length - 1)]
  }

  return (
    <Card className="bg-white border border-slate-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">범례 설정</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide block">분류 방식</label>
          <Select
            value={legendConfig.method}
            onValueChange={(value) => setLegendConfig({ ...legendConfig, method: value as any })}
          >
            <SelectTrigger className="bg-slate-50 border-slate-300">
              <SelectValue placeholder="방법 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="quantile">Quantile (분위수)</SelectItem>
              <SelectItem value="equal">Equal Interval (동일 간격)</SelectItem>
              <SelectItem value="custom">Custom (사용자 정의)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide block">클래스 수</label>
          <Select
            value={String(legendConfig.classes)}
            onValueChange={(value) => setLegendConfig({ ...legendConfig, classes: Number(value) })}
          >
            <SelectTrigger className="bg-slate-50 border-slate-300">
              <SelectValue placeholder="클래스" />
            </SelectTrigger>
            <SelectContent>
              {[3, 4, 5, 6, 7].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}개
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="pt-2 border-t border-slate-200">
          <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">미리보기</div>
          <div className="space-y-1">
            {preview.map((value, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div
                  className="h-6 w-8 rounded border border-slate-300"
                  style={{ backgroundColor: getColorForBreak(idx) }}
                />
                <span className="text-xs text-slate-600">{value.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
