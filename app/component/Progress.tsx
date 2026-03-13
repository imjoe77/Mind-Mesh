"use client"

import StatTile from "./StatTile"
import SubjectBar from "./SubjectBar"
import ActivityRow from "./ActivityRow"
import UpcomingRow from "./UpcomingRow"

const STUDENT = {
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
  return (
    <div className="flex flex-col gap-4">

      {/* Overview */}
      <div className="bg-white border border-zinc-100 rounded-xl p-6 hover:shadow-lg transition">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold text-zinc-900">Overview</h3>
          <span className="text-xs text-zinc-400 uppercase tracking-widest">
            {STUDENT.semester}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <StatTile
            value={STUDENT.attendance}
            label="Attendance"
            sub="Last 30 days"
          />

          <StatTile
            value={String(STUDENT.assignments)}
            label="Assignments"
            sub="Completed"
          />

          <StatTile
            value={STUDENT.gpa}
            label="GPA"
            sub="Out of 4.0"
          />
        </div>
      </div>


      {/* Subject progress + deadlines */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Subject progress */}
        <div className="bg-white border border-zinc-100 rounded-xl p-6 hover:shadow-lg transition">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-zinc-900">
              Subject progress
            </h3>

            <span className="text-xs text-zinc-400">
              This semester
            </span>
          </div>

          {STUDENT.subjects.map((s, i) => (
            <SubjectBar key={i} {...s} />
          ))}
        </div>


        {/* Upcoming deadlines */}
        <div className="bg-white border border-zinc-100 rounded-xl p-6 hover:shadow-lg transition">
          <h3 className="text-sm font-bold text-zinc-900 mb-4">
            Upcoming deadlines
          </h3>

          {STUDENT.upcoming.map((u, i) => (
            <UpcomingRow key={i} {...u} />
          ))}

          <p className="text-xs text-zinc-300 mt-4 text-center">
            All times in IST
          </p>
        </div>

      </div>


      {/* Recent activity */}
      <div className="bg-white border border-zinc-100 rounded-xl p-6 hover:shadow-lg transition">
        <h3 className="text-sm font-bold text-zinc-900 mb-2">
          Recent activity
        </h3>

        {STUDENT.activity.map((a, i) => (
          <ActivityRow key={i} {...a} />
        ))}
      </div>

    </div>
  )
}