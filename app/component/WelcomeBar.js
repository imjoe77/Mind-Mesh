"use client"

export default function WelcomeBar({ user }) {
  const name = user?.name || "Student"
  
  const INITIALS = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="bg-white border-b border-zinc-200 px-6 lg:px-8 py-4 flex justify-between items-center sticky top-0 z-10">

      {/* Left section */}
      <div className="flex flex-col">
        <span className="text-[10px] font-semibold tracking-[0.18em] uppercase text-zinc-400">
          Student Portal
        </span>

        <span className="text-lg font-bold text-zinc-900 tracking-tight">
          Welcome back, {name.split(" ")[0]} 👋
        </span>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-3 lg:gap-4">

        <div className="text-right hidden sm:block">
          <p className="text-sm font-semibold text-zinc-800">
            Spring 2026
          </p>

          <p className="text-xs text-zinc-400">
            Current Semester
          </p>
        </div>

        {/* Avatar */}
        {user?.image ? (
          <img src={user.image} alt={name} className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold text-white">
            {INITIALS}
          </div>
        )}

      </div>
    </div>
  )
}
