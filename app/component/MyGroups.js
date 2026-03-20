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
    <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-500 flex flex-col h-full relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-24 h-24 bg-indigo-50/20 rounded-full blur-3xl -ml-12 -mt-12" />
      
      <div className="flex justify-between items-center mb-6 relative">
        <div>
          <h3 className="text-[14px] font-bold text-zinc-800 tracking-tight">Study Circles</h3>
          <p className="text-[11px] text-zinc-400 font-medium uppercase tracking-wide mt-0.5">Peer Collaboration</p>
        </div>
        <Link href="/groups/create" className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white flex items-center justify-center transition-all duration-300 shadow-sm active:scale-90">
          <span className="text-lg font-light">+</span>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-18 rounded-xl bg-zinc-50 animate-pulse border border-zinc-50"></div>
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="flex-grow flex flex-col items-center justify-center text-center space-y-3 py-6 bg-zinc-50/50 rounded-2xl border border-dashed border-zinc-200">
          <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center text-lg shadow-sm">🤝</div>
          <div className="px-6">
            <p className="text-[12px] text-zinc-500 font-medium">No active circles found. Collective learning is more effective.</p>
          </div>
          <Link href="/groups" className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 bg-white px-4 py-2 rounded-xl shadow-sm border border-zinc-100 transition-all uppercase tracking-wide">
            Explore Circles
          </Link>
        </div>
      ) : (
        <div className="space-y-3 relative">
          {groups.slice(0, 4).map((group) => (
            <Link 
              key={group._id} 
              href={`/groups/${group._id}`}
              className="group/item block p-3.5 rounded-xl border border-zinc-100 bg-zinc-50/50 hover:bg-white hover:border-indigo-100 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-300"
            >
              <div className="flex justify-between items-start mb-2.5">
                <p className="text-[13px] font-semibold text-zinc-800 group-hover/item:text-indigo-600 transition-colors tracking-tight truncate mr-2">
                  {group.name}
                </p>
                <span className="text-[10px] font-semibold text-indigo-500 bg-indigo-50/60 px-2 py-0.5 rounded-md tracking-wide">
                  {group.subject}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex -space-x-2">
                  {group.members.slice(0, 3).map((m, i) => (
                    <div key={i} className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 border-2 border-white flex items-center justify-center text-[9px] font-bold text-white uppercase shadow-sm">
                      {m.name?.[0] || 'U'}
                    </div>
                  ))}
                  {group.members.length > 3 && (
                    <div className="w-6 h-6 rounded-full bg-zinc-100 border-2 border-white flex items-center justify-center text-[8px] font-semibold text-zinc-400">
                      +{group.members.length - 3}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                   <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                   <span className="text-[11px] text-zinc-400 font-medium tracking-wide leading-none">
                     {group.members.length} Active
                   </span>
                </div>
              </div>
            </Link>
          ))}
          {groups.length > 4 && (
             <Link href="/groups?mine=true" className="flex items-center justify-center gap-2 group/all pt-3">
                <span className="text-[11px] font-semibold text-zinc-400 group-hover/all:text-indigo-600 uppercase tracking-wide transition-colors">Expand All Circles</span>
                <div className="w-4 h-[1px] bg-zinc-200 group-hover/all:bg-indigo-200 transition-colors" />
             </Link>
          )}
        </div>
      )}
    </div>
  );
}
