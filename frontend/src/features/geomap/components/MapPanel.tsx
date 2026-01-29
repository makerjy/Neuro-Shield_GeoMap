import React, { useEffect, useMemo, useRef, useState } from 'react'
import maplibregl, { Map } from 'maplibre-gl'
import { Card } from '../../../components/ui/card'
import { useGeoStore } from '../store/useGeoStore'
import { buildBreaks } from '../utils/classification'
import { featureBounds, toLookup } from '../utils/geo'
import { geoApi } from '../api/geoApi'
import type { KPIRecord } from '../api/geoApi'
import { loadAndExtractFromKorea, calculateBounds } from '../utils/geoLoader'
import { addOrUpdateGeoSource, addOrUpdateFillLayer, addOrUpdateLineLayer, addOrUpdateLabelLayer, fitToFeatures } from '../utils/mapLayers'
import Tooltip from './Tooltip'

const LEVEL_TO_GEO: Record<string, string> = {
  nation: '/korea.json',
  sido: '/korea.json',
  sigungu: '/korea.json',
  eup: '/korea.json',
}

const COLORS = ['#e6f0ff', '#c9ddff', '#9cc2ff', '#6aa5ff', '#3b82f6', '#1d4ed8', '#1e3a8a']

function buildFillColorExpression(breaks: number[]) {
  return [
    'case',
    ['==', ['get', 'value'], null],
    '#e5e7eb',
    [
      'step',
      ['get', 'value'],
      COLORS[0],
      ...breaks.flatMap((b, i) => [b, COLORS[Math.min(i + 1, COLORS.length - 1)]]),
    ],
  ] as any
}

