export default function UpcomingRow({ subject, task, date }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-zinc-50 last:border-0">
      <span className="text-[12px] bg-indigo-50 text-indigo-600 font-semibold px-2.5 py-1 rounded-lg">
        {subject}
      </span>

      <span className="text-[13px] text-zinc-600 flex-1">{task}</span>

      <span className="text-[12px] text-zinc-400 font-medium">{date}</span>
    </div>
  )
}
