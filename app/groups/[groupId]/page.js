"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Calendar, MessageSquare, Users,
  Clock, Trash2, LogOut, Crown, Send, Tag, Radio, Lock,
} from "lucide-react";
import { toast } from "react-toastify";

/* ── helpers ──────────────────────────────────────────────────── */
function toLocalDateStr(d) {
  const dd = new Date(d);
  return `${dd.getFullYear()}-${String(dd.getMonth() + 1).padStart(2, "0")}-${String(dd.getDate()).padStart(2, "0")}`;
}

/* ── glass card ─────────────────────────────────────────────── */
function GlassCard({ children, className = "" }) {
  return (
    <div className={`relative rounded-2xl border border-white/[0.07] bg-white/[0.025] overflow-hidden ${className}`}>
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
      {children}
    </div>
  );
}

/* ── section head ───────────────────────────────────────────── */
function SectionHead({ icon: Icon, label, accent = "sky" }) {
  const colors = {
    sky:    "bg-sky-500/10 text-sky-400 border-sky-500/20",
    indigo: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  };
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className={`w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0 ${colors[accent]}`}>
        <Icon style={{ width: 16, height: 16 }} />
      </div>
      <h2 className="text-lg font-black text-white tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
        {label}
      </h2>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════ */
export default function GroupDetailPage() {
  const { groupId } = useParams();
  const { data: session } = useSession();
  const router = useRouter();

  const [group,         setGroup]         = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState("");
  const [joining,       setJoining]       = useState(false);
  const [leaving,       setLeaving]       = useState(false);
  const [slotAction,    setSlotAction]    = useState({});
  const [addingComment, setAddingComment] = useState(false);
  const [showAddSlot, setShowAddSlot] = useState(false);

  /* ── all original logic untouched ────────────────────────── */
  useEffect(() => { fetchGroup(); }, [groupId]);

  const fetchGroup = async (quiet = false) => {
    try {
      if (!quiet) setLoading(true);
      const res = await fetch(`/api/groups/${groupId}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load group");
      setGroup(data.group);
    } catch (err) { setError(err.message); }
    finally { if (!quiet) setLoading(false); }
  };

  const handleJoin = async () => {
    if (!session) return router.push("/Login");
    
    let providedPasscode = null;
    if (group?.isPrivate) {
      providedPasscode = prompt("This room is private. Enter numeric passcode to join:");
      if (providedPasscode === null) return; // user cancelled
    }

    setJoining(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/join`, { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode: providedPasscode }) 
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed to join"); }
      await fetchGroup();
      toast.success("Joined group successfully!");
    } catch (err) { toast.error(err.message); }
    finally { setJoining(false); }
  };

  const handleLeave = async () => {
    setLeaving(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/leave`, { method: "POST" });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed to leave"); }
      await fetchGroup();
      toast.success("You have left the group.");
    } catch (err) { toast.error(err.message); }
    finally { setLeaving(false); }
  };

  const handleJoinSlot = async (sessionId) => {
    setSlotAction(p => ({ ...p, [sessionId]: "joining" }));
    try {
      const res = await fetch(`/api/groups/${groupId}/sessions/${sessionId}/join`, { method: "POST" });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed to join slot"); }
      await fetchGroup(true);
      toast.success("Joined session slot!");
    } catch (err) { toast.error(err.message); }
    finally { setSlotAction(p => ({ ...p, [sessionId]: null })); }
  };

  const handleLeaveSlot = async (sessionId) => {
    setSlotAction(p => ({ ...p, [sessionId]: "leaving" }));
    try {
      const res = await fetch(`/api/groups/${groupId}/sessions/${sessionId}/join`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed to leave slot"); }
      await fetchGroup(true);
      toast.success("Left session slot.");
    } catch (err) { toast.error(err.message); }
    finally { setSlotAction(p => ({ ...p, [sessionId]: null })); }
  };

  const handleAddSession = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const date = formData.get("date");
    const startTime = formData.get("startTime");
    const endTime = formData.get("endTime");
    const note = formData.get("note");

    if (!date || !startTime || !endTime) return toast.error("Please fill in date and times");

    try {
      const res = await fetch(`/api/groups/${groupId}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, startTime, endTime, note }),
      });
      if (!res.ok) throw new Error("Failed to add session");
      e.target.reset();
      setShowAddSlot(false);
      await fetchGroup(true);
      toast.success("New session slot added!");
    } catch (err) { toast.error(err.message); }
  };

  const handleDeleteSlot = async (sessionId) => {
    if (!confirm("Remove this session slot?")) return;
    try {
      const res = await fetch(`/api/groups/${groupId}/sessions?sessionId=${sessionId}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed to delete slot"); }
      await fetchGroup(true);
      toast.success("Session slot removed.");
    } catch (err) { toast.error(err.message); }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    setAddingComment(true);
    const content = e.target.content.value;
    try {
      const res = await fetch(`/api/groups/${groupId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error("Failed to post comment");
      e.target.reset();
      await fetchGroup(true);
    } catch (err) { toast.error(err.message); }
    finally { setAddingComment(false); }
  };
  /* ── end logic ──────────────────────────────────────────── */

  /* ── loading ─────────────────────────────────────────────── */
  if (loading) return (
    <div className="min-h-screen bg-[#060810] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-9 h-9 border-2 border-sky-500/20 border-t-sky-500 rounded-full animate-spin" />
        <p className="text-gray-600 text-xs uppercase tracking-widest">Loading...</p>
      </div>
    </div>
  );

  /* ── error ───────────────────────────────────────────────── */
  if (error || !group) return (
    <div className="min-h-screen bg-[#060810] flex items-center justify-center p-6">
      <GlassCard className="max-w-sm w-full p-8 text-center border-rose-500/20">
        <Radio className="mx-auto text-rose-400 mb-3" style={{ width: 28, height: 28 }} />
        <p className="text-white font-bold mb-1">Group not found</p>
        <p className="text-gray-500 text-sm mb-5">{error || "This group may have been removed."}</p>
        <button onClick={() => router.push("/groups")}
          className="px-5 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-gray-300 text-sm font-semibold hover:text-white transition-colors">
          Back to Groups
        </button>
      </GlassCard>
    </div>
  );

  const userId   = session?.user?.id;
  const isMember = session && (group.members || []).some(m => String(m._id) === String(userId));
  const isOwner  = session && String(group.owner._id) === String(userId);
  const fillPct  = Math.round(((group.members || []).length / group.maxMembers) * 100);
  const subjectHue = ((group.subject?.charCodeAt(0) || 200) * 37) % 360;

  return (
    <div className="min-h-screen bg-[#060810] text-gray-100">

      {/* ambient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.05)_0%,transparent_70%)]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[400px] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.05)_0%,transparent_70%)]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 lg:px-8 py-10">

        {/* back */}
        <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
          <Link href="/groups"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-8 group text-sm font-semibold">
            <ArrowLeft style={{ width: 15, height: 15 }} className="group-hover:-translate-x-0.5 transition-transform" />
            Back to Groups
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* ══════════════════════════
              SIDEBAR
          ══════════════════════════ */}
          <div className="lg:col-span-4 space-y-4">

            {/* identity card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22,1,0.36,1] }}>
              <GlassCard className="p-6">
                {/* subject accent bar */}
                <div className="absolute left-0 top-8 bottom-8 w-[3px] rounded-full opacity-60"
                  style={{ background: `hsl(${subjectHue},65%,55%)` }} />

                <div className="pl-3 space-y-4">
                  <span className="inline-block text-[10px] font-black uppercase tracking-[0.22em] px-3 py-1 rounded-full border"
                    style={{
                      color: `hsl(${subjectHue},65%,65%)`,
                      borderColor: `hsl(${subjectHue},60%,38%)`,
                      background: `hsl(${subjectHue},65%,10%)`,
                    }}>
                    {group.subject}
                  </span>

                  {group.isPrivate && (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-black uppercase tracking-widest self-start">
                      <Lock style={{ width: 10, height: 10 }} /> Private Room
                    </div>
                  )}

                  <h1 className="text-2xl font-black text-white leading-snug tracking-tight"
                    style={{ fontFamily: "'Syne', sans-serif" }}>
                    {group.name}
                  </h1>

                  <p className="text-gray-500 text-sm leading-relaxed">
                    {group.description || "No description provided."}
                  </p>

                  {/* owner */}
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                      {group.owner.name?.charAt(0)}
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-600 uppercase font-bold tracking-widest flex items-center gap-1">
                        <Crown style={{ width: 9, height: 9 }} className="text-amber-400" /> Owner
                      </p>
                      <p className="text-sm font-bold text-gray-200">{group.owner.name}</p>
                    </div>
                  </div>

                  {/* member bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-gray-600 uppercase tracking-widest">
                      <span className="flex items-center gap-1.5"><Users style={{ width: 11, height: 11 }} />Members</span>
                      <span className={fillPct >= 100 ? "text-amber-400" : "text-gray-400"}>
                        {(group.members || []).length} / {group.maxMembers}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-white/[0.05] rounded-full overflow-hidden">
                      <motion.div className="h-full rounded-full"
                        style={{ background: fillPct >= 100 ? "#f59e0b" : "#6366f1" }}
                        initial={{ width: 0 }}
                        animate={{ width: `${fillPct}%` }}
                        transition={{ duration: 0.9, ease: "easeOut" }}
                      />
                    </div>
                  </div>

                  {/* CTA */}
                  {!session ? (
                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      onClick={() => router.push("/Login")}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold text-sm shadow-lg shadow-sky-500/15">
                      Sign in to Join
                    </motion.button>
                  ) : isOwner ? (
                    <div className="w-full py-3 rounded-xl bg-amber-500/[0.07] border border-amber-500/20 text-amber-400 font-bold text-xs uppercase tracking-widest text-center flex items-center justify-center gap-2">
                      <Crown style={{ width: 13, height: 13 }} /> You own this group
                    </div>
                  ) : isMember ? (
                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      disabled={leaving} onClick={handleLeave}
                      className="w-full py-3 rounded-xl bg-rose-500/[0.07] border border-rose-500/20 text-rose-400 font-bold text-sm flex items-center justify-center gap-2 hover:bg-rose-500/[0.12] transition-all disabled:opacity-40">
                      <LogOut style={{ width: 14, height: 14 }} />
                      {leaving ? "Leaving..." : "Leave Group"}
                    </motion.button>
                  ) : (group.members || []).length >= group.maxMembers ? (
                    <div className="w-full py-3 rounded-xl bg-white/[0.02] border border-white/[0.05] text-gray-600 font-bold text-xs text-center">
                      Group Full
                    </div>
                  ) : (
                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      disabled={joining} onClick={handleJoin}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold text-sm shadow-lg shadow-sky-500/15 disabled:opacity-40">
                      {joining ? "Joining..." : "Join Study Group"}
                    </motion.button>
                  )}
                </div>
              </GlassCard>
            </motion.div>

            {/* tags */}
            {(group.tags || []).length > 0 && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
                <GlassCard className="p-4">
                  <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest flex items-center gap-1.5 mb-3">
                    <Tag style={{ width: 10, height: 10 }} /> Tags
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {group.tags.map(t => (
                      <span key={t} className="text-[11px] px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.07] text-gray-500 hover:text-gray-300 transition-colors cursor-default">
                        #{t}
                      </span>
                    ))}
                  </div>
                </GlassCard>
              </motion.div>
            )}

            {/* members list */}
            {(group.members || []).length > 0 && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}>
                <GlassCard className="p-4">
                  <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest flex items-center gap-1.5 mb-3">
                    <Users style={{ width: 10, height: 10 }} /> Members ({(group.members || []).length})
                  </p>
                  <div className="space-y-2.5">
                    {(group.members || []).slice(0, 6).map(m => (
                      <div key={m._id} className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sky-500/30 to-indigo-600/30 border border-white/[0.08] flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                          {m.name?.charAt(0)}
                        </div>
                        <span className="text-gray-400 text-xs font-medium truncate">{m.name}</span>
                        {String(m._id) === String(group.owner._id) && (
                          <Crown className="text-amber-400 ml-auto flex-shrink-0" style={{ width: 11, height: 11 }} />
                        )}
                      </div>
                    ))}
                    {(group.members || []).length > 6 && (
                      <p className="text-gray-700 text-xs">+{(group.members || []).length - 6} more</p>
                    )}
                  </div>
                </GlassCard>
              </motion.div>
            )}
          </div>

          {/* ══════════════════════════
              MAIN CONTENT
          ══════════════════════════ */}
          <div className="lg:col-span-8 space-y-5">

            {/* sessions */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05, ease: [0.22,1,0.36,1] }}>
              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <SectionHead icon={Calendar} label="Sessions" accent="sky" />
                  {isOwner && (
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={() => setShowAddSlot(!showAddSlot)}
                      className="px-3 py-1.5 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[10px] font-black uppercase tracking-widest hover:bg-sky-500/20 transition-all">
                      {showAddSlot ? "Cancel" : "Add Session"}
                    </motion.button>
                  )}
                </div>

                {showAddSlot && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mb-6 overflow-hidden">
                    <form onSubmit={handleAddSession} className="p-4 rounded-xl border border-sky-500/20 bg-sky-500/[0.03] space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-gray-500 uppercase">Date</label>
                          <input type="date" name="date" required className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white [color-scheme:dark]" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-gray-500 uppercase">Start</label>
                          <input type="time" name="startTime" required className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white [color-scheme:dark]" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-gray-500 uppercase">End</label>
                          <input type="time" name="endTime" required className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white [color-scheme:dark]" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-500 uppercase">Note (Optional)</label>
                        <input type="text" name="note" placeholder="e.g. Chapter 4 review" className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-600" />
                      </div>
                      <button type="submit" className="w-full py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all shadow-lg shadow-sky-600/20">
                        Create Session Slot
                      </button>
                    </form>
                  </motion.div>
                )}

                {(group.sessions || []).length === 0 ? (
                  <div className="py-14 text-center rounded-xl border border-dashed border-white/[0.07]">
                    <Calendar className="mx-auto text-gray-700 mb-2" style={{ width: 26, height: 26 }} />
                    <p className="text-gray-600 text-sm">No sessions scheduled yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(group.sessions || []).map((s) => {
                      const dateStr      = toLocalDateStr(new Date(s.date));
                      const now          = new Date();
                      const sessionStart = new Date(`${dateStr}T${s.startTime}:00`);
                      const sessionEnd   = new Date(`${dateStr}T${s.endTime}:00`);
                      
                      // Handle slots that cross midnight (e.g. 23:00 -> 01:00)
                      if (sessionEnd < sessionStart) {
                        sessionEnd.setDate(sessionEnd.getDate() + 1);
                      }
                      
                      const isPast       = sessionEnd < now;
                      const isInProgress = now >= sessionStart && now <= sessionEnd;
                      const dbStatus     = s.status || "scheduled";
                      const isLive       = dbStatus === "active" || isInProgress;
                      const hasJoined    = (s.participants || []).some(p => {
                        const pId = p?._id ? String(p._id) : String(p);
                        return pId === String(userId);
                      });
                      const acting = slotAction[s._id];

                      return (
                        <div key={s._id}
                          className={`relative rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center gap-4 overflow-hidden transition-all duration-200 ${
                            isPast || dbStatus === "completed"
                              ? "border-white/[0.04] bg-white/[0.01] opacity-40"
                              : isLive
                              ? "border-emerald-500/30 bg-emerald-500/[0.04]"
                              : "border-white/[0.07] bg-white/[0.02] hover:border-white/[0.12]"
                          }`}
                        >
                          {isLive && <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-emerald-400 animate-pulse rounded-l-xl" />}

                          {/* date + time */}
                          <div className="flex-1 pl-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className={`text-[10px] font-bold uppercase tracking-widest ${
                                isLive ? "text-emerald-400" : isPast ? "text-gray-700" : "text-sky-400"
                              }`}>
                                {new Date(s.date).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}
                              </span>
                              {(isPast || dbStatus === "completed") && (
                                <span className="text-[9px] bg-white/[0.04] text-gray-600 px-2 py-0.5 rounded-full border border-white/[0.06]">Completed</span>
                              )}
                              {isLive && (
                                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[9px] font-black">
                                  <span className="w-1 h-1 rounded-full bg-white animate-ping inline-block" /> LIVE
                                </span>
                              )}
                              {!isPast && !isLive && dbStatus === "scheduled" && (
                                <span className="text-[9px] bg-sky-500/[0.08] text-sky-500 border border-sky-500/20 px-2 py-0.5 rounded-full">Scheduled</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-white font-black font-mono text-base">
                              <Clock style={{ width: 12, height: 12 }} className="text-gray-600 flex-shrink-0" />
                              {s.startTime}
                              <span className="text-gray-700 font-sans text-xs">→</span>
                              {s.endTime}
                            </div>
                            {s.note && <p className="text-xs text-gray-600 mt-1">{s.note}</p>}
                          </div>

                          {/* participants */}
                          <div className="flex items-center gap-1.5 text-xs text-gray-600 flex-shrink-0">
                            <Users style={{ width: 11, height: 11 }} />
                            {s.participants?.length ?? 0} joined
                          </div>

                          {/* actions */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {isOwner && !isPast && (
                              <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
                                onClick={() => handleDeleteSlot(s._id)}
                                className="w-8 h-8 rounded-lg bg-rose-500/[0.07] border border-rose-500/20 text-rose-500 flex items-center justify-center hover:bg-rose-500/20 transition-all">
                                <Trash2 style={{ width: 12, height: 12 }} />
                              </motion.button>
                            )}

                            {isMember && !isOwner && !isPast && (
                              hasJoined ? (
                                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                  onClick={() => handleLeaveSlot(s._id)} disabled={acting === "leaving"}
                                  className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-gray-500 text-xs font-semibold hover:text-rose-400 hover:border-rose-500/20 transition-all disabled:opacity-40">
                                  Leave Slot
                                </motion.button>
                              ) : (
                                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                  onClick={() => handleJoinSlot(s._id)} disabled={acting === "joining"}
                                  className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all disabled:opacity-40">
                                  Join Slot
                                </motion.button>
                              )
                            )}

                            {hasJoined && !isPast && (
                              <span className="text-[9px] bg-emerald-500/[0.07] border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                                You&apos;re in
                              </span>
                            )}

                            {isLive && (isMember || isOwner) && (
                              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                                onClick={() => router.push(`/groups/${groupId}/session/${s._id}`)}
                                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-black shadow-lg shadow-emerald-500/20 transition-all">
                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping inline-block" />
                                Enter Room
                              </motion.button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </GlassCard>
            </motion.div>

            {/* discussion */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1, ease: [0.22,1,0.36,1] }}>
              <GlassCard className="p-6">
                <SectionHead icon={MessageSquare} label="Discussion" accent="indigo" />

                <div className="space-y-3 mb-5 max-h-[400px] overflow-y-auto pr-1"
                  style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.07) transparent" }}>
                  {(group.comments || []).length === 0 ? (
                    <div className="py-14 text-center rounded-xl border border-dashed border-white/[0.07]">
                      <MessageSquare className="mx-auto text-gray-700 mb-2" style={{ width: 26, height: 26 }} />
                      <p className="text-gray-600 text-sm">Be the first to start the conversation.</p>
                    </div>
                  ) : (
                    group.comments.map((c, i) => (
                      <motion.div key={c._id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.09] transition-all"
                      >
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500/30 to-indigo-600/30 border border-white/[0.08] flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                          {c.author?.name?.charAt(0) || "U"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-gray-300">{c.author?.name || "Anonymous"}</span>
                            <span className="text-[10px] text-gray-700">
                              {new Date(c.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400 leading-relaxed whitespace-pre-wrap">{c.content}</p>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>

                {isMember || isOwner ? (
                  <form onSubmit={handleAddComment}>
                    <div className="flex items-end gap-2 p-2 rounded-xl border border-white/[0.08] bg-white/[0.03] focus-within:border-sky-500/30 transition-all">
                      <textarea name="content" required rows={2}
                        placeholder="Share something with the group..."
                        className="flex-1 bg-transparent px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none resize-none leading-relaxed" />
                      <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
                        type="submit" disabled={addingComment}
                        className="w-9 h-9 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-sky-500/15 disabled:opacity-40">
                        {addingComment
                          ? <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                          : <Send style={{ width: 13, height: 13 }} />
                        }
                      </motion.button>
                    </div>
                  </form>
                ) : (
                  <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] text-center">
                    <p className="text-gray-600 text-sm">Join this group to participate in the discussion.</p>
                  </div>
                )}
              </GlassCard>
            </motion.div>

          </div>
        </div>
      </div>
    </div>
  );
}
