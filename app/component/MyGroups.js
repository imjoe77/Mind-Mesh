"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function MyGroups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyGroups = async () => {
      try {
        const res = await fetch("/api/groups?mine=true");
        if (res.ok) {
          const data = await res.json();
          setGroups(data.groups || []);
        }
      } catch (err) {
        console.error("Failed to fetch my groups", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMyGroups();
  }, []);

  return (
    <div className="bg-white border border-zinc-100 rounded-xl p-6 hover:shadow-lg transition flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-extrabold text-zinc-900 tracking-tight uppercase">My Study Groups</h3>
        <Link href="/groups/create" className="text-[10px] font-bold text-indigo-600 hover:text-indigo-500 bg-indigo-50 px-2 py-1 rounded-full transition">
          + New Group
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-zinc-50 animate-pulse border border-zinc-100"></div>
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="flex-grow flex flex-col items-center justify-center text-center space-y-3 py-6 bg-zinc-50/50 rounded-xl border border-dashed border-zinc-200">
          <p className="text-xs text-zinc-400">You haven't joined any groups yet.</p>
          <Link href="/groups" className="text-xs font-bold text-indigo-600 hover:underline">
            Explore Groups &rarr;
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.slice(0, 4).map((group) => (
            <Link 
              key={group._id} 
              href={`/groups/${group._id}`}
              className="block p-3 rounded-xl border border-zinc-100 bg-zinc-50/30 hover:bg-zinc-50 hover:border-indigo-200 transition-all group"
            >
              <div className="flex justify-between items-start">
                <p className="text-sm font-bold text-zinc-800 group-hover:text-indigo-600 transition-colors uppercase tracking-tight truncate mr-2">
                  {group.name}
                </p>
                <span className="text-[10px] font-bold text-zinc-400 bg-white px-1.5 py-0.5 rounded border border-zinc-100 whitespace-nowrap">
                  {group.subject}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex -space-x-2">
                  {group.members.slice(0, 3).map((m, i) => (
                    <div key={i} className="w-5 h-5 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-[8px] font-bold text-indigo-600 uppercase">
                      {m.name?.[0] || 'U'}
                    </div>
                  ))}
                </div>
                <span className="text-[10px] text-zinc-400 font-medium">
                  {group.members.length} members
                </span>
              </div>
            </Link>
          ))}
          {groups.length > 4 && (
             <Link href="/groups?mine=true" className="block text-center text-xs font-bold text-zinc-400 hover:text-indigo-600 transition pt-2">
                View all groups
             </Link>
          )}
        </div>
      )}
    </div>
  );
}
