"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Search, Calendar, Users, ArrowRight, Plus, Radio, X, Zap } from "lucide-react";
import { toast } from "react-toastify";

/* ── per-card cursor glare ─────────────────────────────────────────── */
function GroupCard({ group, role, isActioning, isFull, isLive, onJoin, onLeave }) {
  const glareRef = useRef(null);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  const onMouseMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    if (glareRef.current) {
      glareRef.current.style.background = `radial-gradient(260px circle at ${e.clientX - r.left}px ${e.clientY - r.top}px, rgba(56,189,248,0.07), transparent 70%)`;
    }
  };
  const onMouseLeave = () => { if (glareRef.current) glareRef.current.style.background = "none"; };

  /* unique hue per subject for the accent line */
  const subjectHue = ((group.subject?.charCodeAt(0) || 180) * 37) % 360;
  const fillPct = Math.round((group.members?.length / group.maxMembers) * 100) || 0;
  const fillColor = isFull ? "#f59e0b" : fillPct > 70 ? "#38bdf8" : "#6366f1";

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-3"
    >
      {/* ── main card ── */}
      <div
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        className="relative rounded-2xl border border-white/[0.07] bg-white/[0.025] overflow-hidden flex flex-col gap-5 p-6 cursor-default
          hover:border-sky-500/25 hover:bg-white/[0.04] transition-all duration-300 group"
      >
        {/* cursor glare */}
        <div ref={glareRef} className="absolute inset-0 pointer-events-none transition-all duration-75 rounded-2xl" />

        {/* top shimmer */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

        {/* coloured left accent bar */}
        <div
          className="absolute left-0 top-6 bottom-6 w-[3px] rounded-full opacity-60"
          style={{ background: `hsl(${subjectHue},65%,55%)` }}
        />

        {/* live badge */}
        {isLive && (
          <div className="absolute top-5 right-5 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
            Live
          </div>
        )}

        {/* subject + name */}
        <div className="pl-3">
          <span
            className="text-[10px] font-black uppercase tracking-[0.22em] block mb-1.5"
            style={{ color: `hsl(${subjectHue},65%,65%)` }}
          >
            {group.subject}
          </span>
          <h3 className="text-lg font-black text-white tracking-tight leading-snug group-hover:text-sky-200 transition-colors duration-200"
            style={{ fontFamily: "'Syne', sans-serif" }}>
            {group.name}
          </h3>
        </div>

        {/* description */}
        <p className="text-gray-500 text-sm leading-relaxed line-clamp-2 pl-3">
          {group.description || "An active collaborative study node exploring advanced learning paths."}
        </p>

        {/* tags */}
        {group.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pl-3">
            {group.tags.slice(0, 4).map(t => (
              <span key={t} className="text-[11px] px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-gray-500">{t}</span>
            ))}
          </div>
        )}

        {/* member bar */}
        <div className="pl-3 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-gray-600 uppercase tracking-widest">
            <span className="flex items-center gap-1.5">
              <Users style={{ width: 11, height: 11 }} />
              Members
            </span>
            <span className={isFull ? "text-amber-400" : "text-gray-400"}>
              {group.members?.length ?? 0} / {group.maxMembers}
            </span>
          </div>
          <div className="h-1.5 w-full bg-white/[0.05] rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: fillColor }}
              initial={{ width: 0 }}
              animate={inView ? { width: `${fillPct}%` } : {}}
              transition={{ duration: 0.9, delay: 0.3, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>

      {/* ── action row ── */}
      <div className="flex items-center gap-2.5 px-1">
        {role === "owner" ? (
          <Link href={`/groups/${group._id}`}
            className="flex-1 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-gray-300 text-xs font-bold text-center hover:bg-white/[0.07] hover:text-white transition-all duration-200">
            Manage Group
          </Link>
        ) : role === "member" ? (
          <button onClick={() => onLeave(group._id)} disabled={isActioning === "leaving"}
            className="flex-1 py-2.5 rounded-xl bg-rose-500/[0.07] border border-rose-500/20 text-rose-400 text-xs font-bold hover:bg-rose-500/[0.12] transition-all duration-200 disabled:opacity-40">
            {isActioning === "leaving" ? "Leaving..." : "Leave Group"}
          </button>
        ) : isFull ? (
          <span className="flex-1 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] text-gray-600 text-xs font-bold text-center">
            Group Full
          </span>
        ) : (
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => onJoin(group._id)} disabled={isActioning === "joining"}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 text-white text-xs font-bold shadow-md shadow-sky-500/15 hover:shadow-sky-500/25 transition-all duration-200 disabled:opacity-40">
            {isActioning === "joining" ? "Joining..." : "Join Group"}
          </motion.button>
        )}

        <Link href={`/groups/${group._id}`}>
          <motion.div whileHover={{ scale: 1.08, x: 2 }} whileTap={{ scale: 0.95 }}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.08] text-gray-500 hover:text-sky-400 hover:border-sky-500/25 transition-all duration-200">
            <ArrowRight style={{ width: 15, height: 15 }} />
          </motion.div>
        </Link>
      </div>
    </motion.div>
  );
}

