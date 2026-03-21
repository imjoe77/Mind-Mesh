"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import {
  User, BookOpen, Upload, Zap, Users, Flame,
  Edit2, Check, X, ChevronRight, Plus, Trash2,
  Trophy, Target, Clock, TrendingUp, Award,
  GraduationCap, Phone, Camera, AlertCircle,
} from "lucide-react";

/* ══════════════════════════════════════════════════════════
   GRADING SYSTEM
   S:90+ A:80-90 B:70-80 C:60-70 D:50-60 F:<50 X:Fail NE:Not Eligible
══════════════════════════════════════════════════════════ */
function getGrade(score) {
  if (score === null || score === undefined || score === "") return "NE";
  const n = Number(score);
  if (isNaN(n)) return "NE";
  if (n >= 90) return "S";
  if (n >= 80) return "A";
  if (n >= 70) return "B";
  if (n >= 60) return "C";
  if (n >= 50) return "D";
  return "F";
}

const GRADE_META = {
  S:  { color: "text-violet-600", bg: "bg-violet-50 border-violet-200",   bar: "bg-violet-500", label: "Outstanding" },
  A:  { color: "text-sky-600",    bg: "bg-sky-50 border-sky-200",         bar: "bg-sky-500",     label: "Excellent"   },
  B:  { color: "text-emerald-600",bg: "bg-emerald-50 border-emerald-200", bar: "bg-emerald-500", label: "Good"        },
  C:  { color: "text-amber-600",  bg: "bg-amber-50 border-amber-200",     bar: "bg-amber-500",   label: "Average"     },
  D:  { color: "text-orange-600", bg: "bg-orange-50 border-orange-200",   bar: "bg-orange-500",  label: "Below Avg"   },
  F:  { color: "text-red-600",    bg: "bg-red-50 border-red-200",         bar: "bg-red-500",     label: "Fail"        },
  X:  { color: "text-red-700",    bg: "bg-red-100 border-red-300",        bar: "bg-red-600",     label: "Detained"    },
  NE: { color: "text-gray-500",   bg: "bg-[#f5f6f8] border-gray-200",       bar: "bg-gray-300",    label: "Not Eligible"},
};

