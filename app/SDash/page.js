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

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/Login")
    }
  }, [status, router])

  if (status === "loading" || !session) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-zinc-50 pb-12">
      <WelcomeBar user={session.user} />

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_300px] gap-5 p-6 lg:p-8">
        <div className="space-y-5">
           <ProfileCard user={session.user} />
        </div>
        
        <div className="space-y-5">
           <ResultUploader onResultAnalyzed={() => window.dispatchEvent(new Event("metrics-updated"))} />
           <PhoneVerification />
           <DiscoverySkills />
           <ProgressCard />
        </div>
        
        <div className="space-y-5">
           <StreakCard />
           <MyGroups />
        </div>
      </div>
    </div>
  )
}