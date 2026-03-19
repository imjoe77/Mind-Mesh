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
    <div className="bg-white/90 backdrop-blur-lg border-b border-zinc-200/60 px-6 lg:px-10 py-4 flex justify-between items-center sticky top-0 z-50">

      {/* Left section */}
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-semibold tracking-wide uppercase text-zinc-400">
            Student Ecosystem
          </span>
        </div>

        <h1 className="text-lg font-bold text-zinc-800 tracking-tight">
          Welcome back, <span className="text-indigo-600">{name.split(" ")[0]}</span> 👋
        </h1>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-4 lg:gap-5">

        <div className="text-right hidden md:block">
          <p className="text-[13px] font-semibold text-zinc-800">
            Spring 2026
          </p>

          <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wide">
            Academic Term
          </p>
        </div>

        {/* Separator */}
        <div className="h-7 w-px bg-zinc-200 hidden sm:block" />

        {/* Avatar with Ring */}
        <div className="relative group cursor-pointer">
          <div className="absolute -inset-1 bg-gradient-to-tr from-indigo-500 to-violet-500 rounded-full blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
          {user?.image ? (
            <img src={user.image} alt={name} className="relative w-9 h-9 rounded-full object-cover ring-2 ring-white" />
          ) : (
            <div className="relative w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white ring-2 ring-white">
              {INITIALS}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
