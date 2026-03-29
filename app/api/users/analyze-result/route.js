import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/auth";
import connectDB from "@/db/connectDB";
import User from "@/app/models/User";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

/* ─────────────────────────────────────────────────────────────────
   GRADE MAPPINGS
   KLE Tech: O=10(95%) A=9(85%) B=8(75%) C=7(65%) D=6(55%) E=5(52%) F=0
   MindMesh display: S≥90 A≥80 B≥70 C≥60 D≥55 E≥50 F<50 X=detained
───────────────────────────────────────────────────────────────── */

const GRADE_POINT_TO_PERCENT = {
  10: 95, 9: 85, 8: 75, 7: 65, 6: 55, 5: 52, 4: 48, 3: 40, 2: 35, 1: 33, 0: 0,
};

const LETTER_GRADE_MAP = {
  "O":    95,  "S":    93,  "EX":   97,
  "A+":   90,  "O+":   97,
  "A":    85,  "A1":   90,  "A2":   85,
  "B+":   78,  "B1":   78,  "B2":   73,
  "B":    75,
  "C+":   68,  "C":    65,
  "D+":   58,  "D":    55,
  "E":    52,
  "P":    52,  "PASS": 52,  "DIST": 75,
  "F":    0,   "FAIL": 0,   "FF":   0,
  "X":    0,   "XX":   0,   "DR":   0,
  "AB":   null, "NE": null, "W": null, "I": null,
};

const NON_SUBJECT_KEYWORDS_EXACT = [
  "bachelor of", "master of", "b.tech", "m.tech", "b.e.", "m.e.",
  "b.c.a", "m.c.a", "b.sc", "m.sc", "b.com", "m.com",
];
const NON_SUBJECT_KEYWORDS_CONTAINS = [
  "semester gpa", "sgpa", "cgpa", "grand total", "total credits",
  "credits earned", "credits registered", "cumulative gpa",
  "student name", "student id", "roll number", "enrollment no",
  "registration no", "date of birth", "mobile no", "email id",
  "father's name", "mother's name", "declaration", "signature",
  "grade card", "mark sheet", "marksheet", "grade sheet", "transcript",
  "university", "college", "institute", "department",
];

function letterToPercent(val) {
  if (val === null || val === undefined || val === "") return null;
  const str = String(val).trim();

  const fracMatch = str.match(/^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/);
  if (fracMatch) {
    const obtained = parseFloat(fracMatch[1]);
    const total    = parseFloat(fracMatch[2]);
    if (total > 0) return Math.round((obtained / total) * 100);
    return null;
  }

  const num = parseFloat(str);
  if (!isNaN(num)) {
    if (Number.isInteger(num) && num >= 0 && num <= 10) {
      return GRADE_POINT_TO_PERCENT[num] ?? Math.round(num * 9.5);
    }
    if (num > 0 && num <= 10) return Math.round(num * 9.5);
    if (num > 10 && num <= 100) return Math.round(num);
    return null;
  }

  const upper = str.toUpperCase();
  return LETTER_GRADE_MAP.hasOwnProperty(upper) ? LETTER_GRADE_MAP[upper] : null;
}

function isValidSubjectName(name) {
  if (!name || typeof name !== "string") return false;
  const lower = name.toLowerCase().trim();
  if (lower.length < 4) return false;
  if (/^[A-Z0-9]{4,12}$/.test(name.trim())) return false;
  if (/^\d+$/.test(name.trim())) return false;
  for (const kw of NON_SUBJECT_KEYWORDS_EXACT) {
    if (lower.startsWith(kw)) return false;
  }
  for (const kw of NON_SUBJECT_KEYWORDS_CONTAINS) {
    if (lower.includes(kw)) return false;
  }
  return true;
}

function gradeLetterForDisplay(rawGrade, percent, isDetained) {
  if (isDetained) return "X";
  if (rawGrade) {
    const upper = String(rawGrade).trim().toUpperCase();
    if (LETTER_GRADE_MAP.hasOwnProperty(upper) && LETTER_GRADE_MAP[upper] !== null) {
      return upper;
    }
  }
  if (percent >= 90) return "S";
  if (percent >= 80) return "A";
  if (percent >= 70) return "B";
  if (percent >= 60) return "C";
  if (percent >= 55) return "D";
  if (percent >= 50) return "E";
  if (percent > 0)   return "F";
  return "F";
}

