export function quantileBreaks(values: number[], classes: number): number[] {
  if (!values.length || classes <= 1) return []
  const sorted = [...values].sort((a, b) => a - b)
  const breaks: number[] = []

  for (let i = 1; i < classes; i += 1) {
    const q = i / classes
    const pos = (sorted.length - 1) * q
    const base = Math.floor(pos)
    const rest = pos - base
    const next = sorted[base + 1] ?? sorted[base]
    const value = sorted[base] + (next - sorted[base]) * rest
    breaks.push(value)
  }

  return breaks
}
