"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import WelcomeBar from "../component/WelcomeBar"
import ProfileCard from "../component/ProfileCard"
import ProgressCard from "../component/Progress"
import MyGroups from "../component/MyGroups"
import DiscoverySkills from "../component/DiscoverySkills"
import PhoneVerification from "../component/PhoneVerification"
import ResultUploader from "../component/ResultUploader"
import StreakCard from "../component/StreakCard"
import Footer from "../component/Footer"

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/Login")
    }
  }, [status, router])

  if (status === "loading" || !session) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-zinc-400 tracking-wide">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-[#f8f9fb] flex flex-col">
      <WelcomeBar user={session.user} />

      <main className="flex-1 w-full max-w-[1600px] mx-auto transition-all duration-500">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_300px] gap-5 p-5 lg:p-7">
          {/* Left Column: Profile & Navigation */}
          <aside className="space-y-5">
             <ProfileCard user={session.user} />
             {/* You could add a navigation menu here if needed */}
          </aside>
          
          {/* Middle Column: Primary Actions & Progress */}
          <section className="space-y-5">
             <div className="bg-white/60 backdrop-blur-sm border border-zinc-100 rounded-2xl p-1">
                <ResultUploader onResultAnalyzed={() => window.dispatchEvent(new Event("metrics-updated"))} />
             </div>
             
             <div className="grid gap-5">
                <PhoneVerification />
                <DiscoverySkills />
                <ProgressCard />
             </div>
          </section>
          
          {/* Right Column: Engagement & Social */}
          <aside className="space-y-5">
             <StreakCard />
             <MyGroups />
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  )
}