export default function MapPanel() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<Map | null>(null)
  const geoCache = useRef<Record<string, any>>({})
  const hoveredRef = useRef<string | null>(null)
  const selectedRef = useRef<string | null>(null)
  const [tooltip, setTooltip] = useState<{ x: number; y: number; code: string } | null>(null)

  const {
    level,
    regionCode,
    regionPath,
    hoveredRegionCode,
    legendConfig,
    kpiRecords,
    setLoading,
    setError,
    setKpiData,
    setComputedAt,
    selectRegion,
    hoverRegion,
    metric,
    time,
    loading,
    error,
  } = useGeoStore()

  const kpiLookup = useMemo(() => toLookup(kpiRecords), [kpiRecords])
  const values = useMemo(
    () => kpiRecords.filter((r) => r.value !== null).map((r) => r.value as number),
    [kpiRecords]
  )
  const breaks = useMemo(() => buildBreaks(values, legendConfig.method, legendConfig.classes, legendConfig.breaks), [values, legendConfig])

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return
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
    async function fetchKpi() {
      try {
        setLoading(true)
        setError(undefined)
        const apiLevel = level === 'nation' ? 'sido' : (level as 'sido' | 'sigungu' | 'eup')
        const records = await geoApi.fetchKpi({ level: apiLevel, metric, time })
        setKpiData(records)
        setComputedAt(records[0]?.computed_at)
      } catch (err: any) {
        setError(err?.message || 'KPI load failed')
      } finally {
        setLoading(false)
      }
    }
    fetchKpi()
  }, [level, metric, time, setLoading, setError, setKpiData, setComputedAt])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    let cancelled = false

    const load = async () => {
      const geoPath = LEVEL_TO_GEO[level]
      if (!geoPath) return

      console.log(`[MapPanel] Loading geospatial data for level: ${level}`)

      try {
        // Load and extract dari korea.json
        const apiLevel = level === 'nation' ? 'sido' : (level as 'sido' | 'sigungu' | 'eup')
        const geoData = await loadAndExtractFromKorea(apiLevel, true)
        
        if (cancelled) return

        // Build feature data with KPI values
        const data = {
          ...geoData,
          features: geoData.features.map((f: any, idx: number) => {
            const props = f.properties || {}
            const region_code = String(props.region_code ?? props.code ?? props.CD ?? props.id ?? idx)
            const region_name = String(props.region_name ?? props.name ?? props.NAME ?? `Region-${idx + 1}`)
            const parent_code = props.parent_code ?? props.parent ?? props.PARENT
            const record = kpiLookup[region_code]
            return {
              ...f,
              properties: {
                ...props,
                region_code,
                region_name,
                ...(parent_code ? { parent_code: String(parent_code) } : {}),
                value: record?.value ?? null,
              },
            }
          }),
        }

        console.log(`[MapPanel] Loaded ${data.features.length} features, creating layers...`)

        // Calculate bounds for later fitting
        const bounds = calculateBounds(data)

        // Add or update source
        addOrUpdateGeoSource(map, 'regions', data, true)

        // Add or update layers
        if (!map.getLayer('regions-fill')) {
          console.log('[MapPanel] Creating fill layer')
          map.addLayer({
            id: 'regions-fill',
            type: 'fill',
            source: 'regions',
            paint: {
              'fill-color': buildFillColorExpression(breaks),
              'fill-opacity': [
                'case',
                ['boolean', ['feature-state', 'selected'], false],
                0.95,
                0.85,
              ],
            },
          })

          console.log('[MapPanel] Creating line layer')
          map.addLayer({
            id: 'regions-line',
            type: 'line',
            source: 'regions',
            paint: {
              'line-color': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                '#111827',
                '#64748b',
              ],
              'line-width': [
                'case',
                ['boolean', ['feature-state', 'selected'], false],
                2,
                ['boolean', ['feature-state', 'hover'], false],
                1.5,
                0.6,
              ],
            },
          })

          console.log('[MapPanel] Creating label layer')
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
              'text-color': [
                'case',
                ['boolean', ['feature-state', 'selected'], false],
                '#111827',
                '#334155',
              ],
              'text-halo-color': '#f8fafc',
              'text-halo-width': 1,
            },
          })

          // Add event handlers
          map.on('mousemove', 'regions-fill', (e) => {
            const f = e.features?.[0]
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
            const f = e.features?.[0]
            if (!f) return
            const code = String(f.properties?.region_code)
            selectRegion(code)
            const bounds = featureBounds(f)
            map.fitBounds(bounds, { padding: 40, maxZoom: 10 })
          })
        } else {
          console.log('[MapPanel] Updating existing layers')
          map.setPaintProperty('regions-fill', 'fill-color' as any, buildFillColorExpression(breaks) as any)
        }

        // Apply parent code filter for drill-down
        const filterParent = level === 'sigungu' ? regionPath.sido : level === 'eup' ? regionPath.sigungu : undefined
        if (filterParent) {
          console.log(`[MapPanel] Applying parent_code filter: ${filterParent}`)
          map.setFilter('regions-fill', ['==', ['get', 'parent_code'], filterParent])
          map.setFilter('regions-line', ['==', ['get', 'parent_code'], filterParent])
          map.setFilter('regions-labels', ['==', ['get', 'parent_code'], filterParent])
        } else {
          map.setFilter('regions-fill', null)
          map.setFilter('regions-line', null)
          map.setFilter('regions-labels', null)
        }

        // Fit to bounds and set label zoom range
        fitToFeatures(map, bounds, 40, true)
        const labelMinZoom = level === 'sigungu' || level === 'eup' ? 7 : 5
        map.setLayerZoomRange('regions-labels', labelMinZoom, 22)

        console.log('[MapPanel] Data loading completed successfully')
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error)
        console.error('[MapPanel] Error loading geospatial data:', msg)
        setError(`Geospatial data load failed: ${msg}`)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [level, regionPath.sido, regionPath.sigungu, kpiLookup, breaks, hoverRegion, selectRegion])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.getSource('regions')) return
    if (hoveredRef.current) {
      map.setFeatureState({ source: 'regions', id: hoveredRef.current }, { hover: false })
    }
    if (hoveredRegionCode) {
      map.setFeatureState({ source: 'regions', id: hoveredRegionCode }, { hover: true })
    }
    hoveredRef.current = hoveredRegionCode
  }, [hoveredRegionCode])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.getSource('regions')) return
    if (selectedRef.current) {
      map.setFeatureState({ source: 'regions', id: selectedRef.current }, { selected: false })
    }
    if (regionCode) {
      map.setFeatureState({ source: 'regions', id: regionCode }, { selected: true })
    }
    selectedRef.current = regionCode
  }, [regionCode, kpiRecords])

  const hoveredRecord = tooltip ? kpiLookup[tooltip.code] : undefined

  return (
    <Card className="relative h-full overflow-hidden bg-slate-50">
      <div ref={containerRef} className="h-full w-full" />
      
      {/* 레벨 표시 */}
      <div className="absolute left-3 top-3 rounded-md bg-white/95 px-3 py-1.5 text-xs font-medium shadow-md border border-slate-200">
        {level === 'nation' ? '전국 (시도)' : level === 'sido' ? '시도' : level === 'sigungu' ? '시군구' : '읍면동'}
      </div>

      {/* 로딩 상태 */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-sm">
          <div className="rounded-lg bg-white p-4 shadow-lg flex items-center gap-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            <span className="text-sm font-medium text-slate-700">데이터 로딩 중...</span>
          </div>
        </div>
      )}

      {/* 에러 상태 */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-sm">
          <div className="rounded-lg bg-red-50 p-4 shadow-lg max-w-sm">
            <div className="flex items-start gap-3">
              <div className="h-5 w-5 text-red-500 mt-0.5">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-red-900">로딩 실패</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 호버 정보 툴팁 */}
      {tooltip && hoveredRecord && (
        <div className="pointer-events-none absolute" style={{ left: tooltip.x + 12, top: tooltip.y + 12 }}>
          <Tooltip record={hoveredRecord as KPIRecord | undefined} />
        </div>
      )}
    </Card>
  )
}
