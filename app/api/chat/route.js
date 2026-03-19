import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/auth";
import connectDB from "@/db/connectDB";
import User from "@/app/models/User";
import Group from "@/app/models/Group";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { message, history, pdfContext, imageContext, pdfBase64, mimeType, isMittar, pathname } = await req.json();

    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json({ error: "OpenRouter API Key not set" }, { status: 500 });
    }

    await connectDB();
    const user = await User.findById(session.user.id).lean();

    let messages = [];
    let systemPrompt = "You are MindMesh AI, a helpful study assistant. Answer concisely and helpfully.";
    
    // ── Decide Model (Gemini for PDF, Llama for General) ──
    const isDocumentMode = !!(pdfBase64 || pdfContext);
    const model = isDocumentMode ? "google/gemini-flash-1.5" : "meta-llama/llama-3.1-8b-instruct";

    // ── 1. PDF / Document Analysis (Gemini Mode) ──
    if (isDocumentMode) {
      const content = [];
      if (pdfBase64) {
        content.push({
          type: "image_url", // Gemini handles PDFs via image_url blocks on OpenRouter
          image_url: { url: `data:${mimeType || "application/pdf"};base64,${pdfBase64}` }
        });
      }
      content.push({ type: "text", text: message + (pdfContext ? `\n\nDocument Content:\n${pdfContext}` : "") });

      messages = [
        {
          role: "system",
          content: "You are an expert document analyst. Use the provided document to answer questions accurately and concisely."
        },
        ...(history || []),
        { role: "user", content }
      ];
    }
    // ── 2. Mittar (Llama Mode) ──
    else if (isMittar) {
      let pageContext = "";
      let databaseContext = "";

      const paths = {
        "/Home": "Home",
        "/About": "About",
        "/SDash": "Dashboard",
        "/groups": "Groups",
        "/discover": "Discover",
        "/profile": "Profile"
      };
      
      const currentPath = Object.keys(paths).find(p => pathname.startsWith(p)) || "Study Room";
      pageContext = `Location: ${pathname} (${currentPath}).`;
      
      const userContext = `User Info: ${user.name} (${user.email}). 
      Academic Progress: GPA ${user.academicMetrics?.gpa || 'N/A'}, Attendance ${user.academicMetrics?.attendance || 'N/A'}.
      Joined: ${new Date(user.createdAt).toLocaleDateString()}.`;

      systemPrompt = `You are Mittar, the MindMesh Personal AI Assistant. Your goal is to help the user navigate the platform and manage their study life.
Current Time: ${new Date().toLocaleString()}
${pageContext}
${userContext}

YOU MUST USE THE FOLLOWING ACTION TAGS WHEN RELEVANT:
1. NAVIGATION: To move the user to a specific page, append "[NAVIGATE:path]" at the end of your message. 
   Supported Paths: /Home, /About, /SDash, /groups, /discover, /profile.
   Example: "Sure! Let's go to your profile. [NAVIGATE:/profile]"

2. CREATE GROUP: To create a study group, append "[CREATE_GROUP:{"name": "...", "subject": "...", "description": "...", "date": "...", "startTime": "...", "endTime": "..."}]".
   Only name and subject are REQUIRED. If other details aren't provided, I will use defaults.
   Example: "Great idea! I'll create a Math Study group for you. [CREATE_GROUP:{"name": "Math Hub", "subject": "Mathematics"}]"
   Example with all: "Okay! Creating your group. [CREATE_GROUP:{"name": "Finals Prep", "subject": "Science", "description": "Review for exam.", "date": "2024-12-01", "startTime": "10:00", "endTime": "12:00"}]"

Be friendly, proactive, and always try to guide the user using navigation tags if they seem lost.`;

      messages = [
        { role: "system", content: systemPrompt },
        ...(history?.slice(-8) || []),
        { role: "user", content: message }
      ];
    }
    // ── 3. Default General Chat ──
    else {
      messages = [
        { role: "system", content: systemPrompt },
        ...(history?.slice(-8) || []),
        { role: "user", content: message }
      ];
    }

    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_URL || "http://localhost:3000",
        "X-Title": "MindMesh"
      },
      body: JSON.stringify({
        model,
        max_tokens: 1000,
        temperature: 0.4,
        messages
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json({ reply: "AI Error: " + (errorData.error?.message || "Check OpenRouter balance") }, { status: response.status });
    }

    const data = await response.json();
    let reply = data?.choices?.[0]?.message?.content || "No response.";

    // ── Auto-Actions (Llama only usually) ──
    if (isMittar && reply.includes("[CREATE_GROUP:")) {
      try {
        const jsonMatch = reply.match(/\[CREATE_GROUP:(.*?)\]/s);
        if (jsonMatch?.[1]) {
          const g = JSON.parse(jsonMatch[1]);
          if (g.name && g.subject) {
             const now = new Date();
             const defaultStartTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
             const defaultEndTime = new Date(now.getTime() + 2 * 60 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

             const newG = await Group.create({
               name: g.name, 
               subject: g.subject, 
               description: g.description || `Study group for ${g.subject}`,
               owner: session.user.id,
               members: [session.user.id],
               sessions: [{ 
                 date: new Date(g.date || Date.now()), 
                 startTime: g.startTime || defaultStartTime, 
                 endTime: g.endTime || defaultEndTime 
               }]
             });
             reply = `Successfully created your study group "${g.name}"! I'm taking you there now. 🚀 [NAVIGATE:/groups/${newG._id}]`;
          }
        }
      } catch (e) { 
        console.error("Mittar Group Creation Error:", e);
        reply += "\n\n(I tried to create the group but encountered an error. Please try again with more details!)";
      }
    }

    return NextResponse.json({ reply });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ reply: "Server error." }, { status: 500 });
  }
}