function GradeBadge({ grade }) {
  const m = GRADE_META[grade] || GRADE_META.NE;
  return (
    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-black border ${m.bg} ${m.color}`}>
      {grade}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════
   EDITABLE FIELD
══════════════════════════════════════════════════════════ */
function EditableField({ label, value, onSave, placeholder = "N/A", type = "text", options = null }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal]         = useState(value || "");

  const save = () => { onSave(val); setEditing(false); };
  const cancel = () => { setVal(value || ""); setEditing(false); };

  return (
    <div className="space-y-1">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
      {editing ? (
        <div className="flex items-center gap-2">
          {options ? (
            <select value={val} onChange={e => setVal(e.target.value)}
              className="flex-1 text-sm border border-[#dde0e8] rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-sky-400 bg-white text-gray-800">
              <option value="">Select...</option>
              {options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          ) : (
            <input type={type} value={val} onChange={e => setVal(e.target.value)}
              placeholder={placeholder}
              className="flex-1 text-sm border border-[#dde0e8] rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-sky-400 bg-white text-gray-800"
              onKeyDown={e => { if (e.key === "Enter") save(); if (e.key === "Escape") cancel(); }}
              autoFocus />
          )}
          <button onClick={save} className="w-7 h-7 flex items-center justify-center rounded-lg bg-emerald-500 text-white hover:bg-emerald-400 transition-colors">
            <Check style={{ width: 12, height: 12 }} />
          </button>
          <button onClick={cancel} className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#eff0f3] text-gray-500 hover:bg-gray-200 transition-colors">
            <X style={{ width: 12, height: 12 }} />
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between group">
          <p className={`text-sm font-semibold ${value ? "text-gray-800" : "text-gray-400 italic"}`}>
            {value || placeholder}
          </p>
          <button onClick={() => setEditing(true)}
            className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded-md text-gray-400 hover:text-sky-500 hover:bg-sky-50 transition-all">
            <Edit2 style={{ width: 11, height: 11 }} />
          </button>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PROFILE CARD
══════════════════════════════════════════════════════════ */
function ProfileCard({ user, profile, onUpdate }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const save = async (field, value) => {
    setSaving(true);
    try {
      await fetch("/api/users/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      onUpdate({ ...profile, [field]: value });
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const SEMESTER_OPTIONS = ["1st","2nd","3rd","4th","5th","6th","7th","8th"];
  const BRANCH_OPTIONS   = [
    "Computer Science","Information Technology","Electronics","Electrical",
    "Mechanical","Civil","Chemical","BCA","MCA","MBA",
  ];
  const YEAR_OPTIONS = ["1st Year","2nd Year","3rd Year","4th Year"];

  return (
    <div className="bg-[#fdfdfe] rounded-2xl border border-[#e2e5eb] shadow-[0_1px_4px_rgba(0,0,0,0.07)] overflow-hidden">
      {/* cover */}
      <div className="h-20 bg-gradient-to-br from-slate-700 via-slate-800 to-indigo-900 relative">
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`, backgroundSize: "18px 18px" }} />
      </div>

      <div className="px-5 pb-5">
        {/* avatar */}
        <div className="flex items-end justify-between -mt-8 mb-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl border-4 border-white shadow-md overflow-hidden bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center">
              {user?.image
                ? <Image src={user.image} alt="avatar" fill className="object-cover" />
                : <span className="text-white text-xl font-black">{user?.name?.charAt(0) || "U"}</span>}
            </div>
          </div>
          <button
            onClick={() => router.push("/profile")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 border border-sky-100 text-sky-600 text-xs font-bold hover:bg-sky-100 transition-colors">
            <GraduationCap style={{ width: 12, height: 12 }} />
            View Profile
            <ChevronRight style={{ width: 11, height: 11 }} />
          </button>
        </div>

        {/* name */}
        <div className="mb-4">
          <h2 className="text-base font-black text-gray-900">{user?.name || "Student"}</h2>
          <p className="text-xs text-gray-400">{user?.email}</p>
        </div>

        <div className="space-y-3 border-t border-[#eeeff2] pt-4">
          <EditableField label="Branch / Programme" value={profile?.branch}
            onSave={v => save("branch", v)} placeholder="N/A" options={BRANCH_OPTIONS} />
          <EditableField label="Semester" value={profile?.semester}
            onSave={v => save("semester", v)} placeholder="N/A" options={SEMESTER_OPTIONS} />
          <EditableField label="Year" value={profile?.year}
            onSave={v => save("year", v)} placeholder="N/A" options={YEAR_OPTIONS} />
          <EditableField label="Roll Number" value={profile?.rollNumber}
            onSave={v => save("rollNumber", v)} placeholder="N/A" />
          <EditableField label="Institution" value={profile?.institution}
            onSave={v => save("institution", v)} placeholder="N/A" />
        </div>

        {saving && <p className="text-[10px] text-sky-500 mt-2 text-center">Saving...</p>}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MARKS UPLOADER + INTELLIGENCE EXTRACTION
   Calls /api/users/analyze-result with base64Image.
   AI returns { metrics: { subjects:[{name,percent,color}], gpa, semester } }
   We map percent → your grading scale (S/A/B/C/D/F/X/NE)
══════════════════════════════════════════════════════════ */

/* Convert a File to base64 data URL */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result); // "data:image/jpeg;base64,..."
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function MarksCard({ onExtracted }) {
  const [uploading, setUploading] = useState(false);
  const [metrics,   setMetrics]   = useState(null); // full metrics from API
  const [error,     setError]     = useState("");
  const [dragging,  setDragging]  = useState(false);
  const [fallback,  setFallback]  = useState(false);
  const fileRef = useRef(null);

  /* Load saved metrics on mount */
  useEffect(() => {
    fetch("/api/users/profile")
      .then(r => r.json())
      .then(d => {
        if (d.user?.academicMetrics?.subjects?.length) {
          setMetrics(d.user.academicMetrics);
        }
      })
      .catch(() => {});
  }, []);

  const handleFile = async (file) => {
    if (!file) return;
    // Only images — your API endpoint uses vision model
    const allowed = ["image/jpeg","image/png","image/jpg","image/webp"];
    if (!allowed.includes(file.type)) {
      setError("Please upload a JPG or PNG image of your marks card.");
      return;
    }
    setUploading(true); setError(""); setFallback(false);

    try {
      const base64Image = await fileToBase64(file);

      const res  = await fetch("/api/users/analyze-result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64Image }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Analysis failed");

      if (data.metrics) {
        setMetrics(data.metrics);
        setFallback(!!data.fallback || !!data.timedOut);
        onExtracted && onExtracted(data.metrics);
      }
    } catch (e) { setError(e.message); }
    finally { setUploading(false); }
  };

  const onDrop = (e) => {
    e.preventDefault(); setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  /* ── Results view ── */
  if (metrics?.subjects?.length) {
    const subjects = metrics.subjects; // [{name, percent, color}]
    const avg      = Math.round(subjects.reduce((s, x) => s + (x.percent || 0), 0) / subjects.length);
    const overall  = getGrade(avg);
    const ogm      = GRADE_META[overall];

    return (
      <div className="bg-[#fdfdfe] rounded-2xl border border-[#e2e5eb] shadow-[0_1px_4px_rgba(0,0,0,0.07)] p-5 space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center">
              <Zap className="text-violet-500" style={{ width: 15, height: 15 }} />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900">Intelligence Extraction</h3>
              <p className="text-[10px] text-gray-400">
                {metrics.semester || "Current Semester"} · {subjects.length} subjects
                {metrics.gpa && metrics.gpa !== "N/A" ? ` · GPA ${metrics.gpa}` : ""}
                {fallback && " · ⚠ AI fallback data"}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-black ${ogm.color}`}>{overall}</div>
            <div className="text-[10px] text-gray-400">{avg}% avg</div>
          </div>
        </div>

        {/* Subject rows — AI returns {name, percent} we derive grade */}
        <div className="space-y-2.5">
          {subjects.map((sub, i) => {
            const grade = getGrade(sub.percent);
            const gm2   = GRADE_META[grade] || GRADE_META.NE;
            const pct   = Math.min(sub.percent || 0, 100);
            return (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-700 truncate max-w-[55%]">{sub.name}</span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-gray-400 tabular-nums">{pct}%</span>
                    <GradeBadge grade={grade} />
                  </div>
                </div>
                <div className="h-1.5 bg-[#eff0f3] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: sub.color || gm2.bar.replace("bg-","") }}
                  />
                </div>
                <p className={`text-[9px] font-semibold ${gm2.color}`}>{gm2.label}</p>
              </div>
            );
          })}
        </div>

        {/* Overall summary strip */}
        <div className={`rounded-xl border p-3 flex items-center justify-between ${ogm.bg}`}>
          <div>
            <p className={`text-xs font-black ${ogm.color}`}>Overall Performance</p>
            <p className="text-[10px] text-gray-500 mt-0.5">
              {subjects.filter(s => getGrade(s.percent) === "F" || getGrade(s.percent) === "X").length > 0
                ? `⚠ ${subjects.filter(s => ["F","X"].includes(getGrade(s.percent))).length} subject(s) need attention`
                : "✓ All subjects cleared"}
            </p>
          </div>
          <div className="text-right">
            <div className={`text-xl font-black ${ogm.color}`}>{overall}</div>
            <div className="text-[10px] text-gray-400">{ogm.label}</div>
          </div>
        </div>

        <button onClick={() => { setMetrics(null); setFallback(false); }}
          className="w-full py-2 rounded-xl border border-[#e2e5eb] text-gray-400 text-xs font-semibold hover:bg-[#f5f6f8] transition-colors flex items-center justify-center gap-1.5">
          <Upload style={{ width: 12, height: 12 }} /> Upload New Result
        </button>
      </div>
    );
  }

  /* ── Upload view ── */
  return (
    <div className="bg-[#fdfdfe] rounded-2xl border border-[#e2e5eb] shadow-[0_1px_4px_rgba(0,0,0,0.07)] p-5 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center">
          <Zap className="text-violet-500" style={{ width: 15, height: 15 }} />
        </div>
        <div>
          <h3 className="text-sm font-black text-gray-900">Intelligence Extraction</h3>
          <p className="text-[10px] text-gray-400">Drop your marks card — AI extracts subjects & grades</p>
        </div>
      </div>

      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
        className={`rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-all ${
          dragging ? "border-violet-400 bg-violet-50" : "border-[#dde0e8] hover:border-violet-300 hover:bg-violet-50/20"
        }`}
      >
        <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden"
          onChange={e => handleFile(e.target.files[0])} />
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-violet-400/30 border-t-violet-500 rounded-full animate-spin" />
            <p className="text-xs text-violet-500 font-semibold">AI analysing your marks card...</p>
            <p className="text-[10px] text-gray-400">This may take up to 25 seconds</p>
          </div>
        ) : (
          <>
            <Upload className="mx-auto text-gray-300 mb-2" style={{ width: 28, height: 28 }} />
            <p className="text-sm font-semibold text-gray-500">Drop marks card image here</p>
            <p className="text-xs text-gray-400 mt-0.5">JPG, PNG, WEBP · Vision AI extracts all subjects</p>
          </>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-red-500 text-xs">
          <AlertCircle style={{ width: 13, height: 13 }} />
          {error}
        </div>
      )}

      {/* Grading scale legend */}
      <div>
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2">Grading Scale</p>
        <div className="grid grid-cols-4 gap-1.5">
          {["S","A","B","C","D","F","X","NE"].map(g => {
            const gm = GRADE_META[g];
            return (
              <div key={g} className={`rounded-lg border px-2 py-1.5 text-center ${gm.bg}`}>
                <div className={`text-xs font-black ${gm.color}`}>{g}</div>
                <div className="text-[9px] text-gray-500 mt-0.5">{gm.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   STREAK CARD — full original logic preserved
   Grace period · Quests · Simulate Lab · Restored animation
══════════════════════════════════════════════════════════ */
const QUEST_ICONS = { quiz: "🧠", flashcard: "📇", join_session: "👥", read: "📖" };

function GraceTimer({ expiresAt }) {
  const [timeLeft, setTimeLeft] = useState("");
  useEffect(() => {
    const calc = () => {
      const diff = new Date(expiresAt) - new Date();
      if (diff <= 0) { setTimeLeft("Expired"); return; }
      const hrs  = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      setTimeLeft(`${hrs}h ${mins}m`);
    };
    calc();
    const t = setInterval(calc, 60000);
    return () => clearInterval(t);
  }, [expiresAt]);
  return <span className="font-bold text-amber-600">{timeLeft}</span>;
}

function StreakCard() {
  const [data,            setData]            = useState(null);
  const [loading,         setLoading]         = useState(true);
  const [completingQuest, setCompletingQuest] = useState(null);
  const [restoredAnim,    setRestoredAnim]    = useState(false);

  const checkin = useCallback(async () => {
    try {
      setLoading(true);
      const res  = await fetch("/api/streak/checkin", { method: "POST" });
      const json = await res.json();
      setData(json);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { checkin(); }, [checkin]);

  const completeQuest = async (questId) => {
    setCompletingQuest(questId);
    try {
      const res    = await fetch("/api/streak/complete-quest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questId }),
      });
      const result = await res.json();
      if (result.success) {
        setData(prev => {
          const updatedQuests = prev.quests.map(q =>
            q.id === questId ? { ...q, completed: true } : q
          );
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
      const res  = await fetch("/api/streak/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario }),
      });
      const json = await res.json();
      if (json.success) setData(json);
    } catch (e) { console.error(e); }
  };

  if (loading) return (
    <div className="bg-[#fdfdfe] border border-[#e2e5eb] rounded-2xl p-6 animate-pulse shadow-[0_1px_4px_rgba(0,0,0,0.07)]">
      <div className="h-4 bg-[#eff0f3] rounded w-1/2 mb-4" />
      <div className="h-12 bg-[#f5f6f8] rounded w-full" />
    </div>
  );

  if (!data) return null;

  const streakCount    = data.streak || 0;
  const isGrace        = data.graceActive;
  const quests         = data.quests || [];
  const completedQ     = quests.filter(q => q.completed).length;
  const totalQ         = quests.length;
  const questProgress  = totalQ > 0 ? (completedQ / totalQ) * 100 : 0;
  const flameEmoji     = streakCount >= 30 ? "🔥🔥🔥" : streakCount >= 14 ? "🔥🔥" : "🔥";

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 1);
  });

  return (
    <div className={`bg-[#fdfdfe] border rounded-2xl overflow-hidden transition-all duration-700 relative shadow-[0_1px_4px_rgba(0,0,0,0.07)] ${
      restoredAnim ? "border-emerald-400 shadow-xl shadow-emerald-500/15" :
      isGrace      ? "border-amber-200 shadow-md shadow-amber-500/5"      :
                     "border-[#e2e5eb] hover:shadow-lg hover:shadow-indigo-500/5"
    }`}>

      {/* Header */}
      <div className={`px-6 pt-6 pb-4 relative ${isGrace ? "bg-amber-50/40" : ""}`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-inner relative group ${
              isGrace ? "bg-amber-100" : "bg-indigo-50"
            }`}>
              <div className="absolute inset-0 bg-white/40 blur-xl rounded-full scale-0 group-hover:scale-150 transition duration-700" />
              <span className="relative z-10 drop-shadow-sm group-hover:scale-110 transition duration-500">{flameEmoji}</span>
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-gray-800 tracking-tight leading-none">Daily Spark</h3>
              <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide mt-1">Consistent Mastery</p>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-4xl font-extrabold leading-none tracking-tighter ${
              isGrace ? "text-amber-500" : "text-indigo-600"
            }`}>{streakCount}</div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mt-1">Day Streak</div>
          </div>
        </div>

        {/* 7-day bar */}
        <div className="grid grid-cols-7 gap-2 mt-6">
          {last7.map((day, i) => {
            const active  = i < streakCount && streakCount > 0;
            const isToday = i === 6;
            return (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <div className={`w-full h-1.5 rounded-full transition-all duration-500 ${
                  active
                    ? isGrace && isToday
                      ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.4)]"
                      : "bg-indigo-500 shadow-[0_0_8px_rgba(79,70,229,0.2)]"
                    : "bg-[#eff0f3]"
                }`} />
                <span className={`text-[10px] font-semibold ${active ? "text-gray-500" : "text-gray-300"}`}>{day}</span>
              </div>
            );
          })}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-2.5 mt-6">
          {[
            { label: "Best", value: data.best || 0,     icon: "🏆" },
            { label: "XP",   value: data.totalXp || 0,  icon: "⚡" },
            { label: "Rank", value: streakCount >= 7 ? "⭐" : streakCount >= 3 ? "🌱" : "🌟", icon: "🔰" },
          ].map((stat, i) => (
            <div key={i} className="bg-[#f5f6f8] border border-[#e2e5eb] rounded-xl px-3 py-2.5 text-center hover:bg-[#fdfdfe] transition-colors duration-200">
              <div className="text-xs mb-0.5 opacity-40">{stat.icon}</div>
              <div className="text-base font-bold text-gray-800 leading-none">{stat.value}</div>
              <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quest / Action zone */}
      <div className="px-6 pb-6 pt-2">
        {isGrace ? (
          <div className="space-y-3">
            {/* At-risk banner */}
            <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 text-3xl opacity-10 group-hover:rotate-12 transition-transform">⚠️</div>
              <p className="text-[13px] font-bold text-amber-800 tracking-tight">At Risk!</p>
              <p className="text-[12px] text-amber-700/80 mt-1 font-medium">
                Complete these quests within <GraceTimer expiresAt={data.graceExpiresAt} />
              </p>
              {totalQ > 0 && (
                <div className="mt-3">
                  <div className="w-full bg-amber-100/50 rounded-full h-1.5">
                    <div className="bg-amber-500 h-1.5 rounded-full shadow-[0_0_6px_rgba(245,158,11,0.3)] transition-all duration-1000"
                      style={{ width: `${questProgress}%` }} />
                  </div>
                </div>
              )}
            </div>

            {/* Quest list */}
            <div className="space-y-2">
              {quests.map(q => (
                <div key={q.id} className={`group flex items-center gap-3.5 rounded-xl border p-3.5 transition-all duration-300 ${
                  q.completed
                    ? "bg-emerald-50/50 border-emerald-100"
                    : "bg-[#fdfdfe] border-[#e2e5eb] hover:border-indigo-200 hover:shadow-md"
                }`}>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-colors ${
                    q.completed ? "bg-emerald-100" : "bg-[#f5f6f8] group-hover:bg-indigo-50"
                  }`}>
                    {QUEST_ICONS[q.type] || "📋"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[13px] font-semibold truncate ${
                      q.completed ? "text-emerald-700 line-through opacity-50" : "text-gray-800"
                    }`}>{q.title}</p>
                    <p className="text-[11px] text-gray-400 font-medium truncate mt-0.5">{q.description}</p>
                  </div>
                  <div className="flex-shrink-0">
                    {q.completed ? (
                      <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center shadow-md shadow-emerald-500/15">
                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    ) : (
                      <button onClick={() => completeQuest(q.id)} disabled={completingQuest === q.id}
                        className="h-7 px-3.5 text-[11px] font-bold bg-gray-800 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50 transition-all active:scale-95">
                        {completingQuest === q.id ? "•••" : "GO"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Normal state motivational tip */
          <div className="bg-indigo-50/60 border border-indigo-100/50 rounded-xl p-4 flex items-center gap-3.5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-100/20 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-indigo-200/30 transition duration-700" />
            <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-lg shadow-sm relative z-10">💡</div>
            <p className="text-[13px] text-indigo-900/70 font-medium leading-relaxed relative z-10 pr-4">
              {streakCount === 0
                ? "Commit to your goals. Log in tomorrow to start your first streak."
                : streakCount < 7
                ? "Building habits takes time. You're doing better than most!"
                : "Exceptional consistency. Your productivity is peaking."}
            </p>
          </div>
        )}
      </div>

      {/* Streak Restored overlay */}
      {restoredAnim && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-emerald-500/10 backdrop-blur-sm animate-in fade-in duration-500">
          <div className="bg-emerald-500 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-2xl animate-bounce">
            🔥 STREAK RESTORED!
          </div>
        </div>
      )}

      {/* Lab Controls — hidden until hover */}
      <div className="border-t border-[#eeeff2] px-6 py-3 flex justify-between items-center opacity-25 hover:opacity-100 transition-opacity">
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Lab Controls</span>
        <div className="flex gap-2">
          <button onClick={() => simulate("missed_day")}
            className="text-[10px] font-medium px-2.5 py-1 rounded-md bg-[#f5f6f8] hover:bg-amber-100 transition-colors">
            Miss
          </button>
          <button onClick={() => simulate("big_streak")}
            className="text-[10px] font-medium px-2.5 py-1 rounded-md bg-[#f5f6f8] hover:bg-indigo-100 transition-colors">
            30d
          </button>
          <button onClick={() => simulate("reset")}
            className="text-[10px] font-medium px-2.5 py-1 rounded-md bg-[#f5f6f8] hover:bg-rose-100 transition-colors">
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MY GROUPS
══════════════════════════════════════════════════════════ */
function MyGroupsCard({ groups }) {
  const router = useRouter();
  if (!groups?.length) return (
    <div className="bg-[#fdfdfe] rounded-2xl border border-[#e2e5eb] shadow-[0_1px_4px_rgba(0,0,0,0.07)] p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
          <Users className="text-indigo-500" style={{ width: 15, height: 15 }} />
        </div>
        <h3 className="text-sm font-black text-gray-900">My Groups</h3>
      </div>
      <div className="text-center py-6">
        <p className="text-gray-400 text-xs mb-3">No groups joined yet</p>
        <button onClick={() => router.push("/groups")}
          className="px-4 py-2 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-bold hover:bg-indigo-100 transition-colors">
          Browse Groups
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-[#fdfdfe] rounded-2xl border border-[#e2e5eb] shadow-[0_1px_4px_rgba(0,0,0,0.07)] p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
            <Users className="text-indigo-500" style={{ width: 15, height: 15 }} />
          </div>
          <h3 className="text-sm font-black text-gray-900">My Groups</h3>
        </div>
        <button onClick={() => router.push("/groups")}
          className="text-[10px] font-bold text-sky-500 hover:text-sky-600 transition-colors">
          View All
        </button>
      </div>
      <div className="space-y-2">
        {groups.slice(0, 4).map(g => (
          <button key={g._id} onClick={() => router.push(`/groups/${g._id}`)}
            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[#f5f6f8] transition-colors text-left group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
              {g.name?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-gray-800 truncate">{g.name}</p>
              <p className="text-[10px] text-gray-400">{g.subject}</p>
            </div>
            <ChevronRight className="text-gray-300 group-hover:text-gray-400 flex-shrink-0" style={{ width: 13, height: 13 }} />
          </button>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   SKILLS CARD
══════════════════════════════════════════════════════════ */
function SkillsCard({ profile, onUpdate }) {
  const [addingTeach, setAddingTeach] = useState(false);
  const [addingLearn, setAddingLearn] = useState(false);
  const [teachInput,  setTeachInput]  = useState("");
  const [learnInput,  setLearnInput]  = useState("");

  const teachSkills = profile?.skillsToTeach || [];
  const learnSkills = profile?.skillsToLearn || [];

  const addSkill = async (type, value) => {
    if (!value.trim()) return;
    const field = type === "teach" ? "skillsToTeach" : "skillsToLearn";
    const current = type === "teach" ? teachSkills : learnSkills;
    if (current.includes(value.trim())) return;
    const updated = [...current, value.trim()];
    await fetch("/api/users/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: updated }),
    });
    onUpdate({ ...profile, [field]: updated });
  };

  const removeSkill = async (type, skill) => {
    const field = type === "teach" ? "skillsToTeach" : "skillsToLearn";
    const current = type === "teach" ? teachSkills : learnSkills;
    const updated = current.filter(s => s !== skill);
    await fetch("/api/users/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: updated }),
    });
    onUpdate({ ...profile, [field]: updated });
  };

  const SkillSection = ({ type, skills, adding, setAdding, input, setInput }) => (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          {type === "teach" ? "Can Teach" : "Want to Learn"}
        </p>
        <button onClick={() => setAdding(true)}
          className="w-5 h-5 rounded-md bg-[#eff0f3] flex items-center justify-center text-gray-400 hover:bg-sky-50 hover:text-sky-500 transition-colors">
          <Plus style={{ width: 10, height: 10 }} />
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5 min-h-[28px]">
        {skills.map(s => (
          <span key={s} className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full font-medium border group ${
            type === "teach"
              ? "bg-emerald-50 border-emerald-100 text-emerald-700"
              : "bg-sky-50 border-sky-100 text-sky-700"
          }`}>
            {s}
            <button onClick={() => removeSkill(type, s)}
              className="opacity-0 group-hover:opacity-100 transition-opacity">
              <X style={{ width: 9, height: 9 }} />
            </button>
          </span>
        ))}
        {skills.length === 0 && !adding && (
          <span className="text-xs text-gray-400 italic">N/A</span>
        )}
      </div>
      {adding && (
        <div className="flex items-center gap-2 mt-2">
          <input value={input} onChange={e => setInput(e.target.value)}
            placeholder="Add skill..."
            className="flex-1 text-xs border border-[#dde0e8] rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-sky-400"
            onKeyDown={e => {
              if (e.key === "Enter") { addSkill(type, input); setInput(""); setAdding(false); }
              if (e.key === "Escape") { setInput(""); setAdding(false); }
            }}
            autoFocus />
          <button onClick={() => { addSkill(type, input); setInput(""); setAdding(false); }}
            className="px-3 py-1.5 rounded-lg bg-sky-500 text-white text-xs font-bold">Add</button>
          <button onClick={() => { setInput(""); setAdding(false); }}
            className="px-2 py-1.5 rounded-lg bg-[#eff0f3] text-gray-500 text-xs">Cancel</button>
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-[#fdfdfe] rounded-2xl border border-[#e2e5eb] shadow-[0_1px_4px_rgba(0,0,0,0.07)] p-5 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
          <BookOpen className="text-emerald-500" style={{ width: 15, height: 15 }} />
        </div>
        <h3 className="text-sm font-black text-gray-900">Skills</h3>
      </div>
      <SkillSection type="teach" skills={teachSkills} adding={addingTeach} setAdding={setAddingTeach} input={teachInput} setInput={setTeachInput} />
      <div className="h-px bg-[#f5f6f8]" />
      <SkillSection type="learn" skills={learnSkills} adding={addingLearn} setAdding={setAddingLearn} input={learnInput} setInput={setLearnInput} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PROGRESS CARD
══════════════════════════════════════════════════════════ */
function ProgressCard({ metrics }) {
  const stats = [
    { label: "Sessions Joined",  value: metrics?.sessionsJoined  ?? "—", icon: Clock,      color: "text-sky-500",    bg: "bg-sky-50 border-sky-100"    },
    { label: "Groups Active",    value: metrics?.groupsActive    ?? "—", icon: Users,      color: "text-indigo-500", bg: "bg-indigo-50 border-indigo-100" },
    { label: "Skills Listed",    value: metrics?.skillsCount     ?? "—", icon: Target,     color: "text-emerald-500",bg: "bg-emerald-50 border-emerald-100" },
    { label: "Connections",      value: metrics?.connections     ?? "—", icon: TrendingUp, color: "text-violet-500", bg: "bg-violet-50 border-violet-100" },
  ];

  return (
    <div className="bg-[#fdfdfe] rounded-2xl border border-[#e2e5eb] shadow-[0_1px_4px_rgba(0,0,0,0.07)] p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center">
          <TrendingUp className="text-sky-500" style={{ width: 15, height: 15 }} />
        </div>
        <h3 className="text-sm font-black text-gray-900">Your Progress</h3>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`rounded-xl border p-3 ${bg}`}>
            <Icon className={color} style={{ width: 16, height: 16 }} />
            <div className={`text-xl font-black mt-1 ${color}`}>{value}</div>
            <div className="text-[10px] text-gray-500 mt-0.5 leading-tight">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PHONE VERIFICATION
══════════════════════════════════════════════════════════ */
function PhoneCard({ profile, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [phone,   setPhone]   = useState(profile?.phone || "");
  const [saving,  setSaving]  = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await fetch("/api/users/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      onUpdate({ ...profile, phone });
      setEditing(false);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  if (profile?.phone && !editing) return (
    <div className="bg-[#fdfdfe] rounded-2xl border border-[#e2e5eb] shadow-[0_1px_4px_rgba(0,0,0,0.07)] p-4 flex items-center gap-3">
      <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
        <Phone className="text-emerald-500" style={{ width: 14, height: 14 }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Phone</p>
        <p className="text-sm font-bold text-gray-800">{profile.phone}</p>
      </div>
      <button onClick={() => setEditing(true)}
        className="text-gray-400 hover:text-sky-500 transition-colors">
        <Edit2 style={{ width: 13, height: 13 }} />
      </button>
    </div>
  );

  return (
    <div className="bg-[#fdfdfe] rounded-2xl border border-[#e2e5eb] shadow-[0_1px_4px_rgba(0,0,0,0.07)] p-4">
      <div className="flex items-center gap-2 mb-3">
        <Phone className="text-gray-400" style={{ width: 14, height: 14 }} />
        <p className="text-xs font-bold text-gray-600">Add Phone Number</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <input value={phone} onChange={e => setPhone(e.target.value)}
          placeholder="+91 XXXXX XXXXX" type="tel"
          className="flex-1 min-w-0 text-sm border border-[#dde0e8] rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-sky-400" />
        <button onClick={save} disabled={saving}
          className="flex-shrink-0 px-4 py-2 rounded-xl bg-sky-500 text-white text-xs font-bold disabled:opacity-50">
          {saving ? "..." : "Save"}
        </button>
        {editing && (
          <button onClick={() => setEditing(false)}
            className="flex-shrink-0 px-3 py-2 rounded-xl bg-[#eff0f3] text-gray-500 text-xs">
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   WELCOME BAR
══════════════════════════════════════════════════════════ */
function WelcomeBar({ user, profile }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="bg-[#fdfdfe] border-b border-[#e2e5eb] px-4 sm:px-6 py-4 shadow-sm">
      <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-base sm:text-lg font-black text-gray-900 truncate">
            {greeting}, {user?.name?.split(" ")[0] || "Student"} 👋
          </h1>
          <p className="text-xs text-gray-500 mt-0.5 truncate">
            {profile?.branch || "Branch not set"} · {profile?.semester || "Semester not set"} · {profile?.institution || "Institution not set"}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="w-9 h-9 rounded-xl overflow-hidden bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
            {user?.image
              ? <img src={user.image} alt="" className="w-full h-full object-cover" />
              : <span className="text-white text-sm font-black">{user?.name?.charAt(0)}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN DASHBOARD
══════════════════════════════════════════════════════════ */
export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [profile,  setProfile]  = useState(null);
  const [groups,   setGroups]   = useState([]);
  const [metrics,  setMetrics]  = useState(null);
  const [streak,   setStreak]   = useState(null);
  const [extracted,setExtracted]= useState(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/Login");
  }, [status, router]);

  useEffect(() => {
    if (!session?.user?.email) return;

    // 1. Instant recovery from local system
    const saved = localStorage.getItem(`user_profile_${session.user.email}`);
    if (saved) {
      try { setProfile(JSON.parse(saved)); } catch (e) {}
    }

    // 2. Fetch from cloud database
    fetch("/api/users/profile").then(r => r.json()).then(d => {
      if (d.user) {
        setProfile(prev => {
          const cloud = d.user;
          const local = prev || {};
          const merged = { ...local, ...cloud };
          // Merge: Only let cloud overwrite local if cloud actually has data
          ["branch", "semester", "year", "rollNumber", "institution", "bio"].forEach(f => {
            if (local[f] && !cloud[f]) merged[f] = local[f];
          });
          localStorage.setItem(`user_profile_${session.user.email}`, JSON.stringify(merged));
          return merged;
        });
      }
    });

    // fetch groups
    fetch("/api/groups?mine=true").then(r => r.json()).then(d => {
      setGroups(d.groups || []);
    });
  }, [session]);

  if (status === "loading" || !session) return (
    <div className="min-h-screen bg-[#eef0f4] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-sky-400/30 border-t-sky-500 rounded-full animate-spin" />
        <p className="text-xs text-gray-400 tracking-wide">Loading dashboard...</p>
      </div>
    </div>
  );

  const skillsCount = ((profile?.skillsToTeach || []).length + (profile?.skillsToLearn || []).length);

  return (
    <div className="min-h-screen bg-[#eef0f4] flex flex-col">
      <div className="h-1 bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500" />
      <WelcomeBar user={session.user} profile={profile} />

      <main className="flex-1 w-full max-w-[1600px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_280px] gap-5 p-5 lg:p-6">

          {/* ── LEFT: Profile ── */}
          <aside className="space-y-4">
            <ProfileCard
              user={session.user}
              profile={profile}
              onUpdate={setProfile}
            />
            <PhoneCard profile={profile} onUpdate={setProfile} />
            <SkillsCard
              profile={profile}
              onUpdate={p => {
                setProfile(p);
                setMetrics(m => ({ ...m, skillsCount: (p.skillsToTeach||[]).length + (p.skillsToLearn||[]).length }));
              }}
            />
          </aside>

          {/* ── MIDDLE: Primary content ── */}
          <section className="space-y-4">
            <MarksCard onExtracted={data => setExtracted(data)} />
            <ProgressCard metrics={{ ...metrics, skillsCount }} />
          </section>

          {/* ── RIGHT: Social & engagement ── */}
          <aside className="space-y-4">
            <StreakCard />
            <MyGroupsCard groups={groups} />
          </aside>

        </div>
      </main>
    </div>
  );
}
