export default function ActivityRow({ text, bold, time, color }) {
  // Safely split — fallback if bold word not found in text
  const parts = bold && text?.includes(bold) ? text.split(bold) : [text || "", ""];

  return (
    <div className="flex gap-3 py-2.5 border-b border-zinc-50 last:border-0">
      <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: color }} />

      <p className="text-[13px] text-zinc-600 flex-1 leading-relaxed">
        {parts[0]}
        {bold && <strong className="text-zinc-800">{bold}</strong>}
        {parts[1]}
      </p>

      <span className="text-[12px] text-zinc-400 font-medium whitespace-nowrap">{time}</span>
    </div>
  );
}
