export default function SubjectBar({ name, percent, color }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <span className="text-xs w-24">{name}</span>

      <div className="flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${percent}%`, background: color }}
        />
      </div>

      <span className="text-xs font-bold">{percent}%</span>
    </div>
  )
}
