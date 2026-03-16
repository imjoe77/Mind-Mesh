import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/auth";
import connectDB from "@/db/connectDB";
import User from "@/app/models/User";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

// Default fallback data used when AI finds no subjects
const DEFAULTS = {
  semester: "Spring 2026",
  gpa: "3.8",
  attendance: "87%",
  subjects: [
    { name: "Algorithms", percent: 88, color: "#4F46E5" },
    { name: "Databases", percent: 74, color: "#7C3AED" },
    { name: "Networks", percent: 91, color: "#4F46E5" },
    { name: "ML Basics", percent: 62, color: "#a78bfa" },
    { name: "OS Design", percent: 79, color: "#6366f1" }
  ],
  upcoming: [
    { subject: "Algorithms", task: "Assignment 5 due", date: "Mar 16" },
    { subject: "Databases", task: "Mid-term exam", date: "Mar 19" },
    { subject: "Networks", task: "Lab submission", date: "Mar 22" }
  ],
  activity: [
    { text: "Submitted Assignment 4 — Algorithms", bold: "Assignment 4", time: "2h ago", color: "#4F46E5" },
    { text: "Attended Networks lecture", bold: "Networks", time: "Yesterday", color: "#16a34a" },
    { text: "Quiz result posted — Databases", bold: "Databases", time: "2 days ago", color: "#f59e0b" },
    { text: "Enrolled in ML Basics elective", bold: "ML Basics", time: "Last week", color: "#7C3AED" }
  ]
};

// Helper: generate activity logs from extracted subjects
function generateActivity(subjects) {
  const colors = { high: "#16a34a", mid: "#f59e0b", low: "#ef4444" };
  return subjects.slice(0, 4).map((s, i) => {
    const perf = s.percent >= 80 ? "high" : s.percent >= 60 ? "mid" : "low";
    const action = s.percent >= 80 ? `Scored ${s.percent}% in ${s.name}` :
                   s.percent >= 60 ? `Needs improvement in ${s.name}` :
                   `Needs urgent review in ${s.name}`;
    const times = ["Just now", "Yesterday", "2 days ago", "Last week"];
    return { text: action, bold: s.name, time: times[i] || "Recently", color: colors[perf] };
  });
}

// Helper: generate upcoming deadlines from subjects
function generateUpcoming(subjects) {
  const tasks = ["Assignment due", "Mid-term exam", "Lab submission", "Quiz scheduled"];
  const today = new Date();
  return subjects.slice(0, 3).map((s, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + 3 + i * 3);
    const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return { subject: s.name, task: tasks[i] || "Review session", date: dateStr };
  });
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { base64Image } = await req.json();
    if (!base64Image) {
      return NextResponse.json({ error: "Missing image" }, { status: 400 });
    }

    if (!process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY === "your_openrouter_key_here") {
      return NextResponse.json({ error: "OpenRouter API Key is missing in .env.local" }, { status: 500 });
    }

    // Simplified prompt — only extract subjects + GPA (much faster)
    const prompt = `Extract subject names and scores from this academic result image.
Return ONLY raw JSON (no markdown). Format:
{"gpa":"8.5","semester":"Sem 3","subjects":[{"name":"Math","percent":85,"color":"#4F46E5"}]}
Rules:
- "subjects" array: each has name, percent (0-100), color (hex)
- Convert letter grades to percent: A+=95,A=90,B+=85,B=80,C+=75,C=70,D=60,F=30
- If no subjects found, return: {"subjects":[]}
- "gpa": extract GPA/SGPA/CGPA as string. If not found, use "N/A"
- "semester": extract semester name. If not found, use "Current Semester"
- Use varied colors: #4F46E5, #7C3AED, #10b981, #f59e0b, #6366f1, #ec4899`;

    console.log(`[AI_ANALYZE] Calling OpenRouter... Payload: ${(base64Image.length / 1024 / 1024).toFixed(2)} MB`);

    // Add a 25-second timeout using AbortController
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    let openRouterRes;
    try {
      openRouterRes = await fetch(OPENROUTER_API_URL, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.NEXT_PUBLIC_URL || "http://localhost:3000",
          "X-Title": "MindMesh Student Dashboard"
        },
        body: JSON.stringify({
          model: "meta-llama/llama-3.2-11b-vision-instruct",
          max_tokens: 500,
          temperature: 0.1,
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                { type: "image_url", image_url: { url: base64Image } }
              ]
            }
          ]
        })
      });
    } catch (fetchErr) {
      clearTimeout(timeout);
      if (fetchErr.name === "AbortError") {
        console.warn("[AI_ANALYZE] Timed out after 25s — using defaults");
        return NextResponse.json({ success: true, metrics: DEFAULTS, timedOut: true });
      }
      throw fetchErr;
    }
    clearTimeout(timeout);

    console.log(`[AI_ANALYZE] OpenRouter status: ${openRouterRes.status}`);

    if (!openRouterRes.ok) {
      const errText = await openRouterRes.text();
      console.error("[AI_ANALYZE] OpenRouter API Failed:", errText);
      // On API failure, return defaults instead of error
      return NextResponse.json({ success: true, metrics: DEFAULTS, fallback: true });
    }

    const data = await openRouterRes.json();
    let aiResponse = data.choices?.[0]?.message?.content?.trim() || "{}";
    
    console.log(`[AI_ANALYZE] Response length: ${aiResponse.length}`);

    let parsedData;
    try {
      // Clean up markdown if the model sent it
      if (aiResponse.startsWith("\`\`\`json")) {
        aiResponse = aiResponse.replace(/^\`\`\`json/,"").replace(/\`\`\`$/,"").trim();
      } else if (aiResponse.startsWith("\`\`\`")) {
        aiResponse = aiResponse.replace(/^\`\`\`/,"").replace(/\`\`\`$/,"").trim();
      }
      
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) aiResponse = jsonMatch[0];

      parsedData = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error("[JSON_PARSE_ERROR] Using defaults. Raw:", aiResponse);
      return NextResponse.json({ success: true, metrics: DEFAULTS, fallback: true });
    }

    // KEY CHECK: Only update if AI found actual subjects
    const hasSubjects = Array.isArray(parsedData.subjects) && parsedData.subjects.length > 0;
    
    if (!hasSubjects) {
      console.log("[AI_ANALYZE] No subjects found in image — using defaults");
      return NextResponse.json({ success: true, metrics: DEFAULTS, fallback: true });
    }

    // AI found subjects — build the full metrics from extracted data
    const metrics = {
      semester: parsedData.semester || "Current Semester",
      gpa: parsedData.gpa || "N/A",
      attendance: parsedData.attendance || "N/A",
      subjects: parsedData.subjects,
      upcoming: generateUpcoming(parsedData.subjects),
      activity: generateActivity(parsedData.subjects),
      lastAnalyzed: new Date()
    };

    await connectDB();
    await User.findByIdAndUpdate(
      session.user.id,
      { $set: { academicMetrics: metrics } }
    );

    console.log(`[AI_ANALYZE] Success — ${metrics.subjects.length} subjects extracted`);
    return NextResponse.json({ success: true, metrics });

  } catch (err) {
    console.error("[ANALYZE_RESULT]", err);
    // On any crash, return defaults so dashboard is never broken
    return NextResponse.json({ success: true, metrics: DEFAULTS, fallback: true });
  }
}
