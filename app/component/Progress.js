"use client";

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
    <div className="space-y-5">
      {/* Overview Card */}
      <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 lg:p-7 hover:shadow-lg hover:shadow-zinc-900/[0.03] transition-all duration-500 group relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/30 rounded-full blur-3xl -mr-16 -mt-16" />
        
        <div className="flex justify-between items-center mb-5 relative">
          <div>
            <h3 className="text-[15px] font-bold text-zinc-800 tracking-tight">Academic Intelligence</h3>
            <p className="text-[11px] text-zinc-400 font-medium uppercase tracking-wide mt-0.5">Real-time Performance Metrics</p>
          </div>
          <span className="text-[11px] text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full font-semibold tracking-wide border border-indigo-100/80">
            {data.semester}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 relative">
          <StatTile value={data.attendance} label="Attendance" sub="Biometric Verified" />
          <StatTile value={String(data.assignments)} label="Tasks Done" sub="This Semester" />
          <StatTile value={data.gpa} label="Cumulative GPA" sub={metrics ? "AI Evaluated" : "Standard Scale"} />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 text-zinc-800">
        {/* Subject progress */}
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 hover:shadow-lg hover:shadow-zinc-900/[0.03] transition-all duration-500">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-[14px] font-bold text-zinc-800 tracking-tight">Subject Mastery</h3>
            <div className="flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
               <span className="text-[11px] text-zinc-400 font-medium uppercase tracking-wide">
                 {metrics ? "Live Data" : "Preview Mode"}
               </span>
            </div>
          </div>

          <div className="max-h-[320px] overflow-y-auto pr-4 custom-scrollbar space-y-1">
            {data.subjects.map((s, i) => (
              <SubjectBar key={i} {...s} />
            ))}
          </div>
        </div>

        {/* Upcoming */}
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 hover:shadow-lg hover:shadow-zinc-900/[0.03] transition-all duration-500">
          <div className="flex items-center gap-2.5 mb-5">
             <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-500">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
             </div>
             <h3 className="text-[14px] font-bold text-zinc-800 tracking-tight">Critical Deadlines</h3>
          </div>
          
          <div className="space-y-0">
            {data.upcoming.map((u, i) => <UpcomingRow key={i} {...u} />)}
          </div>
          
          <div className="mt-5 pt-3 border-t border-zinc-100 flex justify-between items-center">
             <p className="text-[11px] font-medium text-zinc-300 uppercase tracking-wide">Times in IST</p>
             <button className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 uppercase tracking-wide">View Calendar →</button>
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 hover:shadow-lg hover:shadow-zinc-900/[0.03] transition-all duration-500 overflow-hidden relative">
        <div className="flex items-center justify-between mb-5">
           <h3 className="text-[14px] font-bold text-zinc-800 tracking-tight">Academic Timeline</h3>
           <button className="text-[11px] font-medium text-zinc-400 hover:text-zinc-600 uppercase tracking-wide transition-colors">Clear History</button>
        </div>
        
        <div className="space-y-1 relative">
          <div className="absolute left-[15px] top-2 bottom-2 w-[1.5px] bg-zinc-50" />
          {data.activity.map((a, i) => <ActivityRow key={i} {...a} />)}
        </div>
      </div>
    </div>
  )
}
