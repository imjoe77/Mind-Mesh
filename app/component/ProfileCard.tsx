"use client"

import { useRouter } from "next/navigation"
import InfoRow from "./InfoRow"

const STUDENT = {
  name: "Alice Lawson",
  studentId: "STU-2024-0081",
  course: "Computer Science",
  year: "3rd Year",
  credits: "92 / 120",
  gpa: "3.8",
  advisor: "Dr. Mehta",
  status: "Active",
  email: "alice@university.edu",
  phone: "+91 98765 43210"
}

const INITIALS = STUDENT.name
  .split(" ")
  .map((n) => n[0])
  .join("")
  .toUpperCase()
  .slice(0, 2)

export default function ProfileCard() {
  const router = useRouter()

  return (
    <div
      onClick={() => router.push("/profile")}
      className="bg-white border border-zinc-100 rounded-xl p-6 cursor-pointer hover:shadow-xl transition duration-300"
    >
      {/* Avatar */}
      <div className="flex flex-col items-center text-center pb-5 border-b border-zinc-100 mb-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xl font-extrabold text-white mb-3">
          {INITIALS}
        </div>

        <p className="text-sm font-bold text-zinc-900">{STUDENT.name}</p>

        <p className="text-[10px] text-zinc-400 tracking-wide mt-0.5 mb-2">
          ID · {STUDENT.studentId}
        </p>

        <span className="bg-indigo-50 text-indigo-600 text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full">
          {STUDENT.course}
        </span>
      </div>

      {/* Info rows */}
      <InfoRow label="Year" value={STUDENT.year} />
      <InfoRow label="Credits" value={STUDENT.credits} />
      <InfoRow label="GPA" value={STUDENT.gpa} />
      <InfoRow label="Advisor" value={STUDENT.advisor} />
      <InfoRow label="Email" value={STUDENT.email} />
      <InfoRow label="Phone" value={STUDENT.phone} />
      <InfoRow label="Status" value={STUDENT.status} highlight />
    </div>
  )
}