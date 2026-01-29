import { useEffect, useRef } from 'react'
import type { KPIRecord, GeoLevel } from '../api/geoApi'
import { useGeoOpsStore } from '../store/useGeoOpsStore'

const MAP_DB_URL = '/rmate/Samples/MapDataBaseXml/SouthKoreaDrillDownUMD_GIS.xml'
const MAP_SOURCE_URL = '/rmate/Samples/MapSource/SouthKoreaDrillDownUMD_GIS.svg'

const COLORS = ['#e6f2ff', '#cfe5ff', '#9fc7ff', '#6ea8ff', '#2f6fd6']

const SIDO_ALIAS: Record<string, string> = {
  '서울특별시': '서울',
  '부산광역시': '부산',
  '대구광역시': '대구',
  '인천광역시': '인천',
  '광주광역시': '광주',
  '대전광역시': '대전',
  '울산광역시': '울산',
  '세종특별자치시': '세종',
  '경기도': '경기',
  '강원특별자치도': '강원',
  '충청북도': '충북',
  '충청남도': '충남',
  '전라북도': '전북',
  '전라남도': '전남',
  '경상북도': '경북',
  '경상남도': '경남',
  '제주특별자치도': '제주',
}

function normalizeLabel(label: string) {
  return label
    .replace(/\s+/g, '')
    .replace(/(특별자치시|특별자치도|특별시|광역시|자치시|자치도)$/g, '')
}

function nameVariants(label: string) {
  const base = normalizeLabel(label)
  const variants = new Set<string>([label, base])
  variants.add(base.replace(/시$/, ''))
  variants.add(base.replace(/군$/, ''))
  variants.add(base.replace(/구$/, ''))
  variants.add(base.replace(/읍$/, ''))
  variants.add(base.replace(/면$/, ''))
  variants.add(base.replace(/동$/, ''))

  const parts = label.split(' ').filter(Boolean)
  if (parts.length > 1) {
    const last = parts[parts.length - 1]
    variants.add(last)
    variants.add(normalizeLabel(last))
  }

  const match = label.match(/(.*)([가-힣]+[구군시동읍면])$/)
  if (match?.[2]) {
    variants.add(match[2])
    variants.add(normalizeLabel(match[2]))
  }

  return Array.from(variants)
}

type RmateNode = {
  code: string
  label: string
  level: GeoLevel
  parentCode?: string
}

type RmateIndex = {
  byLevel: Record<'sido' | 'sigungu' | 'emd', RmateNode[]>
  byCode: Record<string, RmateNode>
}

function parseRmateMap(xmlText: string): RmateIndex {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlText, 'text/xml')

  const byLevel: RmateIndex['byLevel'] = { sido: [], sigungu: [], emd: [] }
  const byCode: Record<string, RmateNode> = {}

  const provinces = Array.from(doc.getElementsByTagName('Province'))
  provinces.forEach((province) => {
    const code = province.getAttribute('code') ?? ''
    const label = province.getAttribute('label') ?? ''
    if (code === '0') return

    const node: RmateNode = { code, label, level: 'sido' }
    byLevel.sido.push(node)
    byCode[code] = node

    const guNodes = Array.from(province.getElementsByTagName('Gu'))
    guNodes.forEach((gu) => {
      const guCode = gu.getAttribute('code') ?? ''
      const guLabel = gu.getAttribute('label') ?? ''
      if (!guCode) return

      const guNode: RmateNode = { code: guCode, label: guLabel, level: 'sigungu', parentCode: code }
      byLevel.sigungu.push(guNode)
      byCode[guCode] = guNode

      const dongNodes = Array.from(gu.getElementsByTagName('Dong'))
      dongNodes.forEach((dong) => {
        const dongCode = dong.getAttribute('code') ?? ''
        const dongLabel = dong.getAttribute('label') ?? ''
        if (!dongCode) return

        const dongNode: RmateNode = { code: dongCode, label: dongLabel, level: 'emd', parentCode: guCode }
        byLevel.emd.push(dongNode)
        byCode[dongCode] = dongNode
      })
    })
  })

  return { byLevel, byCode }
}

