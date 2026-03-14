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
    <div className="bg-white border border-zinc-100 rounded-xl p-6 h-48 animate-pulse flex items-center justify-center">
      <p className="text-zinc-400 text-sm">Loading matchmaking data...</p>
    </div>
  )

  return (
    <div className="bg-white border border-zinc-100 rounded-xl p-6 hover:shadow-lg transition">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-sm font-bold text-zinc-900">Matchmaking Profile</h3>
          <p className="text-[10px] text-zinc-400">Boost your score in the Discover tab</p>
        </div>
        <button
          onClick={handleUpdate}
          disabled={saving}
          className={`text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-lg transition ${
            saving ? "bg-zinc-100 text-zinc-400" : 
            saveSuccess ? "bg-green-600 text-white shadow-green-200" :
            "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-indigo-200"
          }`}
        >
          {saving ? "Saving..." : saveSuccess ? "Profile Saved! ✓" : "Save Profile"}
        </button>
      </div>

      <div className="space-y-6">
        {/* Bio & Goal */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">My Bio</label>
            <textarea
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              className="w-full bg-zinc-50 border border-zinc-100 rounded-lg p-2.5 text-xs text-zinc-700 focus:ring-2 focus:ring-indigo-500 outline-none transition resize-none h-16"
              placeholder="Tell fellow students about yourself..."
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">My Current Goal</label>
            <textarea
              value={profile.goal}
              onChange={(e) => setProfile({ ...profile, goal: e.target.value })}
              className="w-full bg-zinc-50 border border-zinc-100 rounded-lg p-2.5 text-xs text-zinc-700 focus:ring-2 focus:ring-indigo-500 outline-none transition resize-none h-16"
              placeholder="What are you working towards?"
            />
          </div>
        </div>

        {/* Skills Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Teach */}
          <div>
            <label className="block text-[10px] font-bold text-green-600 uppercase tracking-wider mb-2">Can Teach (Offers)</label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={teachInput}
                onChange={(e) => setTeachInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addSkill("teach")}
                className="flex-1 bg-zinc-50 border border-zinc-100 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-green-500 outline-none"
                placeholder="e.g. React, Python"
              />
              <button 
                onClick={() => addSkill("teach")}
                className="bg-green-50 text-green-600 px-3 py-2 rounded-lg hover:bg-green-100 transition"
              >
                +
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.skillsToTeach.map(s => (
                <span key={s} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-green-50 text-green-700 text-[10px] font-medium border border-green-100">
                  {s}
                  <button onClick={() => removeSkill("teach", s)} className="hover:text-green-900 ml-1">✕</button>
                </span>
              ))}
              {profile.skillsToTeach.length === 0 && <p className="text-[10px] text-zinc-300 italic">No skills shared yet</p>}
            </div>
          </div>

          {/* Learn */}
          <div>
            <label className="block text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-2">Want to Learn (Wants)</label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={learnInput}
                onChange={(e) => setLearnInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addSkill("learn")}
                className="flex-1 bg-zinc-50 border border-zinc-100 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g. AI, Figma, Math"
              />
              <button 
                onClick={() => addSkill("learn")}
                className="bg-blue-50 text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-100 transition"
              >
                +
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.skillsToLearn.map(s => (
                <span key={s} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-[10px] font-medium border border-blue-100">
                  {s}
                  <button onClick={() => removeSkill("learn", s)} className="hover:text-blue-900 ml-1">✕</button>
                </span>
              ))}
              {profile.skillsToLearn.length === 0 && <p className="text-[10px] text-zinc-300 italic">No interests added yet</p>}
            </div>
          </div>
        </div>

        {/* Domains Section */}
        <div className="border-t border-zinc-50 pt-6">
          <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">My Domains (Select 3-6)</label>
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
                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition ${
                    isSelected 
                      ? "bg-indigo-600 text-white" 
                      : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                  }`}
                >
                  {d}
                </button>
              )
            })}
          </div>
          {profile.domains?.length < 3 && (
            <p className="text-[9px] text-amber-500 mt-2 font-medium">Please select at least 3 domains for best matching.</p>
          )}
        </div>
      </div>
    </div>
  )
}
