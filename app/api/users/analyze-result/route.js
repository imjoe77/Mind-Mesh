import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/auth";
import connectDB from "@/db/connectDB";
import User from "@/app/models/User";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

/* ──────────────────────────────────────────────────────────
   KLE Tech / Indian University Grade → Percent mapping
   
   KLE uses 10-point grade system:
   O=10(95%), A=9(85%), B=8(75%), C=7(65%), D=6(55%), P=5(52%), F=0(35%)
   
   MindMesh grading: S:90+ A:80-89 B:70-79 C:60-69 D:50-59 F:<50
────────────────────────────────────────────────────────── */

// KLE 10-point grade point → percent
const GRADE_POINT_TO_PERCENT = {
  10: 95, 9: 85, 8: 75, 7: 65, 6: 55, 5: 52, 4: 50, 0: 35,
};

// Letter grade → percent (covers KLE, VTU, Anna, Mumbai, etc.)
const LETTER_GRADE_MAP = {
  // KLE / common Indian
  "O": 95,    // Outstanding (10 point)
  "A+": 90,   // Exceptional
  "A": 85,    // Excellent (9 point at KLE)
  "B+": 78,   // Very Good
  "B": 75,    // Good (8 point at KLE)
  "C+": 68,
  "C": 65,    // Average (7 point at KLE)
  "D+": 58,
  "D": 55,    // Below Average (6 point at KLE)
  "P": 52,    // Pass (5 point at KLE)
  "E": 52,    // Pass equivalent
  "S": 93,    // Some universities use S for Outstanding
  "F": 35,    "FAIL": 35, "AB": 0,
  "NE": null, "W": null,  "I": null,
  // VTU
  "EX": 97,  "DIST": 75, "PASS": 52,
  // Mumbai / others
  "O+": 97,  "A1": 90,   "A2": 85,
  "B1": 78,  "B2": 73,
};

function letterToPercent(val) {
  if (val === null || val === undefined || val === "") return null;

  const str = String(val).trim().toUpperCase();

  // Already a number
  const num = parseFloat(str);
  if (!isNaN(num)) {
    // Grade point on 10-point scale (KLE, VTU etc.)
    if (Number.isInteger(num) && num >= 0 && num <= 10) {
      return GRADE_POINT_TO_PERCENT[num] ?? Math.round(num * 9.5);
    }
    // Decimal grade point e.g. 8.5
    if (num > 0 && num <= 10) return Math.round(num * 9.5);
    // Already a percent
    if (num > 10 && num <= 100) return Math.round(num);
    return null;
  }

  return LETTER_GRADE_MAP[str] !== undefined ? LETTER_GRADE_MAP[str] : null;
}

/* Sanitise a single subject entry coming from the AI */
function sanitiseSubject(raw, index) {
  if (!raw || typeof raw !== "object") return null;

  const name = (raw.name || raw.subject || raw.subjectName || `Subject ${index + 1}`)
    .trim()
    .replace(/^\d+[\.\)]\s*/, "")   // strip leading "1. " numbering
    .replace(/^[A-Z0-9]{8,}\s+/,"") // strip course codes like "24EBCBI01 "
    .slice(0, 80);

  if (!name || name.length < 2) return null;

  let percent = null;

  // Priority 1: use gradePoint if provided (most accurate for KLE/VTU)
  if (raw.gradePoint !== null && raw.gradePoint !== undefined) {
    percent = letterToPercent(raw.gradePoint);
  }

  // Priority 2: use grade letter
  if (percent === null && raw.grade !== null && raw.grade !== undefined) {
    const gradeStr = String(raw.grade).trim();

    // Handle fraction format "45/60"
    const fracMatch = gradeStr.match(/^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/);
    if (fracMatch) {
      percent = Math.round((parseFloat(fracMatch[1]) / parseFloat(fracMatch[2])) * 100);
    } else {
      percent = letterToPercent(gradeStr);
    }
  }

  // Priority 3: fallback to percent/score/marks fields
  if (percent === null) {
    for (const field of ["percent", "score", "marks"]) {
      if (raw[field] !== null && raw[field] !== undefined) {
        percent = letterToPercent(raw[field]);
        if (percent !== null) break;
      }
    }
  }

  if (percent === null || isNaN(percent)) return null;
  percent = Math.max(0, Math.min(100, Math.round(percent)));

  // Color based on performance band
  const COLORS = [
    { min: 90, color: "#7c3aed" }, // violet — S grade
    { min: 80, color: "#0284c7" }, // sky    — A grade
    { min: 70, color: "#059669" }, // emerald — B grade
    { min: 60, color: "#d97706" }, // amber  — C grade
    { min: 50, color: "#ea580c" }, // orange — D grade
    { min: 0,  color: "#dc2626" }, // red    — F grade
  ];
  const color = COLORS.find(c => percent >= c.min)?.color || "#6b7280";

  return { name, percent, color };
}

/* Generate activity feed from extracted subjects */
function generateActivity(subjects) {
  return subjects.slice(0, 4).map((s, i) => {
    const times = ["Just now", "Yesterday", "2 days ago", "Last week"];
    let text, color;
    if (s.percent >= 80) {
      text = `Scored ${s.percent}% in ${s.name} — keep it up!`;
      color = "#059669";
    } else if (s.percent >= 60) {
      text = `${s.name} at ${s.percent}% — room to improve`;
      color = "#d97706";
    } else {
      text = `Needs urgent review: ${s.name} (${s.percent}%)`;
      color = "#dc2626";
    }
    return { text, bold: s.name, time: times[i] || "Recently", color };
  });
}

