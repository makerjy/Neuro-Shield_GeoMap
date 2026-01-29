import { useEffect, useMemo, useRef, useState } from 'react'
import maplibregl, { Map as MaplibreMap } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { KPIRecord, GeoLevel } from '../api/geoApi'
import { useGeoOpsStore } from '../store/useGeoOpsStore'
import { joinAudit } from '../utils/joinAudit'
import { bboxFromFeatures, bboxToMapBounds } from '../utils/bbox'
import Tooltip from './Tooltip'

const COLORS = ['#e6f0ff', '#c9ddff', '#9cc2ff', '#6aa5ff', '#3b82f6']

function buildFillExpression(breaks: number[]) {
  return [
    'case',
    ['==', ['feature-state', 'value'], null],
    '#e5e7eb',
    [
      'step',
      ['feature-state', 'value'],
      COLORS[0],
      ...breaks.flatMap((b, i) => [b, COLORS[Math.min(i + 1, COLORS.length - 1)]]),
    ],
  ]
}

const GEO_PATHS: Record<GeoLevel, string> = {
  nation: '/geo/normalized/sido.geojson',
  sido: '/geo/normalized/sido.geojson',
  sigungu: '/geo/normalized/sigungu.geojson',
  emd: '/geo/normalized/eupmyeon.geojson',
}

type GeoFeature = {
  type: 'Feature'
  id?: string
  properties?: Record<string, any>
  geometry?: {
    type: string
    coordinates: any
  }
}

type GeoCollection = {
  type: 'FeatureCollection'
  features: GeoFeature[]
}

