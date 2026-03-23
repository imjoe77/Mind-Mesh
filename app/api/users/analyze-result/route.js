import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/auth";
import connectDB from "@/db/connectDB";
import User from "@/app/models/User";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

/* ──────────────────────────────────────────────────────────
   Universal Indian University Grade → Percent mapping
   
   Supports: KLE, VTU, Anna, Mumbai, CBCS, JNTU, etc.
   KLE 10-point: O=10(95%), A=9(85%), B=8(75%), C=7(65%), D=6(55%), P=5(52%), F=0(35%)
   MindMesh grading: S:90+ A:80-89 B:70-79 C:60-69 D:50-59 F:<50
────────────────────────────────────────────────────────── */

// KLE 10-point grade point → percent
const GRADE_POINT_TO_PERCENT = {
  10: 95, 9: 85, 8: 75, 7: 65, 6: 55, 5: 52, 4: 50, 3: 45, 2: 40, 1: 38, 0: 35,
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
  "F": 35,    "FAIL": 35, "AB": 0, "ABSENT": 0,
  "NE": null, "W": null,  "I": null, "X": 35, // X = Detained/Fail
  // VTU
  "EX": 97,  "DIST": 75, "PASS": 52,
  // Mumbai / others
  "O+": 97,  "A1": 90,   "A2": 85,
  "B1": 78,  "B2": 73,
  // CBCS 10-pt variations
  "AA": 95, "AB": 87, "BB": 78, "BC": 70, "CC": 62, "CD": 55, "DD": 50, "FF": 35,
};

/**
 * Convert a grade/mark value to a percentage.
 * @param {*} val - grade letter, grade point, fraction "45/60", or raw percentage
 * @param {boolean} isGradePointContext - true when the field is explicitly "gradePoint"
 */
function letterToPercent(val, isGradePointContext = false) {
  if (val === null || val === undefined || val === "") return null;

  const str = String(val).trim().toUpperCase();

  // Handle fraction format "45/60"
  const fracMatch = str.match(/^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/);
  if (fracMatch) {
    const numerator = parseFloat(fracMatch[1]);
    const denominator = parseFloat(fracMatch[2]);
    if (denominator > 0) return Math.round((numerator / denominator) * 100);
    return null;
  }

  // Already a number
  const num = parseFloat(str);
  if (!isNaN(num)) {
    // If explicitly in gradePoint context → always treat as 10-point scale
    if (isGradePointContext) {
      if (num >= 0 && num <= 10) {
        if (Number.isInteger(num)) return GRADE_POINT_TO_PERCENT[num] ?? Math.round(num * 9.5);
        return Math.round(num * 9.5);
      }
      return null;
    }

    // Otherwise: numbers > 10 are treated as direct percentages
    if (num > 10 && num <= 100) return Math.round(num);
    // Small integers 0-10 could be grade points, but be cautious
    if (Number.isInteger(num) && num >= 0 && num <= 10) {
      return GRADE_POINT_TO_PERCENT[num] ?? Math.round(num * 9.5);
    }
    // Decimal 0-10 → grade point
    if (num > 0 && num <= 10) return Math.round(num * 9.5);
    // > 100 is invalid
    return null;
  }

  return LETTER_GRADE_MAP[str] !== undefined ? LETTER_GRADE_MAP[str] : null;
}

/* ── Subject name validation ─────────────────────────────────── */
// Reject names that are clearly not subjects
const INVALID_NAME_PATTERNS = [
  /^\d+$/,                    // pure numbers like "123"
  /^[A-Z0-9]{2,4}\d{3,}/,    // course codes like "CS301", "ME402"
  /^[A-Z]{2}\d{4,}/,         // codes like "EC2045"
  /^(total|grand|sgpa|cgpa|gpa|result|grade|credits?|semester|year|roll|usn|name|student|exam|marks|obtained|max|min|avg|percentage|status|remark|srno|sr\.?\s*no|sl\.?\s*no|s\.?\s*no)/i,
  /^(date|time|hall|seat|reg|registration|enrollment|enroll|id|prn|exam\s*no)/i,
  /^\w$/,                     // single character
];

function isValidSubjectName(name) {
  if (!name || typeof name !== "string") return false;
  const trimmed = name.trim();
  if (trimmed.length < 3) return false;
  if (trimmed.length > 80) return false;
  for (const pattern of INVALID_NAME_PATTERNS) {
    if (pattern.test(trimmed)) return false;
  }
  return true;
}

