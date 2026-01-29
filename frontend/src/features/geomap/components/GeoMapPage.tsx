import React from 'react'
import ControlsPanel from './ControlsPanel'
import MapPanel from './MapPanel'
import RankingPanel from './RankingPanel'
import SelectionSummary from './SelectionSummary'

export default function GeoMapPage() {
  return (
    <div className="h-full w-full bg-gradient-to-br from-slate-100 to-slate-200">
      <div className="grid h-full grid-cols-[280px_1fr_320px] gap-4 p-4">
        {/* 좌측 패널: 컨트롤 */}
        <div className="flex flex-col gap-4 overflow-y-auto">
          <div className="rounded-lg bg-white shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3">
              <h1 className="text-base font-bold">지오맵 대시보드</h1>
              <p className="text-xs text-blue-100 mt-1">한국 지역 KPI 분석</p>
            </div>
            <div className="p-3">
              <ControlsPanel />
            </div>
          </div>
        </div>

        {/* 중앙: 지도 */}
        <div className="flex flex-col">
          <MapPanel />
        </div>

        {/* 우측 패널: 선택/순위 */}
        <div className="flex h-full flex-col gap-4 overflow-y-auto">
          <SelectionSummary />
          <RankingPanel />
        </div>
      </div>
    </div>
  )
}
