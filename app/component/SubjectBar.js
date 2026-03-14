import { Subject } from "../types/student"

export default function SubjectBar({ name, percent, color }: Subject) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <span className="text-xs w-24">{name}</span>

      <div
        className="flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden"
        onMouseEnter={() => setBarColor("#22c55e")} // hover color
        onMouseLeave={() => setBarColor(color)} // original color
        onTouchStart={() => setBarColor("#22c55e")} // tap color
        onTouchEnd={() => setBarColor(color)} // reset after tap
        onTouchCancel={() => setBarColor(color)} // reset if tap cancelled
      >
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${percent}%`, background: barColor }}
        />
      </div>

      <span className="text-xs font-bold">{percent}%</span>
    </div>
  )
}
