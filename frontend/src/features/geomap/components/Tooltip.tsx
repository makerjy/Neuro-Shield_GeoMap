import React from 'react'
import type { KPIRecord } from '../api/geoApi'

interface Props {
  record?: KPIRecord
}

export default function Tooltip({ record }: Props) {
  if (!record) return null

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical':
        return 'bg-red-100 text-red-700'
      case 'warning':
        return 'bg-yellow-100 text-yellow-700'
      default:
        return 'bg-green-100 text-green-700'
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
    <div className="rounded-lg border border-slate-200 bg-white shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-2">
        <div className="font-semibold text-sm">{record.region_name}</div>
      </div>
      <div className="px-3 py-2 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-600">지표값</span>
          <span className="font-semibold text-sm text-blue-600">{record.value ?? 'N/A'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-600">변화율</span>
          <span className={`font-semibold text-xs ${record.change_rate >= 0 ? 'text-red-600' : 'text-green-600'}`}>
            {record.change_rate >= 0 ? '+' : ''}{record.change_rate.toFixed(1)}%
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-600">백분위수</span>
          <span className="font-semibold text-xs text-blue-600">{record.percentile}%</span>
        </div>
        <div className="pt-1 border-t border-slate-200">
          <div className={`rounded px-2 py-1 text-center font-medium text-xs ${getStatusColor(record.status)}`}>
            {getStatusLabel(record.status)}
          </div>
        </div>
        <div className="text-[10px] text-slate-400 pt-1">
          {new Date(record.computed_at).toLocaleString('ko-KR')}
        </div>
      </div>
    </div>
  )
}
