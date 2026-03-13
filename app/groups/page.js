"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function GroupsPage() {
  const { data: session } = useSession();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const res = await fetch("/api/groups");
      if (!res.ok) throw new Error("Failed to fetch groups");
      const data = await res.json();
      setGroups(data.groups || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Study Groups
          </h1>
          <p className="text-slate-400 mt-2">
            Join a study group with peers, discuss topics, and align on a schedule together.
          </p>
        </div>
        {session && (
          <Link
            href="/groups/create"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-indigo-600 text-white shadow hover:bg-indigo-500 h-10 px-6 py-2"
          >
            Create Group
          </Link>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-900/50 border border-red-800 text-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 rounded-xl bg-slate-800/50 animate-pulse border border-slate-700"></div>
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-slate-700 rounded-xl bg-slate-900/50">
          <p className="text-slate-400">No public groups found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => (
            <div key={group._id} className="flex flex-col rounded-xl border border-slate-800 bg-slate-900/80 backdrop-blur transform hover:-translate-y-1 transition-all overflow-hidden shadow-lg hover:shadow-indigo-500/10">
              <div className="p-6 flex-grow space-y-3">
                <div className="flex items-start justify-between">
                  <h3 className="text-xl font-semibold tracking-tight text-slate-100">{group.name}</h3>
                  <span className="inline-flex items-center rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-indigo-300">
                    {group.subject}
                  </span>
                </div>
                <p className="text-sm text-slate-400 line-clamp-2">{group.description || "No description provided."}</p>
                <div className="flex items-center gap-2 pt-2 text-xs text-slate-500">
                  <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center">
                    {group.owner?.name?.charAt(0) || "O"}
                  </div>
                  <span>Hosted by {group.owner?.name || "Unknown"}</span>
                </div>
              </div>
              <div className="p-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between">
                <div className="text-xs text-slate-400">
                  {group.members?.length || 0} / {group.maxMembers} members
                </div>
                <Link
                  href={`/groups/${group._id}`}
                  className="text-sm font-medium text-indigo-400 hover:text-indigo-300"
                >
                  View Details &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
