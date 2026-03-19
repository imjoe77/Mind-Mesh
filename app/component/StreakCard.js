"use client";

import { useState, useEffect, useCallback } from "react";

const QUEST_ICONS = {
  quiz: "🧠",
  flashcard: "📇",
  join_session: "👥",
  read: "📖",
};

function GraceTimer({ expiresAt }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const calc = () => {
      const diff = new Date(expiresAt) - new Date();
      if (diff <= 0) { setTimeLeft("Expired"); return; }
      const hrs = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      setTimeLeft(`${hrs}h ${mins}m`);
    };
    calc();
    const t = setInterval(calc, 60000);
    return () => clearInterval(t);
  }, [expiresAt]);

  return (
    <span className="font-bold text-amber-600">{timeLeft}</span>
  );
}

export default function StreakCard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completingQuest, setCompletingQuest] = useState(null);
  const [restoredAnim, setRestoredAnim] = useState(false);

  const checkin = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/streak/checkin", { method: "POST" });
      const json = await res.json();
      setData(json);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { checkin(); }, [checkin]);

  const completeQuest = async (questId) => {
    setCompletingQuest(questId);
    try {
      const res = await fetch("/api/streak/complete-quest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questId }),
      });
      const result = await res.json();
      if (result.success) {
        // Update local state directly — don't call checkin() which returns stale 'already_checked_in' data
        setData(prev => {
          const updatedQuests = prev.quests.map(q =>
            q.id === questId ? { ...q, completed: true } : q
          );
          const allDone = updatedQuests.every(q => q.completed);
          if (result.streakRestored) {
            setRestoredAnim(true);
            setTimeout(() => setRestoredAnim(false), 3500);
          }
          return {
            ...prev,
            quests: updatedQuests,
            totalXp: result.totalXp ?? prev.totalXp,
            graceActive: result.streakRestored ? false : prev.graceActive,
            streak: result.streakRestored ? result.newStreak : prev.streak,
          };
        });
      }
    } catch (e) { console.error(e); }
    finally { setCompletingQuest(null); }
  };

  const simulate = async (scenario) => {
    try {
      const res = await fetch("/api/streak/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario }),
      });
      const json = await res.json();
      if (json.success) {
        // Use the response directly — don't call checkin() which may return 'already_checked_in'
        setData(json);
      }
    } catch (e) { console.error(e); }
  };

  if (loading) {
    return (
      <div className="bg-white border border-zinc-100 rounded-2xl p-6 animate-pulse">
        <div className="h-4 bg-zinc-100 rounded w-1/2 mb-4" />
        <div className="h-12 bg-zinc-50 rounded w-full" />
      </div>
    );
  }

  if (!data) return null;

  const streakCount = data.streak || 0;
  const isGrace = data.graceActive;
  const quests = data.quests || [];
  const completedQuests = quests.filter(q => q.completed).length;
  const totalQuests = quests.length;
  const questProgress = totalQuests > 0 ? (completedQuests / totalQuests) * 100 : 0;

  // Compute emoji milestone
  const flameEmoji = streakCount >= 30 ? "🔥🔥🔥" : streakCount >= 14 ? "🔥🔥" : "🔥";

  // Build 7-day calendar dots
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 1);
  });

  return (
    <div className={`bg-white border rounded-2xl overflow-hidden transition-all duration-700 relative ${
      restoredAnim ? "border-emerald-500 shadow-xl shadow-emerald-500/15" : 
      isGrace ? "border-amber-200 shadow-md shadow-amber-500/5" : "border-zinc-200/80 shadow-sm hover:shadow-lg hover:shadow-indigo-500/5"
    }`}>
      {/* Gloss Effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />

      {/* Header Section */}
      <div className={`px-6 pt-6 pb-4 relative ${isGrace ? "bg-amber-50/30" : ""}`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-inner relative group ${
              isGrace ? "bg-amber-100" : "bg-indigo-50"
            }`}>
              <div className="absolute inset-0 bg-white/40 blur-xl rounded-full scale-0 group-hover:scale-150 transition duration-700" />
              <span className="relative z-10 drop-shadow-sm group-hover:scale-110 transition duration-500">{flameEmoji}</span>
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-zinc-800 tracking-tight leading-none">Daily Spark</h3>
              <p className="text-[11px] text-zinc-400 font-medium uppercase tracking-wide mt-1">Consistent Mastery</p>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-4xl font-extrabold leading-none tracking-tighter ${
              isGrace ? "text-amber-500" : "text-indigo-600"
            }`}>{streakCount}</div>
            <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide mt-1">Day Streak</div>
          </div>
        </div>

        {/* 7-day visualizer */}
        <div className="grid grid-cols-7 gap-2 mt-6">
          {last7.map((day, i) => {
            const active = i < streakCount && streakCount > 0;
            const isToday = i === 6;
            return (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <div className={`w-full h-1.5 rounded-full transition-all duration-500 ${
                  active ? (isGrace && isToday ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.4)]" : "bg-indigo-500 shadow-[0_0_8px_rgba(79,70,229,0.2)]") : "bg-zinc-100"
                }`} />
                <span className={`text-[10px] font-semibold ${active ? 'text-zinc-500' : 'text-zinc-300'}`}>{day}</span>
              </div>
            );
          })}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2.5 mt-6">
          {[
            { label: 'Best', value: data.best || 0, icon: '🏆' },
            { label: 'XP', value: data.totalXp || 0, icon: '⚡' },
            { label: 'Rank', value: streakCount >= 7 ? "⭐" : streakCount >= 3 ? "🌱" : "🌟", icon: '🔰' }
          ].map((stat, i) => (
            <div key={i} className="bg-zinc-50/60 border border-zinc-100/50 rounded-xl px-3 py-2.5 text-center group hover:bg-white transition-colors duration-300">
              <div className="text-xs mb-0.5 opacity-40">{stat.icon}</div>
              <div className="text-base font-bold text-zinc-800 leading-none">{stat.value}</div>
              <div className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wide mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quests / Action Zone */}
      <div className="px-6 pb-6 pt-2">
        {isGrace ? (
          <div className="space-y-3">
            <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 text-3xl opacity-10 group-hover:rotate-12 transition-transform">⚠️</div>
              <p className="text-[13px] font-bold text-amber-800 tracking-tight">At Risk!</p>
              <p className="text-[12px] text-amber-700/80 mt-1 font-medium">
                You're losing momentum. Complete these quests within <GraceTimer expiresAt={data.graceExpiresAt} />
              </p>

              {totalQuests > 0 && (
                <div className="mt-3">
                  <div className="w-full bg-amber-100/50 rounded-full h-1.5">
                    <div
                      className="bg-amber-500 h-1.5 rounded-full shadow-[0_0_6px_rgba(245,158,11,0.3)] transition-all duration-1000"
                      style={{ width: `${questProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              {quests.map((q) => (
                <div
                  key={q.id}
                  className={`group flex items-center gap-3.5 rounded-xl border p-3.5 transition-all duration-300 ${
                    q.completed
                      ? "bg-emerald-50/50 border-emerald-100"
                      : "bg-white border-zinc-100 hover:border-indigo-200 hover:shadow-md"
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-colors ${q.completed ? 'bg-emerald-100' : 'bg-zinc-50 group-hover:bg-indigo-50'}`}>
                    {QUEST_ICONS[q.type] || "📋"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[13px] font-semibold truncate ${q.completed ? "text-emerald-700 line-through opacity-50" : "text-zinc-800"}`}>
                      {q.title}
                    </p>
                    <p className="text-[11px] text-zinc-400 font-medium truncate mt-0.5">{q.description}</p>
                  </div>
                  <div className="flex-shrink-0">
                    {q.completed ? (
                      <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center shadow-md shadow-emerald-500/15">
                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    ) : (
                      <button
                        onClick={() => completeQuest(q.id)}
                        disabled={completingQuest === q.id}
                        className="h-7 px-3.5 text-[11px] font-bold bg-zinc-800 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50 transition-all active:scale-95"
                      >
                        {completingQuest === q.id ? "•••" : "GO"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-indigo-50/40 border border-indigo-100/50 rounded-xl p-4 flex items-center gap-3.5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-100/20 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-indigo-200/30 transition duration-700" />
            <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-lg shadow-sm relative z-10">💡</div>
            <p className="text-[13px] text-indigo-900/70 font-medium leading-relaxed relative z-10 pr-4">
              {streakCount === 0
                ? "Commit to your goals. log in tomorrow to start your first streak."
                : streakCount < 7
                ? "Building habits takes time. You're doing better than most!"
                : "Exceptional consistency. Your productivity is peaking."}
            </p>
          </div>
        )}
      </div>

      {/* Restored Modal/Banner */}
      {restoredAnim && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-emerald-500/10 backdrop-blur-sm animate-in fade-in duration-500">
           <div className="bg-emerald-500 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-2xl animate-bounce">
              🔥 STREAK RESTORED!
           </div>
        </div>
      )}

      {/* Simulation Toggle */}
      <div className="border-t border-zinc-50 px-6 py-3 flex justify-between items-center opacity-25 hover:opacity-100 transition-opacity">
        <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide">Lab Controls</span>
        <div className="flex gap-2">
          <button onClick={() => simulate("missed_day")} className="text-[10px] font-medium px-2.5 py-1 rounded-md bg-zinc-100 hover:bg-amber-100 transition">Miss</button>
          <button onClick={() => simulate("reset")} className="text-[10px] font-medium px-2.5 py-1 rounded-md bg-zinc-100 hover:bg-rose-100 transition">Reset</button>
        </div>
      </div>
    </div>
  );
}
