"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";

function toLocalDateStr(d) {
  const dd = new Date(d);
  return `${dd.getFullYear()}-${String(dd.getMonth() + 1).padStart(2, "0")}-${String(dd.getDate()).padStart(2, "0")}`;
}

function nowTimeStr() {
  const n = new Date();
  return `${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}`;
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

  // Member: join an individual slot
  const handleJoinSlot = async (sessionId) => {
    setSlotAction((p) => ({ ...p, [sessionId]: "joining" }));
    try {
      const res = await fetch(`/api/groups/${groupId}/sessions/${sessionId}/join`, { method: "POST" });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed to join slot"); }
      await fetchGroup(true); // quiet refresh
    } catch (err) { alert(err.message); }
    finally { setSlotAction((p) => ({ ...p, [sessionId]: null })); }
  };

  // Member: leave a slot
  const handleLeaveSlot = async (sessionId) => {
    setSlotAction((p) => ({ ...p, [sessionId]: "leaving" }));
    try {
      const res = await fetch(`/api/groups/${groupId}/sessions/${sessionId}/join`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed to leave slot"); }
      await fetchGroup(true); // quiet refresh
    } catch (err) { alert(err.message); }
    finally { setSlotAction((p) => ({ ...p, [sessionId]: null })); }
  };

  // Owner: delete a slot
  const handleDeleteSlot = async (sessionId) => {
    if (!confirm("Remove this session slot?")) return;
    try {
      const res = await fetch(`/api/groups/${groupId}/sessions?sessionId=${sessionId}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed to delete slot"); }
      await fetchGroup(true); // quiet refresh
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
      await fetchGroup(true); // quiet refresh
    } catch (err) { alert(err.message); }
    finally { setAddingComment(false); }
  };

  if (loading) return <div className="p-8 text-center text-slate-400 animate-pulse">Loading group details...</div>;
  if (error || !group) return <div className="p-8 text-center text-red-400 bg-red-900/20 max-w-lg mx-auto rounded-xl mt-12 border border-red-800">{error || "Group not found"}</div>;

  const userId = session?.user?.id;
  const isMember = session && (group.members || []).some(m => String(m._id) === String(userId));
  const isOwner = session && String(group.owner._id) === String(userId);
  const inputCls = "bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none transition-colors";

  // Separate windows and slots
  const windows = (group.sessions || []).filter(s => !s.isSlot);
  const slots = (group.sessions || []).filter(s => s.isSlot);

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 grid grid-cols-1 lg:grid-cols-3 gap-8">

      {/* ── Sidebar ── */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 blur-3xl -mr-10 -mt-10 rounded-full" />

          <div className="flex justify-between items-start mb-4">
            <span className="inline-flex text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
              {group.subject}
            </span>
          </div>

          <h1 className="text-2xl font-bold text-white mb-2 leading-tight">{group.name}</h1>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">{group.description || "No description provided."}</p>

          <div className="flex items-center gap-3 mb-6 p-4 bg-slate-950 rounded-xl border border-slate-800">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-300">{group.owner.name?.charAt(0)}</div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Host</p>
              <p className="text-sm font-medium text-slate-200">{group.owner.name}</p>
            </div>
          </div>

          <div className="mb-6 flex items-center justify-between text-sm">
            <span className="text-slate-400 font-medium">Members</span>
            <span className="text-slate-200 bg-slate-800 px-2 py-1 rounded-md font-mono text-xs border border-slate-700">
              {(group.members || []).length} / {group.maxMembers}
            </span>
          </div>

          <div>
            {!session ? (
              <button onClick={() => router.push("/Login")} className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-all">Sign in to join</button>
            ) : isOwner ? (
              <div className="w-full py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-medium text-center text-sm">You own this group</div>
            ) : isMember ? (
              <button disabled={leaving} onClick={handleLeave} className="w-full py-3 rounded-xl bg-red-900/50 hover:bg-red-800/80 text-red-200 border border-red-800 font-medium transition-colors disabled:opacity-50">
                {leaving ? "Leaving..." : "Leave Group"}
              </button>
            ) : (group.members || []).length >= group.maxMembers ? (
              <div className="w-full py-3 rounded-xl bg-slate-800 text-slate-500 font-medium text-center">Group is full</div>
            ) : (
              <button disabled={joining} onClick={handleJoin} className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-all disabled:opacity-50">
                {joining ? "Joining..." : "Join Study Group"}
              </button>
            )}
          </div>
        </div>

        {(group.tags || []).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {group.tags.map(t => (
              <span key={t} className="px-3 py-1 text-xs font-mono rounded-md bg-slate-900 border border-slate-800 text-slate-400">#{t}</span>
            ))}
          </div>
        )}
      </div>

      {/* ── Main ── */}
      <div className="lg:col-span-2 space-y-8">

        {/* Sessions */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2 mb-6">
            <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" />
            </svg>
            Session Slots
          </h2>

          {(group.sessions || []).length === 0 ? (
            <div className="text-center py-10 rounded-xl bg-slate-950/50 border border-slate-800 border-dashed">
              <p className="text-slate-500 text-sm">No sessions scheduled yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(group.sessions || []).map((s) => {
                const dateStr = toLocalDateStr(new Date(s.date));
                const now = new Date();
                const sessionStart = new Date(`${dateStr}T${s.startTime}:00`);
                const sessionEnd = new Date(`${dateStr}T${s.endTime}:00`);
                
                const isPast = sessionEnd < now;
                const isInProgress = now >= sessionStart && now <= sessionEnd;
                const dbStatus = s.status || "scheduled";
                const isLive = dbStatus === "active" || isInProgress;
                
                // Extra robust join check: handle objects, IDs, and nulls
                const hasJoined = (s.participants || []).some(p => {
                  const pId = p?._id ? String(p._id) : String(p);
                  return pId === String(userId);
                });
                
                const acting = slotAction[s._id];

                return (
                  <div key={s._id} className={`rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center gap-4 transition-all ${
                    isPast || dbStatus === "completed" ? "border-slate-800 bg-slate-950/30 opacity-50" : 
                    isLive ? "border-green-500/50 bg-green-500/5 shadow-[0_0_15px_rgba(34,197,94,0.1)] relative overflow-hidden" :
                    "border-slate-700 bg-slate-950 hover:border-indigo-600/40"
                  }`}>
                    {isLive && <div className="absolute top-0 left-0 w-1 h-full bg-green-500 animate-pulse" />}
                    
                    {/* Date + time */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-bold uppercase tracking-wider ${
                          isPast || dbStatus === "completed" ? "text-slate-500" : 
                          isLive ? "text-green-400" :
                          "text-indigo-400"
                        }`}>
                          {new Date(s.date).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}
                        </span>
                        {(isPast || dbStatus === "completed") && <span className="text-[10px] bg-slate-800 text-slate-600 px-2 py-0.5 rounded-full">Completed</span>}
                        {isLive && (
                          <span className="flex items-center gap-1 text-[10px] bg-green-500 text-white px-2 py-0.5 rounded-full font-bold animate-pulse">
                            <span className="w-1.5 h-1.5 bg-white rounded-full" />
                            LIVE NOW
                          </span>
                        )}
                        {!isPast && !isLive && dbStatus === "scheduled" && (
                          <span className="text-[10px] bg-indigo-900/30 text-indigo-400 border border-indigo-800/40 px-2 py-0.5 rounded-full">Scheduled</span>
                        )}
                      </div>
                      <div className={`text-base font-bold font-mono ${isLive ? "text-green-50" : "text-slate-200"}`}>
                        {s.startTime} – {s.endTime}
                      </div>
                      {s.note && <p className="text-xs text-slate-500 mt-1">{s.note}</p>}
                    </div>

                    {/* Participant count + actions */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-xs text-slate-500">
                        <span className="text-slate-300 font-semibold">{s.participants?.length ?? 0}</span> joined
                      </span>

                      {/* Owner: delete slot */}
                      {isOwner && !isPast && (
                        <button
                          onClick={() => handleDeleteSlot(s._id)}
                          className="text-xs px-3 py-1.5 rounded-lg bg-red-900/30 text-red-400 border border-red-900/50 hover:bg-red-900/60 transition-colors"
                        >
                          Remove
                        </button>
                      )}

                      {/* Members: join / leave a slot */}
                      {isMember && !isOwner && !isPast && (
                        hasJoined ? (
                          <button
                            onClick={() => handleLeaveSlot(s._id)}
                            disabled={acting === "leaving"}
                            className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 hover:border-red-700 hover:text-red-400 transition-colors disabled:opacity-50"
                          >
                            {acting === "leaving" ? "..." : "Leave Slot"}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleJoinSlot(s._id)}
                            disabled={acting === "joining"}
                            className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-all shadow-sm disabled:opacity-50"
                          >
                            {acting === "joining" ? "..." : "Join Slot"}
                          </button>
                        )
                      )}

                      {/* Badge for already joined */}
                      {hasJoined && !isPast && (
                        <span className="text-[10px] bg-green-900/30 border border-green-800/40 text-green-400 px-2 py-0.5 rounded-full">You&apos;re in</span>
                      )}

                      {/* 🚀 Enter Study Room — shown when session is live */}
                      {isLive && (isMember || isOwner) && (
                        <button
                          onClick={() => router.push(`/groups/${groupId}/session/${s._id}`)}
                          className="text-xs px-4 py-1.5 rounded-lg bg-green-500 text-white font-bold hover:bg-green-400 transition-all shadow-lg shadow-green-500/30 flex items-center gap-1.5"
                        >
                          <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                          Enter Study Room
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Discussion */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl">
          <h2 className="text-xl font-bold text-slate-100 mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
            </svg>
            Discussion Board
          </h2>

          <div className="space-y-4 mb-6 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
            {group.comments?.length === 0 ? (
              <div className="text-center py-8"><p className="text-slate-500 text-sm">Be the first to start the conversation.</p></div>
            ) : (
              group.comments.map(c => (
                <div key={c._id} className="bg-slate-950 rounded-xl p-4 border border-slate-800/50 flex gap-4">
                  <div className="w-8 h-8 flex-shrink-0 bg-indigo-900/50 border border-indigo-800 text-indigo-300 rounded-full flex items-center justify-center font-bold text-xs">
                    {c.author?.name?.charAt(0) || "U"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-slate-300">{c.author?.name || "Unknown"}</span>
                      <span className="text-[10px] text-slate-600">{new Date(c.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{c.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {isMember || isOwner ? (
            <form onSubmit={handleAddComment} className="flex gap-3">
              <textarea name="content" required rows="1" placeholder="Share something with the group..." className="flex-grow bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none min-h-[48px] transition-all" />
              <button disabled={addingComment} type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-6 py-2 font-medium transition-all disabled:opacity-50 flex-shrink-0">
                {addingComment ? "..." : "Post"}
              </button>
            </form>
          ) : (
            <div className="text-center py-4 bg-slate-950 rounded-xl border border-slate-800 text-slate-500 text-sm">
              Join the group to participate in the discussion.
            </div>
          )}
        </section>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #334155; border-radius: 20px; }
      `}</style>
    </div>
  );
}
