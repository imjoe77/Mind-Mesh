"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

// ─── Chat Panel Component ──────────────────────────────────────────────────
function ChatPanel({ connection, myId, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const pollRef = useRef(null);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/messages/${connection._id}`);
      const data = await res.json();
      if (res.ok) setMessages(data.messages || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [connection._id]);

  useEffect(() => {
    fetchMessages();
    // Poll every 4 seconds for fallback
    pollRef.current = setInterval(fetchMessages, 4000);

    // Real-time socket listener
    const handleNewMessage = (e) => {
      if (e.detail.from === connection._id) {
        fetchMessages();
      }
    };
    window.addEventListener("new-message", handleNewMessage);

    return () => {
      clearInterval(pollRef.current);
      window.removeEventListener("new-message", handleNewMessage);
    };
  }, [fetchMessages, connection._id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput("");
    try {
      const res = await fetch(`/api/messages/${connection._id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      if (res.ok) await fetchMessages();
    } catch (err) { console.error(err); }
    finally { setSending(false); }
  };

  const formatTime = (ts) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex flex-col h-[500px] bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-slate-800 bg-slate-900">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm overflow-hidden flex-shrink-0">
          {connection.profilePicture
            ? <img src={connection.profilePicture} alt="" className="w-full h-full object-cover" />
            : connection.name?.charAt(0)
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{connection.name}</p>
          <p className="text-[10px] text-green-400">● Connected</p>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-3xl mb-2">👋</div>
            <p className="text-slate-400 text-sm">Say hi to {connection.name}!</p>
            <p className="text-slate-600 text-xs mt-1">Start a conversation or create a study group together.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.from === myId || msg.from?.toString() === myId;
            return (
              <div key={msg._id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                  isMe
                    ? "bg-indigo-600 text-white rounded-br-sm"
                    : "bg-slate-800 text-slate-100 rounded-bl-sm"
                }`}>
                  <p className="leading-relaxed">{msg.content}</p>
                  <p className={`text-[9px] mt-1 ${isMe ? "text-indigo-200" : "text-slate-500"}`}>
                    {formatTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-slate-800 bg-slate-900 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
          placeholder="Type a message..."
          className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 outline-none"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || sending}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── Main Discover Page ────────────────────────────────────────────────────
export default function DiscoverPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [users, setUsers] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState("");
  const [swipeDir, setSwipeDir] = useState(null);
  const [mySkills, setMySkills] = useState({ teach: [], learn: [] });
  const [showSetup, setShowSetup] = useState(false);

  const [teachInput, setTeachInput] = useState("");
  const [learnInput, setLearnInput] = useState("");
  const [teachSkills, setTeachSkills] = useState([]);
  const [learnSkills, setLearnSkills] = useState([]);
  const [savingProfile, setSavingProfile] = useState(false);

  const [tab, setTab] = useState("discover");
  const [connections, setConnections] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [respondingTo, setRespondingTo] = useState(null);

  // Chat state
  const [openChat, setOpenChat] = useState(null); // connection object
  const [unreadMap, setUnreadMap] = useState({});

  const fetchDiscover = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users/discover");
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users || []);
        setMySkills(data.mySkills || { teach: [], learn: [] });
        if (!data.mySkills?.teach?.length && !data.mySkills?.learn?.length) {
          setShowSetup(true);
        }
        setCurrentIndex(0);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  const fetchConnections = useCallback(async () => {
    try {
      const res = await fetch("/api/users/connections");
      const data = await res.json();
      if (res.ok) {
        setConnections(data.connections || []);
        setPendingRequests(data.pendingRequests || []);
      }
    } catch (err) { console.error(err); }
  }, []);

  const fetchUnread = useCallback(async () => {
    try {
      const res = await fetch("/api/messages/unread");
      const data = await res.json();
      if (res.ok) setUnreadMap(data.unread || {});
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => {
    if (session) {
      fetchDiscover();
      fetchConnections();
      fetchUnread();
      // Poll unread counts every 8 seconds
      const t = setInterval(fetchUnread, 8000);
      return () => clearInterval(t);
    }
  }, [session, fetchDiscover, fetchConnections, fetchUnread]);

  useEffect(() => {
    if (session && showSetup) {
      fetch("/api/users/profile").then(r => r.json()).then(data => {
        if (data.user) {
          setTeachSkills(data.user.skillsToTeach || []);
          setLearnSkills(data.user.skillsToLearn || []);
        }
      });
    }
  }, [session, showSetup]);

  const handleSkip = () => {
    setSwipeDir("left");
    setTimeout(() => { setSwipeDir(null); setCurrentIndex(i => i + 1); }, 300);
  };

  const handleConnect = async (userId) => {
    setSwipeDir("right");
    try {
      const res = await fetch("/api/users/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: userId, message: "Let's study together!" }),
      });
      const data = await res.json();
      setActionMsg(res.ok ? "Request sent! 🎉" : data.error);
      setTimeout(() => setActionMsg(""), 2500);
    } catch { setActionMsg("Failed"); setTimeout(() => setActionMsg(""), 2000); }
    setTimeout(() => { setSwipeDir(null); setCurrentIndex(i => i + 1); }, 300);
  };

  const handleRespond = async (requesterId, action) => {
    setRespondingTo(requesterId);
    try {
      const res = await fetch("/api/users/follow/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requesterId, action }),
      });
      if (res.ok) { await fetchConnections(); await fetchDiscover(); }
    } catch (err) { console.error(err); }
    finally { setRespondingTo(null); }
  };

  const addTeachSkill = () => {
    const s = teachInput.trim();
    if (s && !teachSkills.includes(s)) setTeachSkills([...teachSkills, s]);
    setTeachInput("");
  };
  const addLearnSkill = () => {
    const s = learnInput.trim();
    if (s && !learnSkills.includes(s)) setLearnSkills([...learnSkills, s]);
    setLearnInput("");
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      await fetch("/api/users/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillsToTeach: teachSkills, skillsToLearn: learnSkills }),
      });
      setShowSetup(false);
      await fetchDiscover();
    } catch (err) { console.error(err); }
    finally { setSavingProfile(false); }
  };

  if (!session) {
    return (
      <div className="max-w-md mx-auto mt-20 p-6 bg-slate-900 border border-slate-800 rounded-xl text-center">
        <h2 className="text-xl font-semibold mb-4 text-slate-100">Sign in to Discover</h2>
        <p className="text-slate-400 mb-6">Connect with students who match your learning goals.</p>
        <button onClick={() => router.push("/Login")} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-medium transition-colors">Sign In</button>
      </div>
    );
  }

  // ─── Skills Setup ──────────────────────────────────────────────────────────
  if (showSetup) {
    return (
      <div className="max-w-lg mx-auto mt-12 px-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Set Up Your Skills</h1>
            <p className="text-slate-400 text-sm">Tell us what you can teach and what you want to learn.</p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-green-400 mb-2">🎓 Skills I Can Teach</label>
            <div className="flex gap-2 mb-2">
              <input type="text" value={teachInput} onChange={e => setTeachInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTeachSkill())}
                placeholder="e.g. React, Python, DSA..." className="flex-1 bg-slate-950 border border-slate-700 text-slate-100 text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 outline-none" />
              <button onClick={addTeachSkill} className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm rounded-lg">+</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {teachSkills.map(s => (
                <span key={s} className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full bg-green-500/10 border border-green-500/30 text-green-400">
                  {s}<button onClick={() => setTeachSkills(teachSkills.filter(x => x !== s))} className="hover:text-white ml-0.5">✕</button>
                </span>
              ))}
            </div>
          </div>

          <div className="mb-8">
            <label className="block text-sm font-semibold text-blue-400 mb-2">📚 Skills I Want to Learn</label>
            <div className="flex gap-2 mb-2">
              <input type="text" value={learnInput} onChange={e => setLearnInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addLearnSkill())}
                placeholder="e.g. Machine Learning, AWS..." className="flex-1 bg-slate-950 border border-slate-700 text-slate-100 text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
              <button onClick={addLearnSkill} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg">+</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {learnSkills.map(s => (
                <span key={s} className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400">
                  {s}<button onClick={() => setLearnSkills(learnSkills.filter(x => x !== s))} className="hover:text-white ml-0.5">✕</button>
                </span>
              ))}
            </div>
          </div>

          <button onClick={saveProfile} disabled={savingProfile || (!teachSkills.length && !learnSkills.length)}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed">
            {savingProfile ? "Saving..." : "Start Discovering 🚀"}
          </button>
          <button onClick={() => setShowSetup(false)} className="w-full mt-3 py-2 text-slate-500 text-sm hover:text-slate-300 transition-colors">Skip for now</button>
        </div>
      </div>
    );
  }

  const currentUser = users[currentIndex];
  const totalUnread = Object.values(unreadMap).reduce((s, c) => s + c, 0);

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">Discover</h1>
          <p className="text-slate-400 text-sm mt-1">Find your perfect study partner</p>
        </div>
        <button onClick={() => setShowSetup(true)} className="text-xs px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-colors">
          ⚙ Edit Skills
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1 mb-8 max-w-lg">
        {[
          { id: "discover", label: "Discover", icon: "🔍" },
          { id: "requests", label: `Requests${pendingRequests.length > 0 ? ` (${pendingRequests.length})` : ""}`, icon: "📩" },
          { id: "connections", label: `Connections${connections.length > 0 ? ` (${connections.length})` : ""}`, icon: "🤝" },
        ].map(t => (
          <button key={t.id}
            onClick={() => { setTab(t.id); if (t.id !== "discover") fetchConnections(); if (t.id === "connections") fetchUnread(); }}
            className={`flex-1 text-sm py-2.5 rounded-lg font-medium transition-all ${tab === t.id ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "text-slate-400 hover:text-white"}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Toast */}
      {actionMsg && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl bg-green-500 text-white font-semibold shadow-xl text-sm animate-bounce">
          {actionMsg}
        </div>
      )}

      {/* ─── DISCOVER TAB ─────────────────────────────────────────────────── */}
      {tab === "discover" && (
        <div className="flex justify-center">
          {loading ? (
            <div className="w-full max-w-sm h-[500px] bg-slate-800/50 rounded-2xl animate-pulse" />
          ) : !currentUser ? (
            <div className="text-center py-20 max-w-sm">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-xl font-bold text-white mb-2">You&apos;ve seen everyone!</h3>
              <p className="text-slate-400 text-sm mb-6">Check back later or edit your skills to expand matches.</p>
              <button onClick={() => { setCurrentIndex(0); fetchDiscover(); }} className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-500 text-sm">Refresh</button>
            </div>
          ) : (
            <div className="relative w-full max-w-sm">
              {users[currentIndex + 1] && (
                <div className="absolute top-3 left-3 right-3 h-[480px] bg-slate-800/40 rounded-2xl border border-slate-700/50 -z-10" />
              )}
              <div className={`bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ${
                swipeDir === "left" ? "-translate-x-[120%] rotate-[-15deg] opacity-0" :
                swipeDir === "right" ? "translate-x-[120%] rotate-[15deg] opacity-0" : "translate-x-0 rotate-0 opacity-100"
              }`}>
                <div className="h-28 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 relative">
                  <div className="absolute -bottom-10 left-6">
                    <div className="w-20 h-20 rounded-2xl bg-slate-900 border-4 border-slate-900 shadow-xl overflow-hidden flex items-center justify-center text-2xl font-bold text-white">
                      {currentUser.profilePicture
                        ? <img src={currentUser.profilePicture} alt="" className="w-full h-full object-cover" />
                        : <span className="bg-gradient-to-br from-indigo-500 to-purple-600 w-full h-full flex items-center justify-center">{currentUser.name?.charAt(0)}</span>
                      }
                    </div>
                  </div>
                  {currentUser.matchScore > 0 && (
                    <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-white/20 backdrop-blur text-white text-xs font-bold">
                      {currentUser.matchScore >= 6 ? "🔥" : "⭐"} {Math.min(currentUser.matchScore * 15, 99)}% match
                    </div>
                  )}
                </div>

                <div className="pt-14 px-6 pb-4">
                  <h3 className="text-xl font-bold text-white mb-0.5">{currentUser.name}</h3>
                  <p className="text-sm text-slate-400 mb-2">{currentUser.skillLevel || "Student"}</p>
                  {currentUser.bio && <p className="text-sm text-slate-300 mb-3 leading-relaxed">{currentUser.bio}</p>}
                  {currentUser.goal && (
                    <div className="mb-3 px-3 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                      <p className="text-[10px] text-indigo-400 font-bold uppercase mb-0.5">Goal</p>
                      <p className="text-xs text-indigo-200">{currentUser.goal}</p>
                    </div>
                  )}
                  {currentUser.skillsToTeach?.length > 0 && (
                    <div className="mb-3">
                      <p className="text-[10px] text-green-400 font-bold uppercase tracking-wider mb-1.5">Can Teach</p>
                      <div className="flex flex-wrap gap-1.5">
                        {currentUser.skillsToTeach.map(s => (
                          <span key={s} className={`text-xs px-2.5 py-1 rounded-full font-medium ${mySkills.learn?.includes(s) ? "bg-green-500 text-white" : "bg-green-500/10 border border-green-500/30 text-green-400"}`}>
                            {mySkills.learn?.includes(s) && "✓ "}{s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {currentUser.skillsToLearn?.length > 0 && (
                    <div className="mb-2">
                      <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider mb-1.5">Wants to Learn</p>
                      <div className="flex flex-wrap gap-1.5">
                        {currentUser.skillsToLearn.map(s => (
                          <span key={s} className={`text-xs px-2.5 py-1 rounded-full font-medium ${mySkills.teach?.includes(s) ? "bg-blue-500 text-white" : "bg-blue-500/10 border border-blue-500/30 text-blue-400"}`}>
                            {mySkills.teach?.includes(s) && "✓ "}{s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="px-6 pb-6 flex gap-3">
                  <button onClick={handleSkip} className="flex-1 py-3.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 font-medium hover:bg-slate-700 hover:text-white transition-all flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    Skip
                  </button>
                  <button onClick={() => handleConnect(currentUser._id)} className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-semibold transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                    Connect
                  </button>
                </div>
              </div>
              <p className="text-center text-xs text-slate-600 mt-4">{currentIndex + 1} of {users.length} matches</p>
            </div>
          )}
        </div>
      )}

      {/* ─── REQUESTS TAB ─────────────────────────────────────────────────── */}
      {tab === "requests" && (
        <div className="max-w-lg mx-auto space-y-4">
          {pendingRequests.length === 0 ? (
            <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-2xl">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-slate-400 text-sm">No pending requests right now.</p>
            </div>
          ) : (
            pendingRequests.map(req => (
              <div key={req.from._id || req.from} className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 overflow-hidden">
                  {req.from.profilePicture ? <img src={req.from.profilePicture} alt="" className="w-full h-full object-cover" /> : req.from.name?.charAt(0) || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-sm">{req.from.name}</p>
                  <p className="text-xs text-slate-400 truncate">{req.from.bio || "Wants to connect"}</p>
                  {req.from.skillsToTeach?.length > 0 && (
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      {req.from.skillsToTeach.slice(0, 3).map(s => (
                        <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/30">{s}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => handleRespond(req.from._id, "reject")} disabled={respondingTo === req.from._id}
                    className="px-3 py-2 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 hover:border-red-700 hover:text-red-400 transition-colors text-xs font-medium disabled:opacity-50">✕</button>
                  <button onClick={() => handleRespond(req.from._id, "accept")} disabled={respondingTo === req.from._id}
                    className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white text-xs font-semibold transition-colors disabled:opacity-50">
                    {respondingTo === req.from._id ? "..." : "Accept"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ─── CONNECTIONS TAB ─────────────────────────────────────────────── */}
      {tab === "connections" && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">
          {/* Connection Cards */}
          <div className="space-y-4">
            {connections.length === 0 ? (
              <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-2xl">
                <div className="text-4xl mb-3">🌐</div>
                <h3 className="text-lg font-semibold text-white mb-2">No connections yet</h3>
                <p className="text-slate-400 text-sm mb-4">Start swiping to find your study partners!</p>
                <button onClick={() => setTab("discover")} className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-500 transition-colors">Go to Discover</button>
              </div>
            ) : (
              connections.map(conn => {
                const unreadCount = unreadMap[conn._id?.toString()] || 0;
                const isActive = openChat?._id === conn._id;
                return (
                  <div key={conn._id}
                    className={`bg-slate-900 border rounded-xl p-5 transition-all ${isActive ? "border-indigo-500/50 shadow-lg shadow-indigo-500/10" : "border-slate-800 hover:border-slate-700"}`}>
                    <div className="flex items-center gap-4">
                      <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 overflow-hidden">
                        {conn.profilePicture ? <img src={conn.profilePicture} alt="" className="w-full h-full object-cover" /> : conn.name?.charAt(0)}
                        {unreadCount > 0 && (
                          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white text-sm">{conn.name}</p>
                        <p className="text-xs text-slate-400 truncate">{conn.skillLevel || "Student"}</p>
                        <div className="flex gap-1 mt-1.5 flex-wrap">
                          {(conn.skillsToTeach || []).slice(0, 2).map(s => (
                            <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/30">Teaches {s}</span>
                          ))}
                        </div>
                      </div>
                      {/* Action buttons */}
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        <button
                          onClick={() => setOpenChat(isActive ? null : conn)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            isActive
                              ? "bg-indigo-600 text-white"
                              : "bg-slate-800 text-slate-300 hover:bg-indigo-600 hover:text-white border border-slate-700"
                          }`}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          {isActive ? "Close Chat" : "Message"}
                        </button>
                        <button
                          onClick={() => router.push(`/groups/create?inviteId=${conn._id}&inviteName=${encodeURIComponent(conn.name)}`)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-purple-600 hover:text-white border border-slate-700 transition-all"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Study Group
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Chat Panel — slides in on the right */}
          {openChat && (
            <div className="sticky top-24">
              <ChatPanel
                connection={openChat}
                myId={session?.user?.id}
                onClose={() => setOpenChat(null)}
              />
              <div className="mt-3 p-3 bg-purple-950/40 border border-purple-800/30 rounded-xl text-center">
                <p className="text-xs text-purple-300 mb-2">Want to study together?</p>
                <button
                  onClick={() => router.push(`/groups/create?inviteId=${openChat._id}&inviteName=${encodeURIComponent(openChat.name)}`)}
                  className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-lg transition-all shadow-lg shadow-purple-500/20"
                >
                  🚀 Create Study Group with {openChat.name}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
