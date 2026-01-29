import React, { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { useGeoStore } from '../store/useGeoStore'

export default function RankingPanel() {
  const { kpiRecords, loading, error, selectRegion, hoverRegion, regionCode } = useGeoStore()

  const { top5, bottom5 } = useMemo(() => {
    const valid = kpiRecords.filter((r) => r.value !== null)
    const sorted = [...valid].sort((a, b) => (b.value as number) - (a.value as number))
    return {
      top5: sorted.slice(0, 5),
      bottom5: sorted.slice(-5).reverse(),
    }
  }, [kpiRecords])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical':
        return 'bg-red-50 text-red-700 border-l-4 border-red-500'
      case 'warning':
        return 'bg-yellow-50 text-yellow-700 border-l-4 border-yellow-500'
      default:
        return 'bg-green-50 text-green-700 border-l-4 border-green-500'
    }
  }

  const getStatusBadgeColor = (status: string) => {
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

  const RankingItem = ({ rank, item, isSelected, onHover, onLeave, onClick }: any) => (
    <li
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={onClick}
      className={`flex items-center gap-2 rounded p-2 cursor-pointer transition-colors ${
        isSelected ? 'bg-blue-100 border-l-4 border-blue-500' : `${getStatusColor(item.status)} hover:shadow`
      }`}
    >
      <div className="w-6 h-6 rounded-full bg-slate-300 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
        {rank}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{item.region_name}</div>
        <div className="text-xs text-slate-500">{item.value}</div>
      </div>
      <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium flex-shrink-0 ${getStatusBadgeColor(item.status)}`}>
        {getStatusLabel(item.status)}
      </span>
    </li>
  )

  return (
    <Card className="flex-1 bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">순위</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-600 py-4">
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
            <div className="space-y-1">
              <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide px-2">상위 5개</div>
              <ul className="space-y-1">
                {top5.map((r, idx) => (
                  <RankingItem
                    key={r.region_code}
                    rank={idx + 1}
                    item={r}
                    isSelected={regionCode === r.region_code}
                    onHover={() => hoverRegion(r.region_code)}
                    onLeave={() => hoverRegion(null)}
                    onClick={() => selectRegion(r.region_code)}
                  />
                ))}
              </ul>
            </div>

            <div className="border-t border-slate-300" />

            <div className="space-y-1">
              <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide px-2">하위 5개</div>
              <ul className="space-y-1">
                {bottom5.map((r, idx) => (
                  <RankingItem
                    key={r.region_code}
                    rank={6 + idx}
                    item={r}
                    isSelected={regionCode === r.region_code}
                    onHover={() => hoverRegion(r.region_code)}
                    onLeave={() => hoverRegion(null)}
                    onClick={() => selectRegion(r.region_code)}
                  />
                ))}
              </ul>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
