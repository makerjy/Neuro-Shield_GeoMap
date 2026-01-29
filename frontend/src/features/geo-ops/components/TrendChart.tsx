import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { TrendPoint } from '../api/geoApi'
import { formatNumber } from '../utils/normalizers'

export default function TrendChart({ data, unit }: { data: TrendPoint[]; unit?: string }) {
  if (!data.length) {
    return (
      <div className="flex h-28 items-center justify-center rounded border border-dashed border-slate-200 text-xs text-slate-400">
        추세 데이터 없음
      </div>
    )
  }

  return (
    <div className="h-28">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b' }} />
          <YAxis tick={{ fontSize: 10, fill: '#64748b' }} width={36} />
          <Tooltip
            contentStyle={{ fontSize: 11, borderRadius: 8 }}
            formatter={(value: any) => `${formatNumber(value as number)}${unit ?? ''}`}
            labelStyle={{ fontSize: 10 }}
          />
          <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
