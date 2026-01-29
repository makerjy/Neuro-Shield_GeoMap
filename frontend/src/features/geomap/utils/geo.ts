import type { LngLatBoundsLike } from 'maplibre-gl'

export function featureBounds(feature: any): LngLatBoundsLike {
  const coords = feature.geometry?.coordinates
  const bounds: any[] = [
    [Infinity, Infinity],
    [-Infinity, -Infinity],
  ]

  const extend = (c: any) => {
    if (typeof c[0] === 'number') {
      bounds[0][0] = Math.min(bounds[0][0], c[0])
      bounds[0][1] = Math.min(bounds[0][1], c[1])
      bounds[1][0] = Math.max(bounds[1][0], c[0])
      bounds[1][1] = Math.max(bounds[1][1], c[1])
    } else {
      c.forEach(extend)
    }
  }
  extend(coords)
  return bounds as LngLatBoundsLike
}

export function toLookup<T extends { region_code: string }>(records: T[]) {
  return records.reduce<Record<string, T>>((acc, cur) => {
    acc[cur.region_code] = cur
    return acc
  }, {})
}
