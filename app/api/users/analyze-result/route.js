import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/auth";
import connectDB from "@/db/connectDB";
import User from "@/app/models/User";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

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

    // Call OpenRouter API with Vision Model 
    const prompt = `
      You are an AI assistant that extracts academic performance data from a university result/report card image and infers action items.
      Analyze the attached image and extract/generate the following:
      1. Semester name (e.g., "Spring 2026", "Semester 3")
      2. GPA / SGPA (string, e.g., "3.8", "8.5")
      3. Attendance percentage (string, e.g., "85%", "90%"). If not found, output "N/A"
      4. An array of "subjects". For each subject:
         - "name": Cleaned up subject name
         - "percent": A number representing the score percentage (0-100). Convert grades logically (e.g., A=90, B=80, etc.)
         - "color": A nice UI hex color code (e.g., "#4F46E5", "#10b981", "#f59e0b") to represent it in UI.
      5. An array of 3 "upcoming" deadlines or tasks. INFER these logically based on the subjects found. Example schema for each:
         - "subject": "Algorithms"
         - "task": "Assignment 2 due" or "Mid-term prep"
         - "date": "Mar 20"
      6. An array of 4 "activity" logs. INFER these based on the extracted grades. Example schema for each:
         - "text": "Scored 90% in Algorithms" or "Needs review in ML Basics"
         - "bold": The subject name
         - "time": "Just now" or "Yesterday"
         - "color": Hex color code matching the subject performance (e.g. green for good, red/orange for bad)

      IMPORTANT: Return ONLY a valid, minified JSON object formatted EXACTLY like this (NO markdown blocks, NO backticks, just raw JSON):
      {
        "semester": "Spring 2026",
        "gpa": "3.8",
        "attendance": "85%",
        "subjects": [ { "name": "Algorithms", "percent": 88, "color": "#4F46E5" } ],
        "upcoming": [ { "subject": "Algorithms", "task": "Mid-term exam", "date": "Mar 19" } ],
        "activity": [ { "text": "Result analyzed for Algorithms", "bold": "Algorithms", "time": "Just now", "color": "#4F46E5" } ]
      }
    `;

    console.log(`[AI_ANALYZE] Calling OpenRouter (Llama 3.2 Vision)... Payload size: ${(base64Image.length / 1024 / 1024).toFixed(2)} MB`);

    const openRouterRes = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_URL || "http://localhost:3000",
        "X-Title": "MindMesh Student Dashboard"
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.2-11b-vision-instruct",
        max_tokens: 1000,
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

    console.log(`[AI_ANALYZE] OpenRouter status: ${openRouterRes.status}`);

    if (!openRouterRes.ok) {
        const errText = await openRouterRes.text();
        console.error("[AI_ANALYZE] OpenRouter API Failed:", errText);
        return NextResponse.json({ error: "Failed to analyze image with AI", details: errText }, { status: 502 });
    }

    const data = await openRouterRes.json();
    let aiResponse = data.choices?.[0]?.message?.content?.trim() || "{}";
    
    console.log(`[AI_ANALYZE] Received response length: ${aiResponse.length}`);

    let parsedData;
    try {
        // Try direct parse first
        // Clean up markdown quotes if the model sent them despite instructions
        if (aiResponse.startsWith("\`\`\`json")) {
            aiResponse = aiResponse.replace(/^\`\`\`json/,"").replace(/\`\`\`$/,"").trim();
        } else if (aiResponse.startsWith("\`\`\`")) {
            aiResponse = aiResponse.replace(/^\`\`\`/,"").replace(/\`\`\`$/,"").trim();
        }
        
        // If there's still extra text, try to extract just the JSON block
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            aiResponse = jsonMatch[0];
        }

        parsedData = JSON.parse(aiResponse);
    } catch (parseError) {
        console.error("[JSON_PARSE_ERROR] Failed to parse AI response:", aiResponse);
        return NextResponse.json({ error: "AI returned invalid format", details: aiResponse }, { status: 500 });
    }

    await connectDB();
    const updatedUser = await User.findByIdAndUpdate(
        session.user.id,
        {
            $set: {
                "academicMetrics.semester": parsedData.semester || "Current Semester",
                "academicMetrics.gpa": parsedData.gpa || "N/A",
                "academicMetrics.attendance": parsedData.attendance || "N/A",
                "academicMetrics.subjects": parsedData.subjects || [],
                "academicMetrics.upcoming": parsedData.upcoming || [],
                "academicMetrics.activity": parsedData.activity || [],
                "academicMetrics.lastAnalyzed": new Date()
            }
        },
        { returnDocument: "after" }
    ).select("academicMetrics");

    return NextResponse.json({ 
      success: true, 
      metrics: updatedUser.academicMetrics 
    });

  } catch (err) {
    console.error("[ANALYZE_RESULT]", err);
    return NextResponse.json({ error: "Internal server error or invalid JSON from AI" }, { status: 500 });
  }
}
