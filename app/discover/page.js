"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  motion, useMotionValue, useTransform, AnimatePresence, animate,
} from "framer-motion";
import { X, Heart, Users, Settings, Inbox, Zap, ChevronRight } from "lucide-react";
import { useSocket } from "@/app/Components/SocketProvider";

// ─── Avatar ────────────────────────────────────────────────────────────────
function Avatar({ user, size = 40, className = "" }) {
  const src = user?.profilePicture || user?.image || user?.avatar || null;
  const initials = (user?.name || "?").charAt(0).toUpperCase();
  if (src) {
    return (
      <img
        src={src} alt={user?.name || ""} width={size} height={size}
        referrerPolicy="no-referrer"
        className={`object-cover ${className}`}
        style={{ width: size, height: size, minWidth: size, minHeight: size }}
        onError={e => { e.currentTarget.style.display = "none"; e.currentTarget.nextSibling && (e.currentTarget.nextSibling.style.display = "flex"); }}
      />
    );
  }
  return (
    <span
      className={`flex items-center justify-center text-white font-black ${className}`}
      style={{ width: size, height: size, minWidth: size, minHeight: size, fontSize: size * 0.38 }}
    >
      {initials}
    </span>
  );
}

// ─── SwipeCard ──────────────────────────────────────────────────────────────
function SwipeCard({ user, mySkills, onConnect, onSkip, isTop, index }) {
  const x           = useMotionValue(0);
  const rotate      = useTransform(x, [-220, 220], [-16, 16]);
  const likeOpacity = useTransform(x, [30, 120], [0, 1]);
  const nopeOpacity = useTransform(x, [-120, -30], [1, 0]);
  const cardOpacity = useTransform(x, [-320, -140, 0, 140, 320], [0, 1, 1, 1, 0]);
  const cardScale   = useTransform(x, [-220, 0, 220], [0.93, 1, 0.93]);

  const handleDragEnd = (_, info) => {
    if (info.offset.x > 120) {
      animate(x, 800, { duration: 0.38, ease: [0.4, 0, 0.2, 1] }).then(() => onConnect(user._id));
    } else if (info.offset.x < -120) {
      animate(x, -800, { duration: 0.38, ease: [0.4, 0, 0.2, 1] }).then(() => onSkip());
    }
  };

  const hue  = (user.name?.charCodeAt(0) || 200) % 360;
  const hue2 = (hue + 55) % 360;

  return (
    <motion.div
      className="absolute inset-0"
      style={{
        x:      isTop ? x : 0,
        rotate: isTop ? rotate : 0,
        opacity: isTop ? cardOpacity : 1,
        scale:  isTop ? cardScale : 1 - index * 0.035,
        y:      isTop ? 0 : index * 12,
        zIndex: 10 - index,
        filter: isTop ? undefined : `blur(${index * 0.5}px)`,
      }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.15}
      dragTransition={{ bounceStiffness: 300, bounceDamping: 24 }}
      onDragEnd={handleDragEnd}
      whileDrag={{ cursor: "grabbing" }}
    >
      {/* CONNECT / SKIP stamps */}
      {isTop && (
        <>
          <motion.div
            style={{ opacity: likeOpacity }}
            className="absolute top-8 left-5 z-20 px-4 py-2 rounded-xl border-[2.5px] border-emerald-400 text-emerald-400 font-black text-base tracking-[.15em] rotate-[-16deg] pointer-events-none backdrop-blur-sm bg-black/20"
          >
            CONNECT
          </motion.div>
          <motion.div
            style={{ opacity: nopeOpacity }}
            className="absolute top-8 right-5 z-20 px-4 py-2 rounded-xl border-[2.5px] border-rose-400 text-rose-400 font-black text-base tracking-[.15em] rotate-[16deg] pointer-events-none backdrop-blur-sm bg-black/20"
          >
            SKIP
          </motion.div>
        </>
      )}

      {/* ── Card shell ── */}
      <div className="w-full h-full rounded-[28px] overflow-hidden border border-white/[0.09] bg-[#0d1117] shadow-2xl flex flex-col select-none">

        {/* ── Banner ── */}
        <div
          className="relative flex-shrink-0"
          style={{
            height: 200,
            background: `
              radial-gradient(ellipse at 15% 50%, hsla(${hue},72%,52%,0.4) 0%, transparent 55%),
              radial-gradient(ellipse at 85% 20%, hsla(${hue2},72%,52%,0.3) 0%, transparent 50%),
              radial-gradient(ellipse at 50% 110%, rgba(0,0,0,0.65) 0%, transparent 55%),
              linear-gradient(155deg, hsla(${hue},55%,16%,1) 0%, hsla(${hue2},45%,10%,1) 100%)
            `,
          }}
        >
          {/* dot grid */}
          <div
            className="absolute inset-0 opacity-[0.1]"
            style={{
              backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)",
              backgroundSize: "26px 26px",
            }}
          />

          {/* match badge */}
          {user.matchScore > 0 && (
            <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur border border-white/10 text-white text-[11px] font-bold z-10">
              <Zap style={{ width: 10, height: 10 }} className="text-amber-400" />
              {Math.min(user.matchScore * 15, 99)}% match
            </div>
          )}

          {/* Avatar — centred, overlapping bottom of banner */}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-1/2 z-10">
            <div
              className="w-[88px] h-[88px] rounded-2xl border-[3px] border-[#0d1117] overflow-hidden shadow-2xl flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, hsl(${hue},65%,40%), hsl(${hue2},65%,35%))` }}
            >
              <Avatar user={user} size={88} />
            </div>
            {/* online dot */}
            <div className="absolute bottom-1 right-1 w-[14px] h-[14px] rounded-full bg-emerald-400 border-[2.5px] border-[#0d1117]" />
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 min-h-0 flex flex-col overflow-y-auto scrollbar-hide pt-14 px-6 pb-5 gap-4">

          {/* Name + badges */}
          <div className="text-center">
            <h3
              className="text-[1.55rem] font-black text-white tracking-tight leading-tight mb-2"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              {user.name}
            </h3>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-sky-500/10 text-sky-400 border border-sky-500/20">
                {user.skillLevel || "Student"}
              </span>
              {user.branch && (
                <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-white/[0.04] text-gray-500 border border-white/[0.08]">
                  {user.branch}
                </span>
              )}
              {!user.branch && user.subjects?.slice(0, 1).map(s => (
                <span key={s} className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-white/[0.04] text-gray-500 border border-white/[0.08]">
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Bio */}
          {user.bio && (
            <p className="text-gray-400 text-[13px] leading-relaxed text-center line-clamp-2 px-1">
              {user.bio}
            </p>
          )}

          {/* Goal */}
          {user.goal && (
            <div className="px-3.5 py-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.07] flex gap-2.5 items-start">
              <Zap className="text-amber-400 flex-shrink-0 mt-0.5" style={{ width: 13, height: 13 }} />
              <p className="text-[12px] text-gray-300 leading-relaxed">{user.goal}</p>
            </div>
          )}

          {/* No profile data fallback */}
          {!user.bio && !user.goal && !user.skillsToTeach?.length && !user.skillsToLearn?.length && (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 py-6">
              <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.07] flex items-center justify-center">
                <Users className="text-gray-700" style={{ width: 18, height: 18 }} />
              </div>
              <p className="text-gray-600 text-xs text-center">Profile not filled yet</p>
            </div>
          )}

          {/* Skills */}
          <div className="flex flex-col gap-3 mt-auto">
            {user.skillsToTeach?.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-4 rounded-md bg-emerald-500/10 flex items-center justify-center">
                    <Users className="text-emerald-400" style={{ width: 10, height: 10 }} />
                  </div>
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-[.15em]">Teaches</span>
                  <div className="flex-1 h-px bg-gradient-to-r from-emerald-500/20 to-transparent" />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {user.skillsToTeach.slice(0, 5).map(s => (
                    <span
                      key={s}
                      className={`text-[11px] px-2.5 py-1 rounded-lg font-bold transition-all ${
                        mySkills.learn?.includes(s)
                          ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/20"
                          : "bg-white/[0.04] text-gray-400 border border-white/[0.08]"
                      }`}
                    >
                      {mySkills.learn?.includes(s) && "✓ "}{s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {user.skillsToLearn?.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-4 rounded-md bg-sky-500/10 flex items-center justify-center">
                    <Zap className="text-sky-400" style={{ width: 10, height: 10 }} />
                  </div>
                  <span className="text-[10px] text-sky-400 font-bold uppercase tracking-[.15em]">Learning</span>
                  <div className="flex-1 h-px bg-gradient-to-r from-sky-500/20 to-transparent" />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {user.skillsToLearn.slice(0, 5).map(s => (
                    <span
                      key={s}
                      className={`text-[11px] px-2.5 py-1 rounded-lg font-bold transition-all ${
                        mySkills.teach?.includes(s)
                          ? "bg-gradient-to-br from-sky-500 to-sky-600 text-white shadow-md shadow-sky-500/20"
                          : "bg-white/[0.04] text-gray-400 border border-white/[0.08]"
                      }`}
                    >
                      {mySkills.teach?.includes(s) && "✓ "}{s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* drag hint */}
        {isTop && (
          <p className="text-center text-gray-700 text-[9px] pb-3 tracking-[.2em] uppercase flex-shrink-0">
            drag to swipe
          </p>
        )}
      </div>
    </motion.div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function DiscoverPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { socket: globalSocket } = useSocket();

  const [users, setUsers]               = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading]           = useState(true);
  const [actionMsg, setActionMsg]       = useState("");
  const [mySkills, setMySkills]         = useState({ teach: [], learn: [] });
  const [showSetup, setShowSetup]       = useState(false);

  const [teachInput, setTeachInput] = useState("");
  const [learnInput, setLearnInput] = useState("");
  const [teachSkills, setTeachSkills] = useState([]);
  const [learnSkills, setLearnSkills] = useState([]);
  const [savingProfile, setSavingProfile] = useState(false);

  const [tab, setTab]                     = useState("discover");
  const [connections, setConnections]     = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [respondingTo, setRespondingTo]   = useState(null);

  const fetchDiscover = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/users/discover");
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users || []);
        setMySkills(data.mySkills || { teach: [], learn: [] });
        if (!data.mySkills?.teach?.length && !data.mySkills?.learn?.length) setShowSetup(true);
        setCurrentIndex(0);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  const fetchConnections = useCallback(async () => {
    try {
      const res  = await fetch("/api/users/connections");
      const data = await res.json();
      if (res.ok) { setConnections(data.connections || []); setPendingRequests(data.pendingRequests || []); }
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => {
    if (session) { fetchDiscover(); fetchConnections(); }
  }, [session, fetchDiscover, fetchConnections]);

  useEffect(() => {
    if (session && showSetup) {
      fetch("/api/users/profile").then(r => r.json()).then(data => {
        if (data.user) { setTeachSkills(data.user.skillsToTeach || []); setLearnSkills(data.user.skillsToLearn || []); }
      });
    }
  }, [session, showSetup]);

  const handleSkip    = () => { setTimeout(() => setCurrentIndex(i => i + 1), 320); };
  const handleConnect = async (userId) => {
    try {
      const res  = await fetch("/api/users/follow", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: userId, message: "Let's study together!" }),
      });
      const data = await res.json();
      setActionMsg(res.ok ? "Request sent! 🎉" : data.error);
      setTimeout(() => setActionMsg(""), 2500);
    } catch { setActionMsg("Failed"); setTimeout(() => setActionMsg(""), 2000); }
    setTimeout(() => setCurrentIndex(i => i + 1), 320);
  };

  const handleRespond = async (requesterId, action) => {
    setRespondingTo(requesterId);
    try {
      const res = await fetch("/api/users/follow/respond", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requesterId, action }),
      });
      if (res.ok) { await fetchConnections(); await fetchDiscover(); }
    } catch (err) { console.error(err); }
    finally { setRespondingTo(null); }
  };

  const addTeachSkill = () => { const s = teachInput.trim(); if (s && !teachSkills.includes(s)) setTeachSkills([...teachSkills, s]); setTeachInput(""); };
  const addLearnSkill = () => { const s = learnInput.trim(); if (s && !learnSkills.includes(s)) setLearnSkills([...learnSkills, s]); setLearnInput(""); };

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      await fetch("/api/users/profile", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillsToTeach: teachSkills, skillsToLearn: learnSkills }),
      });
      setShowSetup(false);
      await fetchDiscover();
    } catch (err) { console.error(err); }
    finally { setSavingProfile(false); }
  };

  // ── Not signed in ──────────────────────────────────────────────────────
  if (!session) {
    return (
      <div className="min-h-screen bg-[#060810] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
            <Users className="text-white" style={{ width: 28, height: 28 }} />
          </div>
          <h2 className="text-2xl font-black text-white mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>Sign in to Discover</h2>
          <p className="text-gray-500 mb-8 text-sm">Connect with students who match your learning goals.</p>
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
            onClick={() => router.push("/Login")}
            className="px-8 py-3 bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-sky-500/20">
            Sign In
          </motion.button>
        </div>
      </div>
    );
  }

  // ── Skills setup ────────────────────────────────────────────────────────
  if (showSetup) {
    return (
      <div className="min-h-screen bg-[#060810] flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-lg rounded-3xl border border-white/[0.08] bg-[#0d1117] p-8 shadow-2xl"
        >
          <div className="text-center mb-8">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center mb-4 shadow-lg shadow-sky-500/20">
              <Zap className="text-white" style={{ width: 24, height: 24 }} />
            </div>
            <h1 className="text-2xl font-black text-white mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>Set Up Your Skills</h1>
            <p className="text-gray-500 text-sm">Tell us what you can teach and what you want to learn.</p>
          </div>

          <div className="mb-6">
            <label className="block text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2">Skills I Can Teach</label>
            <div className="flex gap-2 mb-2">
              <input type="text" value={teachInput} onChange={e => setTeachInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTeachSkill())}
                placeholder="e.g. React, Python, DSA..."
                className="flex-1 bg-white/[0.04] border border-white/[0.08] text-gray-200 text-sm rounded-xl px-4 py-2.5 focus:ring-1 focus:ring-emerald-500 outline-none placeholder-gray-600" />
              <button onClick={addTeachSkill} className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl transition-colors">+</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {teachSkills.map(s => (
                <span key={s} className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
                  {s}<button onClick={() => setTeachSkills(teachSkills.filter(x => x !== s))} className="hover:text-white opacity-60 hover:opacity-100"><X style={{ width: 10, height: 10 }} /></button>
                </span>
              ))}
            </div>
          </div>

          <div className="mb-8">
            <label className="block text-xs font-bold text-sky-400 uppercase tracking-widest mb-2">Skills I Want to Learn</label>
            <div className="flex gap-2 mb-2">
              <input type="text" value={learnInput} onChange={e => setLearnInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addLearnSkill())}
                placeholder="e.g. Machine Learning, AWS..."
                className="flex-1 bg-white/[0.04] border border-white/[0.08] text-gray-200 text-sm rounded-xl px-4 py-2.5 focus:ring-1 focus:ring-sky-500 outline-none placeholder-gray-600" />
              <button onClick={addLearnSkill} className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-sm font-bold rounded-xl transition-colors">+</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {learnSkills.map(s => (
                <span key={s} className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/25 text-sky-400">
                  {s}<button onClick={() => setLearnSkills(learnSkills.filter(x => x !== s))} className="hover:text-white opacity-60 hover:opacity-100"><X style={{ width: 10, height: 10 }} /></button>
                </span>
              ))}
            </div>
          </div>

          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={saveProfile} disabled={savingProfile || (!teachSkills.length && !learnSkills.length)}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold text-sm shadow-lg shadow-sky-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
            {savingProfile ? "Saving..." : "Start Discovering →"}
          </motion.button>
          <button onClick={() => setShowSetup(false)} className="w-full mt-3 py-2 text-gray-600 text-xs hover:text-gray-400 transition-colors">Skip for now</button>
        </motion.div>
      </div>
    );
  }

  const visibleStack = users.slice(currentIndex, currentIndex + 3);
  const currentUser  = users[currentIndex];

  const TABS = [
    { id: "discover",    label: "Discover",    icon: Zap   },
    { id: "requests",    label: "Requests",    icon: Inbox,  badge: pendingRequests.length },
    { id: "connections", label: "Connections", icon: Users,  badge: connections.length },
  ];

  return (
    <div className="min-h-screen bg-[#060810]">
      {/* ambient bg */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.045)_0%,transparent_70%)]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.04)_0%,transparent_70%)]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>Discover</h1>
            <p className="text-gray-500 text-sm mt-0.5">Find your perfect study partner</p>
          </div>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
            onClick={() => setShowSetup(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/[0.08] bg-white/[0.03] text-gray-400 hover:text-white text-xs font-semibold transition-all hover:bg-white/[0.06]">
            <Settings style={{ width: 13, height: 13 }} /> Edit Skills
          </motion.button>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 bg-white/[0.03] border border-white/[0.07] rounded-2xl p-1.5 mb-8 w-fit">
          {TABS.map(({ id, label, icon: Icon, badge }) => (
            <button key={id}
              onClick={() => { setTab(id); if (id !== "discover") fetchConnections(); }}
              className={`relative flex items-center justify-center gap-1.5 text-xs py-2.5 px-5 rounded-xl font-semibold transition-all duration-200 ${
                tab === id
                  ? "bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-lg shadow-sky-500/20"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <Icon style={{ width: 13, height: 13 }} />
              {label}
              {badge > 0 && (
                <span className={`absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center ${tab === id ? "bg-white text-sky-600" : "bg-sky-500 text-white"}`}>
                  {badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Toast ── */}
        <AnimatePresence>
          {actionMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="fixed top-24 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl bg-emerald-500/90 backdrop-blur text-white font-semibold shadow-xl text-sm border border-emerald-400/30"
            >
              {actionMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══════════════════════════════════════
            DISCOVER TAB
        ══════════════════════════════════════ */}
        {tab === "discover" && (
          /* ── KEY FIX: card gets a fixed pixel width, sidebar is independent ── */
          <div className="flex flex-col lg:flex-row gap-8 items-start justify-center">

            {/* Card area — always 380px wide, centred on mobile */}
            <div className="flex flex-col items-center gap-6 mx-auto lg:mx-0 w-[380px] flex-shrink-0">
              {loading ? (
                <div className="w-[380px] h-[600px] rounded-[28px] bg-white/[0.03] border border-white/[0.06] animate-pulse" />
              ) : !currentUser ? (
                <div className="w-[380px] h-[600px] rounded-[28px] border border-white/[0.08] bg-white/[0.02] flex flex-col items-center justify-center text-center px-8 gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
                    <Zap className="text-gray-600" style={{ width: 28, height: 28 }} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>You&apos;ve seen everyone!</h3>
                    <p className="text-gray-500 text-sm">Check back later or edit your skills to expand matches.</p>
                  </div>
                  <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                    onClick={() => { setCurrentIndex(0); fetchDiscover(); }}
                    className="px-6 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 text-white text-sm font-bold rounded-xl">
                    Refresh
                  </motion.button>
                </div>
              ) : (
                <>
                  {/* Card stack — fixed 380×600 */}
                  <div className="relative w-[380px] h-[600px]">
                    {[...visibleStack].reverse().map((user, revIdx) => {
                      const idx = visibleStack.length - 1 - revIdx;
                      return (
                        <SwipeCard
                          key={user._id} user={user} mySkills={mySkills}
                          onConnect={handleConnect} onSkip={handleSkip}
                          isTop={idx === 0} index={idx}
                        />
                      );
                    })}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-5">
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.92 }}
                      onClick={handleSkip}
                      className="w-14 h-14 rounded-2xl bg-white/[0.05] border border-white/[0.09] flex items-center justify-center text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/25 transition-all shadow-lg">
                      <X style={{ width: 22, height: 22 }} />
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
                      onClick={() => handleConnect(currentUser._id)}
                      className="w-[68px] h-[68px] rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/30">
                      <Heart style={{ width: 26, height: 26 }} />
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.92 }}
                      onClick={handleSkip}
                      className="w-14 h-14 rounded-2xl bg-white/[0.05] border border-white/[0.09] flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/[0.08] transition-all shadow-lg">
                      <ChevronRight style={{ width: 22, height: 22 }} />
                    </motion.button>
                  </div>

                  <p className="text-gray-700 text-xs tracking-widest uppercase">
                    {currentIndex + 1} of {users.length} matches
                  </p>
                </>
              )}
            </div>

            {/* Sidebar — only shows on lg+ */}
            {currentUser && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.15 }}
                className="hidden lg:flex flex-col gap-4 w-64 pt-2"
              >
                {/* How it works */}
                <div className="rounded-3xl border border-white/[0.08] bg-[#0d1117] p-5 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-sky-500/5 blur-2xl rounded-full" />
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-[.2em] mb-4">HOW IT WORKS</p>
                  <div className="space-y-3.5">
                    {[
                      { icon: "←", label: "Swipe left to skip",       color: "text-rose-400"    },
                      { icon: "→", label: "Swipe right to connect",   color: "text-emerald-400" },
                      { icon: "✓", label: "Highlighted = skill match", color: "text-sky-400"     },
                    ].map(({ icon, label, color }) => (
                      <div key={label} className="flex items-center gap-3 text-xs">
                        <span className={`w-7 h-7 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center font-black ${color} flex-shrink-0`}>
                          {icon}
                        </span>
                        <span className="text-gray-400 font-medium">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Your skills */}
                {mySkills.teach?.length > 0 && (
                  <div className="rounded-3xl border border-white/[0.08] bg-[#0d1117] p-5 shadow-xl">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-5 h-5 rounded-lg bg-sky-500/10 flex items-center justify-center">
                        <Zap className="text-sky-400" style={{ width: 12, height: 12 }} />
                      </div>
                      <p className="text-[10px] font-black text-white/40 uppercase tracking-[.2em]">YOUR SKILLS</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {mySkills.teach.map(s => (
                        <span key={s} className="text-[11px] px-2.5 py-1 rounded-xl bg-sky-500/5 border border-sky-500/10 text-sky-400 font-bold">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════
            REQUESTS TAB
        ══════════════════════════════════════ */}
        {tab === "requests" && (
          <div className="max-w-lg mx-auto space-y-3">
            {pendingRequests.length === 0 ? (
              <div className="text-center py-20 rounded-3xl border border-white/[0.07] bg-white/[0.02]">
                <Inbox className="mx-auto text-gray-700 mb-3" style={{ width: 36, height: 36 }} />
                <p className="text-gray-500 text-sm">No pending requests right now.</p>
              </div>
            ) : pendingRequests.map(req => (
              <motion.div key={req.from._id || req.from}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 overflow-hidden flex-shrink-0">
                  <Avatar user={req.from} size={48} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm">{req.from.name}</p>
                  <p className="text-xs text-gray-500 truncate">{req.from.bio || "Wants to connect"}</p>
                  {req.from.skillsToTeach?.length > 0 && (
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      {req.from.skillsToTeach.slice(0, 3).map(s => (
                        <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/8 text-emerald-400 border border-emerald-500/20">{s}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => handleRespond(req.from._id, "reject")} disabled={respondingTo === req.from._id}
                    className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] text-gray-500 hover:text-rose-400 hover:border-rose-500/25 transition-all disabled:opacity-40 flex items-center justify-center">
                    <X style={{ width: 14, height: 14 }} />
                  </button>
                  <button onClick={() => handleRespond(req.from._id, "accept")} disabled={respondingTo === req.from._id}
                    className="px-4 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors disabled:opacity-40">
                    {respondingTo === req.from._id ? "..." : "Accept"}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* ══════════════════════════════════════
            CONNECTIONS TAB
        ══════════════════════════════════════ */}
        {tab === "connections" && (
          <div className="max-w-lg mx-auto space-y-3">
            {connections.length === 0 ? (
              <div className="text-center py-20 rounded-3xl border border-white/[0.07] bg-white/[0.02]">
                <Users className="mx-auto text-gray-700 mb-3" style={{ width: 36, height: 36 }} />
                <h3 className="text-base font-black text-white mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>No connections yet</h3>
                <p className="text-gray-500 text-sm mb-6">Start swiping to find your study partners!</p>
                <button onClick={() => setTab("discover")}
                  className="px-6 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 text-white rounded-xl text-sm font-bold">
                  Go to Discover
                </button>
              </div>
            ) : connections.map(conn => (
              <motion.div key={conn._id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-white/[0.07] bg-white/[0.02] hover:border-white/[0.12] p-5 transition-all duration-200"
              >
                <div className="flex items-center gap-4">
                  <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 overflow-hidden">
                    {conn.profilePicture
                      ? <img src={conn.profilePicture} alt="" className="w-full h-full object-cover" />
                      : conn.name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-sm">{conn.name}</p>
                    <p className="text-xs text-gray-500">{conn.skillLevel || "Student"}</p>
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      {(conn.skillsToTeach || []).slice(0, 2).map(s => (
                        <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/8 text-emerald-400 border border-emerald-500/20">
                          Teaches {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                    onClick={() => router.push(`/groups/create?inviteId=${conn._id}&inviteName=${encodeURIComponent(conn.name)}`)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white/[0.04] border border-white/[0.08] text-gray-400 hover:text-white hover:bg-indigo-600 hover:border-indigo-600 transition-all flex-shrink-0">
                    <Users style={{ width: 12, height: 12 }} /> Study Group
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
