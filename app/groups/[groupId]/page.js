"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";

export default function GroupDetailPage() {
  const { groupId } = useParams();
  const { data: session } = useSession();
  const router = useRouter();
  
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Specific loading states
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [addingSession, setAddingSession] = useState(false);
  const [addingComment, setAddingComment] = useState(false);

  useEffect(() => {
    fetchGroup();
  }, [groupId]);

  const fetchGroup = async () => {
    try {
      const res = await fetch(`/api/groups/${groupId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load group");
      setGroup(data.group);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!session) return router.push("/api/auth/signin");
    setJoining(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/join`, { method: "POST" });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to join");
      }
      await fetchGroup();
    } catch (err) {
      alert(err.message);
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async () => {
    setLeaving(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/leave`, { method: "POST" });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to leave");
      }
      await fetchGroup();
    } catch (err) {
      alert(err.message);
    } finally {
      setLeaving(false);
    }
  };

  const handleAddSession = async (e) => {
    e.preventDefault();
    setAddingSession(true);
    const fd = new FormData(e.target);
    const data = {
      date: fd.get("date"),
      startTime: fd.get("startTime"),
      endTime: fd.get("endTime"),
      note: fd.get("note")
    };
    
    try {
      const res = await fetch(`/api/groups/${groupId}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to add session");
      e.target.reset();
      await fetchGroup();
    } catch (err) {
      alert(err.message);
    } finally {
      setAddingSession(false);
    }
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
      await fetchGroup();
    } catch (err) {
      alert(err.message);
    } finally {
      setAddingComment(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400 animate-pulse">Loading group details...</div>;
  }
  
  if (error || !group) {
    return <div className="p-8 text-center text-red-400 bg-red-900/20 max-w-lg mx-auto rounded-xl mt-12 border border-red-800">{error || "Group not found"}</div>;
  }

  const isMember = session && group.members.some(m => m._id === session.user.id);
  const isOwner = session && group.owner._id === session.user.id;

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Sidebar - Details */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 blur-3xl -mr-10 -mt-10 rounded-full"></div>
          
          <div className="flex justify-between items-start mb-4">
            <span className="inline-flex text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
              {group.subject}
            </span>
            <span className="text-xs text-slate-500">{group.isPrivate ? "Private" : "Public"}</span>
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-2 leading-tight">{group.name}</h1>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">{group.description || "No description provided."}</p>
          
          <div className="flex items-center gap-3 mb-6 p-4 bg-slate-950 rounded-xl border border-slate-800">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-300 shadow-inner">
              {group.owner.name?.charAt(0)}
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Host</p>
              <p className="text-sm font-medium text-slate-200">{group.owner.name}</p>
            </div>
          </div>

          <div className="mb-6 flex items-center justify-between text-sm">
            <span className="text-slate-400 font-medium">Members</span>
            <span className="text-slate-200 bg-slate-800 px-2 py-1 rounded-md font-mono text-xs border border-slate-700">
              {group.members.length} / {group.maxMembers}
            </span>
          </div>

          <div className="mt-8">
            {!session ? (
              <button onClick={() => router.push("/api/auth/signin")} className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_20px_rgba(79,70,229,0.5)] transform hover:-translate-y-0.5">
                Sign in to join
              </button>
            ) : isOwner ? (
              <div className="w-full py-3 rounded-xl bg-slate-800 border-2 border-slate-700 border-dashed text-slate-400 font-medium text-center shadow-inner cursor-not-allowed">
                You host this group
              </div>
            ) : isMember ? (
              <button disabled={leaving} onClick={handleLeave} className="w-full py-3 rounded-xl bg-red-900/50 hover:bg-red-800/80 text-red-200 border border-red-800 font-medium transition-colors disabled:opacity-50">
                {leaving ? "Leaving..." : "Leave Group"}
              </button>
            ) : group.members.length >= group.maxMembers ? (
              <div className="w-full py-3 rounded-xl bg-slate-800 text-slate-500 font-medium text-center">
                Group is full
              </div>
            ) : (
              <button disabled={joining} onClick={handleJoin} className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-all shadow-[0_0_15px_rgba(79,70,229,0.4)] hover:-translate-y-0.5 disabled:opacity-50">
                {joining ? "Joining..." : "Join Study Group"}
              </button>
            )}
          </div>
        </div>

        {/* Tags */}
        {group.tags && group.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {group.tags.map(t => (
              <span key={t} className="px-3 py-1 text-xs font-mono rounded-md bg-slate-900 border border-slate-800 text-slate-400">
                #{t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Main Content Area - Calendar/Sessions & Discussion */}
      <div className="lg:col-span-2 space-y-8">
        
        {/* Calendar / Sessions */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Weekly Schedule
            </h2>
          </div>

          {group.sessions?.length === 0 ? (
            <div className="text-center py-10 rounded-xl bg-slate-950/50 border border-slate-800 border-dashed">
              <p className="text-slate-500 text-sm">No upcoming sessions. Check back later.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {group.sessions.map((session, idx) => (
                <div key={idx} className="bg-slate-950 p-4 rounded-xl border-l-4 border-indigo-500 border-y border-r border-y-slate-800 border-r-slate-800 flex flex-col hover:border-indigo-400 transition-colors">
                  <span className="text-xs text-indigo-400 font-semibold mb-1 uppercase tracking-wider">
                    {new Date(session.date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                  <div className="text-lg font-bold text-slate-200 mb-2 font-mono">
                    {session.startTime} - {session.endTime}
                  </div>
                  {session.note && <p className="text-sm text-slate-400 bg-slate-900/50 p-2 rounded-md">{session.note}</p>}
                </div>
              ))}
            </div>
          )}

          {/* Add Session Form */}
          {isMember && (
            <div className="mt-8 pt-6 border-t border-slate-800">
              <h3 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider">Suggest a New Time Slot</h3>
              <form onSubmit={handleAddSession} className="flex flex-col sm:flex-row gap-3">
                <input type="date" name="date" required className="bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none flex-grow" />
                <input type="time" name="startTime" required className="bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
                <input type="time" name="endTime" required className="bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
                <input type="text" name="note" placeholder="Topic (Optional)" className="bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none flex-grow" />
                <button disabled={addingSession} type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-4 py-2 font-medium text-sm transition-colors disabled:opacity-50 whitespace-nowrap">
                  {addingSession ? "+" : "Add Slot"}
                </button>
              </form>
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
               <div className="text-center py-8">
                 <p className="text-slate-500 text-sm">Be the first to start the conversation.</p>
               </div>
            ) : (
              group.comments.map(c => (
                <div key={c._id} className="bg-slate-950 rounded-xl p-4 border border-slate-800/50 flex gap-4">
                  <div className="w-8 h-8 flex-shrink-0 bg-indigo-900/50 border border-indigo-800 text-indigo-300 rounded-full flex items-center justify-center font-bold text-xs">
                    {c.author?.name?.charAt(0) || "U"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-slate-300">{c.author?.name || "Unknown"}</span>
                      <span className="text-[10px] text-slate-600">
                         {new Date(c.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{c.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {isMember ? (
            <form onSubmit={handleAddComment} className="flex gap-3">
              <textarea 
                name="content"
                required
                rows="1"
                placeholder="Share your thoughts with the group..."
                className="flex-grow bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none min-h-[48px] transition-all"
              />
              <button disabled={addingComment} type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-6 py-2 font-medium transition-all shadow-[0_4px_10px_rgba(79,70,229,0.3)] disabled:opacity-50 flex items-center justify-center flex-shrink-0">
                {addingComment ? "..." : "Post"}
              </button>
            </form>
          ) : (
            <div className="text-center py-4 bg-slate-950 rounded-xl border border-slate-800 text-slate-500 text-sm">
              You must be a member to participate in the discussion.
            </div>
          )}
        </section>

      </div>
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #334155;
          border-radius: 20px;
        }
      `}</style>
    </div>
  );
}