function sanitiseSubject(raw) {
  if (!raw || typeof raw !== "object") return null;

  let name = (raw.name || raw.subject || raw.subjectName || raw.courseName || "")
    .trim()
    .replace(/^\d+[\.\)\:]\s*/, "")
    .replace(/^[A-Z0-9]{4,12}\s+/, "")
    .replace(/\s+[A-Z0-9]{4,12}$/, "")
    .trim()
    .slice(0, 80);

  if (!isValidSubjectName(name)) return null;

  const gradeRaw    = raw.grade ? String(raw.grade).trim().toUpperCase() : null;
  const isDetained  = gradeRaw === "X" || gradeRaw === "XX" || gradeRaw === "DR";
  const isNullGrade = gradeRaw && ["AB", "NE", "W", "I"].includes(gradeRaw);

  if (isNullGrade && !raw.gradePoint && !raw.marksObtained) return null;

  let percent = null;

  // ── PRIORITY 1: Letter grade — always trust this first ──
  if (gradeRaw) {
    if (LETTER_GRADE_MAP.hasOwnProperty(gradeRaw)) {
      percent = LETTER_GRADE_MAP[gradeRaw];
    } else {
      const p = letterToPercent(gradeRaw);
      if (p !== null) percent = p;
    }
  }

  // ── PRIORITY 2: gradePoint — only integers, only if no letter grade ──
  if (percent === null) {
    const gpVal = raw.gradePoint;
    if (gpVal !== null && gpVal !== undefined && gpVal !== "") {
      const gpNum = parseFloat(gpVal);
      if (!isNaN(gpNum) && Number.isInteger(gpNum)) {
        percent = letterToPercent(gpNum);
      }
    }
  }

  // ── PRIORITY 3: marks obtained / max marks ──
  if (percent === null && raw.marksObtained != null) {
    if (raw.maxMarks) {
      const obtained = parseFloat(raw.marksObtained);
      const max      = parseFloat(raw.maxMarks);
      if (!isNaN(obtained) && !isNaN(max) && max > 0) {
        percent = Math.round((obtained / max) * 100);
      }
    } else {
      percent = letterToPercent(raw.marksObtained);
    }
  }

  // ── PRIORITY 4: fallback fields ──
  if (percent === null) {
    for (const field of ["percent", "score", "marks", "obtained"]) {
      if (raw[field] != null && raw[field] !== "") {
        const p = letterToPercent(raw[field]);
        if (p !== null) { percent = p; break; }
      }
    }
  }

  if (percent === null && isDetained) percent = 0;
  if (percent === null || isNaN(percent)) return null;
  percent = Math.max(0, Math.min(100, Math.round(percent)));

  const COLORS = [
    { min: 90, color: "#7c3aed" },
    { min: 80, color: "#0284c7" },
    { min: 70, color: "#059669" },
    { min: 60, color: "#d97706" },
    { min: 55, color: "#ea580c" },
    { min: 50, color: "#f97316" },
    { min:  1, color: "#dc2626" },
    { min:  0, color: "#7f1d1d" },
  ];
  const color = COLORS.find(c => percent >= c.min)?.color || "#7f1d1d";

  const displayGrade = gradeLetterForDisplay(gradeRaw, percent, isDetained);

  return {
    name,
    percent,
    color,
    grade: displayGrade,
    ...(isDetained ? { detained: true } : {}),
  };
}

function generateActivity(subjects) {
  return subjects.slice(0, 4).map((s, i) => {
    const times = ["Just now", "Yesterday", "2 days ago", "Last week"];
    let text, color;
    if (s.percent >= 80)      { text = `Scored ${s.percent}% in ${s.name} — keep it up!`; color = "#059669"; }
    else if (s.percent >= 60) { text = `${s.name} at ${s.percent}% — room to improve`;     color = "#d97706"; }
    else                      { text = `Needs urgent review: ${s.name} (${s.percent}%)`;   color = "#dc2626"; }
    return { text, bold: s.name, time: times[i] || "Recently", color };
  });
}

