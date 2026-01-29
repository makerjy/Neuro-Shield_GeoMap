/**
 * 테스트용 KPI 데이터 생성 스크립트
 * KOSTAT 정규화된 GeoJSON의 모든 지역에 대해 테스트 KPI 데이터를 생성합니다.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

type GeoFeature = {
  type: 'Feature'
  id?: string
  properties?: Record<string, any>
  geometry?: any
}

type GeoCollection = {
  type: 'FeatureCollection'
  features: GeoFeature[]
}

type KPIRecord = {
  region_code: string
  region_name: string
  value: number
  change_rate: number
  percentile: number
  status: string
  computed_at: string
}

async function loadGeojson(filename: string): Promise<GeoCollection> {
  const filepath = path.join(__dirname, '../public/geo/normalized', filename)
  const data = fs.readFileSync(filepath, 'utf-8')
  return JSON.parse(data)
}

function generateKpiRecords(features: GeoFeature[]): KPIRecord[] {
  return features.map((f) => {
    const code = String(f.properties?.region_code ?? '')
    const name = String(f.properties?.region_name ?? '')
    const value = Math.random() * 100
    const percentile = Math.floor(Math.random() * 100)
    const status = percentile < 33 ? 'normal' : percentile < 66 ? 'warning' : 'alert'

    return {
      region_code: code,
      region_name: name,
      value,
      change_rate: (Math.random() - 0.5) * 10,
      percentile,
      status,
      computed_at: new Date().toISOString(),
    }
  })
}

async function main() {
  try {
    console.log('📊 테스트 KPI 데이터 생성 중...')

    const sido = await loadGeojson('sido.geojson')
    const sigungu = await loadGeojson('sigungu.geojson')
    const eupmyeon = await loadGeojson('eupmyeon.geojson')

    const kpiSido = generateKpiRecords(sido.features)
    const kpiSigungu = generateKpiRecords(sigungu.features)
    const kpiEupmyeon = generateKpiRecords(eupmyeon.features)

    const outputDir = path.join(__dirname, '../public/data')
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    fs.writeFileSync(
      path.join(outputDir, 'kpi-sido.json'),
      JSON.stringify(kpiSido, null, 2)
    )
    fs.writeFileSync(
      path.join(outputDir, 'kpi-sigungu.json'),
      JSON.stringify(kpiSigungu, null, 2)
    )
    fs.writeFileSync(
      path.join(outputDir, 'kpi-eupmyeon.json'),
      JSON.stringify(kpiEupmyeon, null, 2)
    )

    console.log(`✅ KPI 데이터 생성 완료:`)
    console.log(`   - sido: ${kpiSido.length}개 지역`)
    console.log(`   - sigungu: ${kpiSigungu.length}개 지역`)
    console.log(`   - eupmyeon: ${kpiEupmyeon.length}개 지역`)
    console.log(`📁 저장 위치: ${outputDir}`)
  } catch (err) {
    console.error('❌ 오류:', err)
    process.exit(1)
  }
}

main()
