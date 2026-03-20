"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft, Upload, TrendingUp, Award, BookOpen,
  AlertTriangle, CheckCircle2, BarChart2, GraduationCap,
  Zap, Target, RefreshCw,
} from "lucide-react";

/* ══════════════════════════════════════════════════════════
   GRADING
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
  S:  { color: "text-violet-600", bg: "bg-violet-50",  border: "border-violet-200", bar: "bg-violet-500", label: "Outstanding", points: 10 },
  A:  { color: "text-sky-600",    bg: "bg-sky-50",     border: "border-sky-200",    bar: "bg-sky-500",    label: "Excellent",   points: 9  },
  B:  { color: "text-emerald-600",bg: "bg-emerald-50", border: "border-emerald-200",bar: "bg-emerald-500",label: "Good",        points: 8  },
  C:  { color: "text-amber-600",  bg: "bg-amber-50",   border: "border-amber-200",  bar: "bg-amber-500",  label: "Average",     points: 7  },
  D:  { color: "text-orange-600", bg: "bg-orange-50",  border: "border-orange-200", bar: "bg-orange-500", label: "Below Avg",   points: 6  },
  F:  { color: "text-red-600",    bg: "bg-red-50",     border: "border-red-200",    bar: "bg-red-500",    label: "Fail",        points: 0  },
  X:  { color: "text-red-700",    bg: "bg-red-100",    border: "border-red-300",    bar: "bg-red-600",    label: "Detained",    points: 0  },
  NE: { color: "text-gray-500",   bg: "bg-[#f5f6f8]",    border: "border-[#dde0e8]",   bar: "bg-gray-300",   label: "Not Eligible",points: 0  },
};

function GradeBadge({ grade, large = false }) {
  const m = GRADE_META[grade] || GRADE_META.NE;
  return (
    <span className={`inline-flex items-center justify-center font-black border rounded-xl ${m.bg} ${m.border} ${m.color} ${
      large ? "w-14 h-14 text-2xl" : "w-8 h-8 text-xs"
    }`}>
      {grade}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════
   CGPA CALCULATOR
══════════════════════════════════════════════════════════ */
function computeCGPA(subjects) {
  if (!subjects?.length) return null;
  const graded = subjects.filter(s => {
    const g = s.grade || getGrade(s.score);
    return g !== "NE" && g !== "X";
  });
  if (!graded.length) return null;
  const total = graded.reduce((sum, s) => {
    const g = s.grade || getGrade(s.score);
    return sum + (GRADE_META[g]?.points || 0);
  }, 0);
  return (total / graded.length).toFixed(2);
}

