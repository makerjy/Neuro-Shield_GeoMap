import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatNumber } from '../utils/normalizers'

type CompareItem = { name: string; value: number | null }

export default function CompareChart({ data, unit }: { data: CompareItem[]; unit?: string }) {
  if (!data.length) {
    return (
      <div className="flex h-28 items-center justify-center rounded border border-dashed border-slate-200 text-xs text-slate-400">
        비교 데이터 없음
      </div>
    )
  }

  return (
    <div className="h-28">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
          <YAxis tick={{ fontSize: 10, fill: '#64748b' }} width={36} />
          <Tooltip
            contentStyle={{ fontSize: 11, borderRadius: 8 }}
            formatter={(value: any) => `${formatNumber(value as number)}${unit ?? ''}`}
            labelStyle={{ fontSize: 10 }}
          />
          <Bar dataKey="value" fill="#60a5fa" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
