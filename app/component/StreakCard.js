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
      <div className="bg-white border border-zinc-100 rounded-xl p-6 animate-pulse">
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
    <div className={`bg-white border rounded-xl overflow-hidden transition-all duration-500 ${
      restoredAnim ? "border-emerald-400 shadow-emerald-100 shadow-lg" : 
      isGrace ? "border-amber-200" : "border-zinc-100"
    }`}>

      {/* Header */}
      <div className={`px-5 pt-5 pb-3 ${isGrace ? "bg-amber-50/60" : ""}`}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xl ${
              isGrace ? "bg-amber-100" : "bg-indigo-50"
            }`}>
              {flameEmoji}
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900">Daily Streak</h3>
              <p className="text-[10px] text-zinc-400 uppercase tracking-widest">Peer Retention</p>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-3xl font-black leading-none ${
              isGrace ? "text-amber-500" : "text-indigo-600"
            }`}>{streakCount}</div>
            <div className="text-[10px] text-zinc-400">day{streakCount !== 1 ? "s" : ""}</div>
          </div>
        </div>

        {/* 7-day dot trail */}
        <div className="flex gap-1.5 mt-3">
          {last7.map((day, i) => {
            const active = i < streakCount && streakCount > 0;
            const isToday = i === 6;
            return (
              <div key={i} className="flex flex-col items-center gap-1 flex-1">
                <div className={`w-full h-2 rounded-full ${
                  active ? (isGrace && isToday ? "bg-amber-400" : "bg-indigo-500") : "bg-zinc-100"
                }`} />
                <span className="text-[9px] text-zinc-400">{day}</span>
              </div>
            );
          })}
        </div>

        {/* Stats row */}
        <div className="flex gap-3 mt-3">
          <div className="flex-1 bg-zinc-50 rounded-lg px-3 py-2 text-center">
            <div className="text-base font-bold text-zinc-800">{data.best || 0}</div>
            <div className="text-[9px] text-zinc-400 uppercase tracking-wider">Best</div>
          </div>
          <div className="flex-1 bg-zinc-50 rounded-lg px-3 py-2 text-center">
            <div className="text-base font-bold text-zinc-800">{data.totalXp || 0}</div>
            <div className="text-[9px] text-zinc-400 uppercase tracking-wider">XP</div>
          </div>
          <div className="flex-1 bg-zinc-50 rounded-lg px-3 py-2 text-center">
            <div className="text-base font-bold text-zinc-800">{streakCount >= 7 ? "⭐" : streakCount >= 3 ? "🌱" : "🌟"}</div>
            <div className="text-[9px] text-zinc-400 uppercase tracking-wider">Rank</div>
          </div>
        </div>
      </div>

      {/* Grace Period Banner + Quests */}
      {isGrace && (
        <div className="px-5 pb-5 pt-2">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-3">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="text-sm font-bold text-amber-800">Streak at Risk!</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  You missed a day. Complete all quests within{" "}
                  <GraceTimer expiresAt={data.graceExpiresAt} /> to restore your{" "}
                  <span className="font-bold">{data.streak}-day streak</span>.
                </p>
              </div>
            </div>

            {/* Quest progress bar */}
            {totalQuests > 0 && (
              <div className="mt-3">
                <div className="flex justify-between text-[10px] text-amber-600 mb-1">
                  <span>{completedQuests}/{totalQuests} quests done</span>
                  <span>{Math.round(questProgress)}%</span>
                </div>
                <div className="w-full bg-amber-100 rounded-full h-2">
                  <div
                    className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${questProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Quest list */}
          <div className="space-y-2">
            {quests.map((q) => (
              <div
                key={q.id}
                className={`flex items-center gap-3 rounded-lg border px-4 py-3 transition ${
                  q.completed
                    ? "bg-emerald-50 border-emerald-200"
                    : "bg-white border-zinc-100 hover:border-indigo-200"
                }`}
              >
                <span className="text-xl">{QUEST_ICONS[q.type] || "📋"}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold truncate ${q.completed ? "text-emerald-700 line-through" : "text-zinc-800"}`}>
                    {q.title}
                  </p>
                  <p className="text-[10px] text-zinc-400 truncate">{q.description}</p>
                </div>
                <div className="flex-shrink-0 flex items-center gap-2">
                  <span className="text-[10px] font-bold text-indigo-500">+{q.xp} XP</span>
                  {q.completed ? (
                    <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  ) : (
                    <button
                      onClick={() => completeQuest(q.id)}
                      disabled={completingQuest === q.id}
                      className="text-[10px] font-bold bg-indigo-600 text-white px-2 py-1 rounded-md hover:bg-indigo-700 disabled:opacity-50 transition"
                    >
                      {completingQuest === q.id ? "..." : "Done"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Restored animation */}
      {restoredAnim && (
        <div className="bg-emerald-500 text-white text-center py-2 text-sm font-bold animate-bounce">
          🎉 Streak Restored! Keep it up!
        </div>
      )}

      {/* Normal state footer */}
      {!isGrace && (
        <div className="px-5 pb-5 pt-1">
          <div className="bg-indigo-50 rounded-lg px-4 py-3 flex items-center gap-3">
            <span className="text-lg">💡</span>
            <p className="text-xs text-indigo-700">
              {streakCount === 0
                ? "Log in every day to build your streak!"
                : streakCount < 3
                ? "Great start! Come back tomorrow to grow your streak."
                : streakCount < 7
                ? "You're on a roll! Keep showing up every day."
                : streakCount < 14
                ? `${streakCount} days! You're becoming unstoppable 🚀`
                : `${streakCount} days — you're a MindMesh champion 🏆`}
            </p>
          </div>
        </div>
      )}

      {/* DEV Simulation Panel */}
      <div className="border-t border-dashed border-zinc-200 px-5 py-3">
        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-2">🛠 Demo Simulation</p>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => simulate("missed_day")}
            className="text-[10px] font-bold px-2 py-1 rounded-md bg-amber-100 text-amber-700 hover:bg-amber-200 transition"
          >⚠️ Simulate Missed Day</button>
          <button
            onClick={() => simulate("reset")}
            className="text-[10px] font-bold px-2 py-1 rounded-md bg-zinc-100 text-zinc-500 hover:bg-zinc-200 transition"
          >🔄 Reset</button>
        </div>
      </div>

    </div>
  );
}
