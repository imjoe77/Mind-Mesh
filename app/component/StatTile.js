export default function StatTile({ value, label, sub }) {
  // Determine color based on label for variety
  const isGPA = label.toLowerCase().includes('gpa');
  const isAttendance = label.toLowerCase().includes('attendance');
  
  return (
    <div className="bg-white border border-zinc-100/80 rounded-2xl p-4 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-300 relative overflow-hidden group">
      <div className={`absolute top-0 right-0 w-12 h-12 -mr-4 -mt-4 opacity-10 rounded-full blur-xl transition-all duration-500 group-hover:scale-150 ${isGPA ? 'bg-emerald-500' : isAttendance ? 'bg-indigo-500' : 'bg-violet-500'}`} />
      
      <p className={`text-xl font-bold tracking-tight ${isGPA ? 'text-emerald-600' : isAttendance ? 'text-indigo-600' : 'text-zinc-800'}`}>
        {value}
      </p>
      
      <p className="text-[11px] font-semibold uppercase text-zinc-400 tracking-wide mt-1">{label}</p>
      
      {sub && (
        <div className="flex items-center gap-1 mt-1.5">
           <div className="w-1 h-1 rounded-full bg-zinc-300" />
           <p className="text-[11px] font-medium text-zinc-400">{sub}</p>
        </div>
      )}
    </div>
  )
}