/* Generate upcoming tasks based on weak subjects */
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
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { base64Image } = await req.json();
    if (!base64Image || !base64Image.startsWith("data:image")) {
      return NextResponse.json(
        { error: "Invalid image. Please upload a JPG or PNG of your marks card." },
        { status: 400 }
      );
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: "OpenRouter API key not configured. Add OPENROUTER_API_KEY to .env.local" },
        { status: 500 }
      );
    }

    /* ── Prompt: AI extracts raw data, server converts to percent ── */
    const prompt = `You are an academic result parser specialising in Indian university mark sheets.

Extract ALL subject results from this image. Return ONLY a raw JSON object — no markdown, no explanation.

Required format:
{
  "semester": "exact semester/exam name as shown (e.g. 'Semester End Examination Results Dec 2024')",
  "gpa": "exact SGPA or CGPA value as shown (e.g. '9.00'), or 'N/A' if not found",
  "subjects": [
    {
      "name": "Full course name exactly as shown",
      "grade": "exact grade letter as shown (e.g. 'A', 'O', 'B+', 'F')",
      "gradePoint": number or null (grade point value if shown, e.g. 9 for grade A at KLE)
    }
  ]
}

Critical rules:
- Extract the GRADE LETTER exactly as printed — do NOT convert to percent yourself
- If grade points (like 9, 8, 10) are shown alongside the letter, include them in gradePoint
- If marks like 45/60 are shown, put them as a string in grade field (e.g. "45/60")
- Include ALL subjects visible in the table
- Course codes like "24EBCBI01" should NOT be in the name — use only the course name
- If a field is missing, use null
- If no subjects found, return: {"subjects":[]}

This appears to be a KLE Technological University result where grades are: O(10pts), A(9pts), B(8pts), C(7pts), D(6pts), P(5pts), F(0pts)`;

    console.log(`[ANALYZE] Sending to OpenRouter — image size: ${(base64Image.length / 1024).toFixed(0)}KB`);

    const controller = new AbortController();
    const timeout    = setTimeout(() => controller.abort(), 28000);

    let openRouterRes;
    try {
      openRouterRes = await fetch(OPENROUTER_API_URL, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.NEXT_PUBLIC_URL || "http://localhost:3000",
          "X-Title": "MindMesh Academic Analyzer",
        },
        body: JSON.stringify({
          model: "meta-llama/llama-3.2-11b-vision-instruct",
          max_tokens: 1000,
          temperature: 0.05, // very low — we want deterministic extraction
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                { type: "image_url", image_url: { url: base64Image } },
              ],
            },
          ],
        }),
      });
    } catch (fetchErr) {
      clearTimeout(timeout);
      if (fetchErr.name === "AbortError") {
        console.warn("[ANALYZE] Timed out after 28s");
        return NextResponse.json(
          { error: "Analysis timed out. The AI is busy — please try again in a moment." },
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
        { error: `AI service error (${openRouterRes.status}). Check your OPENROUTER_API_KEY or try again.` },
        { status: 502 }
      );
    }

    const data        = await openRouterRes.json();
    let   aiResponse  = data.choices?.[0]?.message?.content?.trim() || "";

    console.log(`[ANALYZE] Raw AI response (${aiResponse.length} chars):`, aiResponse.slice(0, 300));

    /* ── Parse AI response ── */
    let parsed;
    try {
      // Strip markdown fences if model added them
      aiResponse = aiResponse
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

      // Extract the JSON object even if there's surrounding text
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON object found in response");

      parsed = JSON.parse(jsonMatch[0]);
    } catch (parseErr) {
      console.error("[ANALYZE] JSON parse failed:", parseErr.message, "| Raw:", aiResponse);
      return NextResponse.json(
        { error: "Could not parse the marks card. Make sure the image is clear and shows subject marks." },
        { status: 422 }
      );
    }

    /* ── Validate subjects array ── */
    const rawSubjects = Array.isArray(parsed.subjects) ? parsed.subjects : [];

    if (rawSubjects.length === 0) {
      return NextResponse.json(
        { error: "No subjects found in the image. Please upload a clearer photo of your marks card." },
        { status: 422 }
      );
    }

    /* ── Sanitise each subject — apply our own conversion logic ── */
    const subjects = rawSubjects
      .map((s, i) => sanitiseSubject(s, i))
      .filter(Boolean); // remove nulls

    if (subjects.length === 0) {
      return NextResponse.json(
        { error: "Subjects were found but marks could not be read. Try a clearer image." },
        { status: 422 }
      );
    }

    /* ── Build full metrics object ── */
    const metrics = {
      semester:     (parsed.semester || "Current Semester").trim(),
      gpa:          (parsed.gpa      || "N/A").trim(),
      attendance:   parsed.attendance || "N/A",
      subjects,
      upcoming:     generateUpcoming(subjects),
      activity:     generateActivity(subjects),
      lastAnalyzed: new Date(),
    };

    /* ── Persist to user's profile ── */
    await connectDB();
    await User.findByIdAndUpdate(
      session.user.id,
      { $set: { academicMetrics: metrics } },
      { new: true }
    );

    console.log(`[ANALYZE] Success — ${subjects.length} subjects, GPA: ${metrics.gpa}, Semester: ${metrics.semester}`);

    return NextResponse.json({ success: true, metrics });

  } catch (err) {
    console.error("[ANALYZE_RESULT] Unhandled error:", err);
    return NextResponse.json(
      { error: "Unexpected server error. Please try again." },
      { status: 500 }
    );
  }
}