export default function MapPanel({
  kpiRecords,
  breaks,
}: {
  kpiRecords: KPIRecord[]
  breaks: number[]
}) {
  const mapRef = useRef<MaplibreMap | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const geoCache = useRef<Record<string, GeoCollection>>({})
  const featureIndex = useRef<Record<string, GeoFeature>>({})
  const hoveredRef = useRef<string | null>(null)
  const selectedRef = useRef<string | null>(null)
  const [tooltip, setTooltip] = useState<{ x: number; y: number; code: string } | null>(null)

  const {
    level,
    selectedSido,
    selectedSigungu,
    selectedRegion,
    hoveredRegion,
    selectRegion,
    hoverRegion,
    setRegionMeta,
    drillDown,
    drillUp,
  } = useGeoOpsStore()

  const kpiLookup = useMemo(() => {
    const map: Record<string, KPIRecord> = {}
    kpiRecords.forEach((r) => {
      map[String(r.region_code)] = r
    })
    return map
  }, [kpiRecords])

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {},
        layers: [{ id: 'bg', type: 'background', paint: { 'background-color': '#f8fafc' } }],
      },
      center: [127.7, 36.2],
      zoom: 6,
      minZoom: 4,
      maxZoom: 13,
    })

    mapRef.current = map
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    let cancelled = false

    const load = async () => {
      const path = GEO_PATHS[level]
      if (!path) return

      // 다른 레벨의 캐시도 미리 로드
      for (const [lvl, p] of Object.entries(GEO_PATHS)) {
        if (!geoCache.current[p]) {
          const res = await fetch(p)
          if (!res.ok) throw new Error(`GeoJSON load failed for ${lvl}: ${res.status}`)
          geoCache.current[p] = (await res.json()) as GeoCollection
        }
      }

      if (cancelled) return

      const raw = geoCache.current[path]

      // 필터링 로직: 선택된 상위 지역의 코드로 자식 지역 필터링
      const filtered = raw.features.filter((f) => {
        const fCode = String(f.properties?.region_code ?? '')
        
        if (level === 'nation' || level === 'sido') {
          return true // 시도는 전체 반환
        }
        
        if (level === 'sigungu') {
          // 시군구: selectedSido가 있으면 그것의 첫 2자리로 필터링
          if (!selectedSido) return false
          return fCode.startsWith(selectedSido)
        }
        
        if (level === 'emd') {
          // 읍면동: selectedSigungu가 있으면 그것의 첫 5자리로 필터링
          if (!selectedSigungu) return false
          return fCode.startsWith(selectedSigungu)
        }
        
        return false
      })

      const data: GeoCollection = {
        type: 'FeatureCollection',
        features: filtered,
      }

      featureIndex.current = {}
      filtered.forEach((f) => {
        const code = String(f.properties?.region_code ?? '')
        if (code) featureIndex.current[code] = f
      })

      setRegionMeta(
        filtered.map((f) => ({
          region_code: String(f.properties?.region_code ?? ''),
          region_name: String(f.properties?.region_name ?? f.properties?.name ?? ''),
          parent_code: (f.properties?.parent_code ?? null) as string | null,
          level,
        }))
      )

      if (!map.getSource('regions')) {
        map.addSource('regions', {
          type: 'geojson',
          data,
          promoteId: 'region_code',
        })

        map.addLayer({
          id: 'regions-fill',
          type: 'fill',
          source: 'regions',
          paint: {
            'fill-color': buildFillExpression(breaks) as any,
            'fill-opacity': 0.9,
          },
        } as any)

        map.addLayer({
          id: 'regions-line',
          type: 'line',
          source: 'regions',
          paint: {
            'line-color': '#94a3b8',
            'line-width': [
              'case',
              ['boolean', ['feature-state', 'selected'], false],
              2,
              ['boolean', ['feature-state', 'hovered'], false],
              1.5,
              0.6,
            ],
          },
        } as any)

        map.addLayer({
          id: 'regions-labels',
          type: 'symbol',
          source: 'regions',
          layout: {
            'text-field': ['get', 'region_name'],
            'text-size': 11,
            'text-allow-overlap': false,
          },
          paint: {
            'text-color': '#334155',
            'text-halo-color': '#f8fafc',
            'text-halo-width': 1,
          },
        } as any)

        map.on('mousemove', 'regions-fill', (e) => {
          const f = e.features?.[0] as GeoFeature | undefined
          if (!f) return
          const code = String(f.properties?.region_code)
          hoverRegion(code)
          setTooltip({ x: e.point.x, y: e.point.y, code })
        })

        map.on('mouseleave', 'regions-fill', () => {
          hoverRegion(null)
          setTooltip(null)
        })

        map.on('click', 'regions-fill', (e) => {
          const f = e.features?.[0] as GeoFeature | undefined
          if (!f) return
          const code = String(f.properties?.region_code)
          selectRegion(code)
        })
      } else {
        const source = map.getSource('regions') as maplibregl.GeoJSONSource
        source.setData(data as any)
        map.setPaintProperty('regions-fill', 'fill-color', buildFillExpression(breaks) as any)
      }

      const bbox = bboxFromFeatures(filtered)
      map.fitBounds(bboxToMapBounds(bbox), { padding: 40 })
    }

    load().catch((err) => {
      throw err
    })

    return () => {
      cancelled = true
    }
  }, [level, selectedSido, selectedSigungu, breaks, setRegionMeta, hoverRegion, selectRegion])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (!map.getSource('regions')) return

    const features = Object.values(featureIndex.current)
    if (!features.length) return
    joinAudit(features, kpiRecords)

    const lookup = new globalThis.Map(kpiRecords.map((k) => [String(k.region_code), k]))
    features.forEach((f) => {
      const code = String(f.properties?.region_code ?? '')
      const kpi = lookup.get(code)
      map.setFeatureState({ source: 'regions', id: code }, {
        value: kpi?.value ?? null,
        status: kpi?.status ?? null,
        percentile: kpi?.percentile ?? null,
      })
    })
  }, [kpiRecords])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    if (hoveredRef.current && hoveredRef.current !== hoveredRegion) {
      map.setFeatureState({ source: 'regions', id: hoveredRef.current }, { hovered: false })
    }

    if (hoveredRegion) {
      map.setFeatureState({ source: 'regions', id: hoveredRegion }, { hovered: true })
      hoveredRef.current = hoveredRegion
    } else {
      hoveredRef.current = null
    }
  }, [hoveredRegion])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    if (selectedRef.current && selectedRef.current !== selectedRegion) {
      map.setFeatureState({ source: 'regions', id: selectedRef.current }, { selected: false })
    }

    if (selectedRegion) {
      map.setFeatureState({ source: 'regions', id: selectedRegion }, { selected: true })
      selectedRef.current = selectedRegion

      const feature = featureIndex.current[selectedRegion]
      if (feature) {
        const bbox = bboxFromFeatures([feature])
        map.fitBounds(bboxToMapBounds(bbox), { padding: 40, maxZoom: 10 })
      }
    }
  }, [selectedRegion])

  const tooltipData = tooltip ? kpiLookup[tooltip.code] : null

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      <div className="absolute right-4 top-4 flex flex-col gap-2 rounded bg-white/90 p-2 text-xs shadow">
        {(level === 'nation' || level === 'sido') && selectedSido && (
          <button className="rounded bg-blue-600 px-2 py-1 text-white" onClick={drillDown}>
            시군구 보기
          </button>
        )}
        {level === 'sigungu' && selectedSigungu && (
          <button className="rounded bg-blue-600 px-2 py-1 text-white" onClick={drillDown}>
            읍면동 보기
          </button>
        )}
        {level !== 'nation' && (
          <button className="rounded border border-slate-200 px-2 py-1 text-slate-700" onClick={drillUp}>
            뒤로(상위)
          </button>
        )}
      </div>
      {tooltip && tooltipData && (
        <Tooltip
          x={tooltip.x}
          y={tooltip.y}
          name={tooltipData.region_name}
          value={tooltipData.value}
          computedAt={tooltipData.computed_at}
        />
      )}
    </div>
  )
}
