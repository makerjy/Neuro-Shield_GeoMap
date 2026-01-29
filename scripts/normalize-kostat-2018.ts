// @ts-nocheck

import fs from 'fs'
import path from 'path'

type Feature = {
  type: 'Feature'
  id?: string
  properties?: Record<string, any>
  geometry?: {
    type: string
    coordinates: any
  }
}

type FeatureCollection = {
  type: 'FeatureCollection'
  name?: string
  features: Feature[]
}

const ROOT = path.resolve(__dirname, '..')
const RAW_DIR = path.join(ROOT, 'frontend/public/geo/raw')
const OUT_DIR = path.join(ROOT, 'frontend/public/geo/normalized')

const FILES = {
  sido: 'skorea-provinces-2018-geo.json',
  sigungu: 'skorea-municipalities-2018-geo.json',
  eupmyeon: 'skorea-submunicipalities-2018-geo.json',
}

const CODE_KEYS = ['code', 'CODE', 'adm_cd', 'ADM_CD', 'CTPRVN_CD', 'SIG_CD', 'EMD_CD', 'BJD_CD', 'ID']
const NAME_KEYS = ['name', 'NAME', 'adm_nm', 'ADM_NM', 'CTP_KOR_NM', 'SIG_KOR_NM', 'EMD_KOR_NM', 'BJD_NM', 'fullname']
const PARENT_KEYS = ['parent_code', 'PARENT_CODE', 'parent', 'PARENT', 'CTPRVN_CD', 'SIG_CD']

function readJson(filePath: string): FeatureCollection {
  const raw = fs.readFileSync(filePath, 'utf-8')
  return JSON.parse(raw) as FeatureCollection
}

function writeJson(filePath: string, data: FeatureCollection) {
  fs.writeFileSync(filePath, JSON.stringify(data))
}

function isNumericString(value: string) {
  return /^[0-9]+$/.test(value)
}

function detectCodeKey(features: Feature[]): { key: string; modalLength: number } {
  let bestKey = ''
  let bestScore = -Infinity
  let bestModal = 0

  for (const key of CODE_KEYS) {
    const values = features
      .map((f) => f.properties?.[key])
      .filter((v) => v !== undefined && v !== null)
      .map((v) => String(v))

    if (values.length === 0) continue

    const numericCount = values.filter((v) => isNumericString(v)).length
    const numericRatio = numericCount / values.length

    const lengthDist: Record<number, number> = {}
    values.forEach((v) => {
      const len = v.length
      lengthDist[len] = (lengthDist[len] || 0) + 1
    })

    const modalLength = Number(Object.keys(lengthDist).sort((a, b) => lengthDist[Number(b)] - lengthDist[Number(a)])[0])
    const modalRatio = lengthDist[modalLength] / values.length

    const score = numericRatio * 0.7 + modalRatio * 0.3

    if (score > bestScore) {
      bestScore = score
      bestKey = key
      bestModal = modalLength
    }
  }

  if (!bestKey) {
    throw new Error('Failed to detect code field')
  }

  return { key: bestKey, modalLength: bestModal }
}

function detectNameKey(features: Feature[]): string {
  let bestKey = ''
  let bestRatio = -Infinity

  for (const key of NAME_KEYS) {
    const values = features
      .map((f) => f.properties?.[key])
      .filter((v) => v !== undefined && v !== null)
      .map((v) => String(v).trim())

    if (values.length === 0) continue

    const nonEmpty = values.filter((v) => v.length > 0).length
    const ratio = nonEmpty / values.length

    if (ratio > bestRatio) {
      bestRatio = ratio
      bestKey = key
    }
  }

  if (!bestKey) {
    throw new Error('Failed to detect name field')
  }

  return bestKey
}

