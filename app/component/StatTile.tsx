interface Props {
  value: string
  label: string
  sub?: string
}

export default function StatTile({ value, label, sub }: Props) {
  return (
    <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-4 hover:scale-105 transition">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs uppercase text-zinc-400">{label}</p>
      {sub && <p className="text-xs text-zinc-300">{sub}</p>}
    </div>
  )
}