import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/auth";
import connectDB from "@/db/connectDB";
import User from "@/app/models/User";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

/* ─────────────────────────────────────────────────────────────────
   GRADE MAPPINGS
   KLE Tech: O=10(95%) A=9(85%) B=8(75%) C=7(65%) D=6(55%) P=5(52%) F=0
   MindMesh display: S≥90 A≥80 B≥70 C≥60 D≥50 F<50
───────────────────────────────────────────────────────────────── */

const GRADE_POINT_TO_PERCENT = {
  10: 95, 9: 85, 8: 75, 7: 65, 6: 55, 5: 52, 4: 48, 3: 40, 2: 35, 1: 33, 0: 0,
};

const LETTER_GRADE_MAP = {
  // KLE / VTU / common Indian grading
  "O":    95,  "S":    93,  "EX":   97,
  "A+":   90,  "O+":   97,
  "A":    85,  "A1":   90,  "A2":   85,
  "B+":   78,  "B1":   78,  "B2":   73,
  "B":    75,
  "C+":   68,  "C":    65,
  "D+":   58,  "D":    55,
  "E":    52,  // KLE Pass equivalent
  "P":    52,  "PASS": 52,  "DIST": 75,
  "F":    0,   "FAIL": 0,   "FF":   0,
  // Detained / not eligible / absent — show as 0, still include in results
  "X":    0,   "XX":   0,   "DR":   0,
  // Truly null — no grade info at all, skip
  "AB":   null, "NE": null, "W": null, "I": null,
};

// Words/phrases that are NEVER a subject name — checked as full words to avoid false matches
// e.g. "science" alone would block "Computer Science" so we check boundaries
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

/* ─────────────────────────────────────────────────────────────────
   letterToPercent — handles every grade format
───────────────────────────────────────────────────────────────── */
function letterToPercent(val) {
  if (val === null || val === undefined || val === "") return null;
  const str = String(val).trim();

  // Fraction format "45/60" or "67/80"
  const fracMatch = str.match(/^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/);
  if (fracMatch) {
    const obtained = parseFloat(fracMatch[1]);
    const total    = parseFloat(fracMatch[2]);
    if (total > 0) return Math.round((obtained / total) * 100);
    return null;
  }

  // Pure number
  const num = parseFloat(str);
  if (!isNaN(num)) {
    // Integer grade point 0-10
    if (Number.isInteger(num) && num >= 0 && num <= 10) {
      return GRADE_POINT_TO_PERCENT[num] ?? Math.round(num * 9.5);
    }
    // Decimal grade point e.g. 8.5
    if (num > 0 && num <= 10) return Math.round(num * 9.5);
    // Already a percentage
    if (num > 10 && num <= 100) return Math.round(num);
    return null;
  }

  // Letter grade lookup
  const upper = str.toUpperCase();
  return LETTER_GRADE_MAP.hasOwnProperty(upper) ? LETTER_GRADE_MAP[upper] : null;
}

/* ─────────────────────────────────────────────────────────────────
   isValidSubjectName — reject non-subject rows
───────────────────────────────────────────────────────────────── */
function isValidSubjectName(name) {
  if (!name || typeof name !== "string") return false;
  const lower = name.toLowerCase().trim();

  // Too short
  if (lower.length < 4) return false;

  // Pure course code only (e.g. "24EBCBI01", "CS101")
  if (/^[A-Z0-9]{4,12}$/.test(name.trim())) return false;

  // Pure numbers
  if (/^\d+$/.test(name.trim())) return false;

  // Exact prefix matches (degree names like "Bachelor of ...")
  for (const kw of NON_SUBJECT_KEYWORDS_EXACT) {
    if (lower.startsWith(kw)) return false;
  }

  // Substring matches for administrative text
  for (const kw of NON_SUBJECT_KEYWORDS_CONTAINS) {
    if (lower.includes(kw)) return false;
  }

  return true;
}

