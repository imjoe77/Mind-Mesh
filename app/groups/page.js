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
    if (!session) return router.push("/Login");
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

  // Get the next upcoming session date for a group
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

  const inputCls =
    "bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition";

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-8 px-4">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Study Groups
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            Find a group with upcoming sessions and start studying together.
          </p>
        </div>
        {session && (
          <Link
            href="/groups/create"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 hover:-translate-y-0.5 h-10 px-6 py-2 flex-shrink-0"
          >
            + Create Group
          </Link>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-wrap gap-3 items-end backdrop-blur">
        {/* Text Search */}
        <div className="flex-1 min-w-[160px]">
          <label className="block text-xs text-slate-400 mb-1.5 font-medium">Search</label>
          <input
            type="text"
            placeholder="Name, subject, tags..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className={inputCls + " w-full"}
          />
        </div>

        {/* Subject Filter */}
        <div className="flex-1 min-w-[140px]">
          <label className="block text-xs text-slate-400 mb-1.5 font-medium">Subject</label>
          <input
            type="text"
            placeholder="e.g. Mathematics"
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className={inputCls + " w-full"}
          />
        </div>

        {/* Date Filter */}
        <div className="flex-1 min-w-[160px]">
          <label className="block text-xs text-slate-400 mb-1.5 font-medium flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Sessions on date
          </label>
            <input
            type="date"
            value={dateFilter}
            min={new Date().toISOString().split("T")[0]}
            onChange={(e) => setDateFilter(e.target.value)}
            className={inputCls + " w-full"}
          />
        </div>

        {/* Quick: Today / This Week */}
        <div className="flex flex-col gap-1.5">
          <label className="block text-xs text-slate-400 font-medium">Quick</label>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const today = new Date().toISOString().split("T")[0];
                setDateFilter(today);
              }}
              className={`text-xs px-3 py-2 rounded-lg border transition-all font-medium ${
                dateFilter === new Date().toISOString().split("T")[0]
                  ? "bg-indigo-600 border-indigo-500 text-white"
                  : "bg-slate-800 border-slate-700 text-slate-400 hover:border-indigo-500 hover:text-indigo-400"
              }`}
            >
              Today
            </button>
          </div>
        </div>

        {/* Clear */}
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="text-xs px-3 py-2 rounded-lg border border-red-800/60 bg-red-900/20 text-red-400 hover:bg-red-900/40 transition-colors font-medium self-end"
          >
            Clear
          </button>
        )}
      </div>

      {/* Active filter chips */}
      {hasFilters && (
        <div className="flex flex-wrap gap-2 -mt-2">
          {dateFilter && (
            <span className="inline-flex items-center gap-1.5 text-xs bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 px-3 py-1 rounded-full">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Sessions on {new Date(dateFilter + "T00:00:00").toLocaleDateString([], { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
              <button onClick={() => setDateFilter("")} className="ml-1 hover:text-white">✕</button>
            </span>
          )}
          {subjectFilter && (
            <span className="inline-flex items-center gap-1.5 text-xs bg-purple-500/10 border border-purple-500/30 text-purple-400 px-3 py-1 rounded-full">
              Subject: {subjectFilter}
              <button onClick={() => setSubjectFilter("")} className="ml-1 hover:text-white">✕</button>
            </span>
          )}
          {searchText && (
            <span className="inline-flex items-center gap-1.5 text-xs bg-slate-700/50 border border-slate-600 text-slate-300 px-3 py-1 rounded-full">
              Search: &quot;{searchText}&quot;
              <button onClick={() => setSearchText("")} className="ml-1 hover:text-white">✕</button>
            </span>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 rounded-lg bg-red-900/50 border border-red-800 text-red-200 text-sm">
          {error}
        </div>
      )}

      {/* Results count */}
      {!loading && !error && (
        <p className="text-xs text-slate-500">
          {groups.length === 0 ? "No groups found" : `${groups.length} group${groups.length !== 1 ? "s" : ""} found`}
          {hasFilters && " matching your filters"}
        </p>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-60 rounded-xl bg-slate-800/50 animate-pulse border border-slate-700"></div>
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-slate-700 rounded-xl bg-slate-900/50">
          <div className="text-4xl mb-4">🔍</div>
          <p className="text-slate-300 font-medium mb-2">No groups found</p>
          <p className="text-slate-500 text-sm mb-6">
            {hasFilters
              ? "Try adjusting your filters to see more groups."
              : "No public groups yet."}
          </p>
          {hasFilters && (
            <button onClick={clearFilters} className="text-indigo-400 hover:text-indigo-300 text-sm font-medium mr-4">
              Clear filters
            </button>
          )}
          {session && (
            <Link href="/groups/create" className="text-indigo-400 hover:text-indigo-300 text-sm font-medium">
              Create a group &rarr;
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => {
            const role = getRole(group);
            const isActioning = actionLoading[group._id];
            const isFull = group.members?.length >= group.maxMembers;
            const nextSession = getNextSession(group);

            return (
              <div
                key={group._id}
                className="flex flex-col rounded-xl border border-slate-800 bg-slate-900/80 backdrop-blur transform hover:-translate-y-1 transition-all overflow-hidden shadow-lg hover:shadow-indigo-500/10 hover:border-slate-700"
              >
                <div className="p-5 flex-grow space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-semibold tracking-tight text-slate-100 leading-tight">
                      {group.name}
                    </h3>
                    <span className="inline-flex items-center rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-indigo-300 whitespace-nowrap flex-shrink-0 border border-slate-700">
                      {group.subject}
                    </span>
                  </div>

                  <p className="text-sm text-slate-400 line-clamp-2">
                    {group.description || "No description provided."}
                  </p>

                  {/* Session Status Badge */}
                  {checkIsLive(group) ? (
                    <div className="inline-flex items-center gap-1.5 text-[10px] bg-green-500 text-white px-2.5 py-1 rounded-lg font-bold animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.3)]">
                      <span className="w-1.5 h-1.5 bg-white rounded-full" />
                      LIVE NOW
                    </div>
                  ) : nextSession ? (
                    <div className="inline-flex items-center gap-1.5 text-xs bg-green-900/30 border border-green-700/40 text-green-400 px-2.5 py-1 rounded-lg">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Next:{" "}
                      {nextSession.toLocaleDateString([], {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  ) : group.sessions?.length > 0 ? (
                    <div className="inline-flex items-center gap-1.5 text-xs bg-slate-800 border border-slate-700 text-slate-500 px-2.5 py-1 rounded-lg">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      No upcoming sessions
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 text-xs bg-slate-800/50 border border-slate-700/50 text-slate-600 px-2.5 py-1 rounded-lg">
                      No sessions scheduled
                    </div>
                  )}

                  {/* Tags */}
                  {group.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {group.tags.slice(0, 3).map((t) => (
                        <span key={t} className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-500 border border-slate-700/50">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <div className="w-5 h-5 rounded-full bg-indigo-900/50 border border-indigo-800/50 flex items-center justify-center text-indigo-400 font-bold text-[9px]">
                      {group.owner?.name?.charAt(0) || "O"}
                    </div>
                    <span>by {group.owner?.name || "Unknown"}</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between gap-2">
                  <div className="text-xs text-slate-500">
                    <span className="text-slate-300 font-semibold">{group.members?.length || 0}</span>
                    /{group.maxMembers} members
                  </div>

                  <div className="flex items-center gap-2">
                    {role === "owner" ? (
                      <span className="text-xs text-indigo-400 font-medium px-2 py-1 bg-indigo-500/10 rounded-md border border-indigo-500/20">
                        Owner
                      </span>
                    ) : role === "member" ? (
                      <button
                        onClick={(e) => { e.preventDefault(); handleLeave(group._id); }}
                        disabled={isActioning === "leaving"}
                        className="text-xs font-medium px-3 py-1.5 rounded-lg bg-red-900/40 text-red-300 border border-red-800/50 hover:bg-red-800/60 transition-colors disabled:opacity-50"
                      >
                        {isActioning === "leaving" ? "Leaving..." : "Leave"}
                      </button>
                    ) : isFull ? (
                      <span className="text-xs text-slate-500 font-medium">Full</span>
                    ) : (
                      <button
                        onClick={(e) => { e.preventDefault(); handleJoin(group._id); }}
                        disabled={isActioning === "joining"}
                        className="text-xs font-medium px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-all shadow-sm hover:shadow-indigo-500/30 disabled:opacity-50"
                      >
                        {isActioning === "joining" ? "Joining..." : "Join"}
                      </button>
                    )}

                    <Link
                      href={`/groups/${group._id}`}
                      className="text-xs font-medium text-slate-400 hover:text-indigo-400 transition-colors"
                    >
                      Details →
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
