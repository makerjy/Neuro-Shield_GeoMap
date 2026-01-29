type Geometry = {
  coordinates: any
}

type Feature = {
  geometry?: Geometry
}

type BBox = {
  minLon: number
  minLat: number
  maxLon: number
  maxLat: number
}

function flatten(coords: any, acc: Array<[number, number]> = []) {
  if (!coords) return acc
  if (typeof coords[0] === 'number') {
    acc.push([coords[0], coords[1]])
  } else if (Array.isArray(coords[0])) {
    coords.forEach((c: any) => flatten(c, acc))
  }
  return acc
}

export function bboxFromFeatures(features: Feature[]): BBox {
  let minLon = Infinity
  let maxLon = -Infinity
  let minLat = Infinity
  let maxLat = -Infinity

  features.forEach((f) => {
    const coords = flatten(f.geometry?.coordinates)
    coords.forEach(([lon, lat]) => {
      minLon = Math.min(minLon, lon)
      maxLon = Math.max(maxLon, lon)
      minLat = Math.min(minLat, lat)
      maxLat = Math.max(maxLat, lat)
    })
  })

  return { minLon, minLat, maxLon, maxLat }
}

export function bboxToMapBounds(bbox: BBox): [[number, number], [number, number]] {
  return [
    [bbox.minLon, bbox.minLat],
    [bbox.maxLon, bbox.maxLat],
  ]
}