function detectParentKey(features: Feature[], expectedLength: number): string | null {
  for (const key of PARENT_KEYS) {
    const values = features
      .map((f) => f.properties?.[key])
      .filter((v) => v !== undefined && v !== null)
      .map((v) => String(v))

    if (values.length === 0) continue

    const numericRatio = values.filter((v) => isNumericString(v)).length / values.length
    const lengthRatio = values.filter((v) => v.length === expectedLength).length / values.length

    if (numericRatio > 0.9 && lengthRatio > 0.7) {
      return key
    }
  }

  return null
}

function geometryTypeCounts(features: Feature[]) {
  const counts: Record<string, number> = {}
  features.forEach((f) => {
    const t = f.geometry?.type || 'Unknown'
    counts[t] = (counts[t] || 0) + 1
  })
  return counts
}

function flattenCoords(coords: any, acc: Array<[number, number]> = []) {
  if (!coords) return acc
  if (typeof coords[0] === 'number') {
    acc.push([coords[0], coords[1]])
  } else if (Array.isArray(coords[0])) {
    coords.forEach((c: any) => flattenCoords(c, acc))
  }
  return acc
}

function getBBox(features: Feature[]) {
  let minLon = Infinity
  let maxLon = -Infinity
  let minLat = Infinity
  let maxLat = -Infinity

  features.forEach((f) => {
    const coords = flattenCoords(f.geometry?.coordinates)
    coords.forEach(([lon, lat]) => {
      minLon = Math.min(minLon, lon)
      maxLon = Math.max(maxLon, lon)
      minLat = Math.min(minLat, lat)
      maxLat = Math.max(maxLat, lat)
    })
  })

  return { minLon, maxLon, minLat, maxLat }
}

function lengthDistribution(codes: string[]) {
  const dist: Record<number, number> = {}
  codes.forEach((c) => {
    dist[c.length] = (dist[c.length] || 0) + 1
  })
  return dist
}

function reportLayer(name: string, features: Feature[], codes: string[]) {
  const types = geometryTypeCounts(features)
  const bbox = getBBox(features)
  const lenDist = lengthDistribution(codes)

  console.log(`\n[${name}] Feature count: ${features.length}`)
  console.log(`[${name}] Geometry types:`, types)
  console.log(`[${name}] Code length distribution:`, lenDist)
  console.log(`[${name}] BBox: lon [${bbox.minLon.toFixed(2)}, ${bbox.maxLon.toFixed(2)}], lat [${bbox.minLat.toFixed(2)}, ${bbox.maxLat.toFixed(2)}]`)
}

function normalizeLayer(
  name: 'sido' | 'sigungu' | 'eupmyeon',
  fc: FeatureCollection,
  codeKey: string,
  nameKey: string,
  codeLength: number,
  parentPrefixLength: number | null,
  parentKey: string | null
): FeatureCollection {
  const features = fc.features.map((f) => {
    const rawCode = f.properties?.[codeKey]
    const rawName = f.properties?.[nameKey]
    const region_code = rawCode !== undefined && rawCode !== null ? String(rawCode) : ''
    const region_name = rawName !== undefined && rawName !== null ? String(rawName) : ''

    let parent_code: string | null = null
    if (parentKey && f.properties?.[parentKey] !== undefined && f.properties?.[parentKey] !== null) {
      parent_code = String(f.properties?.[parentKey])
    } else if (parentPrefixLength && region_code.length >= parentPrefixLength) {
      parent_code = region_code.slice(0, parentPrefixLength)
    }

    const properties = {
      ...(f.properties || {}),
      region_code,
      region_name,
      parent_code: parent_code ?? null,
    }

    return {
      ...f,
      id: region_code,
      properties,
    }
  })

  return {
    type: 'FeatureCollection',
    name,
    features,
  }
}