/* ══════════════════════════════════════════════════════════
   SUBJECT ROW
══════════════════════════════════════════════════════════ */
function SubjectRow({ subject, index }) {
  const grade = subject.grade || getGrade(subject.score);
  const gm    = GRADE_META[grade] || GRADE_META.NE;
  const pct   = Math.min(Number(subject.score) || 0, 100);

  return (
    <div className="flex items-center gap-4 py-3 border-b border-[#eeeff2] last:border-0 group hover:bg-[#f5f6f8]/50 -mx-2 px-2 rounded-xl transition-colors">
      <span className="text-xs text-gray-400 font-mono w-5 flex-shrink-0 text-right">{index + 1}</span>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">{subject.subject}</p>
        {subject.code && <p className="text-[10px] text-gray-400">{subject.code}</p>}
      </div>

      <div className="w-28 hidden sm:block">
        <div className="h-1.5 bg-[#eff0f3] rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-700 ${gm.bar}`}
            style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="text-sm font-bold text-gray-700 w-10 text-right flex-shrink-0">
        {subject.score ?? "—"}
      </div>

      <GradeBadge grade={grade} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   GRADE DISTRIBUTION CHART
══════════════════════════════════════════════════════════ */
function GradeDistribution({ subjects }) {
  const counts = {};
  subjects.forEach(s => {
    const g = s.grade || getGrade(s.score);
    counts[g] = (counts[g] || 0) + 1;
  });
  const grades = ["S","A","B","C","D","F","X","NE"].filter(g => counts[g]);

  return (
    <div className="space-y-2">
      {grades.map(g => {
        const gm  = GRADE_META[g];
        const pct = Math.round((counts[g] / subjects.length) * 100);
        return (
          <div key={g} className="flex items-center gap-3">
            <span className={`text-xs font-black w-6 text-right ${gm.color}`}>{g}</span>
            <div className="flex-1 h-5 bg-[#eff0f3] rounded-lg overflow-hidden">
              <div className={`h-full rounded-lg ${gm.bar} flex items-center justify-end pr-2 transition-all duration-700`}
                style={{ width: `${Math.max(pct, 8)}%` }}>
                <span className="text-[9px] font-black text-white">{counts[g]}</span>
              </div>
            </div>
            <span className="text-[10px] text-gray-400 w-8">{pct}%</span>
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   INSIGHTS
══════════════════════════════════════════════════════════ */
function InsightCard({ subjects }) {
  if (!subjects?.length) return null;

  const graded = subjects.filter(s => Number(s.score) > 0);
  const scores = graded.map(s => Number(s.score));
  const avg    = scores.length ? Math.round(scores.reduce((a,b) => a+b,0) / scores.length) : 0;
  const max    = scores.length ? Math.max(...scores) : 0;
  const min    = scores.length ? Math.min(...scores) : 0;
  const best   = graded.find(s => Number(s.score) === max);
  const worst  = graded.find(s => Number(s.score) === min);
  const failing = subjects.filter(s => { const g = s.grade || getGrade(s.score); return g === "F" || g === "X"; });
  const ne      = subjects.filter(s => { const g = s.grade || getGrade(s.score); return g === "NE"; });

  return (
    <div className="bg-[#fdfdfe] rounded-2xl border border-[#e2e5eb] shadow-[0_1px_4px_rgba(0,0,0,0.07)] p-6 space-y-5">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
          <Zap className="text-amber-500" style={{ width: 15, height: 15 }} />
        </div>
        <h3 className="text-sm font-black text-gray-900">Smart Insights</h3>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Average", value: `${avg}%`, grade: getGrade(avg), sub: "across all subjects" },
          { label: "Highest", value: `${max}%`, grade: getGrade(max), sub: best?.subject || "—" },
          { label: "Lowest",  value: `${min}%`, grade: getGrade(min), sub: worst?.subject || "—" },
        ].map(({ label, value, grade, sub }) => {
          const gm = GRADE_META[getGrade(Number(value))] || GRADE_META.NE;
          return (
            <div key={label} className={`rounded-xl border p-3 text-center ${gm.bg} ${gm.border}`}>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{label}</p>
              <p className={`text-xl font-black mt-1 ${gm.color}`}>{value}</p>
              <p className="text-[9px] text-gray-400 mt-0.5 truncate">{sub}</p>
            </div>
          );
        })}
      </div>

      {failing.length > 0 && (
        <div className="flex items-start gap-3 p-3 rounded-xl bg-red-50 border border-red-100">
          <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" style={{ width: 14, height: 14 }} />
          <div>
            <p className="text-xs font-bold text-red-700">Attention Required</p>
            <p className="text-[11px] text-red-500 mt-0.5">
              {failing.map(s => s.subject).join(", ")} — needs improvement
            </p>
          </div>
        </div>
      )}

      {ne.length > 0 && (
        <div className="flex items-start gap-3 p-3 rounded-xl bg-[#f5f6f8] border border-[#e2e5eb]">
          <AlertTriangle className="text-gray-400 flex-shrink-0 mt-0.5" style={{ width: 14, height: 14 }} />
          <div>
            <p className="text-xs font-bold text-gray-600">Not Eligible</p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {ne.map(s => s.subject).join(", ")}
            </p>
          </div>
        </div>
      )}

      {failing.length === 0 && ne.length === 0 && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
          <CheckCircle2 className="text-emerald-500 flex-shrink-0" style={{ width: 14, height: 14 }} />
          <p className="text-xs font-bold text-emerald-700">All subjects cleared — great work!</p>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PROFILE PAGE
══════════════════════════════════════════════════════════ */
export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router  = useRouter();
  const fileRef = useRef(null);

  const [profile,   setProfile]   = useState(null);
  const [results,   setResults]   = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState("");
  const [dragging,  setDragging]  = useState(false);
  const [history,   setHistory]   = useState([]);  // past result uploads

  useEffect(() => {
    if (status === "unauthenticated") router.push("/Login");
  }, [status, router]);

  useEffect(() => {
    if (!session) return;
    fetch("/api/users/profile").then(r => r.json()).then(d => { if (d.user) setProfile(d.user); });
    // try to load saved results history
    fetch("/api/results/history").then(r => r.json()).then(d => {
      if (d.results?.length) {
        setHistory(d.results);
        setResults(d.results[0]); // most recent
      }
    }).catch(() => {});
  }, [session]);

  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true); setError("");
    const form = new FormData();
    form.append("file", file);
    try {
      const res  = await fetch("/api/results", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setResults(data);
      setHistory(h => [data, ...h]);
    } catch (e) { setError(e.message); }
    finally { setUploading(false); }
  };

  const onDrop = (e) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  if (status === "loading" || !session) return (
    <div className="min-h-screen bg-[#eef0f4] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-sky-400/30 border-t-sky-500 rounded-full animate-spin" />
    </div>
  );

  const subjects = results?.subjects || [];
  const cgpa     = computeCGPA(subjects);
  const overallGrade = cgpa
    ? getGrade(Math.round((Number(cgpa) / 10) * 100))
    : null;

  return (
    <div className="min-h-screen bg-[#eef0f4]">
      <div className="h-1 bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500" />
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* back */}
        <Link href="/SDash"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-700 text-sm font-semibold transition-colors group">
          <ArrowLeft style={{ width: 15, height: 15 }} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to Dashboard
        </Link>

        {/* page header */}
        <div className="bg-[#fdfdfe] rounded-2xl border border-[#e2e5eb] shadow-[0_1px_4px_rgba(0,0,0,0.07)] p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white text-xl font-black shadow-md">
                {session.user?.name?.charAt(0) || "S"}
              </div>
              <div>
                <h1 className="text-xl font-black text-gray-900">{session.user?.name}</h1>
                <p className="text-sm text-gray-400">{profile?.branch || "Branch not set"} · {profile?.semester || "Semester not set"}</p>
                <p className="text-xs text-gray-400 mt-0.5">{profile?.institution || "Institution not set"}</p>
              </div>
            </div>

            {/* CGPA */}
            {cgpa && (
              <div className="text-center">
                <div className={`text-4xl font-black ${overallGrade ? GRADE_META[overallGrade]?.color : "text-gray-700"}`}>
                  {cgpa}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">CGPA (10 point)</p>
                {overallGrade && (
                  <span className={`text-xs font-bold ${GRADE_META[overallGrade]?.color}`}>
                    Grade {overallGrade} · {GRADE_META[overallGrade]?.label}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* grade legend */}
        <div className="bg-[#fdfdfe] rounded-2xl border border-[#e2e5eb] shadow-[0_1px_4px_rgba(0,0,0,0.07)] p-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Grading Scale</p>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {Object.entries(GRADE_META).map(([g, m]) => (
              <div key={g} className={`rounded-xl border p-2 text-center ${m.bg} ${m.border}`}>
                <div className={`text-sm font-black ${m.color}`}>{g}</div>
                <div className="text-[9px] text-gray-500 mt-0.5 leading-tight">{m.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* LEFT */}
          <div className="lg:col-span-2 space-y-5">

            {/* upload zone */}
            <div className="bg-[#fdfdfe] rounded-2xl border border-[#e2e5eb] shadow-[0_1px_4px_rgba(0,0,0,0.07)] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center">
                    <Zap className="text-violet-500" style={{ width: 15, height: 15 }} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-gray-900">Intelligence Extraction</h3>
                    <p className="text-[10px] text-gray-400">Upload your marks card to extract academic data</p>
                  </div>
                </div>
                {results && (
                  <button onClick={() => fileRef.current?.click()}
                    className="flex items-center gap-1.5 text-xs text-sky-500 font-bold hover:text-sky-600 transition-colors">
                    <RefreshCw style={{ width: 11, height: 11 }} /> Update
                  </button>
                )}
              </div>

              {!results ? (
                <div
                  onDragOver={e => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={onDrop}
                  onClick={() => fileRef.current?.click()}
                  className={`rounded-xl border-2 border-dashed p-10 text-center cursor-pointer transition-all ${
                    dragging ? "border-violet-400 bg-violet-50" : "border-[#dde0e8] hover:border-violet-300 hover:bg-violet-50/30"
                  }`}
                >
                  <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                    onChange={e => handleFile(e.target.files[0])} />
                  {uploading ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-9 h-9 border-2 border-violet-400/30 border-t-violet-500 rounded-full animate-spin" />
                      <p className="text-sm text-violet-500 font-semibold">Extracting data...</p>
                    </div>
                  ) : (
                    <>
                      <Upload className="mx-auto text-gray-300 mb-3" style={{ width: 36, height: 36 }} />
                      <p className="text-sm font-semibold text-gray-500">Drop your marks card here</p>
                      <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG · Subjects and scores extracted automatically</p>
                    </>
                  )}
                </div>
              ) : (
                <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                  onChange={e => handleFile(e.target.files[0])} />
              )}

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-red-500 text-xs">
                  <AlertTriangle style={{ width: 13, height: 13 }} /> {error}
                </div>
              )}
            </div>

            {/* subject table */}
            {subjects.length > 0 && (
              <div className="bg-[#fdfdfe] rounded-2xl border border-[#e2e5eb] shadow-[0_1px_4px_rgba(0,0,0,0.07)] p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center">
                      <BookOpen className="text-sky-500" style={{ width: 14, height: 14 }} />
                    </div>
                    <h3 className="text-sm font-black text-gray-900">Subject Results</h3>
                  </div>
                  <span className="text-xs text-gray-400">{subjects.length} subjects · {results?.semester || "Current Semester"}</span>
                </div>

                {/* column headers */}
                <div className="flex items-center gap-4 pb-2 border-b border-gray-100 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                  <span className="w-5 text-right">#</span>
                  <span className="flex-1">Subject</span>
                  <span className="w-28 hidden sm:block text-center">Progress</span>
                  <span className="w-10 text-right">Score</span>
                  <span className="w-8 text-right">Grade</span>
                </div>

                <div>
                  {subjects.map((s, i) => <SubjectRow key={i} subject={s} index={i} />)}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT */}
          <div className="space-y-5">
            {subjects.length > 0 && (
              <>
                <InsightCard subjects={subjects} />

                <div className="bg-[#fdfdfe] rounded-2xl border border-[#e2e5eb] shadow-[0_1px_4px_rgba(0,0,0,0.07)] p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                      <BarChart2 className="text-indigo-500" style={{ width: 14, height: 14 }} />
                    </div>
                    <h3 className="text-sm font-black text-gray-900">Grade Distribution</h3>
                  </div>
                  <GradeDistribution subjects={subjects} />
                </div>

                {/* overall summary */}
                <div className="bg-[#fdfdfe] rounded-2xl border border-[#e2e5eb] shadow-[0_1px_4px_rgba(0,0,0,0.07)] p-5 text-center space-y-2">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Overall Performance</p>
                  {cgpa && overallGrade ? (
                    <>
                      <GradeBadge grade={overallGrade} large />
                      <div className={`text-3xl font-black ${GRADE_META[overallGrade]?.color}`}>{cgpa}</div>
                      <p className="text-xs text-gray-500">CGPA · {GRADE_META[overallGrade]?.label}</p>
                    </>
                  ) : (
                    <p className="text-sm text-gray-400 py-4">Upload marks card to see CGPA</p>
                  )}
                </div>
              </>
            )}

            {subjects.length === 0 && (
              <div className="bg-[#fdfdfe] rounded-2xl border border-[#e2e5eb] shadow-[0_1px_4px_rgba(0,0,0,0.07)] p-8 text-center">
                <GraduationCap className="mx-auto text-gray-300 mb-3" style={{ width: 36, height: 36 }} />
                <p className="text-sm font-semibold text-gray-500 mb-1">No Academic Data Yet</p>
                <p className="text-xs text-gray-400">Upload your marks card to see detailed insights, CGPA, and grade distribution.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}