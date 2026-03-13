"use client"

import WelcomeBar from "../component/WelcomeBar"
import ProfileCard from "../component/ProfileCard"
import ProgressCard from "../component/Progress"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <WelcomeBar />

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-5 p-6 lg:p-8">
        <ProfileCard />
        <ProgressCard />
      </div>
    </div>
  )
}