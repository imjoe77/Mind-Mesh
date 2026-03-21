"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, BookOpen, FileText, Tag, Calendar,
  Clock, AlignLeft, AlertCircle, ArrowLeft, Plus, X, Lock,
} from "lucide-react";
import { toast } from "react-toastify";

/* ── shared input style ─────────────────────────────────────────── */
const inputCls =
  "w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-gray-200 placeholder-gray-600 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed [color-scheme:dark]";

/* ── field wrapper ──────────────────────────────────────────────── */
function Field({ label, hint, required, icon: Icon, children }) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-widest">
        {Icon && <Icon style={{ width: 11, height: 11 }} />}
        {label}
        {required && <span className="text-sky-400 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-gray-700 pl-0.5">{hint}</p>}
    </div>
  );
}

/* ── section divider ────────────────────────────────────────────── */
function Divider({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="h-px flex-1 bg-white/[0.06]" />
      <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-600 uppercase tracking-widest">
        {Icon && <Icon style={{ width: 11, height: 11 }} className="text-sky-500" />}
        {label}
      </div>
      <div className="h-px flex-1 bg-white/[0.06]" />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   FORM
══════════════════════════════════════════════════════════════════ */
function CreateGroupForm() {
  const router      = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const inviteId   = searchParams.get("inviteId");
  const inviteName = searchParams.get("inviteName");

  const [groupName,    setGroupName]    = useState("");
  const [subject,      setSubject]      = useState("");
  const [description,  setDescription]  = useState("");
  const [members,      setMembers]      = useState("");
  const [date,         setDate]         = useState("");
  const [startTime,    setStartTime]    = useState("");
  const [endTime,      setEndTime]      = useState("");
  const [sessionNote,  setSessionNote]  = useState("");
  const [tags,         setTags]         = useState("");
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");

  const [isPrivate,    setIsPrivate]    = useState(false);
  const [passcode,     setPasscode]     = useState("");

  const [todayStr,   setTodayStr]   = useState("");
  const [nowTimeStr, setNowTimeStr] = useState("");

  /* ── all original logic unchanged ─────────────────────────────── */
  useEffect(() => {
    const now = new Date();
    const y   = now.getFullYear();
    const m   = String(now.getMonth() + 1).padStart(2, "0");
    const d   = String(now.getDate()).padStart(2, "0");
    setTodayStr(`${y}-${m}-${d}`);
    const h   = String(now.getHours()).padStart(2, "0");
    const min = String(now.getMinutes()).padStart(2, "0");
    setNowTimeStr(`${h}:${min}`);
  }, []);

  const minStartTime = date === todayStr ? nowTimeStr : "00:00";
  const minEndTime   = startTime || "00:00";

  const handleDateChange = (e) => {
    setDate(e.target.value);
    setStartTime("");
    setEndTime("");
  };

  const handleStartTimeChange = (e) => {
    setStartTime(e.target.value);
    if (endTime && endTime <= e.target.value) setEndTime("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (date) {
      const now = new Date();
      const sessionDateTime = new Date(`${date}T${startTime || "00:00"}:00`);
      if (sessionDateTime < now) {
        toast.error("Session date and time cannot be in the past.");
        setError("Session date and time cannot be in the past.");
        setLoading(false);
        return;
      }
      if (startTime && endTime && endTime <= startTime) {
        toast.error("End time must be after start time.");
        setError("End time must be after start time.");
        setLoading(false);
        return;
      }
    }

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
          isPrivate,
          passcode: isPrivate ? passcode : null,
          tags: tags ? tags.split(",").map(t => t.trim()).filter(Boolean) : [],
          sessions,
          inviteMembers: inviteId ? [inviteId] : [],
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create group");
      }

      const data = await res.json();
      toast.success("Study group created successfully!");
      router.push(`/groups/${data.group._id}`);
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };
  /* ── end logic ──────────────────────────────────────────────────── */

  /* ── unauthenticated ─────────────────────────────────────────────── */
  if (!session) return (
    <div className="min-h-screen bg-[#060810] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm text-center"
      >
        <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
          <Users className="text-white" style={{ width: 24, height: 24 }} />
        </div>
        <h2 className="text-xl font-black text-white mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>
          Sign in required
        </h2>
        <p className="text-gray-500 text-sm mb-6">You must be signed in to create a study group.</p>
        <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
          onClick={() => router.push("/Login")}
          className="px-8 py-3 bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-sky-500/20">
          Sign In
        </motion.button>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#060810] text-gray-100">

      {/* ambient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.05)_0%,transparent_70%)]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[400px] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.05)_0%,transparent_70%)]" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-10">

        {/* ── back ── */}
        <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
          <button onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-8 group text-sm font-semibold">
            <ArrowLeft style={{ width: 15, height: 15 }} className="group-hover:-translate-x-0.5 transition-transform" />
            Back
          </button>
        </motion.div>

        {/* ── page header ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8"
        >
          <span className="text-sky-400 text-xs font-bold uppercase tracking-widest block mb-2">New Group</span>
          <h1 className="text-3xl font-black text-white tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
            Create Study Group
          </h1>
          <p className="text-gray-500 mt-2 text-sm">
            Set up a focused study space and invite members to collaborate.
          </p>
        </motion.div>

        {/* ── invite banner ── */}
        <AnimatePresence>
          {inviteId && inviteName && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              className="flex items-center gap-3 p-4 rounded-xl border border-sky-500/20 bg-sky-500/[0.06] mb-6"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                {inviteName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-sky-200">Creating with {inviteName}</p>
                <p className="text-xs text-sky-500 mt-0.5">They will be automatically added as a member.</p>
              </div>
              <button
                onClick={() => router.push("/discover?tab=connections")}
                className="text-gray-600 hover:text-gray-400 transition-colors flex-shrink-0 p-1 rounded-lg hover:bg-white/[0.05]"
              >
                <X style={{ width: 14, height: 14 }} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── error ── */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-start gap-3 p-4 rounded-xl border border-rose-500/20 bg-rose-500/[0.06] mb-6 text-rose-300 text-sm"
            >
              <AlertCircle style={{ width: 15, height: 15 }} className="flex-shrink-0 mt-0.5 text-rose-400" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── form card ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="relative rounded-2xl border border-white/[0.07] bg-white/[0.025] overflow-hidden"
        >
          {/* top shimmer */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.1] to-transparent" />

          <form onSubmit={handleSubmit} className="p-6 space-y-5">

            {/* group info */}
            <Divider icon={BookOpen} label="Group Info" />

            <Field label="Group Name" required icon={BookOpen}>
              <input type="text" placeholder="e.g. DSA Study Squad"
                value={groupName} onChange={e => setGroupName(e.target.value)}
                className={inputCls} required />
            </Field>

            <Field label="Subject / Topic" required icon={AlignLeft}>
              <input type="text" placeholder="e.g. Data Structures & Algorithms"
                value={subject} onChange={e => setSubject(e.target.value)}
                className={inputCls} required />
            </Field>

            <Field label="Description" icon={FileText}>
              <textarea rows={3} placeholder="What will this group study? Any goals or expectations?"
                value={description} onChange={e => setDescription(e.target.value)}
                className={inputCls + " resize-none"} />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Max Members" icon={Users}>
                <input type="number" placeholder="20" min={2} max={100}
                  value={members} onChange={e => setMembers(e.target.value)}
                  className={inputCls} />
              </Field>
              <Field label="Tags" icon={Tag} hint="Comma separated">
                <input type="text" placeholder="dsa, graphs, cp"
                  value={tags} onChange={e => setTags(e.target.value)}
                  className={inputCls} />
              </Field>
            </div>

            {/* first session */}
            <Divider icon={Calendar} label="First Session (Optional)" />

            <Field label="Study Date" icon={Calendar}
              hint={todayStr ? `Select today (${todayStr}) or a future date` : undefined}>
              <input type="date" value={date} min={todayStr}
                onChange={handleDateChange} className={inputCls} />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Start Time" icon={Clock}
                hint={date === todayStr ? "Must be after current time" : undefined}>
                <input type="time" value={startTime} min={minStartTime}
                  onChange={handleStartTimeChange}
                  disabled={!date} className={inputCls} />
              </Field>
              <Field label="End Time" icon={Clock}
                hint={startTime ? "Must be after start time" : undefined}>
                <input type="time" value={endTime} min={minEndTime}
                  onChange={e => setEndTime(e.target.value)}
                  disabled={!startTime} className={inputCls} />
              </Field>
            </div>

            <Field label="Session Note" icon={FileText}>
              <input type="text" placeholder="e.g. Graphs chapter — bring notebook"
                value={sessionNote} onChange={e => setSessionNote(e.target.value)}
                disabled={!date} className={inputCls} />
            </Field>

            {/* ── privacy settings ── */}
            <Divider icon={Lock} label="Privacy Settings" />
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 space-y-4 shadow-inner">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-gray-200">Private Room</h4>
                  <p className="text-[10px] text-gray-500 max-w-[200px]">Require a numeric passcode to join this group</p>
                </div>
                <button type="button" onClick={() => setIsPrivate(!isPrivate)}
                  className={`w-12 h-6 rounded-full transition-all relative ${isPrivate ? 'bg-sky-500 shadow-inner' : 'bg-white/[0.05] border border-white/[0.1]'}`}>
                  <motion.div animate={{ x: isPrivate ? 26 : 4 }} className={`w-4 h-4 rounded-full absolute top-1 ${isPrivate ? 'bg-white shadow-lg' : 'bg-gray-600'}`} />
                </button>
              </div>

              <AnimatePresence>
                {isPrivate && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-white/[0.06] pt-4">
                    <Field label="Numeric Passcode (4-6 digits)" icon={Lock} required>
                       <input type="text" inputMode="numeric" pattern="[0-9]*" placeholder="e.g. 1234" maxLength={6}
                         value={passcode} onChange={e => setPasscode(e.target.value.replace(/[^0-9]/g, ''))}
                         className={inputCls} required={isPrivate} />
                    </Field>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── submit row ── */}
            <div className="flex gap-3 pt-2 border-t border-white/[0.06]">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                type="button" onClick={() => router.back()}
                className="flex-1 py-3 rounded-xl font-semibold text-gray-500 bg-white/[0.04] border border-white/[0.08] hover:text-gray-300 hover:bg-white/[0.06] transition-all text-sm">
                Cancel
              </motion.button>

              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                type="submit" disabled={loading}
                className="flex-1 py-3 rounded-xl font-bold text-white text-sm bg-gradient-to-r from-sky-500 to-indigo-600 shadow-lg shadow-sky-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 relative overflow-hidden group"
              >
                {/* shimmer */}
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 pointer-events-none" />
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus style={{ width: 15, height: 15 }} />
                    Create Group
                  </>
                )}
              </motion.button>
            </div>

          </form>
        </motion.div>

      </div>
    </div>
  );
}

/* ── page export ─────────────────────────────────────────────────── */
export default function CreateGroupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#060810] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-sky-500/20 border-t-sky-500 rounded-full animate-spin" />
      </div>
    }>
      <CreateGroupForm />
    </Suspense>
  );
}
