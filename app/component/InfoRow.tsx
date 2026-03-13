interface InfoRowProps {
  label: string
  value: string
  highlight?: boolean
}

export default function InfoRow({ label, value, highlight }: InfoRowProps) {
  return (
    <div className="flex justify-between py-2 border-b border-zinc-100">
      <span className="text-xs text-zinc-400">{label}</span>
      <span className={`text-xs font-semibold ${highlight ? "text-green-600" : "text-zinc-800"}`}>
        {value}
      </span>
    </div>
  )
}