/* ─────────────────────────────────────────────────────────────────
   sanitiseSubject — convert one AI subject row to clean format
───────────────────────────────────────────────────────────────── */
function sanitiseSubject(raw, index) {
  if (!raw || typeof raw !== "object") return null;

  // Build clean name
  let name = (raw.name || raw.subject || raw.subjectName || raw.courseName || "")
    .trim()
    .replace(/^\d+[\.\)\:]\s*/, "")           // strip "1. " or "01) "
    .replace(/^[A-Z0-9]{4,12}\s+/, "")        // strip leading course code
    .replace(/\s+[A-Z0-9]{4,12}$/, "")        // strip trailing course code
    .trim()
    .slice(0, 80);

  if (!isValidSubjectName(name)) return null;

  // Detect detained/null grades before trying to extract percent
  const gradeRaw = raw.grade ? String(raw.grade).trim().toUpperCase() : null;
  const isDetained = gradeRaw === "X" || gradeRaw === "XX" || gradeRaw === "DR";
  const isNullGrade = gradeRaw && ["AB", "NE", "W", "I"].includes(gradeRaw);

  // Skip truly null grades (absent/not eligible with no marks info)
  if (isNullGrade && !raw.gradePoint && !raw.marksObtained) return null;

  let percent = null;

  // Priority 1: gradePoint column (most reliable for KLE/VTU)
  if (raw.gradePoint !== null && raw.gradePoint !== undefined && raw.gradePoint !== "") {
    percent = letterToPercent(raw.gradePoint);
  }

  // Priority 2: grade letter column — copy exactly what AI extracted
  if (percent === null && raw.grade !== null && raw.grade !== undefined && raw.grade !== "") {
    percent = letterToPercent(String(raw.grade).trim());
  }

  // Priority 3: marks obtained / max marks
  if (percent === null && raw.marksObtained !== null && raw.marksObtained !== undefined) {
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

  // Priority 4: any remaining fallback fields
  if (percent === null) {
    for (const field of ["percent", "score", "marks", "obtained"]) {
      if (raw[field] !== null && raw[field] !== undefined && raw[field] !== "") {
        const p = letterToPercent(raw[field]);
        if (p !== null) { percent = p; break; }
      }
    }
  }

  // Detained subjects (X grade) — include with 0% so they show up
  if (percent === null && isDetained) percent = 0;

  if (percent === null || isNaN(percent)) return null;
  percent = Math.max(0, Math.min(100, Math.round(percent)));

  const COLORS = [
    { min: 90, color: "#7c3aed" }, // violet — S
    { min: 80, color: "#0284c7" }, // sky    — A
    { min: 70, color: "#059669" }, // emerald — B
    { min: 60, color: "#d97706" }, // amber  — C
    { min: 50, color: "#ea580c" }, // orange — D/E
    { min:  1, color: "#dc2626" }, // red    — F
    { min:  0, color: "#7f1d1d" }, // dark red — X detained
  ];
  const color = COLORS.find(c => percent >= c.min)?.color || "#7f1d1d";

  return {
    name,
    percent,
    color,
    ...(isDetained ? { detained: true } : {}),
  };
}

/* ─────────────────────────────────────────────────────────────────
   Activity + Upcoming helpers
───────────────────────────────────────────────────────────────── */
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

/* ─────────────────────────────────────────────────────────────────
   POST — main handler
───────────────────────────────────────────────────────────────── */
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

    /* ── PROMPT — explicit, covers every Indian university format ── */
    const prompt = `You are a precise academic result extraction engine for Indian university mark sheets.

Your ONLY task: extract every subject name and its grade/marks from the table in this image.

Return ONLY raw JSON — absolutely no markdown, no explanation, no surrounding text.

Required JSON format:
{
  "semester": "exact semester/exam label from the document (e.g. 'Semester End Examination Results Dec 2024')",
  "gpa": "exact SGPA or CGPA number as a string (e.g. '8.75'), or 'N/A' if not shown",
  "subjects": [
    {
      "name": "Full descriptive subject/course name only — NO course codes",
      "grade": "exact grade letter copied from the document (e.g. 'A', 'O', 'B+', 'F', 'X', 'P') — do NOT interpret",
      "gradePoint": <number if a grade point column exists, e.g. 9, else null>,
      "marksObtained": <number if raw marks column exists, else null>,
      "maxMarks": <maximum marks if shown, else null>
    }
  ]
}

STRICT EXTRACTION RULES:
1. ONLY include rows from the SUBJECT/RESULT TABLE. Never include:
   - Student name, roll number, registration number, enrollment
   - University/college/institution name
   - Degree or programme name (e.g. "Bachelor of Computer Application" is NOT a subject)
   - Branch or department name
   - SGPA row, CGPA row, Total row, Grand Total row
   - Any header, footer, watermark, or administrative text
2. Copy the grade letter EXACTLY as printed. If it says "X" write "X". If it says "A" write "A". Never convert or guess.
3. IMPORTANT: Include X (Detained) grade subjects — do NOT skip them. They are valid results.
4. If a subject shows raw marks like "58/80" — put "58/80" in the grade field.
5. Include ALL subject rows from the table — do not skip any, including detained/failed ones.
6. Course codes (like "24CS101", "21EBCBI01") must NOT appear in the name — only use the descriptive course title.
7. If grade is completely blank or shows "-" for a subject, skip it.
8. The gradePoint field is only for a separate numeric column (like 9, 8, 7) — not the letter grade.

This is likely KLE Technological University (O=10pts, A=9pts, B=8pts, C=7pts, D=6pts, P=5pts, F=0pts, X=Detained)
but handle ANY Indian university format.`;

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
          model:       "meta-llama/llama-3.2-11b-vision-instruct",
          max_tokens:  1500,  // higher = more subjects extracted
          temperature: 0.0,   // deterministic — no guessing
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

    // Parse JSON from response
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

    // Sanitise — server does ALL conversion, AI just extracts raw values
    const subjects = rawSubjects
      .map((s, i) => sanitiseSubject(s, i))
      .filter(Boolean);

    console.log(`[ANALYZE] ${rawSubjects.length} raw → ${subjects.length} clean subjects:`);
    subjects.forEach(s => console.log(`  · ${s.name}: ${s.percent}%`));

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
