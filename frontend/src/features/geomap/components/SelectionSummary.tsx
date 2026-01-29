import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { useGeoStore } from '../store/useGeoStore'

export default function SelectionSummary() {
  const { regionCode, metric, time, computedAt, kpiRecords, loading, error } = useGeoStore()
  const record = kpiRecords.find((r) => r.region_code === regionCode)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-300'
      case 'warning':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300'
      default:
        return 'bg-green-100 text-green-700 border-green-300'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'critical':
        return '위험'
      case 'warning':
        return '주의'
      default:
        return '정상'
    }
  }

  return (
    <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">선택 현황</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            로딩 중...
          </div>
        )}
        {error && (
          <div className="rounded bg-red-50 p-2 text-xs text-red-600 border border-red-200">
            {error}
          </div>
        )}
        {!loading && !error && (
          <>
            {!record && (
              <div className="text-center py-4 text-slate-500 text-sm">
                <svg className="h-8 w-8 mx-auto mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                </svg>
                지도에서 지역을 선택하세요
              </div>
            )}
            {record && (
              <>
                <div className="border-t border-slate-300 pt-2">
                  <div className="text-sm font-semibold text-slate-900 mb-1">{record.region_name}</div>
                  <div className="text-2xl font-bold text-blue-600">{record.value}</div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white rounded p-2 border border-slate-200">
                    <div className="text-slate-500 mb-0.5">변화율</div>
                    <div className={`font-semibold ${record.change_rate >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {record.change_rate >= 0 ? '+' : ''}{record.change_rate.toFixed(1)}%
                    </div>
                  </div>
                  <div className="bg-white rounded p-2 border border-slate-200">
                    <div className="text-slate-500 mb-0.5">백분위수</div>
                    <div className="font-semibold text-blue-600">{record.percentile}%</div>
                  </div>
                </div>

                <div className={`rounded px-2 py-1.5 border text-center font-medium text-xs ${getStatusColor(record.status)}`}>
                  {getStatusLabel(record.status)}
                </div>

                <div className="text-xs text-slate-500 space-y-0.5 bg-white rounded p-2 border border-slate-200">
                  <div><span className="font-medium">지표:</span> {metric}</div>
                  <div><span className="font-medium">기간:</span> {time}</div>
                  {computedAt && (
                    <div><span className="font-medium">산출:</span> {new Date(computedAt).toLocaleString('ko-KR')}</div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