/* Sanitise a single subject entry coming from the AI */
function sanitiseSubject(raw, index) {
  if (!raw || typeof raw !== "object") return null;

  let name = (raw.name || raw.subject || raw.subjectName || "").trim();

  // Strip leading numbering ("1. ", "1) ", "1] ")
  name = name.replace(/^\d+[\.\)\]]\s*/, "");
  // Strip course codes like "24EBCBI01 " at the start
  name = name.replace(/^[A-Z0-9]{5,}\s+/, "");
  // Strip trailing course codes
  name = name.replace(/\s+[A-Z0-9]{5,}$/, "");
  name = name.slice(0, 80).trim();

  // Validate the subject name
  if (!isValidSubjectName(name)) return null;

  let percent = null;

  // Priority 1: use gradePoint if provided (most accurate for KLE/VTU)
  if (raw.gradePoint !== null && raw.gradePoint !== undefined && raw.gradePoint !== "") {
    percent = letterToPercent(raw.gradePoint, true); // grade point context
  }

  // Priority 2: use grade letter
  if (percent === null && raw.grade !== null && raw.grade !== undefined && raw.grade !== "") {
    const gradeStr = String(raw.grade).trim();
    percent = letterToPercent(gradeStr, false);
  }

  // Priority 3: fallback to percent/score/marks/marksObtained/totalMarks fields
  if (percent === null) {
    // Check if there's a marks/total pair for fraction
    if (raw.marksObtained && raw.totalMarks) {
      const obtained = parseFloat(raw.marksObtained);
      const total = parseFloat(raw.totalMarks);
      if (!isNaN(obtained) && !isNaN(total) && total > 0) {
        percent = Math.round((obtained / total) * 100);
      }
    }
    // Try other fields
    if (percent === null) {
      for (const field of ["percent", "percentage", "score", "marks", "marksObtained"]) {
        if (raw[field] !== null && raw[field] !== undefined && raw[field] !== "") {
          percent = letterToPercent(raw[field], false);
          if (percent !== null) break;
        }
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

    /* ── Prompt: Universal, works for ANY Indian university mark sheet ── */
    const prompt = `You are an expert academic result extractor. Your job is to extract EVERY subject and its grade/marks from this mark sheet image.

IMPORTANT: You MUST extract ALL subjects visible in the image. Do NOT skip any subjects. If there are 8 subjects, return all 8. If there are 12, return all 12.

Return ONLY a raw JSON object — absolutely no markdown, no explanation, no commentary.

Required JSON format:
{
  "semester": "exact semester/exam name as shown, or 'N/A'",
  "gpa": "exact SGPA or CGPA value if shown, or 'N/A'",
  "subjects": [
    {
      "name": "Full subject/course name (NOT the course code)",
      "grade": "exact grade letter as printed (e.g. 'A', 'O', 'B+', 'F', 'X') OR marks as string like '45/60'",
      "gradePoint": <number or null — grade point if shown separately (e.g. 9, 8.5, 10)>,
      "marksObtained": <number or null — marks obtained if shown>,
      "totalMarks": <number or null — total/max marks if shown>
    }
  ]
}

CRITICAL RULES:
1. Extract EVERY single subject row from the table — do NOT skip any
2. Write the grade EXACTLY as printed on the sheet. If it says "X" write "X", if it says "O" write "O"
3. Do NOT confuse similar-looking grades: X≠S, O≠D, B≠D
4. Course codes (like "24EBCBI01", "CS301", "ME402") should NOT be in the name field — use only the descriptive course name
5. If both letter grade AND grade point are shown, include both
6. If marks are shown as fractions (45/60), put them in the grade field as a string
7. If a field is not visible, use null
8. Double-check: count the subject rows in the image and make sure your subjects array has the same count
9. If this is NOT a valid academic document, return: {"subjects": [], "error": "Not a valid marks card"}`;

    console.log(`[ANALYZE] Attempting extraction with primary model (Gemini Flash)...`);

    const callAI = async (modelId) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 45000);
      try {
        const res = await fetch(OPENROUTER_API_URL, {
          method: "POST",
          signal: controller.signal,
          headers: {
            "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-pro-1.5", // highly reliable vision model
            max_tokens: 3000,
            temperature: 0.1,
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
        clearTimeout(timeout);
        return res;
      } catch (err) {
        clearTimeout(timeout);
        throw err;
      }
    };

    let openRouterRes;
    let usedFallback = false;

    try {
      // Primary attempt: Use the 11B Vision model (very reliable on most plans)
      openRouterRes = await callAI("meta-llama/llama-3.2-11b-vision-instruct");
      
      if (!openRouterRes.ok) {
        const errData = await openRouterRes.clone().json().catch(() => ({}));
        console.warn(`[ANALYZE] Primary model failed (${openRouterRes.status}):`, errData);
        
        // Fallback: Llama 3.2 90B Vision
        console.log(`[ANALYZE] Falling back to 90B Vision...`);
        usedFallback = true;
        openRouterRes = await callAI("meta-llama/llama-3.2-90b-vision-instruct");
      }
    } catch (fetchErr) {
      if (fetchErr.name === "AbortError") {
        return NextResponse.json({ error: "Analysis timed out. Try again." }, { status: 504 });
      }
      throw fetchErr;
    }

    if (!openRouterRes.ok) {
      const errText = await openRouterRes.text();
      return NextResponse.json(
        { error: `AI service error (${openRouterRes.status}). Please check your connection or try again.` },
        { status: 502 }
      );
    }

    const data = await openRouterRes.json();
    let aiResponse = data.choices?.[0]?.message?.content?.trim() || "";

    console.log(`[ANALYZE] Raw AI response (${aiResponse.length} chars):`, aiResponse.slice(0, 500));

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
      console.error("[ANALYZE] JSON parse failed:", parseErr.message, "| Raw:", aiResponse.slice(0, 500));
      return NextResponse.json(
        { error: "Could not parse the marks card. Make sure the image is clear and shows subject marks." },
        { status: 422 }
      );
    }

    /* ── Check if invalid document ── */
    if (parsed.error) {
      return NextResponse.json(
        { error: parsed.error || "This does not appear to be a valid marks card." },
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

    console.log(`[ANALYZE] AI extracted ${rawSubjects.length} raw subjects`);

    /* ── Sanitise each subject — apply our own conversion logic ── */
    const subjects = rawSubjects
      .map((s, i) => sanitiseSubject(s, i))
      .filter(Boolean); // remove nulls

    console.log(`[ANALYZE] After sanitisation: ${subjects.length} valid subjects (from ${rawSubjects.length} raw)`);

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
    subjects.forEach(s => console.log(`  → ${s.name}: ${s.percent}%`));

    return NextResponse.json({ success: true, metrics });

  } catch (err) {
    console.error("[ANALYZE_RESULT] Unhandled error:", err);
    return NextResponse.json(
      { error: "Unexpected server error. Please try again." },
      { status: 500 }
    );
  }
}
