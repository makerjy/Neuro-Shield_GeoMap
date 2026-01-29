import { Bar, BarChart, ResponsiveContainer, Tooltip as ChartTooltip, XAxis, YAxis } from 'recharts'

function buildHistogram(values: number[], bins = 8) {
  if (!values.length) return []
  const min = Math.min(...values)
  const max = Math.max(...values)
  const step = (max - min) / bins || 1

  const buckets = Array.from({ length: bins }, (_, i) => ({
    range: `${(min + step * i).toFixed(0)}~${(min + step * (i + 1)).toFixed(0)}`,
    count: 0,
  }))

  values.forEach((v) => {
    const idx = Math.min(bins - 1, Math.floor((v - min) / step))
    buckets[idx].count += 1
  })

  return buckets
}

export default function DistributionMiniChart({ values }: { values: number[] }) {
  const data = buildHistogram(values)

  return (
    <div className="h-24">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 0 }}>
          <XAxis dataKey="range" hide />
          <YAxis hide />
          <ChartTooltip cursor={{ fill: '#f1f5f9' }} />
          <Bar dataKey="count" fill="#3b82f6" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
