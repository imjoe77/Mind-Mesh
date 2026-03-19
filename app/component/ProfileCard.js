"use client"

import { useRouter } from "next/navigation"
import InfoRow from "./InfoRow"

export default function ProfileCard({ user }) {
  const router = useRouter()

  const name = user?.name || "Student"
  const email = user?.email || "alice@university.edu"

  const INITIALS = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <div
      onClick={() => router.push("/profile")}
      className="group bg-white border border-zinc-200/80 rounded-2xl p-6 cursor-pointer hover:shadow-xl hover:shadow-indigo-500/8 hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden"
    >
      {/* Background patterns */}
      <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-indigo-50/40 rounded-full blur-2xl group-hover:bg-indigo-100/60 transition duration-300" />
      
      {/* Avatar Section */}
      <div className="flex flex-col items-center text-center pb-5 border-b border-zinc-100 mb-5 relative">
        <div className="relative mb-3">
          {user?.image ? (
            <img src={user.image} alt={name} className="w-[72px] h-[72px] rounded-2xl object-cover shadow-lg ring-3 ring-indigo-50/80 group-hover:scale-105 transition duration-500" />
          ) : (
            <div className="w-[72px] h-[72px] rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center text-xl font-bold text-white shadow-lg ring-3 ring-indigo-50/80 group-hover:scale-105 transition duration-500">
              {INITIALS}
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 bg-emerald-500 w-4 h-4 rounded-full border-[3px] border-white flex items-center justify-center">
             <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          </div>
        </div>

        <h2 className="text-base font-bold text-zinc-800 leading-tight">{name}</h2>
        <div className="flex items-center gap-1.5 mt-1.5">
          <span className="text-[11px] font-semibold text-indigo-500 bg-indigo-50 px-2.5 py-0.5 rounded-md uppercase tracking-wide">
            Verified Student
          </span>
        </div>

        <p className="text-[11px] text-zinc-400 font-medium tracking-wider mt-2.5 uppercase">
          ID: {user?.id || "STU-2024-0081"}
        </p>
      </div>

      {/* Info Grid */}
      <div className="space-y-3">
        <div className="flex justify-between items-center text-[13px]">
          <span className="text-zinc-400 font-medium">Major</span>
          <span className="text-zinc-800 font-semibold">Computer Science</span>
        </div>
        <div className="flex justify-between items-center text-[13px]">
          <span className="text-zinc-400 font-medium">Progress</span>
          <span className="text-indigo-600 font-bold">3rd Year</span>
        </div>
        <div className="flex justify-between items-center text-[13px]">
          <span className="text-zinc-400 font-medium">Current GPA</span>
          <div className="flex items-center gap-2">
            <span className="text-zinc-800 font-bold">3.8</span>
            <div className="w-10 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
               <div className="h-full bg-emerald-500 rounded-full" style={{ width: '95%' }} />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-zinc-100">
        <button className="w-full bg-zinc-50 text-zinc-500 group-hover:bg-indigo-600 group-hover:text-white py-2.5 rounded-xl text-[12px] font-semibold transition-all duration-300 transform active:scale-95">
           View Full Academic Profile
        </button>
      </div>
    </div>
  )
}
