import { formatNumber } from '../utils/normalizers'

const COLORS = ['#e6f0ff', '#c9ddff', '#9cc2ff', '#6aa5ff', '#3b82f6']

export default function Legend({ min, max }: { min: number | null; max: number | null }) {
  return (
    <div className="absolute bottom-4 left-4 rounded bg-white/90 p-2 text-xs shadow">
      <div className="mb-2 font-semibold text-slate-600">범례</div>
      <div className="flex items-end gap-2">
        <div className="flex h-24 w-3 flex-col">
          {COLORS.slice().reverse().map((c) => (
            <div key={c} className="flex-1" style={{ backgroundColor: c }} />
          ))}
        </div>
        <div className="flex h-24 flex-col justify-between text-[10px] text-slate-500">
          <span>{formatNumber(max)}</span>
          <span>{formatNumber(min)}</span>
        </div>
      </div>
    </div>
  )
}
