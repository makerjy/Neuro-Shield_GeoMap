export function equalIntervalBreaks(values: number[], classes: number) {
  const min = Math.min(...values)
  const max = Math.max(...values)
  const step = (max - min) / classes
  return Array.from({ length: classes - 1 }, (_, i) => min + step * (i + 1))
}

export function quantileBreaks(values: number[], classes: number) {
  const sorted = [...values].sort((a, b) => a - b)
  const breaks: number[] = []
  for (let i = 1; i < classes; i++) {
    const q = i / classes
    const idx = Math.floor(q * (sorted.length - 1))
    breaks.push(sorted[idx])
  }
  return breaks
}

export function buildBreaks(values: number[], method: 'quantile' | 'equal' | 'custom', classes: number, custom?: number[]) {
  if (!values.length) return []
  if (method === 'custom' && custom?.length) return custom
  if (method === 'equal') return equalIntervalBreaks(values, classes)
  return quantileBreaks(values, classes)
}

export function valueToClass(value: number, breaks: number[]) {
  for (let i = 0; i < breaks.length; i++) {
    if (value <= breaks[i]) return i
  }
  return breaks.length
}
