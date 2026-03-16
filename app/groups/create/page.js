"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";

function CreateGroupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  // Pre-filled invite from Discover page
  const inviteId   = searchParams.get("inviteId");
  const inviteName = searchParams.get("inviteName");

  const [groupName, setGroupName] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [members, setMembers] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [sessionNote, setSessionNote] = useState("");
  const [tags, setTags] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Current datetime strings for min restrictions
  const [todayStr, setTodayStr] = useState(""); // "YYYY-MM-DD"
  const [nowTimeStr, setNowTimeStr] = useState(""); // "HH:MM" in local time

  useEffect(() => {
    const now = new Date();
    // Local date
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    setTodayStr(`${y}-${m}-${d}`);

    // Local time rounded up to next minute
    const h = String(now.getHours()).padStart(2, "0");
    const min = String(now.getMinutes()).padStart(2, "0");
    setNowTimeStr(`${h}:${min}`);
  }, []);

  // Minimum start time: if today is selected, can't be in the past
  const minStartTime = date === todayStr ? nowTimeStr : "00:00";

  // Minimum end time: must be after start time
  const minEndTime = startTime || "00:00";

  // Handle date change — clear times if date changes
  const handleDateChange = (e) => {
    setDate(e.target.value);
    setStartTime("");
    setEndTime("");
  };

  // Handle start time change — clear end time if it's now invalid
  const handleStartTimeChange = (e) => {
    setStartTime(e.target.value);
    if (endTime && endTime <= e.target.value) {
      setEndTime("");
    }
  };

  if (!session) {
    return (
      <div className="max-w-md mx-auto mt-20 p-6 bg-slate-900 border border-slate-800 rounded-xl text-center">
        <h2 className="text-xl font-semibold mb-4 text-slate-100">Authentication Required</h2>
        <p className="text-slate-400 mb-6">You must be logged in to create a study group.</p>
        <button
          onClick={() => router.push("/Login")}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          Sign In
        </button>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validate: if session date provided, ensure it's not in the past
    if (date) {
      const now = new Date();
      const sessionDateTime = new Date(`${date}T${startTime || "00:00"}:00`);
      if (sessionDateTime < now) {
        setError("Session date and time cannot be in the past.");
        setLoading(false);
        return;
      }
      if (startTime && endTime && endTime <= startTime) {
        setError("End time must be after start time.");
        setLoading(false);
        return;
      }
    }

    // Build sessions array if date+time provided
    const sessions = [];
    if (date && startTime && endTime) {
      sessions.push({ date, startTime, endTime, note: sessionNote });
    }

    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: groupName,
          subject,
          description,
          maxMembers: Number(members) || 20,
          isPrivate: false,
          tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
          sessions,
          inviteMembers: inviteId ? [inviteId] : [],
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create group");
      }

      const data = await res.json();
      router.push(`/groups/${data.group._id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full bg-slate-800/60 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors text-sm";

  const labelClass = "block text-sm font-medium text-slate-300 mb-1.5";

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-8 px-4">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          Create Study Group
        </h1>
        <p className="text-slate-400 mt-2">
          Start a focused study session with like-minded students.
        </p>
      </div>

      {/* Invite banner — shown when coming from Discover */}
      {inviteId && inviteName && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-indigo-900/30 border border-indigo-700/40">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {inviteName.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-semibold text-indigo-200">Creating group with {inviteName}</p>
            <p className="text-xs text-indigo-400">They will be automatically added as a member when you create this group.</p>
          </div>
          <button onClick={() => router.push("/discover?tab=connections")} className="ml-auto text-indigo-500 hover:text-indigo-300 text-xs">✕ Remove</button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 rounded-lg bg-red-900/50 border border-red-800 text-red-200 text-sm flex items-start gap-2">
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {/* Form Card */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 backdrop-blur shadow-lg overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {/* Group Name */}
          <div>
            <label className={labelClass}>Group Name <span className="text-red-400">*</span></label>
            <input
              type="text"
              placeholder="DSA Study Squad"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className={inputClass}
              required
            />
          </div>

          {/* Subject */}
          <div>
            <label className={labelClass}>Subject / Topic <span className="text-red-400">*</span></label>
            <input
              type="text"
              placeholder="Data Structures & Algorithms"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className={inputClass}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className={labelClass}>Description</label>
            <textarea
              rows={3}
              placeholder="Explain what the group will study..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Max Members + Tags */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Maximum Members</label>
              <input
                type="number"
                placeholder="20"
                min={2}
                max={100}
                value={members}
                onChange={(e) => setMembers(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Tags (comma separated)</label>
              <input
                type="text"
                placeholder="dsa, graphs, cp"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>



          {/* Divider — First Session */}
          <div className="border-t border-slate-800 pt-4">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-xs text-slate-500 uppercase tracking-widest font-medium">
                First Session (optional)
              </p>
            </div>

            {/* Date — cannot be in the past */}
            <div className="mb-4">
              <label className={labelClass}>Study Date</label>
              <input
                type="date"
                value={date}
                min={todayStr}
                onChange={handleDateChange}
                className={inputClass}
              />
              {todayStr && (
                <p className="text-xs text-slate-600 mt-1">Select today ({todayStr}) or a future date</p>
              )}
            </div>

            {/* Start + End time */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className={labelClass}>Start Time</label>
                <input
                  type="time"
                  value={startTime}
                  min={minStartTime}
                  onChange={handleStartTimeChange}
                  disabled={!date}
                  className={inputClass + (!date ? " opacity-40 cursor-not-allowed" : "")}
                />
                {date === todayStr && (
                  <p className="text-xs text-slate-600 mt-1">Must be after current time</p>
                )}
              </div>
              <div>
                <label className={labelClass}>End Time</label>
                <input
                  type="time"
                  value={endTime}
                  min={minEndTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  disabled={!startTime}
                  className={inputClass + (!startTime ? " opacity-40 cursor-not-allowed" : "")}
                />
                {startTime && (
                  <p className="text-xs text-slate-600 mt-1">Must be after start time</p>
                )}
              </div>
            </div>

            {/* Session Note */}
            <div>
              <label className={labelClass}>Session Note</label>
              <input
                type="text"
                placeholder="e.g. Graphs chapter, bring notebook"
                value={sessionNote}
                onChange={(e) => setSessionNote(e.target.value)}
                disabled={!date}
                className={inputClass + (!date ? " opacity-40 cursor-not-allowed" : "")}
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 py-3 rounded-lg font-medium text-slate-400 bg-slate-800 hover:bg-slate-700 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-colors text-sm shadow-lg shadow-indigo-500/20"
            >
              {loading ? "Creating..." : "Create Group"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

export default function CreateGroupPage() {
  return (
    <Suspense fallback={<div className="max-w-2xl mx-auto py-8 px-4 text-slate-400">Loading...</div>}>
      <CreateGroupForm />
    </Suspense>
  );
}
