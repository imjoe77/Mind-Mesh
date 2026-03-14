export default function UpcomingRow({ subject, task, date }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-zinc-100">
      <span className="text-xs bg-indigo-50 text-indigo-500 px-2 py-1 rounded">
        {subject}
      </span>

      <span className="text-xs flex-1">{task}</span>

      <span className="text-xs text-zinc-400">{date}</span>
    </div>
  )
}