function parentCoverage(childCodes: string[], childParentCodes: Array<string | null>, parentSet: Set<string>) {
  let matched = 0
  const broken: string[] = []

  childParentCodes.forEach((p, idx) => {
    if (p && parentSet.has(p)) {
      matched += 1
    } else {
      broken.push(childCodes[idx])
    }
  })

  const ratio = matched / childCodes.length
  return { matched, ratio, broken }
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function main() {
  ensureDir(OUT_DIR)

  const sido = readJson(path.join(RAW_DIR, FILES.sido))
  const sigungu = readJson(path.join(RAW_DIR, FILES.sigungu))
  const eupmyeon = readJson(path.join(RAW_DIR, FILES.eupmyeon))

  const sidoDetect = detectCodeKey(sido.features)
  const sigunguDetect = detectCodeKey(sigungu.features)
  const eupDetect = detectCodeKey(eupmyeon.features)

  const sidoNameKey = detectNameKey(sido.features)
  const sigunguNameKey = detectNameKey(sigungu.features)
  const eupNameKey = detectNameKey(eupmyeon.features)

  const parentKeySigungu = detectParentKey(sigungu.features, sidoDetect.modalLength)
  const parentKeyEup = detectParentKey(eupmyeon.features, sigunguDetect.modalLength)

  const normalizedSido = normalizeLayer('sido', sido, sidoDetect.key, sidoNameKey, sidoDetect.modalLength, null, null)
  const normalizedSigungu = normalizeLayer('sigungu', sigungu, sigunguDetect.key, sigunguNameKey, sigunguDetect.modalLength, sidoDetect.modalLength, parentKeySigungu)
  const normalizedEup = normalizeLayer('eupmyeon', eupmyeon, eupDetect.key, eupNameKey, eupDetect.modalLength, sigunguDetect.modalLength, parentKeyEup)

  const sidoCodes = normalizedSido.features.map((f) => String(f.properties?.region_code || ''))
  const sigunguCodes = normalizedSigungu.features.map((f) => String(f.properties?.region_code || ''))
  const eupCodes = normalizedEup.features.map((f) => String(f.properties?.region_code || ''))

  reportLayer('SIDO', normalizedSido.features, sidoCodes)
  reportLayer('SIGUNGU', normalizedSigungu.features, sigunguCodes)
  reportLayer('EUPMYEON', normalizedEup.features, eupCodes)

  const sigunguParentCodes = normalizedSigungu.features.map((f) => f.properties?.parent_code ?? null)
  const eupParentCodes = normalizedEup.features.map((f) => f.properties?.parent_code ?? null)

  const sigunguCoverage = parentCoverage(sigunguCodes, sigunguParentCodes, new Set(sidoCodes))
  const eupCoverage = parentCoverage(eupCodes, eupParentCodes, new Set(sigunguCodes))

  console.log(`\n[JOIN] SIGUNGU parent coverage: ${(sigunguCoverage.ratio * 100).toFixed(2)}% (${sigunguCoverage.matched}/${sigunguCodes.length})`)
  console.log(`[JOIN] EUPMYEON parent coverage: ${(eupCoverage.ratio * 100).toFixed(2)}% (${eupCoverage.matched}/${eupCodes.length})`)

  if (sigunguCoverage.ratio < 0.95) {
    console.error('[ERROR] SIGUNGU parent coverage below 95%')
    console.error('Sample broken codes:', sigunguCoverage.broken.slice(0, 10))
    throw new Error('Parent join coverage failed for SIGUNGU')
  }

  if (eupCoverage.ratio < 0.95) {
    console.error('[ERROR] EUPMYEON parent coverage below 95%')
    console.error('Sample broken codes:', eupCoverage.broken.slice(0, 10))
    throw new Error('Parent join coverage failed for EUPMYEON')
  }

  writeJson(path.join(OUT_DIR, 'sido.geojson'), normalizedSido)
  writeJson(path.join(OUT_DIR, 'sigungu.geojson'), normalizedSigungu)
  writeJson(path.join(OUT_DIR, 'eupmyeon.geojson'), normalizedEup)

  console.log('\n✅ Normalized files written to /public/geo/normalized/')
}

main()