/* ── input style ────────────────────────────────────────────────────── */
const inputCls =
  "w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-gray-200 text-sm placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500/50 transition-all";

/* ── main page ──────────────────────────────────────────────────────── */
export default function GroupsPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [groups, setGroups] = useState([]);
  const [allGroups, setAllGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState({});

  const [searchText, setSearchText] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");

  /* ── all original logic unchanged ────────────────────────────────── */
  const fetchGroups = useCallback(async (date = "", subject = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (date) params.set("date", date);
      if (subject) params.set("subject", subject);
      const res = await fetch(`/api/groups?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch groups");
      const data = await res.json();
      setAllGroups(data.groups || []);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchGroups(dateFilter, subjectFilter); }, [dateFilter, subjectFilter, fetchGroups]);

  useEffect(() => {
    if (!searchText.trim()) { setGroups(allGroups); return; }
    const q = searchText.toLowerCase();
    setGroups(allGroups.filter(g =>
      g.name.toLowerCase().includes(q) ||
      g.subject.toLowerCase().includes(q) ||
      g.description?.toLowerCase().includes(q) ||
      g.tags?.some(t => t.toLowerCase().includes(q))
    ));
  }, [searchText, allGroups]);

  const handleJoin = async (groupId) => {
    if (!session) { router.push("/Login"); return; }
    setActionLoading(p => ({ ...p, [groupId]: "joining" }));
    try {
      const res = await fetch(`/api/groups/${groupId}/join`, { method: "POST" });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed to join"); }
      await fetchGroups(dateFilter, subjectFilter);
      toast.success("Joined group!");
    } catch (err) { toast.error(err.message); }
    finally { setActionLoading(p => ({ ...p, [groupId]: null })); }
  };

  const handleLeave = async (groupId) => {
    setActionLoading(p => ({ ...p, [groupId]: "leaving" }));
    try {
      const res = await fetch(`/api/groups/${groupId}/leave`, { method: "POST" });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed to leave"); }
      await fetchGroups(dateFilter, subjectFilter);
      toast.success("Left group.");
    } catch (err) { toast.error(err.message); }
    finally { setActionLoading(p => ({ ...p, [groupId]: null })); }
  };

  const getRole = (group) => {
    if (!session) return "guest";
    const userId = String(session.user.id);
    if (String(group.owner?._id) === userId) return "owner";
    if (group.members?.some(m => String(m._id) === userId)) return "member";
    return "visitor";
  };

  const checkIsLive = (group) => {
    if (!group.sessions?.length) return false;
    const now = new Date();
    return group.sessions.some(s => {
      const d = new Date(s.date);
      const ds = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
      return now >= new Date(`${ds}T${s.startTime}:00`) && now <= new Date(`${ds}T${s.endTime}:00`);
    });
  };

  const clearFilters = () => { setDateFilter(""); setSubjectFilter(""); setSearchText(""); };
  const hasFilters = dateFilter || subjectFilter || searchText;
  /* ── end logic ──────────────────────────────────────────────────── */

  const liveCount = allGroups.filter(checkIsLive).length;

  return (
    <div className="min-h-screen bg-[#060810] text-gray-100">

      {/* ambient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[400px] rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.05)_0%,transparent_70%)]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[400px] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.05)_0%,transparent_70%)]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 lg:px-8 py-14 space-y-10">

        {/* ── Page header ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6"
        >
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-sky-400 text-xs font-bold uppercase tracking-widest">Collaborative Nodes</span>
              {liveCount > 0 && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                  <Radio style={{ width: 10, height: 10 }} />
                  {liveCount} Live Now
                </span>
              )}
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
              Study Groups
            </h1>
            <p className="text-gray-500 mt-3 text-[15px] max-w-lg leading-relaxed">
              Join active study groups, collaborate with peers, and grow through shared learning sessions.
            </p>
          </div>

          {session && (
            <Link href="/groups/create">
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white text-sm font-bold shadow-lg shadow-sky-500/20 hover:shadow-sky-500/30 transition-shadow flex-shrink-0">
                <Plus style={{ width: 15, height: 15 }} />
                Create Group
              </motion.button>
            </Link>
          )}
        </motion.div>

        {/* ── Filter bar ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 flex flex-wrap gap-4 items-end backdrop-blur-sm"
        >
          {/* search */}
          <div className="flex-1 min-w-[220px]">
            <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest block mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" style={{ width: 14, height: 14 }} />
              <input type="text" placeholder="Name, subject, tags..."
                value={searchText} onChange={e => setSearchText(e.target.value)}
                className={inputCls + " pl-9"} />
            </div>
          </div>

          {/* subject */}
          <div className="flex-1 min-w-[160px]">
            <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest block mb-2">Subject</label>
            <input type="text" placeholder="e.g. Mathematics"
              value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)}
              className={inputCls} />
          </div>

          {/* date */}
          <div className="flex-1 min-w-[180px]">
            <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest block mb-2">Session Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" style={{ width: 14, height: 14 }} />
              <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
                className={inputCls + " pl-9 [color-scheme:dark]"} />
            </div>
          </div>

          {/* quick actions */}
          <div className="flex gap-2 flex-shrink-0">
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
              onClick={() => setDateFilter(new Date().toISOString().split("T")[0])}
              className="px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-gray-400 hover:text-white text-xs font-bold transition-all hover:border-sky-500/25">
              Today
            </motion.button>
            <AnimatePresence>
              {hasFilters && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                  onClick={clearFilters}
                  className="px-3 py-2.5 rounded-xl text-rose-400 hover:bg-rose-500/10 text-xs font-bold transition-all flex items-center gap-1.5 border border-rose-500/20">
                  <X style={{ width: 12, height: 12 }} /> Clear
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* ── results count ── */}
        {!loading && (
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-gray-600 text-xs font-semibold uppercase tracking-widest"
          >
            {groups.length} group{groups.length !== 1 ? "s" : ""}{hasFilters ? " matching filters" : " available"}
          </motion.p>
        )}

        {/* ── Grid ── */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-64 rounded-2xl bg-white/[0.02] border border-white/[0.05] animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20 text-rose-400 text-sm">{error}</div>
        ) : groups.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center py-24 rounded-2xl border border-white/[0.06] bg-white/[0.02]"
          >
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
              <Zap className="text-gray-600" style={{ width: 24, height: 24 }} />
            </div>
            <h3 className="text-white font-black text-lg mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>No groups found</h3>
            <p className="text-gray-600 text-sm mb-6">Try adjusting your filters or create a new group.</p>
            {hasFilters && (
              <button onClick={clearFilters}
                className="px-5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-gray-400 hover:text-white text-sm font-semibold transition-all">
                Clear Filters
              </button>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {groups.map(group => (
              <GroupCard
                key={group._id}
                group={group}
                role={getRole(group)}
                isActioning={actionLoading[group._id]}
                isFull={group.members?.length >= group.maxMembers}
                isLive={checkIsLive(group)}
                onJoin={handleJoin}
                onLeave={handleLeave}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}