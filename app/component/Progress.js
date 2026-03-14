import { useState, useEffect } from "react"
import StatTile from "./StatTile"
import SubjectBar from "./SubjectBar"
import ActivityRow from "./ActivityRow"
import UpcomingRow from "./UpcomingRow"

const FALLBACK_STUDENT = {
  semester: "Spring 2026",
  attendance: "87%",
  assignments: 14,
  gpa: "3.8",
  subjects: [
    { name: "Algorithms", percent: 88, color: "#4F46E5" },
    { name: "Databases", percent: 74, color: "#7C3AED" },
    { name: "Networks", percent: 91, color: "#4F46E5" },
    { name: "ML Basics", percent: 62, color: "#a78bfa" },
    { name: "OS Design", percent: 79, color: "#6366f1" }
  ],
  upcoming: [
    { subject: "Algorithms", task: "Assignment 5 due", date: "Mar 16" },
    { subject: "Databases", task: "Mid-term exam", date: "Mar 19" },
    { subject: "Networks", task: "Lab submission", date: "Mar 22" }
  ],
  activity: [
    { text: "Submitted Assignment 4 — Algorithms", bold: "Assignment 4", time: "2h ago", color: "#4F46E5" },
    { text: "Attended Networks lecture", bold: "Networks", time: "Yesterday", color: "#16a34a" },
    { text: "Quiz result posted — Databases", bold: "Databases", time: "2 days ago", color: "#f59e0b" },
    { text: "Enrolled in ML Basics elective", bold: "ML Basics", time: "Last week", color: "#7C3AED" }
  ]
}

export default function ProgressCard() {
  const [metrics, setMetrics] = useState(null)
  
  const loadMetrics = async () => {
    try {
      const res = await fetch("/api/users/profile")
      const data = await res.json()
      if (res.ok && data.user?.academicMetrics?.subjects?.length > 0) {
        setMetrics(data.user.academicMetrics)
      }
    } catch (err) { }
  }

  useEffect(() => {
    loadMetrics()
    window.addEventListener("metrics-updated", loadMetrics)
    return () => window.removeEventListener("metrics-updated", loadMetrics)
  }, [])

  const data = {
    semester: metrics?.semester || FALLBACK_STUDENT.semester,
    attendance: metrics?.attendance || FALLBACK_STUDENT.attendance,
    gpa: metrics?.gpa || FALLBACK_STUDENT.gpa,
    subjects: metrics?.subjects || FALLBACK_STUDENT.subjects,
    assignments: FALLBACK_STUDENT.assignments, // Only numeric stat kept hardcoded for visual
    upcoming: metrics?.upcoming?.length > 0 ? metrics.upcoming : FALLBACK_STUDENT.upcoming,
    activity: metrics?.activity?.length > 0 ? metrics.activity : FALLBACK_STUDENT.activity
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Overview */}
      <div className="bg-white border border-zinc-100 rounded-xl p-6 hover:shadow-lg transition">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold text-zinc-900">Academic Overview</h3>
          <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">
            {data.semester}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <StatTile value={data.attendance} label="Attendance" sub="Analyzed" />
          <StatTile value={String(data.assignments)} label="Assignments" sub="Completed" />
          <StatTile value={data.gpa} label="GPA / SGPA" sub={metrics ? "AI Evaluated" : "Out of 4.0"} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Subject progress */}
        <div className="bg-white border border-zinc-100 rounded-xl p-6 hover:shadow-lg transition">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-zinc-900">Subject Performance</h3>
            <span className="text-[10px] bg-slate-100 text-slate-500 font-bold uppercase px-2 py-0.5 rounded-full tracking-wider">
              {metrics ? "VERIFIED" : "MOCK DATA"}
            </span>
          </div>

          <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {data.subjects.map((s, i) => (
              <SubjectBar key={i} {...s} />
            ))}
          </div>
        </div>

        {/* Upcoming */}
        <div className="bg-white border border-zinc-100 rounded-xl p-6 hover:shadow-lg transition">
          <h3 className="text-sm font-bold text-zinc-900 mb-4">Upcoming deadlines</h3>
          {data.upcoming.map((u, i) => <UpcomingRow key={i} {...u} />)}
          <p className="text-xs text-zinc-300 mt-4 text-center">All times in IST</p>
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-white border border-zinc-100 rounded-xl p-6 hover:shadow-lg transition">
        <h3 className="text-sm font-bold text-zinc-900 mb-2">Recent activity</h3>
        {data.activity.map((a, i) => <ActivityRow key={i} {...a} />)}
      </div>
    </div>
  )
}
