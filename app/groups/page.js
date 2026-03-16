"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function GroupsPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [groups, setGroups] = useState([]);
  const [allGroups, setAllGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState({});

  // Filters
  const [searchText, setSearchText] = useState("");
  const [dateFilter, setDateFilter] = useState("");   // "YYYY-MM-DD"
  const [subjectFilter, setSubjectFilter] = useState("");

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
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups(dateFilter, subjectFilter);
  }, [dateFilter, subjectFilter, fetchGroups]);

  // Client-side text search on top of server-filtered results
  useEffect(() => {
    if (!searchText.trim()) {
      setGroups(allGroups);
    } else {
      const q = searchText.toLowerCase();
      setGroups(
        allGroups.filter(
          (g) =>
            g.name.toLowerCase().includes(q) ||
            g.subject.toLowerCase().includes(q) ||
            g.description?.toLowerCase().includes(q) ||
            g.tags?.some((t) => t.toLowerCase().includes(q))
        )
      );
    }
  }, [searchText, allGroups]);

  const handleJoin = async (groupId) => {
    if (!session) {
      router.push("/Login");
      return;
    }
    setActionLoading((prev) => ({ ...prev, [groupId]: "joining" }));
    try {
      const res = await fetch(`/api/groups/${groupId}/join`, { method: "POST" });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to join");
      }
      await fetchGroups(dateFilter, subjectFilter);
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading((prev) => ({ ...prev, [groupId]: null }));
    }
  };

  const handleLeave = async (groupId) => {
    setActionLoading((prev) => ({ ...prev, [groupId]: "leaving" }));
    try {
      const res = await fetch(`/api/groups/${groupId}/leave`, { method: "POST" });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to leave");
      }
      await fetchGroups(dateFilter, subjectFilter);
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading((prev) => ({ ...prev, [groupId]: null }));
    }
  };

  const getRole = (group) => {
    if (!session) return "guest";
    const userId = String(session.user.id);
    if (String(group.owner?._id) === userId) return "owner";
    if (group.members?.some((m) => String(m._id) === userId)) return "member";
    return "visitor";
  };

  const getNextSession = (group) => {
    if (!group.sessions?.length) return null;
    const now = new Date();
    const upcoming = group.sessions
      .map((s) => new Date(s.date))
      .filter((d) => d >= now)
      .sort((a, b) => a - b);
    return upcoming[0] || null;
  };

  const checkIsLive = (group) => {
    if (!group.sessions?.length) return false;
    const now = new Date();
    return group.sessions.some(s => {
      const d = new Date(s.date);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const start = new Date(`${dateStr}T${s.startTime}:00`);
      const end = new Date(`${dateStr}T${s.endTime}:00`);
      return now >= start && now <= end;
    });
  };

  const clearFilters = () => {
    setDateFilter("");
    setSubjectFilter("");
    setSearchText("");
  };

  const hasFilters = dateFilter || subjectFilter || searchText;

  // Exact Match Theme Styles (Inspired by provided image)
  const inputCls =
    "bg-[#000814] border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all font-sans";

  return (
    <div className="min-h-screen bg-[#000b1a] font-sans selection:bg-violet-500/30 text-slate-100">
      <div className="max-w-7xl mx-auto space-y-12 py-16 px-6 lg:px-10">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
              Study Groups
            </h1>
            <div className="w-20 h-1.5 bg-violet-600 rounded-full" />
            <p className="text-slate-400 font-medium text-[16px] max-w-xl leading-relaxed">
              Welcome to the collaborative ecosystem. Join active nodes and master your subjects with the community.
            </p>
          </div>
          {session && (
            <Link
              href="/groups/create"
              className="inline-flex items-center justify-center rounded-2xl text-sm font-bold transition-all bg-violet-600 text-white shadow-xl shadow-violet-900/20 hover:bg-violet-500 hover:-translate-y-1 h-12 px-8 flex-shrink-0"
            >
              + Create Group
            </Link>
          )}
        </div>

        {/* Navy Filter Bar */}
        <div className="bg-[#0a192f]/30 border border-slate-800/80 rounded-[2.5rem] p-8 lg:p-12 flex flex-wrap gap-8 items-end shadow-2xl backdrop-blur-sm">
          <div className="flex-1 min-w-[280px] space-y-3">
            <label className="block text-[12px] font-bold text-slate-500 mb-1 uppercase tracking-widest ml-1">Search Nodes</label>
            <input
              type="text"
              placeholder="Enter keywords..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className={inputCls + " w-full"}
            />
          </div>

          <div className="flex-1 min-w-[200px] space-y-3">
            <label className="block text-[12px] font-bold text-slate-500 mb-1 uppercase tracking-widest ml-1">Subject</label>
            <input
              type="text"
              placeholder="e.g. Mathematics"
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className={inputCls + " w-full"}
            />
          </div>

          <div className="flex-1 min-w-[220px] space-y-3">
            <label className="block text-[12px] font-bold text-slate-500 mb-1 uppercase tracking-widest ml-1">Session Date</label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className={inputCls + " w-full [color-scheme:dark]"}
            />
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setDateFilter(new Date().toISOString().split("T")[0])}
              className="h-12 px-7 rounded-xl bg-[#0a192f] border border-slate-700 text-slate-300 font-bold text-[14px] hover:text-white hover:border-violet-500 transition-all shadow-lg"
            >
              Today
            </button>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="h-12 px-5 rounded-xl text-red-400 font-bold text-[14px] hover:bg-red-500/10 transition-all"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Grid Section */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-72 rounded-[2.5rem] bg-[#0a192f]/40 animate-pulse border border-slate-800"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {groups.map((group) => {
              const role = getRole(group);
              const isActioning = actionLoading[group._id];
              const isFull = group.members?.length >= group.maxMembers;
              const isLive = checkIsLive(group);

              return (
                <div
                  key={group._id}
                  className="group flex flex-col space-y-5"
                >
                  <div className="bg-[#0a192f]/30 border border-slate-800/80 rounded-[3rem] p-9 transition-all duration-500 hover:border-violet-500/50 hover:bg-[#0a192f]/50 flex-grow relative overflow-hidden backdrop-blur-sm shadow-xl">
                    
                    {isLive && (
                      <div className="absolute top-6 right-8 flex items-center gap-2 px-3 py-1 rounded-full bg-violet-600/10 text-violet-400 text-[10px] font-black tracking-widest border border-violet-500/20 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                        LIVE
                      </div>
                    )}

                    <div className="space-y-6">
                      <div>
                        <span className="text-[11px] font-black text-violet-500 uppercase tracking-[0.3em] block mb-2">
                          {group.subject}
                        </span>
                        <h3 className="text-2xl font-bold text-white group-hover:text-violet-300 transition-colors">
                          {group.name}
                        </h3>
                      </div>

                      <p className="text-[15px] text-slate-400 font-medium leading-relaxed line-clamp-2">
                        {group.description || "Active community node exploring advanced learning paths."}
                      </p>

                      <div className="space-y-4 pt-2">
                         <div className="flex justify-between items-center text-[11px] font-bold text-slate-500">
                            <span>MEMBER LOAD</span>
                            <span className="text-slate-200">{group.members?.length}/{group.maxMembers}</span>
                         </div>
                         <div className="h-2 w-full bg-[#000814] rounded-full overflow-hidden border border-slate-800">
                            <div 
                              className={`h-full rounded-full transition-all duration-1000 ${isFull ? 'bg-amber-500' : 'bg-violet-600'} shadow-[0_0_12px_rgba(124,58,237,0.4)]`}
                              style={{ width: `${(group.members?.length/group.maxMembers)*100}%` }}
                            />
                         </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 px-3">
                    {role === "owner" ? (
                      <Link href={`/groups/${group._id}`} className="flex-1 bg-[#1a1c1e] border border-slate-700 text-slate-200 text-[13px] font-bold py-3.5 rounded-[20px] text-center hover:bg-slate-800 transition-all">
                        Manage Hub
                      </Link>
                    ) : role === "member" ? (
                      <button
                        onClick={() => handleLeave(group._id)}
                        disabled={isActioning === "leaving"}
                        className="flex-1 bg-red-900/20 text-red-400 text-[13px] font-bold py-3.5 rounded-[20px] border border-red-900/30 hover:bg-red-900/30 transition-all"
                      >
                        {isActioning === "leaving" ? "..." : "Leave Hub"}
                      </button>
                    ) : isFull ? (
                      <span className="flex-1 bg-[#0a192f]/40 text-slate-600 text-[13px] font-bold py-3.5 rounded-[20px] text-center border border-slate-800/50">Full Node</span>
                    ) : (
                      <button
                        onClick={() => handleJoin(group._id)}
                        disabled={isActioning === "joining"}
                        className="flex-1 bg-violet-600 text-white text-[13px] font-bold py-3.5 rounded-[20px] hover:bg-violet-500 transition-all shadow-xl shadow-violet-900/20 active:scale-95"
                      >
                        {isActioning === "joining" ? "..." : "Join Node"}
                      </button>
                    )}

                    <Link
                      href={`/groups/${group._id}`}
                      className="w-14 h-14 flex items-center justify-center rounded-[20px] bg-[#000814] border border-slate-700 text-slate-400 hover:text-white hover:border-violet-500 transition-all shadow-lg"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
