import { Activity } from "../types/student"

export default function ActivityRow({ text, bold, time, color }: Activity) {
  const parts = text.split(bold)

  return (
    <div className="flex gap-3 py-2 border-b border-zinc-100">
      <div className="w-2 h-2 rounded-full mt-2" style={{ background: color }} />

      <p className="text-xs flex-1">
        {parts[0]}
        <strong>{bold}</strong>
        {parts[1]}
      </p>

      <span className="text-xs text-zinc-400">{time}</span>
    </div>
  )
}