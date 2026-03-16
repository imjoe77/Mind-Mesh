"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

function toLocalDateStr(d) {
  const dd = new Date(d);
  return `${dd.getFullYear()}-${String(dd.getMonth() + 1).padStart(2, "0")}-${String(dd.getDate()).padStart(2, "0")}`;
}

export default function GroupDetailPage() {
  const { groupId } = useParams();
  const { data: session } = useSession();
  const router = useRouter();

  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [slotAction, setSlotAction] = useState({}); // { [sessionId]: 'joining'|'leaving' }
  const [addingComment, setAddingComment] = useState(false);

  useEffect(() => { fetchGroup(); }, [groupId]);

  const fetchGroup = async (quiet = false) => {
    try {
      if (!quiet) setLoading(true);
      const res = await fetch(`/api/groups/${groupId}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load group");
      setGroup(data.group);
    } catch (err) {
      setError(err.message);
    } finally {
      if (!quiet) setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!session) return router.push("/Login");
    setJoining(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/join`, { method: "POST" });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed to join"); }
      await fetchGroup();
    } catch (err) { alert(err.message); }
    finally { setJoining(false); }
  };

  const handleLeave = async () => {
    setLeaving(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/leave`, { method: "POST" });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed to leave"); }
      await fetchGroup();
    } catch (err) { alert(err.message); }
    finally { setLeaving(false); }
  };

  const handleJoinSlot = async (sessionId) => {
    setSlotAction((p) => ({ ...p, [sessionId]: "joining" }));
    try {
      const res = await fetch(`/api/groups/${groupId}/sessions/${sessionId}/join`, { method: "POST" });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed to join slot"); }
      await fetchGroup(true);
    } catch (err) { alert(err.message); }
    finally { setSlotAction((p) => ({ ...p, [sessionId]: null })); }
  };

  const handleLeaveSlot = async (sessionId) => {
    setSlotAction((p) => ({ ...p, [sessionId]: "leaving" }));
    try {
      const res = await fetch(`/api/groups/${groupId}/sessions/${sessionId}/join`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed to leave slot"); }
      await fetchGroup(true);
    } catch (err) { alert(err.message); }
    finally { setSlotAction((p) => ({ ...p, [sessionId]: null })); }
  };

  const handleDeleteSlot = async (sessionId) => {
    if (!confirm("Remove this session slot?")) return;
    try {
      const res = await fetch(`/api/groups/${groupId}/sessions?sessionId=${sessionId}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed to delete slot"); }
      await fetchGroup(true);
    } catch (err) { alert(err.message); }
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
    } catch (err) { alert(err.message); }
    finally { setAddingComment(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#000b1a] flex items-center justify-center">
      <div className="space-y-4 text-center">
        <div className="w-12 h-12 border-4 border-violet-500/20 border-t-violet-600 rounded-full animate-spin mx-auto" />
        <p className="text-slate-400 font-bold tracking-widest uppercase text-xs">Syncing Node...</p>
      </div>
    </div>
  );

  if (error || !group) return (
    <div className="min-h-screen bg-[#000b1a] flex items-center justify-center p-6">
      <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-[2.5rem] max-w-md w-full text-center">
        <h2 className="text-xl font-bold text-red-400 mb-2">Connectivity Error</h2>
        <p className="text-red-300/60 mb-6">{error || "Group node unreachable."}</p>
        <button onClick={() => router.push("/groups")} className="px-6 py-2 bg-red-500 text-white rounded-xl font-bold text-sm">Return to Hub</button>
      </div>
    </div>
  );

  const userId = session?.user?.id;
  const isMember = session && (group.members || []).some(m => String(m._id) === String(userId));
  const isOwner = session && String(group.owner._id) === String(userId);

  return (
    <div className="min-h-screen bg-[#000b1a] font-sans selection:bg-violet-500/30 text-slate-100">
      
      {/* Decorative Orbs */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-blue-600/5 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto py-12 px-4 lg:px-10 relative z-10">
        
        {/* Back Button */}
        <Link href="/groups" className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-8 group">
          <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm font-bold uppercase tracking-widest">Back to Network</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Sidebar / Profile Card */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-[#0a192f]/40 border border-slate-800 rounded-[2.5rem] p-10 shadow-2xl backdrop-blur-md relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 group-hover:bg-violet-600/20 transition-all duration-700" />
              
              <div className="space-y-8 relative z-10">
                <div className="space-y-4">
                  <span className="inline-flex text-[10px] font-black uppercase tracking-[0.2em] text-violet-400 bg-violet-600/10 px-4 py-1.5 rounded-full border border-violet-500/20">
                    {group.subject}
                  </span>
                  <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight">{group.name}</h1>
                  <p className="text-slate-400 font-medium text-[15px] leading-relaxed">
                    {group.description || "No transmission protocol description provided for this node."}
                  </p>
                </div>

                <div className="flex items-center gap-4 p-5 bg-[#000814] rounded-3xl border border-slate-800/80">
                  <div className="w-12 h-12 rounded-2xl bg-violet-600 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-violet-900/40">
                    {group.owner.name?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-0.5">Architect</p>
                    <p className="text-base font-bold text-white">{group.owner.name}</p>
                  </div>
                </div>

                <div className="space-y-4">
                   <div className="flex justify-between items-center px-1">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-widest uppercase">Member Capacity</span>
                      <span className="text-sm font-black text-slate-200">
                        {(group.members || []).length} <span className="text-slate-600 font-bold mx-1">/</span> {group.maxMembers}
                      </span>
                   </div>
                   <div className="h-2 w-full bg-[#000814] rounded-full overflow-hidden border border-slate-800/50">
                      <div 
                        className="h-full bg-violet-600 rounded-full transition-all duration-1000 shadow-[0_0_12px_rgba(124,58,237,0.4)]" 
                        style={{ width: `${((group.members || []).length / group.maxMembers) * 100}%` }}
                      />
                   </div>
                </div>

                <div className="pt-2">
                  {!session ? (
                    <button onClick={() => router.push("/Login")} className="w-full py-4 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-violet-900/20 active:scale-95">Sign in to join</button>
                  ) : isOwner ? (
                    <div className="w-full py-4 rounded-2xl bg-violet-500/10 border border-violet-500/30 text-violet-400 font-black text-xs uppercase tracking-widest text-center">Node Authority Active</div>
                  ) : isMember ? (
                    <button disabled={leaving} onClick={handleLeave} className="w-full py-4 rounded-2xl bg-red-900/20 hover:bg-red-900/30 text-red-200 border border-red-800/40 font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50">
                      {leaving ? "Disconnecting..." : "Leave Hub"}
                    </button>
                  ) : (group.members || []).length >= group.maxMembers ? (
                    <div className="w-full py-4 rounded-2xl bg-slate-800/50 text-slate-600 font-black text-xs uppercase tracking-widest text-center border border-slate-800">Node Saturated</div>
                  ) : (
                    <button disabled={joining} onClick={handleJoin} className="w-full py-4 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-violet-900/20 active:scale-95 disabled:opacity-50">
                      {joining ? "Synching..." : "Join Cluster"}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {(group.tags || []).length > 0 && (
              <div className="flex flex-wrap gap-2.5 px-2">
                {group.tags.map(t => (
                  <span key={t} className="px-3.5 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-xl bg-[#0a192f]/20 border border-slate-800 text-slate-500 hover:text-violet-400 transition-colors cursor-default">#{t}</span>
                ))}
              </div>
            )}
          </div>

          {/* Main Content Areas */}
          <div className="lg:col-span-8 space-y-10">
            
            {/* Session Timeline */}
            <section className="bg-[#0a192f]/40 border border-slate-800 rounded-[2.5rem] p-8 md:p-12 shadow-2xl backdrop-blur-md relative overflow-hidden">
               <div className="flex items-center justify-between mb-10">
                  <h2 className="text-2xl font-black text-white flex items-center gap-3">
                    <span className="p-2 rounded-xl bg-violet-600/20 text-violet-500 border border-violet-500/20">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </span>
                    Temporal Slots
                  </h2>
               </div>

              {(group.sessions || []).length === 0 ? (
                <div className="text-center py-20 rounded-[2rem] bg-[#000814]/40 border border-slate-800/50 border-dashed">
                  <p className="text-slate-600 font-bold uppercase tracking-widest text-xs">No active time windows scheduled.</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {(group.sessions || []).map((s) => {
                    const dateStr = toLocalDateStr(new Date(s.date));
                    const now = new Date();
                    const sessionStart = new Date(`${dateStr}T${s.startTime}:00`);
                    const sessionEnd = new Date(`${dateStr}T${s.endTime}:00`);
                    
                    const isPast = sessionEnd < now;
                    const isInProgress = now >= sessionStart && now <= sessionEnd;
                    const dbStatus = s.status || "scheduled";
                    const isLive = dbStatus === "active" || isInProgress;
                    
                    const hasJoined = (s.participants || []).some(p => {
                      const pId = p?._id ? String(p._id) : String(p);
                      return pId === String(userId);
                    });
                    
                    const acting = slotAction[s._id];

                    return (
                      <div key={s._id} className={`rounded-[2rem] border p-6 flex flex-col md:flex-row md:items-center gap-6 transition-all relative overflow-hidden ${
                        isPast || dbStatus === "completed" ? "border-slate-800/40 bg-[#000814]/20 opacity-40 grayscale" : 
                        isLive ? "border-emerald-500/40 bg-emerald-500/5 shadow-[0_0_30px_rgba(16,185,129,0.1)]" :
                        "border-slate-800/80 bg-[#000814]/40 hover:border-violet-500/30"
                      }`}>
                        {isLive && <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500 animate-pulse" />}
                        
                        <div className="flex-grow">
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`text-[11px] font-black uppercase tracking-[0.2em] ${
                              isPast || dbStatus === "completed" ? "text-slate-600" : 
                              isLive ? "text-emerald-400 font-black" :
                              "text-violet-500"
                            }`}>
                              {new Date(s.date).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}
                            </span>
                            {isLive && (
                              <span className="flex items-center gap-1.5 text-[9px] bg-emerald-500 text-white px-2.5 py-1 rounded-full font-black animate-pulse">
                                LIVE PHASE
                              </span>
                            )}
                          </div>
                          <div className={`text-2xl font-bold font-mono tracking-tighter ${isLive ? "text-emerald-50" : "text-white"}`}>
                            {s.startTime} <span className="text-slate-700 font-sans mx-2">→</span> {s.endTime}
                          </div>
                          {s.note && <p className="text-xs text-slate-500 mt-2 font-medium">{s.note}</p>}
                        </div>

                        <div className="flex items-center gap-4 flex-shrink-0">
                          <div className="flex flex-col items-end">
                             <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">LOAD</span>
                             <span className="text-sm font-bold text-slate-300">{s.participants?.length ?? 0} <span className="text-slate-600">Joined</span></span>
                          </div>

                          <div className="h-10 w-px bg-slate-800/80 hidden md:block" />

                          <div className="flex items-center gap-3">
                             {isOwner && !isPast && (
                               <button onClick={() => handleDeleteSlot(s._id)} className="w-10 h-10 rounded-xl bg-red-900/10 border border-red-500/20 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all">
                                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                               </button>
                             )}

                             {isMember && !isOwner && !isPast && (
                               hasJoined ? (
                                 <button onClick={() => handleLeaveSlot(s._id)} disabled={acting === "leaving"} className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-400 text-xs font-bold border border-slate-700 hover:bg-red-900/20 hover:text-red-400 hover:border-red-500/20 transition-all">
                                   Leave
                                 </button>
                               ) : (
                                 <button onClick={() => handleJoinSlot(s._id)} disabled={acting === "joining"} className="px-6 py-2.5 rounded-xl bg-violet-600 text-white text-xs font-bold hover:bg-violet-500 transition-all shadow-lg active:scale-95 disabled:opacity-50">
                                   Join Slot
                                 </button>
                               )
                             )}

                             {isLive && (isMember || isOwner) && (
                               <button onClick={() => router.push(`/groups/${groupId}/session/${s._id}`)} className="px-5 py-2.5 rounded-xl bg-emerald-500 text-white text-xs font-black transition-all shadow-xl shadow-emerald-500/20 flex items-center gap-2 hover:scale-105 active:scale-95">
                                 <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                                 ENTER ROOM
                               </button>
                             )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Discussion Interface */}
            <section className="bg-[#0a192f]/40 border border-slate-800 rounded-[2.5rem] p-8 md:p-12 shadow-2xl backdrop-blur-md">
               <h2 className="text-2xl font-black text-white flex items-center gap-3 mb-10">
                  <span className="p-2 rounded-xl bg-violet-600/20 text-violet-500 border border-violet-500/20">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                    </svg>
                  </span>
                  Neural Feedback
               </h2>

              <div className="space-y-6 mb-10 max-h-[32rem] overflow-y-auto pr-4 custom-scrollbar">
                {group.comments?.length === 0 ? (
                  <div className="text-center py-20 rounded-[2rem] bg-[#000814]/20 border border-slate-800/10">
                    <p className="text-slate-600 font-bold uppercase tracking-widest text-[10px]">Transmission silent. Start the thread.</p>
                  </div>
                ) : (
                  group.comments.map(c => (
                    <div key={c._id} className="bg-[#000814]/40 rounded-[2rem] p-6 border border-slate-800/60 flex items-start gap-5 hover:border-slate-700 transition-colors group">
                      <div className="w-10 h-10 flex-shrink-0 bg-violet-600/20 border border-violet-500/30 text-violet-400 rounded-2xl flex items-center justify-center font-black text-sm">
                        {c.author?.name?.charAt(0) || "U"}
                      </div>
                      <div className="flex-grow pt-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-bold text-slate-200">{c.author?.name || "Anonymous Member"}</span>
                          <span className="text-[10px] uppercase font-black tracking-widest text-slate-600">{new Date(c.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}</span>
                        </div>
                        <p className="text-[15px] text-slate-400 font-medium leading-relaxed whitespace-pre-wrap">{c.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {isMember || isOwner ? (
                <form onSubmit={handleAddComment} className="relative mt-auto">
                   <div className="bg-[#000814] rounded-3xl border border-slate-800 p-2 focus-within:border-violet-600/50 transition-all flex items-center gap-2 pr-3">
                      <textarea 
                        name="content" 
                        required 
                        rows="1" 
                        placeholder="Broadcast message to node..." 
                        className="flex-grow bg-transparent border-none px-4 py-3 text-sm text-slate-100 placeholder-slate-700 focus:outline-none focus:ring-0 resize-none min-h-[56px] custom-scrollbar" 
                      />
                      <button 
                        disabled={addingComment} 
                        type="submit" 
                        className="w-11 h-11 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl flex items-center justify-center transition-all disabled:opacity-50 shadow-lg shadow-violet-900/40 active:scale-90"
                      >
                        {addingComment ? (
                          <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : (
                          <svg className="w-5 h-5 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                        )}
                      </button>
                   </div>
                </form>
              ) : (
                <div className="p-6 bg-violet-500/5 rounded-3xl border border-violet-500/10 text-center">
                  <p className="text-violet-400 text-xs font-black uppercase tracking-[0.2em]">Synchronization Required</p>
                  <p className="text-slate-500 text-sm mt-1">Join this node to unlock the feedback terminal.</p>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(71, 85, 105, 0.4); border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(71, 85, 105, 0.6); }
      `}</style>
    </div>
  );
}