function buildLayout() {
  return `<?xml version="1.0" encoding="utf-8"?>
<rMateMapChart>
  <MapChart id="mainMap" showDataTips="true" dataTipType="Type4" dataTipJsFunction="geoOpsDataTip" mapChangeJsFunction="geoOpsMapClick" drillDownEnabled="false">
    <series>
      <MapSeries id="mapseries" interactive="true" areaCodeField="code" selectionMarking="line" labelPosition="inside" displayName="대한민국" localFillByRange="[${COLORS.join(',')}]" rangeLegendDataField="value" rollOverFill="#ffffff" rollOverStroke="#7aa5e6" color="#0f172a" fontSize="10" labelAlpha="0.9" >
        <showDataEffect>
          <SeriesInterpolate duration="700"/>
        </showDataEffect>
        <stroke>
          <Stroke color="#d5e1f0" weight="0.6" alpha="1"/>
        </stroke>
        <rollOverStroke>
          <Stroke color="#5b8fd9" weight="1" alpha="1"/>
        </rollOverStroke>
      </MapSeries>
    </series>
  </MapChart>
</rMateMapChart>`
}

export default function RmateMapPanel({
  kpiRecords,
}: {
  kpiRecords: KPIRecord[]
}) {
  const holderId = 'geoops-map-holder'
  const chartId = 'geoops-map-chart'
  const mapRef = useRef<any>(null)
  const creatingRef = useRef(false)
  const indexRef = useRef<RmateIndex | null>(null)
  const codeToRegionRef = useRef<Record<string, string>>({})

  const {
    level,
    selectedSido,
    selectedSigungu,
    selectedRegion,
    regionMetaByCode,
    drillDownFromMap,
    drillDown,
    drillUp,
    isDrillingDown,
  } = useGeoOpsStore()

  const clickHandlerRef = useRef<(code: string, name: string | null) => void>(() => undefined)
  const levelRef = useRef(level)

  useEffect(() => {
    levelRef.current = level
  }, [level])

  useEffect(() => {
    const handler = (e: Event) => {
      ;(window as any).event = e
    }
    document.addEventListener('mousemove', handler, true)
    document.addEventListener('mouseover', handler, true)
    document.addEventListener('mouseout', handler, true)
    return () => {
      document.removeEventListener('mousemove', handler, true)
      document.removeEventListener('mouseover', handler, true)
      document.removeEventListener('mouseout', handler, true)
    }
  }, [])

  useEffect(() => {
    clickHandlerRef.current = (code, name) => {
      if (isDrillingDown) return
      const currentLevel = levelRef.current
      if (mapRef.current && (currentLevel === 'nation' || currentLevel === 'sido' || currentLevel === 'sigungu')) {
        try {
          mapRef.current.setOpenCode(Number(code))
        } catch {
          // ignore
        }
      }
      drillDownFromMap(code, name)
    }
  }, [drillDownFromMap, isDrillingDown])


  useEffect(() => {
    if (!window.rMateMapChartH5) return
    if (mapRef.current || creatingRef.current) return
    creatingRef.current = true

    window.geoOpsMapReady = (id) => {
      const chart = document.getElementById(id) as any
      if (!chart) return

      chart.setLayout(buildLayout())
      chart.setMapDataBaseURLEx(MAP_DB_URL)
      chart.setSourceURLEx(MAP_SOURCE_URL)
      mapRef.current = chart
      creatingRef.current = false
    }

    window.geoOpsMapClick = (code, label) => {
      const mapped = codeToRegionRef.current[String(code)]
      if (mapped) {
        clickHandlerRef.current(mapped, label)
        return
      }

      const normalized = normalizeLabel(label ?? '')
      const candidates = Object.values(regionMetaByCode).filter((m) => nameVariants(m.region_name).includes(normalized))
      if (candidates.length) {
        clickHandlerRef.current(candidates[0].region_code, label)
      }
    }

    window.geoOpsDataTip = (code, label, data) => {
      const value = data?.value ?? '-'
      const rank = data?.rank ? ` (순위 ${data.rank})` : ''
      return `${label}${rank}<br/>${value}`
    }

    const vars = 'rMateOnLoadCallFunction=geoOpsMapReady'
    window.rMateMapChartH5.create(chartId, holderId, vars, '100%', '100%')
  }, [])

  useEffect(() => {
    const loadIndex = async () => {
      if (indexRef.current) return
      const res = await fetch(MAP_DB_URL)
      if (!res.ok) return
      const xml = await res.text()
      indexRef.current = parseRmateMap(xml)
    }

    loadIndex()
  }, [])

  useEffect(() => {
    const updateData = async () => {
      const chart = mapRef.current
      const index = indexRef.current
      if (!chart || !index) return

      const data: Array<{ code: string; value: number | null; rank?: number }> = []
      const codeToRegion: Record<string, string> = {}

      const rankMap = new Map<string, number>()
      const sorted = [...kpiRecords].filter((r) => typeof r.value === 'number')
        .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
      sorted.forEach((r, idx) => rankMap.set(r.region_code, idx + 1))

      const selectedSidoName = selectedSido ? regionMetaByCode[selectedSido]?.region_name : null
      const selectedSigunguName = selectedSigungu ? regionMetaByCode[selectedSigungu]?.region_name : null

      const sidoLabel = selectedSidoName ? (SIDO_ALIAS[selectedSidoName] ?? normalizeLabel(selectedSidoName)) : null
      const sigunguLabel = selectedSigunguName ?? null

      const effectiveLevel = level === 'nation' ? 'sido' : level
      const nodes = index.byLevel[effectiveLevel as 'sido' | 'sigungu' | 'emd']
      const nodeByLabel = new Map<string, RmateNode[]>()
      nodes.forEach((node) => {
        nameVariants(node.label).forEach((v) => {
          const list = nodeByLabel.get(v) ?? []
          list.push(node)
          nodeByLabel.set(v, list)
        })
      })

      const rMateSidoCode = selectedSidoName
        ? index.byLevel.sido.find((n) => nameVariants(selectedSidoName).includes(normalizeLabel(n.label)))?.code
        : undefined
      const rMateSigunguCode = selectedSigunguName
        ? index.byLevel.sigungu.find((n) => nameVariants(selectedSigunguName).includes(normalizeLabel(n.label)))?.code
        : undefined

      kpiRecords.forEach((record) => {
        const label = record.region_name || regionMetaByCode[record.region_code]?.region_name || record.region_code
        const variants = nameVariants(label)
        const candidateNodes = variants.flatMap((v) => nodeByLabel.get(v) ?? [])
        let node = candidateNodes[0]

        if (effectiveLevel === 'sigungu' && rMateSidoCode) {
          node = candidateNodes.find((n) => n.parentCode === rMateSidoCode) ?? node
        }

        if (effectiveLevel === 'emd' && rMateSigunguCode) {
          node = candidateNodes.find((n) => n.parentCode === rMateSigunguCode) ?? node
        }

        if (!node) return

        data.push({ code: Number(node.code), value: record.value ?? 0, rank: rankMap.get(record.region_code) })
        codeToRegion[node.code] = record.region_code
      })

      codeToRegionRef.current = codeToRegion
      chart.setData(data)

      // rMate가 데이터를 처리할 때까지 기다린 후 드릴다운 레벨 설정
      setTimeout(() => {
        try {
          if (level === 'nation' || level === 'sido') {
            chart.setOpenCode(0)
          } else if (level === 'sigungu' && rMateSidoCode) {
            chart.setOpenCode(Number(rMateSidoCode))
          } else if (level === 'emd' && rMateSigunguCode) {
            chart.setOpenCode(Number(rMateSigunguCode))
          }
        } catch {
          // setOpenCode 실패 무시
        }
      }, 100)
    }

    updateData()
  }, [kpiRecords, level, selectedSido, selectedSigungu, regionMetaByCode])

  useEffect(() => {
    const chart = mapRef.current
    if (!chart || !selectedRegion) return

    const mappedCode = Object.entries(codeToRegionRef.current).find(([, region]) => region === selectedRegion)?.[0]
    if (!mappedCode) return

    try {
      const root = chart.getRoot?.()
      root?.setSelectedItem?.('mapseries', mappedCode)
    } catch {
      // ignore selection errors
    }
  }, [selectedRegion])

  return (
    <div className="relative h-full w-full">
      <div className="absolute left-4 top-4 z-10 rounded bg-white/90 px-3 py-2 text-xs font-medium text-slate-700 shadow">
        지역을 클릭하면 상세 정보로 드릴다운됩니다.
      </div>
      <div className="absolute right-4 top-4 z-10 flex flex-col gap-2 rounded bg-white/90 p-2 text-xs shadow">
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
      <div id={holderId} className="h-full w-full rounded bg-white" />
    </div>
  )
}
