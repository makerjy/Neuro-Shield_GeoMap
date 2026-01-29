import { formatNumber } from '../utils/normalizers'

export default function Tooltip({
  x,
  y,
  name,
  value,
  computedAt,
}: {
  x: number
  y: number
  name: string
  value: number | null
  computedAt?: string
}) {
  return (
    <div
      className="pointer-events-none absolute z-20 rounded bg-slate-800 px-3 py-2 text-xs text-white shadow"
      style={{ left: x + 10, top: y + 10 }}
    >
      <div className="font-semibold">{name}</div>
      <div>값: {formatNumber(value)}</div>
      {computedAt && <div className="text-[10px] text-slate-300">{computedAt}</div>}
    </div>
  )
}