function generateUpcoming(subjects) {
  const sorted = [...subjects].sort((a, b) => a.percent - b.percent);
  const tasks  = ["Revision session", "Practice problems", "Mock test", "Doubt clearing"];
  const today  = new Date();
  return sorted.slice(0, 3).map((s, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + 2 + i * 2);
    const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return { subject: s.name, task: tasks[i] || "Review session", date: dateStr };
  });
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { base64Image } = await req.json();
    if (!base64Image || !base64Image.startsWith("data:image")) {
      return NextResponse.json(
        { error: "Invalid image. Please upload a JPG or PNG of your marks card." },
        { status: 400 }
      );
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json({ error: "OpenRouter API key not configured." }, { status: 500 });
    }

    const prompt = `You are a precise academic result extraction engine for Indian university mark sheets.

Your ONLY task: extract every subject name and its grade/marks from the table in this image.

Return ONLY raw JSON — absolutely no markdown, no explanation, no surrounding text.

Required JSON format:
{
  "semester": "exact semester/exam label from the document",
  "gpa": "exact SGPA number as a string (e.g. '3.37'), or 'N/A' if not shown",
  "subjects": [
    {
      "name": "Full descriptive subject/course name only — NO course codes",
      "grade": "exact grade letter copied from the GRADE column only (e.g. 'A', 'O', 'B', 'D', 'E', 'F', 'X'). Copy it exactly as printed. NEVER write a credits value here.",
      "gradePoint": null,
      "marksObtained": null,
      "maxMarks": null
    }
  ]
}

CRITICAL RULES:
1. The GRADE column contains a single letter: O, A, B, C, D, E, F, X. Extract ONLY from this column.
2. The CREDITS EARNED / CREDITS REGISTERED columns contain numbers like 4.00, 3.00, 2.00 — DO NOT put these in gradePoint. Leave gradePoint as null always.
3. Copy grade letter EXACTLY: if it says "E" write "E", if it says "X" write "X", if it says "D" write "D". Never convert or guess.
4. Include X (Detained) grade subjects — do NOT skip them.
5. ONLY include rows from the subject results table. Never include student name, roll number, university/college name, degree/programme name, SGPA row, CGPA row, Total row, headers or footers.
6. Course codes (like "24EBCBI01") must NOT appear in the name — only the descriptive title.
7. If a row has no grade letter at all, skip it.

This appears to be KLE Technological University format (grades: O > A > B > C > D > E > F > X).`;

    console.log(`[ANALYZE] Image: ${(base64Image.length / 1024).toFixed(0)}KB`);

    const controller = new AbortController();
    const timeout    = setTimeout(() => controller.abort(), 28000);

    let openRouterRes;
    try {
      openRouterRes = await fetch(OPENROUTER_API_URL, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type":  "application/json",
          "HTTP-Referer":  process.env.NEXT_PUBLIC_URL || "http://localhost:3000",
          "X-Title":       "MindMesh Academic Analyzer",
        },
        body: JSON.stringify({
          models: [
            "google/gemma-3-27b-it:free",
            "google/gemma-3-12b-it:free",
            "nvidia/nemotron-nano-12b-v2-vl:free",
            "google/gemma-3-4b-it:free",
          ],
          route:       "fallback",
          max_tokens:  1500,
          temperature: 0.0,
          messages: [{
            role: "user",
            content: [
              { type: "text",      text: prompt },
              { type: "image_url", image_url: { url: base64Image } },
            ],
          }],
        }),
      });
    } catch (fetchErr) {
      clearTimeout(timeout);
      if (fetchErr.name === "AbortError") {
        return NextResponse.json(
          { error: "Analysis timed out — please try again in a moment." },
          { status: 504 }
        );
      }
      throw fetchErr;
    }
    clearTimeout(timeout);

    if (!openRouterRes.ok) {
      const errText = await openRouterRes.text();
      console.error("[ANALYZE] OpenRouter error:", openRouterRes.status, errText);
      return NextResponse.json(
        { error: `AI service error (${openRouterRes.status}). Try again.` },
        { status: 502 }
      );
    }

    const data       = await openRouterRes.json();
    let   aiResponse = data.choices?.[0]?.message?.content?.trim() || "";

    console.log(`[ANALYZE] AI response (${aiResponse.length} chars):`, aiResponse.slice(0, 500));

    let parsed;
    try {
      aiResponse = aiResponse
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found");
      parsed = JSON.parse(jsonMatch[0]);
    } catch (parseErr) {
      console.error("[ANALYZE] Parse failed:", parseErr.message, "\nRaw:", aiResponse);
      return NextResponse.json(
        { error: "Could not read the marks card. Make sure the image is clear and well-lit." },
        { status: 422 }
      );
    }

    const rawSubjects = Array.isArray(parsed.subjects) ? parsed.subjects : [];
    if (rawSubjects.length === 0) {
      return NextResponse.json(
        { error: "No subjects found. Upload a clear photo showing the subject results table." },
        { status: 422 }
      );
    }

    console.log("[ANALYZE] Raw AI subjects:", JSON.stringify(rawSubjects, null, 2));

    const subjects = rawSubjects
      .map(s => sanitiseSubject(s))
      .filter(Boolean);

    console.log(`[ANALYZE] ${rawSubjects.length} raw → ${subjects.length} clean subjects:`);
    subjects.forEach(s => console.log(`  · ${s.name}: ${s.percent}% (${s.grade}${s.detained ? " DETAINED" : ""})`));

    if (subjects.length === 0) {
      return NextResponse.json(
        { error: "Subjects found but grades couldn't be read. Try a brighter, clearer image." },
        { status: 422 }
      );
    }

    const metrics = {
      semester:     (parsed.semester || "Current Semester").trim(),
      gpa:          (parsed.gpa      || "N/A").trim(),
      attendance:   parsed.attendance || "N/A",
      subjects,
      upcoming:     generateUpcoming(subjects),
      activity:     generateActivity(subjects),
      lastAnalyzed: new Date(),
    };

    await connectDB();
    await User.findByIdAndUpdate(
      session.user.id,
      { $set: { academicMetrics: metrics } },
      { new: true }
    );

    console.log(`[ANALYZE] ✓ Saved — ${subjects.length} subjects, GPA: ${metrics.gpa}`);
    return NextResponse.json({ success: true, metrics });

  } catch (err) {
    console.error("[ANALYZE_RESULT] Unhandled:", err);
    return NextResponse.json({ error: "Unexpected error. Please try again." }, { status: 500 });
  }
}
