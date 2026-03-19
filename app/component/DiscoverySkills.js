"use client"

import { useState, useEffect } from "react"

export default function DiscoverySkills() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState({
    skillsToTeach: [],
    skillsToLearn: [],
    domains: [],
    bio: "",
    goal: ""
  })

  // Local inputs
  const [teachInput, setTeachInput] = useState("")
  const [learnInput, setLearnInput] = useState("")

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/users/profile")
      const data = await res.json()
      if (res.ok && data.user) {
        setProfile({
          skillsToTeach: data.user.skillsToTeach || [],
          skillsToLearn: data.user.skillsToLearn || [],
          domains: data.user.domains || [],
          bio: data.user.bio || "",
          goal: data.user.goal || ""
        })
      }
    } catch (err) {
      console.error("Failed to fetch profile", err)
    } finally {
      setLoading(false)
    }
  }

  const [saveSuccess, setSaveSuccess] = useState(false)

  const handleUpdate = async () => {
    setSaving(true)
    setSaveSuccess(false)
    try {
      const res = await fetch("/api/users/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile)
      })
      if (res.ok) {
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      }
    } catch (err) {
      console.error("Failed to update profile", err)
    } finally {
      setSaving(false)
    }
  }

  const addSkill = (type) => {
    const val = type === "teach" ? teachInput.trim() : learnInput.trim()
    if (!val) return

    const key = type === "teach" ? "skillsToTeach" : "skillsToLearn"
    if (!profile[key].includes(val)) {
      setProfile({ ...profile, [key]: [...profile[key], val] })
    }

    if (type === "teach") setTeachInput("")
    else setLearnInput("")
  }

  const removeSkill = (type, skill) => {
    const key = type === "teach" ? "skillsToTeach" : "skillsToLearn"
    setProfile({ ...profile, [key]: profile[key].filter(s => s !== skill) })
  }

  if (loading) return (
    <div className="bg-white border border-zinc-100 rounded-2xl p-6 h-48 animate-pulse flex items-center justify-center">
      <p className="text-zinc-400 text-[13px]">Loading matchmaking data...</p>
    </div>
  )

  return (
    <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 lg:p-7 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-500 overflow-hidden relative group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-100/30 transition duration-700" />
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 relative">
        <div>
          <h3 className="text-[14px] font-bold text-zinc-800 tracking-tight">Skill Ecosystem</h3>
          <p className="text-[11px] text-zinc-400 font-medium uppercase tracking-wide mt-0.5">Personalized Matchmaking Profile</p>
        </div>
        <button
          onClick={handleUpdate}
          disabled={saving}
          className={`h-9 px-5 rounded-xl text-[11px] font-semibold uppercase tracking-wide transition-all duration-300 transform active:scale-95 ${
            saving ? "bg-zinc-100 text-zinc-400 cursor-not-allowed" : 
            saveSuccess ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/15" :
            "bg-zinc-800 text-white hover:bg-indigo-600 shadow-md shadow-indigo-500/8"
          }`}
        >
          {saving ? "Syncing..." : saveSuccess ? "Verified ✓" : "Update Profile"}
        </button>
      </div>

      <div className="space-y-6 relative">
        {/* Bio & Goal */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide">Professional Bio</label>
            <textarea
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              className="w-full bg-zinc-50 border border-zinc-100 rounded-xl p-3.5 text-[13px] text-zinc-700 focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all resize-none h-24"
              placeholder="Elevate your profile with a concise bio..."
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide">Academic Mission</label>
            <textarea
              value={profile.goal}
              onChange={(e) => setProfile({ ...profile, goal: e.target.value })}
              className="w-full bg-zinc-50 border border-zinc-100 rounded-xl p-3.5 text-[13px] text-zinc-700 focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all resize-none h-24"
              placeholder="What specific milestones are you chasing?"
            />
          </div>
        </div>

        {/* Skills Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Teach */}
          <div className="bg-emerald-50/30 border border-emerald-100/50 rounded-2xl p-5">
            <label className="block text-[11px] font-semibold text-emerald-600 uppercase tracking-wide mb-3">Teaching Assets</label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={teachInput}
                onChange={(e) => setTeachInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addSkill("teach")}
                className="flex-1 bg-white border border-emerald-100 rounded-lg px-3.5 py-2 text-[13px] focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                placeholder="Share your expertise..."
              />
              <button 
                onClick={() => addSkill("teach")}
                className="w-9 h-9 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-all shadow-sm shadow-emerald-500/15 active:scale-90"
              >
                +
              </button>
            </div>
            <div className="flex flex-wrap gap-2 min-h-[36px]">
              {profile.skillsToTeach.map(s => (
                <span key={s} className="group/tag inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-emerald-700 text-[11px] font-semibold border border-emerald-100 shadow-sm transition-all hover:-translate-y-0.5">
                  {s}
                  <button onClick={() => removeSkill("teach", s)} className="opacity-30 group-hover/tag:opacity-100 hover:text-emerald-900 transition-opacity">✕</button>
                </span>
              ))}
              {profile.skillsToTeach.length === 0 && <p className="text-[11px] text-zinc-300 font-medium italic">Define what you can contribute.</p>}
            </div>
          </div>

          {/* Learn */}
          <div className="bg-indigo-50/30 border border-indigo-100/50 rounded-2xl p-5">
            <label className="block text-[11px] font-semibold text-indigo-600 uppercase tracking-wide mb-3">Learning Objectives</label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={learnInput}
                onChange={(e) => setLearnInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addSkill("learn")}
                className="flex-1 bg-white border border-indigo-100 rounded-lg px-3.5 py-2 text-[13px] focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                placeholder="What skills do you need?"
              />
              <button 
                onClick={() => addSkill("learn")}
                className="w-9 h-9 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-500/15 active:scale-90"
              >
                +
              </button>
            </div>
            <div className="flex flex-wrap gap-2 min-h-[36px]">
              {profile.skillsToLearn.map(s => (
                <span key={s} className="group/tag inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-indigo-700 text-[11px] font-semibold border border-indigo-100 shadow-sm transition-all hover:-translate-y-0.5">
                  {s}
                  <button onClick={() => removeSkill("learn", s)} className="opacity-30 group-hover/tag:opacity-100 hover:text-indigo-900 transition-opacity">✕</button>
                </span>
              ))}
              {profile.skillsToLearn.length === 0 && <p className="text-[11px] text-zinc-300 font-medium italic">Define what you want to acquire.</p>}
            </div>
          </div>
        </div>

        {/* Domains Section */}
        <div className="border-t border-zinc-100 pt-6 mt-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-5">
             <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide">Academic Specializations</label>
             <div className="flex items-center gap-2">
                <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-md ${profile.domains?.length >= 3 ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50'}`}>
                   {profile.domains?.length || 0} / 6 Selected
                </span>
             </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {[
              "Web Dev", "App Dev", "AI/ML", "Data Science", 
              "Cybersecurity", "Cloud", "UI/UX", "Blockchain", 
              "Game Dev", "DevOps", "Competitive Coding"
            ].map(d => {
              const isSelected = profile.domains?.includes(d)
              return (
                <button
                  key={d}
                  onClick={() => {
                    const current = profile.domains || []
                    if (isSelected) {
                      setProfile({ ...profile, domains: current.filter(x => x !== d) })
                    } else if (current.length < 6) {
                      setProfile({ ...profile, domains: [...current, d] })
                    }
                  }}
                  className={`px-4 py-2 rounded-xl text-[12px] font-semibold transition-all duration-300 active:scale-95 ${
                    isSelected 
                      ? "bg-zinc-800 text-white shadow-lg shadow-zinc-900/8 border-transparent" 
                      : "bg-zinc-50 text-zinc-500 border border-zinc-100 hover:bg-white hover:border-zinc-300"
                  }`}
                >
                  {d}
                </button>
              )
            })}
          </div>
          {profile.domains?.length < 3 && (
            <div className="mt-5 flex items-center gap-2 text-[11px] text-amber-500 font-semibold uppercase tracking-wide bg-amber-50 w-fit px-3.5 py-1.5 rounded-lg">
               <span className="text-sm">⚠️</span>
               Select at least 3 for effective matchmaking
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
