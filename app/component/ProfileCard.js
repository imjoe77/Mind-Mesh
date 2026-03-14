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
      className="bg-white border border-zinc-100 rounded-xl p-6 cursor-pointer hover:shadow-xl transition duration-300"
    >
      {/* Avatar */}
      <div className="flex flex-col items-center text-center pb-5 border-b border-zinc-100 mb-4">
        {user?.image ? (
          <img src={user.image} alt={name} className="w-16 h-16 rounded-full object-cover mb-3 shadow-md" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xl font-extrabold text-white mb-3">
            {INITIALS}
          </div>
        )}

        <p className="text-sm font-bold text-zinc-900">{name}</p>

        <p className="text-[10px] text-zinc-400 tracking-wide mt-0.5 mb-2">
          ID · {user?.id || "STU-2024-0081"}
        </p>

        <span className="bg-indigo-50 text-indigo-600 text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full">
          Computer Science
        </span>
      </div>

      {/* Info rows */}
      <InfoRow label="Year" value="3rd Year" />
      <InfoRow label="Credits" value="92 / 120" />
      <InfoRow label="GPA" value="3.8" />
      <InfoRow label="Advisor" value="Dr. Mehta" />
      <InfoRow label="Email" value={email} />
      <InfoRow label="Phone" value="+91 98765 43210" />
      <InfoRow label="Status" value="Active" highlight />
    </div>
  )
}
