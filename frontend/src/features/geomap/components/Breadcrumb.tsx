import React from 'react'
import { useGeoStore } from '../store/useGeoStore'

const levelLabels: Record<string, string> = {
  nation: '전국',
  sido: '시도',
  sigungu: '시군구',
  eup: '읍면동',
}

export default function Breadcrumb() {
  const { level, regionPath } = useGeoStore()

  const parts = [{ label: '전국', level: 'nation' }]

  if (regionPath.sido) {
    parts.push({ label: `시도 (${regionPath.sido})`, level: 'sido' })
  }

  if ((level === 'sigungu' || level === 'eup') && regionPath.sigungu) {
    parts.push({ label: `시군구 (${regionPath.sigungu})`, level: 'sigungu' })
  }

  if (level === 'eup' && regionPath.eup) {
    parts.push({ label: `읍면동 (${regionPath.eup})`, level: 'eup' })
  }

  return (
    <div className="flex items-center gap-1 text-xs flex-wrap">
      {parts.map((part, idx) => (
        <React.Fragment key={idx}>
          {idx > 0 && <span className="text-slate-400 mx-0.5">›</span>}
          <span className={`px-1.5 py-0.5 rounded ${part.level === level ? 'bg-blue-100 text-blue-700 font-medium' : 'text-slate-600'}`}>
            {part.label}
          </span>
        </React.Fragment>
      ))}
    </div>
  )
}
