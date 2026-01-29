import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Button } from '../../../components/ui/button'
import { useGeoStore } from '../store/useGeoStore'
import LegendEditor from './LegendEditor'
import Breadcrumb from './Breadcrumb'

const metricOptions = [
  { value: 'risk_score', label: '치매 위험 스코어' },
  { value: 'elderly_ratio', label: '고령인구 비율' },
  { value: 'screening_rate', label: '선별검사율' },
]

const timeOptions = ['2025-09', '2025-10', '2025-11', '2025-12']

const levelLabel: Record<string, string> = {
  nation: '전국 (시도)',
  sido: '시도',
  sigungu: '시군구',
  eup: '읍면동',
}

export default function ControlsPanel() {
  const { metric, time, setMetric, setTime, drillDown, drillUp, level, regionCode } = useGeoStore()

  const canDrillDown = (level === 'nation' || level === 'sido' || level === 'sigungu') && !!regionCode
  const canDrillUp = level === 'sigungu' || level === 'eup'

  return (
    <div className="flex h-full flex-col gap-3 text-sm">
      {/* 지표 및 기간 선택 */}
      <div className="space-y-3 bg-white rounded-lg p-3 border border-slate-200">
        <div>
          <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">현재 레벨</div>
          <div className="inline-block bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full text-xs font-medium">
            {levelLabel[level]}
          </div>
        </div>

        <div className="border-t border-slate-200 pt-3">
          <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide block mb-2">지표</label>
          <Select value={metric} onValueChange={setMetric}>
            <SelectTrigger className="bg-slate-50 border-slate-300">
              <SelectValue placeholder="지표 선택" />
            </SelectTrigger>
            <SelectContent>
              {metricOptions.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide block mb-2">기간</label>
          <Select value={time} onValueChange={setTime}>
            <SelectTrigger className="bg-slate-50 border-slate-300">
              <SelectValue placeholder="기간 선택" />
            </SelectTrigger>
            <SelectContent>
              {timeOptions.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 드릴다운 제어 */}
      <div className="space-y-2 bg-white rounded-lg p-3 border border-slate-200">
        <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide">상세 보기</div>
        <div className="space-y-2">
          <Button
            variant={canDrillDown ? 'default' : 'outline'}
            size="sm"
            disabled={!canDrillDown}
            onClick={drillDown}
            className="w-full justify-start"
          >
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            상세 보기
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!canDrillUp}
            onClick={drillUp}
            className="w-full justify-start"
          >
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z" />
            </svg>
            돌아가기
          </Button>
        </div>
      </div>

      {/* 내비게이션 */}
      <div className="bg-white rounded-lg p-3 border border-slate-200">
        <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">경로</div>
        <Breadcrumb />
      </div>

      {/* 범례 편집기 */}
      <div className="flex-1">
        <LegendEditor />
      </div>
    </div>
  )
